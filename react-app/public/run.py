from flask import Flask, request, jsonify
import requests
import pyodbc
from datetime import datetime
from dotenv import load_dotenv
from flask_cors import CORS
import os
import logging
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from datetime import datetime
from sqlalchemy import extract, func, ForeignKey
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)
# Configure SQL Server connection
app.config['SQLALCHEMY_DATABASE_URI'] = "mssql+pyodbc://@MSI\\SQLEXPRESS/spendy_ai?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes"
# In your database configuration
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'implicit_returning': False,
    'execution_options': {'isolation_level': 'READ COMMITTED'}
}
# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# CORS Configuration
# Update CORS configuration
CORS(app, 
    resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "expose_headers": ["Set-Cookie"]  # Add this line
        }
    }
)
db = SQLAlchemy(app)
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


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin', '')
    if origin in ['http://localhost:3000', 'http://127.0.0.1:3000']:
        response.headers.update({
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Expose-Headers": "Set-Cookie"  # Add this line
        })
    return response

load_dotenv()

KLUSTER_API_URL = "https://api.kluster.ai/v1/chat/completions"
KLUSTER_API_KEY = os.getenv("KLUSTER_API_KEY")

server = r'MSI\SQLEXPRESS'
database = 'spendy_ai'
connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes"

def verify_auth():
    try:
        # Forward all cookies and headers
        cookies = {k: v for k, v in request.cookies.items()}
        headers = {
            'Origin': request.headers.get('Origin', ''),
            'Referer': request.headers.get('Referer', '')
        }
        
        auth_response = requests.get(
            'http://localhost:5000/api/session-check',
            cookies=cookies,
            headers=headers
        )
        
        logger.debug(f"Auth service response: {auth_response.status_code} {auth_response.text}")
        return auth_response.status_code == 200 and auth_response.json().get('authenticated')
    except Exception as e:
        logger.error(f"Auth verification error: {e}")
        return False

def get_user_id():
    try:
        cookies = {k: v for k, v in request.cookies.items()}
        auth_response = requests.get(
            'http://localhost:5000/api/session-check',
            cookies=cookies
        )
        if auth_response.status_code == 200:
            return auth_response.json().get('user', {}).get('user_id')
        return None
    except Exception as e:
        logger.error(f"User ID error: {e}")
        return None
    

    
def call_kluster_api(message):
    payload = {
        "model": "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo",
        "messages": [
            {"role": "system", "content": "Extract structured data from the message. Always include the following fields: item, category only  following categoriess:'Food & Groceries', 'Public Transportation (Bus/Train)', 'Three Wheeler Fees', 'Electricity (CEB)', 'Water Supply', 'Entertainment', 'Mobile Prepaid', 'Internet (ADSL/Fiber)', 'Hospital Charges', 'School Fees', 'University Expenses', 'Educational Materials', 'Clothing & Textiles', 'House Rent', 'Home Maintenance', 'Family Events', 'Petrol/Diesel', 'Vehicle Maintenance', 'Vehicle Insurance', 'Bank Loans', 'Credit Card Payments', 'Income Tax', 'Salary', 'Foreign Remittances', 'Rental Income', 'Agricultural Income', 'Business Profits', 'Investment Returns', 'Government Allowances', 'Freelance Income', date(%b %d), location, price, and type(Income or Expense). Each data must not have spaces.Keep empty if not available."},
            {"role": "user", "content": message}
        ],
        "temperature": 0.2,
        "top_p": 0.9,
        "stream": False
    }
    headers = {
        "Authorization": f"Bearer {KLUSTER_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(KLUSTER_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Kluster API: {e}")
        return None

def parse_kluster_response(response):
    try:
        if not response or 'choices' not in response:
            raise ValueError("Invalid Kluster API response")

        content = response["choices"][0]["message"]["content"]
        logger.debug(f"Kluster API response content: {content}")

        parsed_data = {
            "item": "Unknown",
            "location": "Unknown",
            "price": 0,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "category": "Uncategorized",
            "type": "Expense",
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "latitude": None,
            "longitude": None
        }

        for line in content.split("\n"):
            line = line.strip("- ").strip()
            if ":" not in line:
                continue
                
            key, value = line.lower().split(":", 1)
            value = value.strip()
            
            if "date" in key:
                try:
                    parsed_date = datetime.strptime(value, "%b %d")
                    parsed_date = parsed_date.replace(year=datetime.now().year)
                    parsed_data["date"] = parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    logger.warning(f"Invalid date format: {value}")
            elif "location" in key or "store" in key:
                parsed_data["location"] = value
            elif "price" in key or "amount" in key:
                try:
                    parsed_data["price"] = int(value.replace("Rs.", "").replace(",", ""))
                except ValueError:
                    logger.warning(f"Invalid price format: {value}")
            elif "category" in key:
                parsed_data["category"] = value.capitalize()
            elif "item" in key:
                parsed_data["item"] = value.capitalize()
            elif "type" in key:
                parsed_data["type"] = value.capitalize()

        return parsed_data

    except Exception as e:
        logger.error(f"Error parsing Kluster response: {e}")
        return None



def store_in_database(data):
    try:
        # Validate required fields
        required_fields = ['user_id', 'item', 'price', 'date', 'category', 'type']
        if not all(field in data for field in required_fields):
            raise ValueError("Missing required fields")

        # Check if category exists
        category = Category.query.filter_by(name=data['category']).first()
        if not category:
            category = Category(
                name=data['category'],
                type=data['type']
            )
            db.session.add(category)
            db.session.flush()

        # Insert transaction using text query
        insert_stmt = text("""
            INSERT INTO transactions 
            (user_id, category, type, item, price, date, location, timestamp, latitude, longitude)
            VALUES 
            (:user_id, :category, :type, :item, :price, :date, :location, :timestamp, :latitude, :longitude)
        """)

        db.session.execute(
            insert_stmt,
            {
                'user_id': data['user_id'],
                'category': data['category'],
                'type': data['type'],
                'item': data.get('item', 'Unknown'),
                'price': int(data.get('price', 0)),
                'date': datetime.strptime(data['date'], '%Y-%m-%d').date(),
                'location': data.get('location'),
                'timestamp': datetime.now().time(),
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude')
            }
        )

        # Get the last inserted ID
        result = db.session.execute(text("SELECT IDENT_CURRENT('transactions') AS transaction_id"))
        transaction_id = result.scalar()
        
        db.session.commit()
        logger.info(f"Transaction stored successfully. ID: {transaction_id}")
        return transaction_id

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        db.session.rollback()
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        db.session.rollback()
        raise

def store_in_database(data):
    try:
        # Validate required fields
        required_fields = ['user_id', 'item', 'price', 'date', 'category', 'type']
        if not all(field in data for field in required_fields):
            raise ValueError("Missing required fields")

        # Check if category exists
        category = Category.query.filter_by(name=data['category']).first()
        if not category:
            category = Category(
                name=data['category'],
                type=data['type']
            )
            db.session.add(category)
            db.session.flush()

        # Insert transaction using text query
        insert_stmt = text("""
            INSERT INTO transactions 
            (user_id, category, type, item, price, date, location, timestamp, latitude, longitude)
            VALUES 
            (:user_id, :category, :type, :item, :price, :date, :location, :timestamp, :latitude, :longitude)
        """)

        db.session.execute(
            insert_stmt,
            {
                'user_id': data['user_id'],
                'category': data['category'],
                'type': data['type'],
                'item': data.get('item', 'Unknown'),
                'price': int(data.get('price', 0)),
                'date': datetime.strptime(data['date'], '%Y-%m-%d').date(),
                'location': data.get('location'),
                'timestamp': datetime.now().time(),
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude')
            }
        )

        # Get the last inserted ID
        result = db.session.execute(text("SELECT IDENT_CURRENT('transactions') AS transaction_id"))
        transaction_id = result.scalar()
        
        db.session.commit()
        logger.info(f"Transaction stored successfully. ID: {transaction_id}")
        return transaction_id

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        db.session.rollback()
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        db.session.rollback()
        raise


@app.route('/process_message', methods=['POST', 'OPTIONS'])
def process_message():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        logger.debug(f"Request headers: {dict(request.headers)}")
        logger.debug(f"Request cookies: {dict(request.cookies)}")

        if not verify_auth():
            return jsonify({"error": "Authentication required"}), 401

        user_id = get_user_id()
        if not user_id:
            return jsonify({"error": "User ID not found"}), 401

        logger.info(f"Processing message for user_id: {user_id}")

        message = request.json.get('message')
        if not message or not message.strip():
            return jsonify({"error": "Message is required"}), 400

        kluster_response = call_kluster_api(message)
        if not kluster_response:
            return jsonify({"error": "Failed to process message"}), 500

        structured_data = parse_kluster_response(kluster_response)
        if not structured_data:
            return jsonify({"error": "Failed to parse response"}), 500

        structured_data["user_id"] = user_id
        structured_data["latitude"] = request.json.get('latitude')
        structured_data["longitude"] = request.json.get('longitude')

        store_in_database(structured_data)

        return jsonify({
            "status": "success",
            "data": structured_data
        })

    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001)