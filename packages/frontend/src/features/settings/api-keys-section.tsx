import { useState, useEffect } from "react";
import {
  Check,
  Loader2,
  Bot,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProjects, useUpdateProject, usePersonas, useHealth } from "@/hooks";
import { cn } from "@/lib/utils";
import { getApiKeyStatus, setApiKey, deleteApiKey, getConcurrencyStats, getExecutorMode, setExecutorMode } from "@/api";

// ── API Key input ──────────────────────────────────────────────────

function ApiKeySection() {
  const [inputKey, setInputKey] = useState("");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current status on mount
  useEffect(() => {
    getApiKeyStatus()
      .then((status) => {
        setConfigured(status.configured);
        setMaskedKey(status.maskedKey);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      const result = await setApiKey(inputKey);
      setTesting(false);
      if (result.valid) {
        setTestResult("success");
        setConfigured(true);
        setMaskedKey(result.maskedKey);
        setInputKey("");
      } else {
        setTestResult("error");
      }
    } catch (err) {
      setTesting(false);
      setTestResult("error");
      setErrorMessage(err instanceof Error ? err.message : "Connection failed");
    }
  };

  const handleRemove = async () => {
    const result = await deleteApiKey();
    setConfigured(result.configured);
    setMaskedKey(result.maskedKey);
    setTestResult(null);
    setErrorMessage(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-9 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Anthropic API Key</p>
        <p className="text-xs text-muted-foreground mb-3">
          Used to authenticate agent requests to the Claude API.
        </p>
      </div>

      {configured && maskedKey ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50">
            <Check className="h-4 w-4 text-green-500 shrink-0" />
            <span className="font-mono text-sm text-muted-foreground">{maskedKey}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="gap-1.5 shrink-0 text-destructive hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setTestResult(null);
                setErrorMessage(null);
              }}
              placeholder="sk-ant-api03-..."
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !inputKey.trim()}
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
                : errorMessage ?? "Connection failed — check your API key."}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Concurrency slider ─────────────────────────────────────────────

function ConcurrencySection() {
  const { data: projectsList } = useProjects();
  const updateProject = useUpdateProject();
  const [stats, setStats] = useState<{ active: number; queued: number } | null>(null);

  const project = projectsList?.[0];
  const maxAgents = typeof project?.settings?.maxConcurrent === "number"
    ? project.settings.maxConcurrent as number
    : 3;

  // Fetch live active/queued stats
  useEffect(() => {
    getConcurrencyStats().then(setStats).catch(() => {});
    const interval = setInterval(() => {
      getConcurrencyStats().then(setStats).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (value: number) => {
    if (!project) return;
    updateProject.mutate({
      id: project.id,
      settings: { ...project.settings, maxConcurrent: value },
    });
  };

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
          onChange={(e) => handleChange(Number(e.target.value))}
          disabled={!project}
          className="flex-1 h-2 rounded-full appearance-none bg-secondary cursor-pointer accent-primary disabled:opacity-50"
        />
        <Badge variant="secondary" className="text-sm font-mono tabular-nums min-w-[2.5rem] justify-center">
          {maxAgents}
        </Badge>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground px-0.5">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>

      {stats && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span>Active: <span className="font-mono font-medium text-foreground">{stats.active}</span></span>
          <span>Queued: <span className="font-mono font-medium text-foreground">{stats.queued}</span></span>
        </div>
      )}

      {!project && (
        <p className="text-xs text-muted-foreground">No project configured. Add a project first.</p>
      )}
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

// ── Executor mode toggle ──────────────────────────────────────────

function ExecutorModeSection() {
  const { data: health } = useHealth();
  const [mode, setMode] = useState<"mock" | "claude" | null>(null);
  const [isProduction, setIsProduction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getExecutorMode()
      .then((res) => {
        setMode(res.mode);
        setIsProduction(res.isProduction);
      })
      .finally(() => setLoading(false));
  }, []);

  // Sync from health check if available
  useEffect(() => {
    if (health?.executor && mode !== null) {
      setMode(health.executor);
    }
  }, [health?.executor]);

  const handleChange = async (newMode: "mock" | "claude") => {
    setSaving(true);
    try {
      const res = await setExecutorMode(newMode);
      setMode(res.mode);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="h-9 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (isProduction) return null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">Agent Executor</p>
        <p className="text-xs text-muted-foreground mb-3">
          Simulated mode runs fake agent executions for testing the pipeline without using API credits. Agents will produce placeholder output.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleChange("claude")}
          disabled={saving}
          className={cn(
            "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
            mode === "claude"
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border hover:bg-muted text-muted-foreground",
          )}
        >
          Claude API (real)
        </button>
        <button
          type="button"
          onClick={() => handleChange("mock")}
          disabled={saving}
          className={cn(
            "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
            mode === "mock"
              ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
              : "border-border hover:bg-muted text-muted-foreground",
          )}
        >
          Simulated (no API calls)
        </button>
      </div>

      {mode === "mock" && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Agents are running in simulated mode. No API credits will be used.
        </p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function ApiKeysSection() {
  return (
    <div className="space-y-6">
      <ApiKeySection />
      <Separator />
      <ExecutorModeSection />
      <Separator />
      <ConcurrencySection />
      <Separator />
      <PersonaLimitsSection />
    </div>
  );
}
