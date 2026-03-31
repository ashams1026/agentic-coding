import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Loader2, Plus, X, Slash, RefreshCw } from "lucide-react";
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
import type { SdkSkill } from "@/api/client";
import { cn } from "@/lib/utils";

// ── Props ────────────────────────────────────────────────────────

interface SkillBrowserProps {
  open: boolean;
  onClose: () => void;
  onAdd: (skillName: string) => void;
  existingSkills: string[];
}

// ── Component ────────────────────────────────────────────────────

export function SkillBrowser({
  open,
  onClose,
  onAdd,
  existingSkills,
}: SkillBrowserProps) {
  const [skills, setSkills] = useState<SdkSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [manualPath, setManualPath] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<SdkSkill | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const caps = await getSdkCapabilities();
      setSkills(caps.commands);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load SDK skills",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when dialog opens
  useEffect(() => {
    if (open) {
      fetchSkills();
      setSearch("");
      setSelectedSkill(null);
      setManualPath("");
    }
  }, [open, fetchSkills]);

  const filtered = useMemo(() => {
    if (!search.trim()) return skills;
    const q = search.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [skills, search]);

  const handleAddManual = () => {
    const trimmed = manualPath.trim();
    if (!trimmed) return;
    if (!existingSkills.includes(trimmed)) {
      onAdd(trimmed);
    }
    setManualPath("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Slash className="h-4 w-4 text-muted-foreground" />
            SDK Skills
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm h-8 pl-8"
          />
        </div>

        {/* Skill list */}
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
                onClick={fetchSkills}
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-muted-foreground">
                {search ? "No skills match your search" : "No skills available"}
              </p>
            </div>
          ) : (
            <div className="p-1">
              {filtered.map((skill) => {
                const added = existingSkills.includes(skill.name);
                const isSelected = selectedSkill?.name === skill.name;
                return (
                  <div
                    key={skill.name}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors group cursor-pointer",
                      isSelected
                        ? "bg-accent/50"
                        : "hover:bg-accent/30",
                    )}
                    onClick={() => setSelectedSkill(skill)}
                  >
                    <Slash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">{skill.name}</span>
                      {skill.argumentHint && (
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          {skill.argumentHint}
                        </span>
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
                          onAdd(skill.name);
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

        {/* Description panel for selected skill */}
        {selectedSkill && (
          <div className="rounded border bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/40">
              <span className="text-xs font-medium">
                /{selectedSkill.name}
                {selectedSkill.argumentHint && (
                  <span className="text-muted-foreground ml-1">
                    {selectedSkill.argumentHint}
                  </span>
                )}
              </span>
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs text-foreground/80">
                {selectedSkill.description || "No description available."}
              </p>
            </div>
          </div>
        )}

        {/* Manual path input fallback */}
        <div className="border-t pt-3">
          <p className="text-[10px] text-muted-foreground mb-1.5">
            Custom skill (file path or name not listed above)
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., skills/review.md"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
              className="text-sm h-8"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0"
              onClick={handleAddManual}
              disabled={!manualPath.trim()}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
