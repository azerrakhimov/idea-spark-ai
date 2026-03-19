import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AnalysisMode = "summary" | "action_items" | "risk_scan";

const prompts: Record<AnalysisMode, { title: string; instructions: string }> = {
  summary: {
    title: "Sənəd xülasəsi",
    instructions:
      "Return a crisp executive summary in Azerbaijani with 3 sections: 1) Qısa xülasə 2) Əsas məqamlar 3) Növbəti addım. Keep it practical and concise.",
  },
  action_items: {
    title: "Tapşırıqlar və növbəti addımlar",
    instructions:
      "Analyze the document and extract actionable next steps in Azerbaijani. Use 3 sections: 1) Prioritet tapşırıqlar 2) Açıq suallar 3) Tövsiyə olunan növbəti addım. Make it operational.",
  },
  risk_scan: {
    title: "Risk və boşluq analizi",
    instructions:
      "Review the document in Azerbaijani and identify risks, missing information, contradictions, and unclear assumptions. Use 3 sections: 1) Risklər 2) Boşluqlar 3) Tövsiyə. Be specific.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, mode = "summary" } = await req.json();

    if (typeof content !== "string" || content.trim().length < 80) {
      return new Response(JSON.stringify({ error: "Analiz üçün ən azı 80 simvolluq mətn lazımdır." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(mode in prompts)) {
      return new Response(JSON.stringify({ error: "Yanlış analiz modu göndərildi." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const selectedPrompt = prompts[mode as AnalysisMode];

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${selectedPrompt.instructions}\n\nSistem təlimatı: Siz sənəd analizi üzrə peşəkar asistansınız. Həmişə Azərbaycan dilində cavab verin. Strukturlaşdırılmış, praktiki və birbaşa olun.\n\nAnaliz edilməli sənəd:\n${content.trim()}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 4096, // Increased from 2048 to allow longer responses
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error status:", geminiResponse.status);
      console.error("Gemini API error details:", JSON.stringify(data, null, 2));
      
      const errorMessage = data.error?.message || "Gemini analizi alınarkən xəta baş verdi.";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: geminiResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const candidate = data.candidates?.[0];
    const analysis = candidate?.content?.parts?.[0]?.text?.trim();

    if (!analysis) {
      console.error("No analysis in Gemini response:", JSON.stringify(data, null, 2));
      
      // Check for blocked content or other reasons
      if (candidate?.finishReason === "SAFETY") {
        throw new Error("Məzmun təhlükəsizlik filtrinə görə bloklandı.");
      } else if (candidate?.finishReason === "MAX_TOKENS") {
        throw new Error("Analiz üçün kifayət qədər yer qalmadı (token limiti).");
      }
      
      throw new Error("Gemini cavabında analiz tapılmadı.");
    }

    return new Response(
      JSON.stringify({
        analysis,
        mode,
        title: selectedPrompt.title,
        finishReason: candidate?.finishReason,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("analyze-document error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Naməlum xəta",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
