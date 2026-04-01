import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMcpStatus, reconnectMcpServer } from "@/api/client";
import type { McpServerStatusInfo } from "@/api/client";
import type { ExecutionId } from "@agentops/shared";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_COLORS: Record<string, string> = {
  connected: "bg-emerald-500",
  failed: "bg-red-500",
  "needs-auth": "bg-amber-500",
  pending: "bg-amber-500",
  disabled: "bg-zinc-400",
};

interface McpStatusProps {
  executionId: ExecutionId;
  isRunning: boolean;
}

export function McpStatus({ executionId, isRunning }: McpStatusProps) {
  const [servers, setServers] = useState<McpServerStatusInfo[]>([]);
  const [reconnecting, setReconnecting] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await getMcpStatus(executionId);
      setServers(status);
    } catch {
      // Execution may have ended
    }
  }, [executionId]);

  useEffect(() => {
    if (!isRunning) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [isRunning, fetchStatus]);

  const handleReconnect = async (serverName: string) => {
    setReconnecting(serverName);
    try {
      await reconnectMcpServer(executionId, serverName);
      await fetchStatus();
    } catch {
      // Error handled silently
    } finally {
      setReconnecting(null);
    }
  };

  if (!isRunning || servers.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">MCP</span>
        {servers.map((server) => (
          <Tooltip key={server.name}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => server.status === "failed" ? handleReconnect(server.name) : undefined}
                className={cn(
                  "h-2 w-2 rounded-full shrink-0 transition-colors",
                  STATUS_COLORS[server.status] ?? "bg-zinc-400",
                  server.status === "failed" && "cursor-pointer hover:ring-2 hover:ring-red-300",
                  reconnecting === server.name && "animate-spin",
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{server.name}</p>
              <p className="text-muted-foreground capitalize">{server.status}</p>
              {server.error && <p className="text-red-400 text-[10px]">{server.error}</p>}
              {server.status === "failed" && (
                <p className="text-[10px] mt-1 flex items-center gap-1">
                  <RefreshCw className="h-2.5 w-2.5" /> Click to reconnect
                </p>
              )}
              {server.tools && server.tools.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">{server.tools.length} tools</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
