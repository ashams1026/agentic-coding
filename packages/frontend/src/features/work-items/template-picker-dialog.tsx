import { useState } from "react";
import {
  Bug,
  Lightbulb,
  ClipboardList,
  Search,
  FileText,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Priority } from "@agentops/shared";

// ── Template definitions ────────────────────────────────────────

export interface WorkItemTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  title: string;
  body: string;
  priority: Priority;
  labels: string[];
}

const TEMPLATES: WorkItemTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch",
    icon: FileText,
    title: "",
    body: "",
    priority: "p2",
    labels: [],
  },
  {
    id: "bug",
    name: "Bug Report",
    description: "Track a bug or defect",
    icon: Bug,
    title: "Bug: ",
    body: "## Steps to Reproduce\n\n## Expected Behavior\n\n## Actual Behavior\n",
    priority: "p1",
    labels: ["bug"],
  },
  {
    id: "feature",
    name: "Feature Request",
    description: "Request a new feature",
    icon: Lightbulb,
    title: "Feature: ",
    body: "## Description\n\n## Acceptance Criteria\n",
    priority: "p2",
    labels: ["feature"],
  },
  {
    id: "task",
    name: "Task",
    description: "A general development task",
    icon: ClipboardList,
    title: "",
    body: "## Objective\n\n## Steps\n",
    priority: "p2",
    labels: ["task"],
  },
  {
    id: "research",
    name: "Research Spike",
    description: "Investigate a technical approach",
    icon: Search,
    title: "Spike: ",
    body: "## Question\n\n## Findings\n",
    priority: "p3",
    labels: ["research"],
  },
];

// ── Component ───────────────────────────────────────────────────

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: WorkItemTemplate) => void;
}

export function TemplatePickerDialog({
  open,
  onOpenChange,
  onSelect,
}: TemplatePickerDialogProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleSelect = (template: WorkItemTemplate) => {
    onSelect(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Work Item</DialogTitle>
          <DialogDescription>
            Choose a template to get started, or start blank.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <button
                key={tpl.id}
                type="button"
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
                  "hover:border-primary hover:bg-accent",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  hoveredId === tpl.id && "border-primary bg-accent",
                )}
                onMouseEnter={() => setHoveredId(tpl.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(tpl)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{tpl.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-tight">
                    {tpl.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
