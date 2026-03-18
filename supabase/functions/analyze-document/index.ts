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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const selectedPrompt = prompts[mode as AnalysisMode];

    const gatewayResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content:
              "You are a precise document analysis assistant. Always reply in Azerbaijani. Be structured, practical, and direct. Never mention internal reasoning.",
          },
          {
            role: "user",
            content: `${selectedPrompt.instructions}\n\nDocument to analyze:\n${content.trim()}`,
          },
        ],
      }),
    });

    if (!gatewayResponse.ok) {
      if (gatewayResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI limiti doldu, bir az sonra yenidən cəhd edin." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (gatewayResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI krediti kifayət etmir. Workspace usage bölməsini yoxlayın." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const details = await gatewayResponse.text();
      console.error("AI gateway error:", gatewayResponse.status, details);
      return new Response(JSON.stringify({ error: "AI analizi alınarkən xəta baş verdi." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await gatewayResponse.json();
    const analysis = data.choices?.[0]?.message?.content?.trim();

    if (!analysis) {
      throw new Error("AI response did not include analysis content");
    }

    return new Response(
      JSON.stringify({
        analysis,
        mode,
        title: selectedPrompt.title,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
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
      },
    );
  }
});
