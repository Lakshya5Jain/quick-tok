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
    const { script, voiceId, voiceMedia, highResolution, processId } = await req.json();
    const aiApiKey = Deno.env.get('AI_API_KEY');
    const aiBaseUrl = 'https://lemonslice.com/api/v2/generate';

    if (!script || !voiceId) {
      console.error(`[${processId}] Missing required parameters`);
      return new Response(
        JSON.stringify({ error: "Script and voiceId are required" }),
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

    // Log what we're sending to the AI API for debugging
    console.log(`[${processId}] Sending to AI API with voice ID:`, voiceId);
    console.log(`[${processId}] Script:`, script);
    console.log(`[${processId}] High Resolution:`, highResolution ? "Yes (640)" : "No (320)");

    // Ensure we have a valid voiceMedia URL that the AI API can access
    let imageUrl;
    
    if (voiceMedia) {
      // If it's a blob URL, use the default instead
      if (voiceMedia.startsWith("blob:")) {
        console.warn(`[${processId}] Received blob URL which won't work with the AI API. Using default image instead.`);
        imageUrl = "https://6ammc3n5zzf5ljnz.public.blob.vercel-storage.com/inf2-image-uploads/image_8132d-DYy5ZM9i939tkiyw6ADf3oVyn6LivZ.png";
      } else {
        // For regular URLs, use them as provided
        imageUrl = voiceMedia;
      }
    } else {
      // Fall back to default if no voiceMedia provided
      imageUrl = "https://6ammc3n5zzf5ljnz.public.blob.vercel-storage.com/inf2-image-uploads/image_8132d-DYy5ZM9i939tkiyw6ADf3oVyn6LivZ.png";
    }
    
    console.log(`[${processId}] Using voice media URL:`, imageUrl);

    // Start the video generation
    const headers = {
      'Authorization': `Bearer ${aiApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const data = {
      'img_url': imageUrl,
      'text': script,
      'voice_id': voiceId,
      'resolution': highResolution ? '640' : '320',
      'crop_head': false,
      'expressiveness': 1
    };

    console.log(`[${processId}] Sending request to AI API with data:`, JSON.stringify(data));

    // Add retry logic for network failures
    let response = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(aiBaseUrl, { 
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        
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
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error(`[${processId}] AI API error response:`, errorData);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to start video generation", 
          details: errorData,
          status: response ? response.status : 500
        }),
        { status: response ? response.status : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await response.json();
    
    if (!responseData.job_id) {
      console.error(`[${processId}] No job ID returned from AI API:`, responseData);
      return new Response(
        JSON.stringify({ error: "No job ID returned from AI API" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${processId}] Successfully started AI video generation with job ID: ${responseData.job_id}`);
    
    return new Response(
      JSON.stringify({ jobId: responseData.job_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error generating AI video:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
