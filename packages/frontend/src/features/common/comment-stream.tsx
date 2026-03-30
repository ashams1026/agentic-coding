import { useState, useRef, useEffect, useMemo } from "react";
import {
  Bot,
  User,
  Info,
  Send,
  FileCode,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useComments, useCreateComment, usePersonas } from "@/hooks";
import type {
  Comment,
  Persona,
  WorkItemId,
} from "@agentops/shared";

// ── Time formatting ─────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Agent comment ───────────────────────────────────────────────

interface AgentCommentProps {
  comment: Comment;
  persona: Persona | undefined;
}

function AgentComment({ comment, persona }: AgentCommentProps) {
  const avatarColor = persona?.avatar.color ?? "#6b7280";
  const filesChanged = (comment.metadata.filesChanged ?? []) as string[];
  const toolsUsed = (comment.metadata.toolsUsed ?? []) as string[];

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5"
        style={{ backgroundColor: avatarColor + "20" }}
      >
        <Bot className="h-4 w-4" style={{ color: avatarColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.authorName}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            agent
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

        {/* Metadata chips */}
        {(filesChanged.length > 0 || toolsUsed.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {filesChanged.map((file) => (
              <Tooltip key={file}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    <FileCode className="h-2.5 w-2.5" />
                    {file.split("/").pop()}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-mono">
                  {file}
                </TooltipContent>
              </Tooltip>
            ))}
            {toolsUsed.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                <Wrench className="h-2.5 w-2.5" />
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── User comment ────────────────────────────────────────────────

function UserComment({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
        <User className="h-4 w-4 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

// ── System comment ──────────────────────────────────────────────

function SystemComment({ comment }: { comment: Comment }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
      <span className="text-xs text-muted-foreground">
        {comment.content}
      </span>
      <span className="text-[10px] text-muted-foreground/50">
        {formatTime(comment.createdAt)}
      </span>
    </div>
  );
}

// ── Comment input ───────────────────────────────────────────────

interface CommentInputProps {
  workItemId: WorkItemId;
}

function CommentInput({ workItemId }: CommentInputProps) {
  const [content, setContent] = useState("");
  const createComment = useCreateComment();

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    createComment.mutate(
      {
        workItemId,
        authorType: "user",
        authorName: "You",
        content: trimmed,
      },
      {
        onSuccess: () => setContent(""),
      },
    );
  };

  return (
    <div className="flex gap-2 pt-3 border-t">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="min-h-[60px] text-sm resize-none flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button
        size="sm"
        className="h-8 self-end"
        onClick={handleSubmit}
        disabled={!content.trim() || createComment.isPending}
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

interface CommentStreamProps {
  workItemId: WorkItemId;
}

export function CommentStream({ workItemId }: CommentStreamProps) {
  const { data: comments = [] } = useComments(workItemId);
  const { data: personas = [] } = usePersonas();
  const scrollRef = useRef<HTMLDivElement>(null);

  const personaMap = useMemo(
    () => new Map(personas.map((p) => [p.id as string, p])),
    [personas],
  );

  // Sort chronologically
  const sorted = useMemo(
    () =>
      [...comments].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [comments],
  );

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [sorted.length]);

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-3">
        Comments
        {sorted.length > 0 && (
          <span className="ml-1 text-xs">({sorted.length})</span>
        )}
      </p>

      {/* Comment list */}
      <div
        ref={scrollRef}
        className="space-y-4 max-h-[400px] overflow-y-auto pr-1"
      >
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 px-3">
            No comments yet.
          </p>
        ) : (
          sorted.map((comment) => {
            if (comment.authorType === "system") {
              return <SystemComment key={comment.id} comment={comment} />;
            }
            if (comment.authorType === "agent") {
              return (
                <AgentComment
                  key={comment.id}
                  comment={comment}
                  persona={
                    comment.authorId
                      ? personaMap.get(comment.authorId as string)
                      : undefined
                  }
                />
              );
            }
            return <UserComment key={comment.id} comment={comment} />;
          })
        )}
      </div>

      {/* Input */}
      <CommentInput workItemId={workItemId} />
    </div>
  );
}
