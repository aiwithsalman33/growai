# Partner.ai — Application Documentation

> SaaS platform for managing Google Business Profiles (GBP): AI-assisted review replies,
> post scheduling, multi-client agency dashboards, and a super-admin control plane.

**Datastore rule:** PostgreSQL in Docker is the only database. No S3, no Redis, no
external managed services. Uploads go to a local volume; post scheduling is a Postgres
poll.

---

## 1. Current state

The stack is complete and runs end to end under Docker. Verified on 2026-09-16 against
the local stack: 45/45 API checks passing, the scheduler publishing a due post, and the
production stack serving through nginx.

| Layer | State | Notes |
|---|---|---|
| Frontend (React/Vite) | ✅ Wired to the API | No mock data anywhere |
| API client | ✅ Real `fetch` | Token refresh, 401 recovery, typed responses |
| Backend | ✅ Runs | 63 routes, entrypoint, services, middleware |
| Prisma schema | ✅ Migrated | 11 models, 2 migrations applied |
| Auth | ✅ Real JWT | Access token in memory, refresh in httpOnly cookie |
| Tenant isolation | ✅ Enforced server-side | Role guard + per-record ownership check |
| Docker (local) | ✅ Healthy | postgres + backend + frontend |
| Docker (prod) | ✅ Healthy | + nginx reverse proxy, one-shot migrate |
| Google GBP | ⚠️ Simulated | Runs without credentials; publishes are logged |
| Anthropic | ⚠️ Needs a key | `ANTHROPIC_API_KEY` unset → clean 503 |
| API verification | ✅ Committed | `make verify` — 56 checks in `scripts/` |
| Unit tests | ❌ None | `jest`/`supertest` installed but unused |

---

## 2. Product

Three isolated portals, each with its own login:

| Portal | Role | Routes | Manages |
|---|---|---|---|
| Single Business | `single` | `/user/*` | One GBP location |
| Agency Partner | `agency` | `/agency/*` | Many client GBP accounts + team |
| Super Admin | `super_admin` | `/admin/*` | Users, agencies, pricing, global settings |

Isolation is enforced in two places. [App.tsx](frontend/src/App.tsx) renders `PortalAccessDenied`
for the wrong portal; the server independently rejects a login aimed at the wrong portal
(403) and every data route runs both a role guard and an ownership check.
`super_admin` can enter the tenant portals for support — that is deliberate, and
impersonation writes an `AuditLog` row.

### Feature modules

- **Dashboard** — KPI cards, trend chart, agency client comparison
- **Posts** — create/schedule/duplicate/reschedule; `STANDARD`, `EVENT`, `OFFER`, `PRODUCT`
- **Reviews** — sync from Google, reply manually, generate an AI reply, auto-reply above a rating floor
- **Photos** — upload to local disk across 8 GBP categories
- **Settings** — profile, GBP connection, AI persona, plan, agency team

---

## 3. Architecture

```
Browser
   │
   ▼
nginx :80 ──┬── /api/      ──► backend :4000 ──► Prisma ──► PostgreSQL 16
            ├── /uploads/  ──►    (same)                    (postgres_data volume)
            └── /          ──► frontend :80 (static SPA)
                                                   backend also writes
                                                   ──► uploads_data volume
```

In local development there is no nginx. Vite serves on `:3000` and proxies `/api` and
`/uploads` to the backend (see `vite.config.ts`), so `VITE_API_URL=/api` is correct in
both modes and nothing has to change when switching between them.

**Build topology.** One `Dockerfile` at the repo root contains every stage. A shared
`deps` stage runs a single `npm ci` for the whole workspace; `backend-dev`,
`backend-build`, `frontend-dev` and `frontend-build` all derive from it, and
`backend-runtime` / `frontend-runtime` are the slim production images. Compose selects
one with `target:`. There are exactly two compose files, each self-contained; they are never layered.
The production one is named `docker-compose.yml` because that is what deploy
platforms look for by default, and its backend applies pending migrations on
startup so a bare `compose up` is a complete deploy.

---

## 4. Tech stack

**Frontend** — React 19, TypeScript, Vite 6, Tailwind 4, recharts, motion, lucide-react,
in the `frontend/` workspace. Built to static files; nginx serves them in production, so
no Node process runs for the frontend in prod.

**Backend** — Node 20, Express 4 (CommonJS), Prisma 5 → PostgreSQL 16, jsonwebtoken +
bcrypt, Joi, pino, express-rate-limit, multer, `@anthropic-ai/sdk`, `googleapis`.

**Removed from the original scaffold:** `aws-sdk`, `redis`, `bullmq`, `stripe`, the
`frontend/` Next.js Dockerfile, `backend/Dockerfile*`, the layered base compose file, and
the Google AI Studio `.env.example`.

---

## 5. Layout

npm workspaces monorepo. **One `node_modules` and one `package-lock.json`, both at
the repo root** — neither workspace carries its own install, and the Docker images
install the same way so container and host trees match.

```
partner.ai/
├─ package.json                # workspace root; scripts delegate with -w
├─ package-lock.json           # the only lockfile
├─ node_modules/               # the only install (hoisted)
├─ .env / .env.example         # one env file for the whole stack
├─ Dockerfile                  # every build stage
├─ docker-compose.yml          # PROD — built images, limits, `migrate` profile
├─ docker-compose.local.yml    # dev — hot reload, bind mounts, DB port exposed
├─ nginx/nginx.conf            # reverse proxy (prod)
├─ nginx/spa.conf              # SPA fallback inside frontend-runtime
├─ Makefile
├─ scripts/
│  ├─ verify-api.mjs           # 56 end-to-end API checks
│  └─ verify-scheduler.mjs     # proves a due post publishes
│
├─ frontend/                   # React + Vite workspace
│  ├─ package.json
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  └─ src/
│     ├─ lib/api/index.ts      #   typed API client — real fetch
│     ├─ lib/store.tsx         #   PartnerProvider, backed by the API
│     ├─ types/                #   shared TS interfaces
│     └─ components/           #   no fixture file: every figure comes from the API
│
└─ backend/                    # Express + Prisma workspace
   ├─ package.json
   ├─ prisma/schema.prisma     # 11 models
   ├─ prisma/migrations/       # init + ai_usage_log
   ├─ prisma/seed.js           # plans, demo users, owner from .env
   └─ src/
      ├─ server.js
      ├─ config/               # env (fail-fast), db, logger (redacting)
      ├─ middleware/           # auth, roleGuard, ownership, rateLimiter, errorHandler
      ├─ services/             # token, crypto, upload, gbp, aiReply, scheduler
      ├─ controllers/          # auth, gbp, posts, reviews, photos, kpis, aiUsage, settings, agency, admin
      └─ routes/               # one file per resource, mounted by routes/index.js
```

---

## 6. Backend

### 6.1 Auth

`tokenService` issues a short-lived access token (15m) and a refresh token (7d). The
access token is returned in the JSON body and held **in memory** by the SPA; the refresh
token is set as an httpOnly, `sameSite=lax` cookie scoped to `/api/auth`, so JavaScript
can never read it. `POST /api/auth/refresh` rotates both.

Login returns the same 401 for an unknown email and a wrong password — the endpoint does
not enumerate accounts. A correct password at the wrong portal returns 403 naming the
right portal.

### 6.2 Authorization — two layers

Role alone is never enough:

1. `requireRole(...)` / `requireExactRole(...)` checks the role claim on the JWT.
   `requireRole` lets `super_admin` through; `requireExactRole` (used on every `/admin`
   route) does not.
2. `resolveGbpAccount` / `resolveOwnedRecord` load the record and confirm the caller owns
   it, attaching it to the request so handlers don't refetch.

Verified: an agency user reading another tenant's account, posts, or editing their post
all return 403.

### 6.3 Services

| Service | Responsibility |
|---|---|
| `tokenService` | bcrypt hashing, JWT issue/verify, `publicUser` strips the hash |
| `cryptoService` | AES-256-GCM for Google OAuth tokens at rest, using `ENCRYPTION_KEY` |
| `uploadService` | multer disk storage, MIME allowlist, traversal-guarded deletes |
| `gbpService` | googleapis wrapper; OAuth, posts, reviews, photos, insights |
| `aiReplyService` | Anthropic `claude-opus-5`, draft-only generation |
| `schedulerService` | Postgres polling loop for due posts |

### 6.4 Scheduling — no queue

`schedulerService.start()` runs from `server.js` on a `setInterval`
(`SCHEDULER_INTERVAL_MS`, default 30s). Each tick selects `GbpPost` rows where
`status='SCHEDULED' AND scheduledAt <= now() AND retryCount < max`, publishes via
`gbpService`, and writes the result back on the row. Failures increment `retryCount` and
store `lastError`; the row stays `SCHEDULED` until retries are exhausted, then flips to
`FAILED`. A `ticking` guard prevents overlapping runs.

Verified live: a due post went `SCHEDULED → PUBLISHED` on the next tick with an
`AuditLog` row, and a post on a disconnected account retried 3× then went `FAILED` with
`lastError = "GBP account is not connected"`.

### 6.5 AI replies

`aiReplyService.generateReply()` builds a system prompt from the account's
`AiReplyConfig.persona` plus hard rules (2–4 sentences, never invent facts, never argue,
no emoji) and calls `claude-opus-5` at `effort: low`. It returns a **draft only** —
publishing is a separate explicit call.

Auto-reply requires both `autoReplyEnabled` and `rating >= autoReplyMinRating`, runs after
a review sync, and writes an `AuditLog` row for every unattended send. A refusal
(`stop_reason: "refusal"`) surfaces as a 422 rather than a fabricated reply. With no API
key configured the endpoint returns 503 — it never invents text.

### 6.6 Uploads — local disk

Files land in `uploads/{bucket}/{uuid}{ext}` on the `uploads_data` volume, with a random
filename (the client-supplied name is discarded), a MIME allowlist, and a 10MB cap.
The database stores a **relative** `/uploads/...` URL, so the same row works behind nginx
in prod and against `localhost:4000` in dev. `removeByUrl` refuses to escape the upload
root.

---

## 7. Database

10 models. `prisma/migrations/20260916100437_init` is applied.

| Model | Notes |
|---|---|
| `User` | `email` unique, `passwordHash`, `role`, optional `plan` relation |
| `GbpAccount` | OAuth tokens **nullable** — a row exists before it is connected |
| `GbpPost` | `retryCount` + `lastError` for the poller; indexed on `(status, scheduledAt)` |
| `GbpReview` | `googleReviewId` unique, so a re-sync updates rather than duplicates |
| `GbpPhoto` | relative URL + category |
| `AiReplyConfig` | 1:1 with an account; `apiKeyMasked` only, never a key |
| `AgencyTeamMember` | **new** — was UI-only before |
| `GlobalPlatformSettings` | **new** — single row |
| `PricingPlan` | `features` Json, `version` bumps on edit |
| `AuditLog` | actor, action, target, metadata |

The earlier schema drift is resolved: `address`, `phone`, `website`, `placeId`,
`category`, `description`, `openingHours`, `healthScore`, `rating`, `reviewsCount` on
`GbpAccount`; `eventTitle`, `couponCode`, `terms`, `viewsCount`, `clicksCount` on
`GbpPost`; `sentiment` on `GbpReview`; `llmProvider`, `modelName`, `apiKeyMasked` on
`AiReplyConfig`.

---

## 8. Frontend

### 8.1 API client

[src/lib/api/index.ts](frontend/src/lib/api/index.ts) holds the access token in a module variable
and sends `credentials: 'include'` so the refresh cookie rides along. On a 401 it calls
`/auth/refresh` once — single-flight, so parallel 401s don't stampede — and retries. If
refresh fails it clears the token and fires the store's unauthenticated handler, which
routes to the right login portal.

Nullable columns are normalized at this boundary so the UI's non-optional types hold.

### 8.2 Store

[src/lib/store.tsx](frontend/src/lib/store.tsx) keeps the same context surface as before, so no
feature component needed changes. Every mutator now calls the API and folds the response
into state; failures raise a toast, and the ones that return a value rethrow.

`localStorage` holds only the current path. Session and business data come from the API.

Two signatures changed, both unavoidable:

- `signup(role, name, email, companyName, password)` — real signup needs a password, so
  both signup pages gained a password field.
- `uploadPhoto(photoData, file?)` — a real upload needs the `File`.

`gbpAccounts` was also added to the context. Three settings components already read that
name; it was never provided, so it had been silently `undefined` since before this work.

### 8.3 KPIs stay synchronous

`getKpisForAccount(accountId, period)` is called during render, so it cannot become
async. It reads a cache keyed `accountId:period`, and on a miss fires a background fetch
and returns **zeros** — never invented numbers. The cache clears when the active account
or the underlying collections change.

---

## 9. Running it

### Local

```bash
cp .env.example .env
make up
make migrate
make seed
```

Frontend <http://localhost:3000> · API <http://localhost:4000/api> · Postgres `:5432`.

Seeded accounts, password `Partner.ai2024`:
`elena@artisanroast.com` (`/login/user`), `marcus@peakscalemedia.com` (`/login/agency`),
`alex@partner.ai` (`/login/admin`).

### Production

```bash
# set VITE_API_URL=/api first — it is baked into the bundle at build time
make prod
make prod-migrate
```

Everything is served from `http://localhost` through nginx.

---

## 10. Environment

See [.env.example](.env.example). Two things bite if you get them wrong:

- `DATABASE_URL` host must be `postgres` (the compose service name), not `localhost`.
- `VITE_API_URL` is compiled into the bundle. `/api` for production (nginx proxies it),
  `http://localhost:4000/api` for local dev.

Generate `ENCRYPTION_KEY` with `openssl rand -hex 32` — it must be 64 hex characters, and
the server refuses to start otherwise.

Without Google credentials `gbpService` runs simulated: publishes and replies are logged,
reads return empty. `GET /api/health` reports `google: not_configured`.

---

## 11. Verification performed

| Area | Result |
|---|---|
| API suite (45 checks) | All passing |
| Portal isolation | Wrong-portal login 403; no account enumeration |
| Tenant isolation | Cross-tenant account/post reads and edits 403 |
| Role guards | `single`/`agency` blocked from `/admin`; `super_admin` allowed |
| Validation | Bad enum, missing `scheduledAt`, short password, duplicate email all rejected |
| Plan limits | 2nd account on a 1-account plan → 402 |
| Uploads | PNG stored and served; shell script rejected 415 |
| Scheduler | Due post published; disconnected account retried 3× then FAILED |
| Prod via nginx | SPA, deep-link fallback, `/api/`, `/uploads/`, auth all 200 |
| Typecheck / build | `tsc --noEmit` clean; `vite build` succeeds |

Re-run any time with `make verify`, `make verify-scheduler`, `make verify-prod`.

Three real bugs were found and fixed during this: Prisma's engine needed the
`linux-musl-openssl-3.0.x` binary target on Alpine; nodemon needed `-L` because inotify
does not cross a Windows bind mount; and the container healthchecks had to use
`127.0.0.1` because busybox `wget` tries `::1` for `localhost` while nginx binds IPv4
only. A fourth — Joi's default email TLD allowlist rejecting valid addresses with a 400 —
was caught by the test suite.

---

## 12. Mock data removal

Every fixture the UI once rendered is gone; each was replaced with a real source
rather than deleted.

| Was | Now |
|---|---|
| `MOCK_TIMESERIES` in `frontend/src/lib/mockData.ts` | `GET /api/kpis/timeseries` — real review/post counts per bucket, Google engagement when connected |
| Four hardcoded chart footer totals with invented trend percentages | Summed from the same series the chart draws |
| `SAMPLE_USAGE_LOGS` in the AI usage panel | `GET /api/ai-usage`, backed by an `AiUsageLog` row per generation with Anthropic-reported tokens |
| Role-based fake counters (`248`/`840` replies, `$1.42`/`$4.88`) | Aggregated from those rows; quota comes from the plan |
| Hardcoded Google client ID + `GOCSPX-…mockSecret` in settings | Server reports configured/not-configured; credentials never reach the browser |
| Simulated "ping latency: 42ms" and a 1s fake re-sync | Real `/api/health` probe and a real review sync |
| `accounts/10928374910283` fallback account id | "Not connected" |
| Admin agency cards: `3 Managed`, `3 Seats`, `Feb 2024`, `$199 / mo`, "Last active: 10 minutes ago" | Real counts, plan price and signup date; the invented last-active line is gone |
| A 2FA/TOTP input labelled "Mock 6-digit" | Removed — it validated nothing, so it implied a control that did not exist |

`frontend/src/lib/mockData.ts` was deleted. `grep -riE "mock|sample_|dummy|fake" frontend/src/` returns nothing.

## 13. Known gaps

1. **`churnRate`, `totalTokensMonth`, `googleApiQuotaUsed` report `0`.** Nothing measures
   them. Zeroed rather than invented.
2. **Insight trend percentages return `0`** — each needs a second Google call per account
   per period.
3. **No unit tests.** The end-to-end checks now live in `scripts/verify-api.mjs` and
   `scripts/verify-scheduler.mjs` (`make verify`), but they exercise a running stack.
   Unit-level coverage with `jest` + `supertest` in `backend/tests/` is still missing.
4. **Scheduler is single-instance.** The overlap guard is in-process, so running two
   backend replicas could double-publish. A `SELECT ... FOR UPDATE SKIP LOCKED` claim, or
   an intermediate `PUBLISHING` status, would be needed to scale out.
5. **Review sync is manual** (`POST /api/reviews/sync`). `gbpSyncIntervalMinutes` exists
   in settings but nothing polls Google on a timer yet.
6. **Agency team members are records, not logins.** Inviting one stores a row; it does not
   create a `User` or send an email.
