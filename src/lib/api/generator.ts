
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
    startVideoGeneration(processId, params);
    
    return processId;
  } catch (error) {
    console.error("Error in generateVideo:", error);
    throw error;
  }
}

// This handles the actual video generation process using the edge functions
async function startVideoGeneration(processId: string, params: any): Promise<void> {
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
  }
  
  updateProgressInStorage(processId, {
    progress: 20,
    status: "Generating AI video...",
    scriptText,
  });
  
  // Step 2: Generate AI video with Infinity AI
  let aiVideoUrl = "";
  try {
    const { data, error } = await supabase.functions.invoke('generate-ai-video', {
      body: { 
        script: scriptText,
        voiceId: params.voiceId,
        voiceMedia: params.voiceMedia,
        highResolution: params.highResolution
      }
    });
    
    if (error) throw new Error(`AI video generation failed: ${error.message}`);
    if (!data.jobId) throw new Error("No job ID returned from AI video generation");
    
    // Poll for AI video completion
    aiVideoUrl = await pollAIVideoStatus(processId, data.jobId);
    
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
  
  // Step 3: Create the final video with Creatomate
  let finalVideoUrl = "";
  try {
    const { data, error } = await supabase.functions.invoke('create-final-video', {
      body: { 
        aiVideoUrl, 
        supportingVideo: params.supportingMedia
      }
    });
    
    if (error) throw new Error(`Final video creation failed: ${error.message}`);
    if (!data.renderId) throw new Error("No render ID returned from final video creation");
    
    // Poll for final video completion
    finalVideoUrl = await pollFinalVideoStatus(processId, data.renderId, scriptText, aiVideoUrl);
    
  } catch (error) {
    console.error("Error creating final video:", error);
    updateProgressInStorage(processId, {
      progress: 100,
      status: "Error: Final video creation failed",
    });
    return;
  }
  
  // Get the current user session to associate the video with the user
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  
  if (!userId) {
    console.error("No user ID available to save video");
    throw new Error("User must be authenticated to generate videos");
  }
  
  try {
    // Insert video with the user ID - this is now handled by the edge function
    // that checks the final video status, so we don't need to do it here
    
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
        const { data, error } = await supabase.functions.invoke('check-ai-video-status', {
          body: { jobId }
        });
        
        if (error) throw new Error(`Failed to check AI video status: ${error.message}`);
        
        updateProgressInStorage(processId, {
          progress: Math.min(20 + Math.floor(attempts * 1.5), 60), // Progress from 20% to 60%
          status: "Generating AI talking head...",
        });
        
        if (data.completed && data.videoUrl) {
          resolve(data.videoUrl);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
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

// Poll for final video status until complete
async function pollFinalVideoStatus(processId: string, renderId: string, scriptText: string, aiVideoUrl: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20; // Maximum number of polling attempts
    const pollInterval = 3000; // Poll every 3 seconds
    
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-final-video-status', {
          body: { renderId, scriptText, aiVideoUrl }
        });
        
        if (error) throw new Error(`Failed to check final video status: ${error.message}`);
        
        updateProgressInStorage(processId, {
          progress: Math.min(70 + Math.floor(attempts * 1.5), 95), // Progress from 70% to 95%
          status: "Adding finishing touches...",
        });
        
        if (data.completed && data.url) {
          resolve(data.url);
          return;
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
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
