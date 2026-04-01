# Template Variables for Persona Prompts — Design Research

Research into adding template variable support to persona system prompts, enabling dynamic content injection at prompt-build time.

---

## 1. Syntax — Variable Format

### Recommendation: `{{variable.name}}`

Double-curly-brace Mustache/Handlebars syntax. Rationale:

| Format | Pros | Cons |
|--------|------|------|
| `{{var}}` | Widely recognized (Mustache, Handlebars, Jinja2, GitHub Actions). Visually distinct from prose. No conflict with JSON (`{}`), JS template literals (`` ` ``), or Markdown. | Conflicts with LaTeX `\{{...}}` — unlikely in agent prompts. |
| `${var}` | Familiar to JS/TS developers. | Conflicts with JS template literals in code blocks. Ambiguous in Markdown (could be read as inline math or shell variable). |
| `{var}` | Minimal syntax. | Conflicts with JSON objects, Python dicts, and curly braces in code. High false-positive risk in prompts containing code snippets. |
| `%{var}` / `<var>` | No conflicts with code. | Unfamiliar. `<var>` conflicts with HTML/XML in prompts. |

**Chosen:** `{{variable.name}}`

### Syntax rules:
- Variable names: dot-separated path, alphanumeric + underscore. Regex: `\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}`
- Whitespace inside braces is trimmed: `{{ project.name }}` === `{{project.name}}`
- Nested object access via dots: `{{project.settings.description}}`
- No expressions, filters, or conditionals — this is simple substitution, not a template language

### Escaping:
- To include literal `{{` in a prompt, use `\{{` — the resolver skips escaped braces
- This is an edge case — most prompts won't contain literal double-curly-braces

---

## 2. Built-in Variables

### Available at prompt-build time (in `buildSystemPrompt()`)

These are resolved when the system prompt is assembled, before passing to the SDK.

| Variable | Value source | Available in |
|----------|-------------|--------------|
| `project.name` | `project.name` | Executor + Pico |
| `project.path` | `project.path` | Executor + Pico |
| `project.description` | `project.settings.description` | Executor + Pico |
| `project.patterns` | `project.settings.patterns` | Executor only |
| `persona.name` | `persona.name` | Both |
| `persona.description` | `persona.description` | Both |
| `persona.model` | `persona.model` | Both |
| `date.now` | ISO date string at resolution time | Both |
| `date.today` | `YYYY-MM-DD` at resolution time | Both |

### Available only at execution time (require task context)

These are only available in the executor path, not in Pico chat (no work item in chat).

| Variable | Value source | Available in |
|----------|-------------|--------------|
| `workItem.title` | `task.context.title` | Executor only |
| `workItem.id` | `task.workItemId` | Executor only |
| `workItem.state` | `task.context.currentState` | Executor only |
| `workItem.description` | `task.context.description` | Executor only |
| `workflow.currentState` | Same as `workItem.state` | Executor only |

### Not available as variables (by design)

| Data | Why not a variable |
|------|-------------------|
| Sandbox rules | System always injects these as a full section — users shouldn't override or reference them in templates |
| Execution history | Dynamic, multi-entry — doesn't fit single-value substitution |
| Project memories | On-demand via MCP tool — not available at prompt-build time |
| Parent chain | Complex structure (array of {title, id}) — doesn't serialize to a useful single string |

### Usage example:

```
You are {{persona.name}}, a {{persona.description}}.
You are working on the {{project.name}} project.
Today is {{date.today}}.

{{#if workItem.title}}
Your current task: {{workItem.title}}
{{/if}}
```

**Note:** The `{{#if}}` conditional is a stretch goal (see section 6). Initial implementation should be substitution-only — undefined variables are handled per section 4.

---

## 3. User-Defined Variables

### Storage: per-project key-value pairs

Users can define custom variables scoped to a project. These are substituted alongside built-in variables.

**Schema addition:**
```sql
-- New table
CREATE TABLE project_variables (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  key TEXT NOT NULL,           -- e.g. "coding_style"
  value TEXT NOT NULL,         -- e.g. "Follow Google TypeScript style guide"
  description TEXT DEFAULT '', -- Help text shown in UI
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, key)
);
```

**Access pattern:** `{{vars.coding_style}}` — all user-defined variables live under the `vars.` namespace to avoid collisions with built-in variables.

### Where users edit them:

**Option A (recommended):** Settings > Project > Variables tab. A key-value editor with:
- Name field (validated: `[a-zA-Z_][a-zA-Z0-9_]*`)
- Value textarea (can be multi-line)
- Optional description field
- Add/remove/reorder controls

**Option B:** Per-persona variable overrides. A persona could define variables that override project-level ones. This adds complexity — defer to a later phase.

### Scope resolution order:

1. Built-in variables (highest priority — can't be overridden)
2. Per-persona overrides (future — not in initial implementation)
3. Per-project variables (`vars.*` namespace)

---

## 4. Variable Resolution — When and How

### When: Inside `buildSystemPrompt()`, before joining sections

The resolution step happens after the user's `systemPrompt` is read from the DB but before it's pushed into the `sections` array.

```typescript
// In buildSystemPrompt():
const context = buildVariableContext(persona, task, project);

if (persona.systemPrompt) {
  sections.push(resolveVariables(persona.systemPrompt, context));
}

// In Pico chat route:
const context = buildVariableContext(pico, null, project);

if (pico.systemPrompt) {
  systemSections.push(resolveVariables(pico.systemPrompt, context));
}
```

### Resolution function:

```typescript
function resolveVariables(
  template: string,
  context: Record<string, string | undefined>,
): string {
  return template.replace(/(?<!\\)\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g,
    (match, varName) => {
      const value = context[varName];
      if (value !== undefined) return value;
      // Undefined variable — leave placeholder and warn
      console.warn(`Template variable {{${varName}}} is undefined`);
      return match; // leave as-is
    },
  );
}
```

### Undefined variable behavior:

| Option | Behavior | Recommended? |
|--------|----------|-------------|
| Leave placeholder | `{{unknown_var}}` stays in the prompt as literal text | **Yes — safest default** |
| Replace with empty string | Silently removes the placeholder | No — hides bugs, user doesn't know it failed |
| Throw/warn | Block prompt assembly or log a warning | Warn in logs, but don't block — prompts should still work |

**Recommendation:** Leave the placeholder as-is and log a warning. The agent will see `{{unknown_var}}` in its prompt but won't crash. This makes undefined variables visible and debuggable.

### Build-time validation (optional enhancement):

When saving a persona's system prompt, scan for `{{...}}` patterns and validate that each variable exists in the available set. Show warnings in the editor (yellow underline on unknown variables) but don't block saving — the variable might be defined later.

---

## 5. UI Support

### 5a. Autocomplete in the prompt editor

When the user types `{{` in the `SystemPromptEditor` textarea:
- Show a floating completion menu listing available variables
- Group by category: **Project** (`project.name`, `project.path`, ...), **Persona** (`persona.name`, ...), **Work Item** (`workItem.title`, ...), **Date** (`date.now`, ...), **Custom** (`vars.*`)
- Each entry shows: variable name, current value (if resolvable), and description
- Pressing Tab or Enter inserts the variable and closes the menu
- Typing further filters the list (fuzzy match)

**Implementation approach:** A lightweight popover triggered by `{{` detection in the textarea's `onInput` handler. Similar to @ mention autocomplete or VS Code IntelliSense. Use the existing shadcn/ui `Popover` + `Command` components.

### 5b. Variable reference panel

A collapsible panel next to or below the prompt editor:
- Lists all available variables with their current values
- Built-in variables show the live value from the selected project/persona
- User-defined variables (`vars.*`) show the configured value
- Click-to-insert: clicking a variable name inserts `{{var.name}}` at the cursor position
- "Used in prompt" indicator: highlight variables that appear in the current prompt text

### 5c. Preview button

A "Preview" mode (already exists as Edit/Preview toggle) enhanced to:
- Resolve all `{{...}}` variables using the current project/persona context
- Show the fully-hydrated prompt as it would appear to the agent
- Highlight resolved variables with a subtle background color so the user can see what was substituted
- Show warnings for undefined variables (e.g., `{{workItem.title}}` can't be previewed without a specific work item — show placeholder with a tooltip explaining it's resolved at execution time)

---

## 6. Design Decisions and Trade-offs

### Keep it simple — substitution only, no logic

The template system should be **pure string substitution**, not a template language. No conditionals (`{{#if}}`), no loops (`{{#each}}`), no filters (`{{name | uppercase}}`). Reasons:
- Prompts are natural language — complex template logic makes them hard to read and debug
- The system already injects structured sections (project context, work item, sandbox) — variables are for user customization within their own prompt text
- If users need conditional behavior, they can write it in natural language: "If working on frontend code, follow React conventions"

### Namespace separation prevents accidents

Built-in variables use flat dotted paths (`project.name`). User-defined variables are under `vars.*`. This prevents a user from accidentally shadowing `project.name` with a custom variable.

### Resolution happens once, at prompt-build time

Variables are resolved when `buildSystemPrompt()` runs, not by the SDK or at runtime. The SDK receives a fully-resolved string. This means:
- No dependency on SDK template support
- The resolved prompt is exactly what the agent sees
- Preview in the UI can show the exact final prompt

### Execution-time variables show as placeholders in preview

Variables like `{{workItem.title}}` can't be resolved in the editor because there's no active work item. The preview should show these with a visual indicator (e.g., highlighted placeholder with tooltip: "Resolved at execution time").

---

## 7. Implementation Phases

### Phase 1: Core substitution (minimal viable feature)
- `resolveVariables()` function in backend
- Built-in variable context builder
- Integration into `buildSystemPrompt()` and Pico chat route
- Variables resolve at prompt-build time; undefined left as-is with warning

### Phase 2: UI support
- Autocomplete popup on `{{` in the prompt editor
- Variable reference panel (collapsible, next to editor)
- Enhanced preview showing resolved variables

### Phase 3: User-defined variables
- `project_variables` table and CRUD API
- Settings > Project > Variables UI
- `vars.*` namespace in resolution context

### Phase 4: Validation and polish
- Editor warnings for undefined variables
- "Used variables" indicator in reference panel
- Execution-time variable preview placeholders with tooltips

---

## 8. Relationship to Existing Architecture

Per the [current architecture doc](./current-architecture.md), the user's `systemPrompt` is:
- Stored as plain text in the `personas` table
- Injected as section 1 in `buildSystemPrompt()` (executor) and section 1 in Pico chat assembly
- Passed to the SDK via `AgentDefinition.prompt`

Template variable resolution would be inserted **between reading `systemPrompt` from DB and pushing it into the sections array**. The rest of the pipeline (project context injection, sandbox rules, SDK delivery) is unchanged. Variables are a preprocessing step on the user's text only — system-injected sections are not templated.
