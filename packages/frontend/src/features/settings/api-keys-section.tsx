import { useState } from "react";
import {
  Eye,
  EyeOff,
  Check,
  Loader2,
  Bot,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePersonas } from "@/hooks";
import { cn } from "@/lib/utils";

// ── API Key input ──────────────────────────────────────────────────

function ApiKeySection() {
  const [key, setKey] = useState("sk-ant-api03-xxxxxxxxxxxxxxxxxxxx");
  const [revealed, setRevealed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const maskedKey = key
    ? key.slice(0, 12) + "\u2022".repeat(Math.max(0, key.length - 16)) + key.slice(-4)
    : "";

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    // Mock: simulate a connection test
    await new Promise((r) => setTimeout(r, 1200));
    setTesting(false);
    setTestResult(key.startsWith("sk-") ? "success" : "error");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Anthropic API Key</p>
        <p className="text-xs text-muted-foreground mb-3">
          Used to authenticate agent requests to the Claude API.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={revealed ? "text" : "password"}
            value={revealed ? key : maskedKey}
            onChange={(e) => {
              setKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="sk-ant-api03-..."
            className="pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testing || !key}
          className="gap-1.5 shrink-0"
        >
          {testing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : testResult === "success" ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : null}
          {testing ? "Testing..." : "Test connection"}
        </Button>
      </div>

      {testResult && (
        <p
          className={cn(
            "text-xs",
            testResult === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-destructive",
          )}
        >
          {testResult === "success"
            ? "Connection successful — API key is valid."
            : "Connection failed — check your API key."}
        </p>
      )}
    </div>
  );
}

// ── Concurrency slider ─────────────────────────────────────────────

function ConcurrencySection() {
  const [maxAgents, setMaxAgents] = useState(3);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Max Concurrent Agents</p>
        <p className="text-xs text-muted-foreground mb-3">
          Maximum number of agents that can run simultaneously.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="range"
          min={1}
          max={10}
          value={maxAgents}
          onChange={(e) => setMaxAgents(Number(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none bg-secondary cursor-pointer accent-primary"
        />
        <Badge variant="secondary" className="text-sm font-mono tabular-nums min-w-[2.5rem] justify-center">
          {maxAgents}
        </Badge>
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}

// ── Per-persona limits ─────────────────────────────────────────────

interface PersonaLimit {
  personaId: string;
  personaName: string;
  color: string;
  limit: number | null;
}

function PersonaLimitsSection() {
  const { data: personas = [] } = usePersonas();
  const [limits, setLimits] = useState<PersonaLimit[]>([]);

  // Initialize limits from personas if not yet set
  const effectiveLimits: PersonaLimit[] =
    limits.length > 0
      ? limits
      : personas.map((p) => ({
          personaId: p.id,
          personaName: p.name,
          color: p.avatar.color,
          limit: null,
        }));

  const handleLimitChange = (personaId: string, value: string) => {
    const numValue = value === "" ? null : Math.min(10, Math.max(1, Number(value)));
    const updated = effectiveLimits.map((l) =>
      l.personaId === personaId ? { ...l, limit: numValue } : l,
    );
    setLimits(updated);
  };

  const handleClearLimit = (personaId: string) => {
    const updated = effectiveLimits.map((l) =>
      l.personaId === personaId ? { ...l, limit: null } : l,
    );
    setLimits(updated);
  };

  if (personas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Per-Persona Limits</p>
        <p className="text-xs text-muted-foreground mb-3">
          Optionally limit how many instances of each persona can run concurrently.
        </p>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left font-medium px-3 py-2">Persona</th>
              <th className="text-right font-medium px-3 py-2 w-[120px]">Max Concurrent</th>
              <th className="w-[40px]" />
            </tr>
          </thead>
          <tbody>
            {effectiveLimits.map((entry) => (
              <tr key={entry.personaId} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
                      style={{ backgroundColor: entry.color + "20" }}
                    >
                      <Bot className="h-3 w-3" style={{ color: entry.color }} />
                    </span>
                    <span className="truncate">{entry.personaName}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    placeholder="—"
                    value={entry.limit ?? ""}
                    onChange={(e) => handleLimitChange(entry.personaId, e.target.value)}
                    className="h-7 w-[80px] text-right text-sm ml-auto"
                  />
                </td>
                <td className="px-1 py-2">
                  {entry.limit !== null && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleClearLimit(entry.personaId)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function ApiKeysSection() {
  return (
    <div className="space-y-6">
      <ApiKeySection />
      <Separator />
      <ConcurrencySection />
      <Separator />
      <PersonaLimitsSection />
    </div>
  );
}
