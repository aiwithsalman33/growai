# syntax=docker/dockerfile:1
#
# Single multi-stage Dockerfile for the whole monorepo.
# Compose selects a stage with `target:` — there are no other Dockerfiles.
#
#   backend-dev       nodemon + source mount (docker-compose.local.yml)
#   backend-build     also used by the one-shot `migrate` service
#   backend-runtime   production Express server
#   frontend-dev      Vite dev server (docker-compose.local.yml)
#   frontend-runtime  nginx serving the built static SPA
#
# This is an npm workspaces monorepo: one lockfile and one node_modules at /app,
# shared by both workspaces. Every stage installs from the root so the tree is
# resolved and hoisted once, exactly as on a developer machine.

# ---------------------------------------------------------------------------
# Shared dependency layer. Only the manifests are copied first, so editing
# source does not invalidate the install cache.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci

# ============ BACKEND ============

# Stays root on purpose: `prisma migrate dev` writes new migration files into
# the bind-mounted backend/prisma/migrations, which a non-root user cannot do
# through a Windows/macOS bind mount. The command hands the uploads volume to
# the runtime UID so the production image (non-root) can share it.
FROM deps AS backend-dev
WORKDIR /app
COPY backend/ backend/
RUN npm run prisma --workspace backend -- generate
WORKDIR /app/backend
EXPOSE 4000
CMD ["sh", "-c", "mkdir -p /app/backend/uploads && chown -R 1001:1001 /app/backend/uploads || true; exec npx nodemon -L src/server.js"]

FROM deps AS backend-build
WORKDIR /app
COPY backend/ backend/
RUN npm run prisma --workspace backend -- generate
WORKDIR /app/backend

# Runs as a non-root, fixed-UID user. The UID must match the one the dev
# container chowns to: Docker only applies image ownership when a named volume
# is first created, so a volume created by one stage must be writable by the other.
FROM node:20-alpine AS backend-runtime
RUN apk add --no-cache openssl
RUN addgroup -g 1001 app && adduser -D -u 1001 -G app app
ENV NODE_ENV=production
WORKDIR /app
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/package.json ./package.json
COPY --from=backend-build /app/backend ./backend
RUN mkdir -p /app/backend/uploads && chown -R app:app /app
# Applies pending migrations before the server starts, so a platform that only
# runs `compose up` still gets a schema. See backend/docker-entrypoint.sh.
RUN chmod +x /app/backend/docker-entrypoint.sh
USER app
WORKDIR /app/backend
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
ENTRYPOINT ["/app/backend/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]

# ============ FRONTEND ============
FROM deps AS frontend-dev
WORKDIR /app
COPY frontend/ frontend/
WORKDIR /app/frontend
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS frontend-build
WORKDIR /app
COPY frontend/ frontend/
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace frontend

FROM nginx:alpine AS frontend-runtime
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1
