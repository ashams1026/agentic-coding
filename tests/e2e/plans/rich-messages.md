# Test Plan: Rich Message Rendering

## Objective

Verify that all rich message components (ThinkingBlock, ToolCallCard, TerminalBlock, DiffBlock, FileTreeSummary) render correctly with proper styling, interactivity, and edge-case handling in the chat interface.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data including at least one project
- chrome-devtools MCP connected
- Chat page accessible at `/p/pj-global/chat`
- At least one chat session with agent messages containing tool calls (thinking blocks, Read/Edit/Write/Bash/Grep/Glob tool_use blocks with varied statuses)
- If mock data does not include rich tool-call messages, trigger an agent chat that produces them (e.g., ask an agent to "read TASKS.md and edit a file")

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects -- record both.

---

### Part 1: ThinkingBlock

#### TC-RICH-1: ThinkingBlock renders and toggles

1. **Navigate** to `http://localhost:5173/p/pj-global/chat`
   - Verify: chat page loads with sidebar and message area
   - **Screenshot checkpoint:** Full page layout

2. **Locate** a message containing a ThinkingBlock
   - Look for: a block with a Brain icon, "Thinking" label, purple left border accent (`border-l-purple-400/50`)
   - Verify: block is expanded by default (body text visible, ChevronDown icon shown)
   - **Screenshot checkpoint:** ThinkingBlock expanded state -- purple border visible, header with Brain icon and "Thinking" label, body text rendered

3. **Click** the ThinkingBlock header (Brain icon / "Thinking" label area)
   - Expected: body collapses, ChevronDown changes to ChevronRight
   - Verify: only the header row remains visible
   - **Screenshot checkpoint:** ThinkingBlock collapsed state

4. **Click** the header again
   - Expected: body re-expands, ChevronRight changes back to ChevronDown
   - Verify: body text is visible again
   - **Screenshot checkpoint:** ThinkingBlock re-expanded

#### TC-RICH-2: ThinkingBlock markdown rendering

5. **Inspect** the ThinkingBlock body text (if it contains markdown)
   - Verify: **bold** text renders as `<strong>` (not raw `**text**`)
   - Verify: `inline code` renders in monospace with background highlight
   - Verify: code blocks (triple backtick) render as `<pre><code>` with monospace font, border, and optional language label
   - Verify: `## headers` / `### headers` render as semibold text
   - Verify: `- bullet items` render as `<li>` with disc markers and left margin
   - Verify: `[link text](url)` renders as an underlined `<a>` tag with `target="_blank"`
   - **Screenshot checkpoint:** Markdown rendering quality inside ThinkingBlock

#### TC-RICH-3: ThinkingBlock truncation (>2000 chars)

6. **Locate or create** a ThinkingBlock with text exceeding 2000 characters
   - If no such message exists in mock data, trigger an agent response with extended thinking that produces a long reasoning trace
   - Verify: text is truncated at 2000 characters
   - Verify: a "Show more (N more chars)" button appears in purple text below the truncated text
   - **Screenshot checkpoint:** Truncated thinking with "Show more" button visible

7. **Click** "Show more"
   - Expected: full text renders, button changes to "Show less"
   - Verify: all content now visible, no layout breakage
   - **Screenshot checkpoint:** Full thinking text after expanding

8. **Click** "Show less"
   - Expected: text re-truncates to 2000 chars, "Show more" button reappears
   - **Screenshot checkpoint:** Re-truncated state

#### TC-RICH-4: ThinkingBlock empty text (null render)

9. **Verify** that an empty or whitespace-only thinking text does not render a ThinkingBlock
   - This may require inspecting the DOM or triggering a message with `thinking.text = ""`
   - Expected: no ThinkingBlock element appears in the message for empty text
   - If not testable via UI alone, verify via DOM inspection: no element with Brain icon and "Thinking" label for that block

---

### Part 2: ToolCallCard

#### TC-RICH-5: ToolCallCard icon mapping per tool type

10. **Locate** ToolCallCards for different tool types in the chat messages. For each tool below, verify the correct icon renders:
    - **Read** -> FileText icon
    - **Edit** -> Pencil icon
    - **Write** -> FilePlus icon
    - **Bash** -> Terminal icon
    - **Grep** -> Search icon
    - **Glob** -> FolderSearch icon
    - **Agent** -> Bot icon (if present)
    - **Unknown tool** -> Wrench fallback icon
    - **Screenshot checkpoint:** At least 3 different tool types visible with correct icons

#### TC-RICH-6: ToolCallCard status badges

11. **Locate** ToolCallCards with different statuses:
    - **Running**: blue badge with "Running" text and spinning Loader2 icon (`animate-spin`)
    - **Success**: green badge with "Success" text
    - **Error**: red badge with "Error" text
    - Verify badge colors: running = `bg-blue-500/15 text-blue-400`, success = `bg-emerald-500/15 text-emerald-400`, error = `bg-red-500/15 text-red-400`
    - **Screenshot checkpoint:** At least 2 different status badges visible

#### TC-RICH-7: ToolCallCard auto-descriptions

12. **Verify** auto-generated descriptions for each tool type:
    - **Read** with `file_path: "/path/to/config.ts"` -> description shows "config.ts" (basename)
    - **Edit** with `file_path: "/src/utils/helpers.ts"` -> description shows "helpers.ts"
    - **Write** with `file_path: "/src/new-file.ts"` -> description shows "new-file.ts"
    - **Bash** with `command: "pnpm build"` -> description shows "pnpm build" (truncated at 60 chars if longer)
    - **Grep** with `pattern: "TODO|FIXME"` -> description shows "TODO|FIXME"
    - **Glob** with `pattern: "**/*.tsx"` -> description shows "**/*.tsx"
    - Verify: descriptions appear as muted text after the tool name in the header row
    - **Screenshot checkpoint:** Auto-descriptions for at least 2 tool types

#### TC-RICH-8: ToolCallCard expand/collapse defaults

13. **Verify** default expand states for different tool types:
    - **Edit** tool card -> expanded by default (input section visible)
    - **Write** tool card -> expanded by default
    - **Bash** tool card -> expanded by default
    - **Read** tool card -> collapsed by default (only header visible)
    - **Grep** tool card -> collapsed by default
    - **Glob** tool card -> collapsed by default
    - Verify: ChevronDown icon is rotated 180deg when expanded, 0deg when collapsed
    - **Screenshot checkpoint:** Mix of expanded and collapsed cards

14. **Click** a collapsed Read tool card header
    - Expected: card expands, input section with key-value pairs becomes visible
    - Verify: "Input" label in uppercase with key-value pairs below (e.g., `file_path: /path/to/file`)
    - **Screenshot checkpoint:** Expanded Read card showing input

15. **Click** the same header again
    - Expected: card collapses back to header only
    - **Screenshot checkpoint:** Re-collapsed state

#### TC-RICH-9: ToolCallCard input section

16. **Inspect** an expanded ToolCallCard's input section
    - Verify: "INPUT" label rendered as uppercase small text
    - Verify: each input key is shown in muted, font-medium text
    - Verify: each input value is in monospace font
    - Verify: long values (>100 chars) are truncated with ellipsis and have a `title` tooltip with the full value
    - **Screenshot checkpoint:** Input key-value pairs layout

#### TC-RICH-10: ToolCallCard output section

17. **Inspect** an expanded ToolCallCard that has output
    - Verify: output renders in a monospace `<pre>` block with rounded background
    - Verify: error output uses `text-red-400` styling
    - Verify: running status with no output shows "Running..." with spinning loader
    - Verify: error status with no output shows "Error (no output)" in red text
    - **Screenshot checkpoint:** Output section rendering

---

### Part 3: TerminalBlock

#### TC-RICH-11: TerminalBlock basic rendering

18. **Locate** a TerminalBlock in the chat (rendered for Bash tool calls with output)
    - Verify: dark background (`bg-zinc-900`), rounded container
    - Verify: command header bar with Terminal icon, `$ {command}` in monospace zinc-300 text
    - Verify: header has darker background (`bg-zinc-800/80`) with bottom border
    - **Screenshot checkpoint:** TerminalBlock with command header and output body

#### TC-RICH-12: TerminalBlock ANSI color rendering

19. **Locate or trigger** a TerminalBlock with ANSI-colored output (e.g., `pnpm build` or `git diff --color`)
    - Verify: colored text renders as styled `<span>` elements (not raw escape codes like `\x1b[32m`)
    - Verify: colors match ANSI spec (green for success messages, red for errors, etc.)
    - **Screenshot checkpoint:** Colored terminal output

#### TC-RICH-13: TerminalBlock scroll behavior

20. **Locate or trigger** a TerminalBlock with more than ~20 lines of output
    - Verify: output area has a maximum height of 300px (`max-h-[300px]`)
    - Verify: output area scrolls vertically when content exceeds 300px
    - Scroll down in the output area
    - **Screenshot checkpoint:** Scrollable terminal output with scrollbar visible

#### TC-RICH-14: TerminalBlock copy button

21. **Click** the Copy button in the TerminalBlock header
    - Target: button with `aria-label="Copy output"`
    - Expected: Copy icon changes to Check icon (green) for 2 seconds, then reverts
    - Verify: clipboard contains the output text with ANSI codes stripped (plain text only)
    - **Screenshot checkpoint:** Check icon visible after copy

#### TC-RICH-15: TerminalBlock exit code display

22. **Locate** a TerminalBlock with exit code 0
    - Verify: "exit 0" appears in green text (`text-green-400`) in the header bar
    - **Screenshot checkpoint:** Green exit code

23. **Locate** a TerminalBlock with a non-zero exit code (e.g., exit 1)
    - Verify: "exit 1" (or other non-zero code) appears in red text (`text-red-400`)
    - **Screenshot checkpoint:** Red exit code

#### TC-RICH-16: TerminalBlock line truncation (>500 lines)

24. **Locate or trigger** a TerminalBlock with output exceeding 500 lines
    - Verify: output is truncated to 500 lines
    - Verify: "Show all N lines" button appears below the truncated output (with ChevronDown icon, blue text)
    - **Screenshot checkpoint:** Truncated output with expand button

25. **Click** "Show all N lines"
    - Expected: full output renders, button changes to "Show less"
    - **Screenshot checkpoint:** Full output visible

26. **Click** "Show less"
    - Expected: output re-truncates to 500 lines, "Show all N lines" reappears
    - **Screenshot checkpoint:** Re-truncated state

---

### Part 4: DiffBlock

#### TC-RICH-17: DiffBlock basic rendering (edit mode)

27. **Locate** a DiffBlock rendered for an Edit tool call (old content -> new content)
    - Verify: file path header with FileText icon and file basename (not full path)
    - Verify: header has muted background (`bg-muted/30`), border bottom
    - Verify: line count summary in header shows `+N` (green) and `-M` (red) counts
    - **Screenshot checkpoint:** DiffBlock header with file name and line counts

28. **Inspect** the diff body
    - Verify: added lines have green background (`bg-green-500/10`) and `+` prefix in green
    - Verify: removed lines have red background (`bg-red-500/10`) and `-` prefix in red
    - Verify: context lines have neutral background and space prefix
    - Verify: line numbers displayed in two columns (old line number, new line number)
    - Verify: monospace font used throughout
    - **Screenshot checkpoint:** Diff body with red/green line highlighting and line numbers

#### TC-RICH-18: DiffBlock for new file (write mode)

29. **Locate** a DiffBlock rendered for a Write tool call (new file, no old content)
    - Verify: all lines are green (added) -- no red lines
    - Verify: `+N` count in header matches total line count, no `-M` shown (or `-0`)
    - **Screenshot checkpoint:** All-green new file diff

#### TC-RICH-19: DiffBlock copy button

30. **Click** the Copy button (clipboard icon) in the DiffBlock header
    - Expected: Copy icon changes to Check icon (green) for 2 seconds, then reverts
    - Verify: clipboard contains unified diff format text
    - **Screenshot checkpoint:** Check icon visible after copy

#### TC-RICH-20: DiffBlock scroll for large files

31. **Locate** a DiffBlock with many lines (exceeding `max-h-[400px]`)
    - Verify: diff body area scrolls vertically
    - Verify: header remains fixed/visible while scrolling the diff body
    - **Screenshot checkpoint:** Scrollable diff with visible scrollbar

---

### Part 5: FileTreeSummary

#### TC-RICH-21: FileTreeSummary renders for 2+ file changes

32. **Locate** a message with 2 or more Edit/Write tool calls
    - Verify: a FileTreeSummary component appears at the top of the message
    - Verify: it does NOT appear for messages with only 1 or 0 file changes
    - **Screenshot checkpoint:** FileTreeSummary visible above tool call cards

#### TC-RICH-22: FileTreeSummary tree structure and indicators

33. **Inspect** the FileTreeSummary
    - Verify: files are grouped by directory in a tree structure
    - Verify: modified files show an amber "M" indicator
    - Verify: added (new) files show a green "A" indicator
    - Verify: line counts are displayed per file
    - **Screenshot checkpoint:** Tree structure with M/A indicators and line counts

#### TC-RICH-23: FileTreeSummary collapse for >10 files

34. **Locate or trigger** a message with more than 10 file changes
    - Verify: FileTreeSummary is collapsed by default
    - Verify: an expand toggle is available to show all files
    - Click to expand
    - **Screenshot checkpoint:** Expanded file tree with >10 files

#### TC-RICH-24: FileTreeSummary click-to-scroll

35. **Click** a file name in the FileTreeSummary
    - Expected: page scrolls to the corresponding ToolCallCard for that file's Edit/Write operation
    - Verify: the target ToolCallCard comes into view
    - **Screenshot checkpoint:** Scrolled to target tool call card

---

### Part 6: Integration (ContentBlockRenderer dispatch)

#### TC-RICH-25: ContentBlockRenderer dispatches correctly

36. **Locate** a single assistant message that contains multiple block types (text, thinking, tool_use)
    - Verify: text blocks render as formatted markdown (PicoMarkdown)
    - Verify: thinking blocks render as ThinkingBlock with purple border (not raw text)
    - Verify: tool_use blocks render as ToolCallCard with icon, status badge, and expand/collapse
    - **Screenshot checkpoint:** Message with mixed block types

37. **Verify** ordering of blocks within a message
    - Expected: blocks render in the order they appear in the `content` array
    - Thinking blocks appear where the agent's reasoning occurred
    - Tool calls appear in execution order
    - Text blocks appear as the agent's final response

#### TC-RICH-26: Message-level expand/collapse toggle

38. **Locate** a message with multiple ToolCallCards
    - Look for: "Collapse all tools" / "Expand all tools" toggle at the message level
    - If present, **click** "Collapse all tools"
    - Expected: all ToolCallCards in the message collapse to header-only
    - **Screenshot checkpoint:** All tools collapsed

39. **Click** "Expand all tools"
    - Expected: all ToolCallCards expand to show input/output sections
    - **Screenshot checkpoint:** All tools expanded

---

### Part 7: Visual polish and edge cases

#### TC-RICH-27: Dark mode rendering

40. **Toggle** dark mode (if not already in dark mode, use appearance settings)
    - Navigate to settings and switch theme, or toggle via system preference
    - **Navigate** back to chat page

41. **Verify** all rich components in dark mode:
    - ThinkingBlock: purple border visible (`dark:border-l-purple-500/30`), text readable
    - ToolCallCard: status badge colors correct, input/output text readable
    - TerminalBlock: zinc-900 background distinct from page background, text in zinc-200/300
    - DiffBlock: green/red highlights visible but not overpowering, line numbers readable
    - **Screenshot checkpoint:** Full message with rich components in dark mode

#### TC-RICH-28: Light mode rendering

42. **Toggle** to light mode (if not already)
    - **Navigate** back to chat page

43. **Verify** all rich components in light mode:
    - ThinkingBlock: purple border visible, text readable
    - DiffBlock: `text-green-600` / `text-red-600` line numbers and prefixes (light mode variants)
    - ToolCallCard: badges readable on light background
    - **Screenshot checkpoint:** Full message with rich components in light mode

#### TC-RICH-29: Responsive layout

44. **Resize** viewport to 1024x768
    - Verify: all components render without horizontal overflow
    - Verify: TerminalBlock command text truncates with ellipsis if too long
    - Verify: DiffBlock lines wrap or scroll horizontally within their container
    - **Screenshot checkpoint:** Components at medium viewport

45. **Resize** viewport to 768x1024 (tablet portrait)
    - Verify: no layout breakage, components stack vertically
    - **Screenshot checkpoint:** Tablet portrait layout

46. **Resize** back to 1280x800 (desktop)
    - **Screenshot checkpoint:** Restored desktop layout

47. **Take final screenshot** for evidence (full page with a message containing rich components)

## Expected Results

- ThinkingBlock: renders with purple left border, expands/collapses on click, markdown renders (bold, code, headers, bullets, links), truncates at 2000 chars with "Show more"/"Show less" toggle, empty text produces no render
- ToolCallCard: shows correct icon per tool type, correct status badge color and text (running/success/error), auto-descriptions from input (basenames, commands, patterns), default expand state varies by tool type (Edit/Write/Bash expanded; Read/Grep/Glob collapsed), input key-value pairs and output section render correctly
- TerminalBlock: dark zinc background, `$ command` header, ANSI colors as styled spans, max-height 300px with scroll, copy strips ANSI codes, exit code green/red coloring, >500 lines truncation with expand toggle
- DiffBlock: file basename header with FileText icon, red/green line highlighting with line numbers, edit mode shows adds/removes/context, new file mode shows all green, copy produces unified diff, line count summary (+N / -M)
- FileTreeSummary: only renders with 2+ file changes, directory-grouped tree, amber M / green A indicators, line counts per file, collapsed by default if >10 files, clicking a file scrolls to its tool call card
- Integration: ContentBlockRenderer dispatches to correct component per block type, "Collapse all" / "Expand all" toggle works at message level
- All components render correctly in both light and dark mode
- No layout breakage at medium and tablet viewports

### Visual Quality

- No layout issues: elements properly aligned, no overlapping or clipping
- Text is readable: correct contrast in both light and dark mode
- Purple accent on ThinkingBlock: visible but subtle, not overpowering
- Status badges: consistent sizing, correct semantic colors
- TerminalBlock: distinct from page background, monospace font consistent
- DiffBlock: red/green lines distinguishable, line numbers aligned in columns
- FileTreeSummary: tree indentation clear, indicators properly colored
- Spacing is consistent: margins and padding follow a coherent pattern across all rich components
- Responsive: no horizontal overflow at 1024px+ widths, content scrolls within containers

## Failure Criteria

- ThinkingBlock does not render for thinking content blocks -> FAIL
- ThinkingBlock body does not collapse/expand on header click -> FAIL
- Markdown renders as raw text (e.g., `**bold**` shown literally) -> FAIL
- ThinkingBlock truncation missing for >2000 char text -> FAIL
- ToolCallCard shows wrong icon for a tool type -> FAIL
- ToolCallCard status badge shows wrong color or text -> FAIL
- ToolCallCard does not expand/collapse on header click -> FAIL
- ToolCallCard default expand states do not match spec (Edit expanded, Read collapsed, etc.) -> FAIL
- TerminalBlock shows raw ANSI escape codes instead of colored text -> FAIL
- TerminalBlock copy includes ANSI codes in clipboard -> FAIL
- TerminalBlock exit code uses wrong color (green for non-zero or red for zero) -> FAIL
- TerminalBlock does not scroll at max-height -> FAIL
- DiffBlock does not show red/green highlighting for removed/added lines -> FAIL
- DiffBlock line numbers missing or misaligned -> FAIL
- DiffBlock copy button does not produce unified diff format -> FAIL
- FileTreeSummary renders for a message with only 1 file change -> FAIL
- FileTreeSummary missing M/A indicators -> FAIL
- FileTreeSummary click does not scroll to the corresponding tool call -> FAIL
- ContentBlockRenderer renders wrong component for a block type -> FAIL
- Any NaN, undefined, `[object Object]`, or raw JSON visible in the UI -> FAIL
- Component crashes (white screen or React error boundary) -> FAIL
- Element does not appear within 5 seconds of expected trigger -> FAIL

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- ThinkingBlock purple border not visible or wrong color
- Elements overlap or clip outside their containers
- Text is invisible or unreadable (wrong color, too small, clipped)
- TerminalBlock text unreadable against dark background
- DiffBlock red/green lines indistinguishable (too faint or wrong color)
- Layout breaks: elements stacked incorrectly, misaligned columns, broken grid
- Inconsistent spacing: some components cramped while others have excessive gaps
- Status badge colors wrong or badges not visible
- Content truncation: important text cut off without ellipsis or scroll affordance
- Horizontal overflow causing page-level scrollbar
