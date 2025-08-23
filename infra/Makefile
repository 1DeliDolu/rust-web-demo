.PHONY: up down logs migrate setup

up:
	docker compose -f infra/docker-compose.yml up -d

down:
	docker compose -f infra/docker-compose.yml down -v

logs:
	docker compose -f infra/docker-compose.yml logs -f

setup: up
	@echo "Waiting for database to be ready..."
	@sleep 10
	@echo "Database is ready. You can now run migrations."
	@echo "Run: cd apps/api && cargo install sqlx-cli && sqlx migrate run"

clean:
	docker compose -f infra/docker-compose.yml down -v
	docker system prune -f
