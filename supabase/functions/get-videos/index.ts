
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseKey) {
      throw new Error("Supabase key not found");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the user's auth token from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin to determine which videos to fetch
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = profileData?.is_admin || false;
    
    // Admin users see all videos, regular users only see their own
    let query = supabase
      .from('videos')
      .select('id, final_video_url, script_text, timestamp, user_id');
    
    // Apply filter for non-admin users
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }
    
    // Execute the query
    const { data, error } = await query.order('timestamp', { ascending: false });
    
    if (error) throw error;
    
    // Fetch stats if user is admin
    let stats = null;
    if (isAdmin) {
      const { data: statsData } = await supabase
        .from('system_stats')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      stats = statsData;
    }
    
    return new Response(
      JSON.stringify({
        videos: data.map(video => ({
          id: video.id,
          finalVideoUrl: video.final_video_url,
          scriptText: video.script_text,
          timestamp: new Date(video.timestamp).getTime(),
          userId: video.user_id
        })),
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error getting videos:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
