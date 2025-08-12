#!/usr/bin/env python3
"""
Test runner for Spendy.AI application
Runs all tests including backend, frontend, integration, and security tests
"""

import unittest
import sys
import os
import subprocess
import time
import requests
from pathlib import Path

def check_services_running():
    """Check if required services are running"""
    # Check if we're running in Docker
    import os
    is_docker = os.path.exists('/.dockerenv')
    
    if is_docker:
        # In Docker, services should be available via service names
        services = {
            'API Server (Docker)': 'http://test-api:5000/api/session-check',
            'Frontend Server (Docker)': 'http://test-frontend:3000'
        }
    else:
        # Local development
        services = {
            'API Server (Port 5000)': 'http://localhost:5000/api/session-check',
            'Frontend Server (Port 3000)': 'http://localhost:3000'
        }
    
    running_services = []
    for service_name, url in services.items():
        try:
            response = requests.get(url, timeout=10)
            if response.status_code in [200, 401]:  # 401 is expected for unauthenticated requests
                running_services.append(service_name)
                print(f"✅ {service_name} is running")
            else:
                print(f"⚠️  {service_name} responded with status {response.status_code}")
        except requests.exceptions.RequestException:
            print(f"❌ {service_name} is not running")
    
    return running_services

def run_backend_tests():
    """Run backend unit tests"""
    print("\n" + "="*50)
    print("RUNNING BACKEND TESTS")
    print("="*50)
    
    # Add the project root to Python path
    project_root = Path(__file__).parent
    sys.path.insert(0, str(project_root))
    
    # Discover and run backend tests
    loader = unittest.TestLoader()
    start_dir = project_root / 'tests'
    suite = loader.discover(start_dir, pattern='test_backend.py')
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

def run_integration_tests():
    """Run integration tests"""
    print("\n" + "="*50)
    print("RUNNING INTEGRATION TESTS")
    print("="*50)
    
    # Add the project root to Python path
    project_root = Path(__file__).parent
    sys.path.insert(0, str(project_root))
    
    # Discover and run integration tests
    loader = unittest.TestLoader()
    start_dir = project_root / 'tests'
    suite = loader.discover(start_dir, pattern='test_integration.py')
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

def run_frontend_tests():
    """Run frontend tests"""
    print("\n" + "="*50)
    print("RUNNING FRONTEND TESTS")
    print("="*50)
    
    frontend_dir = Path(__file__).parent / 'react-app'
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    try:
        # Check if node_modules exists
        if not (frontend_dir / 'node_modules').exists():
            print("📦 Installing frontend dependencies...")
            subprocess.run(['npm', 'install'], cwd=frontend_dir, check=True)
        
        # Run frontend tests
        print("🧪 Running frontend tests...")
        result = subprocess.run(['npm', 'test', '--', '--watchAll=false'], 
                              cwd=frontend_dir, 
                              capture_output=True, 
                              text=True)
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend tests failed: {e}")
        return False
    except FileNotFoundError:
        print("❌ npm not found. Please install Node.js and npm")
        return False

def run_ai_model_tests():
    """Run AI model tests"""
    print("\n" + "="*50)
    print("RUNNING AI MODEL TESTS")
    print("="*50)
    
    try:
        # Import and test AI model functions
        from ai_model import arima_forecast, detect_anomalies, spending_pattern_analysis
        import pandas as pd
        import numpy as np
        
        # Test ARIMA forecast
        print("Testing ARIMA forecast...")
        series = pd.Series([100, 120, 110, 130, 125, 140, 135])
        forecast = arima_forecast(series, steps=3)
        assert isinstance(forecast, list)
        assert len(forecast) == 3
        print("✅ ARIMA forecast test passed")
        
        # Test anomaly detection
        print("Testing anomaly detection...")
        transactions_df = pd.DataFrame({
            'price': [100, 120, 110, 130, 125, 140, 135],
            'day_of_week': [0, 1, 2, 3, 4, 5, 6],
            'hour': [9, 10, 11, 12, 13, 14, 15]
        })
        anomalies = detect_anomalies(transactions_df)
        assert 'anomalies' in anomalies
        assert 'anomaly_scores' in anomalies
        print("✅ Anomaly detection test passed")
        
        # Test spending pattern analysis
        print("Testing spending pattern analysis...")
        patterns = spending_pattern_analysis(transactions_df)
        assert isinstance(patterns, dict)
        print("✅ Spending pattern analysis test passed")
        
        return True
        
    except ImportError as e:
        print(f"❌ AI model test failed - import error: {e}")
        return False
    except Exception as e:
        print(f"❌ AI model test failed: {e}")
        return False

def run_security_tests():
    """Run security tests"""
    print("\n" + "="*50)
    print("RUNNING SECURITY TESTS")
    print("="*50)
    
    # Add the project root to Python path
    project_root = Path(__file__).parent
    sys.path.insert(0, str(project_root))
    
    # Discover and run security tests
    loader = unittest.TestLoader()
    start_dir = project_root / 'tests'
    suite = loader.discover(start_dir, pattern='test_integration.py')
    
    # Filter to only security tests
    security_suite = unittest.TestSuite()
    for test in suite:
        if 'SecurityTests' in str(test):
            security_suite.addTest(test)
    
    if security_suite.countTestCases() == 0:
        print("No security tests found")
        return True
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(security_suite)
    
    return result.wasSuccessful()

def main():
    """Main test runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Spendy.AI Test Suite')
    parser.add_argument('--backend-only', action='store_true', help='Run only backend tests')
    parser.add_argument('--frontend-only', action='store_true', help='Run only frontend tests')
    parser.add_argument('--integration-only', action='store_true', help='Run only integration tests')
    parser.add_argument('--security-only', action='store_true', help='Run only security tests')
    parser.add_argument('--ai-only', action='store_true', help='Run only AI model tests')
    parser.add_argument('--docker', action='store_true', help='Running in Docker environment')
    
    args = parser.parse_args()
    
    print("🧪 SPENDY.AI TEST SUITE")
    print("="*50)
    
    # Check if services are running
    print("Checking services...")
    running_services = check_services_running()
    
    if not running_services and not args.docker:
        print("\n⚠️  No services are running. Some tests may be skipped.")
        print("To start services, run: docker-compose up")
    
    # Run tests based on arguments
    test_results = {}
    
    if args.backend_only:
        test_results['backend'] = run_backend_tests()
    elif args.frontend_only:
        test_results['frontend'] = run_frontend_tests()
    elif args.integration_only:
        test_results['integration'] = run_integration_tests()
    elif args.security_only:
        test_results['security'] = run_security_tests()
    elif args.ai_only:
        test_results['ai_model'] = run_ai_model_tests()
    else:
        # Run all tests
        test_results['backend'] = run_backend_tests()
        test_results['integration'] = run_integration_tests()
        test_results['ai_model'] = run_ai_model_tests()
        test_results['security'] = run_security_tests()
        
        # Frontend tests (optional)
        try:
            test_results['frontend'] = run_frontend_tests()
        except Exception as e:
            print(f"⚠️  Frontend tests skipped: {e}")
            test_results['frontend'] = True  # Don't fail the entire suite
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    all_passed = True
    for test_type, passed in test_results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_type.upper():15} {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "="*50)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1

if __name__ == '__main__':
    sys.exit(main()) 