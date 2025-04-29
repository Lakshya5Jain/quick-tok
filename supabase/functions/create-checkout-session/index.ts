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

    // Get the request body
    const body = await req.json();
    const { planId, userId, creditAmount, priceId, isOneTime } = body;

    // For subscription plans
    if (!isOneTime && (!planId || !userId)) {
      return new Response(
        JSON.stringify({ error: 'Missing plan ID or user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For one-time purchases
    if (isOneTime && (!userId || !creditAmount)) {
      return new Response(
        JSON.stringify({ error: 'Missing credit amount or user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's email from Supabase
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.email) {
      console.error('Error fetching user email:', userError);
      return new Response(
        JSON.stringify({ error: 'Could not fetch user email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = userData.user.email;

    // Create or retrieve the customer
    let customerId: string;
    const { data: customers } = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers && customers.length > 0) {
      customerId = customers[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
    }

    let session;

    // Handle one-time credit purchase
    if (isOneTime) {
      // Use the provided priceId or default to the one-time credit price ID
      const effectivePriceId = priceId || 'price_1RIJ3BQAqWYQiLZoyvmOZFCx';
      
      // Calculate the quantity - each quantity unit is 1 credit in Stripe
      // But we sell them in packs of 100, so we need the actual amount
      const quantity = creditAmount; 
      
      console.log(`Creating one-time checkout for ${quantity} credits`);
      
      // Create a one-time checkout session for additional credits
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: effectivePriceId,
            quantity: 1, // Set to 1 since we're using the unit_amount_decimal approach
            adjustable_quantity: {
              enabled: true,
              minimum: 1,
              maximum: 100,
            },
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.get('origin')}/credit-purchase-success?session_id={CHECKOUT_SESSION_ID}&creditAmount=${quantity}`,
        cancel_url: `${req.headers.get('origin')}/subscription-cancelled`,
        metadata: {
          userId: userId,
          creditAmount: quantity.toString(),
          isOneTime: 'true',
        },
        expand: ['line_items'],
      });
    } else {
      // Get plan details based on the selected planId
      const planDetails = getPlanDetails(planId);
      if (!planDetails) {
        return new Response(
          JSON.stringify({ error: 'Invalid plan ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create subscription checkout session
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: getStripePriceId(planId),
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.get('origin')}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/subscription-cancelled`,
        metadata: {
          userId: userId,
          planId: planId,
          priceId: getStripePriceId(planId),
        },
        expand: ['line_items'],
      });
    }

    console.log('Created checkout session:', {
      id: session.id,
      metadata: session.metadata,
      subscription: session.subscription,
      customer: session.customer,
    });

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
    basic: 'price_1RHHUaQAqWYQiLZoSiYnbIAd',
    standard: 'price_1RHHV2QAqWYQiLZolJucMxVd',
    premium: 'price_1RHHVKQAqWYQiLZo3fI6uyhA',
  };
  return priceIds[planId];
}
