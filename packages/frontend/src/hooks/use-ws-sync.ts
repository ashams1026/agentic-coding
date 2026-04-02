import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeAll, onReconnect } from "@/api/ws";
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
          // Don't invalidate work items during active mutations — they have optimistic data
          if (queryClient.isMutating({ mutationKey: ["workItems"] }) === 0) {
            queryClient.invalidateQueries({ queryKey: ["workItems"] });
          }
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

    // On reconnect, invalidate all execution-related queries so agent monitor refreshes
    const unsubReconnect = onReconnect(() => {
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      queryClient.invalidateQueries({ queryKey: ["workItems"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    });

    return () => {
      unsub();
      unsubReconnect();
    };
  }, [queryClient]);
}
