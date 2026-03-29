import { Skeleton } from "@/components/ui/skeleton";

// ── Dashboard skeleton ─────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Active agents strip */}
      <Skeleton className="h-20 w-full rounded-lg" />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Kanban board skeleton ──────────────────────────────────────────

export function KanbanSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }).map((_, col) => (
          <div key={col} className="w-[280px] shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, card) => (
              <div key={card} className="rounded-lg border p-3 space-y-2.5">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-10 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Story / task detail skeleton ───────────────────────────────────

export function DetailSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="space-y-3">
        <Skeleton className="h-7 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Agent monitor skeleton ─────────────────────────────────────────

export function AgentMonitorSkeleton() {
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-[250px] shrink-0 border-r p-3 space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 p-2 rounded-md">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      {/* Terminal area */}
      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20 ml-auto rounded-md" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${40 + Math.random() * 50}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Activity feed skeleton ─────────────────────────────────────────

export function ActivityFeedSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-9 w-full rounded-md" />
      <div className="space-y-1">
        <Skeleton className="h-6 w-24 mb-2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings skeleton ──────────────────────────────────────────────

export function SettingsSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-[200px] shrink-0 border-r p-3 space-y-1">
        <Skeleton className="h-4 w-16 mb-3" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
      <div className="flex-1 p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
