from flask import Flask, request, jsonify
import requests
from datetime import datetime
from dotenv import load_dotenv
from flask_cors import CORS
import os
import logging
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text, func
import sys
import json

# Add the project root to the Python path to allow importing 'models'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from models import db, User, Transaction, Category, UserCategoryLimit


app = Flask(__name__)
# Configure MySQL connection
db_user = os.getenv('MYSQL_USER')
db_password = os.getenv('MYSQL_PASSWORD')
db_host = os.getenv('MYSQL_HOST')
db_name = os.getenv('MYSQL_DATABASE')
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}"
# In your database configuration
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'implicit_returning': False,
    'execution_options': {'isolation_level': 'READ COMMITTED'}
}
# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# CORS Configuration
CORS(app, 
    resources={r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": "*",
            "supports_credentials": True,
        "expose_headers": ["Set-Cookie"]
    }}
)
db.init_app(app)

# Database Models are now in models.py and are removed from here.

load_dotenv()

KLUSTER_API_URL = "https://api.kluster.ai/v1/chat/completions"
KLUSTER_API_KEY = os.getenv("KLUSTER_API_KEY")

def verify_auth():
    try:
        # Forward all cookies and headers
        cookies = {k: v for k, v in request.cookies.items()}
        headers = {
            'Origin': request.headers.get('Origin', ''),
            'Referer': request.headers.get('Referer', '')
        }
        
        auth_response = requests.get(
            'http://api:5000/api/session-check',
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
            'http://api:5000/api/session-check',
            cookies=cookies
        )
        if auth_response.status_code == 200:
            return auth_response.json().get('user', {}).get('user_id')
        return None
    except Exception as e:
        logger.error(f"User ID error: {e}")
        return None
    

    
def call_kluster_api(message):
    # Optimized prompt to request a JSON object for easier parsing
    system_prompt = (
        "You are a data extraction assistant. Analyze the user's message and extract structured data for the transaction. "
        "Respond ONLY with a single, minified JSON object. The JSON object must have the following keys: "
        "'item', 'category', 'date', 'location', 'price', 'type'. "
        "The 'category' must be one of the following: 'Food & Groceries', 'Public Transportation (Bus/Train)', 'Three Wheeler Fees', "
        "'Electricity (CEB)', 'Water Supply', 'Entertainment', 'Mobile Prepaid', 'Internet (ADSL/Fiber)', 'Hospital Charges', "
        "'School Fees', 'University Expenses', 'Educational Materials', 'Clothing & Textiles', 'House Rent', 'Home Maintenance', "
        "'Family Events', 'Petrol/Diesel', 'Vehicle Maintenance', 'Vehicle Insurance', 'Bank Loans', 'Credit Card Payments', "
        "'Income Tax', 'Salary', 'Foreign Remittances', 'Rental Income', 'Agricultural Income', 'Business Profits', "
        "'Investment Returns', 'Government Allowances', 'Freelance Income'. "
        "The 'date' must be in 'YYYY-MM-DD' format; if only month and day are present, use the current year. "
        "The 'price' must be an integer. The 'type' must be either 'Income' or 'Expense'. "
        "If a value is not available in the message, use a JSON null value for that key."
    )
    payload = {
        "model": "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo",
        "messages": [
            {"role": "system", "content": system_prompt},
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
            raise ValueError("Invalid Kluster API response: Missing 'choices'")

        content = response["choices"][0]["message"]["content"]
        logger.debug(f"Kluster API response content: {content}")

        # The AI should return a JSON string, so we parse it.
        parsed_data = json.loads(content)

        # Basic validation of the parsed data
        required_keys = ['item', 'category', 'date', 'price', 'type']
        if not all(key in parsed_data for key in required_keys):
            raise ValueError(f"Missing one or more required keys in AI response: {required_keys}")
        
        # Set defaults for optional fields if they are missing or null
        parsed_data.setdefault('location', None)
        parsed_data.setdefault('timestamp', datetime.now().strftime("%H:%M:%S"))
        parsed_data.setdefault('latitude', None)
        parsed_data.setdefault('longitude', None)

        return parsed_data

    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON from Kluster response: {content}")
        return None
    except (ValueError, KeyError) as e:
        logger.error(f"Error parsing Kluster response: {e}")
        return None



def store_in_database(data):
    try:
        # Validate required fields
        required_fields = ['user_id', 'item', 'price', 'date', 'category', 'type']
        if not all(field in data and data[field] is not None for field in required_fields):
            raise ValueError("Missing required fields in parsed data")

        # Check if the category exists, or create it if it's new.
        category = Category.query.filter_by(name=data['category'], type=data['type']).first()
        if not category:
            category = Category(name=data['category'], type=data['type'])
            db.session.add(category)

        # Create a new Transaction ORM object
        new_transaction = Transaction(
            user_id=data['user_id'],
            category=data['category'],
            type=data['type'],
            item=data.get('item'),
            price=int(data.get('price', 0)),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            location=data.get('location'),
            timestamp=datetime.now().time(),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        
        db.session.add(new_transaction)
        db.session.commit()

        # The ID is now available on the object after the commit.
        transaction_id = new_transaction.transaction_id
        
        logger.info(f"Transaction stored successfully. ID: {transaction_id}")
        return transaction_id

    except (ValueError, SQLAlchemyError) as e:
        logger.error(f"Database error during transaction storage: {str(e)}")
        db.session.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected error in store_in_database: {str(e)}")
        db.session.rollback()
        raise


@app.route('/process_message', methods=['POST', 'OPTIONS'])
def process_message():
    print("process_message endpoint hit")  # Debug: confirm endpoint is hit
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

        # Ensure type is either 'Income' or 'Expense' (case-insensitive)
        valid_types = ['Income', 'Expense']
        if 'type' in structured_data and structured_data['type']:
            type_value = str(structured_data['type']).capitalize()
            if type_value not in valid_types:
                # Try to infer from category
                income_categories = [
                    'Salary', 'Foreign Remittances', 'Rental Income', 'Agricultural Income', 'Business Profits',
                    'Investment Returns', 'Government Allowances', 'Freelance Income'
                ]
                if 'category' in structured_data and structured_data['category']:
                    if structured_data['category'] in income_categories:
                        type_value = 'Income'
                    else:
                        type_value = 'Expense'
                else:
                    return jsonify({"error": "Transaction type must be either 'Income' or 'Expense'"}), 400
            structured_data['type'] = type_value
        else:
            return jsonify({"error": "Transaction type is missing in the response"}), 400

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
    app.run(debug=True, port=3001, host='0.0.0.0')