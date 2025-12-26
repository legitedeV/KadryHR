#!/bin/bash

echo "==================================="
echo "Testing KadryHR V2 Registration Fix"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if API is running
echo "1. Checking API health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3002/v2/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API is running${NC}"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ API is not running${NC}"
    exit 1
fi
echo ""

# Test 2: Check if Web is running
echo "2. Checking Web frontend..."
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Web frontend is running${NC}"
else
    echo -e "${RED}✗ Web frontend is not running (HTTP $WEB_RESPONSE)${NC}"
    exit 1
fi
echo ""

# Test 3: Test registration endpoint
echo "3. Testing registration endpoint..."
RANDOM_EMAIL="test$(date +%s)@example.com"
REG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3002/v2/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test User\",
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"password123\",
    \"organizationName\": \"Test Org\"
  }")

HTTP_CODE=$(echo "$REG_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REG_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Registration successful (HTTP $HTTP_CODE)${NC}"
    echo "   Email used: $RANDOM_EMAIL"
    echo "   Response: $(echo $RESPONSE_BODY | jq -r '.user.email' 2>/dev/null || echo $RESPONSE_BODY)"
else
    echo -e "${RED}✗ Registration failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi
echo ""

# Test 4: Check environment configuration
echo "4. Checking environment configuration..."
if [ -f "/vercel/sandbox/apps/web/.env.local" ]; then
    API_URL=$(grep NEXT_PUBLIC_API_URL /vercel/sandbox/apps/web/.env.local | head -1 | cut -d'=' -f2)
    echo -e "${GREEN}✓ Frontend .env.local exists${NC}"
    echo "   API URL: $API_URL"
else
    echo -e "${YELLOW}⚠ Frontend .env.local not found${NC}"
fi

if [ -f "/vercel/sandbox/apps/api/.env" ]; then
    DB_URL=$(grep DATABASE_URL /vercel/sandbox/apps/api/.env | head -1 | cut -d'=' -f2)
    echo -e "${GREEN}✓ API .env exists${NC}"
    echo "   Database: $DB_URL"
else
    echo -e "${YELLOW}⚠ API .env not found${NC}"
fi
echo ""

# Summary
echo "==================================="
echo -e "${GREEN}All tests passed! ✓${NC}"
echo "==================================="
echo ""
echo "You can now:"
echo "  1. Open http://localhost:3001/register in your browser"
echo "  2. Fill in the registration form"
echo "  3. Submit without getting a 404 error"
echo ""
echo "API Documentation: http://localhost:3002/docs"
echo ""
