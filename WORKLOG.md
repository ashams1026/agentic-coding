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

---

## 2026-03-28 — T1.1.2: Set up TypeScript config

**Task:** Root `tsconfig.base.json` with strict mode, per-package `tsconfig.json` extending base, cross-package imports via project references.

**Done:**
- Created `tsconfig.base.json` at root with strict mode, ES2023 target, bundler moduleResolution, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `declarationMap`, and other strict checks
- Created `packages/shared/tsconfig.json` — extends base, `composite: true`, outDir/rootDir set
- Created `packages/backend/tsconfig.json` — extends base, `composite: true`, references shared
- Created `packages/frontend/tsconfig.json` — extends base, `composite: true`, references shared, adds DOM libs, `jsx: react-jsx`, path alias `@/*` → `src/*`
- Created root `tsconfig.json` as solution file with references to all three packages
- Created placeholder `packages/backend/src/index.ts` and `packages/frontend/src/main.tsx` so tsc has source to compile
- Verified: `npx tsc --build` passes clean, `pnpm typecheck` passes all 3 packages

**Files created:**
- `tsconfig.base.json`
- `tsconfig.json`
- `packages/shared/tsconfig.json`
- `packages/backend/tsconfig.json`
- `packages/frontend/tsconfig.json`
- `packages/backend/src/index.ts`
- `packages/frontend/src/main.tsx`

**Notes for next agent:**
- T1.1.3 is next: ESLint + Prettier setup
- Frontend uses path alias `@/*` — Vite will need a matching `resolve.alias` in T1.2.1
- `verbatimModuleSyntax` is enabled — always use `import type` for type-only imports
- Project references are set up: shared → backend, shared → frontend. Run `npx tsc --build` at root for full build

---

## 2026-03-28 — T1.1.3: Set up ESLint + Prettier

**Task:** Root ESLint flat config (v9) with TypeScript-aware rules, React plugins for frontend, Prettier integration.

**Done:**
- Installed at root: eslint 10, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, eslint-config-prettier, globals, prettier
- Created `eslint.config.js` (ESLint 9 flat config): base JS + TS recommended rules, frontend-specific React hooks + refresh plugin with browser globals, backend-specific node globals, eslint-config-prettier last to avoid conflicts
- Created `.prettierrc` (semi, double quotes, trailing commas, 100 width, 2-space indent)
- Created `.prettierignore` (dist, node_modules, pnpm-lock.yaml)
- Updated root `package.json`: `lint` runs eslint directly, `format` runs prettier directly, added `format:check`, added `"type": "module"` to eliminate Node warning
- Updated per-package lint/format scripts for standalone usage
- Verified: `pnpm lint` passes clean, `pnpm format:check` passes, `npx tsc --build` still works

**Files created:**
- `eslint.config.js`
- `.prettierrc`
- `.prettierignore`

**Files modified:**
- `package.json` (root — added type:module, updated lint/format scripts)
- `packages/shared/package.json` (lint/format scripts)
- `packages/backend/package.json` (lint/format scripts)
- `packages/frontend/package.json` (lint/format scripts)

**Notes for next agent:**
- T1.2.1 is next: scaffold Vite + React + TypeScript in frontend
- ESLint uses flat config (v9) at root — no per-package `.eslintrc` needed
- Root `package.json` now has `"type": "module"` — all `.js` files are ESM
- Prettier uses double quotes (not single) — be consistent
- React hooks + refresh plugins are scoped to `packages/frontend/src/**`

---

## 2026-03-28 — T1.2.1: Scaffold Vite + React + TypeScript

**Task:** Scaffold Vite + React 19 + TypeScript in `packages/frontend`, configure path aliases, verify dev/build.

**Done:**
- Installed react 19.2.4, react-dom 19.2.4, vite 8.0.3, @vitejs/plugin-react, @types/react, @types/react-dom
- Created `vite.config.ts` with react plugin and `@/` → `src/` path alias (matching tsconfig paths)
- Created `index.html` entry point for Vite
- Updated `src/main.tsx` — renders React app with StrictMode into `#root`
- Created `src/app.tsx` — minimal App component
- Created `tsconfig.node.json` for Vite config file IDE support
- Verified: `npx vite build` produces dist, `tsc --noEmit` passes, `pnpm lint` clean, `pnpm format:check` clean

**Files created:**
- `packages/frontend/vite.config.ts`
- `packages/frontend/index.html`
- `packages/frontend/src/app.tsx`
- `packages/frontend/tsconfig.node.json`

**Files modified:**
- `packages/frontend/src/main.tsx` (now renders React app)
- `packages/frontend/package.json` (dependencies added)

**Notes for next agent:**
- T1.2.2 is next: install and configure Tailwind CSS
- Path alias `@/` is configured in both tsconfig and vite.config.ts
- Frontend runs on port 5173 by default
- `verbatimModuleSyntax` is on — use `import type` for type-only imports
- App component is in `src/app.tsx` (kebab-case file, named export)
