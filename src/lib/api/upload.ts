
import { supabase } from "@/integrations/supabase/client";

// Upload a file to storage and get a URL
export async function uploadFile(file: File): Promise<string> {
  try {
    console.log("Uploading file:", file.name);
    
    // Check if the file already has a publicUrl (from previous upload)
    if ('publicUrl' in file) {
      // @ts-ignore - custom property we added
      return file.publicUrl;
    }
    
    // Generate a unique file name based on the original name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Try to upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);
    
    console.log("Uploaded to Supabase, public URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    // Fall back to object URL as last resort
    return URL.createObjectURL(file);
  }
}
