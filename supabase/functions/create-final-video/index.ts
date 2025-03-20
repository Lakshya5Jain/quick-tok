
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
    const { aiVideoUrl, supportingVideo } = await req.json();
    const creatomateApiKey = Deno.env.get('CREATOMATE_API_KEY');
    const creatomateBaseUrl = 'https://api.creatomate.com/v1/renders';
    
    if (!aiVideoUrl) {
      return new Response(
        JSON.stringify({ error: "AI video URL is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating final video with:", { aiVideoUrl, supportingVideo });

    // Check if supportingVideo is a blob URL (client-side only)
    // If so, use null instead - the template should have a default fallback
    const supportingMediaUrl = supportingVideo && !supportingVideo.startsWith("blob:") 
      ? supportingVideo 
      : null;
    
    console.log("Using supporting media URL:", supportingMediaUrl);

    // Make sure we're properly passing the supporting video URL to the template
    const options = {
      'template_id': '236352ae-d17e-43ad-9aed-4f13004fe57d',
      "modifications": {
        "anchor": aiVideoUrl,
        "supporting_video": supportingMediaUrl
      },
    };
    
    console.log("Sending to Creatomate with options:", JSON.stringify(options));
    
    const headers = {
      'Authorization': `Bearer ${creatomateApiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(creatomateBaseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(options)
    });

    if (response.status !== 202) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Failed to start rendering", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const renderData = await response.json();
    const renderId = renderData[0].id;

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
