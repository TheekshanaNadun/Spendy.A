use spendy_ai;

select * from transactions;
select * from users;


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
