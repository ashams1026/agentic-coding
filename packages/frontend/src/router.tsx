import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { ProjectLayout } from "./layouts/project-layout";
import { DashboardPage } from "./pages/dashboard";
import { WorkItemsPage } from "./pages/work-items";
import { AgentMonitorPage } from "./pages/agent-monitor";
import { ActivityFeedPage } from "./pages/activity-feed";
import { AgentBuilderPage } from "./pages/agent-builder";
import { SettingsPage } from "./pages/settings";
import { ChatPage } from "./pages/chat";
import { WorkflowsPage } from "./pages/workflows";
import { AnalyticsPage } from "./pages/analytics";
import { PageErrorBoundary } from "./components/error-boundary";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Top-level (no project context)
      { index: true, element: <PageErrorBoundary><DashboardPage /></PageErrorBoundary> },
      { path: "app-settings", element: <PageErrorBoundary><SettingsPage /></PageErrorBoundary> },

      // Project-scoped routes
      {
        path: "p/:projectId",
        element: <ProjectLayout />,
        children: [
          { path: "items", element: <PageErrorBoundary><WorkItemsPage /></PageErrorBoundary> },
          { path: "automations", element: <PageErrorBoundary><WorkflowsPage /></PageErrorBoundary> },
          { path: "automations/:workflowId", element: <PageErrorBoundary><WorkflowsPage /></PageErrorBoundary> },
          { path: "agents", element: <PageErrorBoundary><AgentBuilderPage /></PageErrorBoundary> },
          { path: "monitor", element: <PageErrorBoundary><AgentMonitorPage /></PageErrorBoundary> },
          { path: "activity", element: <PageErrorBoundary><ActivityFeedPage /></PageErrorBoundary> },
          { path: "analytics", element: <PageErrorBoundary><AnalyticsPage /></PageErrorBoundary> },
          { path: "chat", element: <PageErrorBoundary><ChatPage /></PageErrorBoundary> },
          { path: "settings", element: <PageErrorBoundary><SettingsPage /></PageErrorBoundary> },
        ],
      },

      // Legacy redirects (old flat routes → project-scoped)
      { path: "items", element: <Navigate to="/p/pj-global/items" replace /> },
      { path: "agents", element: <Navigate to="/p/pj-global/monitor" replace /> },
      { path: "activity", element: <Navigate to="/p/pj-global/activity" replace /> },
      { path: "analytics", element: <Navigate to="/p/pj-global/analytics" replace /> },
      { path: "chat", element: <Navigate to="/p/pj-global/chat" replace /> },
      { path: "agent-builder", element: <Navigate to="/p/pj-global/agents" replace /> },
      { path: "automations", element: <Navigate to="/p/pj-global/automations" replace /> },
      { path: "automations/:id", element: <Navigate to="/p/pj-global/automations" replace /> },
      { path: "settings", element: <Navigate to="/app-settings" replace /> },
    ],
  },
]);
