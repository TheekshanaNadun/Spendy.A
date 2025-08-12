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
logging.basicConfig(level=logging.WARNING)
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

import anthropic

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

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

def get_seasonal_promotions(date):
    """Get seasonal and festival-specific promotions based on current date"""
    month = date.month
    day = date.day
    
    promotions = []
    
    # Sri Lankan Independence Day - February 4th
    if month == 2 and 1 <= day <= 10:
        promotions.append("🇱🇰 Independence Day season - Look for patriotic merchandise, cultural items, and special sales at local shops")
    
    # Sri Lankan New Year (Avurudu) - usually around April 13-14
    if month == 4 and 10 <= day <= 20:
        promotions.append("🌺 Avurudu season is here! Look for traditional food (kavum, kokis), clothing (osariya, sarong), and cultural items at special prices")
    
    # Vesak - usually in May
    if month == 5 and 1 <= day <= 31:
        promotions.append("🕯️ Vesak season - Visit temple shops for religious items, lanterns, and traditional decorations at discounted prices")
    
    # Deepavali - usually in October/November
    if month == 10 and day >= 20 or month == 11 and day <= 15:
        promotions.append("🪔 Deepavali season - Sweet shops and traditional item stores offer special festival discounts")
    
    # Christmas season - December
    if month == 12 and day >= 15:
        promotions.append("🎄 Christmas season - Major retailers offer festive discounts on gifts, decorations, and seasonal items")
    
    # Monsoon season (May to September) - indoor shopping promotions
    if month in [5, 6, 7, 8, 9]:
        promotions.append("🌧️ Monsoon season - Indoor shopping centers offer special promotions to attract customers during rainy weather")
    
    # Tourist season (December to April) - beach and tourism promotions
    if month in [12, 1, 2, 3, 4]:
        promotions.append("🏖️ Tourist season - Beach resorts, restaurants, and entertainment venues offer special local rates")
    
    # School holiday promotions (April, August, December)
    if month in [4, 8, 12] and 15 <= day <= 31:
        promotions.append("🎒 School holidays - Educational materials, toys, and family entertainment venues offer special promotions")
    
    # Add current month specific promotions
    if month == 4:
        if 1 <= day <= 9:
            promotions.append("🌺 Pre-Avurudu season - Start shopping for traditional items and new clothes")
        elif 10 <= day <= 20:
            promotions.append("🌺 Avurudu season is here! Look for traditional food (kavum, kokis), clothing (osariya, sarong), and cultural items at special prices")
        elif 21 <= day <= 30:
            promotions.append("🌺 Post-Avurudu season - Look for remaining traditional items at discounted prices")
    
    return promotions

def get_category_specific_promotions(category, current_date):
    """Get category-specific promotions based on the item category"""
    month = current_date.month
    day = current_date.day
    
    promotions = []
    
    if 'clothing' in category.lower() or 'textile' in category.lower():
        if month == 4 and 10 <= day <= 20:
            promotions.append("👗 Avurudu season - Traditional clothing (osariya, sarong) at special prices")
        elif month == 12 and day >= 15:
            promotions.append("🎄 Christmas season - New year clothing sales and fashion discounts")
        elif month in [6, 7, 8]:
            promotions.append("🌞 Summer season - Light clothing and beachwear promotions")
        else:
            promotions.append("👕 Regular clothing sales - Check local markets (pola) for better prices")
    
    elif 'food' in category.lower() or 'grocery' in category.lower():
        if month == 4 and 10 <= day <= 20:
            promotions.append("🍯 Avurudu season - Traditional sweets (kavum, kokis) and festive foods")
        elif month == 5:
            promotions.append("🕯️ Vesak season - Special vegetarian meal promotions")
        else:
            promotions.append("🛒 Shop at local markets (pola) for fresh produce at 20-30% lower prices")
    
    elif 'transport' in category.lower():
        promotions.append("🚌 Use public transport to save on fuel costs")
        promotions.append("🚗 Consider carpooling for long-distance travel")
    
    elif 'education' in category.lower():
        if month in [3, 9]:
            promotions.append("📚 Back-to-school season - Educational materials at competitive prices")
        else:
            promotions.append("📖 Check for student discounts and bulk purchase offers")
    
    return promotions

def get_smart_date_context(message, default_date=None):
    """Extract date context from message or use today's date as default"""
    if default_date is None:
        default_date = datetime.now().date()
    
    message_lower = message.lower()
    
    # Check for specific date mentions
    if 'today' in message_lower or 'now' in message_lower:
        return default_date
    elif 'yesterday' in message_lower:
        return default_date - timedelta(days=1)
    elif 'tomorrow' in message_lower:
        return default_date + timedelta(days=1)
    elif 'this week' in message_lower:
        return default_date
    elif 'last week' in message_lower:
        return default_date - timedelta(days=7)
    elif 'next week' in message_lower:
        return default_date + timedelta(days=7)
    elif 'this month' in message_lower:
        return default_date
    elif 'last month' in message_lower:
        return default_date.replace(day=1) - timedelta(days=1)
    elif 'next month' in message_lower:
        if default_date.month == 12:
            return default_date.replace(year=default_date.year + 1, month=1, day=1)
        else:
            return default_date.replace(month=default_date.month + 1, day=1)
    
    # If no specific date mentioned, use today's date
    return default_date

def get_sri_lankan_market_insights(user_id):
    """Get Sri Lankan market-specific insights and suggestions"""
    try:
        today = datetime.now().date()
        first_day_month = today.replace(day=1)
        last_day_month = (first_day_month - timedelta(days=1)).replace(day=1)
        
        # Get last month's total expenses
        last_month_expenses = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date >= last_day_month,
            Transaction.date < first_day_month
        ).scalar() or 0
        
        # Get today's expenses
        today_expenses = db.session.query(func.sum(Transaction.price)).filter(
            Transaction.user_id == user_id,
            Transaction.type == 'Expense',
            Transaction.date == today
        ).scalar() or 0
        
        # Sri Lankan market insights
        # Note: 'today' refers to the transaction date, but promotions should always be current
        current_month = today.month
        current_day = today.day
        
        insights = {
            'last_month_total': last_month_expenses,
            'today_expenses': today_expenses,
            'current_date': today.strftime('%Y-%m-%d'),
            'transaction_month': today.month,  # Month when transaction occurred
            'current_month': datetime.now().month,  # Current month for promotions
            'suggestions': []
        }
        
        # Enhanced Sri Lankan monthly promotions and cultural events
        monthly_promotions = {
            1: "🎊 New Year sales at supermarkets, electronics stores, and clothing shops across Sri Lanka",
            2: "🇱🇰 Independence Day (Feb 4) - patriotic merchandise, cultural items, and special sales at local shops",
            3: "📚 Back-to-school promotions on educational materials, uniforms, and stationery nationwide",
            4: "🌺 Avurudu season - traditional food (kavum, kokis), clothing (osariya, sarong), and cultural items sales",
            5: "🕯️ Vesak season - religious items, lanterns, and traditional decorations at temple shops",
            6: "🏪 Mid-year sales at major retailers like ODEL, House of Fashion, and local markets",
            7: "🐘 Esala Perahera season - cultural items, traditional clothing, and souvenir shops in Kandy",
            8: "🌞 August - Beach season promotions at coastal resorts and water sports centers",
            9: "🎒 Back-to-school season - stationery, uniforms, and educational materials at competitive prices",
            10: "🪔 Deepavali season - sweets (mithai), traditional items, and festive decorations",
            11: "🎄 Christmas season - gifts, decorations, and festive items at major retailers",
            12: "🎯 Year-end sales and clearance at all major shopping centers and local markets"
        }
        
        # Enhanced Sri Lankan weekly promotions with local context
        weekly_promotions = {
            0: "🌅 Sunday - Family day discounts at restaurants, beach resorts, and entertainment venues",
            1: "🌱 Monday - Fresh produce discounts at local markets (pola) and vegetable shops",
            2: "💻 Tuesday - Electronics and gadget deals at tech shops in Pettah and major cities",
            3: "👗 Wednesday - Clothing and fashion sales at textile shops and boutiques",
            4: "🏠 Thursday - Home and kitchen appliance offers at appliance stores",
            5: "🛒 Friday - Weekend grocery specials at supermarkets and local markets",
            6: "🎭 Saturday - Entertainment and leisure discounts at cinemas and recreational centers"
        }
        
        # Enhanced date-aware promotions and suggestions
        current_month = today.month
        current_day = today.day
        current_weekday = today.weekday()
        
        # Add current month promotion with enhanced context (always current month)
        current_month_now = datetime.now().month
        if current_month_now in monthly_promotions:
            insights['suggestions'].append(f"💡 {monthly_promotions[current_month_now]}")
        
        # Add current day promotion with local context (always current day)
        current_weekday_now = datetime.now().weekday()
        if current_weekday_now in weekly_promotions:
            insights['suggestions'].append(f"📅 {weekly_promotions[current_weekday_now]}")
        
        # Add seasonal and festival-specific promotions based on current date (not transaction date)
        # Always use current date for promotions to show relevant current offers
        current_date = datetime.now().date()
        seasonal_promotions = get_seasonal_promotions(current_date)
        if seasonal_promotions:
            insights['suggestions'].extend(seasonal_promotions)
        
        # Add general seasonal promotions based on current date
        # Category-specific promotions will be handled in the main transaction processing
        seasonal_promotions = get_seasonal_promotions(current_date)
        if seasonal_promotions:
            insights['suggestions'].extend(seasonal_promotions)
        
        # Smart budget-based suggestions with Sri Lankan context
        if last_month_expenses > 50000:
            insights['suggestions'].append("💰 Your last month expenses were high. Consider setting stricter budgets this month. Try shopping at local markets (pola) for better prices.")
        elif last_month_expenses < 20000:
            insights['suggestions'].append("🎉 Great job! Your last month expenses were well controlled. Keep up the good financial habits!")
        
        # Daily spending guidance with local context
        if today_expenses > 2000:
            insights['suggestions'].append("⚠️ Today's expenses are high. Consider reducing spending for the rest of the day. Try cooking at home instead of eating out.")
        elif today_expenses > 0:
            insights['suggestions'].append("✅ Good spending control today! Consider using public transport to save on fuel costs.")
        
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

def call_anthropic_api(message, user_context=None, message_type='transaction'):
    """Enhanced AI processing with message type classification using Anthropic Claude"""
    
    if message_type == 'question':
        # Handle questions with Sri Lankan market insights
        system_prompt = (
            f"You are a financial advisor specializing in Sri Lankan markets and personal finance. "
            f"IMPORTANT: Always provide advice based on the CURRENT date ({datetime.now().strftime('%Y-%m-%d')}) and current month ({datetime.now().strftime('%B')}). "
            f"Provide helpful, practical advice based on Sri Lankan context, including: "
            f"- Current seasonal promotions and sales periods for {datetime.now().strftime('%B')} "
            f"- Sri Lankan banking and financial services "
            f"- Local shopping tips and cost-saving strategies "
            f"- Current seasonal promotions and cultural events "
            f"- Public transport and utility cost optimization "
            f"Respond with practical, actionable advice in a friendly, helpful tone. "
            f"Always mention the current month and season when giving advice."
        )
        
        try:
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                temperature=0.7,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": message
                            }
                        ]
                    }
                ]
            )
            return {
                "choices": [{
                    "message": {
                        "content": response.content[0].text
                    }
                }]
            }
        except Exception as e:
            logger.error(f"Error calling Anthropic API for question: {e}")
            return None
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
            f"IMPORTANT: If no specific date is mentioned in the user's message, use today's current date ({datetime.now().strftime('%Y-%m-%d')}). "
            f"Do NOT use past dates unless explicitly mentioned by the user. "
            f"The 'price' must be an integer. The 'type' must be either 'Income' or 'Expense'. "
            f"The 'suggestions' should be an array of helpful tips or alternatives. "
            f"If a value is not available, use null for that key."
        )
        
        try:
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=1000,
                temperature=0.1,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": message
                            }
                        ]
                    }
                ]
            )
            return {
                "choices": [{
                    "message": {
                        "content": response.content[0].text
                    }
                }]
            }
        except Exception as e:
            logger.error(f"Error calling Anthropic API for transaction: {e}")
            return None

def parse_anthropic_response(response, message_type='transaction'):
    try:
        if not response or 'choices' not in response:
            raise ValueError("Invalid Anthropic API response: Missing 'choices'")
        content = response["choices"][0]["message"]["content"]
        logger.debug(f"Anthropic API response content: {content}")
        if message_type == 'question':
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
                    logger.info(f"No date provided, using current date: {parsed_data['date']}")
                
                # Validate and correct dates - if date is in the past and not explicitly mentioned, use current date
                try:
                    parsed_date = datetime.strptime(parsed_data['date'], '%Y-%m-%d').date()
                    current_date = datetime.now().date()
                    
                    # If the parsed date is more than 30 days in the past and no explicit mention in message
                    if parsed_date < current_date - timedelta(days=30):
                        logger.info(f"Correcting past date {parsed_data['date']} to current date {current_date.strftime('%Y-%m-%d')}")
                        parsed_data['date'] = current_date.strftime('%Y-%m-%d')
                except ValueError:
                    # If date parsing fails, use current date
                    logger.warning(f"Invalid date format {parsed_data['date']}, using current date")
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
                logger.error(f"Failed to decode JSON from Anthropic response: {content}")
                return None
            except (ValueError, KeyError) as e:
                logger.error(f"Error parsing Anthropic response: {e}")
                return None
    except Exception as e:
        logger.error(f"Error in parse_anthropic_response: {e}")
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

        # Parse time from structured data or use current time
        transaction_time = None
        if data.get('time'):
            try:
                # Parse time string (HH:MM format) to time object
                time_parts = data['time'].split(':')
                if len(time_parts) == 2:
                    hour, minute = int(time_parts[0]), int(time_parts[1])
                    transaction_time = datetime.strptime(f"{hour:02d}:{minute:02d}", '%H:%M').time()
                else:
                    transaction_time = datetime.now().time()
            except (ValueError, TypeError):
                transaction_time = datetime.now().time()
        else:
            transaction_time = datetime.now().time()

        # Create a new Transaction ORM object
        new_transaction = Transaction(
            user_id=data['user_id'],
            category=data['category'],
            type=data['type'],
            item=data.get('item'),
            price=int(data.get('price', 0)),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            location=data.get('location'),
            timestamp=transaction_time,
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
        
        # Seasonal offers (monthly) - Updated for correct Sri Lankan dates
        seasonal_offers = {
            1: ["🎊 New Year sales at supermarkets and electronics stores", "📱 Mobile phone deals and promotions"],
            2: ["🇱�� Independence Day (Feb 4) - patriotic merchandise and cultural items", "💝 Valentine's Day offers on dining and entertainment"],
            3: ["📚 Back-to-school promotions on educational materials", "🎒 Stationery and uniform sales"],
            4: ["🌺 Avurudu season - traditional food (kavum, kokis) and clothing (osariya, sarong)", "🏠 Home decoration and cleaning supplies"],
            5: ["🕯️ Vesak season - religious items and decorations", "🌱 Plant and flower sales"],
            6: ["🛍️ Mid-year sales at major retailers", "👕 Clothing and fashion clearance"],
            7: ["🎭 Esala Perahera season - cultural items in Kandy", "🎪 Traditional costume and accessory sales"],
            8: ["🌞 Beach season promotions at coastal resorts", "🏊 Water sports and summer activities"],
            9: ["📖 Back-to-school season - stationery and uniforms", "🎓 University supplies and textbooks"],
            10: ["🪔 Deepavali season - sweets (mithai) and traditional items", "🕉️ Religious items and decorations"],
            11: ["🎄 Christmas season - gifts and decorations", "🎁 Toy and electronics sales"],
            12: ["🎊 Year-end sales and clearance", "📱 Electronics and gadget deals"]
        }
        if current_month in seasonal_offers:
            insights['seasonal_offers'] = seasonal_offers[current_month]
        
        # Add category-specific promotions based on the transaction category
        if category:
            category_promotions = get_category_specific_promotions(category, today)
            if category_promotions:
                insights['personalized_suggestions'] = category_promotions
        
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
        anthropic_response = call_anthropic_api(message, user_context, message_type='transaction')
        if not anthropic_response:
            return jsonify({"error": "Failed to process transaction"}), 500

        parsed_response = parse_anthropic_response(anthropic_response, message_type='transaction')
        if not parsed_response:
            return jsonify({"error": "Failed to parse transaction response"}), 500

        # Check if the LLM/classifier determined this is a transaction
        if parsed_response.get('message_type') != 'transaction':
            return jsonify({
                "status": "retry",
                "message": "Sorry, I didn’t understand. Please describe your transaction (e.g., 'I spent 5000 on groceries')."
            })

        # Only process and return a transaction if message_type is 'transaction'
        structured_data = parsed_response['data']

        # Patch: Only accept price if user provided a number in their message
        user_message = request.json.get('message', '')
        import re
        user_provided_price = re.search(r'\b\d+[.,]?\d*\b', user_message)
        if not user_provided_price:
            structured_data['price'] = 0

        # Robust defaults for structured_data
        defaults = {
            'item': '',
            'price': 0,
            'category': '',
            'type': 'Expense',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'location': '',
            'latitude': request.json.get('latitude'),
            'longitude': request.json.get('longitude'),
            'suggestions': []
        }
        for key, value in defaults.items():
            if key not in structured_data or structured_data[key] is None:
                structured_data[key] = value
        # If item is missing or empty, set to 'item' (the literal string)
        if not structured_data['item']:
            structured_data['item'] = 'item'
        # Ensure price is numeric
        try:
            structured_data['price'] = float(structured_data['price'])
        except (ValueError, TypeError):
            structured_data['price'] = 0
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
                    type_value = 'Expense'
            structured_data['type'] = type_value
        else:
            structured_data['type'] = 'Expense'
        # If location is missing, fetch from last transaction
        if not structured_data.get('location'):
            last_tx = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.date.desc(), Transaction.timestamp.desc()).first()
            if last_tx and last_tx.location:
                structured_data['location'] = last_tx.location
        # Override date if user message contains 'yesterday' or 'today'
        user_message = request.json.get('message', '').lower()
        date_str = str(structured_data.get('date', '')).strip().lower()
        if 'yesterday' in user_message:
            structured_data['date'] = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
        elif 'today' in user_message or date_str in ('', 'today'):
            structured_data['date'] = datetime.now().strftime('%Y-%m-%d')
        else:
            try:
                # Try parsing as YYYY-MM-DD or similar
                structured_data['date'] = datetime.strptime(date_str, '%Y-%m-%d').strftime('%Y-%m-%d')
            except Exception:
                structured_data['date'] = datetime.now().strftime('%Y-%m-%d')

        # Minimum validity check: if all fields are default, treat as not a real transaction
        if (
            (structured_data['item'] == 'item' or not structured_data['item']) and
            (structured_data['price'] == 0 or structured_data['price'] == '0') and
            not structured_data['category']
        ):
            return jsonify({
                "status": "retry",
                "message": "Sorry, I didn’t understand. Please describe your transaction (e.g., 'I spent 5000 on groceries')."
            })

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