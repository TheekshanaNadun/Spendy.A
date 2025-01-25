from flask import Flask, request, jsonify
import pyodbc
import spacy

# Initialize Flask app
app = Flask(__name__)

# Configure SQL Server connection
server = r'MSI\SQLEXPRESS'  # Replace with your server name or IP address
database = 'SpendyAI'       # Replace with your database name
username = 'root'           # Replace with your SQL Server username
password = ''               # Replace with your SQL Server password

# Connection string for pyodbc
connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}"

# Load spaCy NLP model globally to avoid reloading it for every request
nlp = spacy.load("en_core_web_sm")

# Connect to SQL Server
def get_db_connection():
    try:
        conn = pyodbc.connect(connection_string)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise

# Parse user message to extract fields
def parse_message(message):
    doc = nlp(message)
    data = {"item": None, "price": None, "date": None, "category": None, "location": None}

    # Extract entities using spaCy's NER (Named Entity Recognition)
    for ent in doc.ents:
        if ent.label_ == "MONEY":
            data["price"] = ent.text.replace("$", "").strip()
        elif ent.label_ == "DATE":
            data["date"] = ent.text.strip()
        elif ent.label_ == "GPE":  # Geo-political entity for location
            data["location"] = ent.text.strip()

    # Example heuristic for extracting item name (customize as needed)
    words = message.split()
    if len(words) > 1:
        data["item"] = words[1]  # Extract second word as item name

    # Assign category based on keywords (customize as needed)
    if "grocery" in message.lower():
        data["category"] = "Groceries"
    elif "rent" in message.lower():
        data["category"] = "Housing"
    elif "salary" in message.lower():
        data["category"] = "Income"

    return data

# Classify transaction as income or expense
def classify_transaction(message):
    if any(word in message.lower() for word in ["earned", "received", "salary", "income"]):
        return "Income"
    return "Expense"

# Insert parsed data into SQL Server database
def store_in_database(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO transactions (item, price, date, category, location, type)
            VALUES (?, ?, ?, ?, ?, ?)
        """

        cursor.execute(query, (
            data['item'],
            data['price'],
            data['date'],
            data['category'],
            data['location'],
            data['type']
        ))

        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error inserting into database: {e}")
        raise

# API endpoint to process user messages
@app.route('/process_message', methods=['POST'])
def process_message():
    try:
        message = request.json.get('message')

        if not message:
            return jsonify({"error": "Message is required"}), 400

        # Step 1: Parse message to extract fields
        parsed_data = parse_message(message)

        # Step 2: Classify transaction as income or expense
        parsed_data['type'] = classify_transaction(message)

        # Step 3: Store parsed data in the database
        store_in_database(parsed_data)

        return jsonify({"status": "success", "data": parsed_data})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Custom error handler for 404 errors
@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
