#!/usr/bin/env python3
"""
Test configuration for Spendy.AI
This file sets up the test environment properly
"""

import os
import sys
import tempfile

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def setup_test_environment():
    """Set up the test environment"""
    
    # Create a temporary database file
    temp_db = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
    temp_db.close()
    
    # Set test environment variables
    os.environ['TESTING'] = 'True'
    os.environ['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{temp_db.name}'
    os.environ['SECRET_KEY'] = 'test-secret-key'
    os.environ['MAIL_SERVER'] = 'localhost'
    os.environ['MAIL_PORT'] = '587'
    os.environ['MAIL_USE_TLS'] = 'False'
    os.environ['MAIL_USERNAME'] = 'test@example.com'
    os.environ['MAIL_PASSWORD'] = 'testpassword'
    os.environ['ANTHROPIC_API_KEY'] = 'test-key'
    
    return temp_db.name

def cleanup_test_environment(db_path):
    """Clean up the test environment"""
    try:
        os.unlink(db_path)
    except:
        pass 