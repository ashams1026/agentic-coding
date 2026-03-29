import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Play, Square, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PersonaModel } from "@agentops/shared";

// ── Mock output chunks ──────────────────────────────────────────

interface OutputLine {
  id: number;
  text: string;
  type: "text" | "thinking" | "tool" | "result";
}

function generateMockOutput(
  prompt: string,
  personaName: string,
  model: PersonaModel,
): OutputLine[] {
  const lines: OutputLine[] = [
    { id: 1, text: `[${model}] Running as ${personaName}...`, type: "thinking" },
    { id: 2, text: `Processing prompt: "${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}"`, type: "thinking" },
    { id: 3, text: "", type: "text" },
    { id: 4, text: "Analyzing request and determining approach...", type: "thinking" },
    { id: 5, text: "", type: "text" },
    { id: 6, text: "Tool call: Read(\"src/index.ts\")", type: "tool" },
    { id: 7, text: "  → Read 42 lines from src/index.ts", type: "result" },
    { id: 8, text: "", type: "text" },
    { id: 9, text: "Tool call: Grep(\"TODO\", path: \"src/\")", type: "tool" },
    { id: 10, text: "  → Found 3 matches across 2 files", type: "result" },
    { id: 11, text: "", type: "text" },
    { id: 12, text: "Based on my analysis, here is my response:", type: "text" },
    { id: 13, text: "", type: "text" },
    { id: 14, text: `I've reviewed the codebase and can address your request about "${prompt.slice(0, 40)}".`, type: "text" },
    { id: 15, text: "The implementation follows the existing patterns and conventions.", type: "text" },
    { id: 16, text: "", type: "text" },
    { id: 17, text: `[${model}] Run complete — $0.${model === "opus" ? "42" : model === "sonnet" ? "18" : "03"} cost`, type: "thinking" },
  ];
  return lines;
}

// ── Line type styles ────────────────────────────────────────────

const lineStyles: Record<OutputLine["type"], string> = {
  text: "text-foreground",
  thinking: "text-muted-foreground italic",
  tool: "text-blue-500 dark:text-blue-400",
  result: "text-emerald-600 dark:text-emerald-400",
};

// ── Props ───────────────────────────────────────────────────────

interface TestRunPanelProps {
  personaName: string;
  model: PersonaModel;
}

// ── Main component ──────────────────────────────────────────────

export function TestRunPanel({ personaName, model }: TestRunPanelProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<OutputLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to bottom when new lines appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleRun = useCallback(() => {
    if (!prompt.trim() || running) return;

    const allLines = generateMockOutput(prompt, personaName, model);
    setLines([]);
    setRunning(true);

    // Stream lines one at a time with delay
    let idx = 0;
    const streamNext = () => {
      if (idx < allLines.length) {
        setLines((prev) => [...prev, allLines[idx]!]);
        idx++;
        timerRef.current = setTimeout(streamNext, 150 + Math.random() * 200);
      } else {
        setRunning(false);
      }
    };
    streamNext();
  }, [prompt, running, personaName, model]);

  const handleStop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRunning(false);
    setLines((prev) => [
      ...prev,
      { id: Date.now(), text: "[Stopped by user]", type: "thinking" },
    ]);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors",
            "hover:bg-accent/50",
            open && "bg-accent/30",
          )}
        >
          <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium flex-1">Test Run</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {/* Prompt input + buttons */}
          <div className="flex items-center gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a sample prompt to test..."
              className="h-8 text-xs flex-1"
              disabled={running}
            />
            {running ? (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs gap-1 shrink-0"
                onClick={handleStop}
              >
                <Square className="h-3 w-3" />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 text-xs gap-1 shrink-0"
                onClick={handleRun}
                disabled={!prompt.trim()}
              >
                <Play className="h-3 w-3" />
                Test
              </Button>
            )}
          </div>

          {/* Mini terminal output */}
          <div
            ref={scrollRef}
            className={cn(
              "rounded-md border border-border bg-background",
              "font-mono text-[11px] leading-relaxed",
              "min-h-[100px] max-h-[200px] overflow-y-auto p-2",
            )}
          >
            {lines.length === 0 ? (
              <p className="text-muted-foreground/40 italic text-center py-6">
                {running ? "Starting..." : "Run a test to see output here."}
              </p>
            ) : (
              lines.map((line) => (
                <div key={line.id} className={lineStyles[line.type]}>
                  {line.text || "\u00A0"}
                </div>
              ))
            )}
            {running && lines.length > 0 && (
              <div className="inline-block w-1.5 h-3.5 bg-foreground animate-pulse ml-0.5" />
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
