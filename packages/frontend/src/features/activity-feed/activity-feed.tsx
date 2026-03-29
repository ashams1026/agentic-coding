import { useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowRightLeft,
  Bot,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  Play,
  Wrench,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useExecutions,
  useProposals,
  usePersonas,
} from "@/hooks";
import { fixtures } from "@/mocks/fixtures";
import type { Persona } from "@agentops/shared";

// ── Event types ───────────────────────────────────────────────────

type ActivityEventType =
  | "state_transition"
  | "agent_started"
  | "agent_completed"
  | "agent_failed"
  | "comment_posted"
  | "proposal_created"
  | "proposal_approved"
  | "proposal_rejected"
  | "manual_override"
  | "cost_alert";

interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  description: string;
  personaId: string | null;
  targetPath: string;
  targetLabel: string;
  timestamp: string;
}

// ── Icon/color config per event type ──────────────────────────────

const eventConfig: Record<
  ActivityEventType,
  { icon: React.ReactNode; colorClass: string; label: string }
> = {
  state_transition: {
    icon: <ArrowRightLeft className="h-4 w-4" />,
    colorClass: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    label: "State Change",
  },
  agent_started: {
    icon: <Play className="h-4 w-4" />,
    colorClass: "text-sky-500 bg-sky-100 dark:bg-sky-900/30",
    label: "Agent Started",
  },
  agent_completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    colorClass: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
    label: "Agent Completed",
  },
  agent_failed: {
    icon: <XCircle className="h-4 w-4" />,
    colorClass: "text-red-500 bg-red-100 dark:bg-red-900/30",
    label: "Agent Failed",
  },
  comment_posted: {
    icon: <MessageSquare className="h-4 w-4" />,
    colorClass: "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
    label: "Comment",
  },
  proposal_created: {
    icon: <FileCheck className="h-4 w-4" />,
    colorClass: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
    label: "Proposal Created",
  },
  proposal_approved: {
    icon: <ThumbsUp className="h-4 w-4" />,
    colorClass: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
    label: "Approved",
  },
  proposal_rejected: {
    icon: <ThumbsDown className="h-4 w-4" />,
    colorClass: "text-red-500 bg-red-100 dark:bg-red-900/30",
    label: "Rejected",
  },
  manual_override: {
    icon: <Wrench className="h-4 w-4" />,
    colorClass: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
    label: "Manual Override",
  },
  cost_alert: {
    icon: <DollarSign className="h-4 w-4" />,
    colorClass: "text-red-500 bg-red-100 dark:bg-red-900/30",
    label: "Cost Alert",
  },
};

// ── Date helpers ──────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Build events from mock data ──────────────────────────────────

function useAllActivityEvents(): ActivityEvent[] {
  const { data: executions } = useExecutions();
  const { data: proposals } = useProposals();
  const { data: personas } = usePersonas();

  return useMemo(() => {
    const events: ActivityEvent[] = [];

    // Target path helper
    const targetPath = (type: "story" | "task", id: string) =>
      type === "story" ? `/stories/${id}` : `/tasks/${id}`;

    // Agent events from executions
    if (executions) {
      for (const exec of executions) {
        if (exec.status === "running") {
          events.push({
            id: `started-${exec.id}`,
            type: "agent_started",
            description: `Agent started working on ${exec.targetType}`,
            personaId: exec.personaId,
            targetPath: targetPath(exec.targetType, exec.targetId),
            targetLabel: exec.targetType,
            timestamp: exec.startedAt,
          });
        }
        if (exec.status === "completed" && exec.outcome === "success") {
          events.push({
            id: `completed-${exec.id}`,
            type: "agent_completed",
            description: exec.summary || `Agent completed ${exec.targetType}`,
            personaId: exec.personaId,
            targetPath: targetPath(exec.targetType, exec.targetId),
            targetLabel: exec.targetType,
            timestamp: exec.completedAt ?? exec.startedAt,
          });
        }
        if (exec.status === "completed" && exec.outcome === "rejected") {
          events.push({
            id: `failed-${exec.id}`,
            type: "agent_failed",
            description: exec.rejectionPayload?.reason ?? `Agent work rejected on ${exec.targetType}`,
            personaId: exec.personaId,
            targetPath: targetPath(exec.targetType, exec.targetId),
            targetLabel: exec.targetType,
            timestamp: exec.completedAt ?? exec.startedAt,
          });
        }
      }
    }

    // Comment events
    for (const comment of fixtures.comments) {
      if (comment.authorType === "system") {
        events.push({
          id: `sc-${comment.id}`,
          type: "state_transition",
          description: comment.content,
          personaId: null,
          targetPath: targetPath(comment.targetType, comment.targetId),
          targetLabel: comment.targetType,
          timestamp: comment.createdAt,
        });
      } else {
        events.push({
          id: `cmt-${comment.id}`,
          type: "comment_posted",
          description: `${comment.authorName}: ${comment.content.slice(0, 120)}${comment.content.length > 120 ? "..." : ""}`,
          personaId: comment.authorType === "agent" ? comment.authorId : null,
          targetPath: targetPath(comment.targetType, comment.targetId),
          targetLabel: comment.targetType,
          timestamp: comment.createdAt,
        });
      }
    }

    // Proposal events
    if (proposals) {
      for (const proposal of proposals) {
        const path = targetPath(
          proposal.parentType as "story" | "task",
          proposal.parentId,
        );

        events.push({
          id: `prop-created-${proposal.id}`,
          type: "proposal_created",
          description: `New ${proposal.type.replace(/_/g, " ")} proposal`,
          personaId: null,
          targetPath: path,
          targetLabel: proposal.parentType,
          timestamp: proposal.createdAt,
        });

        if (proposal.status === "approved") {
          events.push({
            id: `prop-approved-${proposal.id}`,
            type: "proposal_approved",
            description: `${proposal.type.replace(/_/g, " ")} proposal approved`,
            personaId: null,
            targetPath: path,
            targetLabel: proposal.parentType,
            // Approved slightly after creation
            timestamp: new Date(
              new Date(proposal.createdAt).getTime() + 120000,
            ).toISOString(),
          });
        }
        if (proposal.status === "rejected") {
          events.push({
            id: `prop-rejected-${proposal.id}`,
            type: "proposal_rejected",
            description: `${proposal.type.replace(/_/g, " ")} proposal rejected`,
            personaId: null,
            targetPath: path,
            targetLabel: proposal.parentType,
            timestamp: new Date(
              new Date(proposal.createdAt).getTime() + 120000,
            ).toISOString(),
          });
        }
      }
    }

    // Mock cost alert event
    events.push({
      id: "cost-alert-1",
      type: "cost_alert",
      description: "Daily spend exceeded $2.50 threshold (current: $2.83)",
      personaId: null,
      targetPath: "/settings",
      targetLabel: "settings",
      timestamp: "2026-03-27T16:00:00Z",
    });

    // Sort by timestamp descending
    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return events;
  }, [executions, proposals, personas]);
}

// ── Event row ─────────────────────────────────────────────────────

interface EventRowProps {
  event: ActivityEvent;
  personaMap: Map<string, Persona>;
}

function EventRow({ event, personaMap }: EventRowProps) {
  const config = eventConfig[event.type];
  const persona = event.personaId
    ? personaMap.get(event.personaId as string)
    : null;

  return (
    <Link
      to={event.targetPath}
      className="flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent/50"
    >
      {/* Event type icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.colorClass}`}
      >
        {config.icon}
      </div>

      {/* Persona avatar (if agent-sourced) */}
      {persona && (
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: persona.avatar.color + "20" }}
        >
          <Bot className="h-4 w-4" style={{ color: persona.avatar.color }} />
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{event.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground">
            {formatTimestamp(event.timestamp)}
          </span>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {config.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground capitalize">
            {event.targetLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────

export function ActivityFeed() {
  const events = useAllActivityEvents();
  const { data: personas } = usePersonas();
  const personaMap = useMemo(
    () => new Map(personas?.map((p) => [p.id as string, p]) ?? []),
    [personas],
  );

  // Group events by date
  const grouped = useMemo(() => {
    const groups: { date: string; events: ActivityEvent[] }[] = [];
    let currentDate = "";

    for (const event of events) {
      const dateGroup = formatDateGroup(event.timestamp);
      if (dateGroup !== currentDate) {
        currentDate = dateGroup;
        groups.push({ date: dateGroup, events: [] });
      }
      groups[groups.length - 1]!.events.push(event);
    }
    return groups;
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Nothing yet</p>
          <p className="text-xs text-muted-foreground">
            Activity events will appear here as agents work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto py-4 px-4">
        {grouped.map((group, gi) => (
          <div key={group.date}>
            {/* Date header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.date}
              </p>
            </div>

            {/* Events */}
            <div className="space-y-0.5 mb-2">
              {group.events.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  personaMap={personaMap}
                />
              ))}
            </div>

            {gi < grouped.length - 1 && <Separator className="my-3" />}
          </div>
        ))}
      </div>
    </div>
  );
}
