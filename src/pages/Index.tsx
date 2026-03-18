import { useMemo, useState } from "react";
import { FileText, Sparkles, Upload, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { AnalysisResponseCard } from "@/components/document-analyzer/AnalysisResponseCard";
import { WorkspaceSidebar } from "@/components/document-analyzer/WorkspaceSidebar";
import { analyzeDocument, type AnalysisMode } from "@/lib/analyze-document";

const presets: { mode: AnalysisMode; label: string; description: string }[] = [
  {
    mode: "summary",
    label: "İcmal xülasə",
    description: "Uzun sənədləri qısa, aydın və rəhbər səviyyəsində xülasəyə çevir.",
  },
  {
    mode: "action_items",
    label: "Tapşırıqlar",
    description: "Görüləcək işləri, açıq sualları və növbəti addımları çıxar.",
  },
  {
    mode: "risk_scan",
    label: "Risk analizi",
    description: "Boşluqları, ziddiyyətləri və risk ehtimallarını aşkar et.",
  },
];

const sampleText = `Müştəri ilə keçirilən görüşdə yeni onboarding axınının gecikdiyi qeyd olundu. Dizayn komandasının son ekranları cümə axşamına qədər təqdim etməsi gözlənilir. Texniki komandada API inteqrasiyası üçün əlavə sənədləşmə çatışmır. Satış komandası enterprise plan üçün yeni qiymət paketinin gələn həftə hazır olmasını istəyir. Hüquq şöbəsi data retention bəndlərinin müqavilədə daha aydın göstərilməsini tələb edir.`;

const Index = () => {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [content, setContent] = useState(sampleText);
  const [mode, setMode] = useState<AnalysisMode>("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);

  const activePreset = useMemo(() => presets.find((preset) => preset.mode === mode) ?? presets[0], [mode]);

  const runAnalysis = async (selectedMode = mode) => {
    if (content.trim().length < 80) {
      toast({
        title: "Mətn qısadır",
        description: "Analiz üçün bir az daha uzun sənəd və ya qeyd daxil edin.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await analyzeDocument({ content, mode: selectedMode });
      setResult({ title: response.title, content: response.analysis });
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          title: response.title,
          createdAt: new Date().toLocaleString("az-AZ", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...prev,
      ].slice(0, 6));
    } catch (error) {
      toast({
        title: "Analiz alınmadı",
        description: error instanceof Error ? error.message : "Naməlum xəta baş verdi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setContent(text);
      toast({
        title: "Fayl yükləndi",
        description: `${file.name} oxundu və analiz üçün hazırdır.`,
      });
    } catch {
      toast({
        title: "Fayl oxunmadı",
        description: "Hazırda text əsaslı fayllar daha yaxşı işləyir: .txt, .md, .csv, .json",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    if (!result?.content) return;
    await navigator.clipboard.writeText(result.content);
    toast({ title: "Kopyalandı", description: "Analiz mətni clipboard-a göndərildi." });
  };

  const handleShare = async () => {
    if (!result?.content) return;

    if (navigator.share) {
      await navigator.share({ title: result.title, text: result.content });
      return;
    }

    await handleCopy();
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="workspace-shell">
        <WorkspaceSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          onSelectMode={(nextMode) => {
            setMode(nextMode);
            void runAnalysis(nextMode);
          }}
          history={history}
        />

        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Yan panel arxa fonu"
            className="fixed inset-0 z-20 bg-foreground/10 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <section className="relative z-10 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col gap-6 lg:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <header className="workspace-panel hero-grid overflow-hidden p-8 md:p-10 animate-fade-in-up">
                <div className="max-w-2xl space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    IdeaSpark AI · Sənəd Analizi
                  </div>
                  <div className="space-y-3">
                    <h1 className="font-display text-4xl leading-tight tracking-tight text-foreground md:text-6xl">
                      Mətnləri qərara çevirmək üçün ağıllı analiz masası.
                    </h1>
                    <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                      Müqavilə, görüş qeydi, brief və ya araşdırma mətni yapışdırın — AI sizə xülasə, tapşırıqlar və riskləri saniyələr içində çıxarsın.
                    </p>
                  </div>
                </div>

                <div className="workspace-panel ml-auto hidden w-full max-w-sm p-5 md:block animate-scale-in" style={{ animationDelay: "0.3s" }}>
                  <p className="workspace-label">AI düşünür</p>
                  <div className="mt-4 space-y-4">
                    <div className="thinking-bar" />
                    <div className="thinking-bar w-4/5" />
                    <div className="thinking-bar w-3/5" />
                  </div>
                  <p className="mt-5 text-sm leading-6 text-muted-foreground">
                    Təmiz, sürətli və fokuslanmış AI iş axını — sizin üçün hazır.
                  </p>
                </div>
              </header>

              <div className="grid gap-4 xl:grid-cols-3">
                {presets.map((preset, index) => (
                  <button
                    key={preset.mode}
                    type="button"
                    onClick={() => setMode(preset.mode)}
                    className={`workspace-muted text-left transition-all duration-200 animate-fade-in-up ${mode === preset.mode ? "ring-2 ring-ring shadow-glow" : "hover:-translate-y-1 hover:shadow-glow/50"}`}
                    style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                  >
                    <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>

              <Card className="workspace-panel border-none p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="workspace-label">Giriş</p>
                      <h2 className="mt-2 text-xl font-semibold text-foreground">{activePreset.label}</h2>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-soft transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:shadow-glow/30">
                      <Upload className="h-4 w-4" />
                      Text fayl yüklə
                      <input type="file" accept=".txt,.md,.csv,.json" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>

                  <div className="floating-composer">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-secondary p-2 text-secondary-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Textarea
                          value={content}
                          onChange={(event) => setContent(event.target.value)}
                          placeholder="Sənəd mətnini bura yapışdırın..."
                          className="min-h-[240px] resize-none border-0 bg-transparent px-0 py-0 text-base leading-7 shadow-none focus-visible:ring-0"
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">Min. 80 simvol · AI cavabı Azərbaycan dilində qaytarılır</p>
                      <Button variant="hero" size="lg" onClick={() => void runAnalysis()} disabled={isLoading} className="transition-all duration-200 hover:shadow-glow">
                        <WandSparkles />
                        {isLoading ? "Analiz edilir..." : "AI ilə analiz et"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="w-full lg:max-w-xl">
              {result ? (
                <div className="animate-scale-in">
                  <AnalysisResponseCard
                    title={result.title}
                    content={result.content}
                    timestamp={new Date().toLocaleString("az-AZ")}
                    onCopy={() => void handleCopy()}
                    onRegenerate={() => void runAnalysis()}
                    onShare={() => void handleShare()}
                  />
                </div>
              ) : (
                <Card className="workspace-panel flex min-h-[420px] flex-col justify-between overflow-hidden border-none p-6 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                  <div>
                    <p className="workspace-label">Önbaxış</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">İlk nəticəniz burada görünəcək</h2>
                    <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                      Bu versiya xüsusilə görüş qeydləri, müqavilə mətnləri, məhsul briefləri və daxili sənədlər üçün idealdır.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {[
                      "Qısa rəhbər xülasəsi",
                      "Əsas qərarlar və tapşırıqlar",
                      "Risk və boşluq siqnalları",
                    ].map((item, index) => (
                      <div key={item} className="workspace-muted flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                        <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse-glow" />
                        <span className="text-sm font-medium text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Index;
