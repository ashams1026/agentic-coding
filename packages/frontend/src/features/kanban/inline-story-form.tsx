import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateStory } from "@/hooks";
import type { Priority, ProjectId, WorkflowId } from "@agentops/shared";

interface InlineStoryFormProps {
  projectId: ProjectId;
  workflowId: WorkflowId;
  onClose: () => void;
}

export function InlineStoryForm({
  projectId,
  workflowId,
  onClose,
}: InlineStoryFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("p2");
  const createStory = useCreateStory();

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    createStory.mutate(
      {
        projectId,
        workflowId,
        title: trimmed,
        priority,
      },
      {
        onSuccess: () => {
          setTitle("");
          setPriority("p2");
          onClose();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-top-2 duration-200">
      <CardContent className="px-3 py-2.5 space-y-2">
        <Input
          autoFocus
          placeholder="Story title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
        />
        <div className="flex items-center gap-2">
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as Priority)}
          >
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p0">P0</SelectItem>
              <SelectItem value="p1">P1</SelectItem>
              <SelectItem value="p2">P2</SelectItem>
              <SelectItem value="p3">P3</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!title.trim() || createStory.isPending}
          >
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
