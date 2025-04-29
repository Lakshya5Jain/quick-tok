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
    'price_1RIKySQAqWYQiLZomhUaietO': { id: 'pro', name: 'Pro', credits: 20000 },
  };
  return plans[priceId];
}

// Map planId to plan details
function getPlanDetailsByPlanId(planId: string) {
  const plans: Record<string, { id: string; name: string; credits: number }> = {
    basic:    { id: 'basic',    name: 'Basic',    credits: 1000 },
    standard: { id: 'standard', name: 'Standard', credits: 2500 },
    premium:  { id: 'premium',  name: 'Premium',  credits: 10000 },
    pro:      { id: 'pro',      name: 'Pro',      credits: 20000 },
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
    console.log('manual-subscription-add preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Log incoming request for debugging
  let bodyText;
  try {
    bodyText = await req.text();
    console.log('manual-subscription-add payload:', bodyText);
  } catch (e) {
    console.error('Error reading request body:', e);
  }
  let payload;
  try {
    payload = JSON.parse(bodyText || '{}');
  } catch (e) {
    console.error('Error parsing request JSON:', e);
  }

  try {
    // Parse input
    const { sessionId, userId: overrideUserId, planId: overridePlanId } = payload;
    if (!sessionId && !overridePlanId) {
      console.error('manual-subscription-add missing sessionId and planId');
      return new Response(
        JSON.stringify({ error: 'sessionId or planId must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe and Supabase clients
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2023-10-16' });
    // Hardcoded Supabase cloud project credentials
    const supabaseUrl = 'https://oghwtfuquhqwtqekpsyn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHd0ZnVxdWhxd3RxZWtwc3luIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjQ4NjQ5MCwiZXhwIjoyMDU4MDYyNDkwfQ.wqT1EBnS40VnJPcxX3SFuyI1l8HoJbQe-P7n-I5LJTE';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Retrieve subscription info from Stripe or manual override
    let subscriptionObj;
    let metadata: Record<string, string> = {};
    if (sessionId) {
      // Real subscription from Stripe checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      metadata = session.metadata || {};
      if (!session.subscription) {
        throw new Error('No subscription found on checkout session');
      }
      subscriptionObj = await stripe.subscriptions.retrieve(session.subscription as string);
    } else if (overridePlanId) {
      // Manual override: create a mock subscription object for manual activation
      metadata = {};
      console.log(`Manual activation for plan ${overridePlanId}`);
      // Map overridePlanId to a dummy price ID for plan details
      const priceMap: Record<string, string> = {
        basic: 'price_1RHHUaQAqWYQiLZoSiYnbIAd',
        standard: 'price_1RHHV2QAqWYQiLZolJucMxVd',
        premium: 'price_1RHHVKQAqWYQiLZo3fI6uyhA',
      };
      const now = Math.floor(Date.now() / 1000);
      subscriptionObj = {
        id: `manual_${overrideUserId}_${overridePlanId}_${Date.now()}`,
        customer: null,
        current_period_start: now,
        current_period_end: now + 30 * 24 * 60 * 60,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: priceMap[overridePlanId] } }] },
      } as any;
    } else {
      throw new Error('sessionId or planId must be provided for subscription creation');
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
    console.log('Preparing to upsert subscription record:', subscriptionData);
    // Single upsert to insert or update based on stripe_subscription_id
    const upsertPayload = {
      ...subscriptionData,
      created_at: subscriptionData.created_at || new Date().toISOString(),
    };
    console.log('Upserting subscription:', upsertPayload);
    
    // First try to find existing subscription for this user
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    let upserted, upsertError;
    
    if (existingSub) {
      // Update existing subscription
      console.log('Updating existing subscription with id:', existingSub.id);
      const updateResult = await supabase
        .from('subscriptions')
        .update(upsertPayload)
        .eq('id', existingSub.id)
        .select();
      
      upserted = updateResult.data;
      upsertError = updateResult.error;
    } else {
      // Insert new subscription
      console.log('Creating new subscription');
      const insertResult = await supabase
        .from('subscriptions')
        .insert(upsertPayload)
        .select();
      
      upserted = insertResult.data;
      upsertError = insertResult.error;
    }

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
      return new Response(
        JSON.stringify({ error: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Subscription upserted successfully:', upserted);

    // Only grant credits on new subscription creation
    if (!existingSub) {
      console.log(`Granting ${planDetails.credits} credits to user ${userId}`);
      const { data: creditResult, error: creditError } = await supabase.rpc('add_credits', {
        user_uuid: userId,
        amount: planDetails.credits,
        description: `Subscription: ${planDetails.id}`,
        transaction_type: 'SUBSCRIPTION'
      });
      if (creditError) {
        console.error('Error adding subscription credits via RPC:', creditError);
      } else {
        console.log('Subscription credits granted via RPC:', creditResult);
      }
    } else {
      console.log('Skipping credit grant on subscription update');
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 