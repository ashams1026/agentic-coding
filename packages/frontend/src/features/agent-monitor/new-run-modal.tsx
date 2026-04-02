import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePersonas, useProjects } from "@/hooks";
import { runExecution } from "@/api";
import { useToastStore } from "@/stores/toast-store";

export function NewRunModal() {
  const [open, setOpen] = useState(false);
  const [personaId, setPersonaId] = useState<string>("");
  const [scope, setScope] = useState<string>("global");
  const [projectId, setProjectId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState("5.00");
  const [submitting, setSubmitting] = useState(false);

  const { data: personas = [] } = usePersonas();
  const { data: projectsList = [] } = useProjects();
  const addToast = useToastStore((s) => s.addToast);

  const canSubmit = personaId && prompt.trim() && (scope === "global" || projectId);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await runExecution({
        personaId,
        prompt: prompt.trim(),
        projectId: scope === "project" ? projectId : undefined,
        budgetUsd: parseFloat(budget) || undefined,
      });
      addToast({
        type: "success",
        title: "Execution started",
        description: `Created execution ${result.id}`,
      });
      setOpen(false);
      resetForm();
    } catch {
      addToast({
        type: "error",
        title: "Failed to start execution",
        description: "The endpoint may not be available yet.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPersonaId("");
    setScope("global");
    setProjectId("");
    setPrompt("");
    setBudget("5.00");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1.5">
          <Play className="h-3.5 w-3.5" />
          New Run
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Agent Run</DialogTitle>
          <DialogDescription>
            Start a standalone agent execution with a custom prompt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Persona picker */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Persona</p>
            <Select value={personaId} onValueChange={setPersonaId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a persona..." />
              </SelectTrigger>
              <SelectContent>
                {personas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scope */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Scope</p>
            <Select value={scope} onValueChange={(v) => { setScope(v); if (v === "global") setProjectId(""); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project selector (only when scope is project) */}
          {scope === "project" && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Project</p>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projectsList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Prompt */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Prompt</p>
            <Textarea
              placeholder="What should the agent do?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Budget (USD)</p>
            <Input
              type="number"
              step="0.50"
              min="0"
              placeholder="5.00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Starting..." : "Start Run"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
