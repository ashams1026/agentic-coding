/**
 * Unified API layer — re-exports from the real API client.
 *
 * All API calls go directly to the backend at localhost:3001.
 */

export {
  // Projects
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  // Work Items
  getWorkItems,
  getWorkItem,
  createWorkItem,
  updateWorkItem,
  deleteWorkItem,
  archiveWorkItem,
  unarchiveWorkItem,
  bulkArchiveWorkItems,
  bulkDeleteWorkItems,
  getDeletedWorkItems,
  restoreWorkItem,
  retryWorkItem,
  // Work Item Edges
  getWorkItemEdges,
  createWorkItemEdge,
  deleteWorkItemEdge,
  // Agent Assignments
  getAgentAssignments,
  updateAgentAssignment,
  // Agents
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  // Executions
  getExecutions,
  getExecution,
  rewindExecution,
  runExecution,
  getExecutionQueue,
  type QueueEntry,
  type QueueResponse,
  // Comments
  getComments,
  getRecentComments,
  createComment,
  // Proposals
  getProposals,
  getProposal,
  updateProposal,
  // Project Memory
  getProjectMemories,
  // Aggregate / Dashboard
  getDashboardStats,
  getCostSummary,
  getExecutionStats,
  getReadyWork,
  // Settings
  getApiKeyStatus,
  setApiKey,
  deleteApiKey,
  getConcurrencyStats,
  getDbStats,
  clearExecutionHistory,
  exportSettings,
  importSettings,
  // Browse / Files
  browseDirectory,
  readFilePreview,
  // Executor mode
  getExecutorMode,
  setExecutorMode,
  // Service
  getServiceStatus,
  restartService,
  // SDK Capabilities
  getSdkCapabilities,
  reloadSdkCapabilities,
  // Chat
  getChatSessions,
  createChatSession,
  type ChatSessionWithAgent,
  updateChatSessionTitle,
  deleteChatSession,
  getChatMessages,
  sendChatMessageSSE,
  // Workflows
  getWorkflows,
  getWorkflow,
  getWorkflowStates,
  getWorkflowTransitions,
} from "@/api/client";
