import { useNotificationStore, type NotificationPreferences } from "@/stores/notification-store";
import type { NotificationEventType } from "@agentops/shared";
import { cn } from "@/lib/utils";

// ── Event type labels ───────────────────────────────────────────

const EVENT_LABELS: { type: NotificationEventType; label: string; description: string }[] = [
  { type: "proposal_needs_approval", label: "Agent needs approval", description: "When an agent submits a proposal for review" },
  { type: "agent_errored", label: "Agent errored", description: "When an agent execution fails" },
  { type: "budget_threshold", label: "Budget threshold", description: "When monthly spend reaches 80% of cap" },
  { type: "agent_completed", label: "Agent completed", description: "When an agent finishes a task" },
];

// ── Toggle component ────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}

// ── Component ───────────────────────────────────────────────────

export function NotificationsSection() {
  const { preferences, updatePreferences } = useNotificationStore();

  const setEnabled = (type: NotificationEventType, value: boolean) => {
    updatePreferences({
      enabledEvents: { ...preferences.enabledEvents, [type]: value },
    });
  };

  const setSound = (type: NotificationEventType, value: boolean) => {
    updatePreferences({
      soundEvents: { ...preferences.soundEvents, [type]: value },
    });
  };

  const setQuietHours = (patch: Partial<NotificationPreferences["quietHours"]>) => {
    updatePreferences({
      quietHours: { ...preferences.quietHours, ...patch },
    });
  };

  return (
    <div className="space-y-8">
      {/* Event type toggles */}
      <section>
        <h3 className="text-sm font-semibold mb-1">Event Types</h3>
        <p className="text-xs text-muted-foreground mb-4">Choose which events trigger notifications.</p>

        <div className="border border-border rounded-md divide-y divide-border">
          {/* Header */}
          <div className="grid grid-cols-[1fr_60px_60px] gap-2 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Event</span>
            <span className="text-center">In-App</span>
            <span className="text-center">Sound</span>
          </div>

          {EVENT_LABELS.map(({ type, label, description }) => (
            <div key={type} className="grid grid-cols-[1fr_60px_60px] gap-2 items-center px-4 py-3">
              <div>
                <p className="text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="flex justify-center">
                <Toggle
                  checked={preferences.enabledEvents[type]}
                  onChange={(v) => setEnabled(type, v)}
                />
              </div>
              <div className="flex justify-center">
                <Toggle
                  checked={preferences.soundEvents[type]}
                  onChange={(v) => setSound(type, v)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quiet Hours */}
      <section>
        <h3 className="text-sm font-semibold mb-1">Quiet Hours</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Suppress non-critical notifications during quiet hours. Critical notifications (errors, proposals) always come through.
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Enable quiet hours</span>
            <Toggle
              checked={preferences.quietHours.enabled}
              onChange={(v) => setQuietHours({ enabled: v })}
            />
          </div>

          {preferences.quietHours.enabled && (
            <div className="flex items-center gap-3 pl-4">
              <label className="text-xs text-muted-foreground">From</label>
              <input
                type="time"
                value={preferences.quietHours.from}
                onChange={(e) => setQuietHours({ from: e.target.value })}
                className="rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
              />
              <label className="text-xs text-muted-foreground">To</label>
              <input
                type="time"
                value={preferences.quietHours.to}
                onChange={(e) => setQuietHours({ to: e.target.value })}
                className="rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
              />
            </div>
          )}
        </div>
      </section>

      {/* Scope */}
      <section>
        <h3 className="text-sm font-semibold mb-1">Scope</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Filter notifications by project scope.
        </p>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="notification-scope"
              checked={preferences.scope === "all"}
              onChange={() => updatePreferences({ scope: "all" })}
              className="h-4 w-4"
            />
            <div>
              <span className="text-sm">All projects</span>
              <p className="text-xs text-muted-foreground">Receive notifications from all projects</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="notification-scope"
              checked={preferences.scope === "current-project"}
              onChange={() => updatePreferences({ scope: "current-project" })}
              className="h-4 w-4"
            />
            <div>
              <span className="text-sm">Current project only</span>
              <p className="text-xs text-muted-foreground">Only show notifications for the selected project</p>
            </div>
          </label>
        </div>
      </section>
    </div>
  );
}
