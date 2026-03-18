import { Copy, RefreshCw, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AnalysisResponseCardProps = {
  content: string;
  title: string;
  timestamp: string;
  onCopy: () => void;
  onRegenerate: () => void;
  onShare: () => void;
};

export const AnalysisResponseCard = ({
  content,
  title,
  timestamp,
  onCopy,
  onRegenerate,
  onShare,
}: AnalysisResponseCardProps) => {
  return (
    <Card className="group workspace-panel overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/50 pb-4">
        <div className="space-y-2">
          <p className="workspace-label">AI nəticəsi</p>
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{timestamp}</p>
        </div>

        <div className="flex items-center gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <Button variant="surface" size="icon" onClick={onCopy} aria-label="Kopyala">
            <Copy />
          </Button>
          <Button variant="surface" size="icon" onClick={onRegenerate} aria-label="Yenidən yarat">
            <RefreshCw />
          </Button>
          <Button variant="surface" size="icon" onClick={onShare} aria-label="Paylaş">
            <Share2 />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="prose prose-slate max-w-none whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
          {content}
        </div>
      </CardContent>
    </Card>
  );
};
