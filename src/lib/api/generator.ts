
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
  
  // Mock progress for demo purposes
  // This would be replaced with real API calls
  mockGenerateVideo(processId, params);
  
  return processId;
}

// Mock implementation of video generation for demo
async function mockGenerateVideo(processId: string, params: any): Promise<void> {
  // Initial progress
  updateProgressInStorage(processId, {
    progress: 5,
    status: "Processing script...",
  });
  
  // Simulate script processing
  await new Promise(resolve => setTimeout(resolve, 1500));
  updateProgressInStorage(processId, {
    progress: 15,
    status: "Generating voice...",
    scriptText: params.scriptOption === 'custom' 
      ? params.customScript 
      : "This is a sample script generated for the topic: " + (params.topic || "Technology"),
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
  
  const finalVideoUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  
  // Save to database if we have a user
  if (userId) {
    try {
      const scriptText = params.scriptOption === 'custom' 
        ? params.customScript 
        : "This is a sample script generated for the topic: " + (params.topic || "Technology");
      
      await supabase.from('videos').insert({
        final_video_url: finalVideoUrl,
        script_text: scriptText,
        user_id: userId
      });
    } catch (error) {
      console.error("Error saving video to database:", error);
      // Continue with local storage anyway so the user sees something
    }
  }
  
  // Complete progress
  updateProgressInStorage(processId, {
    progress: 100,
    status: "Complete!",
    finalVideoUrl,
  });
}
