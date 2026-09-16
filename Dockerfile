# syntax=docker/dockerfile:1
#
# Single multi-stage Dockerfile for the whole stack.
# Compose selects a stage with `target:` — there are no other Dockerfiles.
#
#   backend-dev       nodemon + source mount (docker-compose.local.yml)
#   backend-runtime   production Express server
#   backend-build     also used by the one-shot `migrate` service
#   frontend-dev      Vite dev server (docker-compose.local.yml)
#   frontend-runtime  nginx serving the built static SPA

# ============ BACKEND ============
FROM node:20-alpine AS backend-deps
RUN apk add --no-cache openssl
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Stays root on purpose: `prisma migrate dev` writes new migration files into
# the bind-mounted prisma/migrations, which a non-root user cannot do through a
# Windows/macOS bind mount. The entrypoint hands the uploads volume to the
# runtime UID so the production image (non-root) can share it.
FROM node:20-alpine AS backend-dev
RUN apk add --no-cache openssl
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm install
COPY backend/ .
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "mkdir -p /app/backend/uploads && chown -R 1001:1001 /app/backend/uploads || true; exec npx nodemon -L src/server.js"]

FROM node:20-alpine AS backend-build
RUN apk add --no-cache openssl
WORKDIR /app/backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ .
RUN npx prisma generate

# Runs as a non-root, fixed-UID user. The UID must match backend-dev: Docker
# only applies image ownership when a named volume is first created, so a
# volume created by one stage must be writable by the other.
FROM node:20-alpine AS backend-runtime
RUN apk add --no-cache openssl
RUN addgroup -g 1001 app && adduser -D -u 1001 -G app app
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=backend-build /app/backend ./
RUN mkdir -p /app/backend/uploads && chown -R app:app /app/backend
USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
CMD ["node", "src/server.js"]

# ============ FRONTEND ============
FROM node:20-alpine AS frontend-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS frontend-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine AS frontend-runtime
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1
