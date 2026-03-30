import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { DashboardPage } from "./pages/dashboard";
import { WorkItemsPage } from "./pages/work-items";
import { AgentMonitorPage } from "./pages/agent-monitor";
import { ActivityFeedPage } from "./pages/activity-feed";
import { PersonaManagerPage } from "./pages/persona-manager";
import { SettingsPage } from "./pages/settings";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "items", element: <WorkItemsPage /> },
      { path: "agents", element: <AgentMonitorPage /> },
      { path: "activity", element: <ActivityFeedPage /> },
      { path: "personas", element: <PersonaManagerPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
