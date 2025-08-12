import unittest
import json
import os
import tempfile
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import sys
import os

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, db
from models import User, Transaction, Category, UserCategoryLimit
from werkzeug.security import generate_password_hash


class SpendyAITestCase(unittest.TestCase):
    """Base test case for Spendy.AI application"""
    
    def setUp(self):
        """Set up test database and client"""
        # Override the database configuration for testing
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['SECRET_KEY'] = 'test-secret-key'
        
        # Disable rate limiting for tests
        app.config['RATELIMIT_ENABLED'] = False
        
        # Create a new app context for testing
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Create the database tables
        db.create_all()
        
        self.app = app.test_client()
        
        # Create test user with unique identifier
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        self.test_user = User(
            username=f'testuser_{unique_id}',
            email=f'test_{unique_id}@example.com',
            password_hash=generate_password_hash('testpassword123')
        )
        db.session.add(self.test_user)
        db.session.commit()
        
        # Create test categories
        self.categories = [
            Category(name='Food & Groceries', type='Expense'),
            Category(name='Transportation', type='Expense'),
            Category(name='Entertainment', type='Expense'),
            Category(name='Salary', type='Income')
        ]
        for category in self.categories:
            db.session.add(category)
        db.session.commit()
        
        # Create test transactions
        self.test_transactions = [
            Transaction(
                user_id=self.test_user.user_id,
                item='Lunch',
                price=500,
                category='Food & Groceries',
                type='Expense',
                date=datetime.now().date(),
                location='Colombo'
            ),
            Transaction(
                user_id=self.test_user.user_id,
                item='Bus fare',
                price=50,
                category='Transportation',
                type='Expense',
                date=datetime.now().date(),
                location='Colombo'
            ),
            Transaction(
                user_id=self.test_user.user_id,
                item='Salary',
                price=50000,
                category='Salary',
                type='Income',
                date=datetime.now().date(),
                location='Office'
            )
        ]
        for transaction in self.test_transactions:
            db.session.add(transaction)
        db.session.commit()
    
    def tearDown(self):
        """Clean up after tests"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
    
    def login_user(self):
        """Helper method to login test user"""
        with self.app.session_transaction() as sess:
            sess['user_id'] = self.test_user.user_id
            sess['email'] = self.test_user.email
            sess['logged_in'] = True


class AuthenticationTests(SpendyAITestCase):
    """Test authentication endpoints"""
    
    def test_signup_success(self):
        """Test successful user registration"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpassword123'
        }
        response = self.app.post('/api/signup', 
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        result = json.loads(response.data)
        self.assertIn('message', result)
        self.assertIn('newuser', result['message'])
    
    def test_signup_duplicate_email(self):
        """Test signup with existing email"""
        data = {
            'username': 'newuser',
            'email': self.test_user.email,  # Use the test user's email
            'password': 'newpassword123'
        }
        response = self.app.post('/api/signup',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 409)
    
    def test_signup_missing_fields(self):
        """Test signup with missing required fields"""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com'
            # Missing password
        }
        response = self.app.post('/api/signup',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
    
    @patch('app.send_otp_email')
    def test_login_success(self, mock_send_email):
        """Test successful login with OTP"""
        mock_send_email.return_value = True
        
        data = {
            'email': self.test_user.email,
            'password': 'testpassword123'
        }
        response = self.app.post('/api/login',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertTrue(result.get('otpRequired'))
        self.assertIn('otpHash', result)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.app.post('/api/login',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 401)
    
    @patch('app.send_otp_email')
    def test_forgot_password_success(self, mock_send_email):
        """Test successful forgot password request"""
        mock_send_email.return_value = True
        
        data = {
            'email': self.test_user.email
        }
        response = self.app.post('/api/forgot-password',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('otpHash', result)
    
    def test_forgot_password_user_not_found(self):
        """Test forgot password with non-existent user"""
        data = {
            'email': 'nonexistent@example.com'
        }
        response = self.app.post('/api/forgot-password',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 404)


class TransactionTests(SpendyAITestCase):
    """Test transaction-related endpoints"""
    
    def setUp(self):
        super().setUp()
        self.login_user()
    
    def test_get_all_transactions(self):
        """Test retrieving all transactions for a user"""
        response = self.app.get('/api/transactions')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 3)  # 3 test transactions
    
    def test_create_transaction(self):
        """Test creating a new transaction"""
        data = {
            'item': 'Coffee',
            'price': 200,
            'category': 'Food & Groceries',
            'type': 'Expense',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'location': 'Starbucks'
        }
        response = self.app.post('/api/transactions',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        result = json.loads(response.data)
        self.assertEqual(result['item'], 'Coffee')
        self.assertEqual(result['price'], 200)
    
    def test_create_transaction_missing_fields(self):
        """Test creating transaction with missing required fields"""
        data = {
            'item': 'Coffee',
            'price': 200
            # Missing category and type
        }
        response = self.app.post('/api/transactions',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
    
    def test_update_transaction(self):
        """Test updating an existing transaction"""
        transaction_id = self.test_transactions[0].transaction_id
        
        data = {
            'item': 'Updated Lunch',
            'price': 600
        }
        response = self.app.put(f'/api/transactions/{transaction_id}',
                              data=json.dumps(data),
                              content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertEqual(result['item'], 'Updated Lunch')
        self.assertEqual(result['price'], 600)
    
    def test_delete_transaction(self):
        """Test deleting a transaction"""
        transaction_id = self.test_transactions[0].transaction_id
        
        response = self.app.delete(f'/api/transactions/{transaction_id}')
        
        self.assertEqual(response.status_code, 200)
        
        # Verify transaction is deleted
        response = self.app.get('/api/transactions')
        result = json.loads(response.data)
        self.assertEqual(len(result), 2)  # Should be 2 transactions now
    
    def test_get_expense_transactions(self):
        """Test retrieving only expense transactions"""
        response = self.app.get('/api/transactions/expense')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIsInstance(result, list)
        # Should have 2 expense transactions
        self.assertEqual(len(result), 2)
        for transaction in result:
            self.assertEqual(transaction['type'], 'Expense')
    
    def test_get_income_transactions(self):
        """Test retrieving only income transactions"""
        response = self.app.get('/api/transactions/income')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIsInstance(result, list)
        # Should have 1 income transaction
        self.assertEqual(len(result), 1)
        for transaction in result:
            self.assertEqual(transaction['type'], 'Income')


class AnalyticsTests(SpendyAITestCase):
    """Test analytics and statistics endpoints"""
    
    def setUp(self):
        super().setUp()
        self.login_user()
    
    def test_get_financial_stats(self):
        """Test retrieving financial statistics"""
        response = self.app.get('/api/stats')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        
        # Check that required fields are present
        required_fields = ['total_income', 'total_expense', 'net_balance', 'monthly_stats']
        for field in required_fields:
            self.assertIn(field, result)
    
    def test_get_expense_summary(self):
        """Test retrieving expense summary by category"""
        response = self.app.get('/api/expense-summary')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        
        self.assertIsInstance(result, list)
        # Should have expense data for categories
        for item in result:
            self.assertIn('category', item)
            self.assertIn('total', item)
    
    def test_get_dashboard_data(self):
        """Test retrieving dashboard data"""
        response = self.app.get('/api/dashboard-data')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        
        # Check that required fields are present
        required_fields = ['recent_transactions', 'monthly_stats', 'category_breakdown']
        for field in required_fields:
            self.assertIn(field, result)


class UserSettingsTests(SpendyAITestCase):
    """Test user settings and profile endpoints"""
    
    def setUp(self):
        super().setUp()
        self.login_user()
    
    def test_get_user_profile(self):
        """Test retrieving user profile"""
        response = self.app.get('/api/profile')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        
        self.assertEqual(result['username'], self.test_user.username)
        self.assertEqual(result['email'], self.test_user.email)
    
    def test_change_password(self):
        """Test changing user password"""
        data = {
            'old_password': 'testpassword123',
            'new_password': 'newpassword123'
        }
        response = self.app.post('/api/change-password',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('message', result)
    
    def test_change_password_wrong_old_password(self):
        """Test changing password with wrong old password"""
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123'
        }
        response = self.app.post('/api/change-password',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 400)


class AITests(SpendyAITestCase):
    """Test AI-related functionality"""
    
    def setUp(self):
        super().setUp()
        self.login_user()
    
    @patch('app.call_anthropic_api')
    def test_process_message_transaction(self, mock_ai_call):
        """Test processing a transaction message through AI"""
        # Mock AI response
        mock_ai_call.return_value = {
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "item": "Coffee",
                        "category": "Food & Groceries",
                        "price": 200,
                        "type": "Expense",
                        "date": datetime.now().strftime('%Y-%m-%d'),
                        "location": "Starbucks",
                        "suggestions": []
                    })
                }
            }]
        }
        
        data = {
            'message': 'I spent 200 on coffee at Starbucks'
        }
        response = self.app.post('/process_message',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertIn('transaction_data', result)
    
    def test_ai_model_functions(self):
        """Test AI model utility functions"""
        from ai_model import arima_forecast, detect_anomalies, spending_pattern_analysis
        
        # Test ARIMA forecast
        import pandas as pd
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


class SecurityTests(SpendyAITestCase):
    """Test security and authentication"""
    
    def test_protected_route_without_login(self):
        """Test accessing protected route without login"""
        response = self.app.get('/api/transactions')
        self.assertEqual(response.status_code, 401)
    
    def test_session_check(self):
        """Test session check endpoint"""
        # Without login
        response = self.app.get('/api/session-check')
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertFalse(result.get('authenticated'))
        
        # With login
        self.login_user()
        response = self.app.get('/api/session-check')
        self.assertEqual(response.status_code, 200)
        result = json.loads(response.data)
        self.assertTrue(result.get('authenticated'))
    
    def test_logout(self):
        """Test logout functionality"""
        self.login_user()
        
        response = self.app.post('/api/logout')
        self.assertEqual(response.status_code, 200)
        
        # Verify session is cleared
        response = self.app.get('/api/session-check')
        result = json.loads(response.data)
        self.assertFalse(result.get('authenticated'))


if __name__ == '__main__':
    unittest.main() 