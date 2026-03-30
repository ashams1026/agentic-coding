import { useEffect } from "react";
import { useNavigate } from "react-router";
import { subscribeAll } from "@/api/ws";
import { useToastStore } from "@/stores/toast-store";
import type { WsEvent } from "@agentops/shared";

export function useToastEvents() {
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeAll((event: WsEvent) => {
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
            action: {
              label: "Review",
              onClick: () => navigate("/board"),
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
  }, [addToast, navigate]);
}
