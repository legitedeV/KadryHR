#!/usr/bin/env bash
# KadryHR - HTTPS/SSL Troubleshooting and Fix Script
# This script diagnoses and fixes common HTTPS issues

set -e

echo "=========================================="
echo "KadryHR HTTPS Troubleshooting & Fix"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script with sudo"
    exit 1
fi

echo "Step 1: Checking SSL Certificate Status"
echo "----------------------------------------"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    print_error "Certbot is not installed"
    echo "Installing certbot..."
    
    # Detect OS and install certbot
    if [ -f /etc/debian_version ]; then
        apt update && apt install certbot python3-certbot-nginx -y
    elif [ -f /etc/redhat-release ]; then
        if grep -q "Amazon Linux" /etc/system-release 2>/dev/null; then
            dnf install certbot python3-certbot-nginx -y
        else
            yum install certbot python3-certbot-nginx -y
        fi
    fi
    print_status "Certbot installed"
else
    print_status "Certbot is installed"
fi

# Check certificate status
echo ""
echo "Checking certificates..."
if certbot certificates 2>/dev/null | grep -q "kadryhr.pl"; then
    print_status "SSL certificate found for kadryhr.pl"
    certbot certificates | grep -A 5 "kadryhr.pl"
else
    print_warning "No SSL certificate found for kadryhr.pl"
    echo ""
    read -p "Do you want to obtain a new certificate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Obtaining SSL certificate..."
        systemctl stop nginx
        certbot certonly --standalone -d kadryhr.pl -d www.kadryhr.pl
        systemctl start nginx
        print_status "Certificate obtained"
    fi
fi

echo ""
echo "Step 2: Checking Nginx Configuration"
echo "-------------------------------------"

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_error "Nginx is not installed"
    exit 1
fi

print_status "Nginx is installed"

# Check nginx configuration
echo "Testing nginx configuration..."
if nginx -t 2>&1 | grep -q "successful"; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors:"
    nginx -t
    exit 1
fi

echo ""
echo "Step 3: Checking Certificate Files"
echo "-----------------------------------"

CERT_DIR="/etc/letsencrypt/live/kadryhr.pl"

if [ -d "$CERT_DIR" ]; then
    print_status "Certificate directory exists"
    
    # Check individual certificate files
    if [ -f "$CERT_DIR/fullchain.pem" ]; then
        print_status "fullchain.pem exists"
    else
        print_error "fullchain.pem not found"
    fi
    
    if [ -f "$CERT_DIR/privkey.pem" ]; then
        print_status "privkey.pem exists"
    else
        print_error "privkey.pem not found"
    fi
    
    if [ -f "$CERT_DIR/chain.pem" ]; then
        print_status "chain.pem exists"
    else
        print_warning "chain.pem not found (optional)"
    fi
else
    print_error "Certificate directory not found: $CERT_DIR"
    print_warning "You need to obtain SSL certificates first"
    exit 1
fi

echo ""
echo "Step 4: Checking Nginx Site Configuration"
echo "------------------------------------------"

# Check if kadryhr site config exists
if [ -f /etc/nginx/sites-available/kadryhr ]; then
    print_status "Nginx site configuration exists"
    
    # Check if symlink exists
    if [ -L /etc/nginx/sites-enabled/kadryhr ]; then
        print_status "Site is enabled"
    else
        print_warning "Site is not enabled, creating symlink..."
        ln -sf /etc/nginx/sites-available/kadryhr /etc/nginx/sites-enabled/kadryhr
        print_status "Symlink created"
    fi
else
    print_warning "Nginx site configuration not found"
    
    # Check if we have the config in the app directory
    APP_DIR="/home/deploy/apps/kadryhr-app"
    if [ -f "$APP_DIR/nginx-ssl.conf" ]; then
        print_status "Found nginx-ssl.conf in app directory"
        echo "Copying to /etc/nginx/sites-available/kadryhr..."
        cp "$APP_DIR/nginx-ssl.conf" /etc/nginx/sites-available/kadryhr
        ln -sf /etc/nginx/sites-available/kadryhr /etc/nginx/sites-enabled/kadryhr
        print_status "Configuration copied and enabled"
    else
        print_error "nginx-ssl.conf not found in $APP_DIR"
        exit 1
    fi
fi

echo ""
echo "Step 5: Checking Firewall"
echo "-------------------------"

# Check if ports 80 and 443 are open
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        print_status "UFW firewall is active"
        
        if ufw status | grep -q "80"; then
            print_status "Port 80 is open"
        else
            print_warning "Port 80 is not open, opening..."
            ufw allow 80/tcp
        fi
        
        if ufw status | grep -q "443"; then
            print_status "Port 443 is open"
        else
            print_warning "Port 443 is not open, opening..."
            ufw allow 443/tcp
        fi
    fi
elif command -v firewall-cmd &> /dev/null; then
    if systemctl is-active --quiet firewalld; then
        print_status "Firewalld is active"
        
        if firewall-cmd --list-services | grep -q "http"; then
            print_status "HTTP service is allowed"
        else
            print_warning "HTTP service not allowed, adding..."
            firewall-cmd --permanent --add-service=http
            firewall-cmd --reload
        fi
        
        if firewall-cmd --list-services | grep -q "https"; then
            print_status "HTTPS service is allowed"
        else
            print_warning "HTTPS service not allowed, adding..."
            firewall-cmd --permanent --add-service=https
            firewall-cmd --reload
        fi
    fi
else
    print_warning "No firewall detected (UFW or firewalld)"
fi

echo ""
echo "Step 6: Checking Backend Configuration"
echo "---------------------------------------"

BACKEND_DIR="/home/deploy/apps/kadryhr-app/apps/legacy-api"
if [ -f "$BACKEND_DIR/.env" ]; then
    print_status "Backend .env file exists"
    
    # Check if FRONTEND_URL uses HTTPS
    if grep -q "FRONTEND_URL=https://" "$BACKEND_DIR/.env"; then
        print_status "FRONTEND_URL uses HTTPS"
    else
        print_warning "FRONTEND_URL does not use HTTPS"
        echo "Current FRONTEND_URL:"
        grep "FRONTEND_URL" "$BACKEND_DIR/.env" || echo "Not set"
        echo ""
        echo "Please update FRONTEND_URL to: https://kadryhr.pl"
    fi
else
    print_warning "Backend .env file not found"
fi

echo ""
echo "Step 7: Checking Frontend Configuration"
echo "----------------------------------------"

FRONTEND_DIR="/home/deploy/apps/kadryhr-app/frontend"
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    print_status "Frontend .env.production file exists"
    
    # Check if VITE_API_URL uses HTTPS
    if grep -q "VITE_API_URL=https://" "$FRONTEND_DIR/.env.production"; then
        print_status "VITE_API_URL uses HTTPS"
    else
        print_warning "VITE_API_URL does not use HTTPS"
        echo "Current VITE_API_URL:"
        grep "VITE_API_URL" "$FRONTEND_DIR/.env.production" || echo "Not set"
        echo ""
        echo "Please update VITE_API_URL to: https://kadryhr.pl/api"
    fi
else
    print_warning "Frontend .env.production file not found"
fi

echo ""
echo "Step 8: Testing Nginx Configuration"
echo "------------------------------------"

if nginx -t; then
    print_status "Nginx configuration test passed"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

echo ""
echo "Step 9: Reloading Nginx"
echo "-----------------------"

systemctl reload nginx
if systemctl is-active --quiet nginx; then
    print_status "Nginx reloaded successfully"
else
    print_error "Nginx failed to reload"
    systemctl status nginx
    exit 1
fi

echo ""
echo "Step 10: Testing HTTPS Connection"
echo "----------------------------------"

echo "Testing HTTPS connection to kadryhr.pl..."
if curl -I -s -k https://kadryhr.pl | head -n 1 | grep -q "200\|301\|302"; then
    print_status "HTTPS connection successful"
else
    print_warning "HTTPS connection test inconclusive"
    echo "Response:"
    curl -I -s -k https://kadryhr.pl | head -n 5
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
print_status "SSL/HTTPS troubleshooting completed"
echo ""
echo "Next steps:"
echo "1. Visit https://kadryhr.pl in your browser"
echo "2. Check for any mixed content warnings in browser console"
echo "3. Test SSL rating at: https://www.ssllabs.com/ssltest/analyze.html?d=kadryhr.pl"
echo ""
echo "If issues persist:"
echo "- Check nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo "- Check certbot logs: sudo tail -f /var/log/letsencrypt/letsencrypt.log"
echo "- Verify DNS: dig kadryhr.pl +short"
echo ""
print_status "Done!"
