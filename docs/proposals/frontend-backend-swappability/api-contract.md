# API Contract and Versioning for Backend Swappability

> Research document for **RES.SWAP.API**. Design only — no implementation tasks.
> Builds on [RES.SWAP.ARCH](architecture.md) (connection store, health check) and [RES.SWAP.HOSTED](hosted-frontend.md) (versioning, compatibility matrix).

---

## 1. API Contract Definition

### Current State: Implicit Contract

The API contract between frontend and backend is currently **implicit** — defined by the TypeScript types in `packages/shared` and the route implementations in `packages/backend/src/routes/`. There is no formal specification.

**Shared types package (`@agentops/shared`):**
- `packages/shared/src/entities.ts` — 15 entity interfaces (Project, WorkItem, Persona, Execution, Comment, Proposal, ChatSession, ChatMessage, etc.)
- `packages/shared/src/api.ts` — 25+ request/response types (CreateProjectRequest, ApiResponse<T>, ApiListResponse<T>, DashboardStats, etc.)
- `packages/shared/src/ws-events.ts` — 14 WebSocket event types (StateChangeEvent, AgentStartedEvent, etc.)
- `packages/shared/src/ids.ts` — branded ID types (ProjectId, WorkItemId, etc.)
- `packages/shared/src/workflow.ts` — workflow state definitions

**Backend endpoints (audit of `packages/backend/src/routes/`):**

| Route file | Endpoints | Resource |
|---|---|---|
| `projects.ts` | 5 | GET list, GET :id, POST, PATCH :id, DELETE :id |
| `work-items.ts` | 6 | GET list, GET :id, POST, PATCH :id, POST :id/dispatch, DELETE :id |
| `work-item-edges.ts` | 3 | GET by work item, POST, DELETE :id |
| `personas.ts` | 5 | GET list, GET :id, POST, PATCH :id, DELETE :id |
| `persona-assignments.ts` | 2 | GET by project, PUT |
| `executions.ts` | 11 | GET list, GET :id, POST, PATCH :id, DELETE :id, POST :id/cancel, POST :id/rewind, POST :id/resume, GET :id/events, GET :id/files, POST :id/structured-output |
| `proposals.ts` | 5 | GET list, GET :id, POST, PATCH :id, DELETE :id |
| `comments.ts` | 4 | GET list, GET :id, POST, DELETE :id |
| `chat.ts` | 6 | POST session, GET sessions, GET :id/messages, PATCH :id, DELETE :id, POST :id/messages |
| `dashboard.ts` | 4 | GET stats, GET cost-summary, GET execution-stats, GET ready-work |
| `settings.ts` | 14 | GET/POST/DELETE api-key, GET concurrency, GET db-stats, DELETE executions, GET export, POST import, POST backup, POST restore, GET service/status, POST service/restart, GET executor-mode, PUT executor-mode |
| `sdk.ts` | 2 | GET capabilities, POST reload |
| `audit.ts` | 1 | GET audit logs |
| `server.ts` | 2 | GET /api/health, GET /health (legacy) |

**Total: ~70 HTTP endpoints + 1 WebSocket endpoint (`/ws`)**

**Frontend API layer (`packages/frontend/src/api/client.ts`):**
- 30+ typed functions (one per backend endpoint used)
- `HealthResponse` interface defined locally (client.ts:551-557) — not shared
- Response envelope unwrapping (`{ data }` / `{ data, total }`) handled in client.ts

### Should We Formalize with OpenAPI?

**Yes, but incrementally.** A formal OpenAPI spec provides:

| Benefit | Impact |
|---|---|
| **Single source of truth** | Frontend and backend types auto-generated from one spec, eliminating manual sync |
| **Third-party backend compatibility** | Anyone implementing the spec can serve as a Woof backend (enables community backends, testing backends) |
| **Documentation** | Auto-generated API docs for developers building integrations (ties into RES.WEBHOOKS.INBOUND) |
| **Validation** | Request/response validation at the backend, catching contract violations at runtime |
| **Mock server generation** | Auto-generate a mock server from the spec for frontend development (replaces the current mock data layer) |

**Tradeoffs:**

| Pro | Con |
|---|---|
| Eliminates type drift between packages | OpenAPI spec is another artifact to maintain |
| Enables code generation (types, clients, mocks) | Overhead for a small team — may slow down rapid iteration |
| Required for multi-backend ecosystem | Adds build step complexity (spec → types → code) |
| Industry standard, extensive tooling | Fastify routes would need to be restructured or annotated |

### Recommended Approach: OpenAPI 3.1 with Code-First Generation

Rather than writing OpenAPI YAML by hand, **generate the spec from the existing Fastify routes:**

**Tool: `@fastify/swagger` + `@fastify/swagger-ui`**

Fastify already supports automatic OpenAPI schema generation from route definitions. Each route adds a `schema` property:

```typescript
// Before (current):
app.get<{ Params: { projectId: string } }>("/api/projects/:projectId", async (request) => { ... });

// After (with schema):
app.get<{ Params: { projectId: string } }>("/api/projects/:projectId", {
  schema: {
    params: ProjectParamsSchema,
    response: { 200: ProjectResponseSchema },
    tags: ["projects"],
    summary: "Get a project by ID",
  },
}, async (request) => { ... });
```

This approach:
1. Uses the code as the source of truth (not an external spec file)
2. Fastify validates requests against the schema at runtime
3. `@fastify/swagger` generates OpenAPI 3.1 JSON from route schemas
4. Generated spec is published alongside the `@agentops/shared` package
5. Frontend types can be generated from the spec (replacing hand-written shared types over time)

### WebSocket Contract

OpenAPI doesn't natively support WebSocket APIs well. For the WS contract:

**Option A: AsyncAPI spec** — the WebSocket equivalent of OpenAPI. Defines channels, message types, and payloads. Good for formal multi-backend ecosystems.

**Option B: Keep TypeScript types as the WS contract** — `packages/shared/src/ws-events.ts` already defines all 14 event types with full payloads. This is sufficient for the current monorepo setup.

**Recommendation:** Option B for now. The WS event types in `ws-events.ts` are well-structured and already serve as the contract. AsyncAPI can be added later if third-party backends need formal WS documentation.

---

## 2. Versioning Strategy

### The Version Mismatch Problem

With a hosted frontend (RES.SWAP.HOSTED) and user-managed backends, version mismatches are inevitable:
- CDN frontend auto-updates on every deploy
- Local backend updates only when the user runs `npm update` or `docker pull`
- Users may intentionally run older backend versions (stability, compatibility)

### API Version Header

**Approach: single integer `apiVersion` in the health response.**

Per RES.SWAP.ARCH's enhanced health response:

```json
{
  "status": "ok",
  "version": "0.2.0",
  "apiVersion": 1,
  "capabilities": { ... }
}
```

Rules:
- `apiVersion` increments when **breaking changes** are made to the API (removed endpoints, changed response shapes, renamed fields)
- `apiVersion` does NOT increment for additive changes (new endpoints, new optional fields, new event types)
- The frontend declares `MIN_API_VERSION = 1` and `CURRENT_API_VERSION = 1`
- On connect: if backend `apiVersion < MIN_API_VERSION` → block with upgrade prompt
- If backend `apiVersion > CURRENT_API_VERSION` → proceed (backend is ahead, but backward-compatible)

### Semantic Versioning for Packages

The `version` field in the health response follows semver:
- **Major** (1.x.x → 2.x.x): breaking API changes (also bumps `apiVersion`)
- **Minor** (x.1.x → x.2.x): new features, new endpoints, new optional fields
- **Patch** (x.x.1 → x.x.2): bug fixes, no API changes

The frontend uses `version` for display ("Backend v1.2.3") and `apiVersion` for compatibility checks.

### Capability Negotiation

For finer-grained compatibility than a single version number:

```json
{
  "capabilities": {
    "chat": true,
    "fileCheckpointing": true,
    "mcpServers": true,
    "structuredOutput": true,
    "executionRewind": true,
    "export": true
  }
}
```

The frontend checks individual capabilities before showing related UI:
- `capabilities.chat === false` → hide the Pico chat panel
- `capabilities.fileCheckpointing === false` → hide the rewind button
- `capabilities.export === false` → hide Settings > Export

This handles the common case where a feature is added in a minor version: the frontend can check for the capability and gracefully degrade without requiring the user to upgrade their backend.

### Feature Flags vs Capabilities

Feature flags are set at the frontend (A/B testing, gradual rollout). Capabilities are reported by the backend (what it can do). These are complementary:
- Feature flag: "should we show this experimental UI to this user?" (frontend decision)
- Capability: "can the backend handle this request?" (backend report)

Don't conflate them. The frontend may have a feature flag enabled but suppress the feature if the backend lacks the capability.

---

## 3. What `packages/shared` Becomes

### Current Role

`@agentops/shared` (package.json: `"private": true`) is a monorepo-internal package consumed by both `@agentops/frontend` and `@agentops/backend`. It contains:
- Entity types (15 interfaces)
- API request/response types (25+ interfaces)
- WebSocket event types (14 event types + union + handler types)
- Branded ID types + `createId()` factory
- Workflow state machine (WORKFLOW constant, `isValidTransition()`)

It's compiled with `tsc` and consumed via `workspace:*` in pnpm.

### Future Role: Published API Contract Package

With swappable backends, `@agentops/shared` becomes the **public API contract** that any backend must implement and any frontend must consume.

**Changes needed:**

| Aspect | Current | Future |
|---|---|---|
| **Visibility** | `"private": true` | Published to npm as `@woof/api-types` (or `@woof/shared`) |
| **Consumers** | Frontend + backend in same monorepo | Frontend, backend, third-party integrations, mock servers |
| **Source of truth** | Hand-written TypeScript | Generated from OpenAPI spec (eventually), hand-written for WS events |
| **Versioning** | Matches monorepo version | Independent semver, tracks `apiVersion` |
| **Contents** | Types + utilities | Types only (no runtime code beyond `createId()`) |

### Migration Path

1. **Phase 1 (now):** Keep `@agentops/shared` as-is. It works. Don't change what isn't broken.
2. **Phase 2 (with OpenAPI):** Add `@fastify/swagger` to the backend. Generate OpenAPI spec from route schemas. Verify the generated spec matches the types in `@agentops/shared` (use as validation, not replacement).
3. **Phase 3 (publish):** Remove `"private": true`. Rename to `@woof/api-types`. Publish to npm. Add a CI check that regenerates types from OpenAPI spec and fails if they differ from the committed types (drift detection).
4. **Phase 4 (generate):** Switch to generated types as the source of truth. The OpenAPI spec generates `@woof/api-types`, which frontend and backend both depend on. Hand-written types in `@agentops/shared` are replaced.

### What Stays in the Monorepo

Even after publishing `@woof/api-types`, some shared code stays monorepo-internal:
- `workflow.ts` — state machine logic (implementation detail, not API contract)
- `ids.ts:createId()` — ID generation utility (runtime behavior, not types)
- Any shared validation logic that both frontend and backend need

These stay in an internal `@agentops/shared-internal` or similar.

---

## 4. Mock Backend

### Current Mock Layer

The frontend currently has mock data in `packages/frontend/src/api/mock-data.ts` (or similar). This was the UI-first development approach described in CLAUDE.md: "All screens are built against mock data before backend implementation."

### Why a Mock Backend?

A mock backend replaces the frontend's in-process mock data with a separate server that implements the API contract:

| Benefit | Details |
|---|---|
| **Frontend development without the real backend** | No need to run SQLite, agent SDK, or configure API keys |
| **Consistent testing** | Same mock data across all developers |
| **Contract validation** | If the mock server implements the spec, the frontend is guaranteed to work with any conforming backend |
| **CI testing** | Run frontend e2e tests against the mock backend in CI without heavyweight dependencies |
| **Onboarding** | New frontend contributors can start immediately without backend setup |

### Implementation Options

#### Option A: OpenAPI Mock Server (Recommended)

Auto-generate a mock server from the OpenAPI spec:

**Tool: Prism (by Stoplight)**
```bash
npx @stoplight/prism-cli mock openapi.json --port 3001
```

Prism reads the OpenAPI spec and serves example responses. No code to write or maintain — the mock server is always in sync with the spec.

**Pros:** Zero maintenance, always matches the spec, supports response examples.
**Cons:** Stateless by default (GET always returns the same data, POST doesn't persist). Can be extended with Prism's callback system for basic statefulness.

#### Option B: MSW (Mock Service Worker)

Intercept requests at the browser/Node level:

```typescript
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

const handlers = [
  http.get("/api/projects", () => {
    return HttpResponse.json({ data: mockProjects, total: mockProjects.length });
  }),
  // ...
];

const worker = setupWorker(...handlers);
worker.start();
```

**Pros:** Runs in the browser (no separate process), great for component testing, can be stateful.
**Cons:** Requires hand-written handlers per endpoint (~70 handlers), must be kept in sync manually.

#### Option C: Lightweight Express/Fastify Mock Server

A minimal server in the monorepo (`packages/mock-backend/`) that implements the API contract with in-memory data:

```typescript
// packages/mock-backend/src/index.ts
const projects: Project[] = [...seedData];
app.get("/api/projects", () => ({ data: projects, total: projects.length }));
app.post("/api/projects", (req) => { projects.push({ ...req.body, id: createId("pr") }); ... });
```

**Pros:** Stateful (CRUD works), can simulate WebSocket events, full control.
**Cons:** Another codebase to maintain, can drift from the real backend.

### Recommendation

**Phase 1:** MSW for component/integration tests (lightweight, in-browser, good DX). The existing mock data layer transitions into MSW handlers.

**Phase 2:** Prism for contract validation (auto-generated from OpenAPI spec, zero maintenance, runs in CI to verify frontend against the spec).

**Phase 3 (if needed):** Lightweight mock backend for demos and onboarding, only if Prism's statelessness is a problem.

---

## 5. Impact on Existing Frontend API Layer

### Current Architecture

```
packages/frontend/src/api/
├── client.ts       ← 30+ functions, hardcoded BASE_URL, response unwrapping
├── ws-client.ts    ← RealWsClient, hardcoded WS URL from API_BASE_URL
└── index.ts        ← Re-exports
```

All API functions in `client.ts` follow the same pattern:
```typescript
export async function fetchProjects(): Promise<Project[]> {
  const res = await get<{ data: Project[]; total: number }>("/api/projects");
  return res.data;
}
```

### Changes for Swappability

#### 5.1: Dynamic Base URL (from RES.SWAP.ARCH)

Replace `const BASE_URL = API_BASE_URL` with `connectionStore.getBaseUrl()`:

```typescript
// Before:
const BASE_URL = API_BASE_URL;
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  ...
}

// After:
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: getAuthHeaders(),
  });
  ...
}
```

This affects:
- 5 helper functions (`get`, `post`, `patch`, `put`, `del` at client.ts:61-115)
- 6 inline `fetch` calls (client.ts lines 293, 417, 460, 522-523, 537, 560, 638) — these must also be updated to use `getBaseUrl()` and `getAuthHeaders()`
- WebSocket URL derivation in `ws-client.ts:53`

#### 5.2: Auth Header Injection

Every request needs the auth token from the active connection:

```typescript
function getAuthHeaders(): Record<string, string> {
  const conn = useConnectionStore.getState().getActiveConnection();
  if (conn?.authToken) {
    return { Authorization: `Bearer ${conn.authToken}` };
  }
  return {};
}
```

This is injected in the `get/post/patch/put/del` helpers, so all 30+ API functions get auth automatically.

#### 5.3: Connection-Aware Error Handling

API errors should distinguish between:
- **Auth errors (401/403):** "Authentication failed. Check your API key in Settings > Connection."
- **Network errors:** "Cannot reach backend. Is it running?"
- **CORS errors:** "Backend rejected the request. CORS may need configuration."
- **Version mismatch:** "This feature requires backend v1.2.0+. You have v1.1.0."

The `showErrorToast` function (client.ts:53-59) should be enhanced to handle these cases.

#### 5.4: WebSocket URL Switching

`ws-client.ts` needs to:
1. Accept a URL parameter instead of deriving from `API_BASE_URL`
2. Support disconnect + reconnect to a new URL
3. Maintain handler registrations across reconnections

```typescript
class RealWsClient {
  connect(wsUrl: string): void { ... }  // New: explicit URL parameter
  disconnect(): void { ... }             // Existing
  reconnectTo(newWsUrl: string): void {  // New: combined disconnect + connect
    this.disconnect();
    this.connect(newWsUrl);
  }
}
```

#### 5.5: HealthResponse into Shared Types

`HealthResponse` is currently defined locally in `client.ts:551-557`. It should move to `@agentops/shared` since it's part of the API contract:

```typescript
// packages/shared/src/api.ts
export interface HealthResponse {
  status: "ok" | "error";
  version: string;
  apiVersion: number;
  uptime: number;
  activeExecutions: number;
  executor: "mock" | "claude";
  capabilities: Record<string, boolean>;
  projectCount?: number;
}
```

#### 5.6: TanStack Query Key Namespacing

When switching backends, TanStack Query cache must be invalidated. To avoid cross-backend data contamination, include the connection ID in query keys:

```typescript
// Before:
useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

// After:
const connectionId = useConnectionStore((s) => s.activeConnectionId);
useQuery({ queryKey: [connectionId, "projects"], queryFn: fetchProjects });
```

This ensures each backend's data is cached independently. When switching backends, only the new backend's queries are refetched.

---

## 6. Implementation Approach

### Prerequisites

- **RES.SWAP.ARCH Phase 1** — Connection store with `getBaseUrl()` and `getAuthHeaders()`
- **Backend health endpoint enhanced** — Add `apiVersion` and `capabilities` fields

### Phase 1: Connection-Aware API Layer

1. Replace `BASE_URL` constant with `getBaseUrl()` in all helpers and inline fetch calls
2. Add `getAuthHeaders()` injection to all helpers
3. Update `ws-client.ts` to accept dynamic URLs
4. Move `HealthResponse` to `@agentops/shared`
5. Add connection ID to TanStack Query keys
6. Enhance error toasts with connection-aware messages

**Scope:** Frontend-only changes. Backend unchanged except health endpoint enhancement.

### Phase 2: OpenAPI Spec Generation

1. Add `@fastify/swagger` to the backend
2. Add `schema` properties to all ~70 route handlers (can be done incrementally, route file by route file)
3. Generate OpenAPI 3.1 spec as a build artifact
4. Add CI check: generated spec committed to repo, fail if it drifts
5. Serve Swagger UI at `/api/docs` in development mode

**Scope:** Backend-only changes. No frontend impact.

### Phase 3: Contract Validation + Mock Server

1. Set up Prism mock server using the generated OpenAPI spec
2. Add MSW handlers for frontend component tests (generated from spec where possible)
3. Add contract test suite: run frontend e2e tests against both real backend and Prism mock — both must pass
4. Publish `@agentops/shared` to npm (remove `"private": true`, rename if needed)

**Scope:** Testing infrastructure + shared package publishing.

### Phase 4: Type Generation (Optional)

1. Generate TypeScript types from OpenAPI spec
2. Compare with existing `@agentops/shared` types — verify equivalence
3. Gradually replace hand-written types with generated types
4. Add AsyncAPI spec for WebSocket events (if third-party backends exist)

**Scope:** Long-term. Only pursue if third-party backends materialize.

---

## 7. Cross-References

| Document | Relationship |
|---|---|
| [architecture.md](architecture.md) (RES.SWAP.ARCH) | Foundation: connection store provides `getBaseUrl()` and `getAuthHeaders()`, health check with `apiVersion`, deployment models |
| [hosted-frontend.md](hosted-frontend.md) (RES.SWAP.HOSTED) | Versioning/compatibility matrix depends on `apiVersion` and `capabilities` from this proposal; mock backend useful for hosted frontend without a real backend |
| `docs/proposals/webhooks/inbound-triggers.md` (RES.WEBHOOKS.INBOUND) | Inbound webhook receiver is a new API surface area that needs to be included in the OpenAPI spec |
| `docs/proposals/webhooks/outbound-events.md` (RES.WEBHOOKS.OUTBOUND) | Outbound webhook configuration endpoints are new API surface that needs spec coverage |
| `packages/shared/src/api.ts` | Current API types (25+ request/response interfaces) — will be replaced or validated by OpenAPI-generated types |
| `packages/shared/src/ws-events.ts` | WebSocket event contract (14 types) — stays as TypeScript types, AsyncAPI deferred |
| `packages/shared/src/entities.ts` | Entity interfaces (15 types) — referenced by API types, must stay in sync with OpenAPI schemas |
| `packages/frontend/src/api/client.ts` | Primary impact point — 30+ API functions, 5 helpers + 6 inline fetch calls need dynamic URL + auth injection |
| `packages/frontend/src/api/ws-client.ts` | WebSocket client needs dynamic URL support + reconnectTo() method |
| `packages/backend/src/routes/` | 13 route files, ~70 endpoints — all need `schema` properties for OpenAPI generation |

---

## 8. Design Decisions

1. **Code-first OpenAPI generation, not spec-first.** Writing OpenAPI YAML by hand for ~70 endpoints is error-prone and creates a maintenance burden. Fastify's built-in schema support (`@fastify/swagger`) generates the spec from the route definitions — the code IS the spec. This avoids the "spec and code disagree" problem. The tradeoff: route handlers must include schema definitions, which adds verbosity.

2. **Single integer `apiVersion`, not per-endpoint versioning.** URL-based versioning (`/v1/projects`, `/v2/projects`) creates complex routing and forces clients to know which version each endpoint is on. A single `apiVersion` integer is simpler: if it's >= the frontend's minimum, everything works. Breaking changes (which should be rare) bump the integer. This is the approach used by Stripe, Discord, and Slack.

3. **Capability negotiation alongside version number.** Version numbers handle breaking changes. Capabilities handle additive features. A backend at `apiVersion: 1` with `capabilities.chat: false` tells the frontend "I'm API-compatible but don't support chat yet." This is more informative than just a version number and prevents the frontend from calling endpoints that don't exist.

4. **Keep `@agentops/shared` in the monorepo for now, publish later.** Publishing to npm adds versioning overhead and release process complexity. While there's only one frontend and one backend, the monorepo `workspace:*` dependency is simpler. Publish only when a third party needs to consume the types (or when the hosted frontend diverges from the monorepo).

5. **MSW for testing, Prism for contract validation.** MSW runs in the browser — perfect for component tests and Storybook. Prism runs as a server — perfect for CI contract validation. They serve different purposes and aren't mutually exclusive. Using both gives comprehensive coverage without maintaining a hand-written mock server.

6. **`HealthResponse` moves to shared, not duplicated.** Currently defined locally in `client.ts:551-557`, it's part of the API contract. Moving it to `@agentops/shared` ensures frontend and backend agree on the health response shape. The enhanced version adds `apiVersion`, `capabilities`, and `projectCount`.
