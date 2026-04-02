import { Link } from "react-router";
import {
  Kanban,
  Bot,
  Activity,
  Users,
  FileText,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Generic empty state ────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    to: string;
  };
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && (
        <Link to={action.to}>
          <Button size="sm">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}

// ── Specific empty states ──────────────────────────────────────────

export function NoStoriesEmpty() {
  return (
    <EmptyState
      icon={<Kanban className="h-7 w-7 text-muted-foreground" />}
      title="Create your first story"
      description="Stories represent features or tasks to be completed. Create one to get started with your workflow."
      action={{ label: "Go to Story Board", to: "/board" }}
    />
  );
}

export function NoAgentsEmpty() {
  return (
    <EmptyState
      icon={<Bot className="h-7 w-7 text-muted-foreground" />}
      title="All quiet"
      description="No agents are currently running. Agents start automatically when stories transition through workflow states."
      action={{ label: "View Story Board", to: "/board" }}
    />
  );
}

export function NoActivityEmpty() {
  return (
    <EmptyState
      icon={<Activity className="h-7 w-7 text-muted-foreground" />}
      title="Nothing yet"
      description="Activity will appear here as agents work on stories, submit proposals, and transition states."
      action={{ label: "Go to Dashboard", to: "/" }}
    />
  );
}

export function NoAgentDefinitionsEmpty() {
  return (
    <EmptyState
      icon={<Users className="h-7 w-7 text-muted-foreground" />}
      title="Set up your team"
      description="Agents define the AI agents that work on your stories. Create roles like Tech Lead, Engineer, and Reviewer."
      action={{ label: "Create Agent", to: "/agent-builder" }}
    />
  );
}

export function NoTasksEmpty() {
  return (
    <EmptyState
      icon={<CheckSquare className="h-7 w-7 text-muted-foreground" />}
      title="No tasks yet"
      description="Tasks are created when a story is decomposed by a Tech Lead agent. Add tasks manually or let the workflow handle it."
    />
  );
}

export function NoStoryDetailEmpty() {
  return (
    <EmptyState
      icon={<FileText className="h-7 w-7 text-muted-foreground" />}
      title="Story not found"
      description="This story may have been removed or the link is invalid."
      action={{ label: "Back to Board", to: "/board" }}
    />
  );
}
