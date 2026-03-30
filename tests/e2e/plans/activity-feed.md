# Test Plan: Activity Feed

## Objective

Verify the Activity Feed page renders events with icons, timestamps, and descriptions, groups events by date, supports filtering by event type/persona/date range, and allows clearing filters.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data (executions, proposals, and comments to generate activity events)

## Steps

1. **Navigate** to `http://localhost:5173/activity`
   - Verify: the Activity Feed page loads without errors

2. **Verify** activity events are rendered
   - Look for: a list of event rows, each containing a colored icon circle, description text, and metadata
   - Expected: at least 3 events are visible (seeded data should produce multiple events from executions, comments, and proposals)

3. **Verify** each event row has the correct structure
   - Look for: in each event row:
     - A colored circular icon on the left (e.g., blue for State Change, green for Agent Completed, red for Agent Failed, violet for Comment, amber for Proposal Created)
     - A description text (e.g., "Agent completed work item", "Agent started working on work item")
     - A timestamp (e.g., "Mar 15, 02:30 PM") — not "Invalid Date" or blank
     - An event type badge (e.g., "State Change", "Agent Started", "Agent Completed", "Comment", "Proposal Created")
     - A target label (e.g., "work item")
   - Expected: no event row is missing its icon, description, or timestamp

4. **Verify** date grouping headers
   - Look for: sticky date headers above groups of events (e.g., "Today", "Yesterday", or a full date like "Monday, March 15")
   - Expected: events are grouped chronologically with the most recent group at the top
   - Each group header appears as uppercase, small, bold text

5. **Verify** the filter bar is present
   - Look for: a bordered card containing filter controls
   - Expected: a filter icon, a "Types" button, a persona dropdown showing "All personas", a date dropdown showing "All time"

6. **Click** the "Types" button to expand event type filters
   - Target: the "Types" button in the filter bar
   - Expected: a grid of checkboxes appears below, showing all event types: "State Change", "Agent Started", "Agent Completed", "Agent Failed", "Comment", "Proposal Created", "Approved", "Rejected", "Router Decision", "Manual Override", "Cost Alert"
   - Each checkbox should be checked by default (all types selected)
   - "Select all" and "Deselect all" links should be visible

7. **Uncheck** a specific event type to filter
   - Target: uncheck the "Agent Started" checkbox
   - Expected: events of type "Agent Started" disappear from the list
   - The "Types" button should show a count badge indicating fewer than all types are selected

8. **Click** "Select all" to restore all event types
   - Expected: all checkboxes become checked and all events return to the list

9. **Filter** by persona
   - Target: the persona dropdown showing "All personas"
   - Click it and select a specific persona name
   - Expected: the list filters to show only events associated with that persona

10. **Filter** by date range
    - Target: the date dropdown showing "All time"
    - Click it and select "Today"
    - Expected: the list filters to show only events from today
    - If no events are from today, the message "No events match the current filters." should appear

11. **Verify** the "Clear" button appears when filters are active
    - Look for: a "Clear" button with an X icon in the filter bar
    - Expected: the button is visible when any filter is not at its default value

12. **Click** "Clear" to reset all filters
    - Target: the "Clear" button
    - Expected: the persona resets to "All personas", the date resets to "All time", all event type checkboxes are re-checked, and all events return to the list
    - The "Clear" button disappears

13. **Verify** the empty state when no events exist
    - Note: this may not be testable if seeded data always produces events
    - If testable: the page should show "No activity yet" with subtext "Activity events will appear here as agents work on this project."

14. **Take screenshot** of the activity feed with events and filter bar for evidence

## Expected Results

- Activity events render as rows with colored icons, descriptions, timestamps, type badges, and target labels
- Events are grouped by date with sticky headers ("Today", "Yesterday", or full date)
- The filter bar has a "Types" button (expands to checkboxes for 11 event types), persona dropdown, and date range dropdown
- Unchecking an event type removes those events from the list
- Filtering by persona narrows to events from that persona
- Filtering by date range narrows to events within the time window
- The "Clear" button resets all filters and restores the full event list
- The "Clear" button is hidden when no filters are active

## Failure Criteria

- The Activity Feed page does not load or shows a white screen
- No events are rendered when seeded data should produce them
- Event rows are missing icons, descriptions, or timestamps
- Timestamps show "Invalid Date" or are blank
- No date grouping headers are visible
- The filter bar is missing
- Unchecking an event type does not remove matching events
- The "Clear" button does not reset filters
- Filtering causes a JavaScript error
- The empty filter state "No events match the current filters." is not shown when all events are filtered out
