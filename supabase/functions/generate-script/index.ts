// @ts-nocheck
// deno-lint-ignore-file

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
    const { topic, vibes, language } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!topic || !vibes || !language) {
      return new Response(
        JSON.stringify({ error: "Topic, vibes and language are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map vibes keys to prompt snippets
    const snippetMap: Record<string,string> = {
      funny:       "Make it playful, super funny and edgy, use light sarcasm and punch-line timing.",
      story:       "Tell it like a first-person story with a hook and payoff.",
      educational: "Deliver surprising facts clearly, like a mini-lesson.",
      serious:     "Use a calm, sober tone, no slang.",
      motivational:"Speak directly to the viewer, energy high, call to action. Be motivational and inspiring.",
      shock:       "Open with a jaw-drop statistic or twist.",
      chill:       "Slow pace, soothing wording, café-lofi vibe.",
      rant:        "Opinionated, strong language and swears words, rhetorical questions."
    };
    const snippet = snippetMap[vibes] || "";

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
            content: `You write viral TikTok / Reels voice-over lines.\n* Hard limit: 100 words (≈140 tokens).\n* Form: 1–3 sentences max—feel free to drop to a single punch-line if it hits.\n* Insert natural commas/periods so TTS pauses sound human.`
          },
          {
            role: "user",
            content: `${snippet}\nLanguage: ${language}\nTopic: ${topic}`
          }
        ],
        max_tokens: 140,
        temperature: 0.65,
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
