import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ── Projects ───────────────────────────────────────────────────────

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(), // ProjectId
  name: text("name").notNull(),
  path: text("path").notNull(),
  settings: text("settings", { mode: "json" }).notNull().$type<Record<string, unknown>>().default({}),
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
  workItemId: text("work_item_id").notNull().references(() => workItems.id),
  personaId: text("persona_id").notNull().references(() => personas.id),
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
  projectId: text("project_id").notNull().references(() => projects.id),
  title: text("title").notNull().default("New chat"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [chatSessions.projectId],
    references: [projects.id],
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
