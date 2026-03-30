import type {
  WorkItemId,
  PersonaId,
  ExecutionId,
  CommentId,
  ProposalId,
} from "@agentops/shared";
import {
  mockWs,
  createStateChangeEvent,
  createCommentCreatedEvent,
  createProposalCreatedEvent,
  createProposalUpdatedEvent,
} from "./ws";

// ── Demo IDs ──────────────────────────────────────────────────────

const DEMO_STORY = "wi-demo001" as WorkItemId;
const DEMO_TASK_1 = "wi-demo002" as WorkItemId;
const DEMO_TASK_2 = "wi-demo003" as WorkItemId;
const DEMO_TASK_3 = "wi-demo004" as WorkItemId;

const PM = "ps-pm00001" as PersonaId;
const TECH_LEAD = "ps-tl00001" as PersonaId;
const ENGINEER = "ps-en00001" as PersonaId;
const REVIEWER = "ps-rv00001" as PersonaId;
const QA = "ps-qa00001" as PersonaId;

const EXEC_PM = "ex-demo001" as ExecutionId;
const EXEC_TL = "ex-demo002" as ExecutionId;
const EXEC_ENG = "ex-demo003" as ExecutionId;
const EXEC_REV = "ex-demo004" as ExecutionId;
const EXEC_QA = "ex-demo005" as ExecutionId;

// ── Simulated agent output text ───────────────────────────────────

const PM_CHUNKS = [
  "Reading story requirements...\n",
  "Analyzing user needs for file upload feature...\n",
  "Drafting acceptance criteria:\n",
  "- Users can upload files up to 10MB\n",
  "- Supported formats: PNG, JPG, PDF, CSV\n",
  "- Upload progress indicator shown\n",
  "- Files stored with unique identifiers\n",
  "- Error handling for invalid formats\n",
  "Posting acceptance criteria to story.\n",
  "Done.",
];

const TL_CHUNKS = [
  "Reading story and acceptance criteria...\n",
  "Analyzing technical requirements...\n",
  "Designing task breakdown:\n",
  "Task 1: Build file upload API endpoint\n",
  "  - Multer middleware for multipart handling\n",
  "  - Validation layer for file types and size\n",
  "Task 2: Build upload UI component\n",
  "  - Drag-and-drop zone\n",
  "  - Progress bar with cancel support\n",
  "Task 3: Add file storage service\n",
  "  - S3-compatible storage adapter\n",
  "  - Unique filename generation\n",
  "Creating 3 tasks with dependency graph...\n",
  "Proposing task breakdown for approval.\n",
  "Done.",
];

const ENG_CHUNKS: (string | { content: string; chunkType: "text" | "code" | "thinking" | "tool_call" | "tool_result" })[] = [
  "Reading task context and inherited requirements...\n",
  { content: JSON.stringify({ toolCallId: "tc_001", toolName: "Read", input: { file_path: "/src/routes/index.ts" }, summary: "Reading /src/routes/index.ts" }), chunkType: "tool_call" },
  { content: JSON.stringify({ toolCallId: "tc_001", toolName: "Read", status: "success", output: "import { Router } from 'express';\n\nconst router = Router();\n\nrouter.get('/health', (req, res) => res.json({ ok: true }));\n\nexport default router;", summary: "Read 7 lines from /src/routes/index.ts" }), chunkType: "tool_result" },
  "Scanning existing codebase for patterns...\n",
  { content: JSON.stringify({ toolCallId: "tc_002", toolName: "Grep", input: { pattern: "multer|upload", path: "/src" }, summary: "Searching for upload patterns in /src" }), chunkType: "tool_call" },
  { content: JSON.stringify({ toolCallId: "tc_002", toolName: "Grep", status: "success", output: "No matches found", summary: "0 matches" }), chunkType: "tool_result" },
  "Creating upload API endpoint...\n",
  { content: JSON.stringify({ toolCallId: "tc_003", toolName: "Write", input: { file_path: "/src/routes/upload.ts" }, summary: "Writing /src/routes/upload.ts" }), chunkType: "tool_call" },
  { content: JSON.stringify({ toolCallId: "tc_003", toolName: "Write", status: "success", output: "", summary: "Created /src/routes/upload.ts" }), chunkType: "tool_result" },
  "Adding validation middleware...\n",
  { content: JSON.stringify({ toolCallId: "tc_004", toolName: "Edit", input: { file_path: "/src/routes/upload.ts", old_string: "const { file } = req;", new_string: "const { file } = req;\n  if (!file) return res.status(400).json({ error: 'No file provided' });\n  if (file.size > 10_000_000) return res.status(413).json({ error: 'File too large' });" }, summary: "Editing /src/routes/upload.ts" }), chunkType: "tool_call" },
  { content: JSON.stringify({ toolCallId: "tc_004", toolName: "Edit", status: "success", output: "- const { file } = req;\n+ const { file } = req;\n+   if (!file) return res.status(400).json({ error: 'No file provided' });\n+   if (file.size > 10_000_000) return res.status(413).json({ error: 'File too large' });", summary: "Edited /src/routes/upload.ts (+3 -1)", isDiff: true }), chunkType: "tool_result" },
  { content: JSON.stringify({ toolCallId: "tc_005", toolName: "Bash", input: { command: "npm test -- --grep upload" }, summary: "Running upload tests" }), chunkType: "tool_call" },
  { content: JSON.stringify({ toolCallId: "tc_005", toolName: "Bash", status: "success", output: "PASS src/routes/upload.test.ts\n  Upload endpoint\n    ✓ accepts valid file (45ms)\n    ✓ rejects missing file (12ms)\n    ✓ rejects oversized file (8ms)\n\n3 tests passed", summary: "3 tests passed" }), chunkType: "tool_result" },
  "All tests passing. Upload endpoint ready.\n",
  "Done.",
];

const REV_CHUNKS = [
  "Reading submitted code changes...\n",
  "Checking upload endpoint implementation...\n",
  "Verifying input validation — OK\n",
  "Checking error handling — OK\n",
  "Reviewing file size limits — OK\n",
  "Code style and conventions — OK\n",
  "Review passed. Approving changes.\n",
  "Done.",
];

const QA_CHUNKS = [
  "Running acceptance criteria verification...\n",
  "Test: Upload PNG file (5MB) — PASS\n",
  "Test: Upload JPG file (2MB) — PASS\n",
  "Test: Upload PDF file (8MB) — PASS\n",
  "Test: Reject EXE file — PASS\n",
  "Test: Reject 15MB file — PASS\n",
  "Test: Progress indicator shown — PASS\n",
  "All acceptance criteria verified.\n",
  "Done.",
];

// ── Demo state ────────────────────────────────────────────────────

let running = false;
let cancels: (() => void)[] = [];
let cancelCostTicker: (() => void) | null = null;
let onStopCallback: (() => void) | null = null;

// ── Scheduling helper ─────────────────────────────────────────────

function schedule(delayMs: number, fn: () => void): void {
  const timer = setTimeout(fn, delayMs);
  cancels.push(() => clearTimeout(timer));
}

// ── Demo script ───────────────────────────────────────────────────

/**
 * Start the demo sequence. Plays out over ~60 seconds.
 * Fires mock WebSocket events simulating a full story lifecycle.
 */
export function startDemo(): void {
  if (running) return;
  running = true;
  cancels = [];

  // Start cost ticker for the duration
  cancelCostTicker = mockWs.simulateCostTicker({
    baseTodayCost: 2.83,
    baseMonthCost: 28.50,
    incrementPerTick: 0.02,
    intervalMs: 2000,
  });

  // ── 0s: Story created ────────────────────────────────────────
  mockWs.emit(
    createStateChangeEvent({
      workItemId: DEMO_STORY,
      fromState: "",
      toState: "Backlog",
      triggeredBy: "user",
    }),
  );

  // ── 2s: Story → Defining, PM starts ─────────────────────────
  schedule(2000, () => {
    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_STORY,
        fromState: "Backlog",
        toState: "Defining",
        triggeredBy: PM,
      }),
    );

    const cancelRun = mockWs.simulateAgentRun({
      executionId: EXEC_PM,
      personaId: PM,
      workItemId: DEMO_STORY,
      workItemTitle: "Write acceptance criteria",
      chunks: PM_CHUNKS,
      chunkIntervalMs: 800,
      costUsd: 0.18,
    });
    cancels.push(cancelRun);
  });

  // ── 12s: PM done, comment posted, story → Decomposing ───────
  schedule(12000, () => {
    mockWs.emit(
      createCommentCreatedEvent({
        commentId: "cm-demo001" as CommentId,
        workItemId: DEMO_STORY,
        authorName: "PM",
        contentPreview: "Acceptance criteria: file upload with validation, progress indicator...",
      }),
    );

    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_STORY,
        fromState: "Defining",
        toState: "Decomposing",
        triggeredBy: TECH_LEAD,
      }),
    );
  });

  // ── 14s: Tech Lead starts ───────────────────────────────────
  schedule(14000, () => {
    const cancelRun = mockWs.simulateAgentRun({
      executionId: EXEC_TL,
      personaId: TECH_LEAD,
      workItemId: DEMO_STORY,
      workItemTitle: "Decompose into tasks",
      chunks: TL_CHUNKS,
      chunkIntervalMs: 800,
      costUsd: 0.85,
    });
    cancels.push(cancelRun);
  });

  // ── 26s: Tech Lead done, proposal created ───────────────────
  schedule(26000, () => {
    mockWs.emit(
      createCommentCreatedEvent({
        commentId: "cm-demo002" as CommentId,
        workItemId: DEMO_STORY,
        authorName: "Tech Lead",
        contentPreview: "Decomposed into 3 tasks: upload API, upload UI, storage service",
      }),
    );

    mockWs.emit(
      createProposalCreatedEvent({
        proposalId: "pp-demo001" as ProposalId,
        executionId: EXEC_TL,
        workItemId: DEMO_STORY,
        proposalType: "task_creation",
      }),
    );
  });

  // ── 29s: Proposal approved, story → In Progress ─────────────
  schedule(29000, () => {
    mockWs.emit(
      createProposalUpdatedEvent({
        proposalId: "pp-demo001" as ProposalId,
        status: "approved",
      }),
    );

    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_STORY,
        fromState: "Decomposing",
        toState: "In Progress",
        triggeredBy: "user",
      }),
    );

    // Tasks created
    for (const taskId of [DEMO_TASK_1, DEMO_TASK_2, DEMO_TASK_3]) {
      mockWs.emit(
        createStateChangeEvent({
          workItemId: taskId,
          fromState: "",
          toState: "Pending",
          triggeredBy: "system",
        }),
      );
    }
  });

  // ── 31s: Engineer starts on task 1 ──────────────────────────
  schedule(31000, () => {
    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_TASK_1,
        fromState: "Pending",
        toState: "Running",
        triggeredBy: ENGINEER,
      }),
    );

    const cancelRun = mockWs.simulateAgentRun({
      executionId: EXEC_ENG,
      personaId: ENGINEER,
      workItemId: DEMO_TASK_1,
      workItemTitle: "Build file upload API endpoint",
      chunks: ENG_CHUNKS,
      chunkIntervalMs: 600,
      costUsd: 1.20,
    });
    cancels.push(cancelRun);
  });

  // ── 42s: Engineer done, task 1 → Review, story → In Review ──
  schedule(42000, () => {
    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_TASK_1,
        fromState: "Running",
        toState: "Review",
        triggeredBy: ENGINEER,
      }),
    );

    mockWs.emit(
      createCommentCreatedEvent({
        commentId: "cm-demo003" as CommentId,
        workItemId: DEMO_TASK_1,
        authorName: "Engineer",
        contentPreview: "Upload endpoint implemented with validation and tests.",
      }),
    );

    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_STORY,
        fromState: "In Progress",
        toState: "In Review",
        triggeredBy: REVIEWER,
      }),
    );
  });

  // ── 44s: Reviewer starts ────────────────────────────────────
  schedule(44000, () => {
    const cancelRun = mockWs.simulateAgentRun({
      executionId: EXEC_REV,
      personaId: REVIEWER,
      workItemId: DEMO_TASK_1,
      workItemTitle: "Review upload endpoint",
      chunks: REV_CHUNKS,
      chunkIntervalMs: 700,
      costUsd: 0.25,
    });
    cancels.push(cancelRun);
  });

  // ── 51s: Reviewer done, task approved, story → QA ───────────
  schedule(51000, () => {
    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_TASK_1,
        fromState: "Review",
        toState: "Done",
        triggeredBy: REVIEWER,
      }),
    );

    mockWs.emit(
      createCommentCreatedEvent({
        commentId: "cm-demo004" as CommentId,
        workItemId: DEMO_TASK_1,
        authorName: "Reviewer",
        contentPreview: "Code review passed. All checks OK.",
      }),
    );

    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_STORY,
        fromState: "In Review",
        toState: "QA",
        triggeredBy: QA,
      }),
    );
  });

  // ── 53s: QA starts ─────────────────────────────────────────
  schedule(53000, () => {
    const cancelRun = mockWs.simulateAgentRun({
      executionId: EXEC_QA,
      personaId: QA,
      workItemId: DEMO_STORY,
      workItemTitle: "Verify acceptance criteria",
      chunks: QA_CHUNKS,
      chunkIntervalMs: 600,
      costUsd: 0.15,
    });
    cancels.push(cancelRun);
  });

  // ── 59s: QA done, story → Done ─────────────────────────────
  schedule(59000, () => {
    mockWs.emit(
      createCommentCreatedEvent({
        commentId: "cm-demo005" as CommentId,
        workItemId: DEMO_STORY,
        authorName: "QA",
        contentPreview: "All acceptance criteria verified. 6/6 tests passing.",
      }),
    );

    mockWs.emit(
      createStateChangeEvent({
        workItemId: DEMO_STORY,
        fromState: "QA",
        toState: "Done",
        triggeredBy: QA,
      }),
    );
  });

  // ── 61s: Demo complete ──────────────────────────────────────
  schedule(61000, () => {
    stopDemo();
  });
}

/** Stop the demo and cancel all pending events. */
export function stopDemo(): void {
  if (!running) return;
  running = false;
  cancels.forEach((cancel) => cancel());
  cancels = [];
  if (cancelCostTicker) {
    cancelCostTicker();
    cancelCostTicker = null;
  }
  mockWs.clearAll();
  onStopCallback?.();
  onStopCallback = null;
}

/** Check if the demo is currently running. */
export function isDemoRunning(): boolean {
  return running;
}

/** Register a callback for when the demo stops (completes or is cancelled). */
export function onDemoStop(callback: () => void): void {
  onStopCallback = callback;
}

/** Check URL for `?demo=true` and auto-start if present. */
export function checkDemoAutoStart(): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get("demo") === "true") {
    startDemo();
  }
}
