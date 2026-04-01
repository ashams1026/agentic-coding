# Hosted Frontend Deployment Model

> Research document for **RES.SWAP.HOSTED**. Design only — no implementation tasks.
> Builds on [RES.SWAP.ARCH](architecture.md) (backend selector, connection store, deployment models).

---

## 1. Onboarding Flow

### First Visit Experience

A new user visits `app.woof.dev` (the hosted frontend). Since no backend connection is configured in localStorage, they see the **first-run connection screen** (proposed in RES.SWAP.ARCH section 2).

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                     🐕 Welcome to Woof                       │
│                                                              │
│  Woof orchestrates AI coding agents on your local machine.   │
│  Connect to your backend to get started.                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Step 1: Install the backend                           │  │
│  │                                                        │  │
│  │  npm install -g @woof/backend                          │  │
│  │                              [Copy]                    │  │
│  │                                                        │  │
│  │  — or —                                                │  │
│  │                                                        │  │
│  │  docker run -p 3001:3001 woof/backend                  │  │
│  │                              [Copy]                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Step 2: Start the backend                             │  │
│  │                                                        │  │
│  │  woof serve                                            │  │
│  │                              [Copy]                    │  │
│  │                                                        │  │
│  │  The backend runs on http://localhost:3001 by default.  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Step 3: Connect                                       │  │
│  │                                                        │  │
│  │  Backend URL: [http://localhost:3001____________]       │  │
│  │                                                        │  │
│  │  [Test Connection]                                     │  │
│  │    ○ Waiting for connection...                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Advanced: [Use a tunnel URL] [Use a remote backend]         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Making It Frictionless

The onboarding has three friction points and mitigations:

| Friction point | Mitigation |
|---|---|
| **Installing the backend** | One-line install (`npm install -g @woof/backend`) or Docker one-liner. The backend package.json already has `bin.agentops` (packages/backend/package.json:8-10) — publish as `@woof/backend` with a `woof` binary. |
| **Knowing it's running** | The "Test Connection" button auto-polls `localhost:3001/api/health` every 2 seconds. As soon as the backend starts, the UI updates to "Connected" without the user clicking anything. |
| **Mixed content confusion** | Pre-fill `http://localhost:3001` (not https). Browsers allow HTTP localhost from HTTPS origins (see section 2). If users paste an HTTP remote URL, warn about mixed content. |

### Connection Success → App Load

When the health check succeeds:
1. Save connection to localStorage (name: "Local Backend", url, isDefault: true)
2. Animate transition from onboarding screen to the main app
3. TanStack Query begins fetching projects, work items, etc.
4. WebSocket connection established for real-time updates
5. If the backend has no projects yet, show the "Create your first project" flow

### Returning User

On subsequent visits to `app.woof.dev`:
1. Load default connection from localStorage
2. Attempt health check on the saved URL
3. If connected → load the app immediately (no onboarding screen)
4. If disconnected → show a compact reconnection banner (not the full onboarding), with a "Reconnecting..." spinner and a "Change backend" link

---

## 2. Local Backend Discovery

### The Mixed Content Question

The hosted frontend at `https://app.woof.dev` needs to connect to a backend at `http://localhost:3001`. This is an HTTPS → HTTP request, which is normally blocked as "mixed content."

**However, localhost is a special case:**

| Browser | HTTP fetch to localhost from HTTPS | WebSocket (ws://) to localhost from HTTPS |
|---|---|---|
| **Chrome** | Allowed. Localhost is treated as a secure context. [Chrome treats `http://localhost` as secure](https://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features/). | Allowed. `ws://localhost` works from HTTPS pages. |
| **Firefox** | Allowed since Firefox 84. Localhost exempt from mixed content blocking. | Allowed. |
| **Safari** | Allowed since Safari 15. Localhost connections permitted from secure contexts. | Allowed. |
| **Edge** | Same as Chrome (Chromium-based). | Same as Chrome. |

**Conclusion:** `http://localhost:3001` and `ws://localhost:3001/ws` work from `https://app.woof.dev` in all modern browsers. No tunnel required for the default local use case.

### What Doesn't Work

- **`http://192.168.x.x:3001`** from HTTPS — blocked as mixed content (not localhost)
- **`http://my-machine.local:3001`** from HTTPS — blocked (mDNS hostname, not localhost)
- **`http://0.0.0.0:3001`** from HTTPS — treated as localhost in some browsers, not all. Recommend `localhost` explicitly.

For non-localhost backends, users must use HTTPS (see section 3 on tunnels).

### Auto-Detection of Local Backend

Can the hosted frontend automatically detect a running local backend without the user typing a URL?

**Approach: silent localhost probe.**

On the first-run screen, before the user interacts:
1. Fire `fetch("http://localhost:3001/api/health")` silently
2. If it succeeds → pre-fill the URL field with `http://localhost:3001` and show "Backend detected!"
3. If it fails → do nothing, wait for user input

**Tradeoffs:**

| Pro | Con |
|---|---|
| Magical UX — "it just works" | Silent network request to localhost may trigger browser security warnings in future |
| Reduces onboarding to one click | Only works for default port 3001 — scanning multiple ports is slow and intrusive |
| No privacy concern — localhost is the user's own machine | False positive if another service runs on 3001 (mitigate: check health response format) |

**Recommendation:** Probe `localhost:3001` silently on the first-run screen. If the health response matches the expected Woof format (has `status: "ok"` and `executor` field), show it as pre-detected. Do not probe multiple ports. If the probe fails, show the manual entry form.

### Browser Extension (Deferred)

A browser extension could provide broader discovery (custom ports, mDNS, Bonjour). Not recommended for v1 — adds distribution complexity and user friction. The localhost probe covers the primary use case.

---

## 3. Tunnel / Remote Access

### When Tunnels Are Needed

| Scenario | Why tunnel? |
|---|---|
| Accessing your backend from a different machine (laptop at home → desktop at office) | Backend not on localhost |
| Mobile testing (phone browser → desktop backend) | Can't use localhost |
| Sharing a backend with a teammate | Need a public URL |
| Demo / presentation from a different network | Backend behind NAT |

### Tunnel Options

#### Option A: User-Managed Tunnel (Recommended for v1)

The user runs a tunnel themselves. Document the three most common options:

**ngrok:**
```bash
ngrok http 3001
# Provides: https://abc123.ngrok-free.app → localhost:3001
```

**Cloudflare Tunnel:**
```bash
cloudflared tunnel --url http://localhost:3001
# Provides: https://abc123.trycloudflare.com → localhost:3001
```

**Tailscale Funnel:**
```bash
tailscale funnel 3001
# Provides: https://machine-name.tailnet-name.ts.net:3001
```

All three produce an HTTPS URL that the user pastes into the Woof frontend's connection dialog. No mixed content issues since the tunnel URL is HTTPS.

**Tunnel comparison:**

| Tool | Free tier | Auth required | Persistent URL | Latency |
|---|---|---|---|---|
| **ngrok** | 1 agent, 40 req/min | Yes (account) | No (random subdomain) | Low (~20ms) |
| **Cloudflare Tunnel** | Unlimited, no account needed for quick tunnel | No (quick mode) | No | Low (~15ms) |
| **Tailscale Funnel** | Free for personal use | Yes (Tailscale account) | Yes (machine name) | Very low (P2P when possible) |

**Recommendation:** Document all three in the onboarding "Advanced" section. Recommend Cloudflare quick tunnel for one-off use (no account needed), Tailscale for persistent/team use.

#### Option B: Built-in Tunnel (Deferred)

The backend could start a tunnel automatically on launch:
```bash
woof serve --tunnel
# Output: Backend available at https://abc123.trycloudflare.com
```

Implementation: embed `cloudflared` binary or use a Node.js tunnel library. This adds binary distribution complexity and platform-specific builds. **Defer to a future release** — the user-managed approach covers the use case with zero backend code changes.

### Security Implications of Tunnel Exposure

When the backend is exposed via a tunnel, it's publicly accessible on the internet. Security requirements escalate:

1. **Auth is mandatory** — the API key auth from RES.SWAP.ARCH section 4 must be enforced. Without it, anyone with the tunnel URL can access the user's projects, execute agents, and incur API costs.
2. **Rate limiting** — protect against brute-force API key guessing. Backend should enforce rate limiting on auth failures (429 after 10 failed attempts per minute).
3. **Tunnel URL is ephemeral** — ngrok/Cloudflare quick tunnel URLs change on restart, providing some obscurity. Warn users not to share persistent tunnel URLs publicly.
4. **Agent execution risk** — a compromised backend can execute arbitrary code via Claude agents. This is the same trust model as running any server, but worth calling out: "Only expose your backend to networks you trust."

### Backend CORS for Tunnel URLs

When accessed via tunnel, the frontend origin (`https://app.woof.dev`) differs from the backend origin (tunnel URL). The backend CORS configuration (currently hardcoded to localhost ports at server.ts:27-30) must accept the hosted frontend origin.

Two approaches:
1. **Allowlist `app.woof.dev`** — add it to the CORS origin list. Simple, secure, but requires backend code change.
2. **Dynamic CORS** — accept any origin if an API key is provided (authenticated requests bypass CORS restriction). More flexible for multi-frontend scenarios.

**Recommendation:** Approach 1 for v1. Hardcode `https://app.woof.dev` alongside the existing localhost origins. Approach 2 for later when the API contract (RES.SWAP.API) formalizes auth.

---

## 4. Multi-Backend Management

### Storage Model

The hosted frontend stores all connection data in **browser localStorage** (per RES.SWAP.ARCH section 2). Each `BackendConnection` object includes URL, auth token, name, and status.

```
localStorage key: "woof:connections"
localStorage key: "woof:activeConnectionId"
```

### Workspace Switcher

When a user has multiple backends configured, the sidebar footer shows the active connection (per RES.SWAP.ARCH). A click opens a quick-switch dropdown:

```
┌──────────────────────────────┐
│ ● Local Dev                  │  ← active, green dot
│   localhost:3001             │
│                              │
│ ◌ Office Server              │  ← disconnected, grey dot
│   woof.office.internal:3001  │
│                              │
│ ● Home Desktop               │  ← reachable, blue dot
│   abc123.ngrok.app           │
│                              │
│ [Manage Connections]          │  → Settings > Connection
│ [+ Add Backend]               │
└──────────────────────────────┘
```

### Each Backend Is Independent

Each backend is a fully independent Woof instance with its own:
- SQLite database (projects, work items, executions, personas)
- Agent SDK configuration and API keys
- File system context (project directories)
- Execution history and audit log

The frontend does not merge or sync data across backends. Switching backends is like switching between completely different Woof installations. This is a feature, not a limitation — it enables clean separation between work contexts (personal projects vs team projects, dev vs staging).

### Online/Offline Status

The hosted frontend periodically checks each saved backend's health:
- **Active connection:** Health poll every 30 seconds (per RES.SWAP.ARCH section 3)
- **Inactive connections:** Health poll every 5 minutes (lighter touch — just to show status in the switcher)
- **Status display:** Green (connected), amber (last seen <5 min ago), grey (offline), red (auth error)

### Cross-Device Considerations

localStorage is per-browser, per-origin. A user's backend connections on Chrome won't appear in Firefox or on their phone. Options for cross-device sync:

1. **Export/import connections** — "Export connections" button in Settings generates a JSON file. User imports it on another device. Simple, no server dependency.
2. **URL-based sharing** — `https://app.woof.dev/?backend=https://abc123.ngrok.app` pre-fills the connection URL. User still must confirm and enter auth token. Good for sharing with teammates.
3. **Account-based sync (deferred)** — a Woof account that syncs connection configs across devices. Contradicts local-first philosophy. Only consider if a hosted backend tier exists.

**Recommendation:** Export/import for v1, URL parameter for v1 (low effort, high value for team onboarding). Account-based sync deferred.

---

## 5. Hosted Frontend Infrastructure

### What Gets Deployed

The Vite build output is already a pure static SPA:

```
dist/
├── index.html              (< 1 KB)
├── favicon.svg             (< 1 KB)
└── assets/
    ├── index-Cah7ErSp.js   (~1.1 MB, gzipped ~280 KB)
    └── index-B-r09vRA.css  (~90 KB, gzipped ~15 KB)
```

Total: ~1.2 MB uncompressed, ~300 KB gzipped. This is a normal SPA bundle size — well within CDN hosting limits.

**No server-side logic.** The hosted frontend is purely static files. All state lives in the user's backend. The CDN serves HTML/JS/CSS and nothing else.

### CDN Platform Options

| Platform | Free tier | Custom domain | Deploy method | Notes |
|---|---|---|---|---|
| **Vercel** | 100 GB bandwidth/mo | Yes | Git push or CLI | Best DX, automatic previews |
| **Cloudflare Pages** | Unlimited bandwidth | Yes | Git push or CLI | Best performance (edge network) |
| **Netlify** | 100 GB bandwidth/mo | Yes | Git push or CLI | Good DX, form handling |
| **GitHub Pages** | 100 GB bandwidth/mo | Yes | GitHub Actions | Simplest for open-source |
| **AWS S3 + CloudFront** | Pay-per-use | Yes | CLI or CI/CD | Most control, most ops overhead |

**Recommendation:** Cloudflare Pages for production (`app.woof.dev`). Reasons:
- Unlimited bandwidth on free tier — no surprise bills as users grow
- Global edge network — low latency worldwide
- Automatic HTTPS with custom domain
- Direct Git integration for CI/CD
- Workers integration available if server-side logic is ever needed

### CI/CD Pipeline

```
[Push to main] → [GitHub Actions]
  │
  ├── pnpm install
  ├── pnpm --filter @agentops/frontend build
  ├── wrangler pages deploy dist/   ← Cloudflare Pages CLI
  │
  └── Deployed to app.woof.dev in ~60 seconds
```

### Versioning and Compatibility

The hosted frontend and user's local backend may be on different versions. How to handle:

1. **Version check on connect:** The health endpoint returns `version: "0.0.1"` (server.ts:39). The frontend knows its own version from `package.json`. Compare on connection.

2. **Compatibility matrix:**

| Frontend version | Backend version | Result |
|---|---|---|
| Same | Same | Full compatibility |
| Newer | Older | Show warning: "Your backend is outdated. Some features may not work. Run `woof update` to upgrade." Gracefully degrade — hide UI features the backend doesn't support (check `capabilities` from enhanced health response). |
| Older | Newer | Rare (CDN deployment is fast). Backend is backward-compatible — older frontend still works. |

3. **API version header:** Per RES.SWAP.ARCH's enhanced health response, the backend returns `apiVersion: 1`. The frontend checks this:
   - If `apiVersion >= minRequiredVersion` → proceed
   - If `apiVersion < minRequiredVersion` → block with upgrade prompt ("Your backend needs to be updated")

4. **Cache busting:** Vite already generates content-hashed filenames (`index-Cah7ErSp.js`). CDN cache is automatically busted on new deploys. Set `index.html` to `Cache-Control: no-cache` so browsers always get the latest entry point.

### Multiple Frontend Versions (Canary)

For gradual rollouts:
- `app.woof.dev` → stable release
- `canary.woof.dev` → latest main branch
- `v0-2.woof.dev` → pinned version (for users who can't upgrade their backend yet)

Cloudflare Pages supports branch-based preview deployments out of the box.

---

## 6. Business Model Implications

### The Core Principle: Local-First, Free Frontend

The hosted frontend is **free to host and free to use.** It's just static files on a CDN. The cost is negligible:
- ~300 KB per page load (gzipped)
- Cloudflare Pages: unlimited bandwidth on free tier
- Even at 100K monthly active users: CDN cost is effectively $0

### Where Value Lives

All value is in the **backend + agent execution:**

| Component | Where it runs | Cost driver |
|---|---|---|
| Frontend (UI) | CDN / user's browser | ~$0 (static files) |
| Backend (API, DB, orchestration) | User's machine | User's electricity + hardware |
| Agent execution (Claude API calls) | Anthropic's cloud | User's Anthropic API key + usage |
| Data (SQLite DB, files, checkpoints) | User's machine | User's disk |

The user brings their own Anthropic API key and runs the backend on their own machine. Woof's operating cost is the CDN + domain.

### Potential Revenue Models (Future)

If a paid tier is ever considered, it would likely be around the backend, not the frontend:

| Tier | What's included | Who it's for |
|---|---|---|
| **Free (local)** | Hosted frontend + self-hosted backend. Bring your own API key. Full functionality. | Individual developers, hobbyists |
| **Team (managed backend)** | Woof-hosted backend with shared projects, team auth, and centralized billing. | Small teams (2-10 developers) |
| **Enterprise (managed + support)** | Dedicated infrastructure, SSO/SAML, audit logs, SLA. | Organizations |

**Key constraint:** The free local tier must always be fully functional. The hosted frontend is a distribution channel, not a paywall. Users who self-host everything (frontend + backend) should never be disadvantaged.

### Keep Local-First as Primary

The hosted frontend at `app.woof.dev` is a **convenience**, not a requirement. Users can always:
1. Run `pnpm dev` locally for both frontend and backend (current setup)
2. Build the frontend (`pnpm build`) and serve it however they want
3. Use the hosted frontend with their local backend
4. Use the hosted frontend with a tunneled/remote backend

The hosted model lowers the barrier to trying Woof: instead of cloning a monorepo and running `pnpm install && pnpm dev`, a new user installs just the backend package and opens a URL.

### Open Source Compatibility

If Woof is open-source (Apache-2.0 per package.json), the hosted frontend is just a build of the open-source code deployed to a CDN. Anyone can:
- Fork and deploy their own hosted version
- Self-host the frontend on their own infrastructure
- Modify the frontend without affecting the hosted version

The hosted version at `app.woof.dev` is the "official" build, maintained by the team, with guaranteed compatibility with released backend versions.

---

## 7. Implementation Approach

### Prerequisites

This proposal depends on:
1. **RES.SWAP.ARCH Phase 1** — Replace `API_BASE_URL` with `connectionStore.getBaseUrl()`. Without this, the frontend can't connect to a dynamic backend URL.
2. **RES.SWAP.ARCH Phase 2** — Connection management UI (first-run screen, Settings > Connection, sidebar indicator). Without this, there's no way for users to configure their backend.
3. **Backend CORS update** — Accept `https://app.woof.dev` as a valid origin (server.ts:27-30).

### Phase 1: Basic Hosted Deployment

**Goal:** Deploy the frontend to a CDN. Users with a local backend can connect via the first-run screen.

1. Set up Cloudflare Pages project linked to the repo
2. Configure build command: `pnpm --filter @agentops/frontend build`
3. Add `https://app.woof.dev` to backend CORS allowlist
4. Deploy to `app.woof.dev`
5. Add silent localhost:3001 probe on first-run screen

**Scope:** Works for localhost backends only. No tunnel documentation yet.

### Phase 2: Tunnel Support + Multi-Backend

**Goal:** Support remote backends via tunnels. Multiple saved connections.

1. Add tunnel setup documentation to the onboarding flow ("Advanced" section)
2. Implement URL query parameter pre-fill (`?backend=...`)
3. Add connection export/import in Settings
4. Add health polling for inactive connections (workspace switcher status)
5. Enforce API key auth when backend is non-localhost

### Phase 3: Version Compatibility + Polish

**Goal:** Handle version mismatches gracefully. Multiple frontend channels.

1. Implement frontend/backend version comparison on connect
2. Add capability-based feature hiding (disable UI features the backend doesn't support)
3. Set up canary deployment channel (`canary.woof.dev`)
4. Add backend update prompts when version mismatch detected
5. Add "What's new" changelog accessible from the frontend

---

## 8. Cross-References

| Document | Relationship |
|---|---|
| [architecture.md](architecture.md) (RES.SWAP.ARCH) | Foundation: connection store, backend selector UX, health check, WebSocket reconnection, deployment models — this doc builds directly on Models 2 and 3 |
| `docs/proposals/frontend-backend-swappability/api-contract.md` (future — RES.SWAP.API) | API versioning enables frontend/backend compatibility checks; OpenAPI spec ensures any conforming backend works with the hosted frontend |
| `docs/proposals/webhooks/inbound-triggers.md` (RES.WEBHOOKS.INBOUND) | Local-first tunnel challenge (GitHub webhooks need a public URL) overlaps with tunnel guidance in section 3 |
| `docs/proposals/error-recovery/system-resilience.md` (future — RES.RECOVERY.SYSTEM) | Offline/disconnected handling is more critical for hosted frontend (network between frontend and backend is unreliable) |
| `packages/frontend/vite.config.ts` | Build config — no special changes needed for hosted deployment; current Vite config produces CDN-ready output |
| `packages/backend/package.json` | `bin.agentops` (line 8-10) — already has a CLI entry point for npm global install distribution |
| `packages/backend/src/server.ts` | CORS at lines 27-30 (needs `app.woof.dev` added), health at lines 33-41 (version check), listen on `0.0.0.0` via start.ts:212 (already network-accessible) |

---

## 9. Design Decisions

1. **Silent localhost probe on first-run, not multi-port scanning.** Probing `localhost:3001` is harmless and covers the default case. Scanning a port range (3000-3100) would be slow, intrusive, and likely to trigger security software. If the user changed the port, they can type it manually.

2. **User-managed tunnels, not built-in tunnel.** Embedding a tunnel binary (cloudflared, ngrok) adds platform-specific build complexity, binary distribution concerns, and a maintenance burden. Users who need tunnels already know how to use them, and the one-liner commands are simple enough to document. Built-in tunnel can be added later as a convenience feature without architectural changes.

3. **Cloudflare Pages over Vercel/Netlify for hosting.** Unlimited free bandwidth eliminates cost risk as usage grows. The edge network provides the best global performance. Workers integration is available if server-side rendering or edge logic is ever needed. The tradeoff: slightly less polished DX than Vercel, but the cost advantage is decisive for a free product.

4. **No account system for the hosted frontend.** Adding user accounts to a static SPA contradicts local-first principles and adds significant complexity (auth service, user DB, session management). Connection configs live in localStorage — the user's browser IS their account. Cross-device sync is handled by export/import, not by a centralized account.

5. **Backend publishes as an npm global package, not just Docker.** The backend package.json already has `bin.agentops`. Publishing to npm (`npm install -g @woof/backend && woof serve`) is the lowest-friction install path for the target audience (JavaScript/TypeScript developers). Docker is offered as an alternative for users who prefer isolation or don't have Node.js installed.

6. **Version mismatch is a warning, not a blocker.** Blocking the frontend when the backend is slightly behind would frustrate users who can't immediately upgrade. Instead: warn about the mismatch, hide features the backend can't support (via `capabilities` in the health response), and prompt the user to upgrade. Only block when `apiVersion` is below the minimum the frontend can function with.
