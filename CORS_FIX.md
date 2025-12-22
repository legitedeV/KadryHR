# 🔧 CORS Fix - Unauthorized Origin

## Issue
The application was rejecting requests from `https://www.kadryhr.pl` with the error:
```
Nieautoryzowany origin: https://www.kadryhr.pl
```

## Root Cause
The CORS configuration in `backend/server.js` only allowed:
- `FRONTEND_URL` environment variable (typically `http://kadryhr.pl`)
- `http://localhost:5173`
- `http://127.0.0.1:5173`

It was missing:
- HTTPS variants (`https://kadryhr.pl`, `https://www.kadryhr.pl`)
- www subdomain variants (`http://www.kadryhr.pl`, `https://www.kadryhr.pl`)

## Solution
Updated the `allowedOrigins` array in `backend/server.js` to include all variants:

```javascript
const allowedOrigins = [
  FRONTEND_URL,            // From environment variable
  'http://kadryhr.pl',     // HTTP without www
  'https://kadryhr.pl',    // HTTPS without www
  'http://www.kadryhr.pl', // HTTP with www
  'https://www.kadryhr.pl',// HTTPS with www (production)
  'http://localhost:5173', // Local development
  'http://127.0.0.1:5173', // Local development (IP)
];
```

## Files Modified
- ✅ `/vercel/sandbox/backend/server.js`

## Testing
After deployment, verify CORS works from all origins:

```bash
# Test from https://www.kadryhr.pl
curl -H "Origin: https://www.kadryhr.pl" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://kadryhr.pl/api/auth/login -v

# Should return:
# Access-Control-Allow-Origin: https://www.kadryhr.pl
# Access-Control-Allow-Credentials: true
```

## Deployment

### Quick Deploy:
```bash
cd /home/deploy/apps/kadryhr-app
git pull origin main
pm2 restart kadryhr-backend
```

### Full Deploy:
```bash
cd /home/deploy/apps/kadryhr-app
git pull origin main
./deploy.sh
```

## Verification Checklist
- [ ] Backend restarts without errors
- [ ] Login works from https://kadryhr.pl
- [ ] Login works from https://www.kadryhr.pl
- [ ] API calls work from both domains
- [ ] Cookies are set correctly
- [ ] No CORS errors in browser console

## Additional Notes

### Nginx Configuration
Ensure Nginx redirects www to non-www (or vice versa) for consistency:

```nginx
# Redirect www to non-www
server {
    listen 443 ssl http2;
    server_name www.kadryhr.pl;
    return 301 https://kadryhr.pl$request_uri;
}
```

Or allow both (current setup):
```nginx
server {
    listen 443 ssl http2;
    server_name kadryhr.pl www.kadryhr.pl;
    # ... rest of config
}
```

### Environment Variables
Ensure `.env` has the correct FRONTEND_URL:

```env
# For HTTPS production
FRONTEND_URL=https://kadryhr.pl

# Or with www
FRONTEND_URL=https://www.kadryhr.pl
```

### Security Considerations
- ✅ Credentials enabled for cookie-based auth
- ✅ Specific origins whitelisted (not wildcard)
- ✅ Both HTTP and HTTPS variants supported
- ✅ Development origins included for local testing

## Related Files
- `backend/server.js` - CORS configuration
- `nginx-ssl.conf` - Nginx SSL configuration
- `SSL_SETUP_GUIDE.md` - SSL setup instructions

---

**Fixed:** December 22, 2025  
**Issue:** CORS rejection for https://www.kadryhr.pl  
**Status:** ✅ Resolved
