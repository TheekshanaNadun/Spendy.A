import random
from datetime import datetime, timedelta
from app import app
from models import db, Transaction, Category

with app.app_context():
    # Do NOT drop or recreate tables, and do NOT delete any data
    # Only add demo transactions to user_id=1

    # Helper to get a date offset from a start date
    def date_offset(start, offset):
        return (start + timedelta(days=offset)).date()

    all_categories = Category.query.all()
    expense_cats = [c for c in all_categories if c.type == "Expense"]
    income_cats = [c for c in all_categories if c.type == "Income"]

    # Always add 100 expense and 100 income transactions to user_id=1
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

    print("Added 200 demo transactions (100 expense, 100 income) to user_id=1. No users or categories were deleted or added.") 