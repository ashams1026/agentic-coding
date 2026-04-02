# Test Plan: Scheduling + Templates + Notification Channels

## Objective

Verify cron-based schedule CRUD on the Automations page, work item template picker on the Work Items page, and webhook notification channel toggle in Settings > Notifications.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with at least one project and one agent/persona
- chrome-devtools MCP connected
- No pre-existing schedules (clean state preferred)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

---

### Part 1: Scheduling (Automations Page)

### TC-SCH-1: Schedule section visible on Automations page

1. **Navigate** to `http://localhost:5173/p/<projectId>/automations`
   - Verify: page loads without errors
   - **Screenshot checkpoint**

2. **Verify** the "Schedules" section heading is visible below the Workflows section
   - Look for: Clock icon + "Schedules" text + count badge
   - Expected: section header present with `0` count (empty state)

3. **Verify** empty state content
   - Expected: dashed border container with Clock icon, "No schedules configured" text, and "Create Schedule" button
   - **Screenshot checkpoint**

### TC-SCH-2: Create new schedule via dialog

1. **Click** the "Create Schedule" button in the empty state (or the "+" button in the section header if schedules exist)
   - Expected: Schedule dialog opens with title "Create Schedule" (or "New Schedule")
   - **Screenshot checkpoint**

2. **Verify** dialog form fields
   - Name: text input for schedule name
   - Agent: dropdown/select listing available agents
   - Frequency: dropdown with presets (Every 30 minutes, Every hour, Every 2 hours, Every 6 hours, Daily at midnight, Daily at 9am, Weekdays at 9am, Custom)
   - Custom cron: text input appears only when "Custom" preset is selected
   - Prompt: textarea for prompt template (optional)
   - **Screenshot checkpoint**

3. **Fill** the form
   - Type "Test Schedule" in the name input
   - Select an agent from the dropdown
   - Select "Every hour" from the frequency dropdown
   - Type "Run daily checks" in the prompt textarea

4. **Click** "Create" / "Save" button
   - Expected: dialog closes, toast shows "Schedule created", new schedule card appears in the Schedules section
   - Verify: count badge increments to `1`
   - **Screenshot checkpoint**

### TC-SCH-3: Edit existing schedule with pre-filled form

1. **Click** the pencil (edit) icon on the schedule card created in TC-SCH-2
   - Expected: Schedule dialog opens with pre-filled values
   - Verify: Name field shows "Test Schedule"
   - Verify: Agent dropdown shows previously selected agent
   - Verify: Frequency shows "Every hour" (preset `0 * * * *`)
   - Verify: Prompt shows "Run daily checks"
   - **Screenshot checkpoint**

2. **Change** the name to "Updated Schedule" and frequency to "Every 2 hours"

3. **Click** "Save"
   - Expected: dialog closes, toast shows "Schedule updated", card reflects updated name and frequency
   - **Screenshot checkpoint**

### TC-SCH-4: Delete schedule with confirmation

1. **Click** the trash icon on the schedule card
   - Expected: schedule is removed from the list (or a confirmation dialog appears first)
   - Verify: toast shows "Schedule deleted"
   - Verify: if no schedules remain, empty state returns
   - **Screenshot checkpoint**

2. **Re-create** a schedule for subsequent tests (follow TC-SCH-2 steps)

### TC-SCH-5: Run Now button triggers immediate execution

1. **Click** the play icon (Run Now) on a schedule card
   - Expected: button shows a spinner (Loader2 animation) while the request is in flight
   - Verify: toast shows "Execution started: <executionId>"
   - Verify: after completion, the schedule card may update "Last run" status
   - **Screenshot checkpoint**

### TC-SCH-6: Active/disabled toggle works

1. **Verify** the schedule card shows an "Active" toggle/badge (emerald green, Play icon)

2. **Click** the Active toggle on the schedule card
   - Expected: badge changes to "Paused" (muted color, Pause icon)
   - Verify: schedule `isActive` state is toggled
   - **Screenshot checkpoint**

3. **Click** the toggle again
   - Expected: badge returns to "Active" (emerald green, Play icon)

### TC-SCH-7: Schedule card shows human-readable cron and next run time

1. **Verify** schedule card content for a schedule with cron `0 * * * *`
   - Expected: Clock icon with "Every hour" text (human-readable)
   - Expected: Calendar icon with "Next: in Xm" or "Next: in Xh" relative time
   - **Screenshot checkpoint**

2. **Verify** the last run status badge
   - If never run: "Never run" badge with Circle icon
   - If last run succeeded: "Last run OK" badge with CheckCircle icon (emerald)
   - If failures: failure count badge with XCircle icon (red)

---

### Part 2: Templates (Work Items Page)

### TC-TPL-1: Add button opens template picker dialog

1. **Navigate** to `http://localhost:5173/p/<projectId>/items`
   - Verify: Work Items page loads with item list
   - **Screenshot checkpoint**

2. **Click** the "Add" button in the page header
   - Expected: TemplatePickerDialog opens
   - Verify: dialog title is "Create Work Item"
   - Verify: dialog description is "Choose a template to get started, or start blank."
   - **Screenshot checkpoint**

### TC-TPL-2: Template grid shows all five templates

1. **Verify** the dialog contains a grid of 5 template cards in a 2-3 column layout
   - **Blank** (FileText icon) — "Start from scratch"
   - **Bug Report** (Bug icon) — "Track a bug or defect"
   - **Feature Request** (Lightbulb icon) — "Request a new feature"
   - **Task** (ClipboardList icon) — "A general development task"
   - **Research Spike** (Search icon) — "Investigate a technical approach"
   - **Screenshot checkpoint**

2. **Verify** each card has:
   - An icon in a muted background circle
   - Template name in bold text
   - Description in muted text below the name

### TC-TPL-3: Selecting "Blank" creates an empty work item

1. **Click** the "Blank" template card
   - Expected: dialog closes
   - Verify: a new work item is created with title "New work item"
   - Verify: description is empty
   - Verify: priority defaults to `p2`
   - Verify: no labels applied
   - Verify: the new item appears in the work items list
   - **Screenshot checkpoint**

### TC-TPL-4: Selecting "Bug Report" pre-fills fields

1. **Click** "Add" to reopen the template picker

2. **Click** the "Bug Report" template card
   - Expected: dialog closes, new work item created
   - Verify: title starts with "Bug: "
   - Verify: description contains "## Steps to Reproduce", "## Expected Behavior", "## Actual Behavior"
   - Verify: priority is `p1`
   - Verify: labels include "bug"
   - **Screenshot checkpoint**

### TC-TPL-5: Selecting other templates pre-fills correctly

1. **Test "Feature Request"** template
   - Click "Add", then "Feature Request"
   - Verify: title starts with "Feature: "
   - Verify: description contains "## Description", "## Acceptance Criteria"
   - Verify: priority is `p2`
   - Verify: labels include "feature"

2. **Test "Task"** template
   - Click "Add", then "Task"
   - Verify: title is "New work item" (empty title prefix)
   - Verify: description contains "## Objective", "## Steps"
   - Verify: priority is `p2`
   - Verify: labels include "task"

3. **Test "Research Spike"** template
   - Click "Add", then "Research Spike"
   - Verify: title starts with "Spike: "
   - Verify: description contains "## Question", "## Findings"
   - Verify: priority is `p3`
   - Verify: labels include "research"

### TC-TPL-6: Created work items appear in the list

1. **Verify** all work items created in TC-TPL-3 through TC-TPL-5 appear in the work items list
   - Expected: items visible with correct titles
   - Verify: list count increased by the number of items created
   - **Screenshot checkpoint**

---

### Part 3: Notification Channels (Settings > Notifications)

### TC-NEC-1: Notifications section shows Notification Channels subsection

1. **Navigate** to `http://localhost:5173/app-settings`
   - **Screenshot checkpoint**

2. **Click** "Notifications" in the settings left sidebar
   - Verify: Notifications section loads with four subsections: Event Types, Quiet Hours, Scope, Notification Channels
   - **Screenshot checkpoint**

3. **Scroll** to the "Notification Channels" section
   - Verify: heading "Notification Channels" is visible
   - Verify: description "Route notifications to external services." is visible
   - Verify: Webhook Channel row with Webhook icon, name, "Inactive" badge, and toggle
   - **Screenshot checkpoint**

### TC-NEC-2: Webhook channel toggle enables/disables

1. **Verify** initial state
   - Webhook Channel toggle is OFF
   - Badge shows "Inactive"

2. **Click** the Webhook Channel toggle to enable
   - Expected: toggle switches ON
   - Verify: badge changes to "Active"
   - **Screenshot checkpoint**

3. **Click** the toggle again to disable
   - Expected: toggle switches OFF
   - Verify: badge returns to "Inactive"

### TC-NEC-3: Enabled state shows event types and webhook info

1. **Enable** the Webhook Channel toggle (if not already on)

2. **Verify** expanded content appears below the toggle
   - Expected: info box showing the event types that will be delivered:
     `agent_completed`, `agent_errored`, `budget_threshold` as inline code tags
   - Expected: "Manage webhooks in Integrations" link with ArrowRight icon
   - **Screenshot checkpoint**

3. **Click** "Manage webhooks in Integrations"
   - Expected: settings sidebar switches to the "Integrations" section
   - Verify: "Outbound Webhooks" content is visible (Integrations section loads)
   - **Screenshot checkpoint**

4. **Navigate** back to Notifications section
   - Click "Notifications" in the sidebar
   - Verify: Webhook Channel toggle still shows "Active" (state persists within session)

---

### TC-FINAL: Final screenshots

1. **Take final screenshot** of Automations page showing schedules section
2. **Take final screenshot** of Work Items page
3. **Take final screenshot** of Settings > Notifications > Notification Channels

## Expected Results

- **Scheduling**: Schedule CRUD works end-to-end — create, edit, delete, toggle, run-now all functional. Schedule cards display human-readable cron, next run time, agent info, and last run status.
- **Templates**: Add button opens template picker with 5 templates. Each template pre-fills the correct title prefix, description body, priority, and labels. Created items appear in the work items list.
- **Notification Channels**: Webhook Channel subsection appears in Notifications settings. Toggle enables/disables with badge update. Enabled state reveals event types and link to Integrations.

### Visual Quality

- Schedule cards: consistent card layout, emerald/muted toggle colors, proper icon sizing
- Schedule dialog: form fields aligned, dropdowns functional, custom cron input appears/hides correctly
- Template picker dialog: grid layout (2-3 columns), icons centered in muted circles, hover states visible
- Notification Channels: Webhook icon properly sized, toggle aligned with badge, expanded content indented
- All sections: proper spacing, no overlapping elements, text readable in both light and dark mode

## Failure Criteria

- Schedules section not visible on Automations page -> FAIL
- Schedule dialog does not open or save -> FAIL
- Edit dialog does not pre-fill existing schedule values -> FAIL
- Delete does not remove the schedule from the list -> FAIL
- Run Now does not trigger (no toast, no spinner) -> FAIL
- Active/Paused toggle does not change visual state -> FAIL
- Schedule card missing cron text or next run time -> FAIL
- Add button on Work Items does not open template picker -> FAIL
- Template picker missing any of the 5 templates -> FAIL
- Template selection does not pre-fill title/description/priority/labels -> FAIL
- Created work item does not appear in the list -> FAIL
- Notification Channels subsection missing from Settings > Notifications -> FAIL
- Webhook toggle does not change badge between Active/Inactive -> FAIL
- Enabled webhook channel does not show event types or Integrations link -> FAIL
- "Manage webhooks" link does not navigate to Integrations section -> FAIL

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- Schedule cards: overlapping text, broken badge colors, missing icons
- Template picker: grid misaligned, icons clipped, hover state broken
- Notification Channels: toggle misaligned, expanded content overflows, badge unreadable
- Dialog content clipped or extending beyond viewport
- Inconsistent spacing between sections
