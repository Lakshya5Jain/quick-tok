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
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authentication info from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Get the user from the token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = userData.user.id;
    
    // Get user credits (or null if none)
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditsError) {
      console.error('Error fetching credits:', creditsError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user credits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let finalCredits = credits;
    
    // If no credits record exists, create one with 1000 initial credits
    if (!finalCredits) {
      // First insert the user with 1000 initial credits
      const { data: insertedCredits, error: insertError } = await supabase
        .from('user_credits')
        .insert([{ 
          user_id: userId, 
          credits_remaining: 1000,
          last_reset_date: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting initial credits:', insertError);
        return new Response(
          JSON.stringify({ error: 'Error initializing credits' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Then record the transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          user_id: userId,
          amount: 1000,
          description: 'Initial free credits (1000)',
          transaction_type: 'INITIAL'
        }]);
      
      if (transactionError) {
        console.error('Error recording initial transaction:', transactionError);
      }
      
      finalCredits = insertedCredits;
    }
    
    // Get user subscription if any
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle();
    
    // Get recent transactions
    const { data: transactions, error: transError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (transError) {
      console.error('Error fetching transactions:', transError);
    }
    
    return new Response(
      JSON.stringify({
        credits: finalCredits,
        subscription: subscription || null,
        transactions: transactions || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting user credits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
