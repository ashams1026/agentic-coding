# AgentOps — Work Log Archive

> Summarized entries from `WORKLOG.md`. Grouped by sprint/phase.
> Older sections may be consolidated into higher-level summaries as this file grows.

---

## Sprint 1: Monorepo & Tooling (T1.1.1–T1.1.3) — 2026-03-28

**Summary:** Set up pnpm monorepo with 3 packages (frontend, backend, shared). TypeScript strict mode with project references, bundler moduleResolution, `verbatimModuleSyntax`. ESLint 9 flat config with React plugins for frontend. Prettier with double quotes, trailing commas, 100 width.

**Key decisions:**
- Node 22 LTS, pnpm 10
- Shared package exports `.ts` source directly (not compiled)
- Root `"type": "module"` for ESM throughout
- `verbatimModuleSyntax` requires `import type` for type-only imports

**Patterns established:**
- `@/` path alias in frontend (tsconfig + vite.config)
- Composite project references: shared → frontend, shared → backend
- `pnpm build` runs all packages, `pnpm typecheck` for type checks

---

## Sprint 1: Frontend Foundation (T1.2.1–T1.2.7) — 2026-03-28

**Summary:** Scaffolded React 19 + Vite 8 + Tailwind v4 frontend. Installed shadcn/ui (new-york style, 14 components). React Router v7 with 9 route stubs. TanStack Query + Zustand with persist. Full app shell with collapsible sidebar, project switcher, status bar. Dark mode with system/light/dark cycle.

**Key decisions:**
- Tailwind v4 CSS-first — `@theme` blocks in index.css, no tailwind.config.ts
- shadcn/ui `@theme inline` block maps CSS vars to Tailwind utilities
- Dark mode via `.dark` class on `<html>`, HSL CSS variables
- Zustand `persist` middleware stores sidebar + theme to localStorage (`agentops-ui` key)
- `tslib` added as direct dep to fix pnpm strict mode issue with react-remove-scroll

**Patterns established:**
- `cn()` utility from `@/lib/utils` for class merging
- Named exports, kebab-case files, PascalCase components
- `useThemeSync()` hook in RootLayout for theme class management
- NavLink with active state in sidebar, conditional tooltips when collapsed
- `TooltipProvider` wraps entire app at RootLayout level

**Files of note:**
- `src/index.css` — theme tokens, dark mode vars, shadcn inline theme
- `src/stores/ui-store.ts` — Zustand with persist
- `src/hooks/use-theme.ts` — theme sync hook
- `src/components/sidebar.tsx` — full sidebar with nav, project switcher, theme toggle
- `src/layouts/root-layout.tsx` — app shell layout
