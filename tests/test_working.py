#!/usr/bin/env python3
"""
Working tests for Spendy.AI
These tests work with the actual app structure
"""

import unittest
import json
import sys
import os
import tempfile

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class WorkingTests(unittest.TestCase):
    """Working tests that properly handle app configuration"""
    
    def setUp(self):
        """Set up test environment"""
        # Create a temporary database file
        self.temp_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
        self.temp_db.close()
        
        # Set environment variables before importing app
        os.environ['TESTING'] = 'True'
        os.environ['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{self.temp_db.name}'
        os.environ['SECRET_KEY'] = 'test-secret-key'
        os.environ['MAIL_SERVER'] = 'localhost'
        os.environ['MAIL_PORT'] = '587'
        os.environ['MAIL_USE_TLS'] = 'False'
        os.environ['MAIL_USERNAME'] = 'test@example.com'
        os.environ['MAIL_PASSWORD'] = 'testpassword'
        os.environ['ANTHROPIC_API_KEY'] = 'test-key'
        
        # Import app after environment is set up
        import app
        from models import db, User, Category
        
        # Configure app for testing
        app.app.config['TESTING'] = True
        app.app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{self.temp_db.name}'
        app.app.config['WTF_CSRF_ENABLED'] = False
        app.app.config['SECRET_KEY'] = 'test-secret-key'
        
        # Create app context
        self.app_context = app.app.app_context()
        self.app_context.push()
        
        # Create database tables
        db.create_all()
        
        # Create test client
        self.app = app.app.test_client()
        
        # Create test data
        self.create_test_data()
    
    def tearDown(self):
        """Clean up after tests"""
        try:
            self.app_context.pop()
        except:
            pass
        
        # Clean up database file
        try:
            os.unlink(self.temp_db.name)
        except:
            pass
    
    def create_test_data(self):
        """Create test data"""
        from models import db, User, Category
        from werkzeug.security import generate_password_hash
        
        # Create test user
        self.test_user = User(
            username='testuser',
            email='test@example.com',
            password_hash=generate_password_hash('testpassword123')
        )
        db.session.add(self.test_user)
        
        # Create test categories
        self.categories = [
            Category(name='Food & Groceries', type='Expense'),
            Category(name='Transportation', type='Expense'),
            Category(name='Salary', type='Income')
        ]
        for category in self.categories:
            db.session.add(category)
        
        db.session.commit()
    
    def login_user(self):
        """Helper method to login test user"""
        with self.app.session_transaction() as sess:
            sess['user_id'] = self.test_user.user_id
            sess['email'] = self.test_user.email
            sess['logged_in'] = True
    
    def test_app_import(self):
        """Test that app can be imported and configured"""
        self.assertTrue(True, "App imported and configured successfully")
    
    def test_database_connection(self):
        """Test database connection"""
        from models import db
        
        # Try to query the database
        result = db.session.execute('SELECT 1').scalar()
        self.assertEqual(result, 1)
    
    def test_user_creation(self):
        """Test user creation"""
        from models import User, db
        from werkzeug.security import generate_password_hash
        
        # Create a new user
        new_user = User(
            username='newuser',
            email='newuser@example.com',
            password_hash=generate_password_hash('password123')
        )
        db.session.add(new_user)
        db.session.commit()
        
        # Verify user was created
        user = User.query.filter_by(username='newuser').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, 'newuser@example.com')
    
    def test_category_creation(self):
        """Test category creation"""
        from models import Category, db
        
        # Create a new category
        new_category = Category(name='Test Category', type='Expense')
        db.session.add(new_category)
        db.session.commit()
        
        # Verify category was created
        category = Category.query.filter_by(name='Test Category').first()
        self.assertIsNotNone(category)
        self.assertEqual(category.type, 'Expense')
    
    def test_session_check_endpoint(self):
        """Test session check endpoint"""
        response = self.app.get('/api/session-check')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('authenticated', data)
        self.assertFalse(data['authenticated'])
    
    def test_session_check_authenticated(self):
        """Test session check when authenticated"""
        self.login_user()
        
        response = self.app.get('/api/session-check')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIn('authenticated', data)
        self.assertTrue(data['authenticated'])
    
    def test_signup_endpoint(self):
        """Test signup endpoint"""
        data = {
            'username': 'signuptest',
            'email': 'signuptest@example.com',
            'password': 'password123'
        }
        
        response = self.app.post('/api/signup',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        
        result = json.loads(response.data)
        self.assertIn('message', result)
    
    def test_signup_duplicate_email(self):
        """Test signup with duplicate email"""
        data = {
            'username': 'duplicate',
            'email': 'test@example.com',  # Already exists
            'password': 'password123'
        }
        
        response = self.app.post('/api/signup',
                               data=json.dumps(data),
                               content_type='application/json')
        
        self.assertEqual(response.status_code, 409)
    
    def test_login_endpoint(self):
        """Test login endpoint"""
        data = {
            'email': 'test@example.com',
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
    
    def test_forgot_password_endpoint(self):
        """Test forgot password endpoint"""
        data = {
            'email': 'test@example.com'
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
    
    def test_protected_route_without_login(self):
        """Test accessing protected route without login"""
        response = self.app.get('/api/transactions')
        self.assertEqual(response.status_code, 401)
    
    def test_logout_endpoint(self):
        """Test logout endpoint"""
        self.login_user()
        
        response = self.app.post('/api/logout')
        self.assertEqual(response.status_code, 200)
        
        # Verify session is cleared
        response = self.app.get('/api/session-check')
        data = json.loads(response.data)
        self.assertFalse(data.get('authenticated'))


if __name__ == '__main__':
    unittest.main() 