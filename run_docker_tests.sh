#!/bin/bash

# Spendy.AI Docker Test Runner
# This script runs tests in a Docker environment

set -e  # Exit on any error

echo "🐳 SPENDY.AI DOCKER TEST SUITE"
echo "=================================================="

# Function to cleanup containers
cleanup() {
    echo "🧹 Cleaning up test containers..."
    docker-compose -f docker-compose.test.yml down -v --remove-orphans
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Parse command line arguments
BACKEND_ONLY=false
FRONTEND_ONLY=false
INTEGRATION_ONLY=false
ALL_TESTS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            BACKEND_ONLY=true
            ALL_TESTS=false
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            ALL_TESTS=false
            shift
            ;;
        --integration-only)
            INTEGRATION_ONLY=true
            ALL_TESTS=false
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --backend-only     Run only backend tests"
            echo "  --frontend-only    Run only frontend tests"
            echo "  --integration-only Run only integration tests"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build test images
echo "🔨 Building test images..."
docker-compose -f docker-compose.test.yml build

# Run tests based on arguments
if [ "$BACKEND_ONLY" = true ]; then
    echo "🧪 Running backend tests only..."
    docker-compose -f docker-compose.test.yml up test-api --abort-on-container-exit
    
elif [ "$FRONTEND_ONLY" = true ]; then
    echo "🧪 Running frontend tests only..."
    docker-compose -f docker-compose.test.yml up test-frontend --abort-on-container-exit
    
elif [ "$INTEGRATION_ONLY" = true ]; then
    echo "🧪 Running integration tests only..."
    docker-compose -f docker-compose.test.yml up integration-tests --abort-on-container-exit
    
else
    echo "🧪 Running all tests..."
    docker-compose -f docker-compose.test.yml up --abort-on-container-exit
fi

# Check exit codes
echo "📊 Checking test results..."
EXIT_CODE=0

# Check backend test results
if docker-compose -f docker-compose.test.yml ps test-api | grep -q "Exit 0"; then
    echo "✅ Backend tests passed"
else
    echo "❌ Backend tests failed"
    EXIT_CODE=1
fi

# Check frontend test results
if docker-compose -f docker-compose.test.yml ps test-frontend | grep -q "Exit 0"; then
    echo "✅ Frontend tests passed"
else
    echo "❌ Frontend tests failed"
    EXIT_CODE=1
fi

# Check integration test results
if docker-compose -f docker-compose.test.yml ps integration-tests | grep -q "Exit 0"; then
    echo "✅ Integration tests passed"
else
    echo "❌ Integration tests failed"
    EXIT_CODE=1
fi

echo "=================================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
else
    echo "❌ SOME TESTS FAILED"
fi

exit $EXIT_CODE 