import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Kanban,
  Bot,
  Activity,
  GitBranch,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeft,
  FolderOpen,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useActivityStore } from "@/stores/activity-store";
import { useExecutions } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/board", icon: Kanban, label: "Story Board" },
  { to: "/agents", icon: Bot, label: "Agent Monitor" },
  { to: "/activity", icon: Activity, label: "Activity Feed" },
  { to: "/workflows", icon: GitBranch, label: "Workflows" },
  { to: "/personas", icon: Users, label: "Personas" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

const themeOrder = ["system", "light", "dark"] as const;
const themeIcon = { system: Monitor, light: Sun, dark: Moon } as const;
const themeLabel = { system: "System", light: "Light", dark: "Dark" } as const;

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useUIStore();
  const { data: executions } = useExecutions();
  const activeAgentCount = executions?.filter((e) => e.status === "running").length ?? 0;
  const unreadActivityCount = useActivityStore((s) => s.unreadCount);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-card transition-all duration-200",
        sidebarCollapsed ? "w-sidebar-collapsed" : "w-sidebar",
      )}
    >
      {/* Project switcher */}
      <div className="flex h-14 items-center border-b border-border px-2 justify-center">
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <FolderOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">AgentOps</TooltipContent>
          </Tooltip>
        ) : (
          <Select defaultValue="agentops">
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agentops">AgentOps</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Tooltip key={to}>
            <TooltipTrigger asChild>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground",
                    sidebarCollapsed && "justify-center px-2 py-2",
                  )
                }
              >
                <span className="relative">
                  <Icon className="h-4 w-4 shrink-0" />
                  {to === "/agents" && activeAgentCount > 0 && sidebarCollapsed && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-[9px] font-bold text-white">
                      {activeAgentCount}
                    </span>
                  )}
                  {to === "/activity" && unreadActivityCount > 0 && sidebarCollapsed && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-0.5 text-[9px] font-bold text-white">
                      {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                    </span>
                  )}
                </span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    {to === "/agents" && activeAgentCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                        {activeAgentCount}
                      </span>
                    )}
                    {to === "/activity" && unreadActivityCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                        {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right">{label}</TooltipContent>
            )}
          </Tooltip>
        ))}
      </nav>

      <Separator />

      {/* Theme toggle + Collapse toggle */}
      <div className="flex items-center justify-center gap-1 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const idx = themeOrder.indexOf(theme);
                setTheme(themeOrder[(idx + 1) % themeOrder.length]!);
              }}
            >
              {(() => {
                const ThemeIcon = themeIcon[theme];
                return <ThemeIcon className="h-4 w-4" />;
              })()}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Theme: {themeLabel[theme]}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
