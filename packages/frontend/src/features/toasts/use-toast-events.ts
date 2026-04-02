import { useEffect } from "react";
import { useNavigate } from "react-router";
import { subscribeAll } from "@/api/ws";
import { useToastStore } from "@/stores/toast-store";
import { useNotificationStore } from "@/stores/notification-store";
import type { WsEvent, NotificationEventType } from "@agentops/shared";

// Critical notification types that should not auto-dismiss as toasts
const CRITICAL_TYPES: Set<NotificationEventType> = new Set([
  "proposal_needs_approval",
  "agent_errored",
  "budget_threshold",
]);

export function useToastEvents() {
  const addToast = useToastStore((s) => s.addToast);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeAll((event: WsEvent) => {
      // Dispatch notification events to both stores
      if (event.type === "notification") {
        const n = event.notification;
        addNotification(n);

        // Also show as toast
        const isCritical = CRITICAL_TYPES.has(n.type);
        addToast({
          type: isCritical ? "error" : n.priority === "high" ? "warning" : "info",
          title: n.title,
          description: n.description,
          critical: isCritical,
          action: n.type === "agent_errored" || n.type === "agent_completed"
            ? { label: "View", onClick: () => navigate("/agents") }
            : n.type === "proposal_needs_approval"
              ? { label: "Review", onClick: () => navigate("/items") }
              : n.type === "budget_threshold"
                ? { label: "Settings", onClick: () => navigate("/settings") }
                : undefined,
        });
        return;
      }

      switch (event.type) {
        case "agent_completed": {
          const e = event;
          const isSuccess = e.outcome === "success";
          addToast({
            type: isSuccess ? "success" : "error",
            title: isSuccess ? "Agent completed task" : "Agent failed",
            description: `Execution finished (${e.outcome})`,
            action: {
              label: "View",
              onClick: () => navigate("/agents"),
            },
          });
          break;
        }

        case "agent_started": {
          addToast({
            type: "info",
            title: "Agent started",
            description: `A new agent execution has begun.`,
            action: {
              label: "View",
              onClick: () => navigate("/agents"),
            },
          });
          break;
        }

        case "proposal_created": {
          addToast({
            type: "warning",
            title: "New proposal",
            description: "An agent has submitted a proposal for review.",
            critical: true,
            action: {
              label: "Review",
              onClick: () => navigate("/items"),
            },
          });
          break;
        }

        case "state_change": {
          const e = event;
          addToast({
            type: "info",
            title: "State changed",
            description: `Moved to "${e.toState}"`,
          });
          break;
        }

        case "cost_update": {
          const e = event;
          if (e.todayCostUsd > 40) {
            addToast({
              type: "warning",
              title: "Cost alert",
              description: `Monthly spend is now $${e.todayCostUsd.toFixed(2)}`,
              action: {
                label: "Settings",
                onClick: () => navigate("/settings"),
              },
            });
          }
          break;
        }
      }
    });

    return unsub;
  }, [addToast, addNotification, navigate]);
}
