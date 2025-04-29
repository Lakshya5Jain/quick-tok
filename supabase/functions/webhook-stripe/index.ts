// deno-lint-ignore-file
// @ts-nocheck
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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

// Helper to find userId when metadata is missing
async function lookupUserId(supabase, stripeSubscriptionId: string, stripeCustomerId: string | null) {
  try {
    // Try by subscription id first
    let { data: subById } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();
    if (subById?.user_id) return subById.user_id;
    if (stripeCustomerId) {
      let { data: subByCust } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .maybeSingle();
      if (subByCust?.user_id) return subByCust.user_id;
    }
  } catch (e) {
    console.error('lookupUserId error:', e);
  }
  return undefined;
}

async function processCheckoutSessionCompleted(event, stripe, supabase) {
  console.log("Event data:", JSON.stringify(event.data.object, null, 2));
  
  const session = event.data.object;
  console.log("Processing checkout.session.completed:", session.id);
  
  // Get subscription details if this is a subscription checkout
  if (session.mode === 'subscription' && session.subscription) {
    try {
      console.log("Retrieving subscription:", session.subscription);
      
      let subscriptionObj;
      try {
        subscriptionObj = await stripe.subscriptions.retrieve(session.subscription);
        console.log("Subscription details retrieved:", JSON.stringify(subscriptionObj, null, 2));
      } catch (subError) {
        console.error("Error retrieving subscription:", subError);
        // In test mode or development, create mock subscription data
        console.log("Creating test subscription data instead");
        subscriptionObj = {
          id: session.subscription,
          customer: session.customer,
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
          cancel_at_period_end: false,
          items: {
            data: [
              {
                price: {
                  id: session.metadata?.planId === 'basic' 
                    ? 'price_1RHHUaQAqWYQiLZoSiYnbIAd' 
                    : session.metadata?.planId === 'premium' 
                    ? 'price_1RHHVKQAqWYQiLZo3fI6uyhA' 
                    : 'price_1RHHV2QAqWYQiLZolJucMxVd' // default to standard
                }
              }
            ]
          }
        };
        console.log("Created mock subscription:", JSON.stringify(subscriptionObj, null, 2));
      }
      
      const userId = session.metadata?.userId;
      if (!userId) {
        console.error("No userId found in session metadata");
        return false;
      }
      
      console.log("Processing for user:", userId);
      
      // Get plan details from the subscription
      const priceId = subscriptionObj.items.data[0]?.price?.id;
      const planDetails = getPlanDetailsByPriceId(priceId);
      if (!planDetails) {
        console.error("No plan details found for price ID:", priceId);
        return false;
      }
      
      console.log("Plan details:", planDetails);
      
      // Deactivate existing subscriptions for this user
      console.log("Checking for existing subscriptions");
      const { data: existingSubscriptions, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);
        
      if (fetchError) {
        console.error("Error fetching existing subscriptions:", fetchError);
      } else if (existingSubscriptions?.length) {
        console.log(`Found ${existingSubscriptions.length} existing active subscriptions, deactivating them`);
        for (const sub of existingSubscriptions) {
          if (sub.stripe_subscription_id === subscriptionObj.id) {
            console.log(`Skipping subscription ${sub.id} as it matches current`);
            continue;
          }
          console.log(`Deactivating subscription ${sub.id}`);
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', sub.id);
            
          if (updateError) {
            console.error("Error deactivating existing subscription:", updateError);
          } else {
            console.log(`Successfully deactivated subscription ${sub.id}`);
          }
        }
      } else {
        console.log("No existing active subscriptions found");
      }
      
      // Create or update subscription record
      const subscriptionData = {
        user_id: userId,
        plan_type: planDetails.id,
        monthly_credits: planDetails.credits,
        active: true,
        stripe_subscription_id: subscriptionObj.id,
        stripe_customer_id: subscriptionObj.customer,
        current_period_start: new Date(subscriptionObj.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscriptionObj.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        cancel_at_period_end: subscriptionObj.cancel_at_period_end || false,
      };
      
      console.log("Preparing to insert/update subscription with data:", subscriptionData);
      
      // Check if subscription already exists
      console.log("Checking if subscription already exists in db");
      const { data: existingSub, error: subFetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionObj.id)
        .maybeSingle();
        
      if (subFetchError) {
        console.error("Error checking for existing subscription:", subFetchError);
      }
      
      let subscriptionResult;
      if (existingSub) {
        // Update existing subscription
        console.log(`Updating existing subscription with id ${existingSub.id}`);
        subscriptionResult = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('stripe_subscription_id', subscriptionObj.id);
      } else {
        // Insert new subscription
        console.log("Creating new subscription record");
        subscriptionResult = await supabase
          .from('subscriptions')
          .insert({ ...subscriptionData, created_at: new Date().toISOString() });
      }
      
      if (subscriptionResult.error) {
        console.error("Error upserting subscription:", subscriptionResult.error);
        return false;
      }
      
      console.log(`Successfully processed subscription for user ${userId}, plan ${planDetails.id}`);
      // Grant the subscription credits to the user via RPC
      try {
        const creditRes = await safelyAddCredits(supabase, userId, planDetails.credits, `Subscription: ${planDetails.id}`, 'SUBSCRIPTION');
        if (!creditRes.success) {
          console.error('Error adding subscription credits via RPC:', creditRes.error);
        } else {
          console.log('Subscription credits added via webhook successfully');
        }
      } catch (e) {
        console.error('Exception while granting subscription credits:', e);
      }
      return true;
    } catch (error) {
      console.error("Error processing subscription:", error);
      return false;
    }
  } else {
    console.log("Non-subscription checkout session detected – checking if this is a one-time credit purchase");

    if (session.mode === 'payment') {
      const userId = session.metadata?.userId;
      const creditAmountStr = session.metadata?.creditAmount;
      const creditAmount = creditAmountStr ? parseInt(creditAmountStr, 10) : 0;

      if (!userId) {
        console.error('One-time credit purchase: userId missing in metadata');
        return false;
      }

      if (!creditAmount || isNaN(creditAmount) || creditAmount <= 0) {
        console.error('One-time credit purchase: invalid creditAmount', creditAmountStr);
        return false;
      }

      const txDescription = `One-time credit purchase (${session.id})`;

      // Idempotency – check if we already added credits for this session
      const { data: existingTx, error: txFetchError } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('description', txDescription)
        .maybeSingle();

      if (txFetchError) {
        console.error('Error checking existing credit transaction:', txFetchError);
      }

      if (existingTx) {
        console.log('Credits already granted for this one-time purchase, skipping');
        return true;
      }

      console.log(`Granting ${creditAmount} credits to user ${userId} for one-time purchase`);
      const addRes = await safelyAddCredits(
        supabase,
        userId,
        creditAmount,
        txDescription,
        'PURCHASE'
      );

      if (!addRes.success) {
        console.error('Failed to add credits for one-time purchase:', addRes.error);
        return false;
      }

      console.log('Successfully granted one-time purchase credits');
      return true;
    }

    console.log("Checkout session not handled (neither subscription nor one-time purchase)");
  }
  
  return true;
}

serve(async (req) => {
  // Initialize Stripe and Supabase clients
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2023-10-16' });
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Add CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Webhook received");
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    let event;
    // For testing, allow skipping signature verification in development
    const isDevelopment = !Deno.env.get('STRIPE_WEBHOOK_SECRET') || 
                       Deno.env.get('ENV') === 'development';
                       
    if (!signature) {
      console.log("No signature provided");
      if (isDevelopment) {
        console.log("Development mode - proceeding without signature verification");
        try {
          event = JSON.parse(body);
          console.log("Parsed event without verification:", event.type);
        } catch (parseError) {
          console.error("Failed to parse webhook body:", parseError);
          return new Response(
            JSON.stringify({ success: false, error: "Invalid JSON payload" }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "No stripe-signature header value was provided." }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Verify webhook signature
      console.log("Verifying webhook signature");
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        console.log("Webhook verified!", event.type);
      } catch (err) {
        console.error("Webhook verification failed:", err.message);
        return new Response(
          JSON.stringify({ success: false, error: err.message }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Process the event
    let handled = false;
    
    if (event.type === 'checkout.session.completed') {
      console.log("Processing checkout.session.completed event");
      handled = await processCheckoutSessionCompleted(event, stripe, supabase);
    } else if (event.type === 'invoice.payment_succeeded') {
      console.log("Processing invoice.payment_succeeded event");
      const invoice = event.data.object;
      if (invoice.billing_reason === 'subscription_create') {
        console.log('Skipping credit grant for initial subscription_create invoice');
      }
      if (invoice.subscription) {
        const subObj = await stripe.subscriptions.retrieve(invoice.subscription as string);
        let userId = subObj.metadata?.userId;
        if (!userId) {
          console.log('invoice.payment_succeeded: metadata missing userId, performing DB lookup');
          userId = await lookupUserId(supabase, subObj.id as string, subObj.customer as string);
        }
        if (userId) {
          const priceId = subObj.items.data[0]?.price?.id;
          const planDetails = getPlanDetailsByPriceId(priceId);
          const subscriptionData = {
            plan_type: planDetails.id,
            monthly_credits: planDetails.credits,
            current_period_start: new Date(subObj.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subObj.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subObj.cancel_at_period_end || false,
            updated_at: new Date().toISOString(),
          };
          console.log("Updating subscription on renewal:", subscriptionData);
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('stripe_subscription_id', subObj.id);
          if (updateError) console.error("Error updating subscription on renewal:", updateError);
          // Only grant credits for real renewal invoices, not subscription_create
          if (invoice.billing_reason !== 'subscription_create') {
            console.log(`Subscription renewed for user ${userId}, plan ${planDetails.id}`);
            await safelyAddCredits(supabase, userId, planDetails.credits, `Subscription renewal: ${planDetails.id}`, 'SUBSCRIPTION');
          } else {
            console.log('Initial invoice subscription_create detected – credits were already granted on checkout, skipping.');
          }
          handled = true;
        }
      }
    } else if (event.type === 'customer.subscription.updated') {
      console.log("Processing customer.subscription.updated event");
      const subObj = event.data.object;
      let userId = subObj.metadata?.userId;
      if (!userId) {
        console.log('subscription.updated: metadata missing userId, performing DB lookup');
        userId = await lookupUserId(supabase, subObj.id as string, subObj.customer as string);
      }
      if (userId) {
        // Update plan details and billing cycle dates
        const priceId = subObj.items.data[0]?.price?.id;
        const planDetails = getPlanDetailsByPriceId(priceId);
        const updateData = {
          plan_type: planDetails.id,
          monthly_credits: planDetails.credits,
          current_period_start: new Date(subObj.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subObj.current_period_end * 1000).toISOString(),
          active: subObj.status !== 'canceled',
          cancel_at_period_end: subObj.cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        };
        console.log("Updating subscription on subscription.updated:", updateData);
        const { error } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subObj.id);
        if (error) console.error("Error updating subscription on subscription.updated:", error);
        else console.log("Subscription updated successfully on subscription.updated");
      }
      handled = true;
    } else if (event.type === 'customer.subscription.deleted') {
      console.log("Processing customer.subscription.deleted event");
      const subObj = event.data.object;
      let userId = subObj.metadata?.userId;
      if (!userId) {
        console.log('subscription.deleted: metadata missing userId, performing DB lookup');
        userId = await lookupUserId(supabase, subObj.id as string, subObj.customer as string);
      }
      if (userId) {
        const updateData = {
          active: false,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        };
        console.log("Marking subscription deleted in DB:", updateData);
        const { error } = await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('stripe_subscription_id', subObj.id);
        if (error) console.error("Error marking subscription deleted:", error);
        else console.log("Subscription marked deleted successfully");
      }
      handled = true;
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, handled }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error("General webhook processing error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
