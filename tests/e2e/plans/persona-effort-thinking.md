# Test Plan: Persona Effort & Thinking Settings

## Objective

Verify that the effort level and thinking mode dropdowns render correctly in the persona editor, values save and persist, and descriptions display properly.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with at least one non-system persona (or the built-in PM/TL/Engineer/Reviewer)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Read-Only Display (3 steps)

1. **Navigate** to `http://localhost:5173/personas`
   - Verify: Persona manager page loads with persona cards
   - **Screenshot checkpoint:** Take screenshot

2. **Click a persona card** that has effort/thinking settings (e.g., Engineer with max/enabled)
   - Verify: Detail panel opens in read-only mode
   - Look for: "Effort & Thinking" section with badges showing current values
   - Expected: badges like "max effort" and "enabled thinking" (capitalized)
   - **Screenshot checkpoint:** Take screenshot (SKIP if persona has no effort/thinking in settings)

3. **Verify badges are absent** for personas without explicit effort/thinking settings
   - Click a persona that has empty settings (`{}`)
   - Expected: no "Effort & Thinking" section visible — conditional rendering
   - **Screenshot checkpoint:** Take screenshot

### Part 2: Edit Mode — Dropdowns (5 steps)

4. **Click Edit button** on a persona
   - Verify: form switches to edit mode with all fields editable
   - **Screenshot checkpoint:** Take screenshot

5. **Scroll to "Effort & Thinking" section**
   - Look for: "Effort Level" label with a Select dropdown, "Thinking Mode" label with a Select dropdown
   - Expected: both dropdowns visible with current values selected
   - **Screenshot checkpoint:** Take screenshot

6. **Open the Effort Level dropdown**
   - Click the effort Select trigger
   - Expected: 4 options visible with descriptions:
     - "Low — Fast, minimal reasoning"
     - "Medium — Balanced"
     - "High — Thorough"
     - "Max — Maximum depth, highest cost"
   - **Screenshot checkpoint:** Take screenshot of open dropdown

7. **Select a different effort level** (e.g., change from "high" to "medium")
   - Click "Medium — Balanced"
   - Expected: dropdown closes, value updates to "Medium"

8. **Open the Thinking Mode dropdown**
   - Click the thinking Select trigger
   - Expected: 3 options visible with descriptions:
     - "Adaptive — Claude decides when to think deeply"
     - "Enabled — Always show reasoning chain"
     - "Disabled — No extended thinking"
   - **Screenshot checkpoint:** Take screenshot of open dropdown

### Part 3: Save and Persist (3 steps)

9. **Click Save** after changing effort/thinking values
   - Expected: save succeeds, form switches back to read-only mode
   - **Screenshot checkpoint:** Take screenshot of read-only mode after save

10. **Verify saved values** in read-only badges
    - Expected: badges reflect the new values (e.g., "medium effort" instead of previous value)
    - Confirms values persisted through save

11. **Reload the page** and reopen the same persona
    - Navigate away and back to `/personas`, click the same persona
    - Expected: effort/thinking values persist (not reset to defaults)
    - **Screenshot checkpoint:** Take screenshot

### Part 4: Visual Quality (2 steps)

12. **Take full-page screenshot** of persona editor with effort/thinking section visible
    - Verify: dropdowns are properly sized, labels aligned, section separated by Separator
    - Check: consistent styling with other form sections (Budget, Tools, etc.)

13. **Verify dark mode** appearance
    - Check: Select triggers readable, dropdown options visible, badges have proper contrast
    - Expected: all text readable, no invisible elements

## Expected Results

- Read-only mode shows effort/thinking as outline badges when persona has these settings
- Read-only mode hides the section when settings are empty
- Edit mode shows two Select dropdowns with descriptive options
- Effort dropdown has 4 options (low/medium/high/max) with descriptions
- Thinking dropdown has 3 options (adaptive/enabled/disabled) with descriptions
- Saving persists values through page reload
- Settings merge preserves system flags (isSystem, isRouter, etc.)

### Visual Quality

- Dropdowns match other form elements in height and styling (h-8, text-sm)
- Labels use consistent `text-xs text-muted-foreground` pattern
- Section separated by Separator components
- Badges in read-only mode use `capitalize` for clean display
- Dark mode: all elements visible with proper contrast

## Failure Criteria

- Dropdowns don't render or show wrong options
- Values don't save on form submit
- Values reset to defaults after page reload
- Saving effort/thinking overwrites system flags (isSystem, isRouter)
- Descriptions missing from dropdown options

### Visual Failure Criteria

- Dropdowns overflow or clip text
- Labels misaligned with dropdowns
- Badges invisible or wrong text
- Section not separated from adjacent form sections
