import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { executions, proposals, workItems, personas, projects } from "../db/schema.js";
import type {
  DashboardStats,
  CostSummary,
  ExecutionStats,
  ReadyWorkItem,
  WorkItem,
  Persona,
  WorkItemId,
  PersonaId,
  ProjectId,
  Priority,
  ExecutionId,
  ExecutionOutcome,
  PersonaModel,
  RejectionPayload,
} from "@agentops/shared";

function toIso(d: Date): string {
  return d.toISOString();
}

export async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/dashboard/stats
  app.get("/api/dashboard/stats", async (): Promise<DashboardStats> => {
    const allExecutions = await db.select().from(executions);
    const allProposals = await db.select().from(proposals);
    const allWorkItems = await db.select().from(workItems);

    const activeAgents = allExecutions.filter((e) => e.status === "running").length;
    const pendingProposals = allProposals.filter((p) => p.status === "pending").length;
    const blockedItems = allWorkItems.filter((w) => w.currentState === "Blocked").length;
    const needsAttention = blockedItems + pendingProposals;

    const today = new Date().toISOString().slice(0, 10);
    const todayCostUsd = allExecutions
      .filter((e) => toIso(e.startedAt).startsWith(today))
      .reduce((sum, e) => sum + e.costUsd, 0);

    return { activeAgents, pendingProposals, needsAttention, todayCostUsd };
  });

  // GET /api/dashboard/cost-summary
  app.get("/api/dashboard/cost-summary", async (): Promise<CostSummary> => {
    const allExecutions = await db.select().from(executions);
    const now = new Date();

    const dailySpend: CostSummary["dailySpend"] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const costUsd = allExecutions
        .filter((e) => toIso(e.startedAt).startsWith(dateStr))
        .reduce((sum, e) => sum + e.costUsd, 0);
      dailySpend.push({ date: dateStr, costUsd });
    }

    const monthStart = now.toISOString().slice(0, 7);
    const monthTotal = allExecutions
      .filter((e) => toIso(e.startedAt).startsWith(monthStart))
      .reduce((sum, e) => sum + e.costUsd, 0);

    const allProjects = await db.select().from(projects);
    const project = allProjects[0];
    const monthCap = (project?.settings as Record<string, unknown>)?.monthlyCostCap as number ?? 50;

    return { dailySpend, monthTotal, monthCap };
  });

  // GET /api/dashboard/execution-stats
  app.get("/api/dashboard/execution-stats", async (): Promise<ExecutionStats> => {
    const allExecutions = await db.select().from(executions);
    const completed = allExecutions.filter((e) => e.status === "completed");

    const totalRuns = completed.length;
    const totalCostUsd = completed.reduce((sum, e) => sum + e.costUsd, 0);
    const successes = completed.filter((e) => e.outcome === "success").length;
    const successRate = totalRuns > 0 ? successes / totalRuns : 0;
    const averageDurationMs =
      totalRuns > 0 ? completed.reduce((sum, e) => sum + e.durationMs, 0) / totalRuns : 0;

    return { totalRuns, totalCostUsd, successRate, averageDurationMs };
  });

  // GET /api/dashboard/ready-work
  app.get("/api/dashboard/ready-work", async () => {
    const readyItems = await db
      .select()
      .from(workItems)
      .where(eq(workItems.currentState, "Ready"));

    const allPersonas = await db.select().from(personas);
    const personaMap = new Map(allPersonas.map((p) => [p.id, p]));

    const data: ReadyWorkItem[] = readyItems.slice(0, 5).map((wi) => {
      const persona = wi.assignedPersonaId ? personaMap.get(wi.assignedPersonaId) ?? null : null;
      const workItem: WorkItem = {
        id: wi.id as WorkItemId,
        parentId: (wi.parentId as WorkItemId) ?? null,
        projectId: wi.projectId as ProjectId,
        title: wi.title,
        description: wi.description,
        context: wi.context,
        currentState: wi.currentState,
        priority: wi.priority as Priority,
        labels: wi.labels,
        assignedPersonaId: (wi.assignedPersonaId as PersonaId) ?? null,
        executionContext: wi.executionContext.map((ec) => ({
          executionId: ec.executionId as ExecutionId,
          summary: ec.summary,
          outcome: ec.outcome as ExecutionOutcome,
          rejectionPayload: ec.rejectionPayload as RejectionPayload | null,
        })),
        createdAt: toIso(wi.createdAt),
        updatedAt: toIso(wi.updatedAt),
      };
      const serializedPersona: Persona | null = persona
        ? {
            id: persona.id as PersonaId,
            name: persona.name,
            description: persona.description,
            avatar: persona.avatar,
            systemPrompt: persona.systemPrompt,
            model: persona.model as PersonaModel,
            allowedTools: persona.allowedTools,
            mcpTools: persona.mcpTools,
            maxBudgetPerRun: persona.maxBudgetPerRun,
            settings: persona.settings,
          }
        : null;
      return { workItem, persona: serializedPersona };
    });

    return { data, total: data.length };
  });
}
