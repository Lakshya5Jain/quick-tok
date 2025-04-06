
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

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

    // Get the user and plan from the request
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing plan ID or user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get plan details based on the selected planId
    const planDetails = getPlanDetails(planId);
    if (!planDetails) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or retrieve the customer
    let customerId: string;
    const { data: customers } = await stripe.customers.list({
      email: userId, // We're using the userId as the email for simplicity
      limit: 1,
    });

    if (customers && customers.length > 0) {
      customerId = customers[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: userId,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planDetails.name,
              description: `${planDetails.credits} credits per month`,
            },
            unit_amount: planDetails.price * 100, // Stripe uses cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/subscription-cancelled`,
      metadata: {
        userId: userId,
        planId: planId,
        credits: planDetails.credits.toString(),
      },
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
    'standard': { id: 'standard', name: 'Standard Plan', price: 20, credits: 2000 },
    'premium': { id: 'premium', name: 'Premium Plan', price: 30, credits: 3000 },
    'pro': { id: 'pro', name: 'Pro Plan', price: 50, credits: 5000 }
  };
  
  return plans[planId as keyof typeof plans];
}
