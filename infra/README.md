# ForestCatering infra

## Theme deploy (`forestcatering-premium`)

Run end-to-end deployment (copy theme, activate, clear cache, smoke check):

```bash
cd infra && ./scripts/theme-deploy.sh
```

Script behavior:

1. Detects running `prestashop` container via `docker compose ps -q prestashop`.
2. Copies `infra/theme/forestcatering-premium` to `/var/www/html/themes/forestcatering-premium`.
3. Fixes ownership to `www-data:www-data`.
4. Clears PrestaShop cache.
5. Activates theme via database update (`PS_THEME_NAME`, `ps_shop.theme_name`, `ps_shop.id_theme` if theme id exists).
6. Smoke-checks front office using `curl http://127.0.0.1:8080/` and prints Apache logs on failure.

Successful run prints:

- `OK`
- `active_theme=forestcatering-premium`

## Smoke runbook

Run:

```bash
cd infra
./scripts/smoke.sh
```

Logs are written to `infra/logs/run-<timestamp>/`.
