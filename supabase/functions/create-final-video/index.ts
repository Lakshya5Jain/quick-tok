
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
    const { aiVideoUrl, supportingVideo, processId } = await req.json();
    const creatomateApiKey = Deno.env.get('CREATOMATE_API_KEY');
    const creatomateBaseUrl = 'https://api.creatomate.com/v1/renders';
    
    if (!aiVideoUrl) {
      console.error(`[${processId}] AI video URL is required`);
      return new Response(
        JSON.stringify({ error: "AI video URL is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${processId}] Creating final video with:`, { aiVideoUrl, supportingVideo });

    // Determine if supportingVideo is a valid URL that Creatomate can access
    const defaultSupportingMedia = "https://i.makeagif.com/media/11-27-2023/Uii6jU.mp4";
    let supportingMediaUrl = null;
    
    if (supportingVideo) {
      // Check if it's a blob URL or an actual remote URL
      if (supportingVideo.startsWith("blob:")) {
        console.warn(`[${processId}] Received blob URL which won't work with Creatomate. Using default supporting video.`);
        supportingMediaUrl = defaultSupportingMedia;
      } else {
        // For regular URLs, use them as provided
        supportingMediaUrl = supportingVideo;
        console.log(`[${processId}] Using supporting media URL:`, supportingMediaUrl);
      }
    } else {
      // Use the default supporting media
      supportingMediaUrl = defaultSupportingMedia;
      console.log(`[${processId}] Using default supporting media URL:`, supportingMediaUrl);
    }
    
    // Make sure we're properly passing the supporting video URL to the template
    const options = {
      'template_id': '236352ae-d17e-43ad-9aed-4f13004fe57d',
      "modifications": {
        "anchor": aiVideoUrl,
        "supporting_video": supportingMediaUrl
      },
    };
    
    console.log(`[${processId}] Sending to Creatomate with options:`, JSON.stringify(options));
    
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
        response = await fetch(creatomateBaseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(options)
        });
        
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

    if (!response || response.status !== 202) {
      const errorText = response ? await response.text() : 'No response received';
      console.error(`[${processId}] Creatomate API error:`, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to start rendering", details: errorText }),
        { status: response ? response.status : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const renderData = await response.json();
    const renderId = renderData[0].id;
    console.log(`[${processId}] Creatomate render started with ID:`, renderId);

    return new Response(
      JSON.stringify({ renderId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error creating final video:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
