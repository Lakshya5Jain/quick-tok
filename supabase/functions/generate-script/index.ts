
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const { topic } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system", 
            content: "You are a helpful AI that writes scripts suitable for text-to-speech applications."
          },
          {
            role: "user", 
            content: `Write a concise and clear script about the following topic: '${topic}'. 
                      The script should be suitable for text-to-speech, avoiding informal expressions, 
                      emojis, and overly complex sentences. Use punctuation to indicate natural pauses.`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const scriptText = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ scriptText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error generating script:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
