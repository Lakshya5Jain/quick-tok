
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
    const { jobId } = await req.json();
    const aiApiKey = Deno.env.get('AI_API_KEY');
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Job ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusUrl = `https://infinity.ai/api/v2/generations/${jobId}`;
    const headers = {
      'Authorization': `Bearer ${aiApiKey}`,
      'Accept': 'application/json'
    };

    const response = await fetch(statusUrl, { headers });
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to check status", status: response.status }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusData = await response.json();
    
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
