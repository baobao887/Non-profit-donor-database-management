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
    failed_login_attempts INT UNSIGNED NOT NULL DEFAULT 0,
    locked_until DATETIME NULL DEFAULT NULL,
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
    -- Demographic fields: OPTIONAL (nullable) and collected for aggregate
    -- analytics only, consistent with data-minimization principles. They are
    -- never required to process a donation and donors may decline to provide
    -- them. city/province are the structured, groupable location fields;
    -- the free-text `address` above keeps street-level detail.
    gender ENUM('Male', 'Female', 'Prefer not to say') NULL DEFAULT NULL,
    birthdate DATE NULL DEFAULT NULL,
    city VARCHAR(100) NULL,
    province VARCHAR(100) NULL,
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
    payment_method ENUM('Cash', 'GCash', 'Card', 'Bank Transfer', 'PayPal', 'Check') NOT NULL DEFAULT 'Cash',
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
('Admin', 'User', 'admin@donortrack.com', '$2y$12$wr.Rhv47k54BKmGdhAJC0.p7ScQsulhtoOfp3Z/9jxNZutHqz115q', 'Admin', 'Active');

-- Insert staff user (password: Staff@123)
INSERT INTO users (first_name, last_name, email, password_hash, role, status) VALUES
('Staff', 'Member', 'staff@donortrack.com', '$2y$12$gfWoCsVySofWHN7jqZnSeOcbNqmAtWChwv5WTd/e4RabHKRQvycY6', 'Staff', 'Active');

-- Insert donors (total_donated and donor_rank are recalculated from donations below)
-- gender/birthdate/city/province are optional demographic fields; Manuel (archived,
-- opted out) is intentionally left NULL to exercise the "Not specified" grouping.
INSERT INTO donors (first_name, last_name, email, phone, address, city, province, gender, birthdate, status, notes, created_at) VALUES
('Maria', 'Santos', 'maria.santos@gmail.com', '+63 917 555 0101', '12 Maginhawa St, Teachers Village, Quezon City', 'Quezon City', 'Metro Manila', 'Female', '1975-03-14', 'Active', 'Prefers email updates. Long-time supporter of education programs.', '2026-01-12 09:30:00'),
('Jose', 'Ramirez', 'jose.ramirez@yahoo.com', '+63 918 555 0102', 'Unit 8B Salcedo Park Tower, Makati City', 'Makati', 'Metro Manila', 'Male', '1988-07-09', 'Active', NULL, '2026-01-20 14:10:00'),
('Ana', 'Reyes', 'ana.reyes@outlook.com', '+63 916 555 0103', '45 Osmeña Blvd, Cebu City', 'Cebu City', 'Cebu', 'Female', '1996-11-22', 'Active', NULL, '2026-02-03 10:45:00'),
('Paolo', 'Dela Cruz', 'paolo.delacruz@gmail.com', '+63 920 555 0104', '23 C. Raymundo Ave, Pasig City', 'Pasig', 'Metro Manila', 'Male', '1983-01-30', 'Active', NULL, '2026-02-14 16:20:00'),
('Grace', 'Lim', 'grace.lim@limholdings.ph', '+63 917 555 0105', '30th Floor, One Bonifacio High Street, Taguig', 'Taguig', 'Metro Manila', 'Female', '1969-05-18', 'Active', 'Corporate matching donor via Lim Holdings. Interested in water and health projects.', '2026-02-18 11:00:00'),
('Miguel', 'Tan', 'miguel.tan@gmail.com', '+63 915 555 0106', '88 J.P. Laurel Ave, Davao City', 'Davao City', 'Davao del Sur', 'Male', '1992-09-03', 'Active', NULL, '2026-03-02 08:55:00'),
('Katrina', 'Villanueva', 'kat.villanueva@gmail.com', '+63 919 555 0107', '17 Shaw Blvd, Mandaluyong City', 'Mandaluyong', 'Metro Manila', 'Female', '2000-02-14', 'Active', NULL, '2026-03-10 13:40:00'),
('Ramon', 'Aquino', 'ramon.aquino@aquinolaw.ph', '+63 917 555 0108', 'Suite 1201, Ermita Center, Manila', 'Manila', 'Metro Manila', 'Prefer not to say', '1961-12-01', 'Active', 'Prefers phone calls. Asks for quarterly impact reports.', '2026-03-21 15:25:00'),
('Lourdes', 'Garcia', 'lourdes.garcia@gmail.com', '+63 921 555 0109', '5 General Luna St, Iloilo City', 'Iloilo City', 'Iloilo', 'Female', '1958-08-25', 'Active', NULL, '2026-04-01 09:05:00'),
('Benjie', 'Ocampo', 'benjie.ocampo@gmail.com', '+63 922 555 0110', '142 A. Mabini St, Caloocan City', 'Caloocan', 'Metro Manila', 'Male', '1990-04-10', 'Active', NULL, '2026-04-08 17:35:00'),
('Cheska', 'Uy', 'cheska.uy@uygroup.ph', '+63 917 555 0111', '9 Wilson St, San Juan City', 'San Juan', 'Metro Manila', 'Female', '1998-06-27', 'Active', 'Introduced by Grace Lim. Focused on youth and education causes.', '2026-04-15 10:15:00'),
('Andres', 'Bautista', 'andres.bautista@gmail.com', '+63 918 555 0112', '3 Session Road, Baguio City', 'Baguio', 'Benguet', 'Male', '1978-10-05', 'Active', NULL, '2026-04-27 12:50:00'),
('Isabel', 'Navarro', 'isabel.navarro@gmail.com', '+63 916 555 0113', '27 Escario St, Cebu City', 'Cebu City', 'Cebu', 'Female', '1985-03-19', 'Active', NULL, '2026-05-06 14:30:00'),
('Daniel', 'Cruz', 'dan.cruz@gmail.com', '+63 917 555 0114', '11 Doña Soledad Ave, Parañaque City', 'Parañaque', 'Metro Manila', 'Male', '1995-12-12', 'Active', NULL, '2026-05-19 09:45:00'),
('Sarah', 'Mercado', 'sarah.mercado@gmail.com', '+63 915 555 0115', '64 Alabang-Zapote Rd, Las Piñas City', 'Las Piñas', 'Metro Manila', 'Female', '1972-07-07', 'Active', NULL, '2026-06-02 16:05:00'),
('Victor', 'Salazar', 'victor.salazar@salazarfoods.ph', '+63 917 555 0116', '2 Marcos Highway, Antipolo City', 'Antipolo', 'Rizal', 'Male', '1966-02-28', 'Inactive', 'Paused giving until Q4 2026 — company budget freeze.', '2026-02-25 11:30:00'),
('Bea', 'Torres', 'bea.torres@gmail.com', '+63 919 555 0117', '35 Gil Fernando Ave, Marikina City', 'Marikina', 'Metro Manila', 'Female', '2002-05-16', 'Active', NULL, '2026-06-28 13:15:00'),
('Manuel', 'Robles', 'manuel.robles@gmail.com', '+63 920 555 0118', '50 Rizal Ave, Olongapo City', 'Olongapo', 'Zambales', NULL, NULL, 'Archived', 'Requested to be removed from mailing lists in June 2026.', '2026-01-05 10:00:00');

-- Insert campaigns (amount_raised is recalculated from donations below)
INSERT INTO campaigns (campaign_name, description, goal_amount, amount_raised, start_date, end_date, status, created_by, created_at) VALUES
('Bayanihan School Kits 2026', 'School kits, uniforms, and mentorship support for 2,000 public school students across Metro Manila.', 500000, 0, '2026-06-01', '2026-08-31', 'Live', 1, '2026-05-20 09:00:00'),
('Clean Water for Barangay Malinao', 'Deep-well construction and household filtration units for Barangay Malinao and neighboring sitios.', 350000, 0, '2026-05-15', '2026-09-30', 'Live', 1, '2026-05-01 10:30:00'),
('Typhoon Readiness Fund', 'Pre-positioned relief kits and evacuation center upgrades ahead of the 2026 typhoon season.', 400000, 0, '2026-07-01', '2026-12-15', 'Live', 1, '2026-06-18 14:00:00'),
('Batang Malusog Feeding Program', 'Daily school feeding program serving nutritious meals to undernourished elementary students in Iloilo.', 90000, 0, '2026-02-01', '2026-05-31', 'Completed', 1, '2026-01-15 08:45:00'),
('Youth Coding Scholarships', 'Full scholarships and laptop grants for out-of-school youth entering tech bootcamps.', 250000, 0, '2026-09-01', '2027-02-28', 'Planning', 1, '2026-07-10 15:20:00'),
('Mobile Health Clinics', 'Mobile clinic visits bringing free checkups and medicines to remote upland barangays.', 150000, 0, '2026-04-01', '2026-10-31', 'Paused', 1, '2026-03-15 11:10:00'),
('Coastal Cleanup Coalition', 'Mangrove replanting and monthly coastal cleanups with volunteer fisherfolk communities.', 60000, 0, '2026-01-10', '2026-03-31', 'Archived', 1, '2025-12-20 09:30:00');

-- Insert donations (chronological)
INSERT INTO donations (donor_id, campaign_id, amount, donation_date, payment_method, payment_status, transaction_id) VALUES
(2,  7, 8000,  '2026-01-25', 'Card',          'Succeeded',  'TXN-2026-0001'),
(16, 7, 10000, '2026-02-05', 'Bank Transfer', 'Succeeded',  'TXN-2026-0002'),
(8,  7, 25000, '2026-02-10', 'Check',         'Succeeded',  'TXN-2026-0003'),
(1,  4, 7500,  '2026-02-15', 'Card',          'Succeeded',  'TXN-2026-0004'),
(6,  4, 10000, '2026-02-20', 'PayPal',        'Succeeded',  'TXN-2026-0005'),
(5,  4, 40000, '2026-03-05', 'Bank Transfer', 'Succeeded',  'TXN-2026-0006'),
(18, 7, 2500,  '2026-03-15', 'Check',         'Succeeded',  'TXN-2026-0007'),
(7,  4, 6500,  '2026-03-18', 'GCash',         'Succeeded',  'TXN-2026-0008'),
(16, 4, 8000,  '2026-03-30', 'Check',         'Succeeded',  'TXN-2026-0009'),
(9,  4, 5000,  '2026-04-05', 'Cash',          'Succeeded',  'TXN-2026-0010'),
(8,  4, 15000, '2026-04-12', 'Check',         'Succeeded',  'TXN-2026-0011'),
(2,  6, 7000,  '2026-04-15', 'Bank Transfer', 'Succeeded',  'TXN-2026-0012'),
(10, 4, 1500,  '2026-04-18', 'Cash',          'Succeeded',  'TXN-2026-0013'),
(1,  6, 5000,  '2026-04-20', 'Card',          'Refunded',   'TXN-2026-0014'),
(4,  6, 3500,  '2026-04-25', 'Card',          'Succeeded',  'TXN-2026-0015'),
(11, 6, 12000, '2026-05-02', 'GCash',         'Succeeded',  'TXN-2026-0016'),
(12, 6, 2000,  '2026-05-10', 'GCash',         'Succeeded',  'TXN-2026-0017'),
(5,  2, 75000, '2026-05-20', 'Bank Transfer', 'Succeeded',  'TXN-2026-0018'),
(6,  2, 18000, '2026-05-25', 'Card',          'Succeeded',  'TXN-2026-0019'),
(9,  2, 6000,  '2026-05-28', 'GCash',         'Succeeded',  'TXN-2026-0020'),
(13, 2, 2500,  '2026-05-30', 'Cash',          'Succeeded',  'TXN-2026-0021'),
(7,  2, 9000,  '2026-06-01', 'Card',          'Succeeded',  'TXN-2026-0022'),
(8,  2, 30000, '2026-06-05', 'Bank Transfer', 'Succeeded',  'TXN-2026-0023'),
(1,  1, 15000, '2026-06-08', 'Card',          'Succeeded',  'TXN-2026-0024'),
(5,  1, 50000, '2026-06-10', 'Bank Transfer', 'Succeeded',  'TXN-2026-0025'),
(3,  2, 5000,  '2026-06-12', 'Card',          'Succeeded',  'TXN-2026-0026'),
(11, 1, 35000, '2026-06-15', 'Card',          'Succeeded',  'TXN-2026-0027'),
(10, 2, 2000,  '2026-06-18', 'GCash',         'Succeeded',  'TXN-2026-0028'),
(14, 1, 5000,  '2026-06-20', 'Card',          'Succeeded',  'TXN-2026-0029'),
(6,  1, 20000, '2026-06-22', 'Bank Transfer', 'Succeeded',  'TXN-2026-0030'),
(15, 1, 2000,  '2026-06-25', 'Cash',          'Succeeded',  'TXN-2026-0031'),
(4,  1, 5000,  '2026-06-30', 'Card',          'Succeeded',  'TXN-2026-0032'),
(8,  1, 26500, '2026-07-01', 'Card',          'Succeeded',  'TXN-2026-0033'),
(3,  1, 7000,  '2026-07-02', 'PayPal',        'Succeeded',  'TXN-2026-0034'),
(1,  2, 10000, '2026-07-03', 'PayPal',        'Succeeded',  'TXN-2026-0035'),
(17, 3, 1500,  '2026-07-04', 'GCash',         'Succeeded',  'TXN-2026-0036'),
(13, 1, 4000,  '2026-07-05', 'Card',          'Succeeded',  'TXN-2026-0037'),
(9,  1, 4000,  '2026-07-06', 'Cash',          'Succeeded',  'TXN-2026-0038'),
(5,  3, 20000, '2026-07-08', 'Card',          'Processing', 'TXN-2026-0039'),
(14, 3, 4000,  '2026-07-09', 'PayPal',        'Succeeded',  'TXN-2026-0040'),
(2,  1, 10000, '2026-07-10', 'Card',          'Succeeded',  'TXN-2026-0041'),
(15, 3, 2500,  '2026-07-11', 'GCash',         'Succeeded',  'TXN-2026-0042'),
(11, 3, 15000, '2026-07-12', 'Bank Transfer', 'Processing', 'TXN-2026-0043'),
(7,  3, 6000,  '2026-07-14', 'Card',          'Succeeded',  'TXN-2026-0044'),
(8,  3, 10000, '2026-07-15', 'Card',          'Failed',     'TXN-2026-0045'),
(10, 1, 1000,  '2026-07-16', 'Card',          'Failed',     'TXN-2026-0046'),
(17, 1, 800,   '2026-07-17', 'GCash',         'Pending',    NULL),
(3,  3, 3000,  '2026-07-18', 'Card',          'Pending',    NULL);

-- Spread donation created_at over plausible daytime hours matching donation_date
UPDATE donations SET created_at = TIMESTAMP(donation_date, MAKETIME(8 + (donation_id MOD 10), (donation_id * 7) MOD 60, 0));

-- Insert communications
INSERT INTO communications (donor_id, type, content, status, staff_id, created_at) VALUES
(5,  'Thank you',      'Sent a formal acknowledgment letter for the ₱75,000 clean water pledge, including the barangay site assessment photos.', 'Sent', 1, '2026-05-22 09:15:00'),
(13, 'Email outreach', 'Welcome series email for Isabel with an overview of current campaigns and giving options.', 'Sent', 2, '2026-05-12 12:00:00'),
(9,  'Email outreach', 'Sent Lourdes the feeding program completion report showing the 12,000 meals served in Iloilo.', 'Sent', 2, '2026-06-05 09:40:00'),
(16, 'Call logged',    'Victor confirmed Salazar Foods is pausing donations until Q4 due to a budget freeze. Follow up in October.', 'Completed', 2, '2026-06-15 15:10:00'),
(18, 'Other',          'Processed Manuel''s request to be removed from all mailing lists; archived his donor profile.', 'Completed', 1, '2026-06-20 10:05:00'),
(6,  'Thank you',      'Thank-you note for the ₱20,000 school kits donation; included photos from the Davao packing session.', 'Sent', 2, '2026-06-24 11:20:00'),
(3,  'Email outreach', 'Sent Ana the Typhoon Readiness Fund launch announcement with a personalized giving link.', 'Sent', 2, '2026-07-01 08:50:00'),
(8,  'Call logged',    'Quarterly check-in call. Atty. Aquino asked for the H1 impact report before committing to the Typhoon Readiness Fund.', 'Completed', 2, '2026-07-02 14:00:00'),
(1,  'Email outreach', 'Shared the Bayanihan School Kits progress update and invited Maria to the August distribution day in Quezon City.', 'Sent', 2, '2026-07-06 10:30:00'),
(2,  'Meeting note',   'Coffee meeting with Jose; he is interested in sponsoring a mobile health clinic day once the campaign resumes.', 'Pending', 1, '2026-07-08 17:00:00'),
(11, 'Meeting note',   'Met with Cheska at the Uy Group office to discuss a possible matching-gift program for the coding scholarships.', 'In review', 1, '2026-07-10 16:45:00'),
(14, 'Thank you',      'Thanked Daniel for his first donation to the Typhoon Readiness Fund and shared the disaster kit checklist.', 'Sent', 2, '2026-07-10 09:00:00'),
(7,  'Thank you',      'Drafting a thank-you card for Katrina''s continued support across three campaigns this year.', 'Draft', 2, '2026-07-15 13:30:00'),
(5,  'Meeting note',   'Site visit planning with Grace Lim''s CSR team for the Barangay Malinao well inauguration in September.', 'In review', 1, '2026-07-16 15:50:00'),
(10, 'Call logged',    'Called Benjie about the failed card payment on July 16; he will retry with a different card this week.', 'Pending', 2, '2026-07-17 14:25:00'),
(17, 'Email outreach', 'Draft welcome email for Bea with recurring giving options.', 'Draft', 2, '2026-07-18 16:20:00');

-- Recalculate donor totals/ranks and campaign amounts (matches app logic: Succeeded + Processing count)
UPDATE donors d SET total_donated = COALESCE((SELECT SUM(amount) FROM donations dn WHERE dn.donor_id = d.donor_id AND dn.payment_status IN ('Succeeded','Processing')), 0);
UPDATE donors SET donor_rank = CASE
    WHEN total_donated >= 50000 THEN 'Platinum'
    WHEN total_donated >= 20000 THEN 'Gold'
    WHEN total_donated >= 5000 THEN 'Silver'
    ELSE 'Bronze' END;
UPDATE campaigns c SET amount_raised = COALESCE((SELECT SUM(amount) FROM donations dn WHERE dn.campaign_id = c.campaign_id AND dn.payment_status IN ('Succeeded','Processing')), 0);

-- Add indexes for common queries
CREATE INDEX idx_donor_last_donated ON donors (updated_at DESC);
CREATE INDEX idx_campaign_status_live ON campaigns (status, start_date DESC);
