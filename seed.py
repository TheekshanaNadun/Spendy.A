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

    # Helper to get random date in June or July 2025
    def random_date():
        start = datetime(2025, 6, 1)
        end = datetime(2025, 7, 31)
        delta = end - start
        return (start + timedelta(days=random.randint(0, delta.days))).date()

    # Create 100 random transactions for user_id 1 only
    all_categories = Category.query.all()
    for _ in range(100):
        cat = random.choice(all_categories)
        price = random.randint(500, 50000) if cat.type == "Expense" else random.randint(1000, 100000)
        t = Transaction(
            user_id=1,
            category=cat.name,
            type=cat.type,
            item=f"{cat.name} Item {_+1}",
            price=price,
            date=random_date()
        )
        db.session.add(t)
    db.session.commit()

    print("Database seeded with 100 transactions for June and July 2025!") 