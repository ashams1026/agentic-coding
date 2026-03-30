import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useExecutions, usePersonas } from "@/hooks";
import type { Execution, Persona } from "@agentops/shared";

function formatElapsed(startedAt: string): string {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

interface AgentCardProps {
  execution: Execution;
  persona: Persona | undefined;
  onClick: () => void;
}

function AgentCard({ execution, persona, onClick }: AgentCardProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(execution.startedAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(execution.startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [execution.startedAt]);

  const avatarColor = persona?.avatar.color ?? "#6b7280";

  return (
    <Card
      className="shrink-0 w-56 cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3">
        <div
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: avatarColor + "20" }}
        >
          <Bot className="h-5 w-5" style={{ color: avatarColor }} />
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {persona?.name ?? "Agent"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {execution.summary || "Working on work item..."}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {elapsed}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActiveAgentsStrip() {
  const navigate = useNavigate();
  const { data: executions } = useExecutions();
  const { data: personas } = usePersonas();

  const runningExecutions = executions?.filter((e) => e.status === "running") ?? [];

  const personaMap = new Map(personas?.map((p) => [p.id, p]));

  if (runningExecutions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Bot className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No active agents</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Active Agents ({runningExecutions.length})
        </p>
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {runningExecutions.map((execution) => (
              <AgentCard
                key={execution.id}
                execution={execution}
                persona={personaMap.get(execution.personaId)}
                onClick={() => navigate("/agents")}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
