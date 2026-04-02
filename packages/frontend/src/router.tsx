import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { DashboardPage } from "./pages/dashboard";
import { WorkItemsPage } from "./pages/work-items";
import { AgentMonitorPage } from "./pages/agent-monitor";
import { ActivityFeedPage } from "./pages/activity-feed";
import { PersonaManagerPage } from "./pages/persona-manager";
import { SettingsPage } from "./pages/settings";
import { ChatPage } from "./pages/chat";
import { WorkflowsPage } from "./pages/workflows";
import { PageErrorBoundary } from "./components/error-boundary";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <PageErrorBoundary><DashboardPage /></PageErrorBoundary> },
      { path: "items", element: <PageErrorBoundary><WorkItemsPage /></PageErrorBoundary> },
      { path: "agents", element: <PageErrorBoundary><AgentMonitorPage /></PageErrorBoundary> },
      { path: "activity", element: <PageErrorBoundary><ActivityFeedPage /></PageErrorBoundary> },
      { path: "chat", element: <PageErrorBoundary><ChatPage /></PageErrorBoundary> },
      { path: "personas", element: <PageErrorBoundary><PersonaManagerPage /></PageErrorBoundary> },
      { path: "workflows", element: <PageErrorBoundary><WorkflowsPage /></PageErrorBoundary> },
      { path: "workflows/:id", element: <PageErrorBoundary><WorkflowsPage /></PageErrorBoundary> },
      { path: "settings", element: <PageErrorBoundary><SettingsPage /></PageErrorBoundary> },
    ],
  },
]);
