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

export async function generateScript(topic: string): Promise<string> {
  try {
    console.log("Generating script for topic:", topic);
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: { topic }
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
  highResolution: boolean;
}): Promise<string> {
  // First check if the user has enough credits (100 credits per video)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if the user has enough credits (100 credits per video)
    const { data: hasSufficientCredits, error: creditsError } = await supabase.rpc(
      'has_sufficient_credits',
      { user_uuid: user.id, required_credits: 100 }
    );

    if (creditsError) {
      console.error("Error checking credits:", creditsError);
      throw new Error("Could not verify credit balance");
    }

    if (!hasSufficientCredits) {
      throw new Error("Insufficient credits. You need 100 credits to generate a video.");
    }

    // Use the credits
    const { data: creditsUsed, error: useCreditsError } = await supabase.rpc(
      'use_credits',
      { 
        user_uuid: user.id, 
        amount: 100, 
        description: 'Used for generating a video' 
      }
    );

    if (useCreditsError || !creditsUsed) {
      console.error("Error using credits:", useCreditsError);
      throw new Error("Could not process credits for this operation");
    }

    // Now proceed with video generation
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const processId = `process_${timestamp}_${randomStr}`;
    
    console.log("Starting new video generation process with ID:", processId);
    
    updateProgressInStorage(processId, {
      progress: 0,
      status: "Starting...",
      voiceId: formData.voiceId,
      voiceMedia: formData.voiceMedia,
      processId: processId
    });
    
    setTimeout(() => processVideoGeneration(processId, formData), 0);
    
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
  highResolution: boolean;
}) {
  try {
    const filesToCleanup: string[] = [];
    
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
        scriptText = `Here's a cool video about ${formData.topic}!`;
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
      return mockVideos;
    }
    
    const userId = user?.id;
    
    if (!userId) {
      console.warn("No user ID found, returning mock videos");
      return mockVideos;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('get-videos', {
        body: { userId }
      });
      
      if (error) {
        console.error("Error fetching videos from Supabase function:", error);
        return mockVideos;
      }
      
      if (!data || !data.videos || !Array.isArray(data.videos)) {
        console.error("Invalid response format from get-videos function");
        return mockVideos;
      }
      
      return data.videos.map((video: any) => ({
        id: video.id || `mock-${Date.now()}`,
        finalVideoUrl: video.final_video_url,
        scriptText: video.script_text || "No script text available",
        timestamp: video.timestamp ? new Date(video.timestamp).getTime() : Date.now()
      }));
    } catch (funcError) {
      console.error("Exception when calling Supabase function:", funcError);
      return mockVideos;
    }
  } catch (error) {
    console.error("Unexpected error in getVideos:", error);
    return mockVideos;
  }
}
