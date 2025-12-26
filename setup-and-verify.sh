#!/usr/bin/env bash
set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  KadryHR - Setup and Verification Script                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://57.128.247.179:3002/v2"
WEB_URL="http://57.128.247.179:3001"
PROXY_URL="http://57.128.247.179:8080"

echo -e "${BLUE}Step 1: Checking environment files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check and create .env.local if needed
if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${YELLOW}Creating apps/web/.env.local...${NC}"
    cat > apps/web/.env.local << 'EOF'
# API Configuration
# When accessing frontend directly (not through nginx proxy), use full API URL
NEXT_PUBLIC_API_URL=http://57.128.247.179:3002/v2

# When using nginx proxy on port 8080, use relative path:
# NEXT_PUBLIC_API_URL=/v2
EOF
    echo -e "${GREEN}✅ Created apps/web/.env.local${NC}"
else
    echo -e "${GREEN}✅ apps/web/.env.local exists${NC}"
    echo "   Content:"
    cat apps/web/.env.local | grep -v "^#" | grep -v "^$" | sed 's/^/   /'
fi

echo ""

# Check .env.production
if [ ! -f "apps/web/.env.production" ]; then
    echo -e "${YELLOW}Creating apps/web/.env.production...${NC}"
    cat > apps/web/.env.production << 'EOF'
# Production API Configuration
# When using nginx reverse proxy, use relative path
NEXT_PUBLIC_API_URL=/v2
EOF
    echo -e "${GREEN}✅ Created apps/web/.env.production${NC}"
else
    echo -e "${GREEN}✅ apps/web/.env.production exists${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Checking Docker Compose setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    
    if docker compose version &> /dev/null; then
        echo -e "${GREEN}✅ Docker Compose is available${NC}"
        
        echo ""
        echo -e "${YELLOW}Starting Docker Compose services...${NC}"
        docker compose -f docker-compose.dev.yml up -d
        
        echo ""
        echo -e "${YELLOW}Waiting for services to be ready (30 seconds)...${NC}"
        sleep 30
        
        echo ""
        echo -e "${GREEN}✅ Services started${NC}"
        echo ""
        docker compose -f docker-compose.dev.yml ps
    else
        echo -e "${RED}❌ Docker Compose not available${NC}"
        echo "   Please install Docker Compose"
        exit 1
    fi
else
    echo -e "${RED}❌ Docker not installed${NC}"
    echo "   Skipping Docker setup"
fi

echo ""
echo -e "${BLUE}Step 3: Testing API endpoints${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test Health
echo -n "Testing health endpoint... "
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health" 2>/dev/null || echo "000")
if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✅ OK (HTTP $HEALTH_CODE)${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $HEALTH_CODE)${NC}"
fi

# Test Register
echo -n "Testing register endpoint... "
REGISTER_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")
if [ "$REGISTER_CODE" = "400" ] || [ "$REGISTER_CODE" = "422" ]; then
    echo -e "${GREEN}✅ Exists (HTTP $REGISTER_CODE - validation error expected)${NC}"
elif [ "$REGISTER_CODE" = "404" ]; then
    echo -e "${RED}❌ Not Found (HTTP 404)${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected response (HTTP $REGISTER_CODE)${NC}"
fi

# Test Login
echo -n "Testing login endpoint... "
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")
if [ "$LOGIN_CODE" = "400" ] || [ "$LOGIN_CODE" = "401" ] || [ "$LOGIN_CODE" = "422" ]; then
    echo -e "${GREEN}✅ Exists (HTTP $LOGIN_CODE - auth error expected)${NC}"
elif [ "$LOGIN_CODE" = "404" ]; then
    echo -e "${RED}❌ Not Found (HTTP 404)${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected response (HTTP $LOGIN_CODE)${NC}"
fi

# Test Me
echo -n "Testing profile endpoint... "
ME_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/auth/me" 2>/dev/null || echo "000")
if [ "$ME_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Exists (HTTP $ME_CODE - unauthorized expected)${NC}"
elif [ "$ME_CODE" = "404" ]; then
    echo -e "${RED}❌ Not Found (HTTP 404)${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected response (HTTP $ME_CODE)${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📋 Access URLs:"
echo "   • Frontend (direct):  $WEB_URL"
echo "   • Frontend (proxy):   $PROXY_URL ${GREEN}← RECOMMENDED${NC}"
echo "   • API:                $API_BASE"
echo "   • API Docs:           http://57.128.247.179:3002/docs"
echo ""
echo "🧪 Test the application:"
echo "   1. Open: $PROXY_URL/register"
echo "   2. Create an account"
echo "   3. Login at: $PROXY_URL/login"
echo "   4. Check browser DevTools → Network tab"
echo "   5. Verify no 404 errors"
echo ""
echo "📚 Documentation:"
echo "   • FIX_404_LOGIN.txt - Detailed fix explanation"
echo "   • API_ACCESS_GUIDE.txt - Access scenarios guide"
echo ""
echo "🔍 Useful commands:"
echo "   • View logs:    docker compose -f docker-compose.dev.yml logs -f"
echo "   • Stop:         docker compose -f docker-compose.dev.yml down"
echo "   • Restart web:  docker compose -f docker-compose.dev.yml restart web"
echo "   • Test API:     ./test-api-endpoints.sh"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Ready to use! Open $PROXY_URL in your browser  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
