-- DonorTrack Database Schema
-- MySQL 8.0+

SET FOREIGN_KEY_CHECKS=0;

-- Drop existing tables
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS communications;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS donors;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS=1;

-- Users table (Admin and Staff)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Staff') NOT NULL DEFAULT 'Staff',
    status ENUM('Active', 'Inactive', 'Disabled') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Donors table
CREATE TABLE donors (
    donor_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    donor_rank ENUM('Bronze', 'Silver', 'Gold', 'Platinum') NOT NULL DEFAULT 'Bronze',
    total_donated DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Active', 'Inactive', 'Archived') NOT NULL DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_rank (donor_rank),
    INDEX idx_total_donated (total_donated DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaigns table
CREATE TABLE campaigns (
    campaign_id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name VARCHAR(255) NOT NULL,
    description TEXT,
    goal_amount DECIMAL(10, 2) NOT NULL,
    amount_raised DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    start_date DATE,
    end_date DATE,
    status ENUM('Planning', 'Live', 'Paused', 'Completed', 'Archived') NOT NULL DEFAULT 'Planning',
    image_url VARCHAR(255),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_amount_raised (amount_raised DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Donations table
CREATE TABLE donations (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    campaign_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    donation_date DATE NOT NULL,
    payment_method ENUM('Card', 'Bank Transfer', 'PayPal', 'Check') NOT NULL DEFAULT 'Card',
    payment_status ENUM('Pending', 'Succeeded', 'Processing', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    transaction_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE RESTRICT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE RESTRICT,
    INDEX idx_donor_id (donor_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_donation_date (donation_date DESC),
    INDEX idx_payment_status (payment_status),
    INDEX idx_amount (amount DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Communications table
CREATE TABLE communications (
    communication_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    type ENUM('Email outreach', 'Call logged', 'Meeting note', 'Thank you', 'Other') NOT NULL DEFAULT 'Email outreach',
    content TEXT NOT NULL,
    status ENUM('Draft', 'Sent', 'In review', 'Pending', 'Completed') NOT NULL DEFAULT 'Draft',
    staff_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_donor_id (donor_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity log table
CREATE TABLE activity_log (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50),
    entity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Data

-- Insert default admin user (password: Admin@123)
INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES
('Admin', 'User', 'admin@donortrack.com', '$2y$12$4R0z5CxaL7MQZzq.I.KOsuKkN2x5aS9zPGP8Dj6Z7E9qM3K0L2a3O', 'Admin', 'Active');

-- Insert staff user (password: Staff@123)
INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES
('Staff', 'Member', 'staff@donortrack.com', '$2y$12$P8nL9E2K0Z7X4V1Q3R5S0T2Y4U6W8A9B3C5D7F9G1H3J5K7L9M1', 'Staff', 'Active');

-- Insert donors
INSERT INTO donors (first_name, last_name, email, phone, donor_rank, total_donated, status) VALUES
('Jordan', 'Doe', 'jordan@example.com', '+1 415 555 0145', 'Platinum', 56200, 'Active'),
('Sofia', 'Alvarez', 'sofia@hope.org', '+1 212 555 0199', 'Gold', 24800, 'Active'),
('Max', 'King', 'max.king@kind.org', '+44 20 7946 0987', 'Silver', 12150, 'Active'),
('Elena', 'Grant', 'elena@grant.org', '+1 503 555 0122', 'Platinum', 89400, 'Active'),
('Marcus', 'Kim', 'marcus@kim.co', '+1 617 555 0188', 'Gold', 42000, 'Active'),
('Renton', 'Lee', 'renton@lee.net', '+1 206 555 0166', 'Bronze', 3200, 'Active'),
('Amara', 'Chen', 'amara.chen@example.org', '+1 555 0110', 'Silver', 15500, 'Active'),
('Noah', 'Bennett', 'noah.bennett@example.org', '+1 555 0111', 'Bronze', 5200, 'Active'),
('Priya', 'Nair', 'priya.nair@example.org', '+1 555 0112', 'Gold', 31000, 'Active'),
('Theo', 'Martin', 'theo.martin@example.org', '+1 555 0113', 'Platinum', 72000, 'Active');

-- Insert campaigns
INSERT INTO campaigns (campaign_name, description, goal_amount, amount_raised, start_date, end_date, status, created_by) VALUES
('Summer School Drive', 'Empowering 1,200 students with mentorship programs and classroom supplies.', 240000, 174000, '2026-06-01', '2026-08-31', 'Live', 1),
('Community Wellness', 'Healthcare access support with preventative care and advocacy campaigns.', 160000, 61000, '2026-07-15', '2026-09-30', 'Planning', 1),
('Clean Water Push', 'Raising funds for safe water infrastructure in rural communities.', 120000, 65000, '2026-05-01', '2026-07-31', 'Paused', 1),
('Back-to-school', 'School supplies and scholarships for underserved communities.', 180000, 132000, '2026-07-01', '2026-09-15', 'Live', 1),
('Food access', 'Meal programs and food pantry support across partner sites.', 120000, 85000, '2026-06-15', '2026-12-31', 'Live', 1);

-- Insert donations
INSERT INTO donations (donor_id, campaign_id, amount, donation_date, payment_method, payment_status) VALUES
(4, 1, 7500, '2026-06-25', 'Card', 'Succeeded'),
(5, 5, 22000, '2026-06-24', 'Card', 'Pending'),
(6, 2, 1400, '2026-06-22', 'PayPal', 'Succeeded'),
(1, 3, 4200, '2026-06-24', 'Card', 'Pending'),
(2, 1, 18200, '2026-06-22', 'Bank Transfer', 'Processing'),
(3, 1, 2500, '2026-06-20', 'Card', 'Succeeded'),
(1, 1, 12000, '2026-07-05', 'Card', 'Succeeded'),
(4, 4, 5500, '2026-07-03', 'Bank Transfer', 'Succeeded'),
(5, 4, 8000, '2026-07-02', 'Card', 'Succeeded'),
(2, 5, 15000, '2026-07-04', 'Card', 'Processing');

-- Insert communications
INSERT INTO communications (donor_id, type, content, status, staff_id) VALUES
(1, 'Email outreach', 'Followed up on the new campaign launch and shared the donor impact story with personalized messaging.', 'Sent', 2),
(2, 'Call logged', 'Discussed donor preferences for recurring giving and updated campaign interests for the stewardship team.', 'In review', 2),
(5, 'Meeting note', 'Staff confirmed donor communication preferences and scheduled an introduction call for next week.', 'Pending', 2);

-- Add indexes for common queries
CREATE INDEX idx_donor_last_donated ON donors (updated_at DESC);
CREATE INDEX idx_campaign_status_live ON campaigns (status, start_date DESC);
