import { useState } from "react";
import { Shield, DollarSign, Bell, Webhook } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useProjectFromUrl } from "@/hooks";
import { SecuritySection } from "@/features/settings/security-section";
import { CostsSection } from "@/features/settings/costs-section";
import { NotificationsSection } from "@/features/settings/notifications-section";
import { IntegrationsSection } from "@/features/settings/integrations-section";

// ── Section definitions ─────────────────────────────────────────

interface SectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

const SECTIONS: SectionDef[] = [
  { id: "security", label: "Security", icon: Shield },
  { id: "costs", label: "Costs & Limits", icon: DollarSign },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Webhook },
];

// ── Main component ──────────────────────────────────────────────

export function ProjectSettingsPage() {
  const [activeSection, setActiveSection] = useState("security");
  const { project, isLoading } = useProjectFromUrl();

  const currentSection =
    SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0]!;

  const projectName = isLoading
    ? "Loading..."
    : project?.name ?? "Unknown Project";

  return (
    <div className="flex h-full">
      {/* Sidebar nav */}
      <nav className="w-[200px] shrink-0 border-r border-border bg-card p-3 space-y-0.5">
        <h2 className="text-xs font-semibold text-muted-foreground px-2 pb-1">
          Project Settings
        </h2>
        <p className="text-xs text-foreground/70 px-2 pb-2 truncate" title={projectName}>
          {projectName}
        </p>
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm">{section.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* Section header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold">{currentSection.label}</h1>
            <Separator className="mt-3" />
          </div>

          {/* Section content */}
          {activeSection === "security" ? (
            <SecuritySection />
          ) : activeSection === "costs" ? (
            <CostsSection />
          ) : activeSection === "notifications" ? (
            <NotificationsSection />
          ) : activeSection === "integrations" ? (
            <IntegrationsSection />
          ) : null}
        </div>
      </div>
    </div>
  );
}
