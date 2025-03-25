
import { delay, generateUUID } from './utils';
import { GenerationProgress, Video, ScriptOption, VideoGenerationOptions } from '@/types';
import { mockVideos } from '@/data/mockData';
import { supabase } from "@/integrations/supabase/client";

// We'll use localStorage to store progress for demo purposes
const getProgressFromStorage = (processId: string): GenerationProgress | null => {
  const stored = localStorage.getItem(`progress_${processId}`);
  return stored ? JSON.parse(stored) : null;
};

const updateProgressInStorage = (processId: string, progress: Partial<GenerationProgress>) => {
  const current = getProgressFromStorage(processId) || {
    progress: 0,
    status: "Starting...",
  };
  const updated = { ...current, ...progress };
  localStorage.setItem(`progress_${processId}`, JSON.stringify(updated));
  return updated;
};

// Upload a file to storage and get a URL
export async function uploadFile(file: File): Promise<string> {
  try {
    console.log("Uploading file:", file.name);
    
    // Check if the file already has a publicUrl (from previous upload)
    if ('publicUrl' in file) {
      // @ts-ignore - custom property we added
      return file.publicUrl;
    }
    
    // Generate a unique file name based on the original name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Try to upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);
    
    console.log("Uploaded to Supabase, public URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    // Fall back to object URL as last resort
    return URL.createObjectURL(file);
  }
}

// Generate script with GPT
export async function generateScript(topic: string, searchWeb: boolean = true): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: { topic, searchWeb: true }
    });

    if (error) throw new Error(error.message);
    return data.scriptText;
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}

// Translate script to another language
export async function translateScript(script: string, targetLanguage: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: { scriptToTranslate: script, targetLanguage }
    });

    if (error) throw new Error(error.message);
    return data.scriptText;
  } catch (error) {
    console.error('Error translating script:', error);
    throw error;
  }
}

// Main function to start the video generation process
export async function generateVideo(formData: VideoGenerationOptions): Promise<string> {
  const processId = generateUUID();
  
  // Initialize progress in localStorage
  updateProgressInStorage(processId, {
    progress: 0,
    status: "Starting...",
    voiceId: formData.voiceId,
    voiceMedia: formData.voiceMedia
  });
  
  // Start the process in the background
  setTimeout(() => processVideoGeneration(processId, formData), 0);
  
  return processId;
}

// Background process to generate the video
async function processVideoGeneration(processId: string, formData: VideoGenerationOptions) {
  try {
    // Get current user ID
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    // Track uploaded files to clean up later
    const filesToCleanup: string[] = [];
    
    // Step 1: Upload files if they exist
    let supportingMediaUrl = formData.supportingMedia;
    let voiceMediaUrl = formData.voiceMedia;
    
    if (formData.supportingMediaFile) {
      updateProgressInStorage(processId, {
        status: "Uploading supporting media...",
        progress: 10
      });
      
      // Check if the file already has a publicUrl from previous upload
      if ('publicUrl' in formData.supportingMediaFile) {
        // @ts-ignore - this property was added during file upload
        supportingMediaUrl = formData.supportingMediaFile.publicUrl;
        console.log("Using existing public URL for supporting media:", supportingMediaUrl);
      } else {
        // Upload the supporting media file
        supportingMediaUrl = await uploadFile(formData.supportingMediaFile);
        if (!supportingMediaUrl.startsWith('blob:')) {
          filesToCleanup.push(supportingMediaUrl);
        }
        console.log("Supporting media uploaded successfully:", supportingMediaUrl);
      }
    }
    
    if (formData.voiceMediaFile) {
      updateProgressInStorage(processId, {
        status: "Uploading voice character image...",
        progress: 15
      });
      
      // Check if the file already has a publicUrl from previous upload
      if ('publicUrl' in formData.voiceMediaFile) {
        // @ts-ignore - this property was added during file upload
        voiceMediaUrl = formData.voiceMediaFile.publicUrl;
        console.log("Using existing public URL for voice media:", voiceMediaUrl);
      } else {
        // Upload the voice media file
        voiceMediaUrl = await uploadFile(formData.voiceMediaFile);
        if (!voiceMediaUrl.startsWith('blob:')) {
          filesToCleanup.push(voiceMediaUrl);
        }
        console.log("Voice media uploaded successfully:", voiceMediaUrl);
      }
    }
    
    updateProgressInStorage(processId, { 
      supportingMediaUrl,
      voiceMedia: voiceMediaUrl
    });
    
    // Step 2: Get or generate script
    let scriptText: string;
    
    if (formData.scriptOption === ScriptOption.GPT && formData.topic) {
      updateProgressInStorage(processId, {
        status: "Generating script...",
        progress: 25
      });
      
      // Always search the web for GPT-generated scripts
      scriptText = await generateScript(formData.topic, true);
    } else if (formData.scriptOption === ScriptOption.CUSTOM && formData.customScript) {
      updateProgressInStorage(processId, {
        status: "Using custom script...",
        progress: 25
      });
      
      scriptText = formData.customScript;
    } else {
      throw new Error("Invalid script option or missing required data");
    }
    
    updateProgressInStorage(processId, { scriptText });
    
    // Step 3: Generate AI video
    updateProgressInStorage(processId, {
      status: "Generating AI video...",
      progress: 50
    });
    
    // Start AI video generation
    const { data: startData, error: startError } = await supabase.functions.invoke('generate-ai-video', {
      body: {
        script: scriptText,
        voiceId: formData.voiceId,
        voiceMedia: voiceMediaUrl,
        highResolution: formData.highResolution
      }
    });
    
    if (startError) throw new Error(`Error starting AI video: ${startError.message}`);
    
    const jobId = startData.jobId;
    
    // Poll for AI video status
    let aiVideoUrl: string | null = null;
    while (!aiVideoUrl) {
      // Wait a bit before checking status
      await delay(5000);
      
      const { data: statusData, error: statusError } = await supabase.functions.invoke('check-ai-video-status', {
        body: { jobId }
      });
      
      if (statusError) throw new Error(`Error checking AI video status: ${statusError.message}`);
      
      if (statusData.completed) {
        aiVideoUrl = statusData.videoUrl;
      } else {
        console.log(`AI video status: ${statusData.status}`);
      }
    }
    
    updateProgressInStorage(processId, { 
      aiVideoUrl,
      status: "Creating final video...",
      progress: 75
    });
    
    // Step 4: Create final video with Creatomate
    const { data: renderData, error: renderError } = await supabase.functions.invoke('create-final-video', {
      body: {
        aiVideoUrl,
        supportingVideo: supportingMediaUrl
      }
    });
    
    if (renderError) throw new Error(`Error creating final video: ${renderError.message}`);
    
    const renderId = renderData.renderId;
    
    // Poll for final video status
    let finalVideoUrl: string | null = null;
    while (!finalVideoUrl) {
      // Wait a bit before checking status
      await delay(5000);
      
      const { data: finalStatusData, error: finalStatusError } = await supabase.functions.invoke('check-final-video-status', {
        body: { 
          renderId,
          scriptText,
          aiVideoUrl,
          userId // Pass the user ID for saving the video
        }
      });
      
      if (finalStatusError) throw new Error(`Error checking final video status: ${finalStatusError.message}`);
      
      if (finalStatusData.completed) {
        finalVideoUrl = finalStatusData.url;
      } else {
        console.log(`Final video status: ${finalStatusData.status}`);
      }
    }
    
    // Step 5: Complete the process
    updateProgressInStorage(processId, {
      finalVideoUrl,
      progress: 100,
      status: "Complete!"
    });
    
    // Step 6: Clean up uploaded files
    if (filesToCleanup.length > 0) {
      try {
        await supabase.functions.invoke('cleanup-files', {
          body: { filePaths: filesToCleanup }
        });
        console.log("Cleaned up temporary files:", filesToCleanup);
      } catch (cleanupError) {
        console.error("Error cleaning up files (non-fatal):", cleanupError);
      }
    }
    
  } catch (error) {
    console.error("Error in video generation process:", error);
    updateProgressInStorage(processId, {
      status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      progress: 100
    });
  }
}

// Check progress of video generation
export async function checkProgress(processId: string): Promise<GenerationProgress> {
  const progress = getProgressFromStorage(processId);
  
  if (!progress) {
    throw new Error("Process not found");
  }
  
  return progress;
}

// Get saved videos from database - now filtered by user ID
export async function getVideos(): Promise<Video[]> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting current user:", userError);
      // Fall back to mock videos if there's an error
      return mockVideos;
    }
    
    const userId = userData?.user?.id;
    
    // If we have a user ID, fetch their videos
    if (userId) {
      const { data, error } = await supabase.functions.invoke('get-videos', {
        body: { userId }
      });
      
      if (error) {
        console.error("Error fetching videos:", error);
        // Fall back to mock videos if there's an error
        return mockVideos;
      }
      
      return data.videos.map((video: any) => ({
        id: video.id,
        finalVideoUrl: video.final_video_url,
        scriptText: video.script_text,
        timestamp: new Date(video.timestamp).getTime()
      }));
    } else {
      // No user ID, return empty array
      return [];
    }
  } catch (error) {
    console.error("Error in getVideos:", error);
    // Fall back to mock videos if there's an error
    return mockVideos;
  }
}

export const generateImprovedScript = async (script: string): Promise<string> => {
  try {
    // Call the Supabase Edge Function to improve the script using AI
    const { data, error } = await supabase.functions.invoke('generate-improved-script', {
      body: { script }
    });

    if (error) {
      throw new Error(`Failed to improve script: ${error.message}`);
    }

    return data?.improvedScript || script; // Return the improved script or the original if something went wrong
  } catch (error) {
    console.error("Error improving script:", error);
    throw error;
  }
}
