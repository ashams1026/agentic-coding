import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ── Projects ───────────────────────────────────────────────────────

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), // ProjectId
  name: text("name").notNull(),
  path: text("path").notNull(),
  settings: text("settings", { mode: "json" }).notNull().$type<Record<string, unknown>>().default({}),
  workflowId: text("workflow_id"), // nullable FK — set after workflows table exists; references workflows.id
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  workItems: many(workItems),
  personaAssignments: many(personaAssignments),
  memories: many(projectMemories),
}));

// ── Work Items ─────────────────────────────────────────────────────

export const workItems = sqliteTable("work_items", {
  id: text("id").primaryKey(), // WorkItemId
  parentId: text("parent_id"), // self-referencing FK (WorkItemId | null)
  projectId: text("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  context: text("context", { mode: "json" }).notNull().$type<Record<string, unknown>>().default({}),
  currentState: text("current_state").notNull(), // WorkflowStateName
  workflowId: text("workflow_id"), // nullable FK — references workflows.id; pinned workflow version
  priority: text("priority").notNull().default("p2"), // Priority enum
  labels: text("labels", { mode: "json" }).notNull().$type<string[]>().default([]),
  assignedPersonaId: text("assigned_persona_id").references(() => personas.id),
  executionContext: text("execution_context", { mode: "json" })
    .notNull()
    .$type<
      Array<{
        executionId: string;
        summary: string;
        outcome: string;
        rejectionPayload: { reason: string; severity: string; hint: string; retryCount: number } | null;
      }>
    >()
    .default([]),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
});

export const workItemsRelations = relations(workItems, ({ one, many }) => ({
  parent: one(workItems, {
    fields: [workItems.parentId],
    references: [workItems.id],
    relationName: "parentChild",
  }),
  children: many(workItems, { relationName: "parentChild" }),
  project: one(projects, {
    fields: [workItems.projectId],
    references: [projects.id],
  }),
  assignedPersona: one(personas, {
    fields: [workItems.assignedPersonaId],
    references: [personas.id],
  }),
  executions: many(executions),
  comments: many(comments),
  proposals: many(proposals),
  memories: many(projectMemories),
  edgesFrom: many(workItemEdges, { relationName: "edgeFrom" }),
  edgesTo: many(workItemEdges, { relationName: "edgeTo" }),
}));

// ── Work Item Edges ────────────────────────────────────────────────

export const workItemEdges = sqliteTable("work_item_edges", {
  id: text("id").primaryKey(), // WorkItemEdgeId
  fromId: text("from_id").notNull().references(() => workItems.id),
  toId: text("to_id").notNull().references(() => workItems.id),
  type: text("type").notNull(), // WorkItemEdgeType: blocks | depends_on | related_to
});

export const workItemEdgesRelations = relations(workItemEdges, ({ one }) => ({
  from: one(workItems, {
    fields: [workItemEdges.fromId],
    references: [workItems.id],
    relationName: "edgeFrom",
  }),
  to: one(workItems, {
    fields: [workItemEdges.toId],
    references: [workItems.id],
    relationName: "edgeTo",
  }),
}));

// ── Persona Assignments ────────────────────────────────────────────

export const personaAssignments = sqliteTable(
  "persona_assignments",
  {
    projectId: text("project_id").notNull().references(() => projects.id),
    stateName: text("state_name").notNull(), // WorkflowStateName
    personaId: text("persona_id").notNull().references(() => personas.id),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.stateName] }),
  ],
);

export const personaAssignmentsRelations = relations(personaAssignments, ({ one }) => ({
  project: one(projects, {
    fields: [personaAssignments.projectId],
    references: [projects.id],
  }),
  persona: one(personas, {
    fields: [personaAssignments.personaId],
    references: [personas.id],
  }),
}));

// ── Personas ───────────────────────────────────────────────────────

export const personas = sqliteTable("personas", {
  id: text("id").primaryKey(), // PersonaId
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  avatar: text("avatar", { mode: "json" }).notNull().$type<{ color: string; icon: string }>(),
  systemPrompt: text("system_prompt").notNull().default(""),
  model: text("model").notNull().default("sonnet"), // PersonaModel
  allowedTools: text("allowed_tools", { mode: "json" }).notNull().$type<string[]>().default([]),
  mcpTools: text("mcp_tools", { mode: "json" }).notNull().$type<string[]>().default([]),
  skills: text("skills", { mode: "json" }).notNull().$type<string[]>().default([]),
  subagents: text("subagents", { mode: "json" }).notNull().$type<string[]>().default([]),
  maxBudgetPerRun: integer("max_budget_per_run").notNull().default(0),
  settings: text("settings", { mode: "json" }).notNull().$type<Record<string, unknown>>().default({}),
});

export const personasRelations = relations(personas, ({ many }) => ({
  executions: many(executions),
  assignments: many(personaAssignments),
}));

// ── Executions ─────────────────────────────────────────────────────

export const executions = sqliteTable("executions", {
  id: text("id").primaryKey(), // ExecutionId
  workItemId: text("work_item_id").references(() => workItems.id), // nullable — standalone/global executions
  personaId: text("persona_id").notNull().references(() => personas.id),
  projectId: text("project_id").references(() => projects.id), // nullable — for standalone/global executions
  status: text("status").notNull().default("pending"), // ExecutionStatus
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  costUsd: integer("cost_usd").notNull().default(0), // stored as cents
  durationMs: integer("duration_ms").notNull().default(0),
  summary: text("summary").notNull().default(""),
  outcome: text("outcome"), // ExecutionOutcome | null
  rejectionPayload: text("rejection_payload", { mode: "json" })
    .$type<{ reason: string; severity: string; hint: string; retryCount: number } | null>(),
  logs: text("logs").notNull().default(""),
  checkpointMessageId: text("checkpoint_message_id"),
  structuredOutput: text("structured_output", { mode: "json" }).$type<Record<string, unknown> | null>(),
  parentExecutionId: text("parent_execution_id"),
  error: text("error", { mode: "json" }).$type<{ category: string; message: string; details?: Record<string, unknown> } | null>(),
  workflowId: text("workflow_id"), // nullable — references workflows.id; workflow context for this execution
  workflowStateName: text("workflow_state_name"), // nullable — state name at time of execution
  handoffNotes: text("handoff_notes", { mode: "json" }).$type<{ fromState: string; targetState: string; summary: string; decisions: string[]; filesChanged: string[]; openQuestions: string[] } | null>(),
  model: text("model"), // nullable — persona model used (opus/sonnet/haiku)
  totalTokens: integer("total_tokens"), // nullable — cumulative tokens used
  toolUses: integer("tool_uses"), // nullable — count of tool calls made
  triggerType: text("trigger_type"), // nullable — "manual" | "webhook" | "schedule"
  triggerId: text("trigger_id"), // nullable — references webhook_triggers.id or schedule.id
});

export const executionsRelations = relations(executions, ({ one, many }) => ({
  workItem: one(workItems, {
    fields: [executions.workItemId],
    references: [workItems.id],
  }),
  persona: one(personas, {
    fields: [executions.personaId],
    references: [personas.id],
  }),
  proposals: many(proposals),
}));

// ── Comments ───────────────────────────────────────────────────────

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(), // CommentId
  workItemId: text("work_item_id").notNull().references(() => workItems.id),
  authorType: text("author_type").notNull(), // CommentAuthorType
  authorId: text("author_id"), // PersonaId | null
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata", { mode: "json" }).notNull().$type<Record<string, unknown>>().default({}),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  workItem: one(workItems, {
    fields: [comments.workItemId],
    references: [workItems.id],
  }),
}));

// ── Proposals ──────────────────────────────────────────────────────

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(), // ProposalId
  executionId: text("execution_id").notNull().references(() => executions.id),
  workItemId: text("work_item_id").notNull().references(() => workItems.id),
  type: text("type").notNull(), // ProposalType
  payload: text("payload", { mode: "json" }).notNull().$type<Record<string, unknown>>().default({}),
  status: text("status").notNull().default("pending"), // ProposalStatus
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const proposalsRelations = relations(proposals, ({ one }) => ({
  execution: one(executions, {
    fields: [proposals.executionId],
    references: [executions.id],
  }),
  workItem: one(workItems, {
    fields: [proposals.workItemId],
    references: [workItems.id],
  }),
}));

// ── Project Memories ───────────────────────────────────────────────

export const projectMemories = sqliteTable("project_memories", {
  id: text("id").primaryKey(), // ProjectMemoryId
  projectId: text("project_id").notNull().references(() => projects.id),
  workItemId: text("work_item_id").notNull().references(() => workItems.id),
  summary: text("summary").notNull(),
  filesChanged: text("files_changed", { mode: "json" }).notNull().$type<string[]>().default([]),
  keyDecisions: text("key_decisions", { mode: "json" }).notNull().$type<string[]>().default([]),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  consolidatedInto: text("consolidated_into"), // ProjectMemoryId | null
});

export const projectMemoriesRelations = relations(projectMemories, ({ one }) => ({
  project: one(projects, {
    fields: [projectMemories.projectId],
    references: [projects.id],
  }),
  workItem: one(workItems, {
    fields: [projectMemories.workItemId],
    references: [workItems.id],
  }),
}));

// ── Chat Sessions ─────────────────────────────────────────────────

export const chatSessions = sqliteTable("chat_sessions", {
  id: text("id").primaryKey(), // ChatSessionId
  projectId: text("project_id").references(() => projects.id), // nullable for global sessions
  personaId: text("persona_id").references(() => personas.id), // nullable — null means default Pico
  workItemId: text("work_item_id").references(() => workItems.id), // nullable — for chat-in-context
  sdkSessionId: text("sdk_session_id"), // nullable — for future SDK session tracking
  title: text("title").notNull().default("New chat"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [chatSessions.projectId],
    references: [projects.id],
  }),
  persona: one(personas, {
    fields: [chatSessions.personaId],
    references: [personas.id],
  }),
  workItem: one(workItems, {
    fields: [chatSessions.workItemId],
    references: [workItems.id],
  }),
  messages: many(chatMessages),
}));

// ── Chat Messages ─────────────────────────────────────────────────

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(), // ChatMessageId
  sessionId: text("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  metadata: text("metadata", { mode: "json" }).notNull().$type<Record<string, unknown>>().default({}),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

// ── Global Memories ──────────────────────────────────────────────

export const globalMemories = sqliteTable("global_memories", {
  id: text("id").primaryKey(), // GlobalMemoryId
  personaId: text("persona_id").notNull().references(() => personas.id),
  summary: text("summary").notNull().default(""),
  keyDecisions: text("key_decisions", { mode: "json" }).notNull().$type<string[]>().default([]),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  consolidatedInto: text("consolidated_into"), // self-referencing FK (GlobalMemoryId | null)
});

export const globalMemoriesRelations = relations(globalMemories, ({ one }) => ({
  persona: one(personas, {
    fields: [globalMemories.personaId],
    references: [personas.id],
  }),
}));

// ── Workflows ───────────────────────────────────────────────────────

export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(), // WorkflowId
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  scope: text("scope").notNull().default("global"), // "global" | "project"
  projectId: text("project_id").references(() => projects.id), // nullable — null for global workflows
  version: integer("version").notNull().default(1),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  project: one(projects, {
    fields: [workflows.projectId],
    references: [projects.id],
  }),
  states: many(workflowStates),
  transitions: many(workflowTransitions),
}));

// ── Workflow States ─────────────────────────────────────────────────

export const workflowStates = sqliteTable("workflow_states", {
  id: text("id").primaryKey(), // WorkflowStateId
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("intermediate"), // "initial" | "intermediate" | "terminal"
  color: text("color").notNull().default("#6b7280"),
  personaId: text("persona_id").references(() => personas.id), // nullable — default persona for this state
  sortOrder: integer("sort_order").notNull().default(0),
});

export const workflowStatesRelations = relations(workflowStates, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowStates.workflowId],
    references: [workflows.id],
  }),
  persona: one(personas, {
    fields: [workflowStates.personaId],
    references: [personas.id],
  }),
}));

// ── Workflow Transitions ────────────────────────────────────────────

export const workflowTransitions = sqliteTable("workflow_transitions", {
  id: text("id").primaryKey(), // WorkflowTransitionId
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  fromStateId: text("from_state_id").notNull().references(() => workflowStates.id),
  toStateId: text("to_state_id").notNull().references(() => workflowStates.id),
  label: text("label").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const workflowTransitionsRelations = relations(workflowTransitions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowTransitions.workflowId],
    references: [workflows.id],
  }),
  fromState: one(workflowStates, {
    fields: [workflowTransitions.fromStateId],
    references: [workflowStates.id],
    relationName: "fromState",
  }),
  toState: one(workflowStates, {
    fields: [workflowTransitions.toStateId],
    references: [workflowStates.id],
    relationName: "toState",
  }),
}));

// ── Webhook Subscriptions ─────────────────────────────────────────

export const webhookSubscriptions = sqliteTable("webhook_subscriptions", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events", { mode: "json" }).notNull().$type<string[]>(), // e.g. ["execution.completed", "work_item.state_changed"]
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  failureCount: integer("failure_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// ── Webhook Deliveries ────────────────────────────────────────────

export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").notNull().references(() => webhookSubscriptions.id, { onDelete: "cascade" }),
  event: text("event").notNull(), // e.g. "execution.completed"
  payload: text("payload", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  status: text("status").notNull().default("pending"), // pending | delivered | failed
  statusCode: integer("status_code"), // HTTP response status code
  latencyMs: integer("latency_ms"), // delivery round-trip time
  attempt: integer("attempt").notNull().default(0),
  nextRetryAt: integer("next_retry_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const webhookSubscriptionsRelations = relations(webhookSubscriptions, ({ many }) => ({
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  subscription: one(webhookSubscriptions, {
    fields: [webhookDeliveries.subscriptionId],
    references: [webhookSubscriptions.id],
  }),
}));

// ── Webhook Triggers (Inbound) ────────────────────────────────────

export const webhookTriggers = sqliteTable("webhook_triggers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  secret: text("secret").notNull(),
  personaId: text("persona_id").notNull().references(() => personas.id),
  projectId: text("project_id").references(() => projects.id),
  promptTemplate: text("prompt_template").notNull().default(""),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const webhookTriggersRelations = relations(webhookTriggers, ({ one }) => ({
  persona: one(personas, {
    fields: [webhookTriggers.personaId],
    references: [personas.id],
  }),
  project: one(projects, {
    fields: [webhookTriggers.projectId],
    references: [projects.id],
  }),
}));
