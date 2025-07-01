import random
from datetime import datetime, timedelta
from app import app
from models import db, User, Category, Transaction
from werkzeug.security import generate_password_hash
from sqlalchemy import text, MetaData

with app.app_context():
    db.session.execute(text('SET FOREIGN_KEY_CHECKS = 0;'))
    meta = MetaData()
    meta.reflect(bind=db.engine)
    meta.drop_all(bind=db.engine)
    db.session.execute(text('SET FOREIGN_KEY_CHECKS = 1;'))
    db.create_all()

    # Create users
    user1 = User(username="alice", email="alice@example.com", password_hash=generate_password_hash("password123"))
    user2 = User(username="bob", email="bob@example.com", password_hash=generate_password_hash("password456"))
    db.session.add_all([user1, user2])
    db.session.commit()

    # Create categories
    categories = [
        Category(name="Food & Groceries", type="Expense"),
        Category(name="Transport", type="Expense"),
        Category(name="Salary", type="Income"),
        Category(name="Freelance", type="Income"),
        Category(name="Entertainment", type="Expense"),
        Category(name="Investment", type="Income"),
        Category(name="Healthcare", type="Expense"),
        Category(name="Education", type="Expense"),
    ]
    db.session.add_all(categories)
    db.session.commit()

    # Helper to get a date offset from a start date
    def date_offset(start, offset):
        return (start + timedelta(days=offset)).date()

    all_categories = Category.query.all()
    expense_cats = [c for c in all_categories if c.type == "Expense"]
    income_cats = [c for c in all_categories if c.type == "Income"]

    # Generate 100 unique days for Expense (realistic, trending data)
    expense_start = datetime(2025, 6, 1)
    for i in range(100):
        cat = random.choice(expense_cats)
        price = 5000 + i*10 + random.randint(-500, 500)  # upward trend + noise
        t = Transaction(
            user_id=1,
            category=cat.name,
            type=cat.type,
            item=f"{cat.name} Item Expense {i+1}",
            price=price,
            date=date_offset(expense_start, i)
        )
        db.session.add(t)

    # Generate 100 unique days for Income (realistic, trending data)
    income_start = datetime(2025, 6, 1)
    for i in range(100):
        cat = random.choice(income_cats)
        price = 10000 + i*20 + random.randint(-1000, 1000)  # upward trend + noise
        t = Transaction(
            user_id=1,
            category=cat.name,
            type=cat.type,
            item=f"{cat.name} Item Income {i+1}",
            price=price,
            date=date_offset(income_start, i)
        )
        db.session.add(t)
    db.session.commit()

    print("Database seeded with 200 realistic, trending transactions (100 unique days for both income and expense) for June 1 - Sept 8, 2025!") 