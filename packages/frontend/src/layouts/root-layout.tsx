import { Outlet } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import { StatusBar } from "@/components/status-bar";
import { useThemeSync } from "@/hooks/use-theme";

export function RootLayout() {
  useThemeSync();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <StatusBar />
        </div>
      </div>
    </TooltipProvider>
  );
}
