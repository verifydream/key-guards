.PHONY: dev build start stop restart clean migrate seed docker-up docker-down docker-build lint

# ─── Local Development ───────────────────────────────────────

dev:
	@echo "Starting dev server on http://localhost:3000"
	npm run dev

build:
	npm run build

start:
	npm run start

# ─── Database ────────────────────────────────────────────────

migrate:
	npx prisma migrate dev

migrate-prod:
	npx prisma migrate deploy

studio:
	npx prisma studio

# ─── Docker ──────────────────────────────────────────────────

docker-build:
	docker compose build

docker-up:
	docker compose up -d
	@echo "Running at http://localhost:3100"

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f app

docker-restart:
	docker compose restart

docker-clean:
	docker compose down -v
	@echo "Volumes removed"

# ─── PM2 (VPS) ──────────────────────────────────────────────

pm2-start:
	PORT=3100 HOSTNAME=0.0.0.0 pm2 start npm --name keyguard -- start

pm2-stop:
	pm2 stop keyguard

pm2-restart:
	pm2 restart keyguard

pm2-logs:
	pm2 logs keyguard --lines 50

# ─── Utility ─────────────────────────────────────────────────

lint:
	npm run lint

clean:
	rm -rf .next node_modules .prisma
	npm install

reset-db:
	rm -f prisma/prod.db prisma/dev.db
	npx prisma migrate dev
	@echo "Database reset complete"
