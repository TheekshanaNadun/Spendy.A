use spendy_ai;

select * from transactions;
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
