# Test Plan: Sandbox Settings UI

## Objective

Verify that the sandbox configuration section renders correctly in Settings → Security, allowed domains and deny paths lists are editable, and the enable toggle works.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with at least one project
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Security Section Visibility (3 steps)

1. **Navigate** to `http://localhost:5173/settings`
   - Verify: Settings page loads with sidebar navigation
   - **Screenshot checkpoint:** Take screenshot

2. **Click "Security"** in the sidebar
   - Look for: Shield icon + "Security" label in settings sidebar
   - Expected: Security section loads with "Agent Sandbox" header, description, and enable checkbox
   - **Screenshot checkpoint:** Take screenshot

3. **Verify default state**
   - Expected: "Enable OS-level sandboxing" checkbox is checked (default: enabled)
   - Allowed domains list shows 4 defaults: api.anthropic.com, registry.npmjs.org, github.com, raw.githubusercontent.com
   - Denied write paths list shows 4 defaults: /, /etc, /usr, /var
   - Project path note visible at bottom
   - **Screenshot checkpoint:** Take screenshot

### Part 2: Editable Domain List (4 steps)

4. **Add a new domain** — type "api.example.com" in the domain input and click "Add"
   - Expected: new badge "api.example.com" appears in the list
   - **Screenshot checkpoint:** Take screenshot

5. **Add via Enter key** — type "cdn.example.com" and press Enter
   - Expected: badge added without clicking button

6. **Remove a domain** — click the X button on "api.example.com" badge
   - Expected: badge disappears from list

7. **Verify duplicate prevention** — type "github.com" (already in list) and click Add
   - Expected: no duplicate badge added

### Part 3: Editable Deny Paths List (3 steps)

8. **Add a deny path** — type "/home/user/.ssh" and click "Add"
   - Expected: new badge with monospace font appears
   - **Screenshot checkpoint:** Take screenshot

9. **Remove a deny path** — click the X button on the new path
   - Expected: badge disappears

10. **Verify monospace font** on deny path badges
    - Expected: path text uses `font-mono` styling

### Part 4: Enable Toggle (2 steps)

11. **Uncheck "Enable OS-level sandboxing"**
    - Expected: checkbox unchecked
    - Note: domain/path lists should still be visible (configuration preserved even if sandbox disabled)

12. **Re-check "Enable OS-level sandboxing"**
    - Expected: checkbox checked again

### Part 5: Save and Persist (2 steps)

13. **Click "Save Security Settings"** after making changes
    - Expected: save succeeds (button may show loading state)
    - **Screenshot checkpoint:** Take screenshot

14. **Reload the page** and navigate back to Security
    - Expected: saved values persist — any added/removed domains/paths should reflect saved state
    - **Screenshot checkpoint:** Take screenshot

### Part 6: Visual Quality (2 steps)

15. **Take full-page screenshot** of the Security section
    - Verify: consistent layout with other settings sections, proper spacing
    - Check: badges properly sized, input/button aligned, Shield icon visible

16. **Verify dark mode** appearance
    - Check: badges readable, X buttons visible, input fields styled
    - Expected: all elements have dark mode support

## Expected Results

- Security section accessible via sidebar with Shield icon
- Enable checkbox controls sandbox state
- Allowed domains: 4 defaults, add/remove works, Enter key support, no duplicates
- Denied write paths: 4 defaults, add/remove works, monospace font
- Project path always shown as allowed write path
- Save persists changes across page reload

### Visual Quality

- Badges: consistent size, X button visible on hover
- Input + Add button aligned horizontally
- Labels use standard `text-xs text-muted-foreground uppercase` pattern
- Shield icon and description properly spaced
- Dark mode: all elements readable

## Failure Criteria

- Security section not accessible or not rendering
- Add/remove doesn't work on domain or path lists
- Duplicates allowed in lists
- Save doesn't persist changes
- Enable toggle has no effect

### Visual Failure Criteria

- Badges overflow container
- X button invisible or too small
- Input misaligned with Add button
- Monospace font not applied to deny paths
