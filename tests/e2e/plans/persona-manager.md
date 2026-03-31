# Test Plan: Persona Manager

## Objective

Verify the Persona Manager page renders persona cards for built-in personas, opens an editor on click, displays all editable fields, and persists changes after saving.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data (5 built-in personas: Product Manager, Tech Lead, Engineer, Code Reviewer, Router)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/personas`
   - Verify: the Persona Manager page loads without errors
   - **Screenshot checkpoint:** Take screenshot. Examine: page layout, sidebar active state for Persona Manager, persona card grid structure, overall spacing.

2. **Verify** persona cards render in a grid
   - Look for: a grid of persona cards, each showing a colored circular avatar icon, a name, a model badge, a description, and a tool count badge
   - Expected: at least 5 persona cards are visible (the 5 built-in personas)
   - **Screenshot checkpoint:** Take screenshot. Examine: card grid alignment, consistent card sizes, avatar circles properly colored and sized, name text readable, model badges colored correctly, tool count badges positioned consistently, "Built-in" badges visible.

3. **Verify** built-in personas are labeled
   - Look for: cards with a "Built-in" badge next to the persona name
   - Expected: the 5 seeded personas (Product Manager, Tech Lead, Engineer, Code Reviewer, Router) each show the "Built-in" badge

4. **Verify** model badges show correct values
   - Look for: a colored badge on each card showing "Opus" (purple), "Sonnet" (blue), or "Haiku" (green)
   - Expected: each card has one model badge — not blank or missing

5. **Verify** tool count badges are present
   - Look for: a badge at the bottom of each card showing the number of tools (e.g., "3 tools", "5 tools")
   - Expected: each card shows a numeric tool count

6. **Verify** the "Create new persona" card exists
   - Look for: a dashed-border card with a plus (+) icon and text "Create new persona" at the end of the grid
   - Expected: the card is clickable

7. **Click** a persona card to open the editor
   - Target: hover over any persona card (e.g., "Engineer") and click the pencil (Edit) icon that appears
   - Expected: a side panel (sheet) slides in from the right showing "Edit persona configuration"
   - **Screenshot checkpoint:** Take screenshot. Examine: editor panel slides in cleanly, panel width appropriate, header with persona name visible, sections laid out vertically with consistent spacing, no overlap with card grid behind.

8. **Verify** the editor shows the Name field
   - Look for: a section labeled "Identity" with a "Name" input field
   - Expected: the input is pre-filled with the persona's current name (e.g., "Engineer")

9. **Verify** the editor shows the Description field
   - Look for: a "Description" textarea below the name
   - Expected: the textarea is pre-filled with the persona's current description

10. **Verify** the editor shows the Avatar picker
    - Look for: a section with "Avatar" label showing color swatches and an icon grid
    - Expected: the current color is highlighted (ring), the current icon is highlighted

11. **Verify** the editor shows the Model selector
    - Look for: a section labeled "Model" with three card buttons: "Opus" (with "$$$"), "Sonnet" (with "$$"), "Haiku" (with "$")
    - Expected: the current model is highlighted with a colored border
    - **Screenshot checkpoint:** Take screenshot. Examine: model cards evenly sized, active model border clearly visible, cost indicators readable, color coding correct (purple/blue/green), section label aligned.

12. **Verify** the editor shows the System Prompt section
    - Look for: a section labeled "System Prompt" with a text editor
    - Expected: the editor is visible (may contain existing prompt text or be empty)

13. **Verify** the editor shows the Tools section
    - Look for: a section labeled "Tools" with tool configuration controls
    - Expected: the section is present and shows allowed tools

14. **Verify** the editor shows the Budget section
    - Look for: a section labeled "Budget" with a "Max cost per run (USD)" input
    - Expected: the input shows a dollar amount (e.g., "1.00")

15. **Edit** the persona name
    - Clear the "Name" input and type "Test Engineer Persona"
    - Expected: the input updates and the sheet header title also updates to show "Test Engineer Persona"

16. **Click** the "Save" button
    - Target: the "Save" button in the sheet header
    - Expected: the sheet closes and the persona card in the grid now shows "Test Engineer Persona" as the name
    - **Screenshot checkpoint:** Take screenshot. Examine: editor panel closed, card grid visible with updated persona name, no stale data displayed, grid layout intact after panel close.

17. **Verify** the change persisted
    - Click the pencil (Edit) icon on the "Test Engineer Persona" card to reopen the editor
    - Expected: the Name field shows "Test Engineer Persona" (not reverted to the old name)

18. **Revert** the name back (cleanup)
    - Clear the name and type back the original name (e.g., "Engineer")
    - Click "Save"
    - Expected: the card reverts to its original name

19. **Take screenshot** of the persona grid for evidence

## Expected Results

- The Persona Manager page shows a grid of persona cards
- At least 5 built-in personas are visible with "Built-in" badges
- Each card shows avatar, name, model badge (Opus/Sonnet/Haiku), description, and tool count
- The "Create new persona" card is present at the end
- Clicking the edit icon opens a side panel editor
- The editor shows Identity (Name, Description, Avatar), Model, System Prompt, Tools, and Budget sections
- Editing the name and saving updates the card in the grid
- Reopening the editor confirms the change persisted

### Visual Quality

- Card grid: cards evenly sized and spaced, consistent padding within cards, grid wraps cleanly on viewport
- Avatar circles: consistent size, colored backgrounds, letter/icon centered within circle
- Badges: model badges correct colors (purple/blue/green), "Built-in" badges readable, tool count badges positioned consistently at card bottom
- "Create new persona" card: dashed border visible, plus icon centered, card same height as other cards
- Editor panel: slides in from right at appropriate width, sections vertically stacked with clear labels, consistent field spacing
- Editor fields: inputs aligned, avatar color swatches evenly spaced, icon grid uniform, model cards same size
- System prompt editor: properly sized textarea, readable monospaced text, sufficient height
- Save/cancel: buttons properly positioned in header, clickable area sufficient
- Overall: no horizontal overflow, card grid responsive, editor panel doesn't clip content

## Failure Criteria

- The Persona Manager page does not load or shows a white screen
- Fewer than 5 persona cards are visible when seeded data exists
- Cards are missing name, model badge, or tool count
- Clicking the edit icon does not open the editor panel
- The editor is missing any of: Name, Description, Model, System Prompt, Tools, or Budget sections
- Saving changes does not update the card in the grid
- Reopening the editor shows the old (unsaved) value
- Any action causes a JavaScript error or API error

### Visual Failure Criteria

- Card grid cards different sizes or uneven spacing between cards
- Avatar circles inconsistent sizes or missing colored background
- Model badges wrong colors or text invisible against badge background
- "Create new persona" card different height than persona cards or dashed border missing
- Editor panel overlaps card grid or clips at viewport edge
- Editor field sections misaligned or labels not aligned with inputs
- Avatar color swatches different sizes or icon grid items overlapping
- System prompt textarea too small or text clipped
- Save button invisible or positioned outside visible area
