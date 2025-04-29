import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Customer portal session function called");
  
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe with detailed error logging
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Stripe configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase credentials missing");
      return new Response(
        JSON.stringify({ error: "Database configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { customerId, userId } = body;
    console.log("Customer ID from request:", customerId);
    console.log("User ID from request:", userId);

    if (!customerId) {
      console.error("Missing customerId in request");
      return new Response(
        JSON.stringify({ error: "Missing customerId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Verify user ownership of this subscription if userId is provided
    if (userId) {
      console.log("Verifying user ownership of subscription");
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      
      if (subscriptionError) {
        console.error("Error verifying subscription ownership:", subscriptionError);
        return new Response(
          JSON.stringify({ error: "Error verifying subscription ownership" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (!subscriptionData) {
        console.error("Subscription ownership verification failed");
        return new Response(
          JSON.stringify({ error: "Unauthorized: Customer ID does not belong to this user" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("User ownership verified for subscription");
    }

    // Create a customer portal session with better error handling
    try {
      console.log("Creating customer portal session for customer:", customerId);
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: req.headers.get("origin") || "https://quick-tok.com/subscription",
      });

      console.log("Successfully created portal session:", session.url ? "URL generated" : "No URL");
      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (stripeError) {
      console.error("Stripe error creating portal session:", stripeError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create Stripe portal session", 
          details: stripeError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unhandled error in customer portal function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 