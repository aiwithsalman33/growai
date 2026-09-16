# Partner.ai

SaaS platform for managing Google Business Profiles (GBP) — AI-assisted review replies,
post scheduling, multi-client agency dashboards, and a super-admin control plane.

Three isolated portals:

| Portal | Role | Routes | Manages |
|---|---|---|---|
| Single Business | `single` | `/user/*` | One connected GBP location |
| Agency Partner | `agency` | `/agency/*` | Many client GBP accounts + team members |
| Super Admin | `super_admin` | `/admin/*` | All users, agencies, pricing plans, global settings |

---

## Quick start

```bash
cp .env.example .env          # then fill in the secrets
make up                       # or: docker compose -f docker-compose.local.yml up --build
make migrate                  # create the database schema
make seed                     # demo users, plans and locations
```

- Frontend: <http://localhost:3000>
- API: <http://localhost:4000/api>
- Health: <http://localhost:4000/api/health>
- Postgres: `localhost:5432`

Seeded accounts (demo password `Partner.ai2024`, override with `SEED_PASSWORD`):

| Email | Portal |
|---|---|
| `elena@artisanroast.com` | `/login/user` |
| `marcus@peakscalemedia.com` | `/login/agency` |
| `alex@partner.ai` | `/login/admin` |

The platform owner is seeded separately from `SUPER_ADMIN_EMAIL` /
`SUPER_ADMIN_PASSWORD` in `.env` and also signs in at `/login/admin`. Changing
that password and re-running `make seed` rotates the credential.

Each portal only accepts its own role — signing in at the wrong door is rejected by the
server, not just the UI.

---

## Production

```bash
make prod                     # docker compose -f docker-compose.prod.yml up -d --build
make prod-migrate             # docker compose -f docker-compose.prod.yml run --rm migrate
```

Nginx listens on `:80` and proxies `/api/` and `/uploads/` to the backend, everything
else to the static SPA.

`VITE_API_URL` is `/api` and works unchanged in both modes: nginx proxies it in
production, and the Vite dev server proxies `/api` and `/uploads` to the backend in
development (see `vite.config.ts`). It is compiled into the bundle at build time, so
change it before `make prod`, not after.

Run `make` targets from the repo root: `make logs`, `make ps`, `make shell-db`,
`make down`, `make clean` (drops volumes — destroys the database).

---

## Architecture

```
Browser → nginx :80 ─┬─ /api/, /uploads/ → backend :4000 → Prisma → PostgreSQL 16
                     └─ /                → frontend :80 (static SPA)
```

- **Frontend** — React 19 + TypeScript, Vite 6, Tailwind 4. Lives at the repo root
  (`src/`, `index.html`, `vite.config.ts`). Built to static files and served by nginx;
  no Node process in production.
- **Backend** — Node 20, Express 4, Prisma 5, JWT auth (access token in memory, refresh
  token in an httpOnly cookie), Anthropic for AI review replies, googleapis for GBP.
- **Database** — PostgreSQL 16 in Docker, on the `postgres_data` volume. **The only
  datastore.** No Redis, no object storage, no external managed database.
- **Uploads** — local disk on the `uploads_data` volume, served at `/uploads/*`.
  There is no S3 in this stack; `backend/src/services/uploadService.js` is the single
  seam if that ever changes.
- **Scheduling** — a Postgres poll, not a queue. `schedulerService.js` asks every ~30s
  for `GbpPost` rows where `status='SCHEDULED' AND scheduledAt <= now()`, publishes them,
  and counts retries on the row itself.

One `Dockerfile` at the repo root holds every stage (`backend-dev`, `backend-runtime`,
`backend-build`, `frontend-dev`, `frontend-runtime`); compose picks one with `target:`.
There are exactly two compose files and each is self-contained — do not layer them.

---

## Layout

```
partner.ai/
├─ Dockerfile                  # every build stage
├─ docker-compose.local.yml    # dev: hot reload, bind mounts, exposed DB port
├─ docker-compose.prod.yml     # prod: built images, restart policies, limits
├─ nginx/{nginx.conf,spa.conf} # reverse proxy / SPA fallback
├─ Makefile
├─ scripts/                    # verify-api.mjs, verify-scheduler.mjs
├─ src/                        # React frontend
│  ├─ lib/api/index.ts         #   typed API client
│  ├─ lib/store.tsx            #   PartnerProvider — state, backed by the API
│  └─ components/              #   auth, user, agency, admin, feature modules
└─ backend/
   ├─ prisma/{schema.prisma,seed.js}
   └─ src/
      ├─ server.js             # entrypoint
      ├─ config/               # env, db, logger
      ├─ middleware/           # auth, roleGuard, ownership, rateLimiter, errorHandler
      ├─ services/             # token, crypto, upload, gbp, aiReply, scheduler
      ├─ controllers/
      └─ routes/
```

---

## API

`GET /api/health` reports database reachability and whether Google credentials are
configured. Full route list: `backend/src/routes/`.

```
POST   /api/auth/{user,agency}/signup     POST /api/auth/{user,agency,admin}/login
POST   /api/auth/refresh                  POST /api/auth/logout
GET    /api/auth/me                       PATCH /api/auth/me
GET    /api/gbp                           POST /api/gbp
POST   /api/gbp/:id/oauth/start           GET  /api/gbp/oauth/callback
GET    /api/gbp/:id/ai-config             PUT  /api/gbp/:id/ai-config
GET    /api/posts                         POST /api/posts
POST   /api/posts/:id/{publish,reschedule,duplicate}
GET    /api/reviews                       POST /api/reviews/sync
POST   /api/reviews/:id/ai-reply          POST /api/reviews/:id/reply
GET    /api/photos                        POST /api/photos
GET    /api/kpis/{summary,comparison,timeseries}
GET    /api/ai-usage                      GET  /api/ai-usage/by-account
GET    /api/agency/{clients,team}
GET    /api/admin/{stats,users,agencies,pricing,settings,audit-log}
POST   /api/admin/users/:id/impersonate
```

Authorization is two-layer: `requireRole` checks the role on the JWT, then
`resolveGbpAccount` / `resolveOwnedRecord` confirm the caller actually owns the record.
Role alone never grants access to another tenant's data.

---

## Verification

With the stack running and seeded:

```bash
make verify              # 56 API checks: auth, isolation, guards, uploads, limits,
                         #   trend series, AI usage metering
make verify-scheduler    # proves a due post publishes (~40s, one poll cycle)
make verify-prod         # same API suite through the prod nginx proxy
```

`make verify` covers portal isolation, cross-tenant blocks, role guards, input
validation, plan limits, upload handling and the audit log. It needs `make seed` first.

---

## Environment

See [.env.example](.env.example). `DATABASE_URL` must point at host `postgres` (the
compose service name), not `localhost`. Generate `ENCRYPTION_KEY` — used to encrypt
Google OAuth tokens at rest — with `openssl rand -hex 32`; it must be 64 hex characters
or the server refuses to start.

Without `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` the GBP service runs in a simulated
mode: publishing and replying are logged rather than sent, so the rest of the stack can
be exercised before OAuth is set up. `GET /api/health` reports which mode is active.

---

## No mock data

Every figure in the UI comes from the API. There is no fixture file in the repo.

- The dashboard trend chart reads `/api/kpis/timeseries`. Review and post counts come
  from our own tables; impressions, calls, directions and clicks come from Google and
  stay at zero until a location is connected — the chart says so rather than drawing
  invented lines.
- The AI usage panel reads `/api/ai-usage`, backed by one `AiUsageLog` row written per
  generation with the token counts Anthropic reports and a cost derived from them.
- Admin agency cards show real account counts, seat counts and signup dates.
- Google OAuth credentials are never sent to the browser; the settings panel reports
  only whether the server has them configured.

## Known gaps

- `adminPlatformStats` reports `churnRate`, `totalTokensMonth` and `googleApiQuotaUsed`
  as `0`; nothing measures them yet. They are zeroed rather than invented.
- Insight trend percentages (`viewsTrend`, etc.) return `0` — computing them needs a
  second Google call per account per period.
- No unit tests yet (`jest`/`supertest` are installed). The end-to-end checks in
  `scripts/` cover the API surface instead — see Verification above.

## License

MIT
