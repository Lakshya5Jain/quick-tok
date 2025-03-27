
import { GenerationProgress, ScriptOption } from '@/types';
import { supabase } from "@/integrations/supabase/client";
import { generateUUID } from '../utils';
import { updateProgressInStorage } from './utils';

// Generate a video from a script, voice, and supporting media
export async function generateVideo(params: {
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
  // Create a process ID for tracking progress
  const processId = generateUUID();

  try {
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      throw new Error("User must be authenticated to generate videos");
    }
    
    // Start the real video generation process
    startVideoGeneration(processId, params, sessionData.session.user.id);
    
    return processId;
  } catch (error) {
    console.error("Error in generateVideo:", error);
    throw error;
  }
}

// This handles the actual video generation process using the edge functions
async function startVideoGeneration(processId: string, params: any, userId: string): Promise<void> {
  // Initial progress
  updateProgressInStorage(processId, {
    progress: 5,
    status: "Processing script...",
  });
  
  // Step 1: Generate or use the provided script
  let scriptText = "";
  if (params.scriptOption === ScriptOption.GPT) {
    try {
      updateProgressInStorage(processId, {
        progress: 10,
        status: "Generating script from AI...",
      });
      
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: { topic: params.topic }
      });
      
      if (error) throw new Error(`Script generation failed: ${error.message}`);
      scriptText = data.scriptText;
      
      updateProgressInStorage(processId, {
        progress: 25,
        status: "Script generation complete!",
        scriptText,
      });
      
    } catch (error) {
      console.error("Error generating script:", error);
      updateProgressInStorage(processId, {
        progress: 100,
        status: "Error: Script generation failed",
      });
      return;
    }
  } else {
    scriptText = params.customScript || "";
    updateProgressInStorage(processId, {
      progress: 25,
      status: "Using custom script",
      scriptText,
    });
  }
  
  updateProgressInStorage(processId, {
    progress: 30,
    status: "Generating AI video...",
    scriptText,
  });
  
  // Upload voice media if it's a file
  let voiceMediaUrl = params.voiceMedia || "";
  if (params.voiceMediaFile && 'publicUrl' in params.voiceMediaFile) {
    // @ts-ignore - Use the public URL we added earlier
    voiceMediaUrl = params.voiceMediaFile.publicUrl;
  }
  
  // Step 2: Generate AI video with Infinity AI
  let aiVideoUrl = "";
  try {
    console.log("Generating AI video with params:", {
      script: scriptText,
      voiceId: params.voiceId,
      voiceMedia: voiceMediaUrl,
      highResolution: params.highResolution
    });
    
    const { data, error } = await supabase.functions.invoke('generate-ai-video', {
      body: { 
        script: scriptText,
        voiceId: params.voiceId,
        voiceMedia: voiceMediaUrl,
        highResolution: params.highResolution
      }
    });
    
    if (error) {
      console.error("Error from generate-ai-video function:", error);
      throw new Error(`AI video generation failed: ${error.message}`);
    }
    
    if (!data.jobId) {
      console.error("No job ID returned from AI video generation:", data);
      throw new Error("No job ID returned from AI video generation");
    }
    
    console.log("AI video jobId received:", data.jobId);
    
    // Poll for AI video completion
    aiVideoUrl = await pollAIVideoStatus(processId, data.jobId);
    console.log("AI video generation complete, URL:", aiVideoUrl);
    
  } catch (error) {
    console.error("Error generating AI video:", error);
    updateProgressInStorage(processId, {
      progress: 100,
      status: "Error: AI video generation failed",
    });
    return;
  }
  
  updateProgressInStorage(processId, {
    progress: 70,
    status: "Creating final video...",
    aiVideoUrl,
  });
  
  // Get the supporting media URL if it's a file
  let supportingMediaUrl = params.supportingMedia || "";
  if (params.supportingMediaFile && 'publicUrl' in params.supportingMediaFile) {
    // @ts-ignore - Use the public URL we added earlier
    supportingMediaUrl = params.supportingMediaFile.publicUrl;
  }
  
  // Step 3: Create the final video with Creatomate
  let finalVideoUrl = "";
  try {
    console.log("Creating final video with params:", { 
      aiVideoUrl, 
      supportingVideo: supportingMediaUrl 
    });
    
    const { data, error } = await supabase.functions.invoke('create-final-video', {
      body: { 
        aiVideoUrl, 
        supportingVideo: supportingMediaUrl
      }
    });
    
    if (error) {
      console.error("Error from create-final-video function:", error);
      throw new Error(`Final video creation failed: ${error.message}`);
    }
    
    if (!data.renderId) {
      console.error("No render ID returned from final video creation:", data);
      throw new Error("No render ID returned from final video creation");
    }
    
    console.log("Final video renderId received:", data.renderId);
    
    // Poll for final video completion - Pass userId to associate the video with the user
    finalVideoUrl = await pollFinalVideoStatus(processId, data.renderId, scriptText, aiVideoUrl, userId);
    console.log("Final video generation complete, URL:", finalVideoUrl);
    
  } catch (error) {
    console.error("Error creating final video:", error);
    updateProgressInStorage(processId, {
      progress: 100,
      status: "Error: Final video creation failed",
    });
    return;
  }
  
  try {
    // Complete progress
    updateProgressInStorage(processId, {
      progress: 100,
      status: "Complete!",
      finalVideoUrl,
      scriptText,
    });
  } catch (error) {
    console.error("Error completing video generation:", error);
    updateProgressInStorage(processId, {
      progress: 100,
      status: "Error: Failed to save video",
    });
  }
}

// Poll for AI video status until complete
async function pollAIVideoStatus(processId: string, jobId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30; // Maximum number of polling attempts
    const pollInterval = 5000; // Poll every 5 seconds
    
    const checkStatus = async () => {
      try {
        console.log(`Checking AI video status for job ${jobId}, attempt ${attempts + 1}`);
        
        const { data, error } = await supabase.functions.invoke('check-ai-video-status', {
          body: { jobId }
        });
        
        if (error) {
          console.error("Error from check-ai-video-status:", error);
          throw new Error(`Failed to check AI video status: ${error.message}`);
        }
        
        console.log("AI video status response:", data);
        
        updateProgressInStorage(processId, {
          progress: Math.min(30 + Math.floor(attempts * 1.5), 50), // Progress from 30% to 50%
          status: "Generating AI talking head...",
        });
        
        if (data.completed && data.videoUrl) {
          console.log("AI video generation completed with URL:", data.videoUrl);
          resolve(data.videoUrl);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("AI video generation timed out after maximum attempts");
          reject(new Error("AI video generation timed out after maximum attempts"));
          return;
        }
        
        // Continue polling
        setTimeout(checkStatus, pollInterval);
      } catch (error) {
        console.error("Error polling AI video status:", error);
        reject(error);
      }
    };
    
    // Start polling
    checkStatus();
  });
}

// Poll for final video status until complete - updated to include userId
async function pollFinalVideoStatus(processId: string, renderId: string, scriptText: string, aiVideoUrl: string, userId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20; // Maximum number of polling attempts
    const pollInterval = 3000; // Poll every 3 seconds
    
    const checkStatus = async () => {
      try {
        console.log(`Checking final video status for render ${renderId}, attempt ${attempts + 1}`);
        
        const { data, error } = await supabase.functions.invoke('check-final-video-status', {
          body: { renderId, scriptText, aiVideoUrl, userId }
        });
        
        if (error) {
          console.error("Error from check-final-video-status:", error);
          throw new Error(`Failed to check final video status: ${error.message}`);
        }
        
        console.log("Final video status response:", data);
        
        updateProgressInStorage(processId, {
          progress: Math.min(50 + Math.floor(attempts * 2), 95), // Progress from 50% to 95%
          status: "Adding finishing touches...",
        });
        
        if (data.completed && data.url) {
          console.log("Final video generation completed with URL:", data.url);
          resolve(data.url);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          console.error("Final video generation timed out after maximum attempts");
          reject(new Error("Final video generation timed out after maximum attempts"));
          return;
        }
        
        // Continue polling
        setTimeout(checkStatus, pollInterval);
      } catch (error) {
        console.error("Error polling final video status:", error);
        reject(error);
      }
    };
    
    // Start polling
    checkStatus();
  });
}
