#!/bin/bash

# AegisRadar Full Stack Startup Script
# Run this script to start all services in the correct order

set -e

WORKSPACE="/Users/ahmed/Documents/Gradution Project Backup/AegisRadar_V3/AegisRadarBackend"
cd "$WORKSPACE"

echo "=========================================="
echo "AegisRadar Full Stack Startup"
echo "=========================================="

# Check prerequisites
echo ""
echo "✓ Checking SQL Server connection..."
if ! nc -z localhost 1433 2>/dev/null; then
    echo "⚠ SQL Server not reachable at localhost:1433"
    echo "  Please ensure SQL Server is running"
    exit 1
fi

echo "✓ Checking Kafka connection..."
if ! nc -z localhost 9092 2>/dev/null; then
    echo "⚠ Kafka not reachable at localhost:9092"
    echo "  Please ensure Kafka is running"
    exit 1
fi

echo ""
echo "=========================================="
echo "Starting Services (in new terminal tabs)"
echo "=========================================="

# Terminal 1: API
echo ""
echo "1️⃣  Starting API Server..."
echo "   Command: dotnet watch run --project src/AegisRadar.API/AegisRadar.API.csproj"
echo "   Endpoint: http://localhost:5099"
echo ""
echo "   👉 Open Terminal 1 and run:"
echo "      cd \"$WORKSPACE\""
echo "      dotnet watch run --project src/AegisRadar.API/AegisRadar.API.csproj"
echo ""
read -p "Press ENTER when API is running (you'll see 'info: Microsoft.Hosting.Lifetime...')..."

# Terminal 2: Worker
echo ""
echo "2️⃣  Starting Worker Service..."
echo "   Command: dotnet watch run --project src/AegisRadar.Worker/AegisRadar.Worker.csproj"
echo ""
echo "   👉 Open Terminal 2 and run:"
echo "      cd \"$WORKSPACE\""
echo "      dotnet watch run --project src/AegisRadar.Worker/AegisRadar.Worker.csproj"
echo ""
read -p "Press ENTER when Worker is running (you'll see 'TransactionConsumerService starting')..."

# Terminal 3: Frontend
echo ""
echo "3️⃣  Starting Frontend..."
echo "   Command: npm run dev"
echo "   Endpoint: http://localhost:5173"
echo ""
echo "   👉 Open Terminal 3 and run:"
echo "      cd \"$WORKSPACE/src/AegisRadar.Frontend\""
echo "      npm run dev"
echo ""
read -p "Press ENTER when Frontend is running (you'll see 'Local: http://localhost:5173')..."

echo ""
echo "=========================================="
echo "✅ All Services Started!"
echo "=========================================="
echo ""
echo "Access the application:"
echo "  Frontend:   http://localhost:5173"
echo "  API Docs:   http://localhost:5099/swagger"
echo "  SignalR:    ws://localhost:5099/hubs/fraud-alerts"
echo ""
echo "Service Status:"
echo "  API:        http://localhost:5099/health"
echo "  Worker:     Processing transactions from Kafka"
echo ""
echo "To stop all services, press Ctrl+C in each terminal."
echo ""
