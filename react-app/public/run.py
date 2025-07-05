from flask import Flask, request, jsonify
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from flask_cors import CORS
import os
import logging
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text, func
import sys
import json
import numpy as np
from collections import defaultdict
import re
import pandas as pd

# Add the project root to the Python path to allow importing 'models'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from models import db, User, Transaction, Category, UserCategoryLimit
from ai_model import (
    detect_anomalies, seasonal_decompose_forecast, category_forecast, 
    spending_pattern_analysis, budget_optimization_suggestions
)


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
    

    
def analyze_user_patterns(user_id):
    """Analyze user's spending patterns and preferences"""
    try:
        # Get user's transaction history
        transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc()).limit(100).all()
        
        if not transactions:
            return {}
        
        # Analyze patterns
        patterns = {
            'frequent_categories': defaultdict(int),
            'typical_amounts': defaultdict(list),
            'spending_days': defaultdict(int),
            'location_preferences': defaultdict(int),
            'time_patterns': defaultdict(int)
        }
        
        for t in transactions:
            patterns['frequent_categories'][t.category] += 1
            patterns['typical_amounts'][t.category].append(t.price)
            patterns['spending_days'][t.date.weekday()] += 1
            if t.location:
                patterns['location_preferences'][t.location] += 1
            if t.timestamp:
                patterns['time_patterns'][t.timestamp.hour] += 1
        
        # Calculate averages and preferences
        user_profile = {
            'top_categories': sorted(patterns['frequent_categories'].items(), key=lambda x: x[1], reverse=True)[:5],
            'avg_amounts': {cat: np.mean(amounts) for cat, amounts in patterns['typical_amounts'].items() if amounts},
            'preferred_days': sorted(patterns['spending_days'].items(), key=lambda x: x[1], reverse=True)[:3],
            'top_locations': sorted(patterns['location_preferences'].items(), key=lambda x: x[1], reverse=True)[:3],
            'peak_hours': sorted(patterns['time_patterns'].items(), key=lambda x: x[1], reverse=True)[:3]
        }
        
        return user_profile
    except Exception as e:
        logger.error(f"Error analyzing user patterns: {e}")
        return {}

def get_smart_suggestions(user_id, message):
    """Generate smart suggestions based on user patterns and message context"""
    try:
        user_profile = analyze_user_patterns(user_id)
        
        # Extract potential amounts from message
        amount_pattern = r'(\d+(?:,\d+)*(?:\.\d{2})?)\s*(?:rs?|rupees?|lkr|lkr\.?|/=)?'
        amounts = re.findall(amount_pattern, message.lower())
        
        # Extract potential categories from message
        category_keywords = {
            'Food & Groceries': ['food', 'grocery', 'meal', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe'],
            'Public Transportation': ['bus', 'train', 'transport', 'fare', 'ticket'],
            'Petrol/Diesel': ['petrol', 'diesel', 'fuel', 'gas', 'gasoline'],
            'Entertainment': ['movie', 'cinema', 'game', 'entertainment', 'fun'],
            'Mobile Prepaid': ['mobile', 'phone', 'prepaid', 'recharge', 'sim'],
            'Internet': ['internet', 'wifi', 'fiber', 'adsl', 'broadband']
        }
        
        detected_categories = []
        for category, keywords in category_keywords.items():
            if any(keyword in message.lower() for keyword in keywords):
                detected_categories.append(category)
        
        suggestions = {
            'likely_amount': float(amounts[0].replace(',', '')) if amounts else None,
            'suggested_categories': detected_categories,
            'user_preferences': user_profile,
            'budget_alerts': check_budget_alerts(user_id, detected_categories, amounts[0] if amounts else None)
        }
        
        return suggestions
    except Exception as e:
        logger.error(f"Error generating suggestions: {e}")
        return {}

def check_budget_alerts(user_id, categories, amount):
    """Check if transaction would exceed budget limits"""
    try:
        alerts = []
        if not amount:
            return alerts
            
        amount = float(amount)
        today = datetime.now().date()
        first_day_month = today.replace(day=1)
        
        for category in categories:
            limit = UserCategoryLimit.query.join(Category).filter(
                UserCategoryLimit.user_id == user_id,
                Category.name == category
            ).first()
            
            if limit:
                # Calculate current month spending
                current_spending = db.session.query(func.sum(Transaction.price)).filter(
                    Transaction.user_id == user_id,
                    Transaction.category == category,
                    Transaction.date >= first_day_month,
                    Transaction.type == 'Expense'
                ).scalar() or 0
                
                remaining_budget = float(limit.monthly_limit) - current_spending
                
                if amount > remaining_budget:
                    alerts.append({
                        'category': category,
                        'current_spending': current_spending,
                        'limit': float(limit.monthly_limit),
                        'remaining': remaining_budget,
                        'excess': amount - remaining_budget
                    })
        
        return alerts
    except Exception as e:
        logger.error(f"Error checking budget alerts: {e}")
        return []

def generate_transaction_insights(user_id, transaction_data, user_context):
    """Generate personalized insights based on the transaction and user patterns"""
    try:
        insights = {
            'spending_trend': None,
            'category_analysis': None,
            'budget_impact': None,
            'savings_opportunity': None,
            'anomaly_detection': None
        }
        
        category = transaction_data.get('category')
        amount = transaction_data.get('price', 0)
        transaction_type = transaction_data.get('type')
        
        if not category or not amount:
            return insights
        
        # Analyze spending trend
        if transaction_type == 'Expense':
            # Compare with user's average for this category
            avg_amount = user_context.get('avg_amounts', {}).get(category)
            if avg_amount:
                if amount > avg_amount * 1.5:
                    insights['spending_trend'] = {
                        'type': 'high',
                        'message': f"This {category} expense is 50% higher than your usual spending",
                        'percentage': round(((amount - avg_amount) / avg_amount) * 100, 1)
                    }
                elif amount < avg_amount * 0.7:
                    insights['spending_trend'] = {
                        'type': 'low',
                        'message': f"Great! This {category} expense is below your usual spending",
                        'percentage': round(((avg_amount - amount) / avg_amount) * 100, 1)
                    }
        
        # Category analysis
        top_categories = user_context.get('top_categories', [])
        if top_categories:
            category_rank = next((i for i, (cat, _) in enumerate(top_categories) if cat == category), -1)
            if category_rank >= 0:
                insights['category_analysis'] = {
                    'rank': category_rank + 1,
                    'frequency': top_categories[category_rank][1],
                    'message': f"{category} is your #{category_rank + 1} most frequent spending category"
                }
        
        # Budget impact analysis
        today = datetime.now().date()
        first_day_month = today.replace(day=1)
        
        # Calculate monthly spending for this category
        monthly_spending = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.category == category,
            Transaction.date >= first_day_month,
            Transaction.type == 'Expense'
        ).scalar() or 0
        
        # Get budget limit
        limit = UserCategoryLimit.query.join(Category).filter(
            UserCategoryLimit.user_id == user_id,
            Category.name == category
        ).first()
        
        if limit:
            limit_amount = float(limit.monthly_limit)
            usage_percentage = (monthly_spending / limit_amount) * 100 if limit_amount > 0 else 0
            
            insights['budget_impact'] = {
                'monthly_spending': monthly_spending,
                'limit': limit_amount,
                'usage_percentage': round(usage_percentage, 1),
                'remaining': limit_amount - monthly_spending,
                'status': 'over' if usage_percentage > 100 else 'under' if usage_percentage < 80 else 'normal'
            }
        
        # Anomaly detection
        if transaction_type == 'Expense':
            # Check if this is an unusual time for spending
            current_hour = datetime.now().hour
            peak_hours = user_context.get('peak_hours', [])
            if peak_hours:
                usual_hours = [hour for hour, _ in peak_hours]
                if current_hour not in usual_hours:
                    insights['anomaly_detection'] = {
                        'type': 'unusual_time',
                        'message': f"Unusual spending time. You usually spend around {', '.join(map(str, usual_hours))}:00",
                        'current_hour': current_hour
                    }
        
        return insights
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        return {}

def classify_message_type(message):
    """Classify if the message is a question or transaction"""
    question_keywords = [
        'how', 'what', 'when', 'where', 'why', 'which', 'can', 'could', 'would', 'should',
        'is', 'are', 'do', 'does', 'did', 'will', 'may', 'might', 'suggest', 'recommend',
        'advice', 'tip', 'help', 'save', 'budget', 'promotion', 'offer', 'discount',
        'best', 'cheap', 'expensive', 'cost', 'price', 'month', 'week', 'day'
    ]
    
    message_lower = message.lower()
    
    # Check for question patterns
    is_question = any(keyword in message_lower for keyword in question_keywords)
    
    # Check for transaction patterns
    transaction_keywords = [
        'bought', 'purchased', 'paid', 'spent', 'cost', 'rupees', 'lkr', 'rs',
        'received', 'earned', 'salary', 'income', 'bill', 'payment'
    ]
    
    is_transaction = any(keyword in message_lower for keyword in transaction_keywords)
    
    # If both patterns exist, prioritize transaction
    if is_transaction:
        return 'transaction'
    elif is_question:
        return 'question'
    else:
        # Default to transaction if unclear
        return 'transaction'

def get_sri_lankan_market_insights(user_id):
    """Get Sri Lankan market-specific insights and suggestions"""
    try:
        today = datetime.now().date()
        first_day_month = today.replace(day=1)
        last_month = (first_day_month - timedelta(days=1)).replace(day=1)
        
        # Get last month's total expenses
        last_month_expenses = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= last_month,
            Transaction.date < first_day_month
        ).scalar() or 0
        
        # Get today's expenses
        today_expenses = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date == today
        ).scalar() or 0
        
        # Sri Lankan market insights
        current_month = today.month
        current_day = today.day
        
        insights = {
            'last_month_total': last_month_expenses,
            'today_expenses': today_expenses,
            'current_date': today.strftime('%Y-%m-%d'),
            'suggestions': []
        }
        
        # Monthly promotions and tips
        monthly_promotions = {
            1: "New Year sales at supermarkets and electronics stores",
            2: "Valentine's Day offers on dining and entertainment",
            3: "Back-to-school promotions on educational materials",
            4: "Avurudu season - traditional food and clothing sales",
            5: "Vesak season - religious items and decorations",
            6: "Mid-year sales at major retailers",
            7: "Esala Perahera season - cultural items",
            8: "Independence Day sales",
            9: "Back-to-school season - stationery and uniforms",
            10: "Deepavali season - sweets and traditional items",
            11: "Christmas season - gifts and decorations",
            12: "Year-end sales and clearance"
        }
        
        # Weekly promotions
        weekly_promotions = {
            0: "Sunday - Family day discounts at restaurants",
            1: "Monday - Fresh produce discounts at markets",
            2: "Tuesday - Electronics and gadget deals",
            3: "Wednesday - Clothing and fashion sales",
            4: "Thursday - Home and kitchen appliance offers",
            5: "Friday - Weekend grocery specials",
            6: "Saturday - Entertainment and leisure discounts"
        }
        
        # Add current month promotion
        if current_month in monthly_promotions:
            insights['suggestions'].append(f"💡 {monthly_promotions[current_month]}")
        
        # Add current day promotion
        current_weekday = today.weekday()
        if current_weekday in weekly_promotions:
            insights['suggestions'].append(f"📅 {weekly_promotions[current_weekday]}")
        
        # Budget-based suggestions
        if last_month_expenses > 50000:
            insights['suggestions'].append("💰 Your last month expenses were high. Consider setting stricter budgets this month.")
        elif last_month_expenses < 20000:
            insights['suggestions'].append("🎉 Great job! Your last month expenses were well controlled.")
        
        if today_expenses > 2000:
            insights['suggestions'].append("⚠️ Today's expenses are high. Consider reducing spending for the rest of the day.")
        
        # Sri Lankan specific tips
        sri_lankan_tips = [
            "🛒 Shop at local markets (pola) for fresh produce - usually 20-30% cheaper than supermarkets",
            "🚌 Use public transport instead of private vehicles to save on fuel costs",
            "💡 Switch to LED bulbs to reduce electricity bills by up to 40%",
            "📱 Use mobile banking apps to avoid bank charges",
            "🏠 Consider bulk buying for non-perishable items during sales",
            "🍽️ Cook at home instead of eating out to save 50-70% on food costs",
            "📚 Use public libraries instead of buying books",
            "🏥 Get health insurance to avoid high medical costs",
            "🎓 Look for student discounts on various services",
            "🌱 Start a small home garden for herbs and vegetables"
        ]
        
        # Add 2-3 random tips
        import random
        insights['suggestions'].extend(random.sample(sri_lankan_tips, 3))
        
        return insights
        
    except Exception as e:
        logger.error(f"Error getting market insights: {e}")
        return {
            'last_month_total': 0,
            'today_expenses': 0,
            'current_date': today.strftime('%Y-%m-%d'),
            'suggestions': ["💡 Consider shopping at local markets for better prices", "🚌 Use public transport to save on fuel"]
        }

def call_kluster_api(message, user_context=None, message_type='transaction'):
    """Enhanced AI processing with message type classification"""
    
    if message_type == 'question':
        # Handle questions with Sri Lankan market insights
        system_prompt = (
            "You are a financial advisor specializing in Sri Lankan markets and personal finance. "
            "Provide helpful, practical advice based on Sri Lankan context, including: "
            "- Local market promotions and sales periods "
            "- Sri Lankan banking and financial services "
            "- Local shopping tips and cost-saving strategies "
            "- Seasonal promotions and cultural events "
            "- Public transport and utility cost optimization "
            "Respond with practical, actionable advice in a friendly, helpful tone."
        )
        
        payload = {
            "model": "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            "temperature": 0.7,
            "top_p": 0.9,
            "stream": False
        }
    else:
        # Handle transactions with enhanced context
        user_context_str = ""
        if user_context:
            user_context_str = f"""
            User Context:
            - Top spending categories: {[cat for cat, _ in user_context.get('top_categories', [])]}
            - Average amounts: {user_context.get('avg_amounts', {})}
            - Preferred locations: {[loc for loc, _ in user_context.get('top_locations', [])]}
            """
        
        system_prompt = (
            f"You are an intelligent financial assistant for Spendy.AI. Analyze the user's message and extract structured transaction data. "
            f"{user_context_str}"
            f"Consider the user's spending patterns and provide personalized insights. "
            f"Respond ONLY with a single, minified JSON object with these keys: "
            f"'item', 'category', 'date', 'location', 'price', 'type', 'suggestions'. "
            f"The 'category' must be one of: 'Food & Groceries', 'Public Transportation (Bus/Train)', 'Three Wheeler Fees', "
            f"'Electricity (CEB)', 'Water Supply', 'Entertainment', 'Mobile Prepaid', 'Internet (ADSL/Fiber)', 'Hospital Charges', "
            f"'School Fees', 'University Expenses', 'Educational Materials', 'Clothing & Textiles', 'House Rent', 'Home Maintenance', "
            f"'Family Events', 'Petrol/Diesel', 'Vehicle Maintenance', 'Vehicle Insurance', 'Bank Loans', 'Credit Card Payments', "
            f"'Income Tax', 'Salary', 'Foreign Remittances', 'Rental Income', 'Agricultural Income', 'Business Profits', "
            f"'Investment Returns', 'Government Allowances', 'Freelance Income'. "
            f"The 'date' must be in 'YYYY-MM-DD' format. "
            f"The 'price' must be an integer. The 'type' must be either 'Income' or 'Expense'. "
            f"The 'suggestions' should be an array of helpful tips or alternatives. "
            f"If a value is not available, use null for that key."
        )
        
        payload = {
            "model": "klusterai/Meta-Llama-3.3-70B-Instruct-Turbo",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            "temperature": 0.1,
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

def parse_kluster_response(response, message_type='transaction'):
    try:
        if not response or 'choices' not in response:
            raise ValueError("Invalid Kluster API response: Missing 'choices'")

        content = response["choices"][0]["message"]["content"]
        logger.debug(f"Kluster API response content: {content}")

        if message_type == 'question':
            # For questions, return the text response directly
            return {
                'type': 'question_response',
                'content': content,
                'message_type': 'question'
            }
        else:
            # For transactions, parse JSON
            try:
                parsed_data = json.loads(content)
                
                # Basic validation of the parsed data
                required_keys = ['item', 'category', 'price', 'type']
                if not all(key in parsed_data for key in required_keys):
                    raise ValueError(f"Missing one or more required keys in AI response: {required_keys}")
                
                # Handle null or missing date - use current date as default
                if not parsed_data.get('date'):
                    parsed_data['date'] = datetime.now().strftime('%Y-%m-%d')
                
                # Set defaults for optional fields if they are missing or null
                parsed_data.setdefault('location', None)
                parsed_data.setdefault('timestamp', datetime.now().strftime("%H:%M:%S"))
                parsed_data.setdefault('latitude', None)
                parsed_data.setdefault('longitude', None)
                parsed_data.setdefault('suggestions', [])  # Default empty suggestions

                return {
                    'type': 'transaction_data',
                    'data': parsed_data,
                    'message_type': 'transaction'
                }

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

def get_transaction_insights(user_id, transaction_data):
    """Generate transaction-specific insights with remaining balance and offers, and compare this month's and last month's expenses."""
    try:
        today = datetime.now().date()
        first_day_month = today.replace(day=1)
        current_month = today.month
        current_day = today.day
        # Calculate last month's range
        first_day_last_month = (first_day_month - timedelta(days=1)).replace(day=1)
        last_day_last_month = first_day_month - timedelta(days=1)
        
        category = transaction_data.get('category')
        amount = transaction_data.get('price', 0) or 0
        
        insights = {
            'remaining_balance': None,
            'seasonal_offers': [],
            'daily_offers': [],
            'personalized_suggestions': [],
            'last_month_expenses': None,
            'this_month_expenses': None,
            'expense_warning': None
        }
        
        # Get remaining balance for this category
        if category:
            limit = UserCategoryLimit.query.join(Category).filter(
                UserCategoryLimit.user_id == user_id,
                Category.name == category
            ).first()
            
            if limit:
                # Calculate current month spending for this category
                current_spending = db.session.query(func.sum(Transaction.price)).filter(
                    Transaction.user_id == user_id,
                    Transaction.category == category,
                    Transaction.date >= first_day_month,
                    Transaction.type == 'Expense'
                ).scalar() or 0
                
                remaining_budget = float(limit.monthly_limit) - float(current_spending)
                insights['remaining_balance'] = {
                    'category': category,
                    'current_spending': float(current_spending),
                    'limit': float(limit.monthly_limit),
                    'remaining': remaining_budget,
                    'usage_percentage': round((float(current_spending) / float(limit.monthly_limit)) * 100, 1) if float(limit.monthly_limit) > 0 else 0
                }
        
        # --- New: Last month and this month total expenses ---
        last_month_expenses = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= first_day_last_month,
            Transaction.date <= last_day_last_month
        ).scalar() or 0
        this_month_expenses = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= first_day_month,
            Transaction.date <= today
        ).scalar() or 0
        # Always cast to float for safe arithmetic and JSON
        last_month_expenses = float(last_month_expenses)
        this_month_expenses = float(this_month_expenses)
        if transaction_data.get('type') == 'Expense' and amount:
            this_month_expenses += float(amount)
        insights['last_month_expenses'] = last_month_expenses
        insights['this_month_expenses'] = this_month_expenses
        
        # --- New: Warning if this month > last month ---
        if this_month_expenses > last_month_expenses and last_month_expenses > 0:
            insights['expense_warning'] = f"⚠️ Your total expenses this month ({int(this_month_expenses)} LKR) have exceeded last month's total ({int(last_month_expenses)} LKR). Please review your spending."
        
        # Seasonal offers (monthly)
        seasonal_offers = {
            1: ["🎊 New Year sales at supermarkets and electronics stores", "📱 Mobile phone deals and promotions"],
            2: ["💝 Valentine's Day offers on dining and entertainment", "🌹 Flower and gift shop discounts"],
            3: ["📚 Back-to-school promotions on educational materials", "🎒 Stationery and uniform sales"],
            4: ["🌺 Avurudu season - traditional food and clothing sales", "🏠 Home decoration and cleaning supplies"],
            5: ["🕯️ Vesak season - religious items and decorations", "🌱 Plant and flower sales"],
            6: ["🛍️ Mid-year sales at major retailers", "👕 Clothing and fashion clearance"],
            7: ["🎭 Esala Perahera season - cultural items", "🎪 Traditional costume and accessory sales"],
            8: ["🇱🇰 Independence Day sales", "🏛️ Patriotic merchandise discounts"],
            9: ["📖 Back-to-school season - stationery and uniforms", "🎓 University supplies and textbooks"],
            10: ["🪔 Deepavali season - sweets and traditional items", "🕉️ Religious items and decorations"],
            11: ["🎄 Christmas season - gifts and decorations", "🎁 Toy and electronics sales"],
            12: ["🎊 Year-end sales and clearance", "📱 Electronics and gadget deals"]
        }
        if current_month in seasonal_offers:
            insights['seasonal_offers'] = seasonal_offers[current_month]
        # Daily offers (special days)
        if current_day == 14 and current_month == 2:
            insights['daily_offers'].append("💕 Valentine's Day - Special romantic dining and gift offers")
        elif current_day == 25 and current_month == 12:
            insights['daily_offers'].append("🎄 Christmas Day - Special family dining and entertainment offers")
        elif current_day == 1 and current_month == 1:
            insights['daily_offers'].append("🎊 New Year's Day - Special celebration offers")
        elif current_day == 4 and current_month == 4:
            insights['daily_offers'].append("🌺 Avurudu - Traditional food and clothing special offers")
        elif current_day == 5 and current_month == 5:
            insights['daily_offers'].append("🕯️ Vesak Day - Religious items and decoration specials")
        elif current_day == 4 and current_month == 2:
            insights['daily_offers'].append("🇱🇰 Independence Day - Patriotic merchandise and special offers")
        # Personalized suggestions based on transaction
        if category == "Food & Groceries":
            insights['personalized_suggestions'].extend([
                "🛒 Shop at local markets (pola) for 20-30% savings",
                "📦 Buy in bulk for non-perishable items",
                "🍽️ Plan meals to reduce food waste"
            ])
        elif category == "Public Transportation (Bus/Train)":
            insights['personalized_suggestions'].extend([
                "🎫 Consider monthly passes for regular routes",
                "🚌 Use public transport apps for real-time updates",
                "💳 Get travel cards for convenience"
            ])
        elif category == "Entertainment":
            insights['personalized_suggestions'].extend([
                "🎬 Look for student discounts on movies",
                "🎭 Check for early bird specials",
                "🎪 Group booking discounts available"
            ])
        elif category == "Mobile Prepaid":
            insights['personalized_suggestions'].extend([
                "📱 Compare prepaid vs postpaid plans",
                "💳 Use mobile banking to avoid charges",
                "📞 Check for family plan discounts"
            ])
        elif category == "Electricity (CEB)":
            insights['personalized_suggestions'].extend([
                "💡 Switch to LED bulbs for 40% savings",
                "🌞 Use solar power where possible",
                "🔌 Unplug unused appliances"
            ])
        # Add general suggestions
        if amount > 10000:
            insights['personalized_suggestions'].append("💰 Consider installment payment options")
        if amount > 50000:
            insights['personalized_suggestions'].append("🏦 Check for bank financing options")
        return insights
    except Exception as e:
        logger.error(f"Error generating transaction insights: {e}")
        return {
            'remaining_balance': None,
            'seasonal_offers': [],
            'daily_offers': [],
            'personalized_suggestions': [],
            'last_month_expenses': None,
            'this_month_expenses': None,
            'expense_warning': None
        }

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

        # Get Sri Lankan market insights
        market_insights = get_sri_lankan_market_insights(user_id)

        # Always treat as transaction
        user_context = analyze_user_patterns(user_id)
        smart_suggestions = get_smart_suggestions(user_id, message)

        # Enhanced AI processing with user context
        kluster_response = call_kluster_api(message, user_context, message_type='transaction')
        if not kluster_response:
            return jsonify({"error": "Failed to process transaction"}), 500

        parsed_response = parse_kluster_response(kluster_response, message_type='transaction')
        if not parsed_response:
            return jsonify({"error": "Failed to parse transaction response"}), 500

        structured_data = parsed_response['data']

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

        # If location is missing, fetch from last transaction
        if not structured_data.get('location'):
            last_tx = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc(), Transaction.timestamp.desc()).first()
            if last_tx and last_tx.location:
                structured_data['location'] = last_tx.location

        # If date is missing, set to today
        if not structured_data.get('date'):
            structured_data['date'] = datetime.now().strftime('%Y-%m-%d')

        # Generate insights and recommendations (without saving to database yet)
        insights = generate_transaction_insights(user_id, structured_data, user_context)
        
        # Check for budget alerts
        budget_alerts = check_budget_alerts(user_id, [structured_data.get('category')], structured_data.get('price'))
        
        # Get transaction-specific insights
        transaction_insights = get_transaction_insights(user_id, structured_data)

        return jsonify({
            "status": "success",
            "message_type": "transaction",
            "message": "Transaction processed successfully. Review and confirm to save.",
            "structured_data": structured_data,
            "insights": insights,
            "suggestions": smart_suggestions,
            "budget_alerts": budget_alerts,
            "transaction_insights": transaction_insights,
            "ai_suggestions": structured_data.get('suggestions', []),
            "user_confidence": None,  # Will be set by user in frontend
            "market_insights": market_insights
        })

    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analytics/insights', methods=['GET'])
def get_user_insights():
    """Get comprehensive user insights and analytics"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        if not verify_auth():
            return jsonify({"error": "Authentication required"}), 401

        user_id = get_user_id()
        if not user_id:
            return jsonify({"error": "User ID not found"}), 401

        # Get user patterns
        user_context = analyze_user_patterns(user_id)
        
        # Get spending trends
        today = datetime.now().date()
        first_day_month = today.replace(day=1)
        
        # Monthly spending by category
        monthly_spending = db.session.query(
            Transaction.category,
            func.sum(Transaction.price).label('total')
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= first_day_month
        ).group_by(Transaction.category).all()
        
        # Budget utilization
        budget_utilization = []
        for category, total in monthly_spending:
            limit = UserCategoryLimit.query.join(Category).filter(
                UserCategoryLimit.user_id == user_id,
                Category.name == category
            ).first()
            
            if limit:
                utilization = (total / float(limit.monthly_limit)) * 100 if limit.monthly_limit > 0 else 0
                budget_utilization.append({
                    'category': category,
                    'spent': total,
                    'limit': float(limit.monthly_limit),
                    'utilization': round(utilization, 1),
                    'status': 'over' if utilization > 100 else 'under' if utilization < 80 else 'normal'
                })
        
        # Spending patterns by day of week
        daily_patterns = db.session.query(
            func.dayofweek(Transaction.date).label('day'),
            func.sum(Transaction.price).label('total'),
            func.count(Transaction.transaction_id).label('count')
        ).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= first_day_month
        ).group_by(func.dayofweek(Transaction.date)).all()
        
        # Recommendations
        recommendations = generate_recommendations(user_id, user_context, budget_utilization)
        
        return jsonify({
            'user_patterns': user_context,
            'monthly_spending': [{'category': cat, 'total': total} for cat, total in monthly_spending],
            'budget_utilization': budget_utilization,
            'daily_patterns': [{'day': day, 'total': total, 'count': count} for day, total, count in daily_patterns],
            'recommendations': recommendations
        })
        
    except Exception as e:
        logger.error(f"Error getting insights: {str(e)}")
        return jsonify({"error": str(e)}), 500

def generate_recommendations(user_id, user_context, budget_utilization):
    """Generate personalized financial recommendations"""
    recommendations = []
    
    try:
        # Budget overruns
        over_budget = [b for b in budget_utilization if b['status'] == 'over']
        if over_budget:
            recommendations.append({
                'type': 'budget_alert',
                'priority': 'high',
                'title': 'Budget Overruns Detected',
                'message': f"You've exceeded your budget in {len(over_budget)} categories",
                'categories': [b['category'] for b in over_budget]
            })
        
        # High spending categories
        top_categories = user_context.get('top_categories', [])
        if top_categories:
            top_category = top_categories[0][0]
            recommendations.append({
                'type': 'spending_optimization',
                'priority': 'medium',
                'title': 'Spending Optimization',
                'message': f"Consider reviewing your {top_category} expenses for potential savings",
                'category': top_category
            })
        
        # Savings opportunity
        total_monthly_income = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Income',
            Transaction.date >= datetime.now().date().replace(day=1)
        ).scalar() or 0
        
        total_monthly_expense = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= datetime.now().date().replace(day=1)
        ).scalar() or 0
        
        if total_monthly_income > 0:
            savings_rate = ((total_monthly_income - total_monthly_expense) / total_monthly_income) * 100
            if savings_rate < 20:
                recommendations.append({
                    'type': 'savings_goal',
                    'priority': 'medium',
                    'title': 'Low Savings Rate',
                    'message': f"Your savings rate is {round(savings_rate, 1)}%. Consider increasing it to 20% or more",
                    'current_rate': round(savings_rate, 1)
                })
        
        return recommendations
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return []

@app.route('/api/ai/advanced-analytics', methods=['GET'])
def advanced_ai_analytics():
    """Advanced AI-powered analytics with anomaly detection and pattern analysis"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        if not verify_auth():
            return jsonify({"error": "Authentication required"}), 401

        user_id = get_user_id()
        if not user_id:
            return jsonify({"error": "User ID not found"}), 401

        # Get user's transaction history
        transactions = Transaction.query.filter_by(user_id=user_id).all()
        
        if len(transactions) < 10:
            return jsonify({"error": "Insufficient data for analysis. Need at least 10 transactions."}), 400

        # Convert to DataFrame
        df = pd.DataFrame([{
            'transaction_id': t.transaction_id,
            'price': t.price,
            'date': t.date,
            'category': t.category,
            'type': t.type,
            'location': t.location,
            'timestamp': t.timestamp,
            'day_of_week': t.date.weekday() if t.date else 0,
            'hour': t.timestamp.hour if t.timestamp else 0
        } for t in transactions])

        # Filter for expenses only for analysis
        expense_df = df[df['type'] == 'Expense'].copy()
        
        if len(expense_df) < 5:
            return jsonify({"error": "Insufficient expense data for analysis."}), 400

        # Get user's budget limits
        budget_limits = {}
        limits = UserCategoryLimit.query.join(Category).filter(
            UserCategoryLimit.user_id == user_id
        ).all()
        
        for limit in limits:
            budget_limits[limit.category.name] = float(limit.monthly_limit)

        # Perform advanced analytics
        analytics_results = {
            'anomaly_detection': detect_anomalies(expense_df),
            'spending_patterns': spending_pattern_analysis(expense_df),
            'budget_optimization': budget_optimization_suggestions(expense_df, budget_limits),
            'category_forecasts': {},
            'seasonal_analysis': {}
        }

        # Generate forecasts for top categories
        top_categories = expense_df['category'].value_counts().head(5).index
        for category in top_categories:
            analytics_results['category_forecasts'][category] = category_forecast(expense_df, category, steps=30)

        # Seasonal analysis for overall spending
        daily_spending = expense_df.groupby('date')['price'].sum().reindex(
            pd.date_range(expense_df['date'].min(), expense_df['date'].max()),
            fill_value=0
        )
        analytics_results['seasonal_analysis'] = seasonal_decompose_forecast(daily_spending, steps=30)

        # Generate insights summary
        insights_summary = generate_ai_insights_summary(analytics_results, expense_df)

        return jsonify({
            'analytics': analytics_results,
            'insights_summary': insights_summary,
            'data_points': len(expense_df),
            'analysis_date': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Advanced analytics error: {str(e)}")
        return jsonify({"error": str(e)}), 500

def generate_ai_insights_summary(analytics_results, expense_df):
    """Generate a summary of AI insights"""
    try:
        summary = {
            'key_findings': [],
            'recommendations': [],
            'risk_alerts': [],
            'opportunities': []
        }

        # Anomaly insights
        anomalies = analytics_results['anomaly_detection']['anomalies']
        if anomalies:
            summary['risk_alerts'].append({
                'type': 'anomaly',
                'count': len(anomalies),
                'message': f"Detected {len(anomalies)} unusual transactions that may need attention"
            })

        # Spending pattern insights
        patterns = analytics_results['spending_patterns']
        if patterns:
            peak_day = patterns.get('peak_spending_day', {})
            if peak_day:
                summary['key_findings'].append({
                    'type': 'peak_spending',
                    'day': peak_day.get('day'),
                    'amount': peak_day.get('amount'),
                    'message': f"Peak spending occurs on day {peak_day.get('day')} with average {peak_day.get('amount'):.2f} LKR"
                })

        # Budget optimization insights
        budget_suggestions = analytics_results['budget_optimization']['suggestions']
        if budget_suggestions:
            high_priority = [s for s in budget_suggestions if s['type'] == 'budget_exceeded']
            if high_priority:
                summary['risk_alerts'].append({
                    'type': 'budget_exceeded',
                    'count': len(high_priority),
                    'message': f"{len(high_priority)} categories have exceeded their budget limits"
                })

        # Category forecast insights
        category_forecasts = analytics_results['category_forecasts']
        for category, forecast in category_forecasts.items():
            if forecast.get('volatility', 0) > 1000:  # High volatility threshold
                summary['key_findings'].append({
                    'type': 'high_volatility',
                    'category': category,
                    'volatility': forecast['volatility'],
                    'message': f"{category} spending shows high volatility ({forecast['volatility']:.2f} LKR)"
                })

        return summary
    except Exception as e:
        logger.error(f"Error generating AI insights summary: {e}")
        return {'key_findings': [], 'recommendations': [], 'risk_alerts': [], 'opportunities': []}

@app.route('/api/confirm-transaction', methods=['POST', 'OPTIONS'])
def confirm_transaction():
    """Save the confirmed transaction to database"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        if not verify_auth():
            return jsonify({"error": "Authentication required"}), 401

        user_id = get_user_id()
        if not user_id:
            return jsonify({"error": "User ID not found"}), 401

        structured_data = request.json.get('structured_data')
        if not structured_data:
            return jsonify({"error": "Transaction data is required"}), 400

        # Ensure user_id is set
        structured_data["user_id"] = user_id

        # Store transaction in database
        transaction_id = store_in_database(structured_data)

        return jsonify({
            "status": "success",
            "message": "Transaction saved successfully!",
            "transaction_id": transaction_id,
            "data": structured_data
        })

    except Exception as e:
        logger.error(f"Error confirming transaction: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3001, host='0.0.0.0')