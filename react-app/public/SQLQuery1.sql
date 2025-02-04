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