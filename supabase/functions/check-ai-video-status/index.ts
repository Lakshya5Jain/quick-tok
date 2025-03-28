
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { jobId, processId } = await req.json();
    const aiApiKey = Deno.env.get('AI_API_KEY');
    
    if (!jobId) {
      console.error(`[${processId}] No job ID provided`);
      return new Response(
        JSON.stringify({ error: "Job ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!aiApiKey) {
      console.error(`[${processId}] Missing AI API key`);
      return new Response(
        JSON.stringify({ error: "AI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${processId}] Checking status for job ID: ${jobId}`);

    const statusUrl = `https://infinity.ai/api/v2/generations/${jobId}`;
    const headers = {
      'Authorization': `Bearer ${aiApiKey}`,
      'Accept': 'application/json'
    };

    // Add retry logic for network failures
    let response = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(statusUrl, { headers });
        
        // If fetch succeeded, break out of retry loop
        break;
      } catch (fetchError) {
        retryCount++;
        console.error(`[${processId}] Fetch error on attempt ${retryCount}:`, fetchError);
        
        if (retryCount >= maxRetries) {
          return new Response(
            JSON.stringify({ error: "Failed to connect to AI API after multiple attempts" }),
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
      console.error(`[${processId}] Failed to check status: ${response?.status}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to check status", 
          status: response?.status || 500
        }),
        { status: response?.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusData = await response.json();
    console.log(`[${processId}] AI video status: ${statusData.status}`);
    
    return new Response(
      JSON.stringify({
        status: statusData.status,
        videoUrl: statusData.video_url,
        completed: statusData.status === 'completed'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error checking AI video status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
