
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

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

    // Get the stripe signature from the request header
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      console.error('Missing stripe signature or webhook secret');
      return new Response(
        JSON.stringify({ error: 'Missing stripe signature or webhook secret' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the request body as text
    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle the event
    console.log(`Processing webhook event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planId = session.metadata.planId;
        const credits = parseInt(session.metadata.credits, 10);
        const stripeSubscriptionId = session.subscription;
        const stripeCustomerId = session.customer;

        if (!userId || !planId || !credits || !stripeSubscriptionId) {
          console.error('Missing required metadata in checkout session');
          break;
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        
        // Check if there's an existing subscription for this user
        const { data: existingSubscriptions, error: findError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId);

        if (findError) {
          console.error('Error checking for existing subscription:', findError);
          break;
        }

        if (existingSubscriptions && existingSubscriptions.length > 0) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: stripeSubscriptionId,
              stripe_customer_id: stripeCustomerId,
              plan_type: planId,
              monthly_credits: credits,
              active: true,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
            break;
          }
        } else {
          // Create new subscription
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              stripe_subscription_id: stripeSubscriptionId,
              stripe_customer_id: stripeCustomerId,
              plan_type: planId,
              monthly_credits: credits,
              active: true,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            });

          if (insertError) {
            console.error('Error creating subscription:', insertError);
            break;
          }
        }

        // Add the subscription credits to the user
        await supabase.rpc('add_credits', {
          user_uuid: userId,
          amount: credits,
          description: `Credits from ${planId} subscription`,
          transaction_type: 'SUBSCRIPTION'
        });

        console.log(`Successfully processed subscription for user ${userId}`);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle') {
          const subscriptionId = invoice.subscription;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const metadata = subscription.metadata;
          const userId = metadata.userId;
          const credits = parseInt(metadata.credits, 10);
          
          if (!userId || !credits) {
            // Try to get userId from customer metadata
            const customerId = invoice.customer;
            const customer = await stripe.customers.retrieve(customerId);
            const customerMetadata = customer.metadata;
            
            if (!customerMetadata.userId) {
              console.error('Could not determine userId for recurring payment');
              break;
            }
            
            // Get subscription from our database
            const { data: subscriptions, error: findError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('stripe_subscription_id', subscriptionId);
            
            if (findError || !subscriptions || subscriptions.length === 0) {
              console.error('Could not find subscription in database');
              break;
            }
            
            const dbSubscription = subscriptions[0];
            
            // Update subscription period
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', dbSubscription.id);
            
            if (updateError) {
              console.error('Error updating subscription periods:', updateError);
              break;
            }
            
            // Add the renewal credits to the user
            await supabase.rpc('add_credits', {
              user_uuid: dbSubscription.user_id,
              amount: dbSubscription.monthly_credits,
              description: `Renewal credits from ${dbSubscription.plan_type} subscription`,
              transaction_type: 'RENEWAL'
            });
            
            console.log(`Successfully processed renewal for user ${dbSubscription.user_id}`);
          } else {
            // We have all metadata in the subscription, proceed as normal
            // Update subscription period and add credits
            const { data: subscriptions, error: findError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('stripe_subscription_id', subscriptionId);
            
            if (findError || !subscriptions || subscriptions.length === 0) {
              console.error('Could not find subscription in database');
              break;
            }
            
            const dbSubscription = subscriptions[0];
            
            // Update subscription period
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', dbSubscription.id);
            
            if (updateError) {
              console.error('Error updating subscription periods:', updateError);
              break;
            }
            
            // Add the renewal credits to the user
            await supabase.rpc('add_credits', {
              user_uuid: userId,
              amount: credits,
              description: `Renewal credits from subscription`,
              transaction_type: 'RENEWAL'
            });
            
            console.log(`Successfully processed renewal for user ${userId}`);
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const stripeSubscriptionId = subscription.id;
        
        // Find the subscription in our database
        const { data: subscriptions, error: findError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', stripeSubscriptionId);
        
        if (findError || !subscriptions || subscriptions.length === 0) {
          console.error('Could not find subscription to cancel');
          break;
        }
        
        // Update the subscription to inactive
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', stripeSubscriptionId);
        
        if (updateError) {
          console.error('Error deactivating subscription:', updateError);
          break;
        }
        
        console.log(`Successfully deactivated subscription ${stripeSubscriptionId}`);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
