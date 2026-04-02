import { useEffect, useState } from "react";
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
  GitBranch,
  BarChart3,
  Globe,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
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
import { NotificationBell } from "@/features/notifications/notification-bell";
import { Separator } from "@/components/ui/separator";
import type { Project } from "@agentops/shared";

const themeOrder = ["system", "light", "dark"] as const;
const themeIcon = { system: Monitor, light: Sun, dark: Moon } as const;
const themeLabel = { system: "System", light: "Light", dark: "Dark" } as const;

const projectChildLinks = [
  { page: "items", icon: ListTodo, label: "Work Items" },
  { page: "automations", icon: GitBranch, label: "Automations" },
  { page: "agents", icon: Users, label: "Agents" },
  { page: "monitor", icon: Bot, label: "Agent Monitor" },
  { page: "activity", icon: Activity, label: "Activity Feed" },
  { page: "analytics", icon: BarChart3, label: "Analytics" },
  { page: "chat", icon: MessageSquare, label: "Chat" },
  { page: "settings", icon: Settings, label: "Project Settings" },
] as const;

export function Sidebar() {
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    theme,
    setTheme,
  } = useUIStore();
  const { data: projectsList } = useProjects();
  const { data: executions } = useExecutions();
  const { data: dashboardStats } = useDashboardStats();
  const activeAgentCount =
    executions?.filter((e) => e.status === "running").length ?? 0;
  const pendingProposalCount = dashboardStats?.pendingProposals ?? 0;
  const unreadActivityCount = useActivityStore((s) => s.unreadCount);
  const location = useLocation();

  // Expand/collapse state for project sections — persisted to localStorage
  const SIDEBAR_EXPANDED_KEY = "agentops-sidebar-expanded";

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_EXPANDED_KEY);
      if (stored) {
        const arr = JSON.parse(stored) as string[];
        return new Set(arr);
      }
    } catch {
      /* ignore — localStorage may be blocked */
    }
    return new Set(["pj-global"]);
  });

  // Persist expanded state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_EXPANDED_KEY,
        JSON.stringify([...expandedProjects]),
      );
    } catch {
      /* ignore */
    }
  }, [expandedProjects]);

  // Sort projects: global first, then alphabetical
  const sortedProjects = projectsList
    ? [...projectsList].sort((a, b) => {
        if (a.isGlobal) return -1;
        if (b.isGlobal) return 1;
        return a.name.localeCompare(b.name);
      })
    : [];

  // Auto-expand the project that matches the current URL
  useEffect(() => {
    const match = location.pathname.match(/^\/p\/([^/]+)/);
    if (match) {
      const projectId = match[1]!;
      setExpandedProjects((prev) => {
        if (prev.has(projectId)) return prev;
        const next = new Set(prev);
        next.add(projectId);
        return next;
      });
    }
  }, [location.pathname]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  function toggleProject(projectId: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  function isLinkActive(linkPath: string) {
    return (
      location.pathname === linkPath ||
      location.pathname.startsWith(linkPath + "/")
    );
  }

  function getBadge(page: string) {
    if (page === "items" && pendingProposalCount > 0) {
      return { count: pendingProposalCount, color: "bg-amber-500" };
    }
    if (page === "monitor" && activeAgentCount > 0) {
      return { count: activeAgentCount, color: "bg-emerald-500" };
    }
    if (page === "activity" && unreadActivityCount > 0) {
      return {
        count: unreadActivityCount > 9 ? "9+" : unreadActivityCount,
        color: "bg-sky-500",
      };
    }
    return null;
  }

  function renderProjectSection(project: Project) {
    const isExpanded = expandedProjects.has(project.id);
    const isGlobal = project.isGlobal;
    const ProjectIcon = isGlobal ? Globe : FolderOpen;

    return (
      <div key={project.id}>
        {/* Project header — click to expand/collapse */}
        <button
          onClick={() => toggleProject(project.id)}
          className={cn(
            "flex w-full items-center rounded-md text-sm transition-colors duration-150",
            "hover:bg-muted",
            "gap-2 px-3 py-1.5",
            isGlobal
              ? "text-violet-500 dark:text-violet-400 font-semibold"
              : "text-foreground font-medium",
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <ProjectIcon
            className={cn(
              "h-4 w-4 shrink-0",
              isGlobal
                ? "text-violet-500 dark:text-violet-400"
                : "text-muted-foreground",
            )}
          />
          <span className="flex-1 truncate text-left">{project.name}</span>
        </button>

        {/* Child links */}
        {isExpanded && (
          <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-2 mt-0.5 mb-1">
            {projectChildLinks.map(({ page, icon: Icon, label }) => {
              const linkPath = `/p/${project.id}/${page}`;
              const active = isLinkActive(linkPath);
              const badge = getBadge(page);

              return (
                <Link
                  key={page}
                  to={linkPath}
                  className={cn(
                    "flex items-center rounded-md text-sm transition-colors duration-150",
                    "hover:bg-muted",
                    "gap-2.5 px-2.5 py-1.5",
                    active
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground font-medium",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {badge && (
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold text-white shrink-0",
                        badge.color,
                      )}
                    >
                      {badge.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const sidebarContent = (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-sidebar-collapsed" : "w-sidebar",
      )}
    >
      {/* App brand */}
      <div
        className={cn(
          "flex items-center border-b border-border px-2",
          sidebarCollapsed ? "h-10 justify-center" : "h-10 gap-2 px-3",
        )}
      >
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

      {/* Main scrollable area */}
      <nav className="flex flex-1 flex-col overflow-y-auto">
        {sidebarCollapsed ? (
          /* Collapsed mode: show icon-only tooltips */
          <div className="flex flex-col gap-1 p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className={cn(
                    "flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-150",
                    "hover:bg-muted",
                    location.pathname === "/"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/app-settings"
                  className={cn(
                    "flex items-center justify-center rounded-md px-2 py-2 transition-colors duration-150",
                    "hover:bg-muted",
                    location.pathname.startsWith("/app-settings")
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">App Settings</TooltipContent>
            </Tooltip>

            <Separator className="my-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center rounded-md px-2 py-2 text-muted-foreground">
                  <FolderOpen className="h-5 w-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Projects</TooltipContent>
            </Tooltip>

            {/* Collapsed badge indicators */}
            {pendingProposalCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center rounded-md px-2 py-1">
                    <span className="relative inline-flex">
                      <ListTodo className="h-5 w-5 text-muted-foreground" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-xs font-bold text-white">
                        {pendingProposalCount}
                      </span>
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {pendingProposalCount} pending proposals
                </TooltipContent>
              </Tooltip>
            )}
            {activeAgentCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center rounded-md px-2 py-1">
                    <span className="relative inline-flex">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-xs font-bold text-white">
                        {activeAgentCount}
                      </span>
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {activeAgentCount} active agents
                </TooltipContent>
              </Tooltip>
            )}
            {unreadActivityCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center rounded-md px-2 py-1">
                    <span className="relative inline-flex">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-0.5 text-xs font-bold text-white">
                        {unreadActivityCount > 9 ? "9+" : unreadActivityCount}
                      </span>
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {unreadActivityCount} unread activities
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          /* Expanded mode: full project tree */
          <div className="flex flex-col gap-1 p-2">
            {/* Global section */}
            <Link
              to="/"
              className={cn(
                "flex items-center rounded-md text-sm transition-colors duration-150",
                "hover:bg-muted",
                "gap-3 px-3 py-2",
                location.pathname === "/"
                  ? "bg-muted text-foreground font-semibold border-l-[3px] border-l-primary"
                  : "text-muted-foreground font-medium border-l-[3px] border-l-transparent",
              )}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              <span className="flex-1 truncate">Dashboard</span>
            </Link>
            <Link
              to="/app-settings"
              className={cn(
                "flex items-center rounded-md text-sm transition-colors duration-150",
                "hover:bg-muted",
                "gap-3 px-3 py-2",
                location.pathname.startsWith("/app-settings")
                  ? "bg-muted text-foreground font-semibold border-l-[3px] border-l-primary"
                  : "text-muted-foreground font-medium border-l-[3px] border-l-transparent",
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              <span className="flex-1 truncate">App Settings</span>
            </Link>

            {/* Projects separator with expand/collapse all toggle */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                  Projects
                </span>
                <Separator className="flex-1" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 ml-1"
                    onClick={() => {
                      const allIds = sortedProjects.map((p) => p.id);
                      const allExpanded = allIds.every((id) =>
                        expandedProjects.has(id),
                      );
                      setExpandedProjects(
                        allExpanded ? new Set() : new Set(allIds),
                      );
                    }}
                  >
                    <ChevronsUpDown className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {sortedProjects.length > 0 &&
                  sortedProjects.every((p) => expandedProjects.has(p.id))
                    ? "Collapse all"
                    : "Expand all"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Project tree */}
            {sortedProjects.map((project) => renderProjectSection(project))}
          </div>
        )}
      </nav>

      <Separator />

      {/* Theme toggle + Notification + Collapse toggle */}
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
        <NotificationBell />
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
