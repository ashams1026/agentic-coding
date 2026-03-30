import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeAll } from "@/api/ws";
import type { WsEvent } from "@agentops/shared";

/**
 * Centralized hook that subscribes to mock WebSocket events
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
        case "agent_started":
        case "agent_completed":
        case "execution_update":
          // Refresh execution lists + dashboard stats
          queryClient.invalidateQueries({ queryKey: ["executions"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          break;

        case "state_change":
          // Refresh stories/tasks (kanban columns change) + dashboard
          queryClient.invalidateQueries({ queryKey: ["stories"] });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          break;

        case "comment_created":
          // Refresh comment lists (story detail)
          queryClient.invalidateQueries({ queryKey: ["comments"] });
          break;

        case "proposal_created":
        case "proposal_updated":
          // Refresh proposals + dashboard stats
          queryClient.invalidateQueries({ queryKey: ["proposals"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          break;

        case "cost_update":
          // Refresh cost data
          queryClient.invalidateQueries({ queryKey: ["costSummary"] });
          queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
          break;
      }
    });

    return unsub;
  }, [queryClient]);
}
