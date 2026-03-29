import { useState } from "react";
import { X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateStory } from "@/hooks";
import type { Story, StoryId, Priority } from "@agentops/shared";

// ── Priority config ──────────────────────────────────────────────

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  p0: { label: "P0", className: "border-red-500 text-red-600 dark:text-red-400" },
  p1: { label: "P1", className: "border-amber-500 text-amber-600 dark:text-amber-400" },
  p2: { label: "P2", className: "border-blue-500 text-blue-600 dark:text-blue-400" },
  p3: { label: "P3", className: "border-slate-400 text-slate-500 dark:text-slate-400" },
};

// ── Inline editable title ────────────────────────────────────────

function EditableTitle({
  storyId,
  title,
}: {
  storyId: StoryId;
  title: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const updateStory = useUpdateStory();

  const save = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) {
      updateStory.mutate({ id: storyId, title: trimmed });
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setValue(title);
              setEditing(false);
            }
          }}
          className="h-9 text-xl font-bold"
        />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={save}>
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            setValue(title);
            setEditing(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <h1
      className="cursor-pointer text-2xl font-bold hover:text-primary/80 transition-colors"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {title}
    </h1>
  );
}

// ── Editable labels ──────────────────────────────────────────────

function EditableLabels({
  storyId,
  labels,
}: {
  storyId: StoryId;
  labels: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(labels.join(", "));
  const updateStory = useUpdateStory();

  const save = () => {
    const newLabels = value
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
    updateStory.mutate({ id: storyId, labels: newLabels });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setValue(labels.join(", "));
              setEditing(false);
            }
          }}
          placeholder="label1, label2, ..."
          className="h-7 text-xs w-48"
        />
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={save}>
          <Check className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-1 cursor-pointer"
      onClick={() => setEditing(true)}
      title="Click to edit labels"
    >
      {labels.length > 0 ? (
        labels.map((label) => (
          <Badge key={label} variant="secondary" className="text-xs">
            {label}
          </Badge>
        ))
      ) : (
        <span className="text-xs text-muted-foreground hover:text-foreground">
          + Add labels
        </span>
      )}
    </div>
  );
}

// ── Header component ─────────────────────────────────────────────

interface StoryDetailHeaderProps {
  story: Story;
  onClose: () => void;
}

export function StoryDetailHeader({ story, onClose }: StoryDetailHeaderProps) {
  const updateStory = useUpdateStory();
  const pCfg = priorityConfig[story.priority];

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <EditableTitle storyId={story.id} title={story.title} />
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-8 w-8 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* State badge */}
        <Badge variant="outline" className="text-xs">
          {story.currentState}
        </Badge>

        {/* Priority selector */}
        <Select
          value={story.priority}
          onValueChange={(v) =>
            updateStory.mutate({ id: story.id, priority: v as Priority })
          }
        >
          <SelectTrigger className={`h-7 w-20 text-xs font-semibold ${pCfg.className}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p0">P0</SelectItem>
            <SelectItem value="p1">P1</SelectItem>
            <SelectItem value="p2">P2</SelectItem>
            <SelectItem value="p3">P3</SelectItem>
          </SelectContent>
        </Select>

        {/* Label pills */}
        <EditableLabels storyId={story.id} labels={story.labels} />
      </div>
    </div>
  );
}
