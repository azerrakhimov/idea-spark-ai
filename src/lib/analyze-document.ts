import { supabase } from "@/integrations/supabase/client";

export type AnalysisMode = "summary" | "action_items" | "risk_scan";

export type AnalysisRequest = {
  content: string;
  mode: AnalysisMode;
};

export type AnalysisResponse = {
  analysis: string;
  title: string;
  mode: AnalysisMode;
};

const fallbackMessages: Record<AnalysisMode, string> = {
  summary: "Xülasə alınmadı.",
  action_items: "Tapşırıqlar çıxarıla bilmədi.",
  risk_scan: "Risk analizi alınmadı.",
};

export async function analyzeDocument({ content, mode }: AnalysisRequest): Promise<AnalysisResponse> {
  const { data, error } = await supabase.functions.invoke("analyze-document", {
    body: { content, mode },
  });

  if (error) {
    throw new Error(error.message || fallbackMessages[mode]);
  }

  // Handle the error field inside the 200 OK response
  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.analysis) {
    throw new Error(fallbackMessages[mode]);
  }

  return {
    analysis: data.analysis,
    title: data.title ?? "Sənəd analizi",
    mode,
  };
}
