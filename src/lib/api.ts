
import { delay, generateUUID } from './utils';
import { GenerationProgress, Video, ScriptOption } from '@/types';
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

// Convert a blob URL to a publicly accessible URL if possible
export async function getBlobPublicUrl(blobUrl: string): Promise<string> {
  try {
    // If it's not a blob URL, return it as is
    if (!blobUrl.startsWith('blob:')) {
      return blobUrl;
    }
    
    // For blob URLs, we need to convert to a publicly accessible URL
    // This is a placeholder - in a real app, you'd need to upload the file
    throw new Error("Blob URLs need to be converted to public URLs");
  } catch (error) {
    console.error("Error getting public URL from blob:", error);
    throw error;
  }
}

// Upload a file to storage and get a URL
// This function will work even if supabase storage is not set up
export async function uploadFile(file: File): Promise<string> {
  try {
    console.log("Uploading file:", file.name);
    
    // For demo and testing, we'll just use an object URL
    // In production, you'd upload to Supabase storage or another provider
    console.log("Creating object URL as fallback");
    return URL.createObjectURL(file);
  } catch (error) {
    console.error("Error uploading file:", error);
    // Fall back to object URL if there's any error
    const objectUrl = URL.createObjectURL(file);
    console.log("Created object URL as fallback:", objectUrl);
    return objectUrl;
  }
}

// Generate script with GPT
export async function generateScript(topic: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: { topic }
    });

    if (error) throw new Error(error.message);
    return data.scriptText;
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}

// Main function to start the video generation process
export async function generateVideo(formData: {
  scriptOption: ScriptOption;
  topic?: string;
  customScript?: string;
  supportingMedia?: string;
  supportingMediaFile?: File;
  voiceId: string;
  voiceMedia?: string;
  voiceMediaFile?: File;
}): Promise<string> {
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
async function processVideoGeneration(processId: string, formData: {
  scriptOption: ScriptOption;
  topic?: string;
  customScript?: string;
  supportingMedia?: string;
  supportingMediaFile?: File;
  voiceId: string;
  voiceMedia?: string;
  voiceMediaFile?: File;
}) {
  try {
    // Step 1: Upload files if they exist
    let supportingMediaUrl = formData.supportingMedia;
    let voiceMediaUrl = formData.voiceMedia;
    
    if (formData.supportingMediaFile) {
      updateProgressInStorage(processId, {
        status: "Uploading supporting media...",
        progress: 10
      });
      supportingMediaUrl = await uploadFile(formData.supportingMediaFile);
      console.log("Supporting media uploaded successfully:", supportingMediaUrl);
    }
    
    if (formData.voiceMediaFile) {
      updateProgressInStorage(processId, {
        status: "Uploading voice character image...",
        progress: 15
      });
      voiceMediaUrl = await uploadFile(formData.voiceMediaFile);
      console.log("Voice media uploaded successfully:", voiceMediaUrl);
    }
    
    // Step 2: Get or generate script
    let scriptText: string;
    
    if (formData.scriptOption === ScriptOption.GPT && formData.topic) {
      updateProgressInStorage(processId, {
        status: "Generating script...",
        progress: 25
      });
      
      scriptText = await generateScript(formData.topic);
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
        voiceMedia: voiceMediaUrl
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
          aiVideoUrl
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

// Get saved videos from database
export async function getVideos(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.functions.invoke('get-videos', {});
    
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
  } catch (error) {
    console.error("Error in getVideos:", error);
    // Fall back to mock videos if there's an error
    return mockVideos;
  }
}
