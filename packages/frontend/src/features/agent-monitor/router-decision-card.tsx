import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WORKFLOW } from "@agentops/shared";

interface RouterDecision {
  nextState: string;
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

const CONFIDENCE_STYLES = {
  high: { dot: "bg-emerald-500", label: "High", text: "text-emerald-500" },
  medium: { dot: "bg-amber-500", label: "Medium", text: "text-amber-500" },
  low: { dot: "bg-red-500", label: "Low", text: "text-red-500" },
} as const;

function getStateColor(stateName: string): string {
  const state = WORKFLOW.states.find((s) => s.name === stateName);
  return state?.color ?? "#6b7280";
}

export function isRouterDecision(output: unknown): output is RouterDecision {
  if (!output || typeof output !== "object") return false;
  const o = output as Record<string, unknown>;
  return (
    typeof o.nextState === "string" &&
    typeof o.reasoning === "string" &&
    typeof o.confidence === "string" &&
    ["high", "medium", "low"].includes(o.confidence as string)
  );
}

interface RouterDecisionCardProps {
  output: RouterDecision;
  compact?: boolean;
}

export function RouterDecisionCard({ output, compact }: RouterDecisionCardProps) {
  const color = getStateColor(output.nextState);
  const conf = CONFIDENCE_STYLES[output.confidence];

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <Badge
          variant="outline"
          className="px-1.5 py-0 text-[10px] font-medium border"
          style={{ borderColor: color, color }}
        >
          {output.nextState}
        </Badge>
        <span className={cn("flex items-center gap-1", conf.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", conf.dot)} />
          {conf.label}
        </span>
      </span>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="px-2 py-0.5 text-xs font-semibold border-2"
            style={{ borderColor: color, color }}
          >
            {output.nextState}
          </Badge>
          <span className="text-xs text-muted-foreground">Router Decision</span>
        </div>
        <span className={cn("flex items-center gap-1.5 text-xs font-medium", conf.text)}>
          <span className={cn("h-2 w-2 rounded-full", conf.dot)} />
          {conf.label} confidence
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{output.reasoning}</p>
    </div>
  );
}
