// deno-lint-ignore-file
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received customer portal session request");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Parse request body
    let body;
    try {
      const bodyText = await req.text();
      console.log("Request body:", bodyText);
      body = JSON.parse(bodyText);
    } catch (err) {
      console.error("Error parsing request body:", err);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { customerId, userId } = body;

    if (!customerId) {
      console.error("Missing customerId");
      return new Response(
        JSON.stringify({ error: "Missing customerId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating customer portal session for customer ${customerId}`);
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: req.headers.get("origin") || "https://quick-tok.com/subscription",
      configuration: Deno.env.get("STRIPE_PORTAL_CONFIG_ID") || undefined,
    });

    console.log("Created customer portal session:", session.url);
    
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 