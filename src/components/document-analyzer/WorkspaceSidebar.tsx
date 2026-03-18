import { History, PanelLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisMode } from "@/lib/analyze-document";

type HistoryItem = {
  id: string;
  title: string;
  createdAt: string;
};

type WorkspaceSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  onSelectMode: (mode: AnalysisMode) => void;
  history: HistoryItem[];
};

const promptActions: { label: string; description: string; mode: AnalysisMode }[] = [
  {
    label: "Xülasə çıxar",
    description: "Uzun mətni qısa və aydın şəkildə yekunlaşdırır.",
    mode: "summary",
  },
  {
    label: "Tapşırıqları çıxar",
    description: "Növbəti addımları, deadline və məsulları ayırır.",
    mode: "action_items",
  },
  {
    label: "Riskləri tap",
    description: "Boşluqları, uyğunsuzluqları və riskləri qeyd edir.",
    mode: "risk_scan",
  },
];

export const WorkspaceSidebar = ({ isOpen, onToggle, onSelectMode, history }: WorkspaceSidebarProps) => {
  return (
    <aside
      className={cn(
        "workspace-panel fixed inset-y-4 left-4 z-30 w-[286px] overflow-hidden p-4 transition-transform duration-200 lg:static lg:inset-auto lg:w-full",
        isOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0 lg:w-[84px]",
      )}
    >
      <div className="flex h-full flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className={cn("transition-opacity", isOpen ? "opacity-100" : "lg:opacity-0") }>
            <p className="workspace-label">Navigator</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">DocPilot AI</h2>
          </div>

          <Button variant="surface" size="icon" onClick={onToggle} aria-label="Sidebar toggle">
            <PanelLeft />
          </Button>
        </div>

        <div className={cn("space-y-3", !isOpen && "lg:hidden")}>
          <p className="workspace-label">Saved prompts</p>
          {promptActions.map((action) => (
            <button
              key={action.mode}
              type="button"
              onClick={() => onSelectMode(action.mode)}
              className="workspace-muted w-full text-left transition-transform duration-150 hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {action.label}
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">{action.description}</span>
            </button>
          ))}
        </div>

        <div className={cn("min-h-0 flex-1 space-y-3", !isOpen && "lg:hidden")}>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <p className="workspace-label">History</p>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <div className="workspace-muted text-sm leading-6 text-muted-foreground">
                İlk analizdən sonra nəticələr burada görünəcək.
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="workspace-muted">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.createdAt}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
