import { useState } from "react";
import { cn } from "@/lib/utils";
import { OverviewTab } from "@/features/analytics/overview-tab";

type AnalyticsTab = "overview" | "token-usage";

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cost tracking, token usage, and execution insights.
        </p>
      </div>

      {/* Tab bar */}
      <div className="px-6 flex gap-1 border-b shrink-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "overview"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("token-usage")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            activeTab === "token-usage"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Token Usage
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "token-usage" && (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">Token usage charts will render here (ANL.6)</p>
          </div>
        )}
      </div>
    </div>
  );
}
