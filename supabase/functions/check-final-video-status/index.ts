
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const creatomateBaseUrl = 'https://api.creatomate.com/v1/renders';
    
    if (!renderId) {
      console.error("No render ID provided");
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking status for render ID: ${renderId}`);
    
    const headers = {
      'Authorization': `Bearer ${creatomateApiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${creatomateBaseUrl}/${renderId}`, { headers });
    
    if (!response.ok) {
      console.error(`Failed to check render status: ${response.status}`);
      return new Response(
        JSON.stringify({ error: "Failed to check render status", status: response.status }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusData = await response.json();
    console.log(`Render status: ${statusData.status}`);
    
    const completed = statusData.status === 'succeeded';
    
    // If completed, save to database
    if (completed && statusData.url && scriptText) {
      console.log("Video render completed. Saving to database");
      
      // Create a Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://oghwtfuquhqwtqekpsyn.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
      
      if (!supabaseKey) {
        console.error("Missing Supabase key when trying to save completed video");
        return new Response(
          JSON.stringify({ error: "Supabase key not found" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Generate a unique video ID to avoid duplicates in the case of concurrent users
      const videoId = crypto.randomUUID();
      
      try {
        // Save to videos table with user_id
        const { data, error } = await supabase
          .from('videos')
          .insert({
            id: videoId, 
            final_video_url: statusData.url,
            script_text: scriptText,
            ai_video_url: aiVideoUrl,
            user_id: userId,
            timestamp: new Date().toISOString()
          });
        
        if (error) {
          console.error("Error saving to database:", error);
        } else {
          console.log(`Successfully saved video with ID: ${videoId}`);
        }
      } catch (dbError) {
        console.error("Failed to save video to database:", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        status: statusData.status,
        url: statusData.url,
        completed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error checking final video status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
