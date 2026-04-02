import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Copy, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToastStore } from "@/stores/toast-store";

// ── Types ───────────────────────────────────────────────────────

interface WebhookSubscription {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: string;
  statusCode: number | null;
  latencyMs: number | null;
  attempt: number;
  createdAt: string;
}

const EVENT_OPTIONS = [
  { value: "execution.started", label: "Execution Started" },
  { value: "execution.completed", label: "Execution Completed" },
  { value: "execution.failed", label: "Execution Failed" },
  { value: "work_item.state_changed", label: "Work Item State Changed" },
];

// ── Helpers ─────────────────────────────────────────────────────

const BASE_URL = "http://localhost:3001";

async function fetchWebhooks(): Promise<WebhookSubscription[]> {
  const res = await fetch(`${BASE_URL}/api/webhooks`);
  const data = await res.json();
  return data.data;
}

async function createWebhook(url: string, events: string[]): Promise<WebhookSubscription> {
  const res = await fetch(`${BASE_URL}/api/webhooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, events }),
  });
  const data = await res.json();
  return data.data;
}

async function deleteWebhook(id: string): Promise<void> {
  await fetch(`${BASE_URL}/api/webhooks/${id}`, { method: "DELETE" });
}

async function toggleWebhook(id: string, isActive: boolean): Promise<void> {
  await fetch(`${BASE_URL}/api/webhooks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
}

async function fetchDeliveries(id: string): Promise<WebhookDelivery[]> {
  const res = await fetch(`${BASE_URL}/api/webhooks/${id}/deliveries?limit=20`);
  const data = await res.json();
  return data.data;
}

// ── Component ───────────────────────────────────────────────────

export function IntegrationsSection() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<Set<string>>(new Set(["execution.completed"]));
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const addToast = useToastStore((s) => s.addToast);

  // Load on mount
  if (!loaded) {
    setLoaded(true);
    fetchWebhooks().then(setWebhooks).catch(() => {});
  }

  const handleCreate = async () => {
    if (!newUrl.trim()) return;
    try {
      const created = await createWebhook(newUrl.trim(), Array.from(newEvents));
      setNewSecret(created.secret ?? null);
      setWebhooks((prev) => [created, ...prev]);
      setNewUrl("");
      setNewEvents(new Set(["execution.completed"]));
      addToast({ type: "success", title: "Webhook created", description: "Copy the secret — it won't be shown again." });
    } catch {
      addToast({ type: "error", title: "Failed to create webhook" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWebhook(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch {
      addToast({ type: "error", title: "Failed to delete webhook" });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleWebhook(id, isActive);
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, isActive } : w)));
    } catch {
      addToast({ type: "error", title: "Failed to update webhook" });
    }
  };

  const handleViewDeliveries = async (id: string) => {
    if (selectedId === id) { setSelectedId(null); return; }
    setSelectedId(id);
    try {
      const d = await fetchDeliveries(id);
      setDeliveries(d);
    } catch {
      setDeliveries([]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-1">Outbound Webhooks</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Receive HTTP POST notifications when events occur. Payloads are signed with HMAC-SHA256.
        </p>
      </div>

      {/* Add webhook form */}
      {showAdd ? (
        <div className="rounded-lg border p-4 space-y-3">
          <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/webhook" className="h-8 text-xs" />
          <div className="flex flex-wrap gap-2">
            {EVENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNewEvents((prev) => { const next = new Set(prev); next.has(opt.value) ? next.delete(opt.value) : next.add(opt.value); return next; })}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${newEvents.has(opt.value) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {newSecret && (
            <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2">
              <span className="text-xs font-mono flex-1 truncate">{showSecret ? newSecret : "••••••••••••••••"}</span>
              <button type="button" onClick={() => setShowSecret(!showSecret)} className="text-muted-foreground hover:text-foreground">
                {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={() => { navigator.clipboard.writeText(newSecret); addToast({ type: "success", title: "Secret copied" }); }} className="text-muted-foreground hover:text-foreground">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={!newUrl.trim() || newEvents.size === 0}>Create</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowAdd(false); setNewSecret(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Webhook
        </Button>
      )}

      {/* Webhook list */}
      <div className="space-y-2">
        {webhooks.map((wh) => (
          <div key={wh.id} className="rounded-lg border bg-card">
            <div className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => handleToggle(wh.id, !wh.isActive)}
                className={`h-5 w-9 rounded-full transition-colors ${wh.isActive ? "bg-emerald-500" : "bg-muted"} relative`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${wh.isActive ? "left-[18px]" : "left-0.5"}`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate">{wh.url}</p>
                <div className="flex gap-1 mt-1">
                  {wh.events.map((e) => (
                    <Badge key={e} variant="secondary" className="text-[9px]">{e}</Badge>
                  ))}
                </div>
              </div>
              {wh.failureCount > 0 && (
                <Badge variant="destructive" className="text-[9px]">{wh.failureCount} failures</Badge>
              )}
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleViewDeliveries(wh.id)}>
                {selectedId === wh.id ? "Hide Log" : "Log"}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(wh.id)}>
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            </div>

            {/* Delivery log */}
            {selectedId === wh.id && (
              <div className="border-t px-3 py-2 max-h-[200px] overflow-y-auto">
                {deliveries.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">No deliveries yet</p>
                ) : (
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left py-1">Date</th>
                        <th className="text-left py-1">Event</th>
                        <th className="text-left py-1">Status</th>
                        <th className="text-right py-1">Latency</th>
                        <th className="text-right py-1">Attempt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((d) => (
                        <tr key={d.id} className="border-t border-border/50">
                          <td className="py-1 text-muted-foreground">{new Date(d.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                          <td className="py-1">{d.event}</td>
                          <td className="py-1">
                            {d.status === "delivered" ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-600"><CheckCircle2 className="h-2.5 w-2.5" />{d.statusCode}</span>
                            ) : d.status === "failed" ? (
                              <span className="inline-flex items-center gap-0.5 text-red-500"><XCircle className="h-2.5 w-2.5" />failed</span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-amber-500"><Loader2 className="h-2.5 w-2.5 animate-spin" />pending</span>
                            )}
                          </td>
                          <td className="py-1 text-right font-mono">{d.latencyMs ? `${d.latencyMs}ms` : "—"}</td>
                          <td className="py-1 text-right">{d.attempt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
        {webhooks.length === 0 && loaded && (
          <p className="text-xs text-muted-foreground text-center py-6">No webhooks configured. Click "Add Webhook" to get started.</p>
        )}
      </div>
    </div>
  );
}
