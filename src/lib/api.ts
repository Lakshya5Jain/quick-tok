import { delay, generateUUID } from './utils';
import { GenerationProgress, Video, ScriptOption } from '@/types';
import { mockVideos } from '@/data/mockData';
import { supabase } from "@/integrations/supabase/client";

// Define an extended File interface to include our custom publicUrl property
interface FileWithPublicUrl extends File {
  publicUrl?: string;
}

const getProgressFromStorage = (processId: string): GenerationProgress | null => {
  try {
    const stored = localStorage.getItem(`progress_${processId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error reading progress from storage:", error);
    return null;
  }
};

const updateProgressInStorage = (processId: string, progress: Partial<GenerationProgress>) => {
  try {
    const current = getProgressFromStorage(processId) || {
      progress: 0,
      status: "Starting...",
      processId: processId,
    };
    const updated = { ...current, ...progress };
    localStorage.setItem(`progress_${processId}`, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error updating progress in storage:", error);
    return progress;
  }
};

// Function to mark a video generation process as canceled
export function cancelVideoGeneration(processId: string): boolean {
  try {
    // Set a cancellation flag in localStorage
    localStorage.setItem(`canceled_${processId}`, 'true');
    
    // Update the progress status to indicate cancellation
    updateProgressInStorage(processId, {
      status: "Canceled by user",
      progress: 100
    });
    
    console.log(`Video generation process ${processId} has been marked as canceled`);
    return true;
  } catch (error) {
    console.error(`Failed to cancel video generation process ${processId}:`, error);
    return false;
  }
}

// Helper to check if a process has been canceled
const isProcessCanceled = (processId: string): boolean => {
  return localStorage.getItem(`canceled_${processId}`) === 'true';
};

export async function uploadFile(file: File): Promise<string> {
  try {
    console.log("Uploading file:", file.name);
    
    // Type assertion to our extended interface
    const fileWithUrl = file as FileWithPublicUrl;
    
    if (fileWithUrl.publicUrl) {
      return fileWithUrl.publicUrl;
    }
    
    const fileExt = file.name.split('.').pop();
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const fileName = `${uniqueId}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // First, create the uploads bucket if it doesn't exist
    try {
      const { data: bucketData, error: bucketError } = await supabase.storage
        .getBucket('uploads');
        
      if (bucketError && bucketError.message.includes('not found')) {
        // Create the bucket if it doesn't exist
        const { error: createError } = await supabase.storage
          .createBucket('uploads', {
            public: true
          });
          
        if (createError) {
          console.error("Error creating uploads bucket:", createError);
          throw createError;
        }
      }
    } catch (bucketCheckError) {
      console.error("Error checking uploads bucket:", bucketCheckError);
      // Continue anyway, the upload might still work
    }
    
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading to Supabase:", error);
      throw error;
    }
    
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);
    
    console.log("Uploaded to Supabase, public URL:", publicUrlData.publicUrl);
    
    // Set the URL on our extended file object
    fileWithUrl.publicUrl = publicUrlData.publicUrl;
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    const objectUrl = URL.createObjectURL(file);
    // Type assertion to our extended interface
    (file as FileWithPublicUrl).publicUrl = objectUrl;
    return objectUrl;
  }
}

export async function generateScript(topic: string, vibes: string, language: string): Promise<string> {
  try {
    console.log("Generating script for topic:", topic);
    console.log("With vibes:", vibes, "and language:", language);
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: { topic, vibes, language }
    });

    if (error) {
      console.error("Error from generate-script function:", error);
      throw new Error(error.message);
    }
    
    console.log("Script generation successful");
    return data.scriptText;
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}

export async function generateVideo(formData: {
  scriptOption: ScriptOption;
  topic?: string;
  customScript?: string;
  supportingMedia?: string;
  supportingMediaFile?: File;
  voiceId: string;
  voiceMedia?: string;
  voiceMediaFile?: File;
  highResolution?: boolean;
  vibes: string;
  language: string;
}): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Estimate script and cost based on word count (120 words = 60s = 100 credits)
    let scriptText: string;
    if (formData.scriptOption === ScriptOption.GPT && formData.topic) {
      scriptText = await generateScript(formData.topic, formData.vibes, formData.language);
    } else if (formData.scriptOption === ScriptOption.CUSTOM && formData.customScript) {
      scriptText = formData.customScript;
    } else {
      throw new Error("Invalid script option or missing data");
    }
    const wordCount = scriptText.trim().split(/\s+/).length;
    const estimatedSeconds = Math.ceil((wordCount / 120) * 60);
    const cost = Math.ceil((estimatedSeconds / 60) * 100);

    // Check if the user has enough credits
    const { data: hasSufficient, error: creditsError } = await supabase.rpc(
      'has_sufficient_credits',
      { user_uuid: user.id, required_credits: cost }
    );
    if (creditsError) {
      console.error("Error checking credits:", creditsError);
      throw new Error("Could not verify credit balance");
    }
    if (!hasSufficient) {
      throw new Error(`Insufficient credits. You need ${cost} credits to generate this video.`);
    }

    // Now proceed with video generation
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const processId = `process_${timestamp}_${randomStr}`;
    
    console.log("Starting new video generation process with ID:", processId);
    
    // Include scriptText in progress storage for potential client use
    updateProgressInStorage(processId, {
      progress: 0,
      status: "Starting...",
      voiceId: formData.voiceId,
      voiceMedia: formData.voiceMedia,
      processId: processId,
      scriptText
    });
    
    // Start the background process, passing along scriptText
    setTimeout(() => processVideoGeneration(processId, { ...formData, highResolution: true, scriptText }), 0);

    return processId;
  } catch (error) {
    console.error("Error in generateVideo:", error);
    throw error;
  }
}

async function processVideoGeneration(processId: string, formData: {
  scriptOption: ScriptOption;
  topic?: string;
  customScript?: string;
  supportingMedia?: string;
  supportingMediaFile?: File;
  voiceId: string;
  voiceMedia?: string;
  voiceMediaFile?: File;
  highResolution?: boolean;
  scriptText: string;
  vibes: string;
  language: string;
}) {
  try {
    const filesToCleanup: string[] = [];
    
    // Check if the process was canceled before we even start
    if (isProcessCanceled(processId)) {
      console.log(`Process ${processId} was canceled before starting`);
      return;
    }
    
    let supportingMediaUrl = formData.supportingMedia;
    let voiceMediaUrl = formData.voiceMedia;
    
    if (formData.supportingMediaFile) {
      updateProgressInStorage(processId, {
        status: "Uploading supporting media...",
        progress: 10
      });
      
      try {
        // Use our extended interface for type safety
        const fileWithUrl = formData.supportingMediaFile as FileWithPublicUrl;
        
        if (fileWithUrl.publicUrl) {
          supportingMediaUrl = fileWithUrl.publicUrl;
          console.log("Using existing public URL for supporting media:", supportingMediaUrl);
        } else {
          supportingMediaUrl = await uploadFile(formData.supportingMediaFile);
          if (supportingMediaUrl && !supportingMediaUrl.startsWith('blob:')) {
            filesToCleanup.push(supportingMediaUrl);
          }
          console.log("Supporting media uploaded successfully:", supportingMediaUrl);
        }
      } catch (uploadError) {
        console.error("Error uploading supporting media:", uploadError);
      }
    }
    
    if (formData.voiceMediaFile) {
      updateProgressInStorage(processId, {
        status: "Uploading voice character image...",
        progress: 15
      });
      
      try {
        // Use our extended interface for type safety
        const fileWithUrl = formData.voiceMediaFile as FileWithPublicUrl;
        
        if (fileWithUrl.publicUrl) {
          voiceMediaUrl = fileWithUrl.publicUrl;
          console.log("Using existing public URL for voice media:", voiceMediaUrl);
        } else {
          voiceMediaUrl = await uploadFile(formData.voiceMediaFile);
          if (voiceMediaUrl && !voiceMediaUrl.startsWith('blob:')) {
            filesToCleanup.push(voiceMediaUrl);
          }
          console.log("Voice media uploaded successfully:", voiceMediaUrl);
        }
      } catch (uploadError) {
        console.error("Error uploading voice media:", uploadError);
      }
    }
    
    // Check for cancellation after file uploads
    if (isProcessCanceled(processId)) {
      console.log(`Process ${processId} was canceled after file uploads`);
      return;
    }
    
    updateProgressInStorage(processId, { 
      supportingMediaUrl,
      voiceMedia: voiceMediaUrl
    });
    
    updateProgressInStorage(processId, { scriptText: formData.scriptText });
    
    updateProgressInStorage(processId, {
      status: "Generating AI video...",
      progress: 50
    });
    
    // Check for cancellation before starting AI generation
    if (isProcessCanceled(processId)) {
      console.log(`Process ${processId} was canceled before AI generation`);
      return;
    }
    
    const { data: startData, error: startError } = await supabase.functions.invoke('generate-ai-video', {
      body: {
        script: formData.scriptText,
        voiceId: formData.voiceId,
        voiceMedia: voiceMediaUrl,
        highResolution: true,
        processId
      }
    });
    
    if (startError) {
      console.error("Error starting AI video:", startError);
      throw new Error(`Error starting AI video: ${startError.message}`);
    }
    
    if (!startData || !startData.jobId) {
      console.error("No job ID returned:", startData);
      throw new Error("Failed to start AI video generation: No job ID returned");
    }
    
    const jobId = startData.jobId;
    console.log("AI video generation started with job ID:", jobId);
    
    let aiVideoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (!aiVideoUrl && attempts < maxAttempts) {
      await delay(5000);
      attempts++;
      
      // Check for cancellation during AI video generation polling
      if (isProcessCanceled(processId)) {
        console.log(`Process ${processId} was canceled during AI video generation`);
        return;
      }
      
      try {
        const { data: statusData, error: statusError } = await supabase.functions.invoke('check-ai-video-status', {
          body: { jobId, processId }
        });
        
        if (statusError) {
          console.error(`Error checking AI video status (attempt ${attempts}):`, statusError);
          continue;
        }
        
        if (statusData.completed) {
          aiVideoUrl = statusData.videoUrl;
          console.log("AI video completed:", aiVideoUrl);
        } else {
          console.log(`AI video status (attempt ${attempts}): ${statusData.status}`);
          updateProgressInStorage(processId, {
            status: `AI video processing: ${statusData.status}...`,
          });
        }
      } catch (pollError) {
        console.error(`Error polling AI video status (attempt ${attempts}):`, pollError);
      }
    }
    
    if (!aiVideoUrl) {
      throw new Error("AI video generation timed out after multiple attempts");
    }
    
    updateProgressInStorage(processId, { 
      aiVideoUrl,
      status: "Creating final video...",
      progress: 75
    });
    
    // Check for cancellation before final video creation
    if (isProcessCanceled(processId)) {
      console.log(`Process ${processId} was canceled before final video creation`);
      return;
    }
    
    const { data: renderData, error: renderError } = await supabase.functions.invoke('create-final-video', {
      body: {
        aiVideoUrl,
        supportingVideo: supportingMediaUrl,
        processId
      }
    });
    
    if (renderError) {
      console.error("Error creating final video:", renderError);
      throw new Error(`Error creating final video: ${renderError.message}`);
    }
    
    if (!renderData || !renderData.renderId) {
      console.error("No render ID returned:", renderData);
      throw new Error("Failed to start final video rendering: No render ID returned");
    }
    
    const renderId = renderData.renderId;
    console.log("Final video render started with ID:", renderId);
    
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    let finalVideoUrl: string | null = null;
    attempts = 0;
    
    while (!finalVideoUrl && attempts < maxAttempts) {
      await delay(5000);
      attempts++;
      
      // Check for cancellation during final video generation polling
      if (isProcessCanceled(processId)) {
        console.log(`Process ${processId} was canceled during final video generation`);
        return;
      }
      
      try {
        const { data: finalStatusData, error: finalStatusError } = await supabase.functions.invoke('check-final-video-status', {
          body: { 
            renderId,
            scriptText: formData.scriptText,
            aiVideoUrl,
            userId,
            processId
          }
        });
        
        if (finalStatusError) {
          // If we get a 402 error and the video is not completed, continue polling
          if (finalStatusError.status === 402 && !finalStatusData?.completed) {
            console.log(`Insufficient credits check (attempt ${attempts}). Video still rendering...`);
            continue;
          }
          console.error(`Error checking final video status (attempt ${attempts}):`, finalStatusError);
          continue;
        }
        
        if (finalStatusData.completed) {
          finalVideoUrl = finalStatusData.url;
          console.log("Final video completed:", finalVideoUrl);
        } else {
          console.log(`Final video status (attempt ${attempts}): ${finalStatusData.status}`);
          updateProgressInStorage(processId, {
            status: `Final video processing: ${finalStatusData.status}...`,
          });
        }
      } catch (pollError) {
        console.error(`Error polling final video status (attempt ${attempts}):`, pollError);
      }
    }
    
    if (!finalVideoUrl) {
      throw new Error("Final video generation timed out after multiple attempts");
    }
    
    updateProgressInStorage(processId, {
      finalVideoUrl,
      progress: 100,
      status: "Complete!"
    });
    
    if (filesToCleanup.length > 0) {
      try {
        await supabase.functions.invoke('cleanup-files', {
          body: { filePaths: filesToCleanup, processId }
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

export async function checkProgress(processId: string): Promise<GenerationProgress> {
  const progress = getProgressFromStorage(processId);
  
  if (!progress) {
    throw new Error("Process not found");
  }
  
  return progress;
}

export async function getVideos(): Promise<Video[]> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Auth error when fetching videos:", userError);
      throw new Error("Authentication error. Please try again.");
    }
    
    const userId = user?.id;
    
    if (!userId) {
      console.warn("No user ID found");
      throw new Error("Please sign in to view your videos.");
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('get-videos', {
        body: { userId }
      });
      
      if (error) {
        console.error("Error fetching videos from Supabase function:", error);
        throw new Error("Failed to fetch videos. Please try again.");
      }
      
      if (!data || !data.videos || !Array.isArray(data.videos)) {
        console.error("Invalid response format from get-videos function");
        throw new Error("Invalid server response. Please try again.");
      }
      
      return data.videos.map((video: any) => ({
        id: video.id || generateUUID(),
        finalVideoUrl: video.final_video_url,
        scriptText: video.script_text || "No script text available",
        timestamp: video.timestamp ? new Date(video.timestamp).getTime() : Date.now()
      }));
    } catch (funcError) {
      console.error("Exception when calling Supabase function:", funcError);
      throw funcError instanceof Error ? funcError : new Error("Failed to fetch videos. Please try again.");
    }
  } catch (error) {
    console.error("Error in getVideos:", error);
    throw error instanceof Error ? error : new Error("An unexpected error occurred.");
  }
}
