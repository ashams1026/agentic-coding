import { Play, Square, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/hooks/use-demo";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function DemoControls() {
  const { running, elapsed, progress, stop } = useDemo();

  if (!running) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
        {/* Pulsing indicator */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>

        <Badge variant="outline" className="text-xs font-semibold gap-1">
          <Bot className="h-3 w-3" />
          DEMO
        </Badge>

        {/* Progress bar */}
        <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Elapsed time */}
        <span className="text-xs font-mono text-muted-foreground w-10 text-center">
          {formatTime(elapsed)}
        </span>

        {/* Stop button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
          onClick={stop}
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      </div>
    </div>
  );
}

export function DemoButton() {
  const { running, start } = useDemo();

  if (running) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={start}
    >
      <Play className="h-3.5 w-3.5" />
      Watch Demo
    </Button>
  );
}
