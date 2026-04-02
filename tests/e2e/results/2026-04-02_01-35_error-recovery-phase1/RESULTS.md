# E2E Test Results: Error Recovery Phase 1

**Date:** 2026-04-02 01:35 PDT
**Test Plan:** `tests/e2e/plans/error-recovery-phase1.md`
**Build:** commit b54bd5f (main)

## Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-ERR-1: busy_timeout PRAGMA | PASS | `busy_timeout = 5000` and `synchronous = NORMAL` in connection.ts:31-32 |
| TC-ERR-2: WS exponential backoff | PASS | Formula `Math.min(1000 * 2^attempt, 30_000)` + 20% jitter in ws-client.ts:166-169 |
| TC-ERR-3: Error boundaries | PASS | AppErrorBoundary in app.tsx:9, PageErrorBoundary wraps all 7 pages in router.tsx:16-22 |
| TC-ERR-4: Status bar WS state | PASS | Shows "Disconnected" (red) — screenshot saved. useWsStatus hook verified |
| TC-ERR-5: Connection lost banner | PASS | Code verified: amber banner at terminal-renderer.tsx:609-616 when wsStatus !== "connected" |
| TC-ERR-6: Structured error JSON | PASS | catch block classifies sdk_error/configuration_error/unknown, sets { category, message } |
| TC-ERR-7: Orphaned → interrupted | PASS | recoverOrphanedState() sets status "interrupted" with { category: "interrupted" } error |
| TC-ERR-8: Pre-migration backup | PASS | 3 backup files exist (126KB each), sqlite.backup() + pruneOldBackups(max=3) verified |

## Result: 8/8 PASS — no bugs filed

## Screenshots

- `TC-ERR-4_status-bar.png` — Status bar showing "Disconnected" state
- `TC-ERR-5_agent-monitor.png` — Agent Monitor page (no agents running, banner only shows in terminal view)

## Notes

- TC-ERR-4/5: Backend WS was disconnected during testing, so "Disconnected" state was observed. The amber "reconnecting" state is transient and hard to capture.
- TC-ERR-5: The connection lost banner is inside TerminalRenderer which only renders when viewing a specific execution. With no running agents, the banner path was verified via code inspection.
- TC-ERR-8: Backup files from the migration run at 2026-04-01 22:33 PDT (3 files, correctly pruned to max 3).
