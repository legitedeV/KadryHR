# ForestCatering infra

## PrestaShop theme activation (`forestcatering-premium`)

1. Ensure the stack is running:
   ```bash
   cd infra
   docker compose --env-file .env -f compose.yml up -d
   ```
2. The theme is mounted to `/var/www/html/themes/forestcatering-premium` by `compose.yml`.
3. Repair locale/shop DB metadata if needed:
   ```bash
   ./scripts/fix-prestashop-db.sh
   ```
4. In Back Office, go to **Design → Theme & Logo**, then activate **Forest Catering Premium**.
5. Clear cache after activation:
   ```bash
   docker compose --env-file .env -f compose.yml exec prestashop sh -lc 'rm -rf /var/www/html/var/cache/*'
   ```

## Smoke runbook

Run:

```bash
cd infra
./scripts/smoke.sh
```

Logs are written to `infra/logs/run-<timestamp>/`.
