
import { Video } from '@/types';
import { supabase } from "@/integrations/supabase/client";
import { mockVideos } from '@/data/mockData';

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
      timestamp: new Date(video.timestamp).getTime(),
      userId: video.user_id
    }));
  } catch (error) {
    console.error("Error in getVideos:", error);
    // Fall back to mock videos if there's an error
    return mockVideos;
  }
}
