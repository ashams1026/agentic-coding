import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowRightLeft,
  Bot,
  CheckCircle2,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useExecutions, useProposals, usePersonas } from "@/hooks";
import { mockWs } from "@/mocks/ws";
import type { Persona } from "@agentops/shared";
import type {
  WsEvent,
  AgentStartedEvent,
  AgentCompletedEvent,
  StateChangeEvent,
  CommentCreatedEvent,
  ProposalCreatedEvent,
} from "@agentops/shared";
import { fixtures } from "@/mocks/fixtures";

// ── Unified activity event ────────────────────────────────────────

type ActivityEventType =
  | "state_change"
  | "agent_completed"
  | "comment_posted"
  | "proposal_created";

interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  description: string;
  personaId: string | null;
  targetPath: string;
  timestamp: string;
  isLive?: boolean;
}

// ── Icon/color mapping ────────────────────────────────────────────

const eventConfig: Record<
  ActivityEventType,
  { icon: React.ReactNode; colorClass: string }
> = {
  state_change: {
    icon: <ArrowRightLeft className="h-4 w-4" />,
    colorClass: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  },
  agent_completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    colorClass: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
  },
  comment_posted: {
    icon: <MessageSquare className="h-4 w-4" />,
    colorClass: "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
  },
  proposal_created: {
    icon: <FileCheck className="h-4 w-4" />,
    colorClass: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
  },
};

// ── Relative time ─────────────────────────────────────────────────

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Build events from data ────────────────────────────────────────

function useActivityEvents(): ActivityEvent[] {
  const { data: executions } = useExecutions();
  const { data: proposals } = useProposals();

  const events: ActivityEvent[] = [];

  // Agent completed events from executions
  if (executions) {
    for (const exec of executions) {
      if (exec.status === "completed") {
        events.push({
          id: `exec-${exec.id}`,
          type: "agent_completed",
          description: exec.summary || `Agent completed ${exec.targetType}`,
          personaId: exec.personaId,
          targetPath:
            exec.targetType === "story"
              ? `/stories/${exec.targetId}`
              : `/tasks/${exec.targetId}`,
          timestamp: exec.completedAt ?? exec.startedAt,
        });
      }
    }
  }

  // Comment events from fixture comments (non-system)
  for (const comment of fixtures.comments) {
    if (comment.authorType === "system") {
      // System comments are state changes
      events.push({
        id: `sc-${comment.id}`,
        type: "state_change",
        description: comment.content,
        personaId: null,
        targetPath:
          comment.targetType === "story"
            ? `/stories/${comment.targetId}`
            : `/tasks/${comment.targetId}`,
        timestamp: comment.createdAt,
      });
    } else {
      events.push({
        id: `cmt-${comment.id}`,
        type: "comment_posted",
        description: `${comment.authorName}: ${comment.content.slice(0, 80)}${comment.content.length > 80 ? "..." : ""}`,
        personaId: comment.authorId,
        targetPath:
          comment.targetType === "story"
            ? `/stories/${comment.targetId}`
            : `/tasks/${comment.targetId}`,
        timestamp: comment.createdAt,
      });
    }
  }

  // Proposal events
  if (proposals) {
    for (const proposal of proposals) {
      events.push({
        id: `prop-${proposal.id}`,
        type: "proposal_created",
        description: `New ${proposal.type.replace("_", " ")} proposal`,
        personaId: null,
        targetPath:
          proposal.parentType === "story"
            ? `/stories/${proposal.parentId}`
            : `/tasks/${proposal.parentId}`,
        timestamp: proposal.createdAt,
      });
    }
  }

  // Sort by timestamp descending, take last 10
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return events.slice(0, 10);
}

// ── Live WS events for dashboard ─────────────────────────────────

function wsToActivityEvent(event: WsEvent): ActivityEvent | null {
  const targetPath = (type: "story" | "task", id: string) =>
    type === "story" ? `/stories/${id}` : `/tasks/${id}`;

  switch (event.type) {
    case "agent_started": {
      const e = event as AgentStartedEvent;
      return {
        id: `live-started-${e.executionId}-${Date.now()}`,
        type: "agent_completed", // reuse icon
        description: `Agent started: ${e.taskTitle}`,
        personaId: e.personaId,
        targetPath: targetPath(e.targetType, e.targetId),
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "agent_completed": {
      const e = event as AgentCompletedEvent;
      return {
        id: `live-completed-${e.executionId}-${Date.now()}`,
        type: "agent_completed",
        description: `Agent completed ${e.targetType} ($${e.costUsd.toFixed(2)})`,
        personaId: e.personaId,
        targetPath: targetPath(e.targetType, e.targetId),
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "state_change": {
      const e = event as StateChangeEvent;
      return {
        id: `live-state-${e.targetId}-${Date.now()}`,
        type: "state_change",
        description: `${e.targetType} moved to ${e.toState}`,
        personaId: null,
        targetPath: targetPath(e.targetType, e.targetId),
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "comment_created": {
      const e = event as CommentCreatedEvent;
      return {
        id: `live-comment-${e.commentId}-${Date.now()}`,
        type: "comment_posted",
        description: `${e.authorName}: ${e.contentPreview}`,
        personaId: null,
        targetPath: targetPath(e.targetType, e.targetId),
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "proposal_created": {
      const e = event as ProposalCreatedEvent;
      return {
        id: `live-prop-${e.proposalId}-${Date.now()}`,
        type: "proposal_created",
        description: `New ${e.proposalType.replace(/_/g, " ")} proposal`,
        personaId: null,
        targetPath: targetPath(e.parentType, e.parentId),
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    default:
      return null;
  }
}

function useLiveActivityEvents(): ActivityEvent[] {
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    const unsub = mockWs.subscribeAll((event: WsEvent) => {
      const activityEvent = wsToActivityEvent(event);
      if (activityEvent) {
        setLiveEvents((prev) => [activityEvent, ...prev].slice(0, 10));
      }
    });
    return unsub;
  }, []);

  return liveEvents;
}

// ── Component ─────────────────────────────────────────────────────

interface ActivityRowProps {
  event: ActivityEvent;
  personaMap: Map<string, Persona>;
}

function ActivityRow({ event, personaMap }: ActivityRowProps) {
  const config = eventConfig[event.type];
  const persona = event.personaId ? personaMap.get(event.personaId) : null;

  return (
    <Link
      to={event.targetPath}
      className={`flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50 ${
        event.isLive ? "animate-slide-down" : ""
      }`}
    >
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.colorClass}`}
      >
        {config.icon}
      </div>
      {persona && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: persona.avatar.color + "20" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: persona.avatar.color }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm">{event.description}</p>
          {event.isLive && (
            <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[8px] px-1 py-0 border-0 shrink-0">
              LIVE
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{relativeTime(event.timestamp)}</p>
      </div>
    </Link>
  );
}

export function RecentActivity() {
  const baseEvents = useActivityEvents();
  const liveEvents = useLiveActivityEvents();
  const { data: personas } = usePersonas();
  const personaMap = new Map(personas?.map((p) => [p.id, p]));

  // Merge live + base, sort descending, take 10
  const events = useMemo(() => {
    const merged = [...liveEvents, ...baseEvents];
    merged.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return merged.slice(0, 10);
  }, [baseEvents, liveEvents]);

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Recent Activity
          </p>
          <Link
            to="/activity"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">Nothing yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((event) => (
              <ActivityRow
                key={event.id}
                event={event}
                personaMap={personaMap}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
