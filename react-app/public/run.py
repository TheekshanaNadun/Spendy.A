from flask import Flask, request, jsonify
import requests
import pyodbc
from datetime import datetime
from dotenv import load_dotenv
from flask_cors import CORS
import os
import logging

app = Flask(__name__)

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
        "model": "klusterai/Meta-Llama-3.1-8B-Instruct-Turbo",
        "messages": [
            {"role": "system", "content": "Extract structured data from the message. Always include the following fields: item, category, date, location, price, and type(Income or Expense). Each data must not have spaces."},
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
                parsed_data["category"] = value
            elif "item" in key:
                parsed_data["item"] = value
            elif "type" in key:
                parsed_data["type"] = value.capitalize()

        return parsed_data

    except Exception as e:
        logger.error(f"Error parsing Kluster response: {e}")
        return None

def store_in_database(data):
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = """
            INSERT INTO transactions 
            (user_id, item, price, date, category, location, type, timestamp, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        cursor.execute(query, (
            data.get('user_id'),
            data.get('item', 'Unknown'),
            data.get('price', 0),
            data.get('date'),
            data.get('category', 'Uncategorized'),
            data.get('location', 'Unknown'),
            data.get('type', 'Expense'),
            data.get('timestamp'),
            data.get('latitude'),
            data.get('longitude')
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        logger.info(f"Data stored successfully for user_id: {data.get('user_id')}")
    except Exception as e:
        logger.error(f"Database error: {e}")
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
