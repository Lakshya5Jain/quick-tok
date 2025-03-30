
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { filePaths } = await req.json();
    
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return new Response(
        JSON.stringify({ error: "File paths array is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Supabase credentials not found" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Delete each file from storage
    const deletePromises = filePaths.map(async (path) => {
      // Extract the file name from the URL or path
      const fileName = path.split('/').pop();
      if (!fileName) return { path, success: false, error: "Invalid file path" };
      
      const { error } = await supabase.storage
        .from('uploads')
        .remove([fileName]);
      
      return { 
        path, 
        success: !error, 
        error: error ? error.message : null 
      };
    });
    
    const results = await Promise.all(deletePromises);
    
    return new Response(
      JSON.stringify({ 
        message: "File cleanup completed", 
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in cleanup-files function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
