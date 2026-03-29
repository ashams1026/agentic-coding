# AgentOps — Task Backlog

> Agents: read this file to find your next task. See `CLAUDE.md` for the work protocol.
> Only pending/in-progress/blocked tasks live here. Completed tasks are archived to `TASKS_ARCHIVE.md`.

---

## Sprint 5: Backend API & Data Layer (Phase 3)

> Connect the mocked UI to real data. Implements T3.1–T3.10 from PLANNING.md.
> Backend: Fastify, better-sqlite3, Drizzle ORM. All in `packages/backend/`.

### Database & Server Foundation

- [review] **T3.1.1** — Install backend dependencies and scaffold Fastify server. Install `fastify`, `@fastify/cors`, `@fastify/websocket`, `better-sqlite3`, `drizzle-orm`, `drizzle-kit`, and dev deps (`@types/better-sqlite3`, `tsx`). Create `packages/backend/src/server.ts` with Fastify instance, CORS config (allow frontend origin), and health check route `GET /health`. Update `src/index.ts` to start the server on port 3001. Verify `pnpm dev` starts and `/health` responds.

- [ ] **T3.1.2** — Define Drizzle schema for all entities. Create `packages/backend/src/db/schema.ts` with SQLite tables matching the shared types in `packages/shared/src/entities.ts`: `projects`, `stories`, `tasks`, `task_edges`, `workflows`, `personas`, `triggers`, `executions`, `comments`, `project_memories`, `proposals`. Use `text` for IDs (prefixed nanoids), `text` for JSON columns (labels, context, settings, states), `integer` for timestamps stored as epoch ms. Add proper foreign key references. Create `packages/backend/src/db/index.ts` that initializes better-sqlite3 + Drizzle and exports `db`.

- [ ] **T3.1.3** — Set up Drizzle migrations and seed script. Configure `drizzle.config.ts` at backend package root. Create initial migration via `drizzle-kit generate`. Create `packages/backend/src/db/seed.ts` that populates the database with the same fixture data from `packages/frontend/src/mocks/fixtures.ts` — import or duplicate the fixture data, insert into all tables. Add `"seed"` script to backend `package.json`. Run migration + seed and verify data is in SQLite file.

### CRUD API Routes

- [ ] **T3.2.1** — Implement project API routes. Create `packages/backend/src/routes/projects.ts` as a Fastify plugin. Routes: `GET /api/projects` (list all), `GET /api/projects/:id`, `POST /api/projects` (create with name, path, workflowId), `PATCH /api/projects/:id` (update), `DELETE /api/projects/:id`. Use Drizzle queries. Register plugin in server.ts under `/api` prefix. Implements T3.2 from PLANNING.md.

- [ ] **T3.2.2** — Implement story API routes. Create `packages/backend/src/routes/stories.ts`. Routes: `GET /api/stories` (list, optional `?projectId=` filter), `GET /api/stories/:id`, `POST /api/stories` (create with projectId, title, workflowId, priority), `PATCH /api/stories/:id` (update title, description, state, priority, labels, context), `DELETE /api/stories/:id`. Generate `StoryId` via `createId.story()`. Implements T3.3 from PLANNING.md (story part).

- [ ] **T3.2.3** — Implement task API routes. Create `packages/backend/src/routes/tasks.ts`. Routes: `GET /api/tasks` (list, optional `?storyId=` filter), `GET /api/tasks/:id`, `POST /api/tasks` (create with storyId, title, description, personaId), `PATCH /api/tasks/:id` (update), `DELETE /api/tasks/:id`. On create, auto-populate `inheritedContext` from parent story's description + acceptance criteria. Implements T3.3 from PLANNING.md (task part).

- [ ] **T3.2.4** — Implement task edge (dependency) API routes. Create `packages/backend/src/routes/task-edges.ts`. Routes: `POST /api/edges` (create edge with sourceId, targetId, type), `DELETE /api/edges/:id`, `GET /api/tasks/:id/edges` (get all edges for a task). On create, run cycle detection: BFS/DFS from target following edges — if source is reachable, reject with 409. Implements T3.4 from PLANNING.md.

- [ ] **T3.2.5** — Implement comment API routes. Create `packages/backend/src/routes/comments.ts`. Routes: `GET /api/comments` (list, required `?targetId=` filter), `POST /api/comments` (create with targetId, targetType, content, authorType, authorName, authorId?). Generate `CommentId`. Implements T3.5 from PLANNING.md.

- [ ] **T3.2.6** — Implement workflow API routes. Create `packages/backend/src/routes/workflows.ts`. Routes: `GET /api/workflows` (list), `GET /api/workflows/:id`, `POST /api/workflows` (create with name, type, states JSON, transitions JSON), `PATCH /api/workflows/:id`, `DELETE /api/workflows/:id`. Add `POST /api/workflows/:id/validate` that checks for: orphan states (no incoming/outgoing transitions except initial), unreachable final states, missing initial state. Return warnings array. Implements T3.6 from PLANNING.md.

- [ ] **T3.2.7** — Implement persona API routes. Create `packages/backend/src/routes/personas.ts`. Routes: `GET /api/personas` (list), `GET /api/personas/:id`, `POST /api/personas` (create), `PATCH /api/personas/:id` (update), `DELETE /api/personas/:id`, `POST /api/personas/:id/duplicate` (clone persona with "Copy of" prefix). Implements T3.7 from PLANNING.md.

- [ ] **T3.2.8** — Implement execution API routes. Create `packages/backend/src/routes/executions.ts`. Routes: `GET /api/executions` (list, optional `?targetId=` filter), `GET /api/executions/:id`, `POST /api/executions` (create — used by agent executor later), `PATCH /api/executions/:id` (update status, outcome, logs, cost). Implements T3.8 from PLANNING.md (execution part).

- [ ] **T3.2.9** — Implement proposal API routes. Create `packages/backend/src/routes/proposals.ts`. Routes: `GET /api/proposals` (list, optional `?parentId=` filter), `GET /api/proposals/:id`, `POST /api/proposals` (create), `PATCH /api/proposals/:id` (approve/reject — update status field). Implements T3.8 from PLANNING.md (proposal part).

- [ ] **T3.2.10** — Implement aggregate/dashboard API routes. Create `packages/backend/src/routes/dashboard.ts`. Routes: `GET /api/dashboard/stats` (activeAgents count, pendingProposals count, needsAttention count, todayCostUsd sum), `GET /api/dashboard/cost-summary` (monthly total, daily breakdown), `GET /api/dashboard/ready-work` (tasks in triggerable state with all deps resolved). Implements T3.4 ready-work query from PLANNING.md.

### WebSocket & Frontend Integration

- [ ] **T3.3.1** — Implement real WebSocket server. Register `@fastify/websocket` plugin. Create `packages/backend/src/ws/index.ts` with a WebSocket broadcast system: connected clients set, `broadcast(event: WsEvent)` function, connection/disconnection handling. Route: `GET /ws`. Event types match `packages/shared/src/ws-events.ts`. Add `broadcast()` calls to relevant route handlers (comment create, execution update, state change, proposal update). Implements T3.9 from PLANNING.md.

- [ ] **T3.3.2** — Create API client for frontend. Create `packages/frontend/src/lib/api-client.ts` — thin wrapper around `fetch` with base URL config (`http://localhost:3001/api`), JSON request/response helpers, error handling. Export typed functions matching every backend route: `fetchProjects()`, `createStory(req)`, etc. Types come from `@agentops/shared`.

- [ ] **T3.3.3** — Add API mode toggle to frontend. Create `packages/frontend/src/lib/api-mode.ts` — exports `getApiMode(): "mock" | "live"` reading from localStorage or `?api=live` URL param. Update all TanStack Query hooks in `packages/frontend/src/hooks/` to check api mode: if "live", call api-client functions; if "mock", call existing mock API functions. Default to "mock" so existing behavior is preserved. Add a toggle in Settings (appearance section). Implements T3.10 from PLANNING.md.

- [ ] **T3.3.4** — Connect WebSocket client to real server. Create `packages/frontend/src/lib/ws-client.ts` — WebSocket client that connects to `ws://localhost:3001/ws`, auto-reconnects on disconnect, and emits events through the same interface as `mockWs`. Update `use-ws-sync.ts` and `use-toast-events.ts` to use real WS client when api mode is "live". Keep `mockWs` as fallback for mock mode. Implements T3.9 from PLANNING.md (frontend side).
