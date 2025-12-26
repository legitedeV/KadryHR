#!/bin/bash

# KadryHR V2 - Stop Script

echo "Stopping KadryHR V2 services..."

# Kill by PID files
if [ -f /tmp/kadryhr-api.pid ]; then
    API_PID=$(cat /tmp/kadryhr-api.pid)
    kill $API_PID 2>/dev/null && echo "✓ Stopped API (PID: $API_PID)"
    rm /tmp/kadryhr-api.pid
fi

if [ -f /tmp/kadryhr-web.pid ]; then
    WEB_PID=$(cat /tmp/kadryhr-web.pid)
    kill $WEB_PID 2>/dev/null && echo "✓ Stopped Web (PID: $WEB_PID)"
    rm /tmp/kadryhr-web.pid
fi

# Kill by port
lsof -ti:3002 | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 3002"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 3001"

# Kill by process name
pkill -f "nest start" 2>/dev/null && echo "✓ Killed nest processes"
pkill -f "next dev" 2>/dev/null && echo "✓ Killed next processes"

echo ""
echo "All services stopped."
