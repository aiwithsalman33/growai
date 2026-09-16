#!/bin/sh
# Production container entrypoint.
#
# A platform like Dokploy, Coolify or Render only runs `compose up` — there is
# no separate step to apply migrations, so a fresh deploy would otherwise come
# up against an empty database and fail every request. Applying them here makes
# the container self-sufficient.
#
# `migrate deploy` only applies migrations that already exist in the image. It
# never generates one and never resets data, so it is safe to run on every boot.
set -e

echo "[entrypoint] Applying database migrations..."
if npx prisma migrate deploy; then
  echo "[entrypoint] Migrations up to date."
else
  echo "[entrypoint] ERROR: migrations failed. Refusing to start with a schema the code does not expect." >&2
  exit 1
fi

# Opt-in, and idempotent: seeds plans, the demo accounts and the platform owner
# from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD. Leave unset after the first
# deploy unless you want the seeded passwords reset on every restart.
if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] RUN_SEED=true — seeding..."
  npm run seed || echo "[entrypoint] WARNING: seed failed; continuing." >&2
fi

echo "[entrypoint] Starting API..."
exec "$@"
