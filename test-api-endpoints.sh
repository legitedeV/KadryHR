#!/usr/bin/env bash

echo "🧪 Testing KadryHR API V2 Endpoints"
echo "===================================="
echo ""

API_BASE="http://57.128.247.179:3002/v2"

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
echo "   GET $API_BASE/health"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Health check passed"
    echo "   Response: $BODY"
else
    echo "   ❌ Health check failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
fi
echo ""

# Test 2: Register Endpoint (should return 400 or 201, not 404)
echo "2️⃣  Testing Register Endpoint..."
echo "   POST $API_BASE/auth/register"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Register endpoint not found (HTTP 404)"
    echo "   This means the API route is not configured correctly"
elif [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "422" ]; then
    echo "   ✅ Register endpoint exists (validation error expected with empty body)"
    echo "   HTTP $HTTP_CODE"
else
    echo "   ℹ️  Register endpoint responded with HTTP $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Login Endpoint (should return 400 or 401, not 404)
echo "3️⃣  Testing Login Endpoint..."
echo "   POST $API_BASE/auth/login"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Login endpoint not found (HTTP 404)"
    echo "   This means the API route is not configured correctly"
elif [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "422" ]; then
    echo "   ✅ Login endpoint exists (validation/auth error expected with empty body)"
    echo "   HTTP $HTTP_CODE"
else
    echo "   ℹ️  Login endpoint responded with HTTP $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 4: Me Endpoint (should return 401, not 404)
echo "4️⃣  Testing Profile Endpoint..."
echo "   GET $API_BASE/auth/me"
ME_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/auth/me")
HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n1)
BODY=$(echo "$ME_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "404" ]; then
    echo "   ❌ Profile endpoint not found (HTTP 404)"
    echo "   This means the API route is not configured correctly"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ Profile endpoint exists (unauthorized expected without token)"
    echo "   HTTP $HTTP_CODE"
else
    echo "   ℹ️  Profile endpoint responded with HTTP $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

echo "===================================="
echo "✅ API Endpoint Test Complete"
echo ""
echo "If all endpoints return 404, the API is not running or not accessible."
echo "If endpoints return 400/401/422, they exist and are working correctly."
echo ""
