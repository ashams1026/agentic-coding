# AgentOps — Work Log

> Recent development activity. Agents append entries here after completing tasks.
> Entries older than 7 days are summarized and moved to `WORKLOG_ARCHIVE.md` by the cleanup agent.

---

## 2026-03-28 — T1.1.1: Initialize pnpm workspace

**Task:** Initialize pnpm workspace with packages/frontend, packages/backend, packages/shared.

**Done:**
- Created `pnpm-workspace.yaml` with `packages/*` glob
- Created root `package.json` with workspace scripts (dev, build, lint, format, typecheck), engines field (node >=22, pnpm >=9), and typescript devDependency
- Created `.nvmrc` pinned to Node 22 LTS
- Created `.gitignore` covering node_modules, dist, .env, editor files, SQLite db files, PM2, Vite artifacts
- Created `packages/frontend/package.json` (@agentops/frontend, type: module, vite/tsc build scripts)
- Created `packages/backend/package.json` (@agentops/backend, type: module, tsx watch dev script)
- Created `packages/shared/package.json` (@agentops/shared, exports src/index.ts directly for dev-time imports)
- Created `packages/shared/src/index.ts` placeholder (populated by T1.3.1/T1.3.2)
- Verified `pnpm install` resolves all 4 workspace projects cleanly on Node 22.22.0 / pnpm 10.29.3

**Files created:**
- `pnpm-workspace.yaml`
- `package.json`
- `.nvmrc`
- `.gitignore`
- `packages/frontend/package.json`
- `packages/backend/package.json`
- `packages/shared/package.json`
- `packages/shared/src/index.ts`

**Notes for next agent:**
- T1.1.2 is next: set up TypeScript config (root tsconfig.base.json + per-package tsconfigs)
- The shared package uses `exports` pointing directly at `.ts` source — fine for dev, T1.1.2 should configure `composite: true` + `declarationMap` for proper IDE cross-package navigation
- Per-package `package.json` scripts are stubs for now; dev scripts need actual dependencies installed in later tasks before they work
