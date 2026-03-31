import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Filter,
  X,
  ArrowDown,
  Route,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useExecutions,
  useWorkItems,
  useProposals,
  usePersonas,
  useRecentComments,
  useSelectedProject,
} from "@/hooks";
import { subscribeAll } from "@/api/ws";
import { useActivityStore } from "@/stores/activity-store";
import type { Persona, WorkItemId, PersonaId } from "@agentops/shared";
import type {
  WsEvent,
  AgentStartedEvent,
  AgentCompletedEvent,
  StateChangeEvent,
  CommentCreatedEvent,
  ProposalCreatedEvent,
  ProposalUpdatedEvent,
} from "@agentops/shared";

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
  | "router_decision"
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
  isLive?: boolean;
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
  router_decision: {
    icon: <Route className="h-4 w-4" />,
    colorClass: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
    label: "Router Decision",
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

const ALL_EVENT_TYPES = Object.keys(eventConfig) as ActivityEventType[];

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

type DatePreset = "all" | "today" | "yesterday" | "7d" | "30d";

function getDateCutoff(preset: DatePreset): Date | null {
  if (preset === "all") return null;
  const now = new Date();
  if (preset === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (preset === "yesterday") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (preset === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  const d = new Date(now);
  d.setDate(d.getDate() - 30);
  return d;
}

// ── Build events from mock data ──────────────────────────────────

function useBaseActivityEvents(): ActivityEvent[] {
  const { projectId } = useSelectedProject();
  const { data: executions } = useExecutions(undefined, projectId ?? undefined);
  const { data: workItems } = useWorkItems(undefined, projectId ?? undefined);
  const { data: proposals } = useProposals(undefined, projectId ?? undefined);
  const { data: personas } = usePersonas();
  const { data: comments } = useRecentComments(projectId ?? undefined);

  return useMemo(() => {
    const events: ActivityEvent[] = [];
    const itemMap = new Map(workItems?.map((wi) => [wi.id, wi]) ?? []);
    const personaMap = new Map(personas?.map((p) => [p.id, p]) ?? []);

    const itemTitle = (id: string) => itemMap.get(id as WorkItemId)?.title ?? "work item";
    const personaName = (id: string) => personaMap.get(id as PersonaId)?.name ?? "Agent";

    // Agent events from executions
    if (executions) {
      for (const exec of executions) {
        const pName = personaName(exec.personaId as string);
        const wiTitle = itemTitle(exec.workItemId as string);

        if (exec.status === "running") {
          events.push({
            id: `started-${exec.id}`,
            type: "agent_started",
            description: `${pName} started work on ${wiTitle}`,
            personaId: exec.personaId,
            targetPath: "/items",
            targetLabel: wiTitle,
            timestamp: exec.startedAt,
          });
        }
        if (exec.status === "completed" && exec.outcome === "success") {
          events.push({
            id: `completed-${exec.id}`,
            type: "agent_completed",
            description: exec.summary || `${pName} completed work on ${wiTitle}`,
            personaId: exec.personaId,
            targetPath: "/items",
            targetLabel: wiTitle,
            timestamp: exec.completedAt ?? exec.startedAt,
          });
        }
        if (exec.status === "completed" && exec.outcome === "rejected") {
          events.push({
            id: `failed-${exec.id}`,
            type: "agent_failed",
            description: exec.rejectionPayload?.reason ?? `${pName} work rejected on ${wiTitle}`,
            personaId: exec.personaId,
            targetPath: "/items",
            targetLabel: wiTitle,
            timestamp: exec.completedAt ?? exec.startedAt,
          });
        }
      }
    }

    // Comment events from API
    if (comments) {
      for (const comment of comments) {
        const wiTitle = itemTitle(comment.workItemId as string);

        if (comment.authorType === "system") {
          events.push({
            id: `sc-${comment.id}`,
            type: "state_transition",
            description: comment.content,
            personaId: null,
            targetPath: "/items",
            targetLabel: wiTitle,
            timestamp: comment.createdAt,
          });
        } else {
          events.push({
            id: `cmt-${comment.id}`,
            type: "comment_posted",
            description: `${comment.authorName}: ${comment.content.slice(0, 120)}${comment.content.length > 120 ? "..." : ""}`,
            personaId: comment.authorType === "agent" ? comment.authorId : null,
            targetPath: "/items",
            targetLabel: wiTitle,
            timestamp: comment.createdAt,
          });
        }
      }
    }

    // Proposal events
    if (proposals) {
      for (const proposal of proposals) {
        const wiTitle = itemTitle(proposal.workItemId as string);

        events.push({
          id: `prop-created-${proposal.id}`,
          type: "proposal_created",
          description: `New ${proposal.type.replace(/_/g, " ")} proposal for ${wiTitle}`,
          personaId: null,
          targetPath: "/items",
          targetLabel: wiTitle,
          timestamp: proposal.createdAt,
        });

        if (proposal.status === "approved") {
          events.push({
            id: `prop-approved-${proposal.id}`,
            type: "proposal_approved",
            description: `${proposal.type.replace(/_/g, " ")} proposal approved for ${wiTitle}`,
            personaId: null,
            targetPath: "/items",
            targetLabel: wiTitle,
            timestamp: new Date(
              new Date(proposal.createdAt).getTime() + 120000,
            ).toISOString(),
          });
        }
        if (proposal.status === "rejected") {
          events.push({
            id: `prop-rejected-${proposal.id}`,
            type: "proposal_rejected",
            description: `${proposal.type.replace(/_/g, " ")} proposal rejected for ${wiTitle}`,
            personaId: null,
            targetPath: "/items",
            targetLabel: wiTitle,
            timestamp: new Date(
              new Date(proposal.createdAt).getTime() + 120000,
            ).toISOString(),
          });
        }
      }
    }

    return events;
  }, [executions, workItems, personas, proposals, comments]);
}

// ── Convert WS events to ActivityEvents ─────────────────────────

interface LookupMaps {
  personaMap: Map<string, Persona>;
  itemTitleMap: Map<string, string>;
}

function wsEventToActivity(event: WsEvent, maps: LookupMaps): ActivityEvent | null {
  const pName = (id: string) => maps.personaMap.get(id)?.name ?? "Agent";
  const wiTitle = (id: string) => maps.itemTitleMap.get(id) ?? "work item";

  switch (event.type) {
    case "agent_started": {
      const e = event as AgentStartedEvent;
      const title = e.workItemTitle || wiTitle(e.workItemId as string);
      return {
        id: `live-started-${e.executionId}-${Date.now()}`,
        type: "agent_started",
        description: `${pName(e.personaId as string)} started work on ${title}`,
        personaId: e.personaId,
        targetPath: "/items",
        targetLabel: title,
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "agent_completed": {
      const e = event as AgentCompletedEvent;
      const title = wiTitle(e.workItemId as string);
      const isFailed = e.outcome !== "success";
      return {
        id: `live-${isFailed ? "failed" : "completed"}-${e.executionId}-${Date.now()}`,
        type: isFailed ? "agent_failed" : "agent_completed",
        description: isFailed
          ? `${pName(e.personaId as string)} work rejected on ${title}`
          : `${pName(e.personaId as string)} completed work on ${title} ($${e.costUsd.toFixed(2)})`,
        personaId: e.personaId,
        targetPath: "/items",
        targetLabel: title,
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "state_change": {
      const e = event as StateChangeEvent;
      const title = wiTitle(e.workItemId as string);
      return {
        id: `live-state-${e.workItemId}-${Date.now()}`,
        type: "state_transition",
        description: `${title} moved from ${e.fromState} to ${e.toState}`,
        personaId: typeof e.triggeredBy === "string" && e.triggeredBy.startsWith("ps-") ? e.triggeredBy : null,
        targetPath: "/items",
        targetLabel: title,
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
        targetPath: "/items",
        targetLabel: wiTitle(e.workItemId as string),
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "proposal_created": {
      const e = event as ProposalCreatedEvent;
      const title = wiTitle(e.workItemId as string);
      return {
        id: `live-prop-${e.proposalId}-${Date.now()}`,
        type: "proposal_created",
        description: `New ${e.proposalType.replace(/_/g, " ")} proposal for ${title}`,
        personaId: null,
        targetPath: "/items",
        targetLabel: title,
        timestamp: e.timestamp,
        isLive: true,
      };
    }
    case "proposal_updated": {
      const e = event as ProposalUpdatedEvent;
      if (e.status === "approved" || e.status === "rejected") {
        return {
          id: `live-prop-${e.status}-${e.proposalId}-${Date.now()}`,
          type: e.status === "approved" ? "proposal_approved" : "proposal_rejected",
          description: `Proposal ${e.status}`,
          personaId: null,
          targetPath: "/items",
          targetLabel: "proposal",
          timestamp: e.timestamp,
          isLive: true,
        };
      }
      return null;
    }
    default:
      return null;
  }
}

// ── Hook: subscribe to live WS events ───────────────────────────

function useLiveActivityEvents(maps: LookupMaps): ActivityEvent[] {
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);
  const incrementUnread = useActivityStore((s) => s.increment);
  const mapsRef = useRef(maps);
  mapsRef.current = maps;

  useEffect(() => {
    const unsub = subscribeAll((event: WsEvent) => {
      const activityEvent = wsEventToActivity(event, mapsRef.current);
      if (activityEvent) {
        setLiveEvents((prev) => [activityEvent, ...prev]);
        incrementUnread();
      }
    });
    return unsub;
  }, [incrementUnread]);

  return liveEvents;
}

// ── Filters ─────────────────────────────────────────────────────

interface Filters {
  eventTypes: Set<ActivityEventType>;
  personaId: string | "all";
  datePreset: DatePreset;
}

const defaultFilters: Filters = {
  eventTypes: new Set(ALL_EVENT_TYPES),
  personaId: "all",
  datePreset: "all",
};

function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.eventTypes.size !== ALL_EVENT_TYPES.length ||
    filters.personaId !== "all" ||
    filters.datePreset !== "all"
  );
}

// ── FilterBar component ──────────────────────────────────────────

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  personas: Persona[];
}

function FeedFilterBar({ filters, onFiltersChange, personas }: FilterBarProps) {
  const [showTypes, setShowTypes] = useState(false);

  const toggleEventType = (type: ActivityEventType) => {
    const next = new Set(filters.eventTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onFiltersChange({ ...filters, eventTypes: next });
  };

  const selectAllTypes = () => {
    onFiltersChange({ ...filters, eventTypes: new Set(ALL_EVENT_TYPES) });
  };

  const deselectAllTypes = () => {
    onFiltersChange({ ...filters, eventTypes: new Set() });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* Event type toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowTypes(!showTypes)}
        >
          Types
          {filters.eventTypes.size < ALL_EVENT_TYPES.length && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
              {filters.eventTypes.size}
            </Badge>
          )}
        </Button>

        {/* Persona filter */}
        <Select
          value={filters.personaId}
          onValueChange={(v) => onFiltersChange({ ...filters, personaId: v })}
        >
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue placeholder="All personas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All personas</SelectItem>
            {personas.map((p) => (
              <SelectItem key={p.id as string} value={p.id as string}>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.avatar.color }}
                  />
                  {p.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range */}
        <Select
          value={filters.datePreset}
          onValueChange={(v) => onFiltersChange({ ...filters, datePreset: v as DatePreset })}
        >
          <SelectTrigger className="h-7 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Since yesterday</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear button */}
        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => onFiltersChange(defaultFilters)}
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Event type checkboxes */}
      {showTypes && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="link" size="sm" className="h-5 px-0" onClick={selectAllTypes}>
              Select all
            </Button>
            <Button variant="link" size="sm" className="h-5 px-0" onClick={deselectAllTypes}>
              Deselect all
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 md:grid-cols-4">
            {ALL_EVENT_TYPES.map((type) => {
              const cfg = eventConfig[type];
              return (
                <label
                  key={type}
                  className="flex items-center gap-1.5 text-xs cursor-pointer select-none"
                >
                  <Checkbox
                    checked={filters.eventTypes.has(type)}
                    onCheckedChange={() => toggleEventType(type)}
                  />
                  <span className={cfg.colorClass.split(" ")[0]}>
                    {cfg.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
      className={`flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-accent/50 ${
        event.isLive ? "animate-slide-down" : ""
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.colorClass}`}
      >
        {config.icon}
      </div>

      {persona && (
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: persona.avatar.color + "20" }}
        >
          <Bot className="h-4 w-4" style={{ color: persona.avatar.color }} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{event.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(event.timestamp)}
          </span>
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground capitalize">
            {event.targetLabel}
          </span>
          {event.isLive && (
            <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs px-1 py-0 border-0">
              LIVE
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────

export function ActivityFeed() {
  const { projectId } = useSelectedProject();
  const { data: personas } = usePersonas();
  const { data: workItems } = useWorkItems(undefined, projectId ?? undefined);
  const resetUnread = useActivityStore((s) => s.reset);

  useEffect(() => {
    resetUnread();
  }, [resetUnread]);

  const personaMap = useMemo(
    () => new Map(personas?.map((p) => [p.id as string, p]) ?? []),
    [personas],
  );

  const itemTitleMap = useMemo(
    () => new Map(workItems?.map((wi) => [wi.id as string, wi.title]) ?? []),
    [workItems],
  );

  const lookupMaps = useMemo<LookupMaps>(
    () => ({ personaMap, itemTitleMap }),
    [personaMap, itemTitleMap],
  );

  const baseEvents = useBaseActivityEvents();
  const liveEvents = useLiveActivityEvents(lookupMaps);

  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const allEvents = useMemo(() => {
    const merged = [...liveEvents, ...baseEvents];
    merged.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return merged;
  }, [baseEvents, liveEvents]);

  const filteredEvents = useMemo(() => {
    const dateCutoff = getDateCutoff(filters.datePreset);

    return allEvents.filter((event) => {
      if (!filters.eventTypes.has(event.type)) return false;
      if (filters.personaId !== "all") {
        if (event.personaId !== filters.personaId) return false;
      }
      if (dateCutoff) {
        if (new Date(event.timestamp) < dateCutoff) return false;
      }
      return true;
    });
  }, [allEvents, filters]);

  const grouped = useMemo(() => {
    const groups: { date: string; events: ActivityEvent[] }[] = [];
    let currentDate = "";

    for (const event of filteredEvents) {
      const dateGroup = formatDateGroup(event.timestamp);
      if (dateGroup !== currentDate) {
        currentDate = dateGroup;
        groups.push({ date: dateGroup, events: [] });
      }
      groups[groups.length - 1]!.events.push(event);
    }
    return groups;
  }, [filteredEvents]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [newEventCount, setNewEventCount] = useState(0);

  useEffect(() => {
    if (isScrolledDown && liveEvents.length > 0) {
      setNewEventCount(liveEvents.length);
    }
  }, [liveEvents.length, isScrolledDown]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrolled = el.scrollTop > 100;
    setIsScrolledDown(scrolled);
    if (!scrolled) {
      setNewEventCount(0);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setNewEventCount(0);
    setIsScrolledDown(false);
  }, []);

  if (allEvents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">No activity yet</p>
          <p className="text-xs text-muted-foreground">
            Activity events will appear here as agents work on this project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" ref={scrollRef} onScroll={handleScroll}>
      <div className="max-w-3xl mx-auto py-6 px-6">
        <FeedFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          personas={personas ?? []}
        />

        {isScrolledDown && newEventCount > 0 && (
          <div className="sticky top-2 z-20 flex justify-center mb-2">
            <Button
              size="sm"
              className="rounded-full shadow-lg gap-1.5 text-xs"
              onClick={scrollToTop}
            >
              <ArrowDown className="h-3 w-3 rotate-180" />
              {newEventCount} new event{newEventCount !== 1 ? "s" : ""}
            </Button>
          </div>
        )}

        <div className="mt-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                No events match the current filters.
              </p>
            </div>
          ) : (
            grouped.map((group, gi) => (
              <div key={group.date}>
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.date}
                  </p>
                </div>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
