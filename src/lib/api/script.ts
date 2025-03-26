
import { supabase } from "@/integrations/supabase/client";

// Generate script with GPT
export async function generateScript(topic: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: { topic }
    });

    if (error) throw new Error(error.message);
    return data.scriptText;
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}
