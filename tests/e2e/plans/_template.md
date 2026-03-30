# Test Plan: [Name]

## Objective

What this test verifies in one sentence.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data
- chrome-devtools MCP connected
- [Any additional state needed before starting]

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/[path]`
   - Verify: page loads without errors
   - **Screenshot checkpoint:** Take screenshot, examine for layout issues on initial load

2. **Verify** [element] is visible
   - Look for: text "[visible text]" or element with aria-label "[label]"
   - Expected: [what it should look like]
   - **Screenshot checkpoint:** Take screenshot, check element alignment, sizing, and readability

3. **Click** [element description]
   - Target: button with text "[text]" / link with text "[text]" / element matching "[selector]"
   - Expected: [what should happen after the click]
   - **Screenshot checkpoint:** Take screenshot, verify transition/animation completed cleanly

4. **Type** "[text]" into [input description]
   - Target: input with placeholder "[placeholder]" or label "[label]"
   - Expected: [what should happen]

5. **Verify** [expected state after actions]
   - Check: [specific assertion — text content, element presence, count, navigation]
   - Expected: [exact expected value or condition]
   - **Screenshot checkpoint:** Take screenshot, examine final state visually

6. **Take final screenshot** for evidence (full page)

## Expected Results

- [Bullet list of what a passing test looks like]
- [Each point should be independently verifiable]

### Visual Quality

- No layout issues: elements properly aligned, no overlapping or clipping
- Text is readable: correct contrast, no invisible text, no truncation of important content
- Elements properly sized: badges, buttons, inputs have consistent sizing
- Spacing is consistent: margins and padding follow a coherent pattern
- Colors are correct: state colors, priority colors, badges match their semantic meaning
- Responsive: no horizontal scrolling, content fits within viewport width
- Dark mode (if tested): all text visible, no broken colors, sufficient contrast

## Failure Criteria

- [What constitutes a functional test failure]
- [Examples: element not found, wrong text, navigation fails, error displayed, NaN/undefined values]
- [Include timing: "element does not appear within 5 seconds"]

### Visual Failure Criteria

- Any visual defect counts as a visual failure even if the functional test passes
- Elements overlap or clip outside their containers
- Text is invisible or unreadable (wrong color, too small, clipped)
- Layout breaks: elements stacked incorrectly, misaligned columns, broken grid
- Inconsistent spacing: some elements cramped while others have excessive gaps
- Broken colors: wrong state colors, badges with no background, missing hover states
- Content truncation: important text cut off without ellipsis or scroll
