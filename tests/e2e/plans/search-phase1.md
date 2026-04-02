# Test Plan: Search Phase 1

## Objective

Verify the FTS5-backed search system: Command Palette server-backed search, work items filter bar search, result ranking, type filtering, and empty results handling.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- Database seeded with at least one project, work items with titles/descriptions, personas, and comments
- FTS5 tables populated (backend startup runs backfill automatically)
- chrome-devtools MCP connected

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Command Palette Server-Backed Search

1. **Open Command Palette** using Cmd+K (or Ctrl+K)
   - Verify: dialog opens with search input, "Type to search..." placeholder
   - **Screenshot checkpoint**

2. **Type** a single character (e.g., "a")
   - Expected: only static navigation/action items shown (search requires 2+ chars)
   - No loading spinner should appear
   - **Screenshot checkpoint**

3. **Type** a search query matching a work item title (e.g., "game board" or "implement")
   - Expected: after ~300ms debounce, server results appear grouped by type
   - Look for: "Work Items" group header with matching items
   - Check: snippet text shown below each result title (with `<b>` HTML highlight)
   - Check: loading spinner visible briefly during search
   - **Screenshot checkpoint**

4. **Type** a query matching a persona name (e.g., "Engineer" or "Router")
   - Expected: "Personas" group header with matching persona(s)
   - Check: User icon for persona results
   - **Screenshot checkpoint**

5. **Select** a work item result using Enter or click
   - Expected: command palette closes, navigates to /items, work item selected in detail panel
   - **Screenshot checkpoint**

6. **Reopen** Cmd+K, type a query with no matches (e.g., "zzzznonexistent")
   - Expected: "No results found." message after debounce
   - **Screenshot checkpoint**

### Part 2: Work Items Filter Bar Search

7. **Navigate** to `http://localhost:5173/items`
   - Verify: list view with search input in filter bar
   - **Screenshot checkpoint**

8. **Type** a search query in the filter bar search input (e.g., "game")
   - Expected: after debounce, list filters to show only matching items
   - Check: items not matching the query are hidden
   - **Screenshot checkpoint**

9. **Verify** FTS server search is used (2+ chars)
   - Type 2+ characters and wait for debounce
   - Expected: list shows items matching via FTS5 (title OR description match)
   - Items matching only in description (not title) should also appear

10. **Clear** the search input (click X or delete text)
    - Expected: all work items reappear
    - **Screenshot checkpoint**

11. **Type** a query with no matches in the filter bar
    - Expected: empty list with "No items match" or similar empty state
    - **Screenshot checkpoint**

### Part 3: Search API Verification

12. **Verify** search API returns correct results
    - Call `GET /api/search?q=game` via curl or browser
    - Expected: JSON response with `{ data: [...], total: N }` where results have type, id, title, snippet, score, projectId
    - Check: results sorted by BM25 score

13. **Verify** type filtering
    - Call `GET /api/search?q=game&type=work_item`
    - Expected: only work_item results returned
    - Call `GET /api/search?q=Engineer&type=persona`
    - Expected: only persona results returned

14. **Verify** projectId filtering
    - Call `GET /api/search?q=game&projectId=<project-id>`
    - Expected: only results from that project returned

15. **Verify** empty query returns 400
    - Call `GET /api/search` (no q param) or `GET /api/search?q=`
    - Expected: 400 error with "Query parameter 'q' is required"

16. **Take final screenshot** for evidence

## Expected Results

- Command Palette shows server-backed results after 300ms debounce for 2+ char queries
- Results grouped by type (Work Items, Personas, Comments, Chat Messages)
- Snippets with HTML bold highlights rendered in results
- Work items filter bar filters list using FTS5 server search
- Clearing search restores full list
- API returns BM25-ranked results with snippets
- Type and projectId filters work correctly
- Empty query returns 400 error
- No results shows appropriate empty state

### Visual Quality

- Command Palette: results properly aligned, type group headers visible
- Snippet text readable, bold highlights visible
- Loading spinner appears during search
- Keyboard navigation (up/down/enter) works in results
- Filter bar search input: X clear button visible when text present

## Failure Criteria

- Command Palette doesn't show server results (falls back to client-only)
- No loading spinner during search
- Results not grouped by type
- Snippets missing or show raw HTML tags
- Filter bar search doesn't filter the list
- FTS5 not matching on description (title-only)
- API returns 500 on valid queries
- No 400 on empty query

### Visual Failure Criteria

- Results overlap or clip in command palette
- Group headers missing or misaligned
- Snippet text invisible or unreadable
- Loading spinner persists after results load
