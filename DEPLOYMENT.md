# Deploying Partner.ai

The production stack is `docker-compose.yml` at the repo root — the filename
every deploy platform looks for by default. `docker-compose.local.yml` is the
development counterpart and is never used in deployment.

```bash
docker compose up -d --build
```

The backend applies pending migrations on startup
([backend/docker-entrypoint.sh](backend/docker-entrypoint.sh)), so a platform
that only runs `compose up` still gets a schema. No separate migration step is
required.

---

## Dokploy

### 1. Create the application

New project → **Compose**. Point it at the repository and branch `main`.
Leave the compose path at its default (`./docker-compose.yml`).

### 2. Fill in the Environment tab

**This is required.** The compose file uses `env_file: .env`, and Dokploy
creates that file from this tab. If it is empty the deploy fails before any
container starts.

Copy [.env.example](.env.example) and set real values. The four that must not
keep their placeholders:

| Variable | How to generate |
|---|---|
| `POSTGRES_PASSWORD` | any strong password — must match `DATABASE_URL` |
| `JWT_ACCESS_SECRET` | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` — exactly 64 hex characters |

Deployment-specific values:

```dotenv
# The managed host already runs Traefik on :80. Publish nginx somewhere free
# and point the Dokploy domain at that port.
NGINX_PORT=8080

# First deploy only — creates the plans, demo users and the platform owner.
# Set back to false afterwards, or every restart resets those passwords.
RUN_SEED=true

# Must reach the database container, not localhost.
DATABASE_URL=postgresql://<user>:<password>@postgres:5432/<db>

# Relative on purpose, so the same image works on any hostname.
VITE_API_URL=/api

# Your real domain — used for CORS and the OAuth redirect back into the app.
FRONTEND_ORIGIN=https://your-domain.com
GOOGLE_REDIRECT_URI=https://your-domain.com/api/gbp/oauth/callback
```

`NODE_ENV` is pinned to `production` by the compose file, so it cannot be
weakened by a stray value here.

### 3. Add the domain

Domains tab → service **nginx**, container port **80**. Enable HTTPS.

### 4. Deploy, then turn the seed off

After the first successful deploy, set `RUN_SEED=false` and redeploy. Sign in
at `https://your-domain.com/login/admin` with `SUPER_ADMIN_EMAIL` /
`SUPER_ADMIN_PASSWORD`, then change that password.

---

## Troubleshooting

**"Compose file not found"** — the platform is looking for a path that does not
exist. This repo's production file is `./docker-compose.yml`.

**"port is already allocated"** — something already owns `:80` on the host
(Traefik, on Dokploy). Set `NGINX_PORT` to a free port.

**"env file .env not found"** — the Environment tab is empty. See step 2.

**Every API call returns 500, logs mention a missing table** — migrations did
not run. Check the backend logs for `[entrypoint] Applying database
migrations...`; the entrypoint exits non-zero and refuses to start the server if
they fail, so the container will be restarting rather than serving.

**Cannot sign in on a fresh deploy** — the database has no users until the seed
runs. Set `RUN_SEED=true` and redeploy once.

**Server exits with "ENCRYPTION_KEY must be 32 bytes"** — the key must be
exactly 64 hex characters. `openssl rand -hex 32`.

**Uploads return 500 with EACCES** — the `uploads_data` volume was created by a
container running as a different user. `docker compose down -v` discards it
(along with the database), or chown it to `1001:1001` from the host.

---

## Other platforms

Nothing here is Dokploy-specific. On any Docker host:

```bash
cp .env.example .env     # fill it in
docker compose up -d --build
```

The stack serves on `http://<host>:${NGINX_PORT:-80}`. Put your own TLS
terminator in front and set `FRONTEND_ORIGIN` to the public URL.

Persistent state lives in two named volumes — `postgres_data` and
`uploads_data`. Back both up; `docker compose down -v` destroys them.
