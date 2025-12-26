#!/usr/bin/env bash
set -e

echo "🚀 Starting KadryHR Development Environment"
echo "==========================================="
echo ""

# Check if .env.local exists for web app
if [ ! -f "apps/web/.env.local" ]; then
    echo "📝 Creating apps/web/.env.local..."
    cat > apps/web/.env.local << 'EOF'
# API Configuration
# When accessing frontend directly (not through nginx proxy), use full API URL
NEXT_PUBLIC_API_URL=http://57.128.247.179:3002/v2

# When using nginx proxy on port 8080, use relative path:
# NEXT_PUBLIC_API_URL=/v2
EOF
    echo "✅ Created apps/web/.env.local"
else
    echo "✅ apps/web/.env.local already exists"
fi

echo ""
echo "🐳 Starting Docker Compose services..."
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Development environment started!"
echo ""
echo "📋 Available services:"
echo "   - API V2:      http://57.128.247.179:3002/v2"
echo "   - Frontend:    http://57.128.247.179:3001"
echo "   - Nginx Proxy: http://57.128.247.179:8080"
echo "   - PostgreSQL:  localhost:5432"
echo ""
echo "📚 API Documentation: http://57.128.247.179:3002/docs"
echo ""
echo "🔍 To view logs:"
echo "   docker compose -f docker-compose.dev.yml logs -f"
echo ""
echo "🛑 To stop:"
echo "   docker compose -f docker-compose.dev.yml down"
echo ""
