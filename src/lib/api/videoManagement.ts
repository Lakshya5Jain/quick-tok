
import { Video } from "@/types";
import { mockVideos } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { getProgressFromStorage } from "./storage";

// Progress checking function
export async function checkProgress(processId: string): Promise<any> {
  const progress = getProgressFromStorage(processId);
  
  if (!progress) {
    throw new Error("Process not found");
  }
  
  return progress;
}

// Get videos function with improved error handling
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
