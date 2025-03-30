
import { supabase } from "@/integrations/supabase/client";
import { FileWithPublicUrl } from "./types";
import { delay } from "@/lib/utils";

// Storage functions for managing process state
export const getProgressFromStorage = (processId: string): any | null => {
  try {
    const stored = localStorage.getItem(`progress_${processId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error reading progress from storage:", error);
    return null;
  }
};

export const updateProgressInStorage = (processId: string, progress: any) => {
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
