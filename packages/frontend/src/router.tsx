import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
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
      { index: true, element: <PageErrorBoundary><DashboardPage /></PageErrorBoundary> },
      { path: "items", element: <PageErrorBoundary><WorkItemsPage /></PageErrorBoundary> },
      { path: "agents", element: <PageErrorBoundary><AgentMonitorPage /></PageErrorBoundary> },
      { path: "activity", element: <PageErrorBoundary><ActivityFeedPage /></PageErrorBoundary> },
      { path: "analytics", element: <PageErrorBoundary><AnalyticsPage /></PageErrorBoundary> },
      { path: "chat", element: <PageErrorBoundary><ChatPage /></PageErrorBoundary> },
      { path: "agent-builder", element: <PageErrorBoundary><AgentBuilderPage /></PageErrorBoundary> },
      { path: "automations", element: <PageErrorBoundary><WorkflowsPage /></PageErrorBoundary> },
      { path: "workflows/:id", element: <PageErrorBoundary><WorkflowsPage /></PageErrorBoundary> },
      { path: "settings", element: <PageErrorBoundary><SettingsPage /></PageErrorBoundary> },
    ],
  },
]);
