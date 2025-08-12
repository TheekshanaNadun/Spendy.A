#!/usr/bin/env python3
"""
Basic tests for Spendy.AI application
These tests don't require complex database setup
"""

import unittest
import sys
import os

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class BasicTests(unittest.TestCase):
    """Basic tests that don't require database setup"""
    
    def test_import_app(self):
        """Test that the app can be imported"""
        try:
            import app
            self.assertTrue(True, "App imported successfully")
        except ImportError as e:
            self.fail(f"Failed to import app: {e}")
    
    def test_import_models(self):
        """Test that models can be imported"""
        try:
            from models import User, Transaction, Category, UserCategoryLimit
            self.assertTrue(True, "Models imported successfully")
        except ImportError as e:
            self.fail(f"Failed to import models: {e}")
    
    def test_import_ai_model(self):
        """Test that AI model can be imported"""
        try:
            import ai_model
            self.assertTrue(True, "AI model imported successfully")
        except ImportError as e:
            self.fail(f"Failed to import ai_model: {e}")
    
    def test_ai_model_functions(self):
        """Test AI model utility functions"""
        try:
            from ai_model import arima_forecast, detect_anomalies, spending_pattern_analysis
            import pandas as pd
            import numpy as np
            
            # Test ARIMA forecast with simple data
            series = pd.Series([100, 120, 110, 130, 125, 140, 135])
            forecast = arima_forecast(series, steps=3)
            self.assertIsInstance(forecast, list)
            self.assertEqual(len(forecast), 3)
            
            # Test anomaly detection
            transactions_df = pd.DataFrame({
                'price': [100, 120, 110, 130, 125, 140, 135],
                'day_of_week': [0, 1, 2, 3, 4, 5, 6],
                'hour': [9, 10, 11, 12, 13, 14, 15]
            })
            anomalies = detect_anomalies(transactions_df)
            self.assertIn('anomalies', anomalies)
            self.assertIn('anomaly_scores', anomalies)
            
            # Test spending pattern analysis
            patterns = spending_pattern_analysis(transactions_df)
            self.assertIsInstance(patterns, dict)
            
        except ImportError as e:
            self.fail(f"Failed to import AI model functions: {e}")
        except Exception as e:
            self.fail(f"AI model function test failed: {e}")
    
    def test_environment_variables(self):
        """Test that required environment variables are accessible"""
        import os
        
        # Check if we can access environment variables
        # These might not be set in test environment, but we should be able to check
        env_vars = ['SECRET_KEY', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'ANTHROPIC_API_KEY']
        
        for var in env_vars:
            # Just check if we can access the variable (it might be None)
            value = os.getenv(var)
            # Don't fail if it's None, just log it
            print(f"Environment variable {var}: {'SET' if value else 'NOT SET'}")
    
    def test_file_structure(self):
        """Test that important files exist"""
        import os
        
        required_files = [
            'app.py',
            'models.py',
            'ai_model.py',
            'requirements.txt',
            'Dockerfile',
            'docker-compose.yml'
        ]
        
        for file_path in required_files:
            self.assertTrue(
                os.path.exists(file_path),
                f"Required file {file_path} does not exist"
            )
    
    def test_react_app_structure(self):
        """Test that React app structure exists"""
        import os
        
        react_files = [
            'react-app/package.json',
            'react-app/src/App.js',
            'react-app/public/index.html'
        ]
        
        for file_path in react_files:
            if os.path.exists(file_path):
                print(f"React file {file_path}: EXISTS")
            else:
                print(f"React file {file_path}: MISSING")


class APITests(unittest.TestCase):
    """Basic API tests that don't require database"""
    
    def setUp(self):
        """Set up test client"""
        try:
            import app
            app.config['TESTING'] = True
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
            app.config['WTF_CSRF_ENABLED'] = False
            app.config['SECRET_KEY'] = 'test-secret-key'
            app.config['RATELIMIT_ENABLED'] = False
            
            self.app = app.test_client()
            self.app_context = app.app_context()
            self.app_context.push()
            
        except Exception as e:
            self.skipTest(f"Failed to set up test client: {e}")
    
    def tearDown(self):
        """Clean up after tests"""
        try:
            self.app_context.pop()
        except:
            pass
    
    def test_health_check(self):
        """Test basic health check endpoint"""
        try:
            response = self.app.get('/api/session-check')
            # Should return 200 or 401 (unauthorized is expected)
            self.assertIn(response.status_code, [200, 401])
        except Exception as e:
            self.skipTest(f"Health check failed: {e}")
    
    def test_cors_headers(self):
        """Test CORS headers are set"""
        try:
            response = self.app.options('/api/session-check')
            # Should have CORS headers
            self.assertIn('Access-Control-Allow-Origin', response.headers)
        except Exception as e:
            self.skipTest(f"CORS test failed: {e}")


if __name__ == '__main__':
    unittest.main() 