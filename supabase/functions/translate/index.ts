import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, sourceLang, targetLang } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!text || !targetLang) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAutoDetect = sourceLang === "Auto";

    const systemPrompt = isAutoDetect
      ? `You are an expert translator specializing in Bangla (Bengali) and English.
First, detect the language of the input text (either Bangla or English).
Then translate it to ${targetLang}.
Respond in this exact JSON format: {"detectedLanguage": "Bangla" or "English", "translatedText": "your translation"}
Only return the JSON, nothing else.`
      : `You are an expert translator specializing in Bangla (Bengali) and English translation. 
Translate the given text accurately while preserving:
- Natural tone and meaning
- Cultural context and nuances
- Proper grammar and sentence structure
- Idiomatic expressions where appropriate

Only return the translated text, nothing else. No explanations, no quotes, no extra text.`;

    const userPrompt = isAutoDetect
      ? `Detect the language and translate to ${targetLang}:\n\n${text}`
      : `Translate the following text from ${sourceLang} to ${targetLang}:\n\n${text}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Translation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "";

    if (isAutoDetect) {
      try {
        // Try to parse JSON response
        const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify({
          translatedText: parsed.translatedText || "",
          detectedLanguage: parsed.detectedLanguage || "",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // Fallback if JSON parsing fails
        return new Response(JSON.stringify({ translatedText: rawContent }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ translatedText: rawContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
