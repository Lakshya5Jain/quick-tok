// deno-lint-ignore-file
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for subscription or one-time credit purchase
    const { planId, userId, creditAmount, priceId: creditPriceId, isOneTime } = await req.json() as {
      planId?: string;
      userId: string;
      creditAmount?: number;
      priceId?: string;
      isOneTime?: boolean;
    };

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch or create Stripe customer
    const { data: customers } = await stripe.customers.list({ email: (await supabase.auth.admin.getUserById(userId)).data?.user?.email!, limit: 1 });
    const customerId = customers?.[0]?.id || (await stripe.customers.create({ email: (await supabase.auth.admin.getUserById(userId)).data!.user!.email, metadata: { userId } })).id;

    let session;
    if (isOneTime) {
      // One-time credits purchase
      if (!creditPriceId) {
        return new Response(
          JSON.stringify({ error: 'Missing priceId for one-time purchase' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // The price is $1 per 100 credits, so convert credits to price units
      const quantity = Math.max(1, Math.floor((creditAmount || 100) / 100));
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: creditPriceId, quantity }],
        mode: 'payment',
        success_url: `${req.headers.get('origin')}/credit-purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/subscription-cancelled`,
        metadata: { userId, creditAmount: creditAmount?.toString() },
      });
    } else {
      // Subscription purchase
      if (!planId) {
        return new Response(
          JSON.stringify({ error: 'Missing plan ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: getStripePriceId(planId), quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/subscription-cancelled`,
        metadata: { userId, planId, priceId: getStripePriceId(planId) },
        expand: ['line_items'],
      });
    }

    // Return the checkout URL
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to get plan details based on plan ID
function getPlanDetails(planId: string) {
  const plans = {
    'basic': { id: 'basic', name: 'Basic Plan', price: 10, credits: 1000 },
    'standard': { id: 'standard', name: 'Standard Plan', price: 20, credits: 2500 },
    'premium': { id: 'premium', name: 'Premium Plan', price: 50, credits: 10000 },
  };
  
  return plans[planId as keyof typeof plans];
}

// Helper function to get Stripe Price ID based on plan ID
function getStripePriceId(planId: string) {
  const priceIds: Record<string, string> = {
    basic: 'price_1RJnw5GKsooHfCUlLYwgfF0r',
    standard: 'price_1RJnw1GKsooHfCUls8fY6o5S',
    premium: 'price_1RJnvyGKsooHfCUl9B84uw3B',
  };
  return priceIds[planId];
}
