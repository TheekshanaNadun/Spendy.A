from flask import Flask,session , jsonify, request,redirect
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS

from datetime import timedelta, datetime
import hashlib
import random
from sqlalchemy import extract, func
from sqlalchemy.exc import SQLAlchemyError
import os
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from flask_mail import Mail, Message
from calendar import month_name, monthrange
import logging
from dateutil.relativedelta import relativedelta
import pandas as pd
from prophet import Prophet
import numpy as np
import base64

# Import the centralized db instance and models
from models import db, User, Transaction, Category, UserCategoryLimit

# Simple in-memory cache for session checks
session_cache = {}
import threading
cache_lock = threading.Lock()

load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Ensure Flask logs WARNING and above to the console
app.logger.setLevel(logging.WARNING)
if not app.logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.WARNING)
    app.logger.addHandler(handler)
app.secret_key = os.getenv("SECRET_KEY")
OTP_EXPIRY = 300  # 5 minutes




# Configure Flask-Session
app.config.update(
    SESSION_COOKIE_NAME='spendy_session',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False,
    PERMANENT_SESSION_LIFETIME=timedelta(hours=1)
)

# Configure MySQL connection
db_user = os.getenv('MYSQL_USER')
db_password = os.getenv('MYSQL_PASSWORD')
db_host = os.getenv('MYSQL_HOST')
db_name = os.getenv('MYSQL_DATABASE')
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}"

# Database performance optimizations
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'implicit_returning': False,
    'execution_options': {'isolation_level': 'READ COMMITTED'},
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
    'max_overflow': 20
}

# Initialize extensions
db.init_app(app)

# Configure CORS
CORS(app, 
     resources={r"/api/*": {
         "origins": ["http://localhost", "http://localhost:80", "http://localhost:3000"],
         "supports_credentials": True,
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         "allow_headers": ["Content-Type", "Authorization"]
     }})

def require_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function



# Routes
@app.route('/api/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not all([username, email, password]):
            return jsonify({"error": "Missing required fields"}), 400

        if User.query.filter((User.username == username) | (User.email == email)).first():
            return jsonify({"error": "Username or email already exists"}), 409

        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({"message": f"User {username} created successfully!"}), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Signup error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500






# Add to config.py
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-very-secure-secret-key')
OTP_EXPIRY = 300  # 5 minutes

# Modified login route
def send_otp_email(recipient_email, otp):
    try:
        msg = Message(
            'Your SpendyAI Verification Code',
            sender=app.config['MAIL_USERNAME'],
            recipients=[recipient_email]
        )
        msg.body = f'Your verification code is: {otp}'
        mail.send(msg)
        return True
    except Exception as e:
        app.logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False





# Add after app initialization
app.config.update(
    MAIL_SERVER=os.getenv('MAIL_SERVER'),
    MAIL_PORT=int(os.getenv('MAIL_PORT', 587)),
    MAIL_USE_TLS=os.getenv('MAIL_USE_TLS', 'true').lower() in ['true', '1', 't'],
    MAIL_USERNAME=os.getenv('MAIL_USERNAME'),
    MAIL_PASSWORD=os.getenv('MAIL_PASSWORD'),
    MAIL_DEFAULT_SENDER=os.getenv('MAIL_USERNAME')
)

mail = Mail(app)


# Modified login route
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401

        # Generate OTP and hash
        otp = str(random.SystemRandom().randint(100000, 999999))
        expires = int(time.time()) + OTP_EXPIRY
        data_str = f"{email}.{otp}.{expires}"
        otp_hash = hashlib.sha256(f"{data_str}{SECRET_KEY}".encode()).hexdigest()
        
        # Send OTP via email
        try:
            send_otp_email(email, otp)
        except Exception as e:
            return jsonify({"error": "Failed to send OTP email"}), 503

        return jsonify({
            "message": "OTP sent to email",
            "otpRequired": True,
            "otpHash": f"{otp_hash}.{expires}",
            "email": email
        }), 200

    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Modified resend OTP route
@app.route('/api/resend-otp', methods=['POST'])
def resend_otp():
    try:
        data = request.get_json()
        email = data['email']
        
        # Verify user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Generate new OTP and hash
        otp = str(random.SystemRandom().randint(100000, 999999))
        expires = int(time.time()) + OTP_EXPIRY
        data_str = f"{email}.{otp}.{expires}"
        otp_hash = hashlib.sha256(f"{data_str}{SECRET_KEY}".encode()).hexdigest()

        # Resend OTP via email
        try:
            send_otp_email(email, otp)
        except Exception as e:
            return jsonify({"error": "Failed to resend OTP email"}), 503

        return jsonify({
            "message": "New OTP sent",
            "otpHash": f"{otp_hash}.{expires}"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def send_otp_email(recipient_email, otp):
    try:
        msg = Message(
            subject='Your SpendyAI Verification Code',
            recipients=[recipient_email],
            body=f'Your verification code is: {otp}'
        )
        mail.send(msg)
        return True
    except Exception as e:
        app.logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False
    
from flask import abort

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json()
        email = data['email']
        user_otp = data['otp']
        received_hash = data['otpHash']

        # Validate hash structure
        if '.' not in received_hash:
            return jsonify({"error": "Invalid OTP format"}), 400
            
        hash_part, expires = received_hash.split('.', 1)
        
        # Check expiration
        if int(expires) < time.time():
            return jsonify({"error": "OTP expired"}), 401

        # Recreate verification hash
        data_str = f"{email}.{user_otp}.{expires}"
        expected_hash = hashlib.sha256(f"{data_str}{SECRET_KEY}".encode()).hexdigest()

        # Validate OTP hash
        if expected_hash != hash_part:
            return jsonify({"error": "Invalid OTP"}), 401

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Only set session after successful validation
        session.permanent = True
        session['user_id'] = user.user_id
        session['email'] = user.email
        session['logged_in'] = True
        # Cache user info in session for faster session checks
        session['user_info'] = {
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email
        }

        # Redirect to dashboard with welcome parameter
        redirect_url = 'http://localhost:3000/dashboard?showWelcome=true'
        return jsonify({
            "success": True,
            "redirect": redirect_url,
            "user": {
                "user_id": user.user_id,
                "email": email
            }
        }), 200

    except Exception as e:
        app.logger.error(f"OTP verification failed: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500



@app.route('/api/session-check', methods=['GET'])
def session_check():
    if 'user_id' in session and session.get('logged_in'):
        user_id = session['user_id']
        
        # Check cache first
        with cache_lock:
            if user_id in session_cache:
                cached_data = session_cache[user_id]
                if time.time() - cached_data['timestamp'] < 300:  # 5 minute cache
                    return jsonify({
                        "authenticated": True,
                        "user": cached_data['user_info']
                    }), 200
        
        # Use cached user info from session instead of database query
        user_info = session.get('user_info')
        if user_info:
            # Update cache
            with cache_lock:
                session_cache[user_id] = {
                    'user_info': user_info,
                    'timestamp': time.time()
                }
            return jsonify({
                "authenticated": True,
                "user": user_info
            }), 200
        else:
            # Fallback to database query only if session info is missing
            user = User.query.get(session['user_id'])
            if not user:
                session.clear()
                # Clear cache
                with cache_lock:
                    session_cache.pop(user_id, None)
                return jsonify({"authenticated": False}), 401
            # Cache user info in session
            user_info = {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email
            }
            session['user_info'] = user_info
            # Update cache
            with cache_lock:
                session_cache[user_id] = {
                    'user_info': user_info,
                    'timestamp': time.time()
                }
            return jsonify({
                "authenticated": True,
                "user": user_info
            }), 200
    return jsonify({"authenticated": False}), 401






@app.route('/api/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    session.clear()
    # Clear cache
    if user_id:
        with cache_lock:
            session_cache.pop(user_id, None)
    return jsonify({"message": "Logged out successfully"}), 200





# User Routes
@app.route('/api/user', methods=['GET'])
@require_login
def user_settings():
    try:
        user = User.query.get(session['user_id'])
        return jsonify({
            "user_id": user.user_id,
            "monthly_limit": user.monthly_limit
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# Category Routes
@app.route('/api/categories', methods=['GET'])
@require_login
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([{
            'category_id': c.category_id,
            'name': c.name,
            'type': c.type
        } for c in categories]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user', methods=['PATCH'])
@require_login
def update_user_settings():
    try:
        user = User.query.get(session['user_id'])
        data = request.get_json()
        
        if 'monthly_limit' not in data:
            return jsonify({"error": "Missing monthly_limit field"}), 400
            
        # Convert to integer and validate
        try:
            monthly_limit = int(data['monthly_limit'])
            if monthly_limit < 0:
                raise ValueError
        except ValueError:
            return jsonify({"error": "Invalid monthly limit value"}), 400
            
        user.monthly_limit = monthly_limit
        db.session.commit()
        
        return jsonify({
            "message": "Monthly limit updated",
            "monthly_limit": user.monthly_limit
        }), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Database error: {str(e)}")
        return jsonify({"error": "Database update failed"}), 500
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "Server error"}), 500


# Category Limit Routes
@app.route('/api/user-limits', methods=['GET', 'POST'])
@require_login
def user_limits():
    user_id = session['user_id']
    
    try:
        if request.method == 'GET':
            limits = db.session.query(
                UserCategoryLimit,
                Category.name
            ).join(Category).filter(
                UserCategoryLimit.user_id == user_id
            ).all()
            
            return jsonify([{
                "limit_id": limit.UserCategoryLimit.limit_id,
                "category_id": limit.UserCategoryLimit.category_id,
                "monthly_limit": float(limit.UserCategoryLimit.monthly_limit),
                "category_name": limit.name
            } for limit in limits]), 200
            
        if request.method == 'POST':
            data = request.get_json()
            # Validate category exists
            if not Category.query.get(data['category_id']):
                return jsonify({"error": "Invalid category ID"}), 400
                
            # Use upsert pattern
            limit = UserCategoryLimit.query.filter_by(
                user_id=user_id,
                category_id=data['category_id']
            ).first()
            
            if limit:
                limit.monthly_limit = data['monthly_limit']
            else:
                limit = UserCategoryLimit(
                    user_id=user_id,
                    category_id=data['category_id'],
                    monthly_limit=data['monthly_limit']
                )
                db.session.add(limit)
            
            db.session.commit()
            return jsonify({
                "limit_id": limit.limit_id,
                "category_id": limit.category_id,
                "monthly_limit": float(limit.monthly_limit)
            }), 200
            
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"User limits error: {str(e)}")
        return jsonify({"error": "Server error processing limits"}), 500

@app.route('/api/user-limits/<int:limit_id>', methods=['DELETE'])
@require_login
def delete_limit(limit_id):
    limit = UserCategoryLimit.query.filter_by(
        limit_id=limit_id,
        user_id=session['user_id']
    ).first()
    
    if not limit:
        return jsonify({"error": "Limit not found"}), 404
        
    db.session.delete(limit)
    db.session.commit()
    return jsonify({"message": "Limit deleted"}), 200

# Transaction Routes
@app.route('/api/transactions', methods=['GET'])
@require_login
def get_all_transactions():
    try:
        user_id = session['user_id']
        page = request.args.get('page', 1, type=int)
        per_page = 10

        transactions = Transaction.query.filter_by(user_id=user_id)\
            .order_by(Transaction.date.desc(), Transaction.timestamp.desc())\
            .paginate(page=page, per_page=per_page)

        return jsonify([{
            "transaction_id": t.transaction_id,
            "item": t.item,
            "price": t.price,
            "date": t.date.isoformat(),
            "timestamp": t.timestamp.isoformat() if t.timestamp else datetime.min.isoformat(),          
            "location": t.location,
            "category": t.category,
            "type": t.type,
            "latitude": t.latitude,
            "longitude": t.longitude
        } for t in transactions.items]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


from sqlalchemy import text

@app.route('/api/transactions', methods=['POST'])
@require_login
def create_transaction():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ['item', 'price', 'date', 'category', 'type']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if category exists
        category = Category.query.filter_by(name=data['category']).first()
        if not category:
            category = Category(
                name=data['category'],
                type=data['type']
            )
            db.session.add(category)
            db.session.flush()

        # Use ORM to create the transaction
        new_transaction = Transaction(
            user_id=session['user_id'],
            category=data['category'],
            type=data['type'],
            item=data['item'],
            price=int(data['price']),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            location=data.get('location'),
            timestamp=datetime.now().time(),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        db.session.add(new_transaction)
        db.session.commit()

        return jsonify({
            "message": "Transaction created successfully",
            "transaction_id": int(new_transaction.transaction_id)
        }), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        app.logger.error(f'Database error: {str(e)}')
        return jsonify({"error": "Database operation failed"}), 500
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Unexpected error: {str(e)}')
        return jsonify({"error": "Server error"}), 500



@app.route('/api/transactions/<int:transaction_id>', methods=['PUT', 'DELETE'])
@require_login
def manage_transaction(transaction_id):
    transaction = Transaction.query.filter_by(
        transaction_id=transaction_id,
        user_id=session['user_id']
    ).first()
    
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
        
    if request.method == 'PUT':
        data = request.get_json()
        
        try:
            # Handle combined category|type format
            if 'category' in data:
                if '|' not in data['category']:
                    return jsonify({"error": "Invalid category format. Use 'Category|Type'"}), 400
                
                category_parts = data['category'].split('|')
                if len(category_parts) != 2:
                    return jsonify({"error": "Invalid category format. Use 'Category|Type'"}), 400
                
                category_name, category_type = category_parts
                category_type = category_type.capitalize()

                # Validate category exists with exact type
                existing_category = Category.query.filter_by(
                    name=category_name.strip(),
                    type=category_type
                ).first()

                if not existing_category:
                    return jsonify({
                        "error": f"Category '{category_name}' with type '{category_type}' not found"
                    }), 400

                # Update both fields from the combined value
                transaction.category = existing_category.name
                transaction.type = existing_category.type

            # Handle date conversion
            if 'date' in data:
                transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            
            # Update other fields (excluding category/type which we handled above)
            fields = ['item', 'price', 'location', 
                     'timestamp', 'latitude', 'longitude']
            for field in fields:
                if field in data:
                    setattr(transaction, field, data[field])
            
            db.session.commit()
            return jsonify({"message": "Transaction updated"}), 200
            
        except ValueError as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400
        except SQLAlchemyError as e:
            db.session.rollback()
            app.logger.error(f'Database error: {str(e)}')
            return jsonify({"error": "Database operation failed"}), 500
        except Exception as e:
            db.session.rollback()
            app.logger.error(f'Unexpected error: {str(e)}')
            return jsonify({"error": "Server error"}), 500
        
    if request.method == 'DELETE':
        try:
            db.session.delete(transaction)
            db.session.commit()
            return jsonify({"message": "Transaction deleted"}), 200
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({"error": "Failed to delete transaction"}), 500

@app.route('/api/transactions/expense', methods=['GET'])
@require_login
def get_expense_transactions():
    try:
        user_id = session['user_id']
        today = datetime.utcnow().date()
        first_day_of_month = today.replace(day=1)
        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= first_day_of_month,
            Transaction.date <= today
        ).options(db.joinedload(Transaction.category_rel)).order_by(Transaction.date.desc()).all()

        return jsonify([{
            "transaction_id": t.transaction_id,
            "date": t.date.isoformat(),
            "item": t.item,
            "category": t.category,
            "location": t.location,
            "price": t.price,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "coordinates": {"lat": t.latitude, "lng": t.longitude} if t.latitude and t.longitude else None
        } for t in transactions]), 200

    except SQLAlchemyError as e:
        app.logger.error(f'Database error: {str(e)}')
        return jsonify({"error": "Database operation failed"}), 500
    except Exception as e:
        app.logger.error(f'Unexpected error: {str(e)}')
        return jsonify({"error": "Server error"}), 500

@app.route('/api/transactions/income', methods=['GET'])
@require_login
def get_income_transactions():
    try:
        user_id = session['user_id']
        transactions = Transaction.query.filter_by(
            user_id=user_id,
            type='Income'
        ).options(db.joinedload(Transaction.category_rel)).order_by(Transaction.date.desc()).all()

        return jsonify([{
            "transaction_id": t.transaction_id,
            "date": t.date.isoformat(),
            "item": t.item,
            "category": t.category,
            "location": t.location,
            "price": t.price,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "coordinates": {"lat": t.latitude, "lng": t.longitude} if t.latitude and t.longitude else None
        } for t in transactions]), 200

    except SQLAlchemyError as e:
        app.logger.error(f'Database error: {str(e)}')
        return jsonify({"error": "Database operation failed"}), 500
    except Exception as e:
        app.logger.error(f'Unexpected error: {str(e)}')
        return jsonify({"error": "Server error"}), 500



@app.route('/api/stats', methods=['GET'])
@require_login
def get_financial_stats():
    try:
        user_id = session['user_id']
        today = datetime.utcnow().date()

        # This month's range
        first_day_current_month = today.replace(day=1)
        if first_day_current_month.month == 12:
            first_day_next_month = first_day_current_month.replace(year=today.year + 1, month=1)
        else:
            first_day_next_month = first_day_current_month.replace(month=today.month + 1)

        # Last month's range
        first_day_last_month = (first_day_current_month - timedelta(days=1)).replace(day=1)

        # Current month income
        current_month_income = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Income',
            Transaction.date >= first_day_current_month,
            Transaction.date < first_day_next_month
        ).scalar()

        # Last month income
        last_month_income = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Income',
            Transaction.date >= first_day_last_month,
            Transaction.date < first_day_current_month
        ).scalar()

        # Current month expense
        current_month_expense = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= first_day_current_month,
            Transaction.date < first_day_next_month
        ).scalar()

        # Last month expense
        last_month_expense = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= first_day_last_month,
            Transaction.date < first_day_current_month
        ).scalar()

        # Total savings
        total_income = db.session.query(func.coalesce(func.sum(Transaction.price), 0)).filter(Transaction.user_id == user_id, Transaction.type == 'Income').scalar()
        total_expense = db.session.query(func.coalesce(func.sum(Transaction.price), 0)).filter(Transaction.user_id == user_id, Transaction.type == 'Expense').scalar()
        total_savings = total_income - total_expense

        net_profit = current_month_income - current_month_expense

        # Debug: Log all transactions for the current user in the current month
        debug_transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= first_day_current_month,
            Transaction.date < first_day_next_month
        ).all()
        app.logger.info(f"Current month transactions for user {user_id}:")
        for t in debug_transactions:
            app.logger.info(f"ID: {t.transaction_id}, Type: {t.type}, Date: {t.date}, Price: {t.price}, Item: {t.item}")

        return jsonify([
            {
                'type': 'Income',
                'total': float(current_month_income),
                'period': 'currentMonth'
            },
            {
                'type': 'Income',
                'total': float(last_month_income),
                'period': 'lastMonth'
            },
            {
                'type': 'Expense',
                'total': float(current_month_expense),
                'period': 'currentMonth'
            },
            {
                'type': 'Expense',
                'total': float(last_month_expense),
                'period': 'lastMonth'
            },
            {
                'type': 'Income',
                'total': float(total_income),
                'period': 'total'
            },
            {
                'type': 'Expense',
                'total': float(total_expense),
                'period': 'total'
            },
            {
                'type': 'NetProfit',
                'total': float(net_profit),
                'period': 'currentMonth'
            },
            {
                'type': 'Savings',
                'total': float(total_savings),
                'period': 'total'
            }
        ]), 200

    except Exception as e:
        app.logger.error(f"Error fetching stats: {str(e)}")
        return jsonify({"error": "Error retrieving statistics"}), 500


@app.route('/api/expense-summary', methods=['GET'])
@require_login
def get_expense_summary():
    try:
        user_id = session['user_id']
        
        # Query to sum expenses by category for the current user
        expense_summary = db.session.query(
            Category.name,
            func.sum(Transaction.price).label('total_expenses')
        ).join(Transaction, Category.name == Transaction.category)\
         .filter(Transaction.user_id == user_id, Transaction.type == 'Expense')\
         .group_by(Category.name)\
         .order_by(func.sum(Transaction.price).desc())\
         .all()

        # Format the data for the frontend (e.g., for a pie chart)
        chart_data = {
            'labels': [row.name for row in expense_summary],
            'series': [float(row.total_expenses) for row in expense_summary]
        }
        
        return jsonify(chart_data), 200

    except Exception as e:
        app.logger.error(f"Error fetching expense summary: {str(e)}")
        return jsonify({"error": "Error retrieving expense summary"}), 500

@app.route('/api/category-budget-status', methods=['GET'])
@require_login
def get_category_budget_status():
    """Get comprehensive budget status for all categories including limits and spending"""
    try:
        user_id = session['user_id']
        app.logger.info(f"Fetching budget status for user_id: {user_id}")
        
        today = datetime.utcnow().date()
        
        # Get current month range
        first_day_current_month = today.replace(day=1)
        if first_day_current_month.month == 12:
            first_day_next_month = first_day_current_month.replace(year=today.year + 1, month=1)
        else:
            first_day_next_month = first_day_current_month.replace(month=today.month + 1)
        
        # Get last month range
        first_day_last_month = (first_day_current_month - timedelta(days=1)).replace(day=1)
        
        app.logger.info(f"Date calculation debug:")
        app.logger.info(f"  today: {today}")
        app.logger.info(f"  first_day_current_month: {first_day_current_month}")
        app.logger.info(f"  first_day_next_month: {first_day_next_month}")
        app.logger.info(f"  first_day_last_month: {first_day_last_month}")
        
        app.logger.info(f"Date ranges - Current: {first_day_current_month} to {first_day_next_month}, Last: {first_day_last_month} to {first_day_current_month}")
        
        # Get categories that the user actually has transactions for (more efficient)
        user_categories = db.session.query(
            Transaction.category
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense'
        ).distinct().all()
        
        app.logger.info(f"Found {len(user_categories)} categories with transactions for user")
        
        if not user_categories:
            app.logger.warning("No expense categories with transactions found for user")
            return jsonify([]), 200
        
        result = []
        
        for category_row in user_categories:
            category_name = category_row.category
            app.logger.info(f"Processing category: {category_name}")
            
            try:
                # Get user's budget limit for this category
                # First find the category record to get category_id
                category_record = Category.query.filter_by(name=category_name).first()
                monthly_limit = 0
                
                if category_record:
                    # Then find the user's limit for this category
                    user_limit = UserCategoryLimit.query.filter_by(
                        user_id=user_id,
                        category_id=category_record.category_id
                    ).first()
                    
                    if user_limit:
                        monthly_limit = float(user_limit.monthly_limit)
                    else:
                        monthly_limit = 0.0
                        app.logger.info(f"Category {category_name}: No budget limit set")
                else:
                    app.logger.warning(f"Category '{category_name}' not found in Category table")
                
                app.logger.info(f"Category {category_name}: monthly_limit = {monthly_limit}")
                
                # Debug: Check if user limit exists
                if user_limit:
                    app.logger.info(f"Category {category_name}: Found user limit: {user_limit.monthly_limit}")
                else:
                    app.logger.info(f"Category {category_name}: No user limit found")
                
                # Get current month spending for this category
                current_month_spending = db.session.query(
                    func.coalesce(func.sum(Transaction.price), 0)
                ).filter(
                    Transaction.user_id == user_id,
                    Transaction.category == category_name,
                    Transaction.type == 'Expense',
                    Transaction.date >= first_day_current_month,
                    Transaction.date < first_day_next_month
                ).scalar()
                
                # Get last month spending for this category
                last_month_spending = db.session.query(
                    func.coalesce(func.sum(Transaction.price), 0)
                ).filter(
                    Transaction.user_id == user_id,
                    Transaction.category == category_name,
                    Transaction.type == 'Expense',
                    Transaction.date >= first_day_last_month,
                    Transaction.date < first_day_current_month
                ).scalar()
                
                app.logger.info(f"Category {category_name}: current_month_spending = {current_month_spending}, last_month_spending = {last_month_spending}")
                
                # Debug: Check if there are any transactions for this category
                all_transactions = Transaction.query.filter(
                    Transaction.user_id == user_id,
                    Transaction.category == category_name,
                    Transaction.type == 'Expense'
                ).all()
                app.logger.info(f"Category {category_name}: Total transactions found: {len(all_transactions)}")
                if all_transactions:
                    app.logger.info(f"Category {category_name}: Sample transaction dates: {[t.date for t in all_transactions[:3]]}")
                
                # Calculate remaining budget - ensure all values are float
                remaining_budget = float(monthly_limit) - float(current_month_spending)
                
                result.append({
                    'name': category_name,
                    'limit': float(monthly_limit),
                    'spent': float(current_month_spending),
                    'lastMonthSpent': float(last_month_spending)
                })
                
            except Exception as cat_error:
                app.logger.error(f"Error processing category {category_name}: {str(cat_error)}")
                # Continue with other categories even if one fails
                continue
        
        # Sort by spending amount (highest first)
        result.sort(key=lambda x: x['spent'], reverse=True)
        
        app.logger.info(f"Final result: {len(result)} categories processed successfully")
        app.logger.info(f"Result data: {result}")
        
        return jsonify(result), 200
        
    except Exception as e:
        import traceback
        app.logger.error(f"Error fetching category budget status: {str(e)}")
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Error retrieving category budget status: {str(e)}"}), 500

@app.route('/api/test-categories', methods=['GET'])
@require_login
def test_categories():
    """Test endpoint to verify database connectivity and basic category data"""
    try:
        user_id = session['user_id']
        
        # Test basic queries
        categories_count = Category.query.count()
        expense_categories = Category.query.filter_by(type='Expense').count()
        user_limits_count = UserCategoryLimit.query.filter_by(user_id=user_id).count()
        transactions_count = Transaction.query.filter_by(user_id=user_id).count()
        
        # Get detailed category information
        categories = Category.query.filter_by(type='Expense').all()
        category_details = []
        for cat in categories:
            user_limit = UserCategoryLimit.query.filter_by(
                user_id=user_id,
                category_id=cat.category_id
            ).first()
            
            category_details.append({
                'category_id': cat.category_id,
                'name': cat.name,
                'type': cat.type,
                'has_user_limit': user_limit is not None,
                'limit_amount': float(user_limit.monthly_limit) if user_limit else 0
            })
        
        return jsonify({
            'status': 'success',
            'user_id': user_id,
            'total_categories': categories_count,
            'expense_categories': expense_categories,
            'user_limits': user_limits_count,
            'user_transactions': transactions_count,
            'category_details': category_details
        }), 200
        
    except Exception as e:
        import traceback
        app.logger.error(f"Test endpoint error: {str(e)}")
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Test failed: {str(e)}"}), 500

@app.route('/api/debug-category-data', methods=['GET'])
@require_login
def debug_category_data():
    """Debug endpoint to see raw database data"""
    try:
        user_id = session['user_id']
        
        # Get all expense categories
        categories = Category.query.filter_by(type='Expense').all()
        
        # Get all user category limits
        user_limits = UserCategoryLimit.query.filter_by(user_id=user_id).all()
        
        # Get all transactions for this user
        transactions = Transaction.query.filter_by(user_id=user_id).all()
        
        # Get current month transactions
        today = datetime.utcnow().date()
        first_day_current_month = today.replace(day=1)
        if first_day_current_month.month == 12:
            first_day_next_month = first_day_current_month.replace(year=today.year + 1, month=1)
        else:
            first_day_next_month = first_day_current_month.replace(month=today.month + 1)
        
        current_month_transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= first_day_current_month,
            Transaction.date < first_day_next_month
        ).all()
        
        return jsonify({
            'categories': [{'id': c.category_id, 'name': c.name, 'type': c.type} for c in categories],
            'user_limits': [{'category_id': ul.category_id, 'limit': float(ul.monthly_limit)} for ul in user_limits],
            'all_transactions': [{'id': t.transaction_id, 'category': t.category, 'price': t.price, 'date': str(t.date)} for t in transactions],
            'current_month_transactions': [{'id': t.transaction_id, 'category': t.category, 'price': t.price, 'date': str(t.date)} for t in current_month_transactions],
            'date_info': {
                'today': str(today),
                'first_day_current_month': str(first_day_current_month),
                'first_day_next_month': str(first_day_next_month)
            }
        }), 200
        
    except Exception as e:
        import traceback
        app.logger.error(f"Debug endpoint error: {str(e)}")
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Debug failed: {str(e)}"}), 500

# Removed complex icon and color functions - not needed

@app.route('/api/dashboard-data', methods=['GET'])
@require_login
def dashboard_data():
    try:
        user_id = session['user_id']
        today = datetime.utcnow().date()
        # Get the first day of this month
        first_month = today.replace(day=1)
        # Get the first day 12 months ago
        if first_month.month == 12:
            first_month_last_year = first_month.replace(year=first_month.year-1, month=1)
        else:
            first_month_last_year = (first_month.replace(month=first_month.month-11) if first_month.month > 11 else first_month.replace(year=first_month.year-1, month=first_month.month+1))

        # Prepare months list (oldest to newest)
        months = []
        month_labels = []
        month_lookup = []
        current = first_month
        for i in range(12):
            month_date = current - relativedelta(months=11 - i)
            year = month_date.year
            month = month_date.month
            label = f"{month_name[month][:3]} {year}"
            months.append((year, month))
            month_labels.append(label)
            month_lookup.append((year, month))

        # Find the last month/year in your dashboard range
        from calendar import monthrange
        last_year, last_month = months[-1]
        last_day = monthrange(last_year, last_month)[1]
        last_date = datetime(last_year, last_month, last_day).date()

        # Fetch all transactions for the user in the dashboard range (up to last day of latest month)
        transactions = Transaction.query.filter(
            Transaction.user_id == user_id,
            Transaction.date >= first_month_last_year,
            Transaction.date <= last_date
        ).all()

        # Aggregate monthly income and expense
        monthly_income = [0 for _ in range(12)]
        monthly_expense = [0 for _ in range(12)]
        net_profit = [0 for _ in range(12)]
        for t in transactions:
            t_year = t.date.year
            t_month = t.date.month
            if (t_year, t_month) in month_lookup:
                idx = month_lookup.index((t_year, t_month))
                if t.type == 'Income':
                    monthly_income[idx] += t.price
                elif t.type == 'Expense':
                    monthly_expense[idx] += t.price
        for i in range(12):
            net_profit[i] = monthly_income[i] - monthly_expense[i]

        # Only use current month for category breakdowns (1st to last day)
        current_year, current_month = months[-1]
        expense_by_category = {}
        income_by_category = {}
        for t in transactions:
            if (
                t.date.year == current_year and
                t.date.month == current_month
            ):
                if t.type == 'Expense':
                    expense_by_category[t.category] = expense_by_category.get(t.category, 0) + t.price
                elif t.type == 'Income':
                    income_by_category[t.category] = income_by_category.get(t.category, 0) + t.price

        # Calculate currentMonthIncome and currentMonthExpense for full month
        currentMonthIncome = sum(
            t.price for t in transactions
            if t.type == 'Income' and t.date.year == current_year and t.date.month == current_month
        )
        currentMonthExpense = sum(
            t.price for t in transactions
            if t.type == 'Expense' and t.date.year == current_year and t.date.month == current_month
        )

        # Map data
        map_points = [
            {
                'lat': float(t.latitude),
                'lng': float(t.longitude),
                'amount': float(t.price),
                'type': t.type
            }
            for t in transactions if t.latitude is not None and t.longitude is not None
        ]

        # Add summary fields for widgets
        lastMonthIncome = monthly_income[-2] if len(monthly_income) > 1 else 0
        lastMonthExpense = monthly_expense[-2] if len(monthly_expense) > 1 else 0
        currentNetProfit = net_profit[-1] if net_profit else 0
        totalSavings = sum(monthly_income) - sum(monthly_expense)

        return jsonify({
            'months': month_labels,
            'monthlyIncome': monthly_income,
            'monthlyExpense': monthly_expense,
            'netProfit': net_profit,
            'expenseCategories': list(expense_by_category.keys()),
            'expenseByCategory': list(expense_by_category.values()),
            'incomeCategories': list(income_by_category.keys()),
            'incomeByCategory': list(income_by_category.values()),
            'mapData': map_points,
            'currentMonthIncome': currentMonthIncome,
            'lastMonthIncome': lastMonthIncome,
            'currentMonthExpense': currentMonthExpense,
            'lastMonthExpense': lastMonthExpense,
            'netProfitCurrent': currentNetProfit,
            'totalSavings': totalSavings
        }), 200
    except Exception as e:
        import traceback
        app.logger.error(f"Error fetching dashboard data: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Error retrieving dashboard data', 'details': str(e)}), 500

@app.route('/api/predict', methods=['GET'])
@require_login
def predict_next_month():
    try:
        user_id = session['user_id']
        # Fetch all transactions for the user
        transactions = Transaction.query.filter_by(user_id=user_id).all()
        
        # If no transactions, return empty arrays with success status
        if not transactions:
            return jsonify({
                'expense': [0.0] * 30,
                'income': [0.0] * 30,
                'dates': [],
                'expense_accuracy': None,
                'income_accuracy': None
            })

        # Build DataFrame
        data = [{
            'date': t.date,
            'type': t.type,
            'price': float(t.price) if t.price is not None else 0.0
        } for t in transactions]
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])

        # Prepare Prophet DataFrames
        def prepare_prophet_df(df, ttype):
            dff = df[df['type'] == ttype].groupby('date').sum(numeric_only=True).reset_index()
            dff = dff.rename(columns={'date': 'ds', 'price': 'y'})
            return dff

        expense_df = prepare_prophet_df(df, 'Expense')
        income_df = prepare_prophet_df(df, 'Income')

        # Sri Lankan holidays (add more as needed)
        holidays = pd.DataFrame({
            'holiday': [
                'avurudu', 'vesak', 'christmas', 'new_year', 'independence_day'
            ],
            'ds': pd.to_datetime([
                '2024-04-13',  # Avurudu
                '2024-05-23',  # Vesak (example, update to actual poya)
                '2024-12-25',  # Christmas
                '2024-01-01',  # New Year
                '2024-02-04',  # Independence Day
            ]),
            'lower_window': 0,
            'upper_window': 2
        })

        def prophet_forecast(df, holidays, periods=30):
            if len(df) < 3:
                return [0.0] * periods, None
            m = Prophet(holidays=holidays, yearly_seasonality=True, weekly_seasonality=True)
            m.fit(df)
            future = m.make_future_dataframe(periods=periods)
            forecast = m.predict(future)
            yhat = forecast['yhat'][-periods:].tolist()
            # Calculate accuracy if enough data
            if len(df) > 40:
                train = df.iloc[:-periods]
                test = df.iloc[-periods:]
                m_train = Prophet(holidays=holidays, yearly_seasonality=True, weekly_seasonality=True)
                m_train.fit(train)
                future_train = m_train.make_future_dataframe(periods=periods)
                forecast_train = m_train.predict(future_train)
                pred = forecast_train['yhat'][-periods:]
                test_y = test['y'].values
                mae = float(np.mean(np.abs(test_y - pred)))
                rmse = float(np.sqrt(np.mean((test_y - pred) ** 2)))
                mape = float(np.mean(np.abs((test_y - pred) / (test_y + 1e-8))) * 100)
                accuracy = {'mae': mae, 'rmse': rmse, 'mape': mape}
            else:
                accuracy = None
            return yhat, accuracy

        expense_forecast, expense_accuracy = prophet_forecast(expense_df, holidays)
        income_forecast, income_accuracy = prophet_forecast(income_df, holidays)
        last_date = df['date'].max()
        future_dates = pd.date_range(last_date + pd.Timedelta(days=1), periods=30).strftime('%Y-%m-%d').tolist()

        return jsonify({
            'expense': expense_forecast,
            'income': income_forecast,
            'dates': future_dates,
            'expense_accuracy': expense_accuracy,
            'income_accuracy': income_accuracy
        })
    except Exception as e:
        app.logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": "Prediction failed."}), 500

@app.route('/api/profile', methods=['GET'])
@require_login
def view_profile():
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    profile_image_b64 = None
    if user.profile_image:
        profile_image_b64 = base64.b64encode(user.profile_image).decode('utf-8')
    return jsonify({
        'user_id': user.user_id,
        'username': user.username,
        'email': user.email,
        'monthly_limit': user.monthly_limit,
        'profile_image': profile_image_b64
    })

@app.route('/api/change-password', methods=['POST'])
@require_login
def change_password():
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    if not old_password or not new_password:
        return jsonify({'error': 'Old and new password required'}), 400
    user = User.query.get(session['user_id'])
    if not user or not check_password_hash(user.password_hash, old_password):
        return jsonify({'error': 'Old password is incorrect'}), 400
    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({'message': 'Password updated successfully'})

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
            
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Generate OTP and hash
        otp = str(random.SystemRandom().randint(100000, 999999))
        expires = int(time.time()) + OTP_EXPIRY
        data_str = f"{email}.{otp}.{expires}"
        otp_hash = hashlib.sha256(f"{data_str}{SECRET_KEY}".encode()).hexdigest()
        
        # Send OTP via email
        try:
            send_otp_email(email, otp)
        except Exception as e:
            return jsonify({"error": "Failed to send OTP email"}), 503

        return jsonify({
            "message": "OTP sent to email",
            "otpHash": f"{otp_hash}.{expires}",
            "email": email
        }), 200

    except Exception as e:
        app.logger.error(f"Forgot password error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        email = data.get('email')
        user_otp = data.get('otp')
        received_hash = data.get('otpHash')
        new_password = data.get('new_password')

        if not all([email, user_otp, received_hash, new_password]):
            return jsonify({"error": "All fields are required"}), 400

        # Validate hash structure
        if '.' not in received_hash:
            return jsonify({"error": "Invalid OTP format"}), 400
            
        hash_part, expires = received_hash.split('.', 1)
        
        # Check expiration
        if int(expires) < time.time():
            return jsonify({"error": "OTP expired"}), 401

        # Recreate verification hash
        data_str = f"{email}.{user_otp}.{expires}"
        expected_hash = hashlib.sha256(f"{data_str}{SECRET_KEY}".encode()).hexdigest()

        # Validate OTP hash
        if expected_hash != hash_part:
            return jsonify({"error": "Invalid OTP"}), 401

        # Find user and update password
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Update password
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Password reset successfully"
        }), 200

    except Exception as e:
        app.logger.error(f"Password reset error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/calendar-daily-summary', methods=['GET'])
@require_login
def calendar_daily_summary():
    user_id = session['user_id']
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=29)
    # Get all transactions in the last 30 days
    transactions = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.date >= start_date,
        Transaction.date <= today
    ).all()
    # Aggregate by day
    summary = {}
    for t in transactions:
        d = t.date.strftime('%Y-%m-%d')
        if d not in summary:
            summary[d] = {'date': d, 'total_expense': 0, 'total_income': 0}
        if t.type == 'Expense':
            summary[d]['total_expense'] += t.price
        elif t.type == 'Income':
            summary[d]['total_income'] += t.price
    # Fill missing days with zeros
    result = []
    for i in range(30):
        d = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        if d in summary:
            result.append(summary[d])
        else:
            result.append({'date': d, 'total_expense': 0, 'total_income': 0})
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
