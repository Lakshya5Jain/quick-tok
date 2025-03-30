
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
    const { renderId, scriptText, aiVideoUrl, userId, processId } = await req.json();
    const creatomateApiKey = Deno.env.get('CREATOMATE_API_KEY');
    const creatomateBaseUrl = 'https://api.creatomate.com/v1/renders';
    
    if (!renderId) {
      console.error(`[${processId}] No render ID provided`);
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${processId}] Checking status for render ID: ${renderId}`);
    
    const headers = {
      'Authorization': `Bearer ${creatomateApiKey}`,
      'Content-Type': 'application/json',
    };

    // Add retry logic for network failures
    let response = null;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(`${creatomateBaseUrl}/${renderId}`, { 
          headers,
          signal: AbortSignal.timeout(10000) // 10-second timeout
        });
        
        // If fetch succeeded, break out of retry loop
        break;
      } catch (fetchError) {
        retryCount++;
        console.error(`[${processId}] Fetch error on attempt ${retryCount}:`, fetchError);
        
        if (retryCount >= maxRetries) {
          return new Response(
            JSON.stringify({ 
              error: "Failed to connect to Creatomate API after multiple attempts",
              status: "retrying",
              completed: false
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Wait before retrying (exponential backoff)
        const delay = retryCount * 1000;
        console.log(`[${processId}] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!response) {
      console.error(`[${processId}] No response from Creatomate API after retries`);
      return new Response(
        JSON.stringify({ 
          status: "pending", 
          completed: false,
          error: "No response from Creatomate API"
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!response.ok) {
      console.error(`[${processId}] Failed to check render status: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to check render status", 
          status: "error", 
          completed: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the response body
    let statusData;
    try {
      statusData = await response.json();
    } catch (jsonError) {
      console.error(`[${processId}] Error parsing JSON response:`, jsonError);
      return new Response(
        JSON.stringify({ 
          status: "parsing_error", 
          completed: false,
          error: "Failed to parse API response"
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[${processId}] Render status: ${statusData.status}`);
    
    const completed = statusData.status === 'succeeded';
    
    // If completed, save to database
    if (completed && statusData.url && scriptText) {
      console.log(`[${processId}] Video render completed. Saving to database`);
      
      // Create a Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
      
      if (!supabaseKey || !supabaseUrl) {
        console.error(`[${processId}] Missing Supabase key or URL when trying to save completed video`);
        return new Response(
          JSON.stringify({ 
            status: statusData.status,
            url: statusData.url,
            completed,
            error: "Missing Supabase credentials"
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Generate a unique video ID to avoid duplicates in the case of concurrent users
      const videoId = crypto.randomUUID();
      
      if (!userId) {
        console.error(`[${processId}] Missing user ID, cannot save video to database`);
        return new Response(
          JSON.stringify({ 
            status: statusData.status,
            url: statusData.url,
            completed,
            error: "Missing user ID"
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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
          console.error(`[${processId}] Error saving to database:`, error);
        } else {
          console.log(`[${processId}] Successfully saved video with ID: ${videoId}`);
        }
      } catch (dbError) {
        console.error(`[${processId}] Failed to save video to database:`, dbError);
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
      JSON.stringify({ 
        error: error.message || "Unknown error",
        status: "error",
        completed: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
