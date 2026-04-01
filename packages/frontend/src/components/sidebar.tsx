import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  ListTodo,
  Bot,
  Activity,
  MessageSquare,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeft,
  FolderOpen,
  Sun,
  Moon,
  Monitor,
  Dog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useActivityStore } from "@/stores/activity-store";
import { useExecutions, useDashboardStats, useProjects } from "@/hooks";
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
  { to: "/items", icon: ListTodo, label: "Work Items" },
  { to: "/agents", icon: Bot, label: "Agent Monitor" },
  { to: "/activity", icon: Activity, label: "Activity Feed" },
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/personas", icon: Users, label: "Personas" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

const themeOrder = ["system", "light", "dark"] as const;
const themeIcon = { system: Monitor, light: Sun, dark: Moon } as const;
const themeLabel = { system: "System", light: "Light", dark: "Dark" } as const;

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen, theme, setTheme, selectedProjectId, setSelectedProjectId } = useUIStore();
  const { data: executions } = useExecutions(undefined, selectedProjectId ?? undefined);
  const { data: dashboardStats } = useDashboardStats(selectedProjectId ?? undefined);
  const { data: projectsList } = useProjects();
  const activeAgentCount = executions?.filter((e) => e.status === "running").length ?? 0;
  const pendingProposalCount = dashboardStats?.pendingProposals ?? 0;
  const unreadActivityCount = useActivityStore((s) => s.unreadCount);
  const location = useLocation();

  // Auto-select the first project if none is selected or selected project no longer exists
  useEffect(() => {
    if (projectsList && projectsList.length > 0) {
      const selectedExists = selectedProjectId && projectsList.some((p) => p.id === selectedProjectId);
      if (!selectedExists) {
        setSelectedProjectId(projectsList[0]!.id);
      }
    }
  }, [selectedProjectId, projectsList, setSelectedProjectId]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  const sidebarContent = (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-sidebar-collapsed" : "w-sidebar",
      )}
    >
      {/* App brand */}
      <div className={cn(
        "flex items-center border-b border-border px-2",
        sidebarCollapsed ? "h-10 justify-center" : "h-10 gap-2 px-3",
      )}>
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "#f59e0b" }}
        >
          <Dog className="h-3.5 w-3.5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-sm font-bold tracking-tight">Woof</span>
        )}
      </div>

      {/* Project switcher */}
      <div className="flex h-12 items-center border-b border-border px-2 justify-center">
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <FolderOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {projectsList?.find((p) => p.id === selectedProjectId)?.name ?? "No project"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Select
            value={selectedProjectId ?? undefined}
            onValueChange={(value) => setSelectedProjectId(value)}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="No projects" />
            </SelectTrigger>
            <SelectContent>
              {projectsList && projectsList.length > 0 ? (
                projectsList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No projects</SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(to);

          return (
            <Tooltip key={to}>
              <TooltipTrigger asChild>
                <Link
                  to={to}
                  className={cn(
                    "flex w-full items-center rounded-md text-sm transition-colors duration-150",
                    "hover:bg-muted",
                    isActive
                      ? "bg-muted text-foreground font-semibold border-l-[3px] border-l-primary"
                      : "text-muted-foreground font-medium border-l-[3px] border-l-transparent",
                    sidebarCollapsed
                      ? "justify-center px-2 py-2"
                      : "gap-3 px-3 py-2",
                  )}
                >
                  <span className="relative shrink-0 inline-flex">
                    <Icon className="h-5 w-5" />
                    {/* Collapsed badges */}
                    {to === "/items" && pendingProposalCount > 0 && (
                      <span
                        className={cn(
                          "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-xs font-bold text-white transition-all duration-200",
                          sidebarCollapsed ? "scale-100 opacity-100" : "scale-0 opacity-0",
                        )}
                      >
                        {pendingProposalCount}
                      </span>
                    )}
                    {to === "/agents" && activeAgentCount > 0 && (
                      <span
                        className={cn(
                          "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-xs font-bold text-white transition-all duration-200",
                          sidebarCollapsed ? "scale-100 opacity-100" : "scale-0 opacity-0",
                        )}
                      >
                        {activeAgentCount}
                      </span>
                    )}
                    {to === "/activity" && unreadActivityCount > 0 && (
                      <span
                        className={cn(
                          "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-0.5 text-xs font-bold text-white transition-all duration-200",
                          sidebarCollapsed ? "scale-100 opacity-100" : "scale-0 opacity-0",
                        )}
                      >
                        {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                      </span>
                    )}
                  </span>
                  {/* Label + expanded badges */}
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{label}</span>
                      {to === "/items" && pendingProposalCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white shrink-0">
                          {pendingProposalCount}
                        </span>
                      )}
                      {to === "/agents" && activeAgentCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-bold text-white shrink-0">
                          {activeAgentCount}
                        </span>
                      )}
                      {to === "/activity" && unreadActivityCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-xs font-bold text-white shrink-0">
                          {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </TooltipTrigger>
              {sidebarCollapsed && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          );
        })}
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

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
