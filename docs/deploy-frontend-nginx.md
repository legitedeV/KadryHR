# Deploying frontend-v2 behind nginx

KadryHR frontend uses Next.js (app router + Tailwind). Serve it with the built-in Next server and let nginx reverse-proxy to it — do **not** try to serve a static `dist` folder.

## Build and run on the server

```bash
cd /home/deploy/apps/kadryhr-app/frontend-v2
npm ci
npm run build
npm run start -- -p 3000   # add -H 0.0.0.0 if you bind externally
```

Keep the process alive with your preferred supervisor (e.g. `pm2 start npm --name kadryhr-frontend -- start -- -p 3000`).

## nginx reverse proxy (HTTPS)

This example assumes Let’s Encrypt certificates already exist under `/etc/letsencrypt/live/kadryhr.pl/`.

```nginx
# HTTP -> HTTPS redirect
server {
  listen 80;
  server_name kadryhr.pl www.kadryhr.pl;
  return 301 https://kadryhr.pl$request_uri;
}

# HTTPS -> Next.js
server {
  listen 443 ssl http2;
  server_name kadryhr.pl www.kadryhr.pl;

  ssl_certificate     /etc/letsencrypt/live/kadryhr.pl/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/kadryhr.pl/privkey.pem;

  location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
  }
}
```

Reload nginx after updating the config:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

With this setup, `_next/static` assets and the landing page are served by the Next server, avoiding the unstyled HTML caused by pointing nginx to a non-existent static `dist` output.
