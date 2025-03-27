
// Previously missing - Create this file to fetch videos from database
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
    // Get the auth token from the request header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization token provided" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://oghwtfuquhqwtqekpsyn.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase service key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the JWT and get the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user profile to check if admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    console.log("Getting videos for user:", user.id);
    console.log("User is admin:", profile?.is_admin || false);
    
    // If admin, get all videos, otherwise get only user's videos
    let query = supabaseAdmin.from('videos').select('*');
    
    if (!profile?.is_admin) {
      query = query.eq('user_id', user.id);
    }
    
    const { data: videos, error: videosError } = await query.order('timestamp', { ascending: false });
    
    if (videosError) {
      console.error("Error fetching videos:", videosError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch videos" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log("Retrieved", videos.length, "videos");
    
    // For admins, also fetch system stats
    let stats = null;
    if (profile?.is_admin) {
      const { data: statsData } = await supabaseAdmin
        .from('system_stats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (statsData && statsData.length > 0) {
        stats = statsData[0];
      }
    }
    
    return new Response(
      JSON.stringify({
        videos: videos || [],
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching videos:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
