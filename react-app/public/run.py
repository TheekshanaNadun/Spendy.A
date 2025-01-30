import os
from flask import Flask, request, jsonify, session
import requests
import pyodbc
from datetime import datetime
from dotenv import load_dotenv
from flask_cors import CORS

app = Flask(__name__)

# Configure session settings
app.secret_key = os.getenv("FLASK_SECRET_KEY", os.urandom(24))
app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    PERMANENT_SESSION_LIFETIME=3600
)

# Configure CORS
CORS(app, 
    resources={
        r"/process_message": {
            "origins": "http://localhost:3000",
            "methods": ["POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    }
)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# Load environment variables
load_dotenv()

# Configure Kluster AI API
KLUSTER_API_URL = "https://api.kluster.ai/v1/chat/completions"
KLUSTER_API_KEY = os.getenv("KLUSTER_API_KEY")

# Configure SQL Server connection
server = os.getenv("SQL_SERVER")
database = os.getenv("SQL_DATABASE")
connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes"

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
        print(f"Error calling Kluster API: {e}")
        return None

def parse_kluster_response(response):
    try:
        if not response or 'choices' not in response or len(response['choices']) == 0:
            raise ValueError("'choices' key not found or is empty in Kluster API response")

        content = response["choices"][0]["message"]["content"]
        print("Kluster API Response:", response)

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
        print("Initial parsed data:", parsed_data)

        for line in content.split("\n"):
            line = line.strip("- ").strip()
            print(f"Processing line: {line}")

            if "date" in line.lower():
                date_str = line.split(":")[1].strip()
                try:
                    parsed_date = datetime.strptime(date_str, "%b %d")
                    parsed_date = parsed_date.replace(year=datetime.now().year)
                    parsed_data["date"] = parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    print(f"Invalid date format: {date_str}")

            elif "location" in line.lower() or "store" in line.lower():
                parsed_data["location"] = line.split(":")[1].strip()

            elif "price" in line.lower() or "amount" in line.lower():
                price_str = line.split(":")[1].strip().replace("Rs.", "").replace(",", "").strip()
                try:
                    parsed_data["price"] = int(price_str)
                except ValueError:
                    print(f"Invalid price format: {price_str}")

            elif "category" in line.lower():
                parsed_data["category"] = line.split(":")[1].strip()

            elif "item" in line.lower():
                parsed_data["item"] = line.split(":")[1].strip()

            elif "type" in line.lower():
                parsed_data["type"] = line.split(":")[1].strip()

        for key, value in parsed_data.items():
            if isinstance(value, str) and value != "Unknown" and value != "Uncategorized":
                parsed_data[key] = value.capitalize()

        print("Final parsed data:", parsed_data)
        return parsed_data

    except Exception as e:
        print(f"Error parsing Kluster response: {e}")
        return {"error": str(e)}

def get_db_connection():
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

def store_in_database(data):
    try:
        conn = get_db_connection()
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
            data.get('date', datetime.now().strftime("%Y-%m-%d")),
            data.get('category', 'Uncategorized'),
            data.get('location', 'Unknown'),
            data.get('type', 'Expense'),
            data.get('timestamp', datetime.now().strftime("%H:%M:%S")),
            data.get('latitude'),
            data.get('longitude')
        ))

        conn.commit()
        cursor.close()
        conn.close()
        print("Data successfully inserted into the database.")
    
    except Exception as e:
        print(f"Error inserting into database: {e}")
        raise

@app.route('/process_message', methods=['POST', 'OPTIONS'])
def process_message():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        if 'user_id' not in session:
            return jsonify({"error": "User not logged in"}), 401

        user_id = session['user_id']
        print(f"Processing message for user_id: {user_id}")

        message = request.json.get('message')
        latitude = request.json.get('latitude')
        longitude = request.json.get('longitude')

        if not message or not message.strip():
            return jsonify({"error": "Message is required"}), 400

        kluster_response = call_kluster_api(message)
        if not kluster_response or 'choices' not in kluster_response:
            return jsonify({"error": "Invalid Kluster API response"}), 500

        structured_data = parse_kluster_response(kluster_response)
        if not structured_data or 'error' in structured_data:
            return jsonify({"error": "Failed to parse response"}), 500

        structured_data["user_id"] = user_id
        if latitude and longitude:
            structured_data["latitude"] = latitude
            structured_data["longitude"] = longitude

        store_in_database(structured_data)

        return jsonify({
            "status": "success",
            "data": structured_data
        })

    except Exception as e:
        print(f"Error processing message: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001)
