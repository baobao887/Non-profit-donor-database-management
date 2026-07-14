# DonorTrack Backend Implementation - Setup Guide

## Overview

This document provides step-by-step instructions to set up the PHP/MySQL backend for the DonorTrack application. The frontend prototype has been converted into a fully functional web application with database-driven data.

## Prerequisites

- PHP 8.0+
- MySQL 8.0+
- A local web server (XAMPP, WAMP, Laragon, etc.)
- phpMyAdmin or MySQL CLI

## Installation Steps

### Step 1: Set Up the Database

1. **Open phpMyAdmin** or MySQL command line
2. **Create the database:**
   ```sql
   CREATE DATABASE donortrack DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Import the schema:**
   - In phpMyAdmin: Select the `donortrack` database → Import → Choose `database.sql` file
   - Via MySQL CLI: `mysql -u root -p donortrack < database.sql`

4. **Verify tables created:**
   ```sql
   USE donortrack;
   SHOW TABLES;
   ```

### Step 2: Configure PHP Environment

1. **Update database credentials** in `config/database.php` if needed:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASSWORD', '');
   define('DB_NAME', 'donortrack');
   ```

2. **Ensure PHP extensions are enabled:**
   - PDO
   - PDO MySQL
   - Session support

### Step 3: Set Up Local Web Server

1. **Copy project to web root:**
   - XAMPP: `C:\xampp\htdocs\donortrack`
   - WAMP: `C:\wamp\www\donortrack`
   - Laragon: `C:\laragon\www\donortrack`

2. **Start the web server**

3. **Access the application:**
   - http://localhost/donortrack/login.php

### Step 4: Test Login

Use the demo credentials:

**Admin Account:**
- Email: `admin@donortrack.com`
- Password: `Admin@123`

**Staff Account:**
- Email: `staff@donortrack.com`
- Password: `Staff@123`

---

## Project Structure

```
donortrack/
├── config/
│   ├── database.php          # Database connection
│   └── constants.php         # Application constants
├── includes/
│   ├── auth.php             # Authentication functions
│   ├── functions.php        # Helper functions
│   ├── header.php           # (To be created)
│   └── footer.php           # (To be created)
├── models/
│   ├── User.php             # User model
│   ├── Donor.php            # Donor model
│   ├── Campaign.php         # Campaign model
│   ├── Donation.php         # Donation model
│   └── Communication.php    # Communication model
├── api/
│   ├── check-session.php    # Session validation
│   ├── dashboard.php        # Dashboard statistics
│   ├── donors.php           # Donors CRUD
│   ├── campaigns.php        # Campaigns CRUD
│   ├── donations.php        # Donations CRUD
│   └── communications.php   # Communications CRUD
├── assets/
│   ├── css/
│   │   └── style.css        # Styling
│   ├── js/
│   │   ├── store.js         # Data store (to be updated)
│   │   ├── charts.js        # Charts (to be updated)
│   │   └── pages/           # Page scripts (to be updated)
│   └── data/
│       └── seed.json        # (Deprecated - use database)
├── login.php                # Login page (new)
├── logout.php               # Logout endpoint
├── login-handler.php        # Login handler API
├── database.sql             # Database schema
├── [HTML Pages]             # To be converted to PHP
└── SETUP.md                 # This file
```

---

## API Endpoints

All API endpoints require authentication (valid session). Responses are in JSON format.

### Authentication

**Login:**
- **POST** `/login-handler.php`
- **Body:** `{ email, password }`
- **Response:** `{ success, message, redirect }`

**Check Session:**
- **GET** `/api/check-session.php`
- **Response:** `{ authenticated, user }`

**Logout:**
- **GET** `/logout.php`

---

### Dashboard API

**Get Dashboard Statistics:**
- **GET** `/api/dashboard.php`
- **Response:** 
```json
{
  "totalDonors": 10,
  "totalDonations": 456000,
  "campaignCount": 5,
  "activeCampaigns": 3,
  "topDonors": [...],
  "recentDonations": [...],
  "campaignsNeedingAttention": [...]
}
```

---

### Donors API

**Get all donors:**
- **GET** `/api/donors.php?action=list&page=1&status=Active`

**Get single donor:**
- **GET** `/api/donors.php?action=get&id=1`

**Get top donors:**
- **GET** `/api/donors.php?action=top&limit=5`

**Search donors:**
- **GET** `/api/donors.php?action=search&q=john`

**Create donor:**
- **POST** `/api/donors.php?action=create`
- **Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1 415 555 0145",
  "address": "123 Main St"
}
```

**Update donor:**
- **PUT** `/api/donors.php?action=update`
- **Body:** (same as create)

**Archive donor:**
- **DELETE** `/api/donors.php?action=archive`
- **Body:** `{ donor_id }`

---

### Campaigns API

**Get all campaigns:**
- **GET** `/api/campaigns.php?action=list&page=1&status=Live`

**Get single campaign:**
- **GET** `/api/campaigns.php?action=get&id=1`

**Get live campaigns:**
- **GET** `/api/campaigns.php?action=live`

**Get campaigns needing attention:**
- **GET** `/api/campaigns.php?action=needs-attention`

**Create campaign (Admin only):**
- **POST** `/api/campaigns.php?action=create`
- **Body:**
```json
{
  "campaign_name": "Summer School Drive",
  "description": "Empowering students...",
  "goal_amount": 240000,
  "start_date": "2026-06-01",
  "end_date": "2026-08-31"
}
```

**Update campaign (Admin only):**
- **PUT** `/api/campaigns.php?action=update`
- **Body:** (same fields as create)

**Update campaign status (Admin only):**
- **PUT** `/api/campaigns.php?action=update-status`
- **Body:** `{ campaign_id, status }`
- **Valid statuses:** `Planning, Live, Paused, Completed, Archived`

---

### Donations API

**Get all donations:**
- **GET** `/api/donations.php?action=list&page=1`

**Get single donation:**
- **GET** `/api/donations.php?action=get&id=1`

**Get recent donations:**
- **GET** `/api/donations.php?action=recent&limit=10`

**Get donations by donor:**
- **GET** `/api/donations.php?action=by-donor&donor_id=1`

**Get donations by campaign:**
- **GET** `/api/donations.php?action=by-campaign&campaign_id=1`

**Get donation trend (by month):**
- **GET** `/api/donations.php?action=trend&months=6`

**Get donation breakdown (by campaign):**
- **GET** `/api/donations.php?action=breakdown`

**Create donation:**
- **POST** `/api/donations.php?action=create`
- **Body:**
```json
{
  "donor_id": 1,
  "campaign_id": 1,
  "amount": 5000,
  "donation_date": "2026-07-14",
  "payment_method": "Card"
}
```

**Update donation:**
- **PUT** `/api/donations.php?action=update`
- **Body:**
```json
{
  "donation_id": 1,
  "amount": 5000,
  "payment_method": "Card",
  "payment_status": "Succeeded"
}
```

**Update payment status:**
- **PUT** `/api/donations.php?action=update-status`
- **Body:** `{ donation_id, payment_status }`
- **Valid statuses:** `Pending, Succeeded, Processing, Failed, Refunded`

---

### Communications API

**Get all communications:**
- **GET** `/api/communications.php?action=list&page=1`

**Get single communication:**
- **GET** `/api/communications.php?action=get&id=1`

**Get recent communications:**
- **GET** `/api/communications.php?action=recent&limit=10`

**Get communications by donor:**
- **GET** `/api/communications.php?action=by-donor&donor_id=1`

**Create communication:**
- **POST** `/api/communications.php?action=create`
- **Body:**
```json
{
  "donor_id": 1,
  "type": "Email outreach",
  "content": "Followed up on campaign..."
}
```

**Update communication:**
- **PUT** `/api/communications.php?action=update`
- **Body:**
```json
{
  "communication_id": 1,
  "type": "Email outreach",
  "content": "Updated message...",
  "status": "Sent"
}
```

**Update communication status:**
- **PUT** `/api/communications.php?action=update-status`
- **Body:** `{ communication_id, status }`

**Delete communication:**
- **DELETE** `/api/communications.php?action=delete`
- **Body:** `{ communication_id }`

---

## Database Schema

### Users Table
```sql
user_id (PK)
first_name, last_name, email (UNIQUE)
password_hash
role (Admin, Staff)
status (Active, Inactive, Disabled)
created_at, updated_at
```

### Donors Table
```sql
donor_id (PK)
first_name, last_name, email, phone, address
donor_rank (Bronze, Silver, Gold, Platinum)
total_donated (auto-calculated)
status (Active, Pending, Inactive, Archived)
created_at, updated_at
```

### Campaigns Table
```sql
campaign_id (PK)
campaign_name, description
goal_amount, amount_raised (auto-calculated)
start_date, end_date
status (Planning, Live, Paused, Completed, Archived)
created_by (FK to users)
created_at, updated_at
```

### Donations Table
```sql
donation_id (PK)
donor_id (FK), campaign_id (FK)
amount, donation_date
payment_method (Card, Bank Transfer, PayPal, Check)
payment_status (Pending, Succeeded, Processing, Failed, Refunded)
created_at, updated_at
```

### Communications Table
```sql
communication_id (PK)
donor_id (FK), staff_id (FK)
type, content, status
created_at, updated_at
```

---

## Security Features

- ✅ Passwords hashed with bcrypt (password_hash/password_verify)
- ✅ PDO prepared statements (SQL injection protection)
- ✅ Session-based authentication
- ✅ Input validation and sanitization
- ✅ CSRF token generation (ready to implement in forms)
- ✅ Role-based access control
- ✅ Activity logging

---

## What's Completed

✅ Database schema with normalized tables
✅ User authentication system
✅ Session management
✅ All CRUD APIs
✅ Data models
✅ Helper functions
✅ Security measures (PDO, password hashing, session validation)
✅ Activity logging system
✅ Login/logout functionality

---

## What Remains to Be Done

The following need to be updated to use the new PHP APIs:

1. **Frontend Pages → PHP:**
   - Convert `index.html` → dynamic dashboard pulling from `/api/dashboard.php`
   - Convert `donors.html` → PHP page using `/api/donors.php`
   - Convert `campaigns.html` → PHP page using `/api/campaigns.php`
   - Convert `donations.html` → PHP page using `/api/donations.php`
   - Convert `communications.html` → PHP page using `/api/communications.php`
   - Convert `reports.html` → PHP page with analytics
   - Convert `donor-profile.html` → PHP detail page
   - Convert `campaign-detail.html` → PHP detail page

2. **JavaScript Updates:**
   - Update `assets/js/store.js` to use APIs instead of localStorage
   - Update `assets/js/charts.js` to pull data from `/api/donations.php?action=trend`
   - Update page scripts to make AJAX calls to APIs
   - Implement session checking before loading pages

3. **Frontend Templates:**
   - Create `includes/header.php` (navigation with logout)
   - Create `includes/footer.php`
   - Create wrapper for all pages

4. **User Management Page** (Admin only):
   - List staff members
   - Create/edit users
   - Manage roles and permissions

5. **Reports Page:**
   - Generate reports from database
   - Implement various report types
   - Export functionality

6. **Form Handling:**
   - Implement CSRF protection
   - Form submission handling
   - Error messages

---

## Testing the Setup

### 1. Test Database Connection:
```php
<?php
require_once 'config/database.php';
$pdo = getDB();
echo "Connected successfully!";
?>
```

### 2. Test Login:
- Navigate to `login.php`
- Use admin credentials
- Should redirect to dashboard

### 3. Test API:
```bash
curl -X GET "http://localhost/donortrack/api/dashboard.php" \
  -H "Content-Type: application/json"
```

---

## Troubleshooting

### "Connection refused" error:
- Check MySQL is running
- Verify database credentials in `config/database.php`
- Check database name matches

### "Access denied" error:
- Verify user permissions in MySQL
- Grant privileges: `GRANT ALL ON donortrack.* TO 'root'@'localhost';`

### Session issues:
- Check PHP session save path is writable
- Verify `session_start()` is called before any output

### CORS issues (if accessing from different domain):
- Add CORS headers to API responses
- Or ensure same-origin requests

---

## Next Steps

1. **Set up database** using the SQL schema
2. **Test login** with demo credentials
3. **Update frontend pages** to use APIs
4. **Implement form handling** for CRUD operations
5. **Add user management** interface
6. **Create reports** functionality

---

## Support

For API questions, refer to the endpoint documentation above.
For database structure questions, check the schema comments in `database.sql`.
For authentication issues, review `includes/auth.php`.

---

**Status:** Core backend complete | Frontend conversion in progress
