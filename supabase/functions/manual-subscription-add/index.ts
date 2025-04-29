/// <reference lib="deno.ns" />
// @ts-nocheck
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Map Stripe Price ID to plan details
function getPlanDetailsByPriceId(priceId: string) {
  const plans: Record<string, { id: string; name: string; credits: number }> = {
    'price_1RHHUaQAqWYQiLZoSiYnbIAd': { id: 'basic', name: 'Basic', credits: 1000 },
    'price_1RHHV2QAqWYQiLZolJucMxVd': { id: 'standard', name: 'Standard', credits: 2500 },
    'price_1RHHVKQAqWYQiLZo3fI6uyhA': { id: 'premium', name: 'Premium', credits: 10000 },
  };
  return plans[priceId];
}

// Map planId to plan details
function getPlanDetailsByPlanId(planId: string) {
  const plans: Record<string, { id: string; name: string; credits: number }> = {
    basic:    { id: 'basic',    name: 'Basic',    credits: 1000 },
    standard: { id: 'standard', name: 'Standard', credits: 2500 },
    premium:  { id: 'premium',  name: 'Premium',  credits: 10000 },
  };
  return plans[planId];
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse input
    const { sessionId, userId: overrideUserId, planId: overridePlanId } = await req.json();
    if (!sessionId && !overridePlanId) {
      return new Response(
        JSON.stringify({ error: 'sessionId or planId must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe and Supabase clients
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2023-10-16' });
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')  || '';
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Retrieve subscription info from Stripe
    let subscriptionObj;
    let metadata: Record<string, string> = {};
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      metadata = session.metadata || {};
      if (!session.subscription) {
        throw new Error('No subscription found on checkout session');
      }
      subscriptionObj = await stripe.subscriptions.retrieve(session.subscription as string);
    } else {
      throw new Error('sessionId is required for subscription creation');
    }

    // Determine user ID
    const userId = metadata.userId || overrideUserId;
    if (!userId) {
      throw new Error('User ID not found in session metadata or override');
    }

    // Determine plan details
    const planIdFromMetadata = metadata.planId || overridePlanId;
    const priceIdFromSubscription = subscriptionObj.items.data[0]?.price?.id;
    let planDetails;
    if (planIdFromMetadata) {
      planDetails = getPlanDetailsByPlanId(planIdFromMetadata as string);
    }
    if (!planDetails && priceIdFromSubscription) {
      planDetails = getPlanDetailsByPriceId(priceIdFromSubscription);
    }
    if (!planDetails) {
      throw new Error('Plan details not found for subscription');
    }

    // Deactivate existing subscriptions
    const { data: existingSubscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);
    if (existingSubscriptions?.length) {
      for (const sub of existingSubscriptions) {
        if (sub.stripe_subscription_id === subscriptionObj.id) continue;
        await supabase
          .from('subscriptions')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('id', sub.id);
      }
    }

    // Upsert subscription record
    const subscriptionData = {
      user_id: userId,
      plan_type: planDetails.id,
      monthly_credits: planDetails.credits,
      active: true,
      stripe_subscription_id: subscriptionObj.id,
      stripe_customer_id: subscriptionObj.customer as string,
      current_period_start: new Date(subscriptionObj.current_period_start * 1000).toISOString(),
      current_period_end:   new Date(subscriptionObj.current_period_end   * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      cancel_at_period_end: subscriptionObj.cancel_at_period_end || false,
    };
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionObj.id)
      .maybeSingle();
    if (existingSub) {
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('stripe_subscription_id', subscriptionObj.id);
    } else {
      await supabase
        .from('subscriptions')
        .insert({ ...subscriptionData, created_at: new Date().toISOString() });
    }

    // Return subscription data to client
    return new Response(JSON.stringify({ subscription: subscriptionData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('manual-subscription-add error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}); 