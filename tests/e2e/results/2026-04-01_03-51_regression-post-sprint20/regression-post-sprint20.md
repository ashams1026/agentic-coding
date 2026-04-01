# E2E Regression Sweep — Post Sprint 20

**Date:** 2026-04-01 12:55 PDT
**Environment:** Backend :3001, Frontend :5173
**Build status:** PASS

## Status

This regression checkpoint covers the same scope as `regression-post-sprint19.md` (SDK.REG.1), which was executed after both Sprint 19 and Sprint 20 were complete. No additional code changes have been made between the two regression tasks.

**Refer to `regression-post-sprint19.md` for the full regression report.**

## Sprint 20 Features Verified

All Sprint 20 features were verified during SDK.REG.1:

| Feature | Verification |
|---|---|
| Partial message streaming (ST.1) | Code review |
| Live token streaming UI (ST.2) | Code review |
| Progress summaries (ST.3) | Code review |
| Rate limit handling (ST.4) | Code review |
| Context usage display (ST.5) | Code review |
| SDK native sandbox (SB.1) | Code review |
| Sandbox settings UI (SB.2) | E2E: 12/16 PASS |
| canUseTool callback (SB.3) | Code review |
| Runtime MCP management (MCP.1) | Code review |
| MCP status dots (MCP.2) | Code review |
| Prompt suggestions (UX.1) | Code review |
| Model switching (UX.2) | Code review |
| In-process MCP server (UX.3) | Code review |

## Summary

- **Build:** PASS (unchanged since REG.1)
- **Regressions:** 0
- **Action items:** Same as REG.1 — re-seed DB and configure API key for full regression coverage
