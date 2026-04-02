# E2E Test Results: Global Agents Phase 1

**Date:** 2026-04-02 02:15 PDT
**Test Plan:** `tests/e2e/plans/global-agents-phase1.md`
**Build:** commit ef95d53 (main)

## Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-GA-1: Selector persistence | PASS | "All Projects" persists across Dashboard → Agents → Activity → Dashboard |
| TC-GA-2: Dashboard aggregated view | PASS | "All Projects Global" heading, aggregated stats, Projects Overview table |
| TC-GA-3: Work Items disabled | PASS | Link disabled with `aria-disabled`, click prevented |
| TC-GA-4: Agent Monitor scope badges | PASS | Scope filter dropdown ("All") + "New Run" button on Live tab |
| TC-GA-5: "New Run" modal | PASS | Dialog with Persona, Scope, Prompt, Budget fields; Start Run disabled until valid |
| TC-GA-6: Pico scope toggle | PASS | "Follows sidebar" scope + "Pico" persona dropdowns in chat panel |
| TC-GA-7: Standalone execution endpoint | PASS | POST returns 201, execution has status=pending, workItemId=null; 404/400 validation works |

## Result: 7/7 PASS — no bugs filed

## Screenshots

- `TC-GA-1_persistence.png` — Dashboard with "All Projects" after navigating through 3 pages
- `TC-GA-5_new-run-modal.png` — New Run dialog with all form fields
- `TC-GA-6_pico-scope.png` — Pico chat panel showing scope and persona dropdowns

## API Test Evidence (TC-GA-7)

```
POST /api/executions/run {personaId: "ps-pico", prompt: "Test execution"} → 201 {id: "ex-gSkQEjv"}
GET /api/executions/ex-gSkQEjv → {status: "pending", workItemId: null, summary: "Test execution"}
POST with nonexistent persona → 404 "Persona nonexistent not found"
POST without prompt → 400 "personaId and prompt are required"
```
