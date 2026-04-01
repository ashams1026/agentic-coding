# Rich Message Rendering for Agent Chat — Design Research

Research into rendering structured agent response content beyond plain text/markdown in the full-page chat experience.

**Current state:** `chat-message.tsx` renders three `ContentBlock` types: `text` (markdown via `PicoMarkdown`), `thinking` (collapsible block with Brain icon), and `tool_use` (card with tool name, input summary, status badge, expandable output). The compact mini panel uses `StatusLine` (animated single-line cycling). The full-page view uses `ContentBlockRenderer` which dispatches to `ThinkingBlock` or `ToolCallCard`.

---

## 1. Code Changes — Inline Diffs

### What it renders

When an agent writes or edits a file, show the change as a diff — not just "Used Edit on file.ts".

### Component: `DiffBlock`

```
┌─ src/routes/auth.ts ─────────────────────────────────────────┐
│  12  │ - const token = generateToken(user);                  │
│  12  │ + const token = generateToken(user, { expiresIn: '1h' }); │
│  13  │   return { token, refreshToken };                     │
│      │                                                       │
│  [Accept] [Reject] [Copy]                                    │
└──────────────────────────────────────────────────────────────┘
```

**Design:**
- **File path header** with file icon, relative path, and line range
- **Diff body** with red/green line highlighting, line numbers, monospace font
- **Syntax highlighting** via a lightweight tokenizer (no heavy dependency — use CSS class-based token coloring for common languages)
- **Actions:** Accept (applies the change), Reject (reverts), Copy (copies the diff to clipboard)
- **Collapsed by default** for Read tool results (just show file path + line count); **expanded** for Edit/Write results

**Interaction:**
- Click the file path header to expand/collapse
- Accept/Reject buttons are only relevant when the chat is interactive (agent proposes changes that the user approves). For historical messages, show read-only diff.

**Graceful degradation:**
- If diff data is unavailable (tool call only has `old_string`/`new_string` without full file context): show a minimal before/after block without line numbers
- If the file was created (Write tool): show the full file content with all-green highlighting, no diff

**Data source:** Extract from `tool_use` blocks where `toolName` is "Edit" or "Write". The `input` contains `file_path`, `old_string`, `new_string` (Edit) or `content` (Write). The `output` may contain the result or error.

---

## 2. Tool Calls — Collapsible Cards

### What it renders

A card for each tool invocation showing what the agent did and what it got back.

### Component: `ToolCallCard` (exists, needs enhancement)

```
┌─ 🔍 Grep — "AuthError" in src/ ───────────── ✓ 3 matches ── 2.1s ┐
│                                                                     │
│  Input:  pattern: "AuthError", path: "src/", type: "ts"           │
│                                                                     │
│  Output:                                                            │
│  src/routes/auth.ts:42: throw new AuthError("Invalid token")       │
│  src/routes/auth.ts:67: throw new AuthError("Expired")             │
│  src/middleware/auth.ts:15: import { AuthError } from ...          │
└─────────────────────────────────────────────────────────────────────┘
```

**Design:**
- **Header row:** Tool icon + tool name + rich description (from `getToolDescription()`) + status badge (running/success/error) + duration
- **Input section:** Key parameters formatted as key-value pairs (collapsible)
- **Output section:** Tool result, formatted appropriately per tool type:
  - Grep/Glob results: monospace, syntax-highlighted matches
  - Bash output: terminal-style block (see §3)
  - Read results: file content with line numbers
  - Edit/Write results: diff view (see §1)
  - Agent results: nested card or summary text

**Expand/collapse rules:**
- **Expanded by default:** Edit, Write, Bash (commands that modify state or produce important output)
- **Collapsed by default:** Read, Grep, Glob (routine information gathering)
- User can toggle any card; preference persists within the session

**Graceful degradation:**
- Missing output (tool still running): show spinner in output area
- Error result: show red-tinted output area with error message
- Unknown tool: generic card with raw JSON input/output

---

## 3. Terminal Output

### What it renders

Command output from Bash tool calls, with ANSI color support.

### Component: `TerminalBlock`

```
┌─ $ pnpm build ──────────────────────────────────────────────────┐
│  packages/frontend build$ tsc && vite build                      │
│  ✓ 2541 modules transformed.                                    │
│  dist/index.html                     0.45 kB │ gzip:   0.29 kB  │
│  dist/assets/index-B-r09vRA.css     92.30 kB │ gzip:  15.22 kB  │
│  dist/assets/index-Cah7ErSp.js   1,147.47 kB │ gzip: 326.20 kB  │
│  ✓ built in 536ms                                                │
│                                              [Copy] [Scroll ↓]  │
└──────────────────────────────────────────────────────────────────┘
```

**Design:**
- **Dark background** (`bg-zinc-900` / `bg-gray-950`), monospace font, with padding
- **Command header:** `$ {command}` in muted color above the output
- **ANSI color support:** Parse ANSI escape sequences into styled spans. Use a lightweight parser (e.g., `ansi-to-html` or custom regex-based parser for common codes: bold, red/green/yellow/blue, reset)
- **Scrollable:** Max height ~300px with vertical scroll. "Scroll to bottom" button if content overflows.
- **Copy button:** Copies raw text (without ANSI codes) to clipboard
- **Exit code:** Show at the bottom if non-zero: `Exit code: 1` in red

**Graceful degradation:**
- No ANSI codes: render as plain monospace text
- Very long output (>500 lines): truncate with "Show all N lines" expand button
- Empty output: show muted "No output" text

**Data source:** `tool_use` blocks where `toolName` is "Bash". `input.command` is the command, `output` is the terminal text.

---

## 4. File Trees

### What it renders

When an agent modifies multiple files in a single turn, show an overview tree.

### Component: `FileTreeSummary`

```
┌─ 5 files changed ────────────────────────────┐
│  📁 src/                                      │
│    ├─ ✏️  routes/auth.ts        (+12, -3)     │
│    ├─ ✏️  middleware/auth.ts    (+5, -1)       │
│    └─ ➕  utils/token.ts        (+45)          │
│  📁 tests/                                    │
│    └─ ✏️  auth.test.ts          (+20, -5)     │
│                                  [Expand All]  │
└────────────────────────────────────────────────┘
```

**Design:**
- **Summary header:** "N files changed" with expand/collapse toggle
- **Tree structure:** Directories as folders, files with change indicators:
  - ➕ Added (green) — Write tool, new file
  - ✏️ Modified (amber) — Edit tool
  - 🗑️ Deleted (red) — future, if agent can delete files
- **Line counts:** `(+added, -removed)` next to each file
- Clicking a file scrolls to or highlights the corresponding tool call card in the message

**When to show:**
- Only when 2+ files are changed in a single assistant message
- Appears at the top of the message, before individual tool call cards
- Collapsed by default if >10 files (to avoid overwhelming the view)

**Graceful degradation:**
- If line count data is unavailable: show file path only, no counts
- Single file change: don't show the tree — the tool card is sufficient

**Data source:** Aggregate all Edit/Write `tool_use` blocks within a single assistant message. Extract `file_path` from each.

---

## 5. Proposals

### What it renders

Structured cards for agent suggestions that require user approval.

### Component: `ProposalCard`

```
┌─ 💡 Proposal: Refactor auth middleware ─────── Pending ──────────┐
│                                                                   │
│  The auth middleware should be split into two functions:           │
│  1. `validateToken()` — pure token validation                     │
│  2. `requireAuth()` — Express middleware wrapper                   │
│                                                                   │
│  This improves testability and allows reuse in WebSocket auth.    │
│                                                                   │
│  Files affected: src/middleware/auth.ts, src/routes/ws.ts         │
│                                                                   │
│  [✓ Approve]  [✗ Reject]  [✏️ Edit & Approve]                    │
└───────────────────────────────────────────────────────────────────┘
```

**Design:**
- **Header:** Lightbulb icon + proposal title + status badge (Pending/Approved/Rejected)
- **Body:** Markdown-rendered description of the proposal
- **Metadata:** Files affected, estimated impact, confidence level (if provided)
- **Actions:**
  - **Approve:** Sends approval back to the agent; agent proceeds with the proposed work
  - **Reject:** Sends rejection; agent acknowledges and may propose alternative
  - **Edit & Approve:** Opens inline editor for the proposal description; user modifies then approves
- **After action:** Card updates to show the decision (green for approved, red for rejected) with timestamp

**Interaction:**
- Actions are only available in the active session during streaming or when the agent is waiting
- For historical messages, show the decision that was made (read-only)
- If the session is closed before a proposal is acted on, show as "Expired"

**Graceful degradation:**
- Proposal without structured data: render as a highlighted text block with generic approve/reject buttons
- Agent doesn't support proposals: never rendered (proposals are explicit MCP tool calls)

**Data source:** `tool_use` blocks where `toolName` is `create_proposal` or similar MCP tool. The input contains title, description, and affected files.

---

## 6. Thinking / Reasoning

### What it renders

Collapsible blocks showing the agent's chain of thought.

### Component: `ThinkingBlock` (exists, needs enhancement for full page)

```
┌─ 🧠 Thinking ────────────────────── [▼ Collapse] ───────────────┐
│                                                                   │
│  Let me analyze the authentication flow:                          │
│  1. The token is generated in auth.ts line 42                     │
│  2. It's validated in middleware/auth.ts                          │
│  3. The issue is that expired tokens aren't handled gracefully   │
│                                                                   │
│  I should check if there's a refresh token mechanism...           │
└───────────────────────────────────────────────────────────────────┘
```

**Design:**
- **Header:** Brain icon + "Thinking" label + expand/collapse toggle
- **Body:** Markdown-rendered thinking text, muted text color (distinguishes from response text)
- **Left border** accent (subtle purple/gray) to visually separate from response content
- **Expanded by default** on the full page; collapsed in compact mode (existing StatusLine behavior)

**Multiple thinking blocks:**
- If an assistant message has multiple thinking blocks (common in long responses), each renders separately
- Optional: "Show all thinking" toggle that expands/collapses all at once

**Graceful degradation:**
- Empty thinking text: don't render the block at all
- Very long thinking (>2000 chars): truncate with "Show more" link

**Data source:** `ContentBlock` with `type: "thinking"`. Already exists in the type system.

---

## 7. Images / Screenshots

### What it renders

Inline images when the agent captures screenshots via chrome-devtools MCP.

### Component: `ImageBlock`

```
┌─ 📸 Screenshot — localhost:5173/ ────────────────────────────────┐
│                                                                   │
│  [────────────────────────────────────────]                       │
│  [│         Rendered screenshot          │]                       │
│  [│         (max-width: 100%)            │]                       │
│  [────────────────────────────────────────]                       │
│                                                                   │
│  [🔍 Full size]  [📋 Copy]  [💾 Save]                            │
└───────────────────────────────────────────────────────────────────┘
```

**Design:**
- **Image container:** Responsive, max-width 100% of the chat area, preserving aspect ratio
- **Caption:** URL or file path of the screenshot source
- **Actions:** Full-size view (opens in modal/lightbox), Copy (to clipboard), Save (downloads)
- **Lazy loading:** Images below the fold are lazy-loaded
- **Thumbnail mode:** If multiple screenshots in a row, show as a horizontal strip with click-to-expand

**Graceful degradation:**
- Image failed to load: show placeholder with file path and "Failed to load" message
- Image is very large: cap at 600px width, user clicks to see full size
- No image data (path only): show "Screenshot captured" text with file path link

**Data source:** `tool_use` blocks where `toolName` is `mcp__chrome-devtools__take_screenshot`. Output may contain base64 image data or a file path. Also: any tool result that includes image data in the response.

---

## 8. Progress Indicators

### What it renders

Real-time feedback during active agent responses.

### Components

**StreamingTokens:**
- Blinking cursor at the end of the current text block while tokens are arriving
- Smooth text appearance (no jarring chunk-by-chunk rendering)

**ToolExecutionSpinner:**
- Inline spinner on the tool card while the tool is executing
- Tool card header shows "Running..." with animated dots
- Duration counter ticking up: "2.1s..."

**MultiStepProgress:**
```
┌─ Progress ────────────────────────────────────────┐
│  ✓ Reading source files              (3 files)    │
│  ✓ Analyzing dependencies            (12 deps)    │
│  ⏳ Writing implementation...         (2/5 files)  │
│  ○ Running tests                                   │
│  ○ Committing changes                              │
└───────────────────────────────────────────────────┘
```

**Design:**
- Shows when the agent is executing a multi-step workflow (multiple tool calls in sequence)
- Each step: status icon (✓ done, ⏳ in-progress, ○ pending) + label + metadata
- Auto-updates as tool calls complete
- Collapses to a single line after all steps complete: "Completed 5 steps in 12.3s"

**Graceful degradation:**
- Single tool call: just show the tool card with spinner, no progress bar
- Agent doesn't emit step-by-step events: fall back to simple typing indicator (existing behavior)
- Very fast execution (<1s per step): skip the progress animation, show completed state

**Data source:** Derived from SSE event stream. Each `tool_use` event starts a step; each `tool_result` completes it. The `text` events interspersed provide context.

---

## 9. Component Hierarchy Summary

```
AssistantMessage
├── FileTreeSummary          (if 2+ files changed)
├── ContentBlock[]
│   ├── ThinkingBlock        (type: "thinking")
│   ├── TextBlock            (type: "text" → PicoMarkdown)
│   ├── ToolCallCard         (type: "tool_use")
│   │   ├── DiffBlock        (Edit/Write tools)
│   │   ├── TerminalBlock    (Bash tool)
│   │   ├── ImageBlock       (screenshot tools)
│   │   └── GenericOutput    (all other tools)
│   └── ProposalCard         (create_proposal tool)
└── MultiStepProgress        (during streaming, multiple tool calls)
```

**Rendering dispatch logic:**
1. If streaming: show `MultiStepProgress` at the top (if 2+ tool calls in progress)
2. If 2+ Edit/Write tool calls: show `FileTreeSummary` before individual blocks
3. For each `ContentBlock`:
   - `thinking` → `ThinkingBlock`
   - `text` → `PicoMarkdown` (existing markdown renderer)
   - `tool_use` → dispatch by `toolName`:
     - Edit/Write → `ToolCallCard` with `DiffBlock` output
     - Bash → `ToolCallCard` with `TerminalBlock` output
     - Screenshot tools → `ToolCallCard` with `ImageBlock` output
     - `create_proposal` → `ProposalCard`
     - Everything else → `ToolCallCard` with `GenericOutput`

---

## 10. Implementation Priority

| Component | Priority | Complexity | Depends on |
|-----------|----------|------------|------------|
| ThinkingBlock (enhanced) | P0 | Low | Already exists |
| ToolCallCard (enhanced) | P0 | Medium | Exists, needs output dispatch |
| TerminalBlock | P1 | Low | New component, simple rendering |
| DiffBlock | P1 | Medium | Needs diff parsing logic |
| FileTreeSummary | P2 | Low | Aggregation of tool_use blocks |
| ProposalCard | P2 | Medium | Needs backend proposal system |
| ImageBlock | P2 | Low | Needs screenshot data pipeline |
| MultiStepProgress | P3 | Medium | Needs streaming state tracking |

P0 = needed for MVP chat page. P1 = high-value enhancements. P2 = nice-to-have. P3 = polish.
