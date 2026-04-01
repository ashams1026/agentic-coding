/**
 * Real API client — mirrors the mock API function signatures
 * but makes HTTP requests to the Fastify backend.
 *
 * Each function unwraps the backend's { data } / { data, total }
 * response envelope so return types match the mock layer exactly.
 */

import { useToastStore } from "@/stores/toast-store";

import type {
  Project,
  WorkItem,
  WorkItemEdge,
  Persona,
  PersonaAssignment,
  Execution,
  Comment,
  ProjectMemory,
  Proposal,
  ChatSession,
  ChatMessage,
  ProjectId,
  WorkItemId,
  WorkItemEdgeId,
  PersonaId,
  ExecutionId,
  ProposalId,
  ChatSessionId,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  CreateWorkItemEdgeRequest,
  UpsertPersonaAssignmentRequest,
  CreatePersonaRequest,
  UpdatePersonaRequest,
  CreateCommentRequest,
  UpdateProposalRequest,
  DashboardStats,
  CostSummary,
  ExecutionStats,
  ReadyWorkItem,
} from "@agentops/shared";

// ── Configuration ────────────────────────────────────────────────

export const API_BASE_URL = "http://localhost:3001";
const BASE_URL = API_BASE_URL;

// ── Helpers ──────────────────────────────────────────────────────

function showErrorToast(method: string, path: string, status: number) {
  useToastStore.getState().addToast({
    type: "error",
    title: "API request failed",
    description: `${method} ${path} returned ${status}`,
  });
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    showErrorToast("GET", path, res.status);
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    showErrorToast("POST", path, res.status);
    throw new Error(`POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    showErrorToast("PATCH", path, res.status);
    throw new Error(`PATCH ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    showErrorToast("PUT", path, res.status);
    throw new Error(`PUT ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function del(path: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
  if (!res.ok) {
    showErrorToast("DELETE", path, res.status);
  }
  return res.ok;
}

// ── Projects ─────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const res = await get<{ data: Project[]; total: number }>("/api/projects");
  return res.data;
}

export async function getProject(id: ProjectId): Promise<Project | null> {
  try {
    const res = await get<{ data: Project }>(`/api/projects/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function createProject(req: CreateProjectRequest): Promise<Project> {
  const res = await post<{ data: Project }>("/api/projects", req);
  return res.data;
}

export async function updateProject(id: ProjectId, req: UpdateProjectRequest): Promise<Project | null> {
  try {
    const res = await patch<{ data: Project }>(`/api/projects/${id}`, req);
    return res.data;
  } catch {
    return null;
  }
}

export async function deleteProject(id: ProjectId): Promise<boolean> {
  return del(`/api/projects/${id}`);
}

// ── Work Items ───────────────────────────────────────────────────

export async function getWorkItems(parentId?: WorkItemId | null, projectId?: ProjectId): Promise<WorkItem[]> {
  const params = new URLSearchParams();
  if (parentId !== undefined && parentId !== null) params.set("parentId", parentId);
  if (projectId) params.set("projectId", projectId);
  const qs = params.toString();
  const res = await get<{ data: WorkItem[]; total: number }>(`/api/work-items${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function getWorkItem(id: WorkItemId): Promise<WorkItem | null> {
  try {
    const res = await get<{ data: WorkItem }>(`/api/work-items/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function createWorkItem(req: CreateWorkItemRequest): Promise<WorkItem> {
  const res = await post<{ data: WorkItem }>("/api/work-items", req);
  return res.data;
}

export async function updateWorkItem(id: WorkItemId, req: UpdateWorkItemRequest): Promise<WorkItem | null> {
  try {
    const res = await patch<{ data: WorkItem }>(`/api/work-items/${id}`, req);
    return res.data;
  } catch {
    return null;
  }
}

export async function deleteWorkItem(id: WorkItemId): Promise<boolean> {
  return del(`/api/work-items/${id}`);
}

export async function retryWorkItem(id: WorkItemId): Promise<void> {
  await post(`/api/work-items/${id}/retry`, {});
}

// ── Work Item Edges ──────────────────────────────────────────────

export async function getWorkItemEdges(workItemId?: WorkItemId): Promise<WorkItemEdge[]> {
  const qs = workItemId ? `?workItemId=${workItemId}` : "";
  const res = await get<{ data: WorkItemEdge[]; total: number }>(`/api/work-item-edges${qs}`);
  return res.data;
}

export async function createWorkItemEdge(req: CreateWorkItemEdgeRequest): Promise<WorkItemEdge> {
  const res = await post<{ data: WorkItemEdge }>("/api/work-item-edges", req);
  return res.data;
}

export async function deleteWorkItemEdge(id: WorkItemEdgeId): Promise<boolean> {
  return del(`/api/work-item-edges/${id}`);
}

// ── Persona Assignments ──────────────────────────────────────────

export async function getPersonaAssignments(projectId: ProjectId): Promise<PersonaAssignment[]> {
  const res = await get<{ data: PersonaAssignment[]; total: number }>(`/api/persona-assignments?projectId=${projectId}`);
  return res.data;
}

export async function updatePersonaAssignment(req: UpsertPersonaAssignmentRequest): Promise<PersonaAssignment> {
  const res = await put<{ data: PersonaAssignment }>("/api/persona-assignments", req);
  return res.data;
}

// ── Personas ─────────────────────────────────────────────────────

export async function getPersonas(): Promise<Persona[]> {
  const res = await get<{ data: Persona[]; total: number }>("/api/personas");
  return res.data;
}

export async function getPersona(id: PersonaId): Promise<Persona | null> {
  try {
    const res = await get<{ data: Persona }>(`/api/personas/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function createPersona(req: CreatePersonaRequest): Promise<Persona> {
  const res = await post<{ data: Persona }>("/api/personas", req);
  return res.data;
}

export async function updatePersona(id: PersonaId, req: UpdatePersonaRequest): Promise<Persona | null> {
  try {
    const res = await patch<{ data: Persona }>(`/api/personas/${id}`, req);
    return res.data;
  } catch {
    return null;
  }
}

export async function deletePersona(id: PersonaId): Promise<boolean> {
  return del(`/api/personas/${id}`);
}

// ── Executions ───────────────────────────────────────────────────

export async function getExecutions(workItemId?: WorkItemId, projectId?: string): Promise<Execution[]> {
  const params = new URLSearchParams();
  if (workItemId) params.set("workItemId", workItemId);
  if (projectId) params.set("projectId", projectId);
  const qs = params.toString() ? `?${params}` : "";
  const res = await get<{ data: Execution[]; total: number }>(`/api/executions${qs}`);
  return res.data;
}

export async function getExecution(id: ExecutionId): Promise<Execution | null> {
  try {
    const res = await get<{ data: Execution }>(`/api/executions/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

export interface RewindResult {
  canRewind: boolean;
  filesChanged: string[];
  insertions: number;
  deletions: number;
  dryRun: boolean;
}

export async function rewindExecution(id: ExecutionId, dryRun: boolean): Promise<RewindResult> {
  const res = await post<{ data: RewindResult }>(`/api/executions/${id}/rewind`, { dryRun });
  return res.data;
}

// ── Comments ─────────────────────────────────────────────────────

export async function getComments(workItemId: WorkItemId): Promise<Comment[]> {
  const res = await get<{ data: Comment[]; total: number }>(`/api/comments?workItemId=${workItemId}`);
  return res.data;
}

export async function getRecentComments(projectId?: string): Promise<Comment[]> {
  const q = projectId ? `?projectId=${projectId}` : "";
  const res = await get<{ data: Comment[]; total: number }>(`/api/comments${q}`);
  return res.data;
}

export async function createComment(req: CreateCommentRequest): Promise<Comment> {
  const res = await post<{ data: Comment }>("/api/comments", req);
  return res.data;
}

// ── Proposals ────────────────────────────────────────────────────

export async function getProposals(workItemId?: WorkItemId, projectId?: string): Promise<Proposal[]> {
  const params = new URLSearchParams();
  if (workItemId) params.set("workItemId", workItemId);
  if (projectId) params.set("projectId", projectId);
  const qs = params.toString() ? `?${params}` : "";
  const res = await get<{ data: Proposal[]; total: number }>(`/api/proposals${qs}`);
  return res.data;
}

export async function getProposal(id: ProposalId): Promise<Proposal | null> {
  try {
    const res = await get<{ data: Proposal }>(`/api/proposals/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function updateProposal(id: ProposalId, req: UpdateProposalRequest): Promise<Proposal | null> {
  try {
    const res = await patch<{ data: Proposal }>(`/api/proposals/${id}`, req);
    return res.data;
  } catch {
    return null;
  }
}

// ── Project Memory ───────────────────────────────────────────────

export async function getProjectMemories(_projectId: ProjectId): Promise<ProjectMemory[]> {
  // Project memory routes not yet implemented — return empty array
  return [];
}

// ── Aggregate / Dashboard ────────────────────────────────────────

export async function getDashboardStats(projectId?: string): Promise<DashboardStats> {
  const q = projectId ? `?projectId=${projectId}` : "";
  return get<DashboardStats>(`/api/dashboard/stats${q}`);
}

export async function getCostSummary(projectId?: string): Promise<CostSummary> {
  const q = projectId ? `?projectId=${projectId}` : "";
  return get<CostSummary>(`/api/dashboard/cost-summary${q}`);
}

export async function getExecutionStats(projectId?: string): Promise<ExecutionStats> {
  const q = projectId ? `?projectId=${projectId}` : "";
  return get<ExecutionStats>(`/api/dashboard/execution-stats${q}`);
}

export async function getReadyWork(projectId?: string): Promise<ReadyWorkItem[]> {
  const q = projectId ? `?projectId=${projectId}` : "";
  const res = await get<{ data: ReadyWorkItem[]; total: number }>(`/api/dashboard/ready-work${q}`);
  return res.data;
}

// ── Settings ─────────────────────────────────────────────────────

export interface ApiKeyStatus {
  configured: boolean;
  maskedKey: string | null;
}

export interface SetApiKeyResult {
  valid: boolean;
  configured: boolean;
  maskedKey: string;
}

export async function getApiKeyStatus(): Promise<ApiKeyStatus> {
  return get<ApiKeyStatus>("/api/settings/api-key");
}

export async function setApiKey(key: string): Promise<SetApiKeyResult> {
  return post<SetApiKeyResult>("/api/settings/api-key", { key });
}

export async function deleteApiKey(): Promise<ApiKeyStatus> {
  const res = await fetch(`${BASE_URL}/api/settings/api-key`, { method: "DELETE" });
  if (!res.ok) {
    showErrorToast("DELETE", "/api/settings/api-key", res.status);
    throw new Error(`DELETE /api/settings/api-key failed: ${res.status}`);
  }
  return res.json();
}

export interface ConcurrencyStats {
  active: number;
  queued: number;
}

export async function getConcurrencyStats(): Promise<ConcurrencyStats> {
  return get<ConcurrencyStats>("/api/settings/concurrency");
}

export interface ExecutorModeResponse {
  mode: "mock" | "claude";
  isProduction: boolean;
}

export async function getExecutorMode(): Promise<ExecutorModeResponse> {
  return get<ExecutorModeResponse>("/api/settings/executor-mode");
}

export async function setExecutorMode(mode: "mock" | "claude"): Promise<{ mode: "mock" | "claude" }> {
  return put<{ mode: "mock" | "claude" }>("/api/settings/executor-mode", { mode });
}

export interface DbStats {
  sizeBytes: number;
  sizeMB: number;
  executionCount: number;
  projectCount: number;
  personaCount: number;
}

export async function getDbStats(): Promise<DbStats> {
  return get<DbStats>("/api/settings/db-stats");
}

export async function clearExecutionHistory(): Promise<{ deleted: number }> {
  const res = await fetch(`${BASE_URL}/api/settings/executions`, { method: "DELETE" });
  if (!res.ok) {
    showErrorToast("DELETE", "/api/settings/executions", res.status);
    throw new Error(`DELETE /api/settings/executions failed: ${res.status}`);
  }
  return res.json();
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface BrowseDirectoryResult {
  currentPath: string;
  entries: DirectoryEntry[];
}

export async function browseDirectory(
  startPath?: string,
  options?: { includeFiles?: boolean; fileFilter?: string },
): Promise<BrowseDirectoryResult> {
  return post<BrowseDirectoryResult>("/api/settings/browse-directory", {
    startPath,
    ...options,
  });
}

export interface FilePreview {
  filePath: string;
  content: string;
  totalLines: number;
}

export async function readFilePreview(filePath: string, maxLines = 20): Promise<FilePreview> {
  return post<FilePreview>("/api/settings/read-file", { filePath, maxLines });
}

export async function exportSettings(): Promise<Record<string, unknown>> {
  return get<Record<string, unknown>>("/api/settings/export");
}

// ── Service ─────────────────────────────────────────────────────

export interface ActiveExecutionInfo {
  executionId: string;
  personaName: string;
  workItemTitle: string;
  elapsedMs: number;
}

export interface ServiceStatus {
  activeExecutions: ActiveExecutionInfo[];
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  return get<ServiceStatus>("/api/service/status");
}

export async function restartService(force = false): Promise<{ restarting: boolean; force: boolean }> {
  const url = force
    ? `${BASE_URL}/api/service/restart?force=true`
    : `${BASE_URL}/api/service/restart`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    if (res.status === 409) {
      const body = await res.json();
      throw new Error(body.error ?? "Active executions running");
    }
    showErrorToast("POST", "/api/service/restart", res.status);
    throw new Error(`POST /api/service/restart failed: ${res.status}`);
  }
  return res.json();
}

export async function importSettings(data: Record<string, unknown>): Promise<{ imported: Record<string, number> }> {
  const res = await fetch(`${BASE_URL}/api/settings/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    showErrorToast("POST", "/api/settings/import", res.status);
    throw new Error(`POST /api/settings/import failed: ${res.status}`);
  }
  return res.json();
}

// ── Health check ─────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  uptime: number;
  activeExecutions: number;
  executor: "mock" | "claude";
  version: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

// ── SDK Capabilities ────────────────────────────────────────────

export interface SdkSkill {
  name: string;
  description: string;
  argumentHint: string;
}

export interface SdkAgent {
  name: string;
  description: string;
  model?: string;
}

export interface SdkModel {
  value: string;
  displayName: string;
  description: string;
}

export interface SdkCapabilities {
  commands: SdkSkill[];
  agents: SdkAgent[];
  models: SdkModel[];
  cachedAt: string;
}

export async function getSdkCapabilities(): Promise<SdkCapabilities> {
  const res = await get<{ data: SdkCapabilities }>("/api/sdk/capabilities");
  return res.data;
}

export async function reloadSdkCapabilities(): Promise<SdkCapabilities> {
  const res = await post<{ data: SdkCapabilities }>("/api/sdk/reload", {});
  return res.data;
}

// ── Chat Sessions ───────────────────────────────────────────────

export async function getChatSessions(projectId?: string): Promise<ChatSession[]> {
  const q = projectId ? `?projectId=${projectId}` : "";
  const res = await get<{ data: ChatSession[]; total: number }>(`/api/chat/sessions${q}`);
  return res.data;
}

export async function createChatSession(projectId: string): Promise<ChatSession> {
  const res = await post<{ data: ChatSession }>("/api/chat/sessions", { projectId });
  return res.data;
}

export async function updateChatSessionTitle(id: ChatSessionId, title: string): Promise<ChatSession> {
  const res = await patch<{ data: ChatSession }>(`/api/chat/sessions/${id}`, { title });
  return res.data;
}

export async function deleteChatSession(id: ChatSessionId): Promise<boolean> {
  return del(`/api/chat/sessions/${id}`);
}

export async function getChatMessages(sessionId: ChatSessionId): Promise<ChatMessage[]> {
  const res = await get<{ data: ChatMessage[]; total: number }>(`/api/chat/sessions/${sessionId}/messages`);
  return res.data;
}

/**
 * Send a message and stream the assistant response via SSE.
 * Returns an EventSource-like reader. The caller processes SSE events.
 */
export function sendChatMessageSSE(
  sessionId: ChatSessionId,
  content: string,
): { response: Promise<Response>; abort: () => void } {
  const controller = new AbortController();
  const response = fetch(`${BASE_URL}/api/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    signal: controller.signal,
  });
  return { response, abort: () => controller.abort() };
}

// ── Bundled API (mirrors mockApi shape) ──────────────────────────

export const apiClient = {
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
  // Aggregates
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
};
