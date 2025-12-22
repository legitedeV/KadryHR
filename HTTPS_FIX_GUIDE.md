# 🔧 HTTPS Fix Guide - KadryHR

## Problem
Landing page works on `http://kadryhr.pl` but not on `https://kadryhr.pl`

## Solution Overview

This guide provides step-by-step instructions to diagnose and fix HTTPS issues with the KadryHR landing page.

## Quick Fix (Automated)

Run the automated fix script:

```bash
sudo ./fix-https.sh
```

This script will:
- Check SSL certificate status
- Verify nginx configuration
- Check certificate files
- Verify firewall settings
- Test HTTPS connection
- Provide detailed diagnostics

## Manual Fix Steps

### Step 1: Check SSL Certificate

```bash
# Check if certificate exists
sudo certbot certificates

# Expected output should show kadryhr.pl certificate
# If not found, obtain a new certificate:
sudo systemctl stop nginx
sudo certbot certonly --standalone -d kadryhr.pl -d www.kadryhr.pl
sudo systemctl start nginx
```

### Step 2: Verify Certificate Files

```bash
# Check if certificate files exist
sudo ls -la /etc/letsencrypt/live/kadryhr.pl/

# Should show:
# - fullchain.pem
# - privkey.pem
# - chain.pem
# - cert.pem
```

### Step 3: Check Nginx Configuration

```bash
# Test nginx configuration
sudo nginx -t

# If errors, check the configuration file
sudo nano /etc/nginx/sites-available/kadryhr

# Ensure SSL certificate paths are correct:
# ssl_certificate /etc/letsencrypt/live/kadryhr.pl/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/kadryhr.pl/privkey.pem;
```

### Step 4: Verify Nginx Site is Enabled

```bash
# Check if site is enabled
ls -la /etc/nginx/sites-enabled/

# If kadryhr is not listed, create symlink:
sudo ln -sf /etc/nginx/sites-available/kadryhr /etc/nginx/sites-enabled/kadryhr

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default
```

### Step 5: Check Firewall

```bash
# For UFW (Ubuntu/Debian)
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# For firewalld (CentOS/RHEL/Amazon Linux)
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Step 6: Update Backend Configuration

```bash
cd /home/deploy/apps/kadryhr-app/backend
nano .env
```

Update these variables:
```env
FRONTEND_URL=https://kadryhr.pl
NODE_ENV=production
```

Restart backend:
```bash
pm2 restart kadryhr-backend
```

### Step 7: Update Frontend Configuration

```bash
cd /home/deploy/apps/kadryhr-app/frontend
nano .env.production
```

Update:
```env
VITE_API_URL=https://kadryhr.pl/api
```

Rebuild frontend:
```bash
npm run build
```

### Step 8: Reload Nginx

```bash
# Test configuration first
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

### Step 9: Test HTTPS

```bash
# Test from command line
curl -I https://kadryhr.pl

# Should return: HTTP/2 200 or HTTP/1.1 200

# Test redirect from HTTP to HTTPS
curl -I http://kadryhr.pl

# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://kadryhr.pl/
```

## Common Issues and Solutions

### Issue 1: Certificate Not Found

**Error:** `nginx: [emerg] cannot load certificate "/etc/letsencrypt/live/kadryhr.pl/fullchain.pem"`

**Solution:**
```bash
# Obtain new certificate
sudo systemctl stop nginx
sudo certbot certonly --standalone -d kadryhr.pl -d www.kadryhr.pl
sudo systemctl start nginx
```

### Issue 2: Port 443 Already in Use

**Error:** `nginx: [emerg] bind() to 0.0.0.0:443 failed (98: Address already in use)`

**Solution:**
```bash
# Find process using port 443
sudo lsof -i :443

# Kill the process or stop nginx first
sudo systemctl stop nginx
sudo systemctl start nginx
```

### Issue 3: Permission Denied on Certificate Files

**Error:** `nginx: [emerg] SSL_CTX_use_PrivateKey_file() failed`

**Solution:**
```bash
# Fix certificate permissions
sudo chmod 644 /etc/letsencrypt/live/kadryhr.pl/fullchain.pem
sudo chmod 600 /etc/letsencrypt/live/kadryhr.pl/privkey.pem
sudo chown root:root /etc/letsencrypt/live/kadryhr.pl/*
```

### Issue 4: Mixed Content Warnings

**Problem:** Page loads but shows "Not Secure" or mixed content warnings

**Solution:**
1. Check browser console for mixed content errors
2. Ensure all API calls use HTTPS
3. Update frontend .env.production:
   ```env
   VITE_API_URL=https://kadryhr.pl/api
   ```
4. Rebuild frontend: `npm run build`

### Issue 5: Certificate Expired

**Error:** `SSL certificate problem: certificate has expired`

**Solution:**
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Reload nginx
sudo systemctl reload nginx
```

### Issue 6: DNS Not Resolving

**Problem:** Domain doesn't point to server

**Solution:**
```bash
# Check DNS resolution
dig kadryhr.pl +short
nslookup kadryhr.pl

# Should return your server's IP address
# If not, update DNS records at your domain registrar
```

## Verification Checklist

After applying fixes, verify:

- [ ] `https://kadryhr.pl` loads successfully
- [ ] `http://kadryhr.pl` redirects to HTTPS
- [ ] No certificate warnings in browser
- [ ] No mixed content warnings in browser console
- [ ] SSL Labs test shows A or A+ rating: https://www.ssllabs.com/ssltest/analyze.html?d=kadryhr.pl
- [ ] Backend API works over HTTPS
- [ ] Login/authentication works correctly

## Testing Commands

```bash
# Test HTTPS connection
curl -I https://kadryhr.pl

# Test HTTP to HTTPS redirect
curl -I http://kadryhr.pl

# Test API endpoint
curl -I https://kadryhr.pl/api/health

# Check certificate expiry
sudo certbot certificates | grep "Expiry Date"

# Test SSL configuration
openssl s_client -connect kadryhr.pl:443 -servername kadryhr.pl
```

## Monitoring and Maintenance

### Check Certificate Expiry

```bash
# View certificate details
sudo certbot certificates

# Test renewal process
sudo certbot renew --dry-run
```

### Set Up Monitoring

Add to crontab for weekly certificate check:
```bash
sudo crontab -e

# Add this line:
0 0 * * 0 certbot certificates | mail -s "SSL Certificate Status" admin@kadryhr.pl
```

### Logs to Monitor

```bash
# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Certbot log
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# System log
sudo journalctl -u nginx -f
```

## Emergency Rollback

If HTTPS causes issues and you need to temporarily revert to HTTP:

```bash
# Disable HTTPS site
sudo rm /etc/nginx/sites-enabled/kadryhr

# Create temporary HTTP-only config
sudo nano /etc/nginx/sites-available/kadryhr-http

# Add basic HTTP configuration (without SSL)
# Then enable it:
sudo ln -s /etc/nginx/sites-available/kadryhr-http /etc/nginx/sites-enabled/kadryhr-http

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

## Support Resources

- **Let's Encrypt Documentation:** https://letsencrypt.org/docs/
- **Certbot Documentation:** https://certbot.eff.org/docs/
- **Nginx SSL Configuration:** https://nginx.org/en/docs/http/configuring_https_servers.html
- **Mozilla SSL Configuration Generator:** https://ssl-config.mozilla.org/
- **SSL Labs Test:** https://www.ssllabs.com/ssltest/

## Additional Notes

### Certificate Renewal

Let's Encrypt certificates expire after 90 days. Certbot automatically sets up renewal via cron or systemd timer.

Verify auto-renewal:
```bash
# Check systemd timer
sudo systemctl list-timers | grep certbot

# Or check cron
sudo cat /etc/cron.d/certbot
```

### Security Headers

The nginx-ssl.conf includes security headers:
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

These headers improve security and SSL Labs rating.

### Performance Optimization

The configuration includes:
- HTTP/2 support
- OCSP Stapling
- SSL Session Caching
- Gzip Compression

These features improve HTTPS performance.

---

**Last Updated:** December 22, 2025  
**Version:** 1.0.0  
**Author:** KadryHR Team
