-- Spendy.AI MySQL Initialization Script

-- Drop tables in a safe order to avoid foreign key constraint issues.
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `user_category_limits`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS=1;

-- Table structure for `users`
CREATE TABLE `users` (
    `user_id` INT PRIMARY KEY AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `monthly_limit` INT DEFAULT 0,
    `profile_image` LONGBLOB,
    UNIQUE (`username`),
    UNIQUE (`email`)
);

-- Table structure for `categories`
CREATE TABLE `categories` (
    `category_id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) UNIQUE NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    CONSTRAINT `CHK_category_type` CHECK (`type` IN ('Income', 'Expense'))
);

-- Table structure for `transactions`
CREATE TABLE `transactions` (
    `transaction_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `item` VARCHAR(255) NULL,
    `price` INT NULL,
    `date` DATE NOT NULL,
	`location` VARCHAR(255),
    `category` VARCHAR(100) NULL,
    `type` VARCHAR(50) NULL,
    `timestamp` TIME NULL,
	`latitude` FLOAT,
    `longitude` FLOAT,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`),
    FOREIGN KEY (`category`) REFERENCES `categories`(`name`),
    CONSTRAINT `CHK_transaction_type` CHECK (`type` IN ('Income', 'Expense'))
);

-- Table structure for `user_category_limits`
CREATE TABLE `user_category_limits` (
    `limit_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    `monthly_limit` DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE CASCADE,
    UNIQUE (`user_id`, `category_id`)
);

-- Table structure for `notifications`
CREATE TABLE `notifications` (
    `notification_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`)
);

-- Insert initial data into `categories`
INSERT INTO `categories` (name, type) VALUES
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
('Income Tax', 'Expense'),
('Salary', 'Income'),
('Foreign Remittances', 'Income'),
('Rental Income', 'Income'),
('Agricultural Income', 'Income'),
('Business Profits', 'Income'),
('Investment Returns', 'Income'),
('Government Allowances', 'Income'),
('Freelance Income', 'Income');

-- Insert initial user category limits using subqueries to get the correct category_id
-- NOTE: This assumes a user with user_id = 1 already exists.
-- You might need to insert a user first for this to work.
INSERT INTO `user_category_limits` (user_id, category_id, monthly_limit) VALUES
(1, (SELECT category_id FROM `categories` WHERE name = 'Food & Groceries'), 25000.00),
(1, (SELECT category_id FROM `categories` WHERE name = 'Electricity (CEB)'), 10000.00),
(1, (SELECT category_id FROM `categories` WHERE name = 'Water Supply'), 3000.00),
(1, (SELECT category_id FROM `categories` WHERE name = 'House Rent'), 35000.00),
(1, (SELECT category_id FROM `categories` WHERE name = 'Salary'), 0.00),
(1, (SELECT category_id FROM `categories` WHERE name = 'Foreign Remittances'), 0.00),
(1, (SELECT category_id FROM `categories` WHERE name = 'Petrol/Diesel'), 15000.00),
(1, (SELECT category_id FROM `categories` WHERE name = 'Internet (ADSL/Fiber)'), 5000.00);

-- --- TRIGGERS ---

-- Trigger to automatically add a new category from a transaction if it doesn't exist.
DELIMITER $$
CREATE TRIGGER `trg_SyncCategories_insert`
AFTER INSERT ON `transactions`
FOR EACH ROW
BEGIN
    IF NEW.category IS NOT NULL THEN
        INSERT IGNORE INTO `categories` (`name`, `type`) VALUES (NEW.category, NEW.type);
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_SyncCategories_update`
AFTER UPDATE ON `transactions`
FOR EACH ROW
BEGIN
    IF NEW.category IS NOT NULL THEN
        INSERT IGNORE INTO `categories` (`name`, `type`) VALUES (NEW.category, NEW.type);
    END IF;
END$$
DELIMITER ;


-- Trigger to validate that the transaction type matches the category type.
DELIMITER $$
CREATE TRIGGER `trg_ValidateCategoryType_insert`
BEFORE INSERT ON `transactions`
FOR EACH ROW
BEGIN
    DECLARE category_type_from_db VARCHAR(20);
    IF NEW.category IS NOT NULL THEN
        SELECT `type` INTO category_type_from_db FROM `categories` WHERE `name` = NEW.category;
        IF category_type_from_db IS NOT NULL AND category_type_from_db <> NEW.type THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Category type mismatch: Transaction type conflicts with existing category.';
        END IF;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `trg_ValidateCategoryType_update`
BEFORE UPDATE ON `transactions`
FOR EACH ROW
BEGIN
    DECLARE category_type_from_db VARCHAR(20);
    IF NEW.category IS NOT NULL THEN
        SELECT `type` INTO category_type_from_db FROM `categories` WHERE `name` = NEW.category;
        IF category_type_from_db IS NOT NULL AND category_type_from_db <> NEW.type THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Category type mismatch: Transaction type conflicts with existing category.';
        END IF;
    END IF;
END$$
DELIMITER ; 