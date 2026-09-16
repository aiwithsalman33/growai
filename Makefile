LOCAL := docker compose -f docker-compose.local.yml
PROD  := docker compose -f docker-compose.yml

.PHONY: install up down logs ps build migrate migrate-create seed studio prod prod-down prod-migrate prod-logs test verify verify-scheduler verify-prod shell-backend shell-frontend shell-db clean

## --- local dev ---
up:            ## start the dev stack
	$(LOCAL) up --build

down:          ## stop the dev stack
	$(LOCAL) down

logs:          ## tail all dev logs
	$(LOCAL) logs -f

ps:            ## show dev service status
	$(LOCAL) ps

build:         ## rebuild dev images without starting
	$(LOCAL) build

migrate:       ## apply migrations in the running dev backend
	$(LOCAL) exec backend npx prisma migrate dev

migrate-create: ## create a named migration: make migrate-create NAME=add_x
	$(LOCAL) exec backend npx prisma migrate dev --name $(NAME)

seed:          ## seed plans, demo users and the platform owner from .env
	$(LOCAL) exec backend npm run seed

studio:        ## open Prisma Studio against the dev DB
	$(LOCAL) exec backend npx prisma studio

install:       ## install every workspace into the shared root node_modules
	npm install

test:          ## run the backend test suite
	$(LOCAL) exec backend npm test

verify:        ## run the API verification suite against the running stack
	node scripts/verify-api.mjs

verify-scheduler: ## prove the post scheduler publishes a due post (~40s)
	node scripts/verify-scheduler.mjs

verify-prod:   ## run the API verification suite through the prod nginx proxy
	API_URL=http://localhost:$${NGINX_PORT:-80}/api node scripts/verify-api.mjs

shell-backend: ## shell into the backend container
	$(LOCAL) exec backend sh

shell-frontend: ## shell into the frontend container
	$(LOCAL) exec frontend sh

shell-db:      ## psql into the dev database
	$(LOCAL) exec postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-partnerai}

## --- production ---
prod:          ## start the prod stack detached
	$(PROD) up -d --build

prod-down:     ## stop the prod stack
	$(PROD) down

prod-migrate:  ## run migrations once against prod
	$(PROD) run --rm migrate

prod-logs:     ## tail prod logs
	$(PROD) logs -f

## --- housekeeping ---
clean:         ## stop everything and delete volumes (DESTROYS THE DATABASE)
	$(LOCAL) down -v
