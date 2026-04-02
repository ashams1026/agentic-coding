import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRightLeft,
  Bot,
  CheckCircle2,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useExecutions, useProposals, useAgents, useRecentComments, useSelectedProject } from "@/hooks";
import { useWorkItemsStore } from "@/stores/work-items-store";
import { subscribeAll } from "@/api/ws";
import type { Agent } from "@agentops/shared";
import type {
  WsEvent,
  AgentStartedEvent,
  AgentCompletedEvent,
  StateChangeEvent,
  CommentCreatedEvent,
  ProposalCreatedEvent,
} from "@agentops/shared";

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
  agentId: string | null;
  workItemId: string | null;
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
  const { projectId } = useSelectedProject();
  const { data: executions } = useExecutions(undefined, projectId ?? undefined);
  const { data: proposals } = useProposals(undefined, projectId ?? undefined);
  const { data: comments } = useRecentComments(projectId ?? undefined);

  return useMemo(() => {
    const events: ActivityEvent[] = [];

    // Agent completed events from executions
    if (executions) {
      for (const exec of executions) {
        if (exec.status === "completed") {
          events.push({
            id: `exec-${exec.id}`,
            type: "agent_completed",
            description: exec.summary || "Agent completed work item",
            agentId: exec.agentId,
            workItemId: exec.workItemId,
            timestamp: exec.completedAt ?? exec.startedAt,
          });
        }
      }
    }

    // Comment events from API
    if (comments) {
      for (const comment of comments) {
        if (comment.authorType === "system") {
          events.push({
            id: `sc-${comment.id}`,
            type: "state_change",
            description: comment.content,
            agentId: null,
            workItemId: comment.workItemId,
            timestamp: comment.createdAt,
          });
        } else {
          events.push({
            id: `cmt-${comment.id}`,
            type: "comment_posted",
            description: `${comment.authorName}: ${comment.content.slice(0, 80)}${comment.content.length > 80 ? "..." : ""}`,
            agentId: comment.authorId,
            workItemId: comment.workItemId,
            timestamp: comment.createdAt,
          });
        }
      }
    }

    // Proposal events
    if (proposals) {
      for (const proposal of proposals) {
        events.push({
          id: `prop-${proposal.id}`,
          type: "proposal_created",
          description: `New ${proposal.type.replace(/_/g, " ")} proposal`,
          agentId: null,
          workItemId: proposal.workItemId,
          timestamp: proposal.createdAt,
        });
      }
    }

    // Sort by timestamp descending, take last 10
    events.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return events.slice(0, 10);
  }, [executions, proposals, comments]);
}

// ── Live WS events for dashboard ─────────────────────────────────

function wsToActivityEvent(event: WsEvent): ActivityEvent | null {
  switch (event.type) {
    case "agent_started": {
      const e = event as AgentStartedEvent;
      return {
        id: `live-started-${e.executionId}-${Date.now()}`,
        type: "agent_completed",
        description: `Agent started: ${e.workItemTitle}`,
        agentId: e.agentId,
        workItemId: e.workItemId,
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "agent_completed": {
      const e = event as AgentCompletedEvent;
      return {
        id: `live-completed-${e.executionId}-${Date.now()}`,
        type: "agent_completed",
        description: `Agent completed work item ($${e.costUsd.toFixed(2)})`,
        agentId: e.agentId,
        workItemId: e.workItemId,
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "state_change": {
      const e = event as StateChangeEvent;
      return {
        id: `live-state-${e.workItemId}-${Date.now()}`,
        type: "state_change",
        description: `Work item moved to ${e.toState}`,
        agentId: null,
        workItemId: e.workItemId,
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
        agentId: null,
        workItemId: e.workItemId,
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
        agentId: null,
        workItemId: e.workItemId,
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
    const unsub = subscribeAll((event: WsEvent) => {
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
  agentMap: Map<string, Agent>;
}

function ActivityRow({ event, agentMap }: ActivityRowProps) {
  const navigate = useNavigate();
  const setSelectedItemId = useWorkItemsStore((s) => s.setSelectedItemId);
  const config = eventConfig[event.type];
  const agent = event.agentId ? agentMap.get(event.agentId) : null;

  const handleClick = () => {
    if (event.workItemId) {
      setSelectedItemId(event.workItemId as Parameters<typeof setSelectedItemId>[0]);
    }
    navigate("/items");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      className={`flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        event.isLive ? "animate-slide-down" : ""
      }`}
    >
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.colorClass}`}
      >
        {config.icon}
      </div>
      {agent && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: agent.avatar.color + "20" }}
        >
          <Bot className="h-3.5 w-3.5" style={{ color: agent.avatar.color }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm">{event.description}</p>
          {event.isLive && (
            <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs px-1 py-0 border-0 shrink-0">
              LIVE
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{relativeTime(event.timestamp)}</p>
      </div>
    </div>
  );
}

export function RecentActivity() {
  const baseEvents = useActivityEvents();
  const liveEvents = useLiveActivityEvents();
  const { data: agents } = useAgents();
  const agentMap = new Map(agents?.map((p) => [p.id, p]));

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
      <CardContent>
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
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((event) => (
              <ActivityRow
                key={event.id}
                event={event}
                agentMap={agentMap}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
