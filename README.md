# KadryHR v2

KadryHR to nowoczesna platforma do planowania grafików pracy, rejestracji czasu pracy (RCP) oraz ewidencji godzin w jednym systemie.

## Wymagania

- Node.js 20+
- pnpm 9+
- Docker (opcjonalnie do uruchomienia całego środowiska)

## Szybki start (lokalnie)

1. Zainstaluj zależności:
   ```bash
   pnpm install
   ```
2. Utwórz plik `.env` na podstawie `.env.example`.
3. Uruchom aplikacje:
   ```bash
   pnpm dev:web
   pnpm dev:api
   ```

## Docker

Uruchom całe środowisko (Postgres + API + Web):

```bash
docker compose up --build
```

Aplikacje będą dostępne pod adresami:
- Web: http://localhost:8080
- API: http://localhost:4000/health

## Struktura repozytorium

- `apps/web` – Next.js (marketing + przyszły panel)
- `apps/api` – NestJS API + Prisma
- `packages/ui` – współdzielone komponenty UI KadryHR
- `packages/config` – współdzielone konfiguracje i typy
- `infra` – infrastruktura i przyszłe szablony

## Przydatne komendy

- `pnpm build:web` – build aplikacji web
- `pnpm build:api` – build API
- `pnpm lint` – lint frontend
