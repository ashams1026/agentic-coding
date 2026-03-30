import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { DashboardPage } from "./pages/dashboard";
import { WorkItemsPage } from "./pages/work-items";
import { StoryBoardPage } from "./pages/story-board";
import { StoryDetailPage } from "./pages/story-detail";
import { TaskDetailPage } from "./pages/task-detail";
import { AgentMonitorPage } from "./pages/agent-monitor";
import { ActivityFeedPage } from "./pages/activity-feed";
import { WorkflowDesignerPage } from "./pages/workflow-designer";
import { PersonaManagerPage } from "./pages/persona-manager";
import { SettingsPage } from "./pages/settings";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "items", element: <WorkItemsPage /> },
      // Legacy routes — will be removed in O.13
      { path: "board", element: <StoryBoardPage /> },
      { path: "stories/:id", element: <StoryDetailPage /> },
      { path: "tasks/:id", element: <TaskDetailPage /> },
      { path: "agents", element: <AgentMonitorPage /> },
      { path: "activity", element: <ActivityFeedPage /> },
      { path: "workflows", element: <WorkflowDesignerPage /> },
      { path: "personas", element: <PersonaManagerPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
