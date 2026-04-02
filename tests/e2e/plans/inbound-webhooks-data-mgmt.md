# Test Plan: Inbound Webhooks + Data Management Phase 1

## Objective

Verify inbound webhook trigger CRUD, prompt template resolution, HMAC-validated delivery, and Data Management features: backup/restore, log truncation, and storage stats.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- API mode set to "api"
- chrome-devtools MCP connected
- At least one persona exists (for trigger creation)

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Inbound Trigger CRUD via API

1. **Create** a webhook trigger
   - Call `POST /api/webhook-triggers` with `{ "name": "CI Deploy", "personaId": "<valid-persona-id>", "promptTemplate": "Deploy completed: {{payload.repo}} branch {{payload.branch}}" }`
   - Expected: 201 with `{ data: { id, name, secret, personaId, triggerUrl, isActive: true } }`
   - Verify: `id` starts with `wht-`, `secret` starts with `whtsec_`, `triggerUrl` present

2. **List** triggers
   - Call `GET /api/webhook-triggers`
   - Expected: `{ data: [...], total: 1 }` with persona name joined

3. **Update** the trigger
   - Call `PATCH /api/webhook-triggers/:id` with `{ "promptTemplate": "Updated: {{payload.status}}" }`
   - Expected: 200 with updated template

4. **Delete** the trigger
   - Call `DELETE /api/webhook-triggers/:id`
   - Expected: 204 No Content

### Part 2: Inbound Trigger Receiver (Code Review)

5. **Verify** HMAC validation
   - Check `packages/backend/src/routes/webhook-triggers.ts`: `verifyHmac()` uses `timingSafeEqual`
   - Check: 401 on missing signature, 403 on invalid signature

6. **Verify** template resolution
   - Check `resolveTemplate()`: Handlebars `{{payload.field}}` with nested dot-path support
   - Check: undefined fields left as literal `{{payload.field}}`

7. **Verify** execution spawning
   - Check: receiver calls `executionManager.runExecution()` on valid trigger

### Part 3: Settings Inbound Triggers UI

8. **Navigate** to `http://localhost:5173/settings` → Integrations
   - Scroll to "Inbound Triggers" section
   - Verify: "Add Trigger" button visible
   - **Screenshot checkpoint**

9. **Click** "Add Trigger"
   - Expected: form with name input, persona ID input, prompt template textarea
   - **Screenshot checkpoint**

10. **Create** a trigger via UI
    - Fill name + persona ID, click Create
    - Expected: trigger appears in list, secret shown with copy button
    - **Screenshot checkpoint**

11. **Delete** a trigger via trash icon
    - Expected: trigger removed from list

### Part 4: Backup & Restore

12. **Create** a manual backup via API
    - Call `POST /api/settings/backup`
    - Expected: `{ data: { path, createdAt } }` — path in `~/.agentops/backups/`

13. **List** backups
    - Call `GET /api/settings/backups`
    - Expected: `{ data: [{ filename, path, sizeBytes, sizeMb, createdAt }], total: N }`

14. **Navigate** to Settings → Data
    - Verify: "Database Backups" section with backup list and "Create Backup" button
    - **Screenshot checkpoint**

15. **Click** "Create Backup" in UI
    - Expected: spinner → success toast → backup appears in list

### Part 5: Log Truncation

16. **Truncate** logs via API
    - Call `POST /api/settings/truncate-logs?olderThanDays=30`
    - Expected: `{ data: { truncated: N, olderThanDays: 30 } }`

17. **Verify** UI truncation controls
    - Navigate to Settings → Data
    - Look for: day selector dropdown + "Truncate Old Logs" button
    - **Screenshot checkpoint**

### Part 6: Storage Stats

18. **Get** storage stats via API
    - Call `GET /api/settings/storage-stats`
    - Expected: `{ data: { tables: [{ name, rowCount }], totalSizeBytes, totalSizeMb } }`
    - Verify: table names include core tables (projects, work_items, executions, personas)

19. **Verify** UI storage stats
    - Navigate to Settings → Data
    - Look for: "Storage" section with total size badge + per-table table
    - **Screenshot checkpoint**

20. **Take final screenshot** for evidence

## Expected Results

- Trigger CRUD: create (201 with secret + triggerUrl), list (persona join), update, delete (204)
- HMAC validation: timingSafeEqual, 401/403 on invalid
- Template resolution: nested dot-path, undefined fallback
- UI: trigger list with name/persona/template/status, add form with secret display
- Backup: create (WAL-safe), list with date/size, UI create button + list
- Log truncation: API returns truncated count, UI has day selector
- Storage stats: per-table row counts + total DB size

### Visual Quality

- Inbound triggers: separated from outbound section with divider
- Trigger list: name, persona, template preview, active badge
- Data section: backup list with mono filenames, storage table with mono font

## Failure Criteria

- Trigger CRUD returns wrong status codes
- HMAC not using timingSafeEqual (timing attack vulnerability)
- Template resolver fails on nested paths
- Backup API returns error
- Truncation doesn't clear logs
- Storage stats missing tables

### Visual Failure Criteria

- Inbound section overlaps outbound section
- Backup list overflow
- Storage table misaligned
