import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeAll } from "@/api/ws";
import type { WsEvent } from "@agentops/shared";

/**
 * Centralized hook that subscribes to WebSocket events
 * and invalidates the relevant TanStack Query caches so all
 * screens update live without individual WS subscriptions.
 *
 * Called once in RootLayout — every component using these queries
 * will re-render automatically when events arrive.
 */
export function useWsQuerySync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = subscribeAll((event: WsEvent) => {
      switch (event.type) {
        case "state_change":
          queryClient.invalidateQueries({ queryKey: ["workItems"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          break;

        case "comment_created":
          queryClient.invalidateQueries({ queryKey: ["comments"] });
          break;

        case "agent_started":
        case "agent_completed":
        case "execution_update":
          queryClient.invalidateQueries({ queryKey: ["executions"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          break;

        case "proposal_created":
        case "proposal_updated":
          queryClient.invalidateQueries({ queryKey: ["proposals"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          break;

        case "cost_update":
          queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          queryClient.invalidateQueries({ queryKey: ["costSummary"] });
          break;
      }
    });

    return unsub;
  }, [queryClient]);
}
