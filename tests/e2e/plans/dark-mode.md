# Test Plan: Dark Mode / Theme Switching

## Objective

Verify the theme toggle cycles through System, Light, and Dark modes correctly, applies the appropriate CSS class to the document root, and produces no broken colors or invisible text on any page.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with test data
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues (misalignment, clipping, bad spacing, broken layout, invisible text, wrong colors, overlapping elements, truncated content) in the results alongside the functional pass/fail. A step can functionally pass but have visual defects — record both.

1. **Navigate** to `http://localhost:5173/`
   - Verify: the Dashboard page loads without errors

2. **Locate** the theme toggle button at the bottom of the sidebar
   - Look for: a small icon button next to the collapse/expand button at the sidebar footer
   - Expected: the button shows one of three icons — a monitor (System), sun (Light), or moon (Dark)

3. **Hover** over the theme toggle button
   - Expected: a tooltip appears showing the current theme, e.g., "Theme: System", "Theme: Light", or "Theme: Dark"

4. **Click** the theme toggle to switch to Light mode
   - Target: the theme toggle button (click until the tooltip shows "Theme: Light" — icon becomes a sun)
   - Expected: the page background becomes light/white, text is dark, sidebar has light card background

5. **Verify** Light mode on the Dashboard
   - Look for: light background colors, dark readable text on all stat cards, cost chart, agent strip, activity widget
   - Expected: no invisible text, no elements blending into the background, all borders/dividers visible
   - **Screenshot checkpoint:** Take screenshot. Examine: light background applied globally, stat card text dark and readable, chart colors visible, sidebar light-themed, all borders and dividers visible, no elements invisible against light background.

6. **Click** the theme toggle to switch to Dark mode
   - Target: the theme toggle button (icon should change to a moon)
   - Expected: tooltip shows "Theme: Dark", the page background becomes dark/near-black, text becomes light/white

7. **Verify** Dark mode on the Dashboard
   - Look for: dark background (bg-background in dark mode), light text on all stat cards, chart is visible, activity widget is readable
   - Expected: no invisible text, no white-on-white or black-on-black elements, all UI elements have adequate contrast
   - **Screenshot checkpoint:** Take screenshot. Examine: dark background applied globally, text light and readable, stat cards have dark card backgrounds with visible borders, chart colors contrast against dark background, sidebar dark-themed, no invisible elements.

8. **Navigate** to Work Items (`/items`) in Dark mode
   - Verify: work item rows have readable text, state badges have visible colored backgrounds, priority badges are legible, the filter bar inputs have appropriate dark styling

9. **Navigate** to Agent Monitor (`/agents`) in Dark mode
   - Verify: tabs (Live/History) are visible, empty state text is readable, background and borders use dark tokens

10. **Navigate** to Activity Feed (`/activity`) in Dark mode
    - Verify: event rows have readable descriptions, colored icon circles are visible against dark background, date group headers are legible, filter bar controls have dark styling

11. **Navigate** to Personas (`/personas`) in Dark mode
    - Verify: persona cards have dark card backgrounds, avatar circles are visible, "Built-in" badge text is readable, model badges (Opus/Sonnet/Haiku) retain their colored backgrounds, "Create new persona" dashed card border is visible
    - **Screenshot checkpoint:** Take screenshot. Examine: persona cards dark-themed, avatar colors visible against dark cards, badge text readable, dashed border visible, model badge colors distinct against dark background.

12. **Navigate** to Settings (`/settings`) in Dark mode
    - Verify: settings sidebar sections are readable, form inputs have dark backgrounds with light text, separators/dividers are visible

13. **Click** the theme toggle to switch to System mode
    - Target: the theme toggle button (icon should change to a monitor)
    - Expected: tooltip shows "Theme: System", theme follows the OS preference (dark if system is dark, light if system is light)

14. **Navigate** to Settings → Appearance
    - Target: click "Appearance" in the settings sidebar
    - Expected: the Theme section shows three card options: "Light", "Dark", "System"

15. **Verify** the current theme is highlighted in Settings
    - Look for: the card matching the current theme (System) has a highlighted/selected border
    - Expected: the "System" card is visually selected

16. **Click** "Dark" in the Settings Theme section
    - Target: the "Dark" theme card
    - Expected: the page immediately switches to dark mode, the "Dark" card becomes selected

17. **Click** "Light" in the Settings Theme section
    - Target: the "Light" theme card
    - Expected: the page immediately switches to light mode, the "Light" card becomes selected
    - **Screenshot checkpoint:** Take screenshot. Examine: theme switched from dark to light cleanly, no flash of wrong colors, all settings elements visible in light mode, active card border on "Light" card.

18. **Verify** the sidebar theme toggle reflects the Settings change
    - Look for: the sidebar theme button now shows a sun icon
    - Expected: the sidebar toggle and settings selection are in sync — both show Light

19. **Take screenshot** of the app in Light and Dark modes for evidence

## Expected Results

- The theme toggle button in the sidebar cycles through System → Light → Dark
- Each theme displays the correct icon (monitor/sun/moon) and tooltip text
- Light mode: light backgrounds, dark text, all elements readable
- Dark mode: dark backgrounds, light text, all elements readable with adequate contrast
- No invisible text, broken colors, or elements blending into backgrounds on any page
- Settings → Appearance Theme section reflects and controls the same theme state
- Theme persists across page navigation within the session

### Visual Quality

- Theme toggle: icon clearly represents current mode (sun/moon/monitor), positioned consistently in sidebar footer, tooltip readable
- Light mode: white/light backgrounds, dark text, all borders visible, badges retain semantic colors, charts readable
- Dark mode: dark backgrounds, light text, adequate contrast on all elements, card borders visible, no white-backgrounded elements
- Cross-page consistency: theme applies uniformly across all pages — sidebar, content area, modals, dropdowns all match
- Color transitions: theme switch is instant or smooth, no flash of wrong colors, no partial theme state
- Badge colors: state badges, priority badges, model badges retain distinct colors in both themes
- Settings sync: theme selection in Settings matches sidebar toggle state, changes propagate bidirectionally

## Failure Criteria

- The theme toggle does not cycle through all three modes
- Switching themes causes a flash of incorrect colors or layout shift
- Any page has invisible text (same color as background) in Light or Dark mode
- Badge colors (state, priority, model) are unreadable in Dark mode
- Form inputs or cards are invisible or have no border in Dark mode
- The Settings Theme section does not reflect the current theme
- Changing theme in Settings does not update the sidebar toggle icon
- Any action causes a JavaScript error or blank screen

### Visual Failure Criteria

- Text invisible against background in either theme (same-color text and background)
- Card or input elements with white background in dark mode
- Borders or dividers invisible in dark mode (no visible separation between sections)
- Badge colors unreadable — text blends into badge background in one theme
- Theme switch causes flash of incorrect colors before settling
- Sidebar in one theme while content area is in another (partial update)
- Chart or graph elements invisible or unreadable in dark mode
