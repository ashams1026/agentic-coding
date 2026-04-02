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
  retryWorkItem,
  // Work Item Edges
  getWorkItemEdges,
  createWorkItemEdge,
  deleteWorkItemEdge,
  // Persona Assignments
  getPersonaAssignments,
  updatePersonaAssignment,
  // Personas
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  // Executions
  getExecutions,
  getExecution,
  rewindExecution,
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
  updateChatSessionTitle,
  deleteChatSession,
  getChatMessages,
  sendChatMessageSSE,
} from "@/api/client";
