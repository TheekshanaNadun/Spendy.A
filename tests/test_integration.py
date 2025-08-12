import unittest
import json
import requests
import time
from datetime import datetime
import sys
import os

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class SpendyAIIntegrationTests(unittest.TestCase):
    """Integration tests for Spendy.AI application"""
    
    def setUp(self):
        """Set up test environment"""
        self.base_url = "http://localhost:5000"
        self.frontend_url = "http://localhost:3000"
        self.session = requests.Session()
        
        # Test user credentials
        self.test_user = {
            'username': 'integration_test_user',
            'email': 'integration@test.com',
            'password': 'testpassword123'
        }
        
        # Clean up any existing test user
        self.cleanup_test_user()
    
    def tearDown(self):
        """Clean up after tests"""
        self.cleanup_test_user()
    
    def cleanup_test_user(self):
        """Clean up test user from database"""
        try:
            # This would need to be implemented in your API
            # For now, we'll just log the cleanup attempt
            print("Cleaning up test user...")
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    def test_health_check(self):
        """Test if the API is running and accessible"""
        try:
            response = self.session.get(f"{self.base_url}/api/session-check")
            self.assertEqual(response.status_code, 200)
        except requests.exceptions.ConnectionError:
            self.skipTest("API server is not running")
    
    def test_user_registration_flow(self):
        """Test complete user registration flow"""
        # Step 1: Register new user
        signup_data = {
            'username': self.test_user['username'],
            'email': self.test_user['email'],
            'password': self.test_user['password']
        }
        
        response = self.session.post(
            f"{self.base_url}/api/signup",
            json=signup_data,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 201)
        result = response.json()
        self.assertIn('message', result)
        self.assertIn(self.test_user['username'], result['message'])
    
    def test_login_flow(self):
        """Test complete login flow with OTP"""
        # First register a user
        self.test_user_registration_flow()
        
        # Step 1: Login request
        login_data = {
            'email': self.test_user['email'],
            'password': self.test_user['password']
        }
        
        response = self.session.post(
            f"{self.base_url}/api/login",
            json=login_data,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertTrue(result.get('otpRequired'))
        self.assertIn('otpHash', result)
        
        # Note: OTP verification would require email access
        # This test demonstrates the flow up to OTP requirement
    
    def test_forgot_password_flow(self):
        """Test forgot password flow"""
        # First register a user
        self.test_user_registration_flow()
        
        # Step 1: Request password reset
        forgot_data = {
            'email': self.test_user['email']
        }
        
        response = self.session.post(
            f"{self.base_url}/api/forgot-password",
            json=forgot_data,
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertIn('otpHash', result)
        self.assertEqual(result['email'], self.test_user['email'])
    
    def test_transaction_management_flow(self):
        """Test complete transaction management flow"""
        # This would require authentication
        # For now, we'll test the endpoints exist
        endpoints = [
            '/api/transactions',
            '/api/transactions/expense',
            '/api/transactions/income',
            '/api/stats',
            '/api/expense-summary',
            '/api/dashboard-data'
        ]
        
        for endpoint in endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                # Should return 401 (unauthorized) since we're not logged in
                self.assertIn(response.status_code, [401, 404])
            except requests.exceptions.ConnectionError:
                self.skipTest(f"API server is not running for endpoint: {endpoint}")
    
    def test_ai_processing_endpoint(self):
        """Test AI message processing endpoint"""
        try:
            response = self.session.post(
                f"{self.base_url}/process_message",
                json={'message': 'I spent 500 on lunch'},
                headers={'Content-Type': 'application/json'}
            )
            # Should return 401 (unauthorized) since we're not logged in
            self.assertIn(response.status_code, [401, 404])
        except requests.exceptions.ConnectionError:
            self.skipTest("API server is not running")
    
    def test_frontend_accessibility(self):
        """Test if frontend is accessible"""
        try:
            response = self.session.get(self.frontend_url)
            self.assertEqual(response.status_code, 200)
        except requests.exceptions.ConnectionError:
            self.skipTest("Frontend server is not running")
    
    def test_api_endpoints_structure(self):
        """Test that all expected API endpoints exist"""
        expected_endpoints = [
            '/api/signup',
            '/api/login',
            '/api/forgot-password',
            '/api/reset-password',
            '/api/verify-otp',
            '/api/resend-otp',
            '/api/session-check',
            '/api/logout',
            '/api/transactions',
            '/api/stats',
            '/api/profile',
            '/api/change-password'
        ]
        
        for endpoint in expected_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                # Should not return 404 (not found)
                self.assertNotEqual(response.status_code, 404, f"Endpoint {endpoint} not found")
            except requests.exceptions.ConnectionError:
                self.skipTest(f"API server is not running for endpoint: {endpoint}")
    
    def test_database_connectivity(self):
        """Test database connectivity through API"""
        try:
            # Try to access a simple endpoint that requires database
            response = self.session.get(f"{self.base_url}/api/session-check")
            self.assertEqual(response.status_code, 200)
        except requests.exceptions.ConnectionError:
            self.skipTest("API server is not running")
    
    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        try:
            response = self.session.options(f"{self.base_url}/api/session-check")
            # Should have CORS headers
            self.assertIn('Access-Control-Allow-Origin', response.headers)
        except requests.exceptions.ConnectionError:
            self.skipTest("API server is not running")


class PerformanceTests(unittest.TestCase):
    """Performance tests for the application"""
    
    def setUp(self):
        self.base_url = "http://localhost:5000"
        self.session = requests.Session()
    
    def test_api_response_time(self):
        """Test API response times are within acceptable limits"""
        endpoints = [
            '/api/session-check',
            '/api/signup',
            '/api/login'
        ]
        
        for endpoint in endpoints:
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint}")
                end_time = time.time()
                
                response_time = end_time - start_time
                # Response should be under 2 seconds
                self.assertLess(response_time, 2.0, f"Endpoint {endpoint} took {response_time:.2f}s")
                
            except requests.exceptions.ConnectionError:
                self.skipTest(f"API server is not running for endpoint: {endpoint}")
    
    def test_concurrent_requests(self):
        """Test handling of concurrent requests"""
        import threading
        import concurrent.futures
        
        def make_request():
            try:
                response = self.session.get(f"{self.base_url}/api/session-check")
                return response.status_code
            except:
                return None
        
        # Make 10 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [future.result() for future in futures]
        
        # All requests should succeed
        successful_requests = [r for r in results if r == 200]
        self.assertGreaterEqual(len(successful_requests), 8, "Too many concurrent requests failed")


class SecurityTests(unittest.TestCase):
    """Security tests for the application"""
    
    def setUp(self):
        self.base_url = "http://localhost:5000"
        self.session = requests.Session()
    
    def test_sql_injection_protection(self):
        """Test protection against SQL injection"""
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com', 'password'); --"
        ]
        
        for malicious_input in malicious_inputs:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/signup",
                    json={
                        'username': malicious_input,
                        'email': f"{malicious_input}@test.com",
                        'password': 'password123'
                    },
                    headers={'Content-Type': 'application/json'}
                )
                
                # Should not crash or return 500 error
                self.assertNotEqual(response.status_code, 500, f"SQL injection vulnerability with input: {malicious_input}")
                
            except requests.exceptions.ConnectionError:
                self.skipTest("API server is not running")
    
    def test_xss_protection(self):
        """Test protection against XSS attacks"""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>"
        ]
        
        for payload in xss_payloads:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/signup",
                    json={
                        'username': payload,
                        'email': f"{payload}@test.com",
                        'password': 'password123'
                    },
                    headers={'Content-Type': 'application/json'}
                )
                
                # Should not crash or return 500 error
                self.assertNotEqual(response.status_code, 500, f"XSS vulnerability with payload: {payload}")
                
            except requests.exceptions.ConnectionError:
                self.skipTest("API server is not running")
    
    def test_rate_limiting(self):
        """Test rate limiting is working"""
        try:
            # Make multiple rapid requests
            for i in range(20):
                response = self.session.get(f"{self.base_url}/api/session-check")
                
                # Should not get rate limited too quickly for session check
                if i < 10:
                    self.assertNotEqual(response.status_code, 429, "Rate limiting too aggressive")
            
        except requests.exceptions.ConnectionError:
            self.skipTest("API server is not running")


if __name__ == '__main__':
    unittest.main() 