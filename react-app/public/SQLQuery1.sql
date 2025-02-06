use spendy_ai;

select * from transactions;
select * from users;
select * from categories;

select * from user_category_limits;

DROP TABLE transactions;

CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,          -- Auto-incremented user ID
    username VARCHAR(255) NOT NULL,                  -- Username
    email VARCHAR(255) NOT NULL,                     -- User email
    password_hash VARCHAR(255) NOT NULL,             -- Encrypted password
    monthly_limit INT DEFAULT 0,                     -- Monthly spending limit (e.g., Rs. 5000)
    profile_image VARBINARY(MAX),                    -- Profile image stored as BLOB (binary data)
);


CREATE TABLE transactions (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,  -- Auto-incremented transaction ID
    user_id INT NOT NULL,                           -- Foreign key to users table
    item VARCHAR(255)  NULL,                     -- Transaction item (e.g., groceries, movie, etc.)
    price INT NULL,                             -- Amount of money spent or earned
    date DATE NOT NULL,                             -- Transaction date
	location VARCHAR(255),                          -- Location of the transaction (optional)
    category VARCHAR(100) NULL,                 -- Category (e.g., "Food", "Bills", "Income")
    type VARCHAR(50) NULL,                      -- Type (e.g., 'Income' or 'Expense')
    timestamp TIME NULL,                        -- Time of transaction
	 latitude FLOAT,                                 -- Latitude (nullable)
    longitude FLOAT,                                -- Longitude (nullable)
    FOREIGN KEY (user_id) REFERENCES users(user_id)

);
CREATE TABLE categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Income', 'Expense'))
);
CREATE TABLE user_category_limits (
    limit_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    monthly_limit DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
    UNIQUE (user_id, category_id)
);
CREATE TABLE notifications (
    notification_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'threshold_alert', 'payment_reminder'
    message TEXT NOT NULL,
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
-- Expense Categories
-- Expense Categories
INSERT INTO categories (name, type) VALUES
('Food & Groceries', 'Expense'),
('Public Transportation (Bus/Train)', 'Expense'),
('Three Wheeler Fees', 'Expense'),
('Electricity (CEB)', 'Expense'),
('Water Supply', 'Expense'),
('Entertainment','Expense'),
('Mobile Prepaid', 'Expense'),
('Internet (ADSL/Fiber)', 'Expense'),
('Hospital Charges', 'Expense'),
('School Fees', 'Expense'),
('University Expenses', 'Expense'),
('Educational Materials', 'Expense'),
('Clothing & Textiles', 'Expense'),
('House Rent', 'Expense'),
('Home Maintenance', 'Expense'),
('Family Events', 'Expense'),
('Petrol/Diesel', 'Expense'),
('Vehicle Maintenance', 'Expense'),
('Vehicle Insurance', 'Expense'),
('Bank Loans', 'Expense'),
('Credit Card Payments', 'Expense'),
('Income Tax', 'Expense');

-- Income Categories
INSERT INTO categories (name, type) VALUES
('Salary', 'Income'),
('Foreign Remittances', 'Income'),
('Rental Income', 'Income'),
('Agricultural Income', 'Income'),
('Business Profits', 'Income'),
('Investment Returns', 'Income'),
('Government Allowances', 'Income'),
('Freelance Income', 'Income');

INSERT INTO user_category_limits (user_id, category_id, monthly_limit)
VALUES
(1, 31, 25000.00),   -- Food & Groceries
(1, 34, 10000.00),   -- Electricity (CEB)
(1, 35, 3000.00),    -- Water Supply
(1, 44, 35000.00),   -- House Rent
(1, 53, 0.00),       -- Salary (income category)
(1, 54, 0.00),       -- Foreign Remittances (income)
(1, 47, 15000.00),   -- Petrol/Diesel
(1, 38, 5000.00);    -- Internet (ADSL/Fiber)

ALTER TABLE transactions
ALTER COLUMN category VARCHAR(100) NOT NULL;

ALTER TABLE transactions
ADD CONSTRAINT FK_transactions_categories 
FOREIGN KEY (category) REFERENCES categories(name);

SELECT DISTINCT t.category 
FROM transactions t
LEFT JOIN categories c ON t.category = c.name
WHERE c.category_id IS NULL;

ALTER TABLE transactions
ADD CONSTRAINT FK_transactions_categories 
FOREIGN KEY (category) REFERENCES categories(name);

ALTER TABLE transactions
ADD CONSTRAINT CHK_type CHECK (type IN ('Income', 'Expense'));

CREATE TRIGGER trg_SyncCategories
ON transactions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Insert new categories from transactions
    INSERT INTO categories (name, type)
    SELECT DISTINCT i.category, i.type
    FROM inserted i
    LEFT JOIN categories c ON i.category = c.name
    WHERE c.category_id IS NULL
      AND i.category IS NOT NULL
      AND i.type IN ('Income', 'Expense');
END;

CREATE TRIGGER trg_ValidateCategoryType
ON transactions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Check for type mismatches
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN categories c ON i.category = c.name
        WHERE c.type <> i.type
    )
    BEGIN
        RAISERROR('Category type mismatch: Transaction type conflicts with existing category.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
SELECT transaction_id, category_id 
FROM transactions 
WHERE category_id NOT IN (SELECT category_id FROM categories);

- Backfill missing categories from existing transactions
INSERT INTO categories (name, type)
SELECT DISTINCT category, type 
FROM transactions
WHERE category IS NOT NULL
  AND type IN ('Income', 'Expense')
  AND category NOT IN (SELECT name FROM categories);

  -- Allow NULL temporarily during transition
ALTER TABLE transactions
ALTER COLUMN category VARCHAR(100) NULL;

-- Add foreign key constraint
ALTER TABLE transactions
ADD CONSTRAINT FK_transactions_categories 
FOREIGN KEY (category) REFERENCES categories(name);

-- Enforce NOT NULL after validation
ALTER TABLE transactions
ALTER COLUMN category VARCHAR(100) NOT NULL;


ALTER TRIGGER
trg_SyncCategories ON transactions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Handle new categories
    MERGE INTO categories AS target
    USING (SELECT DISTINCT category, type FROM inserted) AS source
    ON target.name = source.category
    WHEN NOT MATCHED THEN
        INSERT (name, type) VALUES (source.category, source.type);
END;

ALTER TRIGGER trg_ValidateCategoryType
ON transactions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1
        FROM inserted i
        LEFT JOIN categories c ON i.category = c.name
        WHERE c.type <> i.type
    )
    BEGIN
        ;THROW 51000, 'Category type mismatch with transaction', 1;
        ROLLBACK TRANSACTION;
    END
END;

SELECT name, is_not_trusted 
FROM sys.foreign_keys 
WHERE name = 'FK_transactions_categories';

INSERT INTO transactions (user_id, item, price, date, category, type)
SELECT 1, 'Test Item', 5000, GETDATE(), c.name, 'Expense'
FROM categories c
WHERE c.name = 'NewCategory' AND c.type = 'Expense';

-- Disable trigger temporarily for testing
DISABLE TRIGGER trg_SyncCategories ON transactions;
