
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { renderId, scriptText, aiVideoUrl, userId } = await req.json();
    const creatomateApiKey = Deno.env.get('CREATOMATE_API_KEY');
    
    if (!renderId) {
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check the status of the render
    const response = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
      headers: {
        'Authorization': `Bearer ${creatomateApiKey}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: "Failed to check render status", details: errorData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    console.log("Render status:", data.status);
    
    // If the render is complete, store the video in the database
    if (data.status === 'succeeded') {
      // Get the URL of the rendered video
      const url = data.outputs[0].url;
      
      // Store the video in the database
      if (scriptText && url) {
        // Create a Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://oghwtfuquhqwtqekpsyn.supabase.co';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
        
        if (!supabaseKey) {
          console.error("Supabase key not found");
        } else {
          try {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Insert the video into the database
            const { data: insertData, error: insertError } = await supabase
              .from('videos')
              .insert({
                script_text: scriptText,
                final_video_url: url,
                ai_video_url: aiVideoUrl,
                user_id: userId, // Include user ID when saving
              });
            
            if (insertError) {
              console.error("Error inserting video:", insertError);
            } else {
              console.log("Video inserted successfully");
            }
          } catch (dbError) {
            console.error("Error with database operation:", dbError);
          }
        }
      }
      
      return new Response(
        JSON.stringify({ 
          completed: true, 
          url: data.outputs[0].url,
          status: data.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          completed: false, 
          status: data.status 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Error checking final video status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
