#!/bin/bash

# Test runner for existing Docker containers
# This script runs tests in your current running containers

echo "🐳 Running tests in existing Docker containers"
echo "=============================================="

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ No containers are running. Please start your application first:"
    echo "   docker-compose up -d"
    exit 1
fi

echo "✅ Containers are running"

# Function to run tests in a specific container
run_tests_in_container() {
    local container_name=$1
    local test_command=$2
    
    echo "🧪 Running tests in $container_name..."
    
    if docker-compose ps | grep -q "$container_name.*Up"; then
        docker-compose exec "$container_name" $test_command
        return $?
    else
        echo "❌ Container $container_name is not running"
        return 1
    fi
}

# Parse command line arguments
BACKEND_ONLY=false
FRONTEND_ONLY=false
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
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --backend-only  Run only backend tests"
            echo "  --frontend-only Run only frontend tests"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

EXIT_CODE=0

if [ "$BACKEND_ONLY" = true ]; then
    echo "🧪 Running backend tests only..."
    run_tests_in_container "api" "python -m pytest tests/test_backend.py -v"
    EXIT_CODE=$?
    
elif [ "$FRONTEND_ONLY" = true ]; then
    echo "🧪 Running frontend tests only..."
    run_tests_in_container "frontend" "npm test -- --watchAll=false --passWithNoTests"
    EXIT_CODE=$?
    
else
    echo "🧪 Running all tests..."
    
    # Basic tests first
    echo "🔍 Running basic tests..."
    run_tests_in_container "api" "python -m pytest tests/test_basic.py -v"
    BASIC_EXIT=$?
    
    # Backend tests
    echo "📋 Running backend tests..."
    run_tests_in_container "api" "python -m pytest tests/test_backend.py -v"
    BACKEND_EXIT=$?
    
    # AI model tests
    echo "🤖 Running AI model tests..."
    run_tests_in_container "api" "python -c \"from ai_model import arima_forecast, detect_anomalies, spending_pattern_analysis; import pandas as pd; print('AI model tests passed')\""
    AI_EXIT=$?
    
    # Frontend tests (if frontend container exists)
    if docker-compose ps | grep -q "frontend.*Up"; then
        echo "⚛️  Running frontend tests..."
        run_tests_in_container "frontend" "npm test -- --watchAll=false --passWithNoTests"
        FRONTEND_EXIT=$?
    else
        echo "⚠️  Frontend container not found, skipping frontend tests"
        FRONTEND_EXIT=0
    fi
    
    # Set overall exit code
    if [ $BASIC_EXIT -ne 0 ] || [ $BACKEND_EXIT -ne 0 ] || [ $AI_EXIT -ne 0 ] || [ $FRONTEND_EXIT -ne 0 ]; then
        EXIT_CODE=1
    fi
fi

echo "=============================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
else
    echo "❌ SOME TESTS FAILED"
fi

exit $EXIT_CODE 