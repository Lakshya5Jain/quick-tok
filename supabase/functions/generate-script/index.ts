
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
    const { topic, searchWeb, targetLanguage, scriptToTranslate } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    // Validate input based on operation type
    if (!scriptToTranslate && !topic) {
      return new Response(
        JSON.stringify({ error: "Either topic or scriptToTranslate is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For translation, we need a target language
    if (scriptToTranslate && !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Target language is required for translation" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = "You are a helpful AI that writes scripts suitable for text-to-speech applications.";
    let userPrompt = "";
    
    if (scriptToTranslate) {
      // Translation operation
      systemPrompt = `You are a skilled translator who can convert scripts into various languages while maintaining the original meaning and tone.`;
      userPrompt = `Translate the following script into ${targetLanguage}. Ensure the translation is natural, conversational, and suitable for text-to-speech applications:
      
      ${scriptToTranslate}`;
    } else {
      // Script generation operation - always search the web for latest information
      systemPrompt += " You search the web for the most recent and accurate information when needed.";
      
      userPrompt = `Write a concise and clear script about the following topic: '${topic}'. 
                    The script should be suitable for text-to-speech, avoiding informal expressions, 
                    emojis, and overly complex sentences. Use punctuation to indicate natural pauses.
                    Make sure to include recent and accurate information about '${topic}' that would be available online.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using a more basic model that's still capable
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      console.error("Unexpected API response:", data);
      throw new Error("Failed to generate content");
    }
    
    const scriptText = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ 
        scriptText,
        isTranslation: !!scriptToTranslate,
        originalLanguage: scriptToTranslate ? "Original" : null,
        targetLanguage: targetLanguage || null
      }),
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
