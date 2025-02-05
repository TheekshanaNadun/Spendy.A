from flask import Flask, session, jsonify, request
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS
from datetime import timedelta, datetime
import logging
from sqlalchemy import extract, func, ForeignKey
from sqlalchemy.exc import SQLAlchemyError

# Initialize Flask app
app = Flask(__name__)
app.secret_key = "d3bcef141597b4c00a9e4dccb893d1b3d3bcef141597b4c00a9e4dccb893d1b3"

# Configure Flask-Session
app.config.update(
    SESSION_TYPE='filesystem',
    SESSION_COOKIE_NAME='spendy_session',
    SESSION_PERMANENT=False,
    SESSION_USE_SIGNER=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False,
    PERMANENT_SESSION_LIFETIME=timedelta(hours=1)
)

# Configure SQL Server connection
app.config['SQLALCHEMY_DATABASE_URI'] = "mssql+pyodbc://@MSI\\SQLEXPRESS/spendy_ai?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes"
# In your database configuration
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'implicit_returning': False,
    'execution_options': {'isolation_level': 'READ COMMITTED'}
}

# Initialize extensions
db = SQLAlchemy(app)
Session(app)

# Configure CORS
CORS(app, 
     resources={r"/api/*": {
         "origins": "http://localhost:3000",
         "supports_credentials": True,
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         "allow_headers": ["Content-Type", "Authorization"]
     }})

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    monthly_limit = db.Column(db.Integer, default=0)
    profile_image = db.Column(db.LargeBinary)
    
    transactions = db.relationship('Transaction', back_populates='user')
    category_limits = db.relationship('UserCategoryLimit', back_populates='user')

class Transaction(db.Model):
    __tablename__ = 'transactions'
    transaction_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, ForeignKey('users.user_id'), nullable=False)
    category = db.Column(db.String(100), ForeignKey('categories.name'))
    type = db.Column(db.String(50), nullable=False)
    item = db.Column(db.String(255))
    price = db.Column(db.Integer)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    location = db.Column(db.String(255))
    timestamp = db.Column(db.Time)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    user = db.relationship('User', back_populates='transactions')
    category_rel = db.relationship('Category', back_populates='transactions')
__table_args__ = {
        'implicit_returning': False  # Set per-table in __table_args__
    }


class Category(db.Model):
    __tablename__ = 'categories'
    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    
    transactions = db.relationship('Transaction', back_populates='category_rel')
    limits = db.relationship('UserCategoryLimit', back_populates='category')
    
    __table_args__ = (
        db.CheckConstraint("type IN ('Income', 'Expense')", name='check_category_type'),
    )

class UserCategoryLimit(db.Model):
    __tablename__ = 'user_category_limits'
    limit_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, ForeignKey('users.user_id'), nullable=False)
    category_id = db.Column(db.Integer, ForeignKey('categories.category_id'), nullable=False)
    monthly_limit = db.Column(db.Numeric(10, 2), nullable=False)
    
    user = db.relationship('User', back_populates='category_limits')
    category = db.relationship('Category', back_populates='limits')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'category_id', name='_user_category_uc'),
    )

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

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return jsonify({"error": "Missing email or password"}), 400

        user = User.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 401

        session.clear()
        session['authenticated'] = True
        session['user_id'] = user.user_id
        session.permanent = True

        return jsonify({
            "message": "Login successful",
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email
            }
        }), 200

    except Exception as e:
        app.logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/session-check', methods=['GET'])
def session_check():
    if 'authenticated' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                "authenticated": True,
                "user": {
                    "user_id": user.user_id,
                    "username": user.username,
                    "email": user.email
                }
            }), 200
    return jsonify({"authenticated": False}), 401

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

        # First, execute the INSERT
        insert_stmt = text("""
            INSERT INTO transactions 
            (user_id, category, type, item, price, date, location, timestamp, latitude, longitude)
            VALUES 
            (:user_id, :category, :type, :item, :price, :date, :location, :timestamp, :latitude, :longitude)
        """)

        db.session.execute(
            insert_stmt,
            {
                'user_id': session['user_id'],
                'category': data['category'],
                'type': data['type'],
                'item': data['item'],
                'price': int(data['price']),
                'date': datetime.strptime(data['date'], '%Y-%m-%d').date(),
                'location': data.get('location'),
                'timestamp': datetime.now().time(),
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude')
            }
        )

        # Then get the last inserted ID
        result = db.session.execute(text("SELECT IDENT_CURRENT('transactions') AS transaction_id"))
        transaction_id = result.scalar()
        
        db.session.commit()

        return jsonify({
            "message": "Transaction created successfully",
            "transaction_id": int(transaction_id)
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
            # Handle date conversion
            if 'date' in data:
                transaction.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            
            # Update other fields
            fields = ['item', 'price', 'location', 'category', 'type',
                     'timestamp', 'latitude', 'longitude']
            for field in fields:
                if field in data:
                    setattr(transaction, field, data[field])
            
            db.session.commit()
            return jsonify({"message": "Transaction updated"}), 200
            
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        
    if request.method == 'DELETE':
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({"message": "Transaction deleted"}), 200

@app.after_request
def handle_options(response):
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response
def convert_to_json(response):
    if response.content_type == 'text/html':
        try:
            error_data = {
                "error": "Unexpected HTML response",
                "status": response.status_code,
                "message": response.get_data(as_text=True)[:100]
            }
            response = jsonify(error_data)
            response.status_code = 500
        except Exception as e:
            app.logger.error(f"JSON conversion failed: {str(e)}")
    return response

@app.route('/api/transactions/expense', methods=['GET'])
@require_login
def get_expense_transactions():
    try:
        user_id = session['user_id']
        transactions = Transaction.query.filter_by(
            user_id=user_id,
            type='Expense'
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
        current_date = datetime.now()
        
        # Calculate date ranges
        current_month_start = current_date.replace(day=1)
        last_month_end = current_month_start - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)

        # Income calculations
        current_month_income = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Income',
            extract('year', Transaction.date) == current_date.year,
            extract('month', Transaction.date) == current_date.month
        ).scalar()

        last_month_income = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Income',
            extract('year', Transaction.date) == last_month_start.year,
            extract('month', Transaction.date) == last_month_start.month
        ).scalar()

        # Expense calculations
        current_month_expense = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            extract('year', Transaction.date) == current_date.year,
            extract('month', Transaction.date) == current_date.month
        ).scalar()

        last_month_expense = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            extract('year', Transaction.date) == last_month_start.year,
            extract('month', Transaction.date) == last_month_start.month
        ).scalar()

        # Net profit calculation
        net_profit = current_month_income - current_month_expense

        # Total savings (assuming savings is cumulative)
        total_savings = db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Income'
        ).scalar() - db.session.query(
            func.coalesce(func.sum(Transaction.price), 0)
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense'
        ).scalar()

        return jsonify({
            'currentMonthIncome': current_month_income,
            'lastMonthIncome': last_month_income,
            'currentMonthExpense': current_month_expense,
            'lastMonthExpense': last_month_expense,
            'netProfit': net_profit,
            'totalSavings': total_savings
        }), 200

    except Exception as e:
        app.logger.error(f"Error fetching stats: {str(e)}")
        return jsonify({"error": "Error retrieving statistics"}), 500



if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
