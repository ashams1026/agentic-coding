# Frontend/Backend Decoupling Architecture

> Research document for **RES.SWAP.ARCH**. Design only — no implementation tasks.

---

## 1. Current State Audit

### How the Frontend Discovers the Backend

The frontend has a single, hardcoded backend URL:

```typescript
// packages/frontend/src/api/client.ts:48-49
export const API_BASE_URL = "http://localhost:3001";
const BASE_URL = API_BASE_URL;
```

Every HTTP request uses `BASE_URL` as prefix. There are ~30 API functions in `client.ts` that call `fetch(\`${BASE_URL}${path}\`)` through 5 helper functions (`get`, `post`, `patch`, `put`, `del` at lines 61-115) plus 6 inline `fetch` calls that reference `BASE_URL` directly (lines 293, 417, 460, 522-523, 537, 560, 638).

No environment variable (`VITE_API_URL` or similar) is used — the URL is a literal string constant.

### WebSocket Connection

```typescript
// packages/frontend/src/api/ws-client.ts:53
const wsUrl = API_BASE_URL.replace(/^http/, "ws") + "/ws";
```

The `RealWsClient` class (ws-client.ts:23) imports `API_BASE_URL` from `client.ts` and derives the WebSocket URL by replacing the protocol. It has reconnection logic (3-second retry at line 138-141) and a `disconnect()` method (line 89-100), but no support for changing the target URL at runtime.

### CORS Configuration

```typescript
// packages/backend/src/server.ts:27-30
await server.register(cors, {
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173"],
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
});
```

CORS is hardcoded to localhost dev server ports. A remote frontend or frontend on a different origin would be blocked.

### Health Check

```typescript
// packages/backend/src/server.ts:33-41
server.get("/api/health", async () => {
  return {
    status: "ok",
    uptime: Math.floor(process.uptime()),
    activeExecutions: getActiveCount(),
    executor: executionManager.getExecutorMode(),
    version: "0.0.1",
  };
});
```

A health endpoint exists with version info — useful for connection validation, but the version is hardcoded `"0.0.1"`.

### API Layer Structure

| File | Role | Backend Coupling |
|------|------|-----------------|
| `api/client.ts` | HTTP functions (30+ endpoints) | All use `BASE_URL` constant |
| `api/ws-client.ts` | WebSocket client singleton | Derives URL from `API_BASE_URL` |
| `api/index.ts` | Re-exports from `client.ts` | Comment says "localhost:3001" |

### Summary of Coupling Points

1. **`API_BASE_URL` constant** — single source of truth, but not configurable
2. **6 inline `fetch` calls** — bypass the `get/post/patch/put/del` helpers, reference `BASE_URL` directly
3. **WebSocket URL derivation** — coupled to `API_BASE_URL`
4. **CORS whitelist** — backend only accepts localhost origins
5. **No auth headers** — all requests are unauthenticated
6. **No connection state management** — no concept of "connected/disconnected" at the API layer

---

## 2. Backend Selector UX

### Where It Lives

A **connection manager** accessible from:
1. **Settings > Connection** — primary configuration page
2. **Status indicator in the sidebar footer** — shows connected/disconnected with the current backend name
3. **First-run screen** — if no backend connection is configured, show connection setup before the main app

### Connection Model

```typescript
interface BackendConnection {
  id: string;                  // "conn-a8k2f"
  name: string;                // "Local Dev", "Production", "Staging"
  url: string;                 // "http://localhost:3001"
  authToken?: string;          // Optional API key / bearer token
  isDefault: boolean;          // Auto-connect on app load
  lastConnectedAt: string | null;
  status: "connected" | "disconnected" | "error";
  serverVersion?: string;      // Cached from last health check
}
```

Stored in **browser localStorage** — no server-side storage needed. The frontend is the source of truth for which backends exist.

### Connection List UI

```
┌─────────────────────────────────────────────────────────────┐
│ Settings > Connection                                        │
│                                                              │
│ Active: Local Dev ● Connected                                │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ● Local Dev (default)        http://localhost:3001       │ │
│ │   Connected · v0.0.1 · 3 active agents                  │ │
│ │                              [Edit] [Disconnect]         │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ ○ Team Server               https://woof.internal:3001   │ │
│ │   Disconnected · Last seen: 2h ago                       │ │
│ │                              [Connect] [Edit] [Delete]   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Add Backend]                                              │
└─────────────────────────────────────────────────────────────┘
```

### Add/Edit Dialog

```
┌──────────────────────────────────────────────────────────┐
│ Add Backend Connection                                    │
│                                                           │
│ Name:     [____________________________]                  │
│ URL:      [http://localhost:3001_______]                   │
│ Auth:     ☐ Requires authentication                       │
│           API Key: [________________________]  (optional)  │
│                                                           │
│ ☐ Set as default (connect automatically on app start)     │
│                                                           │
│ [Test Connection]                                         │
│   ✓ Connected · v0.0.1 · Claude executor · 2 projects     │
│                                                           │
│              [Cancel]  [Save]                              │
└──────────────────────────────────────────────────────────┘
```

### Sidebar Status Indicator

In the sidebar footer (below the nav items):

```
┌──────────────────┐
│ ● Local Dev      │  ← green dot = connected
│   localhost:3001  │
└──────────────────┘
```

Or when disconnected:

```
┌──────────────────┐
│ ◌ Disconnected   │  ← hollow dot, amber text
│   [Connect]      │
└──────────────────┘
```

Clicking opens the Settings > Connection page.

---

## 3. Connection Validation

### Health Check Flow

When the user adds or switches backends:

```
[Test Connection] clicked
  │
  ▼
GET {url}/api/health
  │
  ├── Success (200) → parse response
  │     │
  │     ├── Show: version, executor mode, active executions, uptime
  │     ├── Compare server version with frontend version
  │     │     └── Mismatch? Show warning: "Backend v0.0.1, Frontend v0.2.0 — some features may not work"
  │     └── Save connection, set status = "connected"
  │
  ├── Auth error (401/403) → "Authentication required. Check your API key."
  │
  ├── CORS error → "Cannot reach backend. If this is a remote server, ensure CORS is configured."
  │
  └── Network error → "Cannot connect to {url}. Is the backend running?"
```

### Enhanced Health Response

The `/api/health` response should be extended for swappability:

```json
{
  "status": "ok",
  "version": "0.2.0",
  "apiVersion": 1,
  "uptime": 3600,
  "activeExecutions": 2,
  "executor": "claude",
  "capabilities": {
    "chat": true,
    "fileCheckpointing": true,
    "mcpServers": true
  },
  "projectCount": 3
}
```

`apiVersion` enables frontend/backend compatibility checking:
- Frontend knows the minimum `apiVersion` it requires
- If the backend's `apiVersion` is lower, show a degraded-mode warning
- If higher, the frontend still works (server is backwards-compatible)

### Periodic Health Polling

While connected, poll `/api/health` every 30 seconds to detect disconnections before the WebSocket drops:
- If health check fails 3 times consecutively → set status to "disconnected"
- If health check succeeds after being disconnected → trigger reconnection flow
- Show a non-intrusive toast: "Backend connection lost. Reconnecting..."

---

## 4. Auth Implications

### Current State: No Authentication

All API requests are unauthenticated. This works for local-first (same machine, no network exposure).

### When Auth Is Needed

Authentication is required when:
- The backend is on a different machine (remote server, team instance)
- The backend is exposed via a tunnel (ngrok, Cloudflare Tunnel)
- Multiple users connect to the same backend

### Proposed Auth Scheme

**Bearer token (API key):**
- Simplest scheme for a local-first app
- Backend generates an API key on first startup (or user creates one in Settings)
- Frontend stores the key per connection in localStorage
- Every request includes: `Authorization: Bearer <api-key>`

```typescript
// Modified fetch helpers
async function get<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getActiveConnection()?.authToken;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${getBaseUrl()}${path}`, { headers });
  // ...
}
```

### Credential Security in the Browser

- API keys stored in localStorage — acceptable for a developer tool
- **Never** store keys in cookies (CSRF risk with cross-origin requests)
- Show a warning in the UI: "API key is stored in your browser. Don't use shared computers."
- Future: integrate with OS keychain via Electron/Tauri for desktop apps

### OAuth / SSO

Deferred to a future "multi-user" feature. For now, a static API key per backend is sufficient.

---

## 5. WebSocket Reconnection

### Current Behavior

`RealWsClient` (ws-client.ts:23) reconnects on close with a 3-second delay and has an `onReconnect` callback. But it cannot change the target URL at runtime — the URL is derived from `API_BASE_URL` at construction time.

### Required Changes for Backend Switching

When the user switches backends:

```
[Switch to "Team Server"]
  │
  ▼
1. realWs.disconnect()                    ← clean close (code 1000)
  │
  ▼
2. Update active connection in store      ← changes getBaseUrl() and getWsUrl()
  │
  ▼
3. realWs.connect(newWsUrl)               ← connect to new backend
  │
  ├── Success → resume subscriptions (handlers are still registered)
  │
  └── Failure → show error, keep old connection data cached
  │
  ▼
4. Invalidate all TanStack Query caches   ← stale data from old backend
  │
  ▼
5. Re-fetch active page data              ← projects, work items, etc.
```

### Impact on In-Flight Subscriptions

The `RealWsClient` stores handlers in listener Sets (`listeners` at ws-client.ts:24-39). When the WebSocket disconnects and reconnects to a new backend:
- **Handlers survive** — they're registered on the client object, not the WebSocket instance
- **Events resume** — the new backend starts sending events immediately
- **No state sync** — the frontend doesn't know what events it missed between disconnect and reconnect

For missed events: the `onReconnect` callback (ws-client.ts:122-128) should trigger a refetch of critical data (active executions, work item statuses) to catch up.

### Agent Monitor Streams

The Agent Monitor shows live agent output via `agent_output_chunk` events. When switching backends:
- Active execution streams are lost (the execution belongs to the old backend)
- The Agent Monitor should clear its streaming buffer and show any active executions on the new backend
- If no executions are active on the new backend, show a clean "No active agents" state

---

## 6. Offline / Disconnected State

### Detection

Three signals for disconnection:
1. **WebSocket `onclose`** — immediate detection (already handled in ws-client.ts:77-81)
2. **Health check failure** — catches cases where WS stays open but HTTP fails
3. **Fetch errors** — any API call that fails with `TypeError: Failed to fetch`

### Graceful Degradation

| State | Behavior |
|-------|----------|
| **Connected** | Normal operation. All features available. |
| **Disconnected (recent)** | Show banner: "Backend disconnected. Reconnecting..." Read-only mode with cached data. TanStack Query serves stale data. Writes show error toasts. |
| **Disconnected (extended)** | After 60s: banner changes to "Cannot reach backend. Check your connection." Offer manual reconnect button. |
| **No backend configured** | First-run screen: "Connect to a backend to get started." |

### Cached Data Strategy

TanStack Query already caches API responses. When disconnected:
- Cached data remains visible (projects, work items, personas)
- `staleTime` prevents refetch attempts (won't spam a dead backend)
- Mutations fail immediately with a user-friendly error
- The UI is functional for browsing but not for creating/editing

### Reconnection Polling

When disconnected:
1. Attempt reconnect every 5 seconds for the first minute
2. Back off to every 30 seconds after that
3. Stop polling after 10 minutes — user must manually reconnect
4. On successful reconnect: invalidate all TanStack Query caches, reconnect WebSocket, show "Reconnected" toast

---

## 7. Deployment Models Enabled

### Model 1: Local Development (Current)

```
[Frontend: localhost:5173] ←→ [Backend: localhost:3001]
```

Default configuration. No changes needed. `http://localhost:3001` is the default connection.

### Model 2: Static SPA + Local Backend

```
[Frontend: CDN / app.woof.dev] ←→ [Backend: localhost:3001]
```

Frontend served from a CDN. User connects to their local backend. Requires:
- Dynamic `baseUrl` (this proposal)
- CORS configuration: backend must accept the CDN origin
- Mixed content: HTTPS frontend → HTTP localhost (browsers allow this for localhost specifically)

### Model 3: Static SPA + Remote Backend (Tunnel)

```
[Frontend: CDN / app.woof.dev] ←→ [Backend: tunnel.ngrok.io:443]
```

Backend exposed via tunnel. Requires:
- Dynamic `baseUrl` pointing to the tunnel URL
- Auth (API key) — tunnel is publicly accessible
- Backend CORS must accept the frontend origin

### Model 4: Team Server

```
[Frontend A: laptop]  ──┐
                         ├──→ [Backend: woof.internal:3001]
[Frontend B: desktop] ──┘
```

Multiple frontends connecting to one backend. Requires:
- Auth per user (or shared API key for small teams)
- Backend CORS accepts both origins
- WebSocket events broadcast to all connected clients (already works — ws.ts broadcasts to all)

### Model 5: Electron / Tauri Desktop App

```
[Frontend: app://index.html] ←→ [Backend: localhost:3001 (embedded)]
```

Desktop wrapper bundles the frontend and starts the backend as a child process. Requires:
- Dynamic `baseUrl` (app discovers the backend port)
- No CORS issues (same-origin or Electron allows bypass)
- Backend auto-start/stop lifecycle management

### What This Proposal Enables vs What It Doesn't

| Enabled by this proposal | Requires additional work |
|--------------------------|------------------------|
| Dynamic backend URL | CORS configuration UI (backend side) |
| Connection management UI | Multi-user auth (beyond API key) |
| Health check + version validation | Automatic tunnel setup |
| Offline detection + graceful degradation | Desktop app packaging |
| WebSocket reconnection on backend switch | Backend-side API versioning |

---

## 8. Implementation Approach

### Core Change: Replace Hardcoded URL with Connection Store

The minimal change that enables everything:

```typescript
// New: packages/frontend/src/stores/connection-store.ts
interface ConnectionStore {
  connections: BackendConnection[];
  activeConnectionId: string | null;
  
  getBaseUrl(): string;      // returns active connection's URL
  getWsUrl(): string;        // derives ws:// from base URL
  getAuthHeaders(): Record<string, string>;  // { Authorization: "Bearer ..." }
  
  addConnection(conn: Omit<BackendConnection, "id">): void;
  removeConnection(id: string): void;
  switchConnection(id: string): Promise<void>;  // test + switch + reconnect WS
  testConnection(url: string, authToken?: string): Promise<HealthResponse>;
}
```

All API functions in `client.ts` change from:
```typescript
const res = await fetch(`${BASE_URL}${path}`, { headers });
```
To:
```typescript
const res = await fetch(`${getBaseUrl()}${path}`, { headers: { ...getAuthHeaders(), ...headers } });
```

### Migration Path

1. **Phase 1:** Replace `API_BASE_URL` constant with `connectionStore.getBaseUrl()`. Default value stays `http://localhost:3001`. All existing behavior preserved — zero user-facing change.
2. **Phase 2:** Add connection management UI in Settings. Add sidebar status indicator. Support multiple saved connections.
3. **Phase 3:** Add auth header injection, offline detection, graceful degradation. Backend CORS configuration.

### Backend-Side CORS Change

The backend needs to accept dynamic origins:

```typescript
// Instead of hardcoded origins:
await server.register(cors, {
  origin: (origin, cb) => {
    // Allow all origins in development, or check against a configured allowlist
    cb(null, true);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});
```

Or a configurable allowlist stored in the backend's settings.

---

## 9. Cross-References

| Document | Relationship |
|----------|-------------|
| `docs/proposals/frontend-backend-swappability/hosted-frontend.md` (future — RES.SWAP.HOSTED) | Hosted frontend model depends on this architecture — backend selector, connection management, mixed content handling |
| `docs/proposals/frontend-backend-swappability/api-contract.md` (future — RES.SWAP.API) | API contract formalization enables version validation in health check; OpenAPI spec ensures any conforming backend works |
| `docs/proposals/webhooks/inbound-triggers.md` (RES.WEBHOOKS.INBOUND) | Inbound webhooks need a public URL — tunnel challenge noted there is the same challenge for remote backend access |
| `docs/proposals/error-recovery/system-resilience.md` (future — RES.RECOVERY.SYSTEM) | WebSocket disconnection handling proposed here overlaps with system resilience research |
| `packages/frontend/src/api/client.ts` | Primary coupling point — 30+ functions using `BASE_URL`, 5 helpers + 6 inline fetch calls |
| `packages/frontend/src/api/ws-client.ts` | WebSocket client derives URL from `API_BASE_URL` at line 53, reconnection at line 136-142 |

---

## 10. Design Decisions

1. **localStorage for connection storage, not a backend setting.** Connections are a frontend concern — the user may connect to backends that don't know about each other. Storing connections server-side would require a "meta-backend" which contradicts local-first. localStorage is the right persistence layer.

2. **Bearer token auth, not session-based.** A stateless API key is simpler to implement, easier to manage (generate once, use forever), and works across all deployment models. Session-based auth (cookies, OAuth) adds complexity for a developer tool where the user controls both frontend and backend.

3. **Zustand connection store, not env vars.** `VITE_API_URL` would be a build-time decision. A Zustand store makes the backend URL a runtime decision — the user can switch backends without rebuilding the frontend. This is essential for the hosted frontend model (RES.SWAP.HOSTED).

4. **Optimistic offline behavior with TanStack Query cache.** When disconnected, showing stale cached data is better than showing nothing. The user can still browse their work items, review execution history, and read agent output. Only writes fail, and those fail with clear error messages.

5. **Phase 1 is a single-file change.** Replacing `API_BASE_URL` constant with `connectionStore.getBaseUrl()` and updating the 5 helper functions + 6 inline fetch calls in `client.ts` is the minimum viable change. It preserves the default `localhost:3001` behavior while enabling future phases. No other files need to change in Phase 1.
