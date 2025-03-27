
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
    
    // Start the real video generation process (or mock for demo)
    startVideoGeneration(processId, params);
    
    return processId;
  } catch (error) {
    console.error("Error in generateVideo:", error);
    throw error;
  }
}

// This would be the real implementation or mock for demo
async function startVideoGeneration(processId: string, params: any): Promise<void> {
  // Initial progress
  updateProgressInStorage(processId, {
    progress: 5,
    status: "Processing script...",
  });
  
  // Simulate script processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const scriptText = params.scriptOption === ScriptOption.CUSTOM 
    ? params.customScript 
    : "This is a sample script generated for the topic: " + (params.topic || "Technology");
  
  updateProgressInStorage(processId, {
    progress: 15,
    status: "Generating voice...",
    scriptText,
  });
  
  // Simulate voice generation
  await new Promise(resolve => setTimeout(resolve, 2000));
  updateProgressInStorage(processId, {
    progress: 40,
    status: "Creating AI video...",
    voiceId: params.voiceId,
  });
  
  // Simulate AI video generation
  await new Promise(resolve => setTimeout(resolve, 3000));
  updateProgressInStorage(processId, {
    progress: 70,
    status: "Adding finishing touches...",
    aiVideoUrl: "https://example.com/ai-video.mp4",
  });
  
  // Simulate final video generation
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Get the current user session to associate the video with the user
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  
  if (!userId) {
    console.error("No user ID available to save video");
    throw new Error("User must be authenticated to generate videos");
  }
  
  // Default video URL for demo purposes
  const finalVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  
  try {
    // Insert video with the user ID
    const { error } = await supabase.from('videos').insert({
      final_video_url: finalVideoUrl,
      script_text: scriptText,
      user_id: userId
    });
    
    if (error) {
      console.error("Error saving video to database:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error saving video to database:", error);
    throw error;
  }
  
  // Complete progress
  updateProgressInStorage(processId, {
    progress: 100,
    status: "Complete!",
    finalVideoUrl,
    scriptText,
  });
}
