# KadryHR Infra Setup

Poniżej znajduje się zebrana konfiguracja infrastruktury (Docker Compose + zmienne środowiskowe), potrzebna do uruchomienia KadryHR w środowisku produkcyjnym.

## Wymagane zmienne środowiskowe

Wszystkie zmienne są zebrane w `.env.example`. Skopiuj do `.env` i uzupełnij:

- **Baza danych**: `DATABASE_URL`
- **Redis**: `REDIS_URL`
- **MinIO**:
  - `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
  - `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - `MINIO_BUCKET_AVATARS`, `MINIO_BUCKET_FILES`
  - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`
- **OAuth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- **Email**: `EMAIL_PROVIDER`, `EMAIL_FROM`, `EMAIL_API_KEY`
- **Domeny i cookies**: `LANDING_DOMAIN`, `PANEL_DOMAIN`, `ADMIN_DOMAIN`, `COOKIE_DOMAIN`
- **Baza URL**: `APP_BASE_URL` (np. `https://kadryhr.pl`)

## MinIO (zdrowie + storage)

1. Upewnij się, że masz katalog na dane MinIO:
   ```
   infra/minio/data
   ```
2. Ustaw poprawne hasła w `.env`:
   - `MINIO_ROOT_USER` (min. 3 znaki)
   - `MINIO_ROOT_PASSWORD` (min. 8 znaków)
3. Docker Compose montuje dane:
   ```
   ./infra/minio/data:/data
   ```
4. Healthcheck używa endpointu:
   ```
   http://localhost:9000/minio/health/live
   ```

## Google OAuth

1. Utwórz OAuth Client w Google Cloud Console.
2. Dodaj Redirect URI:
   - `https://kadryhr.pl/api/auth/google/callback`
3. Uzupełnij `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI=https://kadryhr.pl/api/auth/google/callback`

## Email (Postmark)

1. Utwórz serwer w Postmark.
2. Wygeneruj API Key.
3. Ustaw:
   - `EMAIL_PROVIDER=postmark`
   - `EMAIL_API_KEY=...`
   - `EMAIL_FROM="KadryHR <no-reply@kadryhr.pl>"`

## SSL/TLS (Nginx + Let's Encrypt)

W `infra/nginx/` znajduje się przykładowy setup:

1. Zaktualizuj DNS:
   - `kadryhr.pl`, `panel.kadryhr.pl`, `admin.kadryhr.pl` → IP VPS
2. Uruchom:
   ```
   docker compose -f infra/nginx/docker-compose.yml up -d
   ```
3. Wykonaj inicjalne uzyskanie certyfikatu:
   ```
   docker exec -it kadryhr-certbot certbot certonly --webroot -w /var/www/certbot \
     -d kadryhr.pl -d panel.kadryhr.pl -d admin.kadryhr.pl --email admin@kadryhr.pl --agree-tos --no-eff-email
   ```
4. Nginx korzysta z certyfikatów w `infra/nginx/certbot/conf`.
5. Po odnowieniu certyfikatu zrestartuj Nginx:
   ```
   docker exec kadryhr-nginx nginx -s reload
   ```
