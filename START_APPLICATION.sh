#!/bin/bash

# KadryHR V2 - Complete Startup Script
# This script starts both API and Web services

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         KadryHR V2 - Application Startup Script               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tlnp 2>/dev/null | grep -q ":$port "; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing process on port $port...${NC}"
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    pkill -f "node.*:$port" 2>/dev/null || true
    sleep 2
}

# Check and kill existing processes
echo "Step 1: Checking for existing processes..."
if check_port 3002; then
    echo -e "${YELLOW}Port 3002 is in use${NC}"
    kill_port 3002
fi

if check_port 3001; then
    echo -e "${YELLOW}Port 3001 is in use${NC}"
    kill_port 3001
fi

echo -e "${GREEN}✓ Ports cleared${NC}"
echo ""

# Check if node_modules exist
echo "Step 2: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing root dependencies...${NC}"
    npm install
fi

if [ ! -d "apps/api/node_modules" ]; then
    echo -e "${YELLOW}Installing API dependencies...${NC}"
    cd apps/api && npm install && cd ../..
fi

if [ ! -d "apps/web/node_modules" ]; then
    echo -e "${YELLOW}Installing Web dependencies...${NC}"
    cd apps/web && npm install && cd ../..
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check configuration files
echo "Step 3: Checking configuration files..."
if [ ! -f "apps/api/.env" ]; then
    echo -e "${RED}✗ Missing apps/api/.env${NC}"
    echo "Creating default configuration..."
    cat > apps/api/.env << 'EOF'
NODE_ENV=development
PORT=3002
API_PREFIX=v2
DATABASE_URL=file:./dev.db
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3001,http://localhost:8080
EOF
    echo -e "${GREEN}✓ Created apps/api/.env${NC}"
fi

if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${RED}✗ Missing apps/web/.env.local${NC}"
    echo "Creating default configuration..."
    cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3002/v2
NEXT_PUBLIC_WEB_URL=http://localhost:3001
EOF
    echo -e "${GREEN}✓ Created apps/web/.env.local${NC}"
fi

echo -e "${GREEN}✓ Configuration files ready${NC}"
echo ""

# Setup database
echo "Step 4: Setting up database..."
cd apps/api

if [ ! -f "prisma/dev.db" ]; then
    echo -e "${YELLOW}Creating database...${NC}"
    npx prisma generate
    npx prisma migrate deploy
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${GREEN}✓ Database already exists${NC}"
    npx prisma generate > /dev/null 2>&1
fi

cd ../..
echo ""

# Start API
echo "Step 5: Starting API service..."
cd apps/api
npm run dev > /tmp/kadryhr-api.log 2>&1 &
API_PID=$!
echo -e "${GREEN}✓ API started (PID: $API_PID)${NC}"
cd ../..

# Wait for API to be ready
echo "Waiting for API to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3002/v2/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ API failed to start. Check logs: tail -f /tmp/kadryhr-api.log${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# Start Web
echo "Step 6: Starting Web service..."
cd apps/web
npm run dev > /tmp/kadryhr-web.log 2>&1 &
WEB_PID=$!
echo -e "${GREEN}✓ Web started (PID: $WEB_PID)${NC}"
cd ../..

# Wait for Web to be ready
echo "Waiting for Web to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Web is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Web failed to start. Check logs: tail -f /tmp/kadryhr-web.log${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# Final status
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 APPLICATION STARTED 🎉                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Services Status:${NC}"
echo "  ✓ API Service:  http://localhost:3002/v2"
echo "  ✓ Web Service:  http://localhost:3001"
echo ""
echo -e "${GREEN}Available Endpoints:${NC}"
echo "  • Health Check:  http://localhost:3002/v2/health"
echo "  • API Docs:      http://localhost:3002/docs"
echo "  • Register:      http://localhost:3001/register"
echo "  • Login:         http://localhost:3001/login"
echo ""
echo -e "${GREEN}Process IDs:${NC}"
echo "  • API PID: $API_PID"
echo "  • Web PID: $WEB_PID"
echo ""
echo -e "${GREEN}Logs:${NC}"
echo "  • API: tail -f /tmp/kadryhr-api.log"
echo "  • Web: tail -f /tmp/kadryhr-web.log"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo "  kill $API_PID $WEB_PID"
echo "  or run: ./STOP_APPLICATION.sh"
echo ""
echo -e "${GREEN}Ready to use! Open http://localhost:3001 in your browser${NC}"
echo ""

# Save PIDs for stop script
echo "$API_PID" > /tmp/kadryhr-api.pid
echo "$WEB_PID" > /tmp/kadryhr-web.pid
