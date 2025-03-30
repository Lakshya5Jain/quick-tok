
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
    const maxRetries = 5; // Increased max retries
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(statusUrl, { 
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
              error: "Failed to connect to AI API after multiple attempts",
              status: "retrying",  // Still indicate status for frontend
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
      console.error(`[${processId}] No response from AI API after retries`);
      return new Response(
        JSON.stringify({ 
          status: "pending", 
          completed: false,
          error: "No response from AI API"
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle non-OK responses gracefully
    if (!response.ok) {
      const errorStatus = response.status;
      let errorBody = "";
      
      try {
        errorBody = await response.text();
      } catch (e) {
        // Ignore error parsing response
      }
      
      console.error(`[${processId}] Failed to check status: ${errorStatus}, body: ${errorBody}`);
      
      // For certain error codes, return a more specific status
      if (errorStatus === 404) {
        return new Response(
          JSON.stringify({ 
            status: "not_found", 
            completed: false, 
            error: "Job not found" 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          status: "error", 
          completed: false,
          error: `API returned status ${errorStatus}`
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
    
    console.log(`[${processId}] AI video status: ${statusData.status}`);
    
    // Determine if the job is completed based on the status field
    const isCompleted = statusData.status === 'completed';
    
    return new Response(
      JSON.stringify({
        status: statusData.status || "unknown",
        videoUrl: statusData.video_url || null,
        completed: isCompleted
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error checking AI video status:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        completed: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
