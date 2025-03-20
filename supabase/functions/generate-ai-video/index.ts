
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
    const { script, voiceId, voiceMedia } = await req.json();
    const aiApiKey = Deno.env.get('AI_API_KEY');
    const aiBaseUrl = 'https://infinity.ai/api/v2/generate';

    if (!script || !voiceId) {
      return new Response(
        JSON.stringify({ error: "Script and voiceId are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start the video generation
    const headers = {
      'Authorization': `Bearer ${aiApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const data = {
      'img_url': voiceMedia || "https://6ammc3n5zzf5ljnz.public.blob.vercel-storage.com/inf2-image-uploads/image_8132d-DYy5ZM9i939tkiyw6ADf3oVyn6LivZ.png",
      'text': script,
      'voice_id': voiceId,
      'resolution': '320',
      'crop_head': false,
      'expressiveness': 0.7
    };

    // This is just to start the job and get the job ID
    // We'll return the job ID to the client, which will poll for progress
    const response = await fetch(aiBaseUrl, { 
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({ error: "Failed to start video generation", details: errorData }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await response.json();
    
    if (!responseData.job_id) {
      return new Response(
        JSON.stringify({ error: "No job ID returned from AI API" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
