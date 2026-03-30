/**
 * Unified API layer — delegates to mock or real API based on the current apiMode.
 *
 * Each exported function reads the current mode from the UI store and calls
 * the corresponding implementation. This allows hooks to import from `@/api`
 * without knowing which backend is active.
 */

import { useUIStore } from "@/stores/ui-store";
import * as mock from "@/mocks/api";
import * as real from "@/api/client";

function getMode() {
  return useUIStore.getState().apiMode;
}

function pick<T>(mockFn: T, realFn: T): T {
  return getMode() === "api" ? realFn : mockFn;
}

// ── Projects ─────────────────────────────────────────────────────

export const getProjects = (...args: Parameters<typeof mock.getProjects>) =>
  pick(mock.getProjects, real.getProjects)(...args);

export const getProject = (...args: Parameters<typeof mock.getProject>) =>
  pick(mock.getProject, real.getProject)(...args);

export const createProject = (...args: Parameters<typeof mock.createProject>) =>
  pick(mock.createProject, real.createProject)(...args);

export const updateProject = (...args: Parameters<typeof mock.updateProject>) =>
  pick(mock.updateProject, real.updateProject)(...args);

export const deleteProject = (...args: Parameters<typeof mock.deleteProject>) =>
  pick(mock.deleteProject, real.deleteProject)(...args);

// ── Work Items ───────────────────────────────────────────────────

export const getWorkItems = (...args: Parameters<typeof mock.getWorkItems>) =>
  pick(mock.getWorkItems, real.getWorkItems)(...args);

export const getWorkItem = (...args: Parameters<typeof mock.getWorkItem>) =>
  pick(mock.getWorkItem, real.getWorkItem)(...args);

export const createWorkItem = (...args: Parameters<typeof mock.createWorkItem>) =>
  pick(mock.createWorkItem, real.createWorkItem)(...args);

export const updateWorkItem = (...args: Parameters<typeof mock.updateWorkItem>) =>
  pick(mock.updateWorkItem, real.updateWorkItem)(...args);

export const deleteWorkItem = (...args: Parameters<typeof mock.deleteWorkItem>) =>
  pick(mock.deleteWorkItem, real.deleteWorkItem)(...args);

export const retryWorkItem = (...args: Parameters<typeof mock.retryWorkItem>) =>
  pick(mock.retryWorkItem, real.retryWorkItem)(...args);

// ── Work Item Edges ──────────────────────────────────────────────

export const getWorkItemEdges = (...args: Parameters<typeof mock.getWorkItemEdges>) =>
  pick(mock.getWorkItemEdges, real.getWorkItemEdges)(...args);

export const createWorkItemEdge = (...args: Parameters<typeof mock.createWorkItemEdge>) =>
  pick(mock.createWorkItemEdge, real.createWorkItemEdge)(...args);

export const deleteWorkItemEdge = (...args: Parameters<typeof mock.deleteWorkItemEdge>) =>
  pick(mock.deleteWorkItemEdge, real.deleteWorkItemEdge)(...args);

// ── Persona Assignments ──────────────────────────────────────────

export const getPersonaAssignments = (...args: Parameters<typeof mock.getPersonaAssignments>) =>
  pick(mock.getPersonaAssignments, real.getPersonaAssignments)(...args);

export const updatePersonaAssignment = (...args: Parameters<typeof mock.updatePersonaAssignment>) =>
  pick(mock.updatePersonaAssignment, real.updatePersonaAssignment)(...args);

// ── Personas ─────────────────────────────────────────────────────

export const getPersonas = (...args: Parameters<typeof mock.getPersonas>) =>
  pick(mock.getPersonas, real.getPersonas)(...args);

export const getPersona = (...args: Parameters<typeof mock.getPersona>) =>
  pick(mock.getPersona, real.getPersona)(...args);

export const createPersona = (...args: Parameters<typeof mock.createPersona>) =>
  pick(mock.createPersona, real.createPersona)(...args);

export const updatePersona = (...args: Parameters<typeof mock.updatePersona>) =>
  pick(mock.updatePersona, real.updatePersona)(...args);

export const deletePersona = (...args: Parameters<typeof mock.deletePersona>) =>
  pick(mock.deletePersona, real.deletePersona)(...args);

// ── Executions ───────────────────────────────────────────────────

export const getExecutions = (...args: Parameters<typeof mock.getExecutions>) =>
  pick(mock.getExecutions, real.getExecutions)(...args);

export const getExecution = (...args: Parameters<typeof mock.getExecution>) =>
  pick(mock.getExecution, real.getExecution)(...args);

// ── Comments ─────────────────────────────────────────────────────

export const getComments = (...args: Parameters<typeof mock.getComments>) =>
  pick(mock.getComments, real.getComments)(...args);

export const getRecentComments = (...args: Parameters<typeof mock.getRecentComments>) =>
  pick(mock.getRecentComments, real.getRecentComments)(...args);

export const createComment = (...args: Parameters<typeof mock.createComment>) =>
  pick(mock.createComment, real.createComment)(...args);

// ── Proposals ────────────────────────────────────────────────────

export const getProposals = (...args: Parameters<typeof mock.getProposals>) =>
  pick(mock.getProposals, real.getProposals)(...args);

export const getProposal = (...args: Parameters<typeof mock.getProposal>) =>
  pick(mock.getProposal, real.getProposal)(...args);

export const updateProposal = (...args: Parameters<typeof mock.updateProposal>) =>
  pick(mock.updateProposal, real.updateProposal)(...args);

// ── Project Memory ───────────────────────────────────────────────

export const getProjectMemories = (...args: Parameters<typeof mock.getProjectMemories>) =>
  pick(mock.getProjectMemories, real.getProjectMemories)(...args);

// ── Aggregate / Dashboard ────────────────────────────────────────

export const getDashboardStats = (...args: Parameters<typeof mock.getDashboardStats>) =>
  pick(mock.getDashboardStats, real.getDashboardStats)(...args);

export const getCostSummary = (...args: Parameters<typeof mock.getCostSummary>) =>
  pick(mock.getCostSummary, real.getCostSummary)(...args);

export const getExecutionStats = (...args: Parameters<typeof mock.getExecutionStats>) =>
  pick(mock.getExecutionStats, real.getExecutionStats)(...args);

export const getReadyWork = (...args: Parameters<typeof mock.getReadyWork>) =>
  pick(mock.getReadyWork, real.getReadyWork)(...args);

// ── Settings ────────────────────────────────────────────────────

export const getApiKeyStatus = (...args: Parameters<typeof mock.getApiKeyStatus>) =>
  pick(mock.getApiKeyStatus, real.getApiKeyStatus)(...args);

export const setApiKey = (...args: Parameters<typeof mock.setApiKey>) =>
  pick(mock.setApiKey, real.setApiKey)(...args);

export const deleteApiKey = (...args: Parameters<typeof mock.deleteApiKey>) =>
  pick(mock.deleteApiKey, real.deleteApiKey)(...args);

export const getConcurrencyStats = (...args: Parameters<typeof mock.getConcurrencyStats>) =>
  pick(mock.getConcurrencyStats, real.getConcurrencyStats)(...args);

export const getDbStats = (...args: Parameters<typeof mock.getDbStats>) =>
  pick(mock.getDbStats, real.getDbStats)(...args);

export const clearExecutionHistory = (...args: Parameters<typeof mock.clearExecutionHistory>) =>
  pick(mock.clearExecutionHistory, real.clearExecutionHistory)(...args);

export const exportSettings = (...args: Parameters<typeof mock.exportSettings>) =>
  pick(mock.exportSettings, real.exportSettings)(...args);

export const importSettings = (...args: Parameters<typeof mock.importSettings>) =>
  pick(mock.importSettings, real.importSettings)(...args);
