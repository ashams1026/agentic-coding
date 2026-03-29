import { Outlet } from "react-router";
import { Menu } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { StatusBar } from "@/components/status-bar";
import { useThemeSync } from "@/hooks/use-theme";
import { useUIStore } from "@/stores/ui-store";
import { CommandPalette } from "@/features/command-palette/command-palette";
import { ToastRenderer } from "@/features/toasts/toast-renderer";
import { useToastEvents } from "@/features/toasts/use-toast-events";
import { useWsQuerySync } from "@/hooks/use-ws-sync";
import { DemoControls } from "@/features/demo/demo-controls";

export function RootLayout() {
  useThemeSync();
  useToastEvents();
  useWsQuerySync();
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile top bar with hamburger */}
          <div className="flex h-12 items-center border-b border-border bg-card px-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-2 text-sm font-semibold">AgentOps</span>
          </div>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <StatusBar />
        </div>
      </div>
      <CommandPalette />
      <ToastRenderer />
      <DemoControls />
    </TooltipProvider>
  );
}
