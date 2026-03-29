import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Persona } from "@agentops/shared";

export interface TransitionPromptData {
  storyTitle: string;
  fromState: string;
  toState: string;
  persona: Persona;
}

interface TransitionPromptModalProps {
  open: boolean;
  data: TransitionPromptData | null;
  onRunTrigger: () => void;
  onSkipTrigger: () => void;
  onCancel: () => void;
}

export function TransitionPromptModal({
  open,
  data,
  onRunTrigger,
  onSkipTrigger,
  onCancel,
}: TransitionPromptModalProps) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transition Trigger</DialogTitle>
          <DialogDescription>
            Moving &ldquo;{data.storyTitle}&rdquo; from{" "}
            <span className="font-medium text-foreground">{data.fromState}</span>{" "}
            to{" "}
            <span className="font-medium text-foreground">{data.toState}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: data.persona.avatar.color + "20" }}
          >
            <Bot
              className="h-5 w-5"
              style={{ color: data.persona.avatar.color }}
            />
          </div>
          <div>
            <p className="text-sm font-medium">
              This will trigger{" "}
              <span style={{ color: data.persona.avatar.color }}>
                {data.persona.name}
              </span>{" "}
              agent.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.persona.description}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onSkipTrigger}>
            Skip trigger
          </Button>
          <Button onClick={onRunTrigger}>Run trigger</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
