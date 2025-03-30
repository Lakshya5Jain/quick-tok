
// Define an extended File interface to include our custom publicUrl property
interface FileWithPublicUrl extends File {
  publicUrl?: string;
}

import { delay, generateUUID } from './utils';
import { GenerationProgress, Video, ScriptOption } from '@/types';
import { mockVideos } from '@/data/mockData';
import { supabase } from "@/integrations/supabase/client";

// Storage functions for managing process state
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
    };
    const updated = { ...current, ...progress };
    localStorage.setItem(`progress_${processId}`, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Error updating progress in storage:", error);
    return progress;
  }
};

// Upload file function with better type handling
export async function uploadFile(file: File): Promise<string> {
  try {
    console.log("Uploading file:", file.name);
    
    // Type assertion to our extended interface
    const fileWithUrl = file as FileWithPublicUrl;
    
    if (fileWithUrl.publicUrl) {
      return fileWithUrl.publicUrl;
    }
    
    const fileExt = file.name.split('.').pop() || '';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const fileName = `${uniqueId}.${fileExt}`;
    const filePath = `${fileName}`;
    
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
    
    if (publicUrlData && publicUrlData.publicUrl) {
      console.log("Uploaded to Supabase, public URL:", publicUrlData.publicUrl);
      
      // Set the URL on our extended file object
      fileWithUrl.publicUrl = publicUrlData.publicUrl;
      
      return publicUrlData.publicUrl;
    } else {
      throw new Error("Failed to get public URL");
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    const objectUrl = URL.createObjectURL(file);
    // Type assertion to our extended interface
    (file as FileWithPublicUrl).publicUrl = objectUrl;
    return objectUrl;
  }
}

// Script generation with improved error handling
export async function generateScript(topic: string): Promise<string> {
  try {
    console.log("Generating script for topic:", topic);
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-script', {
          body: { topic }
        });

        if (error) {
          console.error(`Error from generate-script function (attempt ${retries + 1}):`, error);
          throw new Error(error.message);
        }
        
        console.log("Script generation successful");
        return data.scriptText || `Here's a video about ${topic}!`;
      } catch (err) {
        retries++;
        if (retries >= maxRetries) throw err;
        console.log(`Retrying script generation (${retries}/${maxRetries})...`);
        await delay(1000 * retries); // Exponential backoff
      }
    }
    
    throw new Error("Failed to generate script after multiple attempts");
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}

// Video generation with concurrency improvements
export async function generateVideo(formData: {
  scriptOption: ScriptOption;
  topic?: string;
  customScript?: string;
  supportingMedia?: string;
  supportingMediaFile?: File;
  voiceId: string;
  voiceMedia?: string;
  voiceMediaFile?: File;
  highResolution: boolean;
}): Promise<string> {
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const processId = `process_${timestamp}_${randomStr}`;
  
  console.log("Starting new video generation process with ID:", processId);
  
  updateProgressInStorage(processId, {
    progress: 0,
    status: "Starting...",
    voiceId: formData.voiceId,
    voiceMedia: formData.voiceMedia
  });
  
  // Process in the background with setTimeout
  setTimeout(() => processVideoGeneration(processId, formData), 0);
  
  return processId;
}

// Video generation process with better error handling and concurrency support
async function processVideoGeneration(processId: string, formData: {
  scriptOption: ScriptOption;
  topic?: string;
  customScript?: string;
  supportingMedia?: string;
  supportingMediaFile?: File;
  voiceId: string;
  voiceMedia?: string;
  voiceMediaFile?: File;
  highResolution: boolean;
}) {
  try {
    const filesToCleanup: string[] = [];
    
    let supportingMediaUrl = formData.supportingMedia || null;
    let voiceMediaUrl = formData.voiceMedia || null;
    
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
        // Continue without supporting media
        supportingMediaUrl = null;
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
        // Continue without voice media
        voiceMediaUrl = null;
      }
    }
    
    updateProgressInStorage(processId, { 
      supportingMediaUrl,
      voiceMedia: voiceMediaUrl
    });
    
    let scriptText: string;
    
    if (formData.scriptOption === ScriptOption.GPT && formData.topic) {
      updateProgressInStorage(processId, {
        status: "Generating script...",
        progress: 25
      });
      
      try {
        scriptText = await generateScript(formData.topic);
      } catch (scriptError) {
        console.error("Error generating script:", scriptError);
        scriptText = `Here's a cool video about ${formData.topic || 'this topic'}!`;
      }
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
    
    updateProgressInStorage(processId, {
      status: "Generating AI video...",
      progress: 50
    });
    
    // Use retry logic for AI video generation
    let aiVideoStartRetries = 0;
    let jobId: string | null = null;
    
    while (aiVideoStartRetries < 3 && !jobId) {
      try {
        const { data: startData, error: startError } = await supabase.functions.invoke('generate-ai-video', {
          body: {
            script: scriptText,
            voiceId: formData.voiceId,
            voiceMedia: voiceMediaUrl,
            highResolution: formData.highResolution,
            processId
          }
        });
        
        if (startError) {
          console.error(`Error starting AI video (attempt ${aiVideoStartRetries + 1}):`, startError);
          throw new Error(`Error starting AI video: ${startError.message}`);
        }
        
        jobId = startData.jobId;
        console.log("AI video generation started with job ID:", jobId);
      } catch (startErr) {
        aiVideoStartRetries++;
        if (aiVideoStartRetries >= 3) throw startErr;
        await delay(1000 * aiVideoStartRetries);
      }
    }
    
    if (!jobId) {
      throw new Error("Failed to start AI video generation after multiple attempts");
    }
    
    // Poll for AI video status
    let aiVideoUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (!aiVideoUrl && attempts < maxAttempts) {
      await delay(5000);
      attempts++;
      
      try {
        const { data: statusData, error: statusError } = await supabase.functions.invoke('check-ai-video-status', {
          body: { jobId, processId }
        });
        
        if (statusError) {
          console.error(`Error checking AI video status (attempt ${attempts}):`, statusError);
          // Continue polling despite errors
          continue;
        }
        
        if (statusData.completed) {
          aiVideoUrl = statusData.videoUrl;
          console.log("AI video completed:", aiVideoUrl);
        } else {
          console.log(`AI video status (attempt ${attempts}): ${statusData.status}`);
          updateProgressInStorage(processId, {
            status: `AI video processing: ${statusData.status || 'in progress'}...`,
          });
        }
      } catch (pollError) {
        console.error(`Error polling AI video status (attempt ${attempts}):`, pollError);
        // Continue polling despite errors
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
    
    // Retry logic for creating final video
    let finalVideoStartRetries = 0;
    let renderId: string | null = null;
    
    while (finalVideoStartRetries < 3 && !renderId) {
      try {
        const { data: renderData, error: renderError } = await supabase.functions.invoke('create-final-video', {
          body: {
            aiVideoUrl,
            supportingVideo: supportingMediaUrl,
            processId
          }
        });
        
        if (renderError) {
          console.error(`Error creating final video (attempt ${finalVideoStartRetries + 1}):`, renderError);
          throw new Error(`Error creating final video: ${renderError.message}`);
        }
        
        renderId = renderData.renderId;
        console.log("Final video render started with ID:", renderId);
      } catch (renderErr) {
        finalVideoStartRetries++;
        if (finalVideoStartRetries >= 3) throw renderErr;
        await delay(1000 * finalVideoStartRetries);
      }
    }
    
    if (!renderId) {
      throw new Error("Failed to start final video rendering after multiple attempts");
    }
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // Poll for final video status
    let finalVideoUrl: string | null = null;
    attempts = 0;
    
    while (!finalVideoUrl && attempts < maxAttempts) {
      await delay(5000);
      attempts++;
      
      try {
        const { data: finalStatusData, error: finalStatusError } = await supabase.functions.invoke('check-final-video-status', {
          body: { 
            renderId,
            scriptText,
            aiVideoUrl,
            userId,
            processId
          }
        });
        
        if (finalStatusError) {
          console.error(`Error checking final video status (attempt ${attempts}):`, finalStatusError);
          continue;
        }
        
        if (finalStatusData.completed) {
          finalVideoUrl = finalStatusData.url;
          console.log("Final video completed:", finalVideoUrl);
        } else {
          console.log(`Final video status (attempt ${attempts}): ${finalStatusData.status}`);
          updateProgressInStorage(processId, {
            status: `Final video processing: ${finalStatusData.status || 'in progress'}...`,
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
    
    // Clean up temporary files
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

// Remaining functions with better error handling
export async function checkProgress(processId: string): Promise<GenerationProgress> {
  const progress = getProgressFromStorage(processId);
  
  if (!progress) {
    throw new Error("Process not found");
  }
  
  return progress;
}

export async function getVideos(): Promise<Video[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId) {
      console.log("No authenticated user found, using mock videos");
      return mockVideos;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('get-videos', {
        body: { userId }
      });
      
      if (error) {
        console.error("Error fetching videos:", error);
        return mockVideos;
      }
      
      if (!data || !data.videos) {
        console.error("No videos data returned");
        return mockVideos;
      }
      
      return data.videos.map((video: any) => ({
        id: video.id,
        finalVideoUrl: video.final_video_url,
        scriptText: video.script_text,
        timestamp: new Date(video.timestamp).getTime()
      }));
    } catch (error) {
      console.error("Error invoking get-videos function:", error);
      return mockVideos;
    }
  } catch (error) {
    console.error("Error in getVideos:", error);
    return mockVideos;
  }
}
