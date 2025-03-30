
import { supabase } from "@/integrations/supabase/client";
import { delay } from "@/lib/utils";

// Script generation with improved error handling
export async function generateScript(topic: string): Promise<string> {
  try {
    console.log("Generating script for topic:", topic);
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-script', {
          body: { topic }
        });

        if (error) {
          console.error(`Error from generate-script function (attempt ${retries + 1}):`, error);
          throw new Error(error.message);
        }
        
        console.log("Script generation successful");
        return data.scriptText || `Here's a video about ${topic}!`;
      } catch (err) {
        retries++;
        if (retries >= maxRetries) throw err;
        console.log(`Retrying script generation (${retries}/${maxRetries})...`);
        await delay(1000 * retries); // Exponential backoff
      }
    }
    
    throw new Error("Failed to generate script after multiple attempts");
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}
