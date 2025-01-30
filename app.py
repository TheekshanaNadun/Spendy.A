from flask import Flask, session, jsonify, request
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_cors import CORS
from datetime import timedelta, datetime
import logging

# Initialize Flask app
app = Flask(__name__)
app.secret_key = "d3bcef141597b4c00a9e4dccb893d1b3d3bcef141597b4c00a9e4dccb893d1b3"

# Configure Flask-Session
app.config.update(
    SESSION_TYPE='filesystem',
    SESSION_PERMANENT=False,
    SESSION_USE_SIGNER=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_SECURE=False,  # Set to True in production with HTTPS
    PERMANENT_SESSION_LIFETIME=timedelta(hours=1)
)

# Configure SQL Server connection
app.config['SQLALCHEMY_DATABASE_URI'] = "mssql+pyodbc://@MSI\\SQLEXPRESS/spendy_ai?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
Session(app)

# Configure CORS for React frontend
CORS(app, resources={
    r"/api/*": {
         "origins": "http://localhost:3000",
        "supports_credentials": True,
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Range", "X-Content-Range"]
    }
})

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Database Models
class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    monthly_limit = db.Column(db.Integer, default=0)
    profile_image = db.Column(db.LargeBinary)


# Create tables
with app.app_context():
    db.create_all()

# Authentication decorator
def require_login(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'authenticated' not in session:
            app.logger.warning("Unauthorized access attempt")
            return jsonify({"error": "Unauthorized access"}), 401
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

        # Hash the password before storing it in the database
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)  # Hashing here
        )
        db.session.add(new_user)
        db.session.commit()
        
        app.logger.debug(f"User {username} created successfully.")
        
        return jsonify({"message": f"User {username} created successfully!"}), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Signup error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        # Parse JSON data from the request
        data = request.get_json()
        email = data.get('email')  # Use 'email' instead of 'username'
        password = data.get('password')

        # Validate input
        if not all([email, password]):
            app.logger.debug("Missing credentials in login request.")
            return jsonify({"error": "Missing email or password"}), 400

        # Fetch user from the database by email
        user = User.query.filter_by(email=email).first()

        if not user:
            app.logger.debug(f"Login failed: User with email {email} not found.")
            return jsonify({"error": "Invalid email or password"}), 401

        # Compare provided password with stored hash
        if not check_password_hash(user.password_hash, password):
            app.logger.debug(f"Login failed: Password mismatch for email {email}.")
            return jsonify({"error": "Invalid email or password"}), 401

        # Set session data for authenticated user
        session.clear()
        session['authenticated'] = True
        session['user_id'] = user.user_id
        session.permanent = True

        app.logger.debug(f"User with email {email} logged in successfully.")

        # Return success response with user details
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
        user = db.session.get(User, session['user_id'])
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

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
