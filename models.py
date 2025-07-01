from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey, CheckConstraint, UniqueConstraint
from datetime import datetime

# Initialize SQLAlchemy without an app object.
# The app object will be associated later in the main app files.
db = SQLAlchemy()

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

class Category(db.Model):
    __tablename__ = 'categories'
    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    type = db.Column(db.String(20), nullable=False)
    
    transactions = db.relationship('Transaction', back_populates='category_rel')
    limits = db.relationship('UserCategoryLimit', back_populates='category')
    
    __table_args__ = (
        CheckConstraint("type IN ('Income', 'Expense')", name='check_category_type'),
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
        UniqueConstraint('user_id', 'category_id', name='_user_category_uc'),
    ) 