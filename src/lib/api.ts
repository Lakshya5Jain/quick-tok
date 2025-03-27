
import { GenerationProgress, ScriptOption, Video } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Helper function to generate a unique filename
const generateUniqueFilename = (file: File) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = file.name.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Upload a file to Supabase Storage
export const uploadFile = async (file: File): Promise<string> => {
  if (!file) throw new Error("No file provided");
  
  try {
    console.info(`Uploading file: ${file.name}`);
    
    // Create uploads bucket if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket('uploads', {
      public: true,
      fileSizeLimit: 20971520, // 20MB
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError;
    }
    
    // Upload the file
    const filename = generateUniqueFilename(file);
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filename, file, {
        upsert: true,
        cacheControl: '3600'
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(data.path);
      
    console.info(`Uploaded to Supabase, public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("File upload error:", error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// Generate AI video
export const generateVideo = async ({
  scriptOption,
  topic,
  customScript,
  supportingMedia,
  supportingMediaFile,
  voiceId,
  voiceMedia,
  voiceMediaFile,
  highResolution
}: {
  scriptOption: ScriptOption;
  topic?: string;
  customScript?: string;
  supportingMedia?: string;
  supportingMediaFile?: File;
  voiceId: string;
  voiceMedia?: string;
  voiceMediaFile?: File;
  highResolution: boolean;
}): Promise<string> => {
  try {
    // Handle file uploads if present
    let supportingMediaUrl = supportingMedia;
    let voiceMediaUrl = voiceMedia;
    
    if (supportingMediaFile) {
      supportingMediaUrl = await uploadFile(supportingMediaFile);
      console.info("Supporting media uploaded successfully:", supportingMediaUrl);
    }
    
    if (voiceMediaFile) {
      voiceMediaUrl = await uploadFile(voiceMediaFile);
      console.info("Voice media uploaded successfully:", voiceMediaUrl);
    }
    
    // Step 1: Generate or use script
    let scriptText: string;
    if (scriptOption === ScriptOption.GPT && topic) {
      const { data: scriptData, error: scriptError } = await supabase.functions.invoke('generate-script', {
        body: { topic }
      });
      
      if (scriptError) throw new Error(`Script generation failed: ${scriptError.message}`);
      scriptText = scriptData.scriptText;
    } else if (scriptOption === ScriptOption.CUSTOM && customScript) {
      scriptText = customScript;
    } else {
      throw new Error("Invalid script input");
    }
    
    // Step 2: Generate AI video
    const { data: aiVideoData, error: aiVideoError } = await supabase.functions.invoke('generate-ai-video', {
      body: { 
        script: scriptText, 
        voiceId, 
        voiceMedia: voiceMediaUrl,
        highResolution
      }
    });
    
    if (aiVideoError) throw new Error(`AI video generation failed: ${aiVideoError.message}`);
    
    // Step 3: Start monitoring process
    const processId = aiVideoData.jobId;
    
    // Step 4: Start the final video composition
    // Get auth user id to associate with the video
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    const { data: finalVideoData, error: finalVideoError } = await supabase.functions.invoke('create-final-video', {
      body: { 
        processId,
        scriptText,
        supportingMedia: supportingMediaUrl,
        voiceMedia: voiceMediaUrl,
        user_id: userId
      }
    });
    
    if (finalVideoError) throw new Error(`Final video creation failed: ${finalVideoError.message}`);
    
    return processId;
  } catch (error) {
    console.error("Video generation error:", error);
    toast.error(error.message);
    throw error;
  }
};

// Check progress of video generation
export const checkProgress = async (processId: string): Promise<GenerationProgress> => {
  try {
    let status = "Starting...";
    let progress = 0;
    let finalVideoUrl: string | undefined;
    let scriptText: string | undefined;
    let aiVideoUrl: string | undefined;
    
    // First check if AI video is done
    const { data: aiData, error: aiError } = await supabase.functions.invoke('check-ai-video-status', {
      body: { processId }
    });
    
    if (aiError) throw aiError;
    
    console.info("AI video status:", aiData.status);
    
    if (aiData.status === "completed") {
      // AI video is done, now check final video status
      progress = 50; // AI video is 50% of the process
      status = "Generating AI video - Completed";
      aiVideoUrl = aiData.result?.output_url;
      scriptText = aiData.scriptText;
      
      // Check final video status
      const { data: finalData, error: finalError } = await supabase.functions.invoke('check-final-video-status', {
        body: { processId }
      });
      
      if (finalError) throw finalError;
      
      console.info("Final video status:", finalData.status);
      
      // Update progress based on final video status
      if (finalData.status === "completed") {
        progress = 100;
        status = "Complete!";
        finalVideoUrl = finalData.finalVideoUrl;
      } else if (finalData.status === "transcribing") {
        progress = 60;
        status = "Creating final video - Transcribing audio";
      } else if (finalData.status === "rendering") {
        progress = 75;
        status = "Creating final video - Rendering";
      } else {
        progress = 55;
        status = `Creating final video - ${finalData.status}`;
      }
    } else if (aiData.status === "processing") {
      // AI video still processing
      progress = 25; // Script generation is 25%, AI processing is next 25%
      status = "Generating AI video - Processing";
      scriptText = aiData.scriptText;
    } else if (aiData.status === "pending") {
      // Still in queue
      progress = 15;
      status = "Generating AI video - In queue";
      scriptText = aiData.scriptText;
    } else if (aiData.scriptText) {
      // Has script but still initializing AI
      progress = 25;
      status = "Generating script - Completed";
      scriptText = aiData.scriptText;
    } else {
      // Still generating script
      progress = 10;
      status = "Generating script";
    }
    
    return {
      progress,
      status,
      finalVideoUrl,
      scriptText,
      aiVideoUrl,
    };
  } catch (error) {
    console.error("Error checking progress:", error);
    throw error;
  }
};

// Get all videos
export const getVideos = async (): Promise<Video[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const { data, error } = await supabase.functions.invoke('get-videos', {
      headers
    });
    
    if (error) {
      console.error("Error fetching videos:", error);
      throw error;
    }
    
    return data.videos || [];
  } catch (error) {
    console.error("Error getting videos:", error);
    throw error;
  }
};
