// @ts-nocheck
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authentication info from the request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('No Authorization header present');
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth header received:', authHeader.substring(0, 20) + '...');

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Get the user from the token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token or authentication failed', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!userData || !userData.user) {
      console.error('No user found for token');
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = userData.user.id;
    console.log('Processing request for user:', userId);
    
    // First check if user already exists in user_credits table
    const { data: existingCredits, error: creditsCheckError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (creditsCheckError) {
      console.error('Error checking if user has credits:', creditsCheckError);
    }
    
    // If user doesn't have credits yet, create an initial record with 1000 credits
    if (!existingCredits) {
      console.log('Creating initial credits for user:', userId);
      
      try {
        // Insert directly without using RPC
        const { data: insertResult, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            credits_remaining: 1000,
            credits_used: 0,
            last_reset_date: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating initial credits:', insertError);
          // Return a success response anyway to prevent blocking the UI
          return new Response(
            JSON.stringify({
              credits: { credits_remaining: 1000, user_id: userId },
              subscription: null,
              transactions: []
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Also add a transaction record
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: 1000,
            description: 'Initial free credits',
            transaction_type: 'INITIAL'
          });
          
        // User has been created, now fetch everything for a clean response
      } catch (initError) {
        console.error('Failed to initialize user credits:', initError);
        // Return a default response to prevent UI blocking
        return new Response(
          JSON.stringify({
            credits: { credits_remaining: 1000, user_id: userId },
            subscription: null,
            transactions: []
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // At this point, user should have credits - fetch the latest
    const { data: credits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error fetching user credits:', fetchError);
      // Return a fallback
      return new Response(
        JSON.stringify({
          credits: existingCredits || { credits_remaining: 1000, user_id: userId },
          subscription: null,
          transactions: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user subscription if any
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle();
    
    // Get recent transactions
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Return the final response
    return new Response(
      JSON.stringify({
        credits: credits || existingCredits,
        subscription: subscription || null,
        transactions: transactions || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error in get-user-credits:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred', 
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
