# 🔒 SSL Setup Guide for KadryHR

This guide will help you set up HTTPS/SSL for your KadryHR application using Let's Encrypt (free SSL certificates).

## Prerequisites

- Domain name pointing to your server (e.g., kadryhr.pl)
- Root or sudo access to the server
- Nginx installed
- Ports 80 and 443 open in firewall

## Step 1: Install Certbot

Certbot is the official Let's Encrypt client for obtaining SSL certificates.

### For Ubuntu/Debian:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### For Amazon Linux 2023:
```bash
sudo dnf install certbot python3-certbot-nginx -y
```

### For CentOS/RHEL:
```bash
sudo yum install certbot python3-certbot-nginx -y
```

## Step 2: Verify Domain DNS

Make sure your domain points to your server's IP address:

```bash
# Check DNS resolution
dig kadryhr.pl +short
# or
nslookup kadryhr.pl

# Should return your server's IP address
```

## Step 3: Stop Nginx (Temporarily)

```bash
sudo systemctl stop nginx
```

## Step 4: Obtain SSL Certificate

### Option A: Automatic (Recommended)

Let Certbot automatically configure Nginx:

```bash
sudo certbot --nginx -d kadryhr.pl -d www.kadryhr.pl
```

Follow the prompts:
1. Enter your email address (for renewal notifications)
2. Agree to Terms of Service (Y)
3. Choose whether to share email with EFF (optional)
4. Choose redirect option: Select "2" to redirect HTTP to HTTPS

### Option B: Manual Configuration

If you prefer to use the provided nginx-ssl.conf:

```bash
# Obtain certificate only (without auto-configuration)
sudo certbot certonly --standalone -d kadryhr.pl -d www.kadryhr.pl

# Copy the provided nginx configuration
sudo cp /home/deploy/apps/kadryhr-app/nginx-ssl.conf /etc/nginx/sites-available/kadryhr

# Remove default config if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Create symlink
sudo ln -sf /etc/nginx/sites-available/kadryhr /etc/nginx/sites-enabled/kadryhr

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl start nginx
sudo systemctl reload nginx
```

## Step 5: Verify SSL Installation

### Check Certificate:
```bash
sudo certbot certificates
```

### Test HTTPS:
```bash
# Test from command line
curl -I https://kadryhr.pl

# Should return: HTTP/2 200
```

### Online SSL Test:
Visit: https://www.ssllabs.com/ssltest/analyze.html?d=kadryhr.pl

You should get an A or A+ rating.

## Step 6: Set Up Automatic Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

### Test Renewal:
```bash
sudo certbot renew --dry-run
```

### Automatic Renewal (Cron):

Certbot automatically installs a cron job or systemd timer. Verify it:

```bash
# Check systemd timer
sudo systemctl list-timers | grep certbot

# Or check cron
sudo cat /etc/cron.d/certbot
```

### Manual Cron Setup (if needed):

```bash
# Edit crontab
sudo crontab -e

# Add this line (runs twice daily at 2:30 AM and 2:30 PM)
30 2,14 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

## Step 7: Update Deploy Script

Update your deploy.sh to handle SSL certificate renewal:

```bash
#!/usr/bin/env bash
set -e

APP_DIR="/home/deploy/apps/kadryhr-app"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
cd "$APP_DIR"
git pull origin main

echo ">>> [deploy] Start deploya KadryHR"

cd "$APP_DIR"
echo ">>> [deploy] Aktualny katalog: $(pwd)"

echo ">>> [deploy] Backend: npm install (prod)"
cd "$BACKEND_DIR"
npm install --omit=dev

echo ">>> [deploy] Backend: restart PM2"
if pm2 describe kadryhr-backend >/dev/null 2>&1; then
  pm2 restart kadryhr-backend
else
  pm2 start server.js --name kadryhr-backend
fi

echo ">>> [deploy] Frontend: npm install + build"
cd "$FRONTEND_DIR"
npm install
npm run build

echo ">>> [deploy] Reload Nginx"
sudo systemctl reload nginx

echo ">>> [deploy] Check SSL certificate expiry"
sudo certbot certificates | grep "Expiry Date"

echo ">>> [deploy] DONE"
```

## Step 8: Configure Backend for HTTPS

Update your backend `.env` file:

```bash
cd /home/deploy/apps/kadryhr-app/backend
nano .env
```

Update these variables:
```env
# Change from http to https
FRONTEND_URL=https://kadryhr.pl

# If you have a backend URL
BACKEND_URL=https://kadryhr.pl/api

# Ensure secure cookies
NODE_ENV=production
```

Restart backend:
```bash
pm2 restart kadryhr-backend
```

## Step 9: Update Frontend Environment

Update frontend `.env.production`:

```bash
cd /home/deploy/apps/kadryhr-app/frontend
nano .env.production
```

```env
VITE_API_URL=https://kadryhr.pl/api
```

Rebuild frontend:
```bash
npm run build
sudo systemctl reload nginx
```

## Troubleshooting

### Certificate Not Found Error:
```bash
# Check if certificates exist
sudo ls -la /etc/letsencrypt/live/kadryhr.pl/

# If missing, re-run certbot
sudo certbot --nginx -d kadryhr.pl -d www.kadryhr.pl
```

### Nginx Configuration Error:
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Port 80/443 Not Accessible:
```bash
# Check firewall (UFW)
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check firewall (firewalld)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Check if ports are listening
sudo netstat -tlnp | grep -E ':(80|443)'
```

### Mixed Content Warnings:
Make sure all resources (API calls, images, scripts) use HTTPS or relative URLs.

Check browser console for mixed content errors.

### Certificate Renewal Failed:
```bash
# Check renewal logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Manually renew
sudo certbot renew --force-renewal

# Reload nginx
sudo systemctl reload nginx
```

## Security Best Practices

### 1. Enable HTTP/2:
Already enabled in nginx-ssl.conf with `http2` directive.

### 2. Enable HSTS:
Already enabled in nginx-ssl.conf:
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

### 3. Disable TLS 1.0 and 1.1:
Already configured to use only TLSv1.2 and TLSv1.3.

### 4. Regular Updates:
```bash
# Update certbot
sudo apt update && sudo apt upgrade certbot -y  # Ubuntu/Debian
sudo dnf update certbot -y                       # Amazon Linux 2023
```

### 5. Monitor Certificate Expiry:
Set up monitoring alerts 30 days before expiry.

## Verification Checklist

- [ ] HTTPS works: https://kadryhr.pl
- [ ] HTTP redirects to HTTPS
- [ ] SSL Labs test shows A or A+ rating
- [ ] No mixed content warnings in browser console
- [ ] Backend API works over HTTPS
- [ ] Cookies are secure (check in browser DevTools)
- [ ] Auto-renewal is configured
- [ ] Certificate expiry is at least 60 days away

## Certificate Information

### View Certificate Details:
```bash
sudo certbot certificates
```

### Certificate Locations:
- Certificate: `/etc/letsencrypt/live/kadryhr.pl/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/kadryhr.pl/privkey.pem`
- Chain: `/etc/letsencrypt/live/kadryhr.pl/chain.pem`

### Renewal Configuration:
- Config: `/etc/letsencrypt/renewal/kadryhr.pl.conf`
- Logs: `/var/log/letsencrypt/`

## Support

If you encounter issues:

1. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
2. Check Certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`
3. Test SSL: https://www.ssllabs.com/ssltest/
4. Verify DNS: `dig kadryhr.pl +short`

## Additional Resources

- Let's Encrypt: https://letsencrypt.org/
- Certbot Documentation: https://certbot.eff.org/
- Mozilla SSL Configuration Generator: https://ssl-config.mozilla.org/
- SSL Labs Test: https://www.ssllabs.com/ssltest/

---

**Last Updated:** December 22, 2025
**KadryHR Version:** 1.1.0
