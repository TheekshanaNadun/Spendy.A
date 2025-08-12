#!/bin/bash

# Basic test runner for Spendy.AI
# This script runs basic tests that don't require complex setup

echo "🔍 Running basic tests for Spendy.AI"
echo "======================================"

# Check if we're in Docker or local
if [ -f /.dockerenv ]; then
    echo "🐳 Running in Docker container"
    # Run basic tests directly
    python -m pytest tests/test_basic.py -v
    exit_code=$?
else
    echo "💻 Running locally"
    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        echo "✅ Containers are running, using Docker"
        docker-compose exec api python -m pytest tests/test_basic.py -v
        exit_code=$?
    else
        echo "⚠️  No containers running, trying local Python"
        python -m pytest tests/test_basic.py -v
        exit_code=$?
    fi
fi

echo "======================================"
if [ $exit_code -eq 0 ]; then
    echo "✅ Basic tests passed!"
else
    echo "❌ Basic tests failed"
fi

exit $exit_code 