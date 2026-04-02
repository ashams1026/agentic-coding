import { useState } from "react";
import {
  FolderOpen,
  DollarSign,
  Palette,
  Server,
  Database,
  Settings2,
  Shield,
  Bell,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ProjectsSection } from "./projects-section";
import { ApiKeysSection } from "./api-keys-section";
import { CostsSection } from "./costs-section";
import { AppearanceSection, ServiceSection, DataSection } from "./appearance-section";
import { SecuritySection } from "./security-section";
import { NotificationsSection } from "./notifications-section";
import { IntegrationsSection } from "./integrations-section";

// ── Section definitions ─────────────────────────────────────────

interface SectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

const SECTIONS: SectionDef[] = [
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "agent-config", label: "Agent Configuration", icon: Settings2 },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "costs", label: "Costs", icon: DollarSign },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "integrations", label: "Integrations", icon: Webhook },
  { id: "service", label: "Service", icon: Server },
  { id: "data", label: "Data", icon: Database },
];

// ── Placeholder sections ────────────────────────────────────────

function SectionPlaceholder({ section }: { section: SectionDef }) {
  const Icon = section.icon;
  return (
    <div className="flex items-center gap-3 py-12 justify-center text-muted-foreground/40">
      <Icon className="h-8 w-8" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{section.label}</p>
        <p className="text-xs text-muted-foreground/60">Section coming soon.</p>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState("projects");

  const currentSection = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0]!;

  return (
    <div className="flex h-full">
      {/* Sidebar nav */}
      <nav className="w-[200px] shrink-0 border-r border-border bg-card p-3 space-y-0.5">
        <h2 className="text-xs font-semibold text-muted-foreground px-2 pb-2">
          Settings
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
          {activeSection === "projects" ? (
            <ProjectsSection />
          ) : activeSection === "security" ? (
            <SecuritySection />
          ) : activeSection === "agent-config" ? (
            <ApiKeysSection />
          ) : activeSection === "notifications" ? (
            <NotificationsSection />
          ) : activeSection === "costs" ? (
            <CostsSection />
          ) : activeSection === "integrations" ? (
            <IntegrationsSection />
          ) : activeSection === "appearance" ? (
            <AppearanceSection />
          ) : activeSection === "service" ? (
            <ServiceSection />
          ) : activeSection === "data" ? (
            <DataSection />
          ) : (
            <SectionPlaceholder section={currentSection} />
          )}
        </div>
      </div>
    </div>
  );
}
