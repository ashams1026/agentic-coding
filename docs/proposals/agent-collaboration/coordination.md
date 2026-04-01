# Multi-Agent Coordination Patterns — Design Research

Research into how multiple agents coordinate work within workflows: parallel execution, dependency handling, human-in-the-loop approvals, escalation, and fan-out/fan-in patterns.

**Current state:** The execution manager (`execution-manager.ts`) runs agents sequentially per work item — one persona at a time, driven by workflow state transitions. Concurrency control (`concurrency.ts`) limits total parallel executions across a project (default 3) via an in-memory `Set<string>` and a priority queue. Work item edges (`work_item_edges` table) track `blocks`, `depends_on`, and `related_to` relationships but are **not enforced** — neither the dispatch system nor the router check edges before starting work. There is no proposal/approval system in the MCP tools (only in the frontend mock data). Loop detection exists (3 visits to the same state in the last 6 transitions → halt) and rate limiting (10 transitions per hour per work item).

---

## 1. Parallel Execution

### Current behavior

Today, agents can run in parallel **across** different work items (up to `maxConcurrent`, default 3). But within a single work item, execution is strictly sequential: the workflow transitions through states one at a time, each state triggers one persona, and the next state isn't entered until the current execution completes and the router decides the next transition.

### Can sibling tasks run simultaneously?

Yes — if a parent story has 3 child tasks (from decomposition), each child is an independent work item with its own workflow state. The dispatch system can trigger all 3 simultaneously if:
1. Each child enters a state with an assigned persona
2. The concurrency limit allows it (3 slots available)
3. Each child has a different working directory or non-overlapping file scope

### Merge conflict risks

When multiple agents work on the same codebase simultaneously:

| Scenario | Risk | Frequency |
|---|---|---|
| Two agents edit different files | **None** — no conflict | Common |
| Two agents edit the same file, different sections | **Low** — can auto-merge via git | Occasional |
| Two agents edit the same file, overlapping lines | **High** — manual merge needed | Rare but destructive |
| Two agents both create a new file at the same path | **High** — one overwrites the other | Very rare |

### Conflict mitigation strategies

**Strategy A: File-level locking (recommended for Phase 1)**

Before an agent starts, it declares which files it intends to modify (from the work item description or via a planning step). A lock table prevents two agents from claiming the same file:

```sql
CREATE TABLE file_locks (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  execution_id TEXT NOT NULL REFERENCES executions(id),
  locked_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL    -- Auto-expire after execution timeout
);
CREATE UNIQUE INDEX idx_file_locks_path ON file_locks(project_id, file_path);
```

```typescript
// Before execution starts
async function acquireFileLocks(
  executionId: string,
  projectId: string,
  filePaths: string[],
): Promise<{ acquired: boolean; conflictingPaths: string[] }> {
  const conflicts: string[] = [];
  for (const path of filePaths) {
    const existing = await db.select().from(fileLocks)
      .where(and(eq(fileLocks.projectId, projectId), eq(fileLocks.filePath, path)));
    if (existing.length > 0 && existing[0].expiresAt > Date.now()) {
      conflicts.push(path);
    }
  }
  if (conflicts.length > 0) return { acquired: false, conflictingPaths: conflicts };

  // Acquire all locks
  for (const path of filePaths) {
    await db.insert(fileLocks).values({
      id: createId(),
      filePath: path,
      projectId,
      executionId,
      lockedAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minute TTL
    });
  }
  return { acquired: true, conflictingPaths: [] };
}
```

**Limitation:** Agents don't always know upfront which files they'll modify. The lock can be advisory (log a warning) rather than blocking.

**Strategy B: Branch-per-agent**

Each agent works on a git branch (`agent/<execution-id>`), and results are merged back to the main branch after completion:

```
main ─────────────┬────────┬────── merge ─────
                  │        │         ↑
agent/ex-abc ─────┘        │    merge ex-def
agent/ex-def ──────────────┘
```

Pros:
- Complete isolation — no conflict during execution
- Git handles merge automatically for non-overlapping changes
- Merge conflicts are detected at merge time, not during execution

Cons:
- Adds git branch management complexity
- The SDK's file checkpointing (`enableFileCheckpointing`) already tracks file state per execution — branches add a second layer
- Merge failures need a resolution strategy (reject the later agent's work? manual merge?)

**Recommendation:** Branch-per-agent is architecturally cleaner but adds significant complexity. For Phase 1, use **advisory file locking** (warn on conflicts, don't block) and let the concurrency limit (default 3) keep parallel execution manageable. Phase 2 can add branch-per-agent for users who enable high parallelism.

**Strategy C: Sequential fallback**

If two sibling tasks have overlapping file scopes, queue them instead of running in parallel. The dispatch system checks file overlap before spawning:

```typescript
async function hasFileOverlap(
  workItemId: string,
  activeExecutions: string[],
): boolean {
  // Compare expected files from work item description/context
  // against files being modified by active executions
  // Return true if overlap detected
}
```

This is a middle ground — parallel when safe, sequential when risky.

---

## 2. Blocking Dependencies

### Current state

Work item edges (`work_item_edges` table) have three types:
- `blocks`: A blocks B (B cannot proceed until A is done)
- `depends_on`: A depends on B (A cannot proceed until B is done)
- `related_to`: informational link only

**These are not enforced.** The dispatch system (`dispatchForState`) and router (`runRouter`) do not check edges before starting or transitioning. An agent can start work on item B even if its blocker A is still in progress.

### What needs to change

Add a dependency check to `dispatchForState()`:

```typescript
export async function dispatchForState(
  workItemId: string,
  stateName: string,
): Promise<void> {
  // ... existing project lookup, persona assignment lookup ...

  // NEW: Check blocking dependencies
  const blockers = await getUnresolvedBlockers(workItemId);
  if (blockers.length > 0) {
    // Don't dispatch — item is blocked by dependencies
    const blockerNames = blockers.map(b => b.title).join(", ");
    await postSystemComment(
      workItemId,
      `Dispatch blocked — waiting on: ${blockerNames}`,
    );
    return;
  }

  // ... existing concurrency check, spawn ...
}
```

```typescript
async function getUnresolvedBlockers(workItemId: string): Promise<Array<{ id: string; title: string }>> {
  // Find all edges where this item is blocked/depends on another
  const edges = await db.select().from(workItemEdges)
    .where(and(
      eq(workItemEdges.toId, workItemId),
      or(eq(workItemEdges.type, "blocks"), eq(workItemEdges.type, "depends_on")),
    ));

  if (edges.length === 0) return [];

  // Check if blocking items are Done
  const blockers: Array<{ id: string; title: string }> = [];
  for (const edge of edges) {
    const [blocker] = await db.select({ id: workItems.id, title: workItems.title, currentState: workItems.currentState })
      .from(workItems)
      .where(eq(workItems.id, edge.fromId));
    if (blocker && blocker.currentState !== "Done") {
      blockers.push({ id: blocker.id, title: blocker.title });
    }
  }
  return blockers;
}
```

### Dependency resolution triggers

When a blocker item reaches Done, the system should check if any dependent items are now unblocked:

```typescript
// In router.ts, after transitioning to Done
async function onWorkItemDone(workItemId: string): Promise<void> {
  // Find items that were waiting on this one
  const dependents = await db.select().from(workItemEdges)
    .where(and(
      eq(workItemEdges.fromId, workItemId),
      or(eq(workItemEdges.type, "blocks"), eq(workItemEdges.type, "depends_on")),
    ));

  for (const edge of dependents) {
    const remainingBlockers = await getUnresolvedBlockers(edge.toId);
    if (remainingBlockers.length === 0) {
      // All blockers resolved — dispatch the dependent item
      const [item] = await db.select({ currentState: workItems.currentState })
        .from(workItems).where(eq(workItems.id, edge.toId));
      if (item) {
        await dispatchForState(edge.toId, item.currentState);
      }
    }
  }
}
```

### Custom workflow implications

With custom workflows (RES.WORKFLOW.*), dependency semantics may vary:
- Some workflows may want "soft" dependencies (warn but don't block)
- Some may want dependencies between specific workflow states, not just "Done"
- Circular dependency detection is needed when users create edges

```typescript
function detectCircularDependency(fromId: string, toId: string): boolean {
  // BFS from toId following dependency edges
  // If we reach fromId, it's circular
}
```

---

## 3. Human-in-the-Loop

### Where humans intervene

| Intervention point | Trigger | Current support | Needed |
|---|---|---|---|
| **Proposal approval** | Agent suggests changes via proposal system | Frontend mock only — no MCP tool for agents to create proposals | MCP tool + approval workflow |
| **Workflow gate** | Certain states require human review before proceeding | Not implemented | "Manual" transition type on workflow edges |
| **Quality review** | After agent completes, human reviews before routing | Router auto-routes today | Optional manual review state |
| **Escalation** | Agent stuck/failing, requests human help | Not implemented (see §4) | Escalation MCP tool + notification |

### Proposal system integration

Agents need an MCP tool to create proposals:

```typescript
// MCP tool: create_proposal
server.registerTool("create_proposal", {
  description: "Submit a proposal for human review before proceeding",
  inputSchema: z.object({
    workItemId: z.string(),
    title: z.string(),
    description: z.string(),
    changes: z.array(z.object({
      filePath: z.string(),
      changeType: z.enum(["add", "modify", "delete"]),
      diff: z.string().optional(),
    })).optional(),
    blocking: z.boolean().default(true), // If true, execution pauses until approved
  }),
});
```

When a proposal is created with `blocking: true`:
1. Execution pauses (agent yields)
2. Notification sent to user (ties into RES.NOTIFY.UX — critical priority)
3. User reviews in the notification drawer or work item detail panel
4. User clicks Approve or Reject
5. On Approve: execution resumes (or router advances to next state)
6. On Reject: rejection payload is added to executionContext, agent may retry

### Manual workflow gates

In the workflow designer (RES.WORKFLOW.BUILDER), transitions between states can be marked as "manual":

```typescript
interface WorkflowTransition {
  fromState: string;
  toState: string;
  type: "auto" | "manual";      // auto = router decides; manual = human must approve
  requiredApproval?: "any" | "owner"; // Who can approve (future: role-based)
}
```

When the router wants to transition through a manual gate:
1. Instead of calling `route_to_state`, the router creates a proposal: "Ready to move from In Review → Done. Approve?"
2. The work item stays in "In Review" with a pending proposal
3. Notification fires (RES.NOTIFY.UX — "Workflow step requires human input")
4. Human approves → state transitions → next persona dispatched

### Notification integration

Human-in-the-loop actions are the primary use case for notifications (RES.NOTIFY.*):

| Action needed | Notification priority | Channel |
|---|---|---|
| Proposal needs approval | **Critical** | Toast + persistent + Slack/email |
| Manual gate waiting | **High** | Persistent + Slack |
| Escalation request | **Critical** | Toast + persistent + Slack/email |
| Agent completed (review optional) | **Low** | Toast only |

---

## 4. Escalation

### When agents escalate

| Situation | Detection | Current behavior | Proposed behavior |
|---|---|---|---|
| Agent fails repeatedly | `MAX_REJECTIONS` (3) reached | Work item moved to "Blocked" | Escalate to human + try different persona |
| Agent times out | Execution timeout exceeded | Execution marked "failed" | Retry with extended timeout or different model |
| Agent explicitly stuck | Agent can't make progress | Agent keeps trying until timeout | Agent calls `request_help` MCP tool |
| Rate limit / API error | SDK returns rate_limit event | Execution fails | Auto-retry with backoff |
| Budget exceeded per run | `maxBudgetPerRun` reached | Execution ends | Notify user, offer to increase budget |

### Escalation strategies

**Strategy 1: Retry with different parameters**

Before escalating to a human, try automatic recovery:

```typescript
interface EscalationPolicy {
  maxRetries: number;           // Total retries before human escalation
  retryStrategies: RetryStrategy[];
}

type RetryStrategy =
  | { type: "same"; delayMs: number }                    // Same persona, same model
  | { type: "different_model"; model: string }           // Same persona, upgrade model
  | { type: "different_persona"; personaId: string }     // Try a different persona
  | { type: "human"; notificationPriority: "critical" }; // Give up, ask human
```

Example escalation chain:
1. **First failure:** Retry same persona, same model (maybe transient)
2. **Second failure:** Retry same persona, upgraded model (sonnet → opus)
3. **Third failure:** Try a different persona (e.g., a "Debugging" persona)
4. **Fourth failure:** Escalate to human with full context

### `request_help` MCP tool

Agents should be able to explicitly request human assistance:

```typescript
server.registerTool("request_help", {
  description: "Request human assistance when stuck on a problem",
  inputSchema: z.object({
    workItemId: z.string(),
    reason: z.string(),           // What the agent can't figure out
    whatWasTried: z.string(),     // What approaches were attempted
    suggestedActions: z.array(z.string()).optional(), // What the agent thinks might help
  }),
});
```

When called:
1. Work item state → "Blocked" (or stays current with a "needs help" flag)
2. System comment posted with the help request details
3. Critical notification sent to user
4. User can: provide guidance (comment), change the prompt, assign a different persona, or complete the step manually

### Escalation configuration

Per-persona or per-project setting:

```typescript
interface EscalationSettings {
  autoRetry: boolean;           // Default: true
  maxAutoRetries: number;       // Default: 2
  upgradeModel: boolean;        // Try a better model before human escalation
  fallbackPersonaId?: string;   // Alternative persona to try
  notifyOnFirstFailure: boolean; // Notify human even on first failure
}
```

---

## 5. Fan-Out / Fan-In

### Pattern: Decompose → Parallel Execute → Aggregate

A common workflow pattern:

```
Story: "Build auth system"
        │
        ▼
  [Planning Agent] ─── decomposes into:
        │
        ├── Task 1: "Build login form"         ─── [Engineer]
        ├── Task 2: "Build registration form"   ─── [Engineer]
        └── Task 3: "Build password reset"      ─── [Engineer]
                                                      │
                                                      ▼
                                              [All 3 complete]
                                                      │
                                                      ▼
                                              [Review Agent]
                                              reviews all 3 tasks
```

### Fan-out: Decomposition triggers parallel work

The planning agent creates child work items via the `create_work_item` MCP tool. Each child starts in "Ready" state, which has an assigned Engineer persona. The dispatch system fires all 3 (subject to concurrency limits).

**Current support:** Mostly works today. The planning agent can create children via MCP, each gets dispatched independently. The gap is in fan-in.

### Fan-in: Waiting for all children to complete

When the parent story needs to advance only after all children are done, the system needs a "completion gate":

```typescript
interface CompletionGate {
  parentWorkItemId: string;
  requiredChildren: "all" | string[]; // All children, or specific IDs
  targetState: string;                // State to transition parent to when gate opens
  currentlyDone: string[];            // Children that have completed
}
```

**Detection approach: Event-driven**

When any child work item reaches Done:
1. Check if the parent has a completion gate
2. Update the gate's `currentlyDone` list
3. If all required children are done → transition parent to `targetState`
4. The router/dispatch system takes over from there

```typescript
// In router.ts or a new coordination module
async function checkParentCompletionGate(childWorkItemId: string): Promise<void> {
  const [child] = await db.select({ parentId: workItems.parentId })
    .from(workItems).where(eq(workItems.id, childWorkItemId));

  if (!child?.parentId) return;

  // Check if all siblings are Done
  const siblings = await db.select({ id: workItems.id, currentState: workItems.currentState })
    .from(workItems).where(eq(workItems.parentId, child.parentId));

  const allDone = siblings.every(s => s.currentState === "Done");
  if (!allDone) return;

  // All children complete — advance the parent
  const [parent] = await db.select({ currentState: workItems.currentState })
    .from(workItems).where(eq(workItems.id, child.parentId));

  if (parent && parent.currentState === "Decomposition") {
    // Transition parent to next state (e.g., "In Review")
    await transitionWorkItem(child.parentId, "In Review");
    await dispatchForState(child.parentId, "In Review");
  }
}
```

### Fan-in with partial results

Not all children may succeed. The completion gate needs a policy for partial completion:

| Policy | Behavior | Use case |
|---|---|---|
| **All must succeed** | Wait for all children to reach Done | Default — ensures completeness |
| **Majority** | Advance when >50% are Done | Batch processing where some failures are acceptable |
| **Any** | Advance when first child is Done | Racing strategies (try multiple approaches, take the first) |
| **Custom threshold** | Advance when N of M are Done | Configurable per workflow |

For failed children, the gate should:
1. Wait for them to either succeed (after retries) or be marked Blocked
2. If blocked, count as "not Done" — the gate doesn't open until the human unblocks them or the policy allows partial results

### Aggregation step

After fan-in, the reviewing agent needs context from all children. This ties directly into RES.COLLAB.CONTEXT:

- Each child's handoff note is available to the parent's next persona
- The context window builder should pull handoff notes from all children, not just the single previous execution
- Summarize across children: "3 tasks completed: login form (5 files), registration (4 files), password reset (3 files). All used react-hook-form pattern."

```typescript
// Extension to buildContextWindow for fan-in scenarios
async function getChildHandoffNotes(parentId: string): Promise<HandoffNote[]> {
  const children = await db.select({ id: workItems.id })
    .from(workItems).where(eq(workItems.parentId, parentId));

  const notes: HandoffNote[] = [];
  for (const child of children) {
    const childNotes = await db.select().from(handoffNotes)
      .where(eq(handoffNotes.workItemId, child.id))
      .orderBy(desc(handoffNotes.createdAt))
      .limit(1); // Most recent per child
    notes.push(...childNotes);
  }
  return notes;
}
```

---

## 6. Implementation Phases

### Phase 1: Dependency enforcement (highest impact, low effort)

- Add `getUnresolvedBlockers()` check to `dispatchForState()`
- Add `onWorkItemDone()` trigger to unblock dependents
- Add circular dependency detection when creating edges
- System comments when dispatch is blocked by dependencies

**Why first:** Dependencies already exist in the schema but aren't enforced. This is a bug fix more than a feature. Without enforcement, the entire dependency graph is decorative.

### Phase 2: Human-in-the-loop (proposals + manual gates)

- Add `create_proposal` MCP tool
- Implement proposal approval flow (backend + WebSocket notifications)
- Add "manual" transition type to workflow edges
- Connect to notification system (RES.NOTIFY.*)
- Approval from notification drawer (inline approve/reject)

**Why second:** Human-in-the-loop is essential for production use. Without it, agents run autonomously with no quality gate — fine for development, dangerous for production workflows.

### Phase 3: Escalation (auto-recovery + human fallback)

- Implement `EscalationPolicy` with retry strategies
- Add `request_help` MCP tool
- Model upgrade retry (sonnet → opus)
- Alternative persona retry
- Escalation notifications (critical priority)

**Why third:** Escalation improves reliability but isn't strictly necessary — the current behavior (3 rejections → Blocked) works as a basic safety net. Escalation makes it smarter.

### Phase 4: Fan-out/fan-in (advanced orchestration)

- Implement completion gate for parent work items
- `checkParentCompletionGate()` trigger on child Done
- Partial completion policies
- Child handoff note aggregation in context window
- Advisory file locking for parallel execution safety

**Why last:** Fan-out/fan-in is the most complex coordination pattern. It requires handoff notes (RES.COLLAB.CONTEXT Phase 1), dependency enforcement (Phase 1 above), and notifications (Phase 2 above) to work properly.

---

## 7. Relationship to Other Research

| Topic | Relationship |
|---|---|
| RES.COLLAB.CONTEXT | Handoff notes and scratchpad are the data layer that coordination patterns operate on. Fan-in aggregation needs child handoff notes. |
| RES.WORKFLOW.RUNTIME | Custom workflows define the state machine that coordination operates within. Manual gates are a workflow feature. |
| RES.WORKFLOW.BUILDER | Workflow designer must support "manual" transition types and dependency visualization. |
| RES.NOTIFY.UX | Notifications are the delivery mechanism for human-in-the-loop events (proposals, gates, escalation). |
| RES.NOTIFY.INTEGRATIONS | External channels (Slack approve/reject) enable human-in-the-loop without being at the app. |
| RES.RECOVERY.AGENTS | Escalation overlaps with recovery — both handle agent failures, but escalation is about routing to human/other agents while recovery is about automatic retry and rollback. |
| RES.ROLLBACK | When parallel agents conflict, rollback of one agent's changes may be needed. |
| RES.ANALYTICS.METRICS | Coordination metrics: average fan-out size, completion gate wait time, escalation rate, dependency chain length. |

---

## 8. Design Decisions

### Dependencies are checked at dispatch time, not continuously

Checking blockers only when `dispatchForState()` is called (on state transition) keeps the system event-driven. No polling. The `onWorkItemDone()` trigger handles the "unblock dependents" case. If a blocker is manually moved to Done, the dependent is re-dispatched.

### File locking is advisory in Phase 1

Hard file locking (block execution if locks can't be acquired) is too restrictive — agents often don't know their full file scope upfront. Advisory locking (log a warning, notify the user) provides visibility without blocking. Users can reduce `maxConcurrent` to 1 if they want strict sequential execution.

### Proposals pause execution, not the workflow

When an agent creates a blocking proposal, the execution pauses (the SDK subprocess yields). The work item stays in its current state. This is different from moving to a "Pending Approval" workflow state — the approval is within the current step, not a state transition. This keeps the workflow state machine clean and doesn't require every workflow to have approval states.

### Completion gates are implicit, not user-configured

When all children of a work item reach Done, the parent automatically advances. Users don't need to configure a "wait for children" gate — it's the default behavior for parent-child relationships. Explicit gates (wait for specific children, threshold policies) are Phase 2 features.

### Escalation to a different persona uses the same work item

When retrying with a different persona, the execution runs on the same work item in the same state. It's not a new work item or a new workflow step. The different persona is an alternative approach to the same task. The handoff note from the failed execution provides context to the replacement persona.
