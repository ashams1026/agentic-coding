# Test Plan: Settings — Appearance

## Objective

Verify the Settings Appearance section supports toggling between light/dark/system theme and comfortable/compact density, and that each change is visually reflected in the UI.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/settings`
   - Verify: the Settings page loads

2. **Click** the "Appearance" section in the sidebar
   - Target: the "Appearance" nav item with a palette icon in the settings sidebar
   - Expected: the heading changes to "Appearance" and the appearance settings content appears

3. **Verify** the Data Source (API mode) section is present
   - Look for: a heading "Data Source" with description "Mock mode uses demo data. Live mode connects to the backend API at localhost:3001."
   - Expected: two card buttons labeled "Mock" and "Live" with colored dots (amber for Mock, green for Live)
   - One should be active (highlighted border)

4. **Verify** the Theme section is present
   - Look for: a heading "Theme" with description "Choose the color scheme for the interface."
   - Expected: three card buttons labeled "Light" (sun icon), "Dark" (moon icon), and "System" (monitor icon)
   - One should be active (highlighted border)
   - **Screenshot checkpoint:** Take screenshot. Examine: appearance section layout, Data Source and Theme card buttons evenly sized, active button border clearly visible, icons centered within cards, section headings and descriptions readable.

5. **Click** the "Dark" theme button
   - Target: the "Dark" card button with the moon icon
   - Expected: the "Dark" button becomes active (highlighted border)
   - The page background should change to a dark color scheme
   - Text should become light-colored on dark background
   - **Screenshot checkpoint:** Take screenshot. Examine: dark mode applied globally, background dark, text light and readable, sidebar colors updated, card borders visible against dark background, no invisible elements.

6. **Click** the "Light" theme button
   - Target: the "Light" card button with the sun icon
   - Expected: the "Light" button becomes active
   - The page background should change to a light/white color scheme
   - Text should become dark-colored on light background
   - **Screenshot checkpoint:** Take screenshot. Examine: light mode applied globally, background light, text dark and readable, all elements visible, card borders and active states clear.

7. **Click** the "System" theme button
   - Target: the "System" card button with the monitor icon
   - Expected: the "System" button becomes active
   - The theme follows the OS preference

8. **Verify** the Density section is present
   - Look for: a heading "Density" with description "Adjust spacing and sizing of UI elements."
   - Expected: two card buttons labeled "Comfortable" and "Compact"
   - Each shows mini preview bars (3 horizontal lines) — "Compact" bars are thinner than "Comfortable" bars
   - One should be active (highlighted border)

9. **Click** the "Compact" density button
   - Target: the "Compact" card button
   - Expected: the "Compact" button becomes active
   - UI elements should appear more tightly spaced (reduced padding/margins)
   - **Screenshot checkpoint:** Take screenshot. Examine: compact density applied, reduced spacing visible in card buttons and sections, no elements overlapping due to tighter spacing, text still readable.

10. **Click** the "Comfortable" density button
    - Target: the "Comfortable" card button
    - Expected: the "Comfortable" button becomes active
    - UI elements return to normal spacing

11. **Take screenshot** of the appearance settings for evidence

## Expected Results

- The Appearance section shows Data Source, Theme, and Density controls
- Data Source shows "Mock" and "Live" card buttons with colored dots
- Theme shows "Light", "Dark", and "System" card buttons with icons
- Clicking "Dark" switches the page to dark mode (dark background, light text)
- Clicking "Light" switches the page to light mode (light background, dark text)
- Density shows "Comfortable" and "Compact" card buttons with preview bars
- Clicking "Compact" tightens UI spacing
- Clicking "Comfortable" restores normal spacing
- Each active option shows highlighted border styling

### Visual Quality

- Card buttons: evenly sized within each section, icons centered, active border clearly distinguished from inactive, consistent padding
- Theme switching: background and text colors update globally without flash or partial update, sidebar and content area both reflect the theme
- Dark mode: all text readable against dark background, no invisible elements, card borders visible, icons not lost against background
- Light mode: all text readable, no washed-out elements, proper contrast maintained
- Density: compact mode visibly reduces spacing without overlapping or clipping elements, comfortable mode restores default spacing
- Section layout: Data Source, Theme, and Density sections evenly spaced with clear headings, descriptions readable
- Overall: no horizontal overflow, consistent spacing between all sections and cards

## Failure Criteria

- The Appearance section does not load
- Theme buttons are missing or do not switch the color scheme
- Clicking "Dark" does not change the page to dark mode
- Clicking "Light" does not change the page to light mode
- Density buttons are missing
- Clicking "Compact" does not change UI spacing
- The Data Source section is missing
- Any action causes a JavaScript error

### Visual Failure Criteria

- Card buttons different sizes within the same section or icons misaligned
- Active card border indistinguishable from inactive cards
- Dark mode leaves some text invisible or elements with white backgrounds
- Light mode leaves some elements invisible or with dark backgrounds
- Theme switch causes partial update (sidebar in one theme, content in another)
- Compact density causes elements to overlap or text to be clipped
- Density preview bars (mini lines) not visible or different sizes than expected
