import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users with credits
    const { data: users, error: usersError } = await supabase
      .from("user_credits")
      .select("user_id");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    // Add 100 credits to each user
    for (const { user_id } of users || []) {
      const { error: addError } = await supabase.rpc("add_credits", {
        user_uuid: user_id,
        amount: 100,
        description: "Monthly free credits",
        transaction_type: "MONTHLY_RESET",
      });

      if (addError) {
        console.error(`Error adding credits for user ${user_id}:`, addError);
      }
    }

    return new Response(
      JSON.stringify({ message: "Monthly credits applied successfully" }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in add-monthly-credits:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});