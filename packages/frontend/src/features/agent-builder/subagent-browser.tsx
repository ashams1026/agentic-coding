import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Loader2, Plus, X, Users, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSdkCapabilities } from "@/api/client";
import type { SdkAgent } from "@/api/client";
import { cn } from "@/lib/utils";

// ── Props ────────────────────────────────────────────────────────

interface SubagentBrowserProps {
  open: boolean;
  onClose: () => void;
  onAdd: (agentName: string) => void;
  existingSubagents: string[];
}

// ── Component ────────────────────────────────────────────────────

export function SubagentBrowser({
  open,
  onClose,
  onAdd,
  existingSubagents,
}: SubagentBrowserProps) {
  const [agents, setAgents] = useState<SdkAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<SdkAgent | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const caps = await getSdkCapabilities();
      setAgents(caps.agents);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load SDK agents",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAgents();
      setSearch("");
      setSelectedAgent(null);
    }
  }, [open, fetchAgents]);

  const filtered = useMemo(() => {
    if (!search.trim()) return agents;
    const q = search.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [agents, search]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            SDK Subagents
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm h-8 pl-8"
          />
        </div>

        {/* Agent list */}
        <ScrollArea className="h-[280px] rounded border">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={fetchAgents}
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground">
                {search ? "No agents match your search" : "No agents available"}
              </p>
            </div>
          ) : (
            <div className="p-1">
              {filtered.map((agent) => {
                const added = existingSubagents.includes(agent.name);
                const isSelected = selectedAgent?.name === agent.name;
                return (
                  <div
                    key={agent.name}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors group cursor-pointer",
                      isSelected
                        ? "bg-accent/50"
                        : "hover:bg-accent/30",
                    )}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">{agent.name}</span>
                      {agent.model && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1.5">
                          {agent.model}
                        </Badge>
                      )}
                    </div>
                    {added ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 shrink-0"
                      >
                        Added
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdd(agent.name);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Description panel for selected agent */}
        {selectedAgent && (
          <div className="rounded border bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/40">
              <span className="text-xs font-medium">
                {selectedAgent.name}
                {selectedAgent.model && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1.5">
                    {selectedAgent.model}
                  </Badge>
                )}
              </span>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs text-foreground/80">
                {selectedAgent.description || "No description available."}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
