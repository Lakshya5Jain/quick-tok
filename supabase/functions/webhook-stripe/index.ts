/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// @ts-nocheck

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to map Stripe Price ID to plan details
function getPlanDetailsByPriceId(priceId: string) {
  const plans: Record<string, { id: string; name: string; credits: number }> = {
    'price_1RHHUaQAqWYQiLZoSiYnbIAd': { id: 'basic', name: 'Basic', credits: 1000 },
    'price_1RHHV2QAqWYQiLZolJucMxVd': { id: 'standard', name: 'Standard', credits: 2500 },
    'price_1RHHVKQAqWYQiLZo3fI6uyhA': { id: 'premium', name: 'Premium', credits: 10000 },
  };
  return plans[priceId];
}

// Helper to safely add credits with error handling
async function safelyAddCredits(supabase, user_uuid, amount, description, transaction_type) {
  try {
    const { data, error } = await supabase.rpc('add_credits', {
      user_uuid,
      amount,
      description,
      transaction_type
    });
    
    if (error) {
      console.error('Error in add_credits RPC:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (e) {
    console.error('Exception in add_credits:', e);
    return { success: false, error: e };
  }
}

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await req.text();

  try {
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log("Webhook verified!", event.type);
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook verification failed:", err.message);
    return new Response("fail", { status: 400 });
  }
});
