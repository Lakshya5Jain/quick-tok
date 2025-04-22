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
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(`${creatomateBaseUrl}/${renderId}`, { headers });
        
        // If fetch succeeded, break out of retry loop
        break;
      } catch (fetchError) {
        retryCount++;
        console.error(`[${processId}] Fetch error on attempt ${retryCount}:`, fetchError);
        
        if (retryCount >= maxRetries) {
          return new Response(
            JSON.stringify({ error: "Failed to connect to Creatomate API after multiple attempts" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Wait before retrying (exponential backoff)
        const delay = retryCount * 1000;
        console.log(`[${processId}] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response received';
      console.error(`[${processId}] Failed to check render status:`, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to check render status", details: errorText }),
        { status: response ? response.status : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusData = await response.json();
    console.log(`[${processId}] Render status: ${statusData.status}`);
    
    const completed = statusData.status === 'succeeded';
    
    // If not completed, just return the status
    if (!completed || !statusData.url || !scriptText) {
      return new Response(
        JSON.stringify({
          status: statusData.status,
          url: statusData.url,
          completed
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${processId}] Video render completed. Saving to database...`);
    
    // Create a Supabase client FIRST before using it
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://oghwtfuquhqwtqekpsyn.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseKey) {
      console.error(`[${processId}] Missing Supabase key when trying to save completed video`);
      return new Response(
        JSON.stringify({ error: "Supabase key not found" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Compute cost based on video duration (assuming statusData.duration in seconds)
    const durationSeconds = statusData.duration || 0;
    let cost = Math.ceil((durationSeconds / 60) * 100);
    console.log(`[${processId}] Video duration: ${durationSeconds}s, cost: ${cost} credits`);

    // Log the user ID to make sure it's valid
    console.log(`[${processId}] Processing credits for user ID: ${userId}`);
    
    // First, get current credits to log before deduction
    const { data: currentCredits, error: creditCheckError } = await supabase.rpc('get_user_credits', {
      user_uuid: userId
    });
    
    if (creditCheckError) {
      console.error(`[${processId}] Error fetching current credits:`, creditCheckError);
    }
    
    console.log(`[${processId}] Current credits before deduction: ${currentCredits}`);

    // Add debug check for undefined/zero cost
    if (!cost || cost <= 0) {
      console.error(`[${processId}] Invalid cost calculated: ${cost}. Using default of 100.`);
      cost = 100; // Default to 100 if calculation failed
    }

    // Deduct credits for this video
    console.log(`[${processId}] Attempting to use ${cost} credits for user ${userId}...`);
    const useCreditsResult = await supabase.rpc('use_credits', {
      user_uuid: userId,
      amount: cost,
      description: `Used for generating ${durationSeconds}s video`
    });
    
    const { data: useCreditsData, error: useCreditsError } = useCreditsResult;
    
    console.log(`[${processId}] Credits deduction result:`, useCreditsData);
    
    if (useCreditsError) {
      console.error(`[${processId}] Error deducting credits:`, useCreditsError);
      // Continue anyway since we've removed the credit check
      console.log(`[${processId}] Continuing despite credit deduction error...`);
    } else {
      console.log(`[${processId}] Credits deduction succeeded`);
    }

    // Get credits after deduction to verify
    const { data: newCredits, error: newCreditCheckError } = await supabase.rpc('get_user_credits', {
      user_uuid: userId
    });
    
    if (newCreditCheckError) {
      console.error(`[${processId}] Error fetching updated credits:`, newCreditCheckError);
    }
    
    console.log(`[${processId}] Credits after deduction: ${newCredits}`);
    console.log(`[${processId}] Credits change: ${currentCredits - newCredits}`);
    
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
        console.error(`[${processId}] Error saving to database:`, error);
      } else {
        console.log(`[${processId}] Successfully saved video with ID: ${videoId}`);
      }
    } catch (dbError) {
      console.error(`[${processId}] Failed to save video to database:`, dbError);
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
