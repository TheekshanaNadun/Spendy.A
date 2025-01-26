import os
from flask import Flask, request, jsonify
import requests
import pyodbc
from datetime import datetime
from dotenv import load_dotenv

# Initialize Flask app
app = Flask(__name__)  

# Load environment variables
load_dotenv()

# Configure Kluster AI API
KLUSTER_API_URL = "https://api.kluster.ai/v1/chat/completions"
KLUSTER_API_KEY = os.getenv("KLUSTER_API_KEY")  # API key from environment variables

# Configure SQL Server connection
server = os.getenv("SQL_SERVER")  # Fetch server from environment variables
database = os.getenv("SQL_DATABASE")  # Fetch database name from environment variables
connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes"

def call_kluster_api(message):
    """
    Calls the Kluster AI API to extract structured data from a user message.
    """
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
        response.raise_for_status()  # Raise an error for HTTP codes >= 400
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling Kluster API: {e}")
        return None

def parse_kluster_response(response):
    """
    Parses the Kluster API response to extract structured fields.
    """
    try:
        # Validate response structure
        if not response or 'choices' not in response or len(response['choices']) == 0:
            raise ValueError("'choices' key not found or is empty in Kluster API response")

        # Extract content
        content = response["choices"][0]["message"]["content"]
        print("Kluster API Response:", response)

        # Initialize default parsed data
        parsed_data = {
            "item": "Unknown",
            "location": "Unknown",
            "price": 0,
            "date": datetime.now().strftime("%Y-%m-%d"),  # Default to current date
            "category": "Uncategorized",
            "type": "Expense",
            "timestamp": datetime.now().strftime("%H:%M:%S"),  # Only current time (not date and time)
            "latitude": None,
            "longitude": None
        }

        # Process each line of the content
        for line in content.split("\n"):
            line = line.strip("- ").strip()

            # Check for date
            if "date" in line.lower():
                date_str = line.split(":")[1].strip()
                try:
                    parsed_date = datetime.strptime(date_str, "%b %d")  # Example: "Jan 24"
                    parsed_date = parsed_date.replace(year=datetime.now().year)
                    parsed_data["date"] = parsed_date.strftime("%Y-%m-%d")
                except ValueError:
                    print(f"Invalid date format: {date_str}. Using current date: {parsed_data['date']}.")

            # Check for location (store)
            elif "location" in line.lower() or "store" in line.lower():
                parsed_data["location"] = line.split(":")[1].strip()

            # Check for price
            elif "price" in line.lower() or "amount" in line.lower():
                price_str = line.split(":")[1].strip().replace("Rs.", "").replace(",", "").strip()
                
                # If the price is a string, attempt to convert it to an integer
                try:
                    parsed_data["price"] = int(price_str)  # Convert to integer
                except ValueError:
                    print(f"Invalid price format: {price_str}. Defaulting to 0.")
                    parsed_data["price"] = 0  # Default to 0 if price is invalid


            # Check for category
            elif "category" in line.lower():
                parsed_data["category"] = line.split(":")[1].strip()

            # Check for item
            elif "item" in line.lower():
                parsed_data["item"] = line.split(":")[1].strip()

        # Capitalize the first letter of each string value
        for key, value in parsed_data.items():
            if isinstance(value, str) and value != "Unknown" and value != "Uncategorized":
                parsed_data[key] = value.capitalize()

        # Ensure all expected fields are present
        return parsed_data

    except Exception as e:
        print(f"Error parsing Kluster response: {e}")
        return {"error": str(e)}

def get_db_connection():
    """
    Establishes a connection to the SQL Server database.
    """
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

def store_in_database(data):
    """
    Inserts parsed data into the SQL Server database.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO transactions (item, price, date, category, location, type, timestamp, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        cursor.execute(query, (
            data.get('item', 'Unknown'),
            data.get('price', 0),
            data.get('date', '2025-01-01'),
            data.get('category', 'Uncategorized'),
            data.get('location', 'Unknown'),
            data.get('type', 'Expense'),
            data.get('timestamp', datetime.now().strftime("%H:%M:%S")),  # Only current time (not date and time)
            data.get('latitude', None),  # Latitude (can be None if not provided)
            data.get('longitude', None)  # Longitude (can be None if not provided)
        ))

        conn.commit()
        cursor.close()
        conn.close()
        
        print("Data successfully inserted into the database.")
    
    except Exception as e:
        print(f"Error inserting into database: {e}")
        raise

@app.route('/process_message', methods=['POST'])
def process_message():
    """
    Processes user messages by extracting structured data using Kluster AI API and storing it in the database.
    """
    try:
        message = request.json.get('message')
        latitude = request.json.get('latitude')
        longitude = request.json.get('longitude')

        if not message or not message.strip():
            return jsonify({"error": "Message is required and cannot be empty"}), 400

        # Call Kluster API for data extraction
        kluster_response = call_kluster_api(message)

        if not kluster_response or 'choices' not in kluster_response:
            return jsonify({"error": "'choices' key not found in Kluster API response"}), 500

        # Parse the Kluster API response
        structured_data = parse_kluster_response(kluster_response)

        if not structured_data or 'error' in structured_data:
            return jsonify({"error": f"Failed to parse Kluster response: {structured_data.get('error')}"}), 500

        # Add geolocation data if available
        if latitude and longitude:
            structured_data["latitude"] = latitude
            structured_data["longitude"] = longitude

        # Store extracted data in the database
        store_in_database(structured_data)

        # Return the extracted data as a response
        return jsonify({"status": "success", "data": structured_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
