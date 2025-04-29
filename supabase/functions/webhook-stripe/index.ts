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
    'price_1RIJ3BQAqWYQiLZoyvmOZFCx': { id: 'one_time_credit', name: 'Additional Credits', credits: 100 }
  };
  return plans[priceId];
}

// Helper to safely add credits with error handling
async function safelyAddCredits(supabase, user_uuid, amount, description, transaction_type) {
  try {
    console.log(`Adding ${amount} credits to user ${user_uuid} with description: ${description}`);
    
    // First check if this transaction type already happened within the last hour for this user
    // This prevents duplicate credit allocations if webhook fires multiple times
    const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Original check looking only at transaction_type
    const { data: recentTransaction, error: recentError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user_uuid)
      .eq('transaction_type', transaction_type)
      .gt('created_at', lastHour)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (recentTransaction && recentTransaction.length > 0) {
      console.log(`Skipping duplicate credit allocation - found recent ${transaction_type} transaction:`, recentTransaction[0].id);
      return { success: true, data: "Credits already allocated", skipped: true };
    }

    // Add a more thorough check for subscription-related transactions
    if (transaction_type === 'subscription_created' || transaction_type === 'subscription_renewed' || transaction_type === 'subscription_manual') {
      // Get the last 24 hours of transactions for this user to check more thoroughly
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentSubs, error: recentSubsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user_uuid)
        .in('transaction_type', ['subscription_created', 'subscription_renewed', 'subscription_manual'])
        .gt('created_at', last24Hours)
        .order('created_at', { ascending: false });
        
      if (recentSubs && recentSubs.length > 0) {
        console.log(`Found ${recentSubs.length} recent subscription transactions in last 24 hours`);
        
        // Check if any of them have the same amount and description pattern
        const descPattern = description.split(' ')[0]; // Get the first word of description
        const similar = recentSubs.filter(tx => 
          tx.amount === amount && 
          tx.description.includes(descPattern)
        );
        
        if (similar.length > 0) {
          console.log(`Skipping possible duplicate - found similar transaction with same amount and description pattern:`, similar[0].id);
          return { success: true, data: "Similar transaction already exists", skipped: true };
        }
      }
    }
    
    // If no duplicates were found, add the credits
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
    
    console.log('Credits added successfully:', data);
    return { success: true, data };
  } catch (e) {
    console.error('Exception in add_credits:', e);
    return { success: false, error: e };
  }
}

serve(async (req) => {
  console.log("Webhook endpoint called with method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Responding to OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET environment variable is not set");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), 
                       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  console.log("Received Stripe signature:", signature ? "Present" : "Missing");
  
  const body = await req.text();
  console.log("Webhook payload (first 100 chars):", body.substring(0, 100) + "...");

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials missing:", !supabaseUrl ? "URL missing" : "Key missing");
    return new Response(JSON.stringify({ error: "Database configuration error" }), 
                       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Attempting to construct Stripe event from webhook payload");
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log("Webhook verified! Event type:", event.type);
    
    // Handle the event based on its type
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log("Processing checkout.session.completed event");
        const session = event.data.object;
        console.log("Session data:", JSON.stringify(session, null, 2));
        
        // Check if this is a one-time credit purchase
        if (session.metadata?.isOneTime === 'true' && session.metadata?.creditAmount) {
          console.log("Processing one-time credit purchase");
          
          // Get the user ID from the metadata
          const userId = session.metadata.userId;
          const creditAmount = parseInt(session.metadata.creditAmount, 10);
          
          if (!userId || isNaN(creditAmount)) {
            console.error('Missing userId or invalid creditAmount in session metadata');
            break;
          }
          
          console.log(`Adding ${creditAmount} one-time credits to user ${userId}`);
          
          // Add the purchased credits to the user
          const addCreditsResult = await safelyAddCredits(
            supabase,
            userId,
            creditAmount,
            `Additional ${creditAmount} credit purchase`,
            'one_time_purchase'
          );
          
          console.log("Add one-time credits result:", JSON.stringify(addCreditsResult, null, 2));
          break;
        }
        
        // If not a one-time purchase, continue with subscription processing
        // Retrieve the subscription details
        console.log("Retrieving subscription details for:", session.subscription);
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        console.log("Subscription retrieved:", JSON.stringify(subscription, null, 2));
        
        // Get the user ID from the metadata
        const userId = session.metadata.userId;
        const planId = session.metadata.planId;
        const priceId = session.metadata.priceId;
        
        console.log("User ID from metadata:", userId);
        console.log("Plan ID from metadata:", planId);
        console.log("Price ID from metadata:", priceId);
        
        if (!userId) {
          console.error('Missing userId in session metadata');
          break;
        }
        
        // First try to use the planId from metadata directly
        let planDetails;
        if (planId) {
          // Get plan details from our static map using the exact planId provided
          planDetails = {
            'basic': { id: 'basic', name: 'Basic', credits: 1000 },
            'standard': { id: 'standard', name: 'Standard', credits: 2500 },
            'premium': { id: 'premium', name: 'Premium', credits: 10000 }
          }[planId];
          
          console.log("Using plan details from metadata planId:", planId);
        } 
        
        // If we couldn't get plan details from planId, try the price ID lookup
        if (!planDetails && subscription?.items?.data?.[0]?.price?.id) {
          planDetails = getPlanDetailsByPriceId(subscription.items.data[0].price.id);
          console.log("Using plan details from Stripe price ID lookup");
        }
        
        if (!planDetails) {
          console.error('Plan details not found for planId:', planId);
          console.error('And price ID:', subscription?.items?.data?.[0]?.price?.id);
          break;
        }
        
        console.log("Plan details:", JSON.stringify(planDetails, null, 2));
        
        // First check if there are any existing active subscriptions and mark them as inactive
        console.log("Checking for existing subscriptions for user:", userId);
        const { data: existingSubscriptions, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('active', true);
        
        if (subscriptionsError) {
          console.error('Error fetching existing subscriptions:', subscriptionsError);
        } else if (existingSubscriptions && existingSubscriptions.length > 0) {
          console.log(`Found ${existingSubscriptions.length} existing active subscription(s). Marking inactive before adding new one.`);
          
          for (const existingSub of existingSubscriptions) {
            // Skip if this is the same subscription we're updating
            if (existingSub.stripe_subscription_id === subscription.id) continue;
            
            console.log(`Marking subscription ${existingSub.id} inactive`);
            const { error: deactivateError } = await supabase
              .from('subscriptions')
              .update({ 
                active: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSub.id);
            
            if (deactivateError) {
              console.error(`Error deactivating subscription ${existingSub.id}:`, deactivateError);
            }
          }
        }
        
        const subscriptionData = {
          user_id: userId,
          plan_type: planDetails.id,
          monthly_credits: planDetails.credits,
          active: true,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end || false
        };
        
        console.log("Preparing subscription data:", JSON.stringify(subscriptionData, null, 2));
        
        // Check if a subscription record already exists for this specific subscription ID
        console.log("Checking for existing subscription record for subscription ID:", subscription.id);
        const { data: existingSubscription, error: selectError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
        
        if (selectError) {
          console.error("Error checking for existing subscription:", selectError);
        }
        
        // Insert or update the subscription record
        if (existingSubscription) {
          console.log("Updating existing subscription record");
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('stripe_subscription_id', subscription.id);
          
          if (updateError) {
            console.error('Error updating subscription:', updateError);
          } else {
            console.log("Subscription updated successfully");
          }
        } else {
          console.log("Creating new subscription record");
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              ...subscriptionData,
              created_at: new Date().toISOString(),
            });
          
          if (insertError) {
            console.error('Error inserting subscription:', insertError);
          } else {
            console.log("Subscription created successfully");
          }
        }
        
        // Add the subscription credits to the user
        console.log("Adding initial credits for subscription");
        const addCreditsResult = await safelyAddCredits(
          supabase,
          userId,
          planDetails.credits,
          `Initial credits for ${planDetails.name} subscription`,
          'subscription_created'
        );
        console.log("Add credits result:", JSON.stringify(addCreditsResult, null, 2));
        break;
      }
      
      case 'invoice.payment_succeeded': {
        console.log("Processing invoice.payment_succeeded event");
        const invoice = event.data.object;
        
        // Only process recurring subscription invoices
        if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
          console.log("Processing recurring subscription invoice");
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(invoice.customer);
          
          // Find the user_id linked to this customer
          console.log("Looking up user for subscription:", subscription.id);
          const { data: subscriptionData, error: lookupError } = await supabase
            .from('subscriptions')
            .select('user_id, plan_type')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();
          
          if (lookupError) {
            console.error("Error looking up subscription:", lookupError);
          }
          
          if (!subscriptionData?.user_id) {
            console.error('Could not find user for subscription:', subscription.id);
            break;
          }
          
          const userId = subscriptionData.user_id;
          console.log("Found user ID:", userId);
          
          const planDetails = getPlanDetailsByPriceId(subscription.items.data[0].price.id);
          
          if (!planDetails) {
            console.error('Plan details not found for price ID:', subscription.items.data[0].price.id);
            break;
          }
          
          console.log("Plan details:", JSON.stringify(planDetails, null, 2));
          
          // Update subscription record with new period dates
          console.log("Updating subscription period dates");
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
              active: true,
              cancel_at_period_end: subscription.cancel_at_period_end || false
            })
            .eq('stripe_subscription_id', subscription.id);
          
          if (updateError) {
            console.error('Error updating subscription periods:', updateError);
          } else {
            console.log("Subscription periods updated successfully");
          }
          
          // Add the subscription credits to the user
          console.log("Adding renewal credits for subscription");
          const addCreditsResult = await safelyAddCredits(
            supabase,
            userId,
            planDetails.credits,
            `Monthly credits for ${planDetails.name} subscription`,
            'subscription_renewed'
          );
          
          console.log("Add credits result:", JSON.stringify(addCreditsResult, null, 2));
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        console.log("Processing customer.subscription.updated event");
        const subscription = event.data.object;
        
        // Find the user linked to this subscription
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
        
        if (!subscriptionData?.user_id) {
          console.error('Could not find user for subscription:', subscription.id);
          break;
        }
        
        const userId = subscriptionData.user_id;
        
        // If the subscription was canceled (but still active until period end)
        if (subscription.cancel_at_period_end) {
          console.log("Subscription is marked to cancel at period end");
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              updated_at: new Date().toISOString(),
              cancel_at_period_end: true
            })
            .eq('stripe_subscription_id', subscription.id);
          
          if (updateError) {
            console.error('Error updating subscription for cancellation:', updateError);
          } else {
            console.log("Subscription marked for cancellation at period end");
          }
        }
        
        // If the plan was changed
        const planDetails = getPlanDetailsByPriceId(subscription.items.data[0].price.id);
        if (planDetails) {
          console.log("Plan details found, updating subscription plan type");
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              plan_type: planDetails.id,
              monthly_credits: planDetails.credits,
              updated_at: new Date().toISOString(),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end || false
            })
            .eq('stripe_subscription_id', subscription.id);
          
          if (updateError) {
            console.error('Error updating plan details:', updateError);
          } else {
            console.log("Plan details updated successfully");
          }
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        console.log("Processing customer.subscription.deleted event");
        const subscription = event.data.object;
        
        // Find the user linked to this subscription
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
        
        if (!subscriptionData?.user_id) {
          console.error('Could not find user for subscription:', subscription.id);
          break;
        }
        
        // Mark the subscription as inactive
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            active: false,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (updateError) {
          console.error('Error marking subscription inactive:', updateError);
        } else {
          console.log("Subscription marked as inactive");
        }
        
        break;
      }
    }
    
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook verification or processing failed:", err.message);
    console.error("Error details:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
