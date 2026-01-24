# Nginx reverse proxy (KadryHR)

## Konfiguracja

Plik `kadryhr.conf` ustawia reverse proxy dla:

- `https://kadryhr.pl` → frontend Next.js
- `https://kadryhr.pl/api` → backend NestJS

Przy wdrożeniu na serwerze ustaw właściwe hosty lub upstreamy (np. `127.0.0.1:3000`, `127.0.0.1:4000`)
oraz certyfikaty TLS.
