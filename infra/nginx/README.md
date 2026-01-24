# Nginx reverse proxy (KadryHR)

## Konfiguracja

Plik `kadryhr.conf` ustawia reverse proxy dla:

- `https://kadryhr.pl` → frontend Next.js
- `https://kadryhr.pl/api` → backend NestJS

Przy wdrożeniu na serwerze ustaw właściwe hosty lub upstreamy (np. `kadryhr-web:3000`, `kadryhr-api:4000`)
oraz certyfikaty TLS.
