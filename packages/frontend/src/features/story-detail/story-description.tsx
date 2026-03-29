import { useState } from "react";
import { Pencil, Eye, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useUpdateStory } from "@/hooks";
import type { Story, StoryId } from "@agentops/shared";

// ── Simple markdown renderer ─────────────────────────────────────

function MarkdownPreview({ content }: { content: string }) {
  if (!content) {
    return (
      <p className="text-sm text-muted-foreground italic">No description yet.</p>
    );
  }

  // Minimal markdown: paragraphs, bold, inline code, bullet lists
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 space-y-0.5 text-sm">
          {listItems.map((item, i) => (
            <li key={i}>{formatInline(item)}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
    } else {
      flushList();
      if (line.trim() === "") {
        elements.push(<div key={`br-${elements.length}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${elements.length}`} className="text-sm">
            {formatInline(line)}
          </p>,
        );
      }
    }
  }
  flushList();

  return <div className="space-y-1">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  // Bold: **text** and inline code: `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Editable section ─────────────────────────────────────────────

interface EditableSectionProps {
  storyId: StoryId;
  label: string;
  content: string;
  onSave: (value: string) => void;
  placeholder: string;
}

function EditableSection({
  label,
  content,
  onSave,
  placeholder,
}: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [value, setValue] = useState(content);

  const handleSave = () => {
    onSave(value);
    setEditing(false);
    setPreview(false);
  };

  const handleCancel = () => {
    setValue(content);
    setEditing(false);
    setPreview(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {!editing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setEditing(true)}
          >
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="flex gap-1">
            <Button
              variant={preview ? "ghost" : "secondary"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPreview(false)}
            >
              <Pencil className="mr-1 h-3 w-3" />
              Write
            </Button>
            <Button
              variant={preview ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPreview(true)}
            >
              <Eye className="mr-1 h-3 w-3" />
              Preview
            </Button>
          </div>

          {preview ? (
            <Card>
              <CardContent className="pt-4 pb-4">
                <MarkdownPreview content={value} />
              </CardContent>
            </Card>
          ) : (
            <Textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="min-h-[120px] text-sm font-mono"
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancel();
              }}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCancel}
            >
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
              <Check className="mr-1 h-3 w-3" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <MarkdownPreview content={content} />
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────

interface StoryDescriptionProps {
  story: Story;
}

export function StoryDescription({ story }: StoryDescriptionProps) {
  const updateStory = useUpdateStory();

  return (
    <div className="space-y-6">
      <EditableSection
        storyId={story.id}
        label="Description"
        content={story.description}
        placeholder="Describe the story..."
        onSave={(value) =>
          updateStory.mutate({ id: story.id, description: value })
        }
      />

      <EditableSection
        storyId={story.id}
        label="Acceptance Criteria"
        content={story.context.acceptanceCriteria}
        placeholder="- Criterion 1&#10;- Criterion 2&#10;- Criterion 3"
        onSave={(value) =>
          updateStory.mutate({
            id: story.id,
            context: { acceptanceCriteria: value },
          })
        }
      />
    </div>
  );
}
