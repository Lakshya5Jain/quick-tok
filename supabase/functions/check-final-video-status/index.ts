
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
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const headers = {
      'Authorization': `Bearer ${creatomateApiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${creatomateBaseUrl}/${renderId}`, { headers });
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to check render status", status: response.status }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const statusData = await response.json();
    const completed = statusData.status === 'succeeded';
    
    // If completed, save to database
    if (completed && statusData.url && scriptText) {
      // Create a Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://oghwtfuquhqwtqekpsyn.supabase.co';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
      
      if (supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Save to videos table with the userId
        const { data, error } = await supabase
          .from('videos')
          .insert({
            final_video_url: statusData.url,
            script_text: scriptText,
            ai_video_url: aiVideoUrl,
            user_id: userId
          });
        
        if (error) {
          console.error("Error saving to database:", error);
        }
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
