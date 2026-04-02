import { useState } from "react";
import { Settings2, Palette, Server, Database } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ApiKeysSection } from "@/features/settings/api-keys-section";
import {
  AppearanceSection,
  ServiceSection,
  DataSection,
} from "@/features/settings/appearance-section";

// ── Section definitions ─────────────────────────────────────────

interface SectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

const SECTIONS: SectionDef[] = [
  { id: "api-keys", label: "API Keys & Executor Mode", icon: Settings2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "service", label: "Service", icon: Server },
  { id: "data", label: "Data Management", icon: Database },
];

// ── Main component ──────────────────────────────────────────────

export function AppSettingsPage() {
  const [activeSection, setActiveSection] = useState("api-keys");

  const currentSection =
    SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0]!;

  return (
    <div className="flex h-full">
      {/* Sidebar nav */}
      <nav className="w-[200px] shrink-0 border-r border-border bg-card p-3 space-y-0.5">
        <h2 className="text-xs font-semibold text-muted-foreground px-2 pb-2">
          App Settings
        </h2>
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
          {activeSection === "api-keys" ? (
            <ApiKeysSection />
          ) : activeSection === "appearance" ? (
            <AppearanceSection />
          ) : activeSection === "service" ? (
            <ServiceSection />
          ) : activeSection === "data" ? (
            <DataSection />
          ) : null}
        </div>
      </div>
    </div>
  );
}
