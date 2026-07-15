# DonorTrack - Non-Profit Donor Database Management System

A comprehensive web application for managing donors, campaigns, and donations for non-profit organizations.

**Status:** Complete ✅ — PHP/MySQL backend with all pages converted from the original static prototype

## Overview

DonorTrack is a web-based donor management system designed for non-profit organizations to centralize and manage donor-related information. The system replaces manual record-keeping (such as spreadsheets and paper records) with a structured relational database that allows staff and administrators to efficiently manage donors, donations, fundraising campaigns, communication history, and reports.

The primary goal of the system is to improve donor management, ensure financial transparency, reduce data redundancy, and provide organizations with accurate information for fundraising and decision-making.

Core Functionalities
1. User Authentication & Role-Based Access

The system requires users to log in securely using encrypted passwords. Access is role-based:

Administrators
Full access to all modules
Manage staff accounts
Manage campaigns
View reports
Manage donor information
Staff
Manage donors
Record donations
Log communications
Update records

Management personnel primarily use reporting features for monitoring and decision-making.

2. Donor Management

The system maintains a complete profile for every donor.

Each donor profile includes:

Personal information
Contact details
Registration date
Donor classification (Bronze, Silver, Gold)
Donation history
Communication history

Staff can:

Add new donors
Edit donor information
Delete donor records
View complete donor histories

The system also classifies donors based on their contribution level, allowing organizations to recognize high-value supporters.

3. Campaign Management

The organization can create multiple fundraising campaigns.

Each campaign stores:

Campaign name
Cause type
Start date
End date
Target fundraising amount
Current status

Administrators can:

Create campaigns
Update campaign details
Monitor campaign progress

The system compares the total donations received against the campaign target to measure campaign performance.

4. Donation Management

Every donation is recorded individually.

Each donation is linked to:

A donor
A campaign
A payment method

Donation records include:

Donation amount
Donation date
Payment method
Donation status (Completed/Pending)
Notes

Staff can:

Add donations
Update donation information
Correct mistakes
Track donation status

The system does not process payments—it only records donation information.

5. Payment Method Tracking

The system maintains a list of accepted payment methods.

For every donation, it records which payment method was used, allowing organizations to generate reports grouped by payment type.

6. Communication Log Management

The system keeps a history of every interaction between staff and donors.

Each communication record stores:

Communication type
Subject
Date
Status (Sent/Pending)
Notes
Responsible staff member

The system also displays the last communication date for each donor, helping staff determine who should receive acknowledgements, newsletters, or follow-up messages.

The system only records communications—it does not send emails or SMS.

7. Staff Management

Administrators manage organization staff.

Staff records include:

First name
Last name
Email
Role

Administrators can:

Add staff
Edit staff information
Assign roles and permissions
8. Financial Transparency & Reporting

The reporting module generates summaries that improve accountability.

Reports can summarize donations by:

Campaign
Payment method
Donor level

Campaign reports compare:

Total donations received
Target fundraising amount

These reports help management evaluate campaign performance and maintain transparency with donors and stakeholders.

Database Structure

The system uses a normalized relational database (Third Normal Form - 3NF) to minimize redundancy and maintain data consistency.

Major entities include:

Donors
Donations
Campaigns
Payment Methods
Staff
Communication Logs

These entities are connected through relationships so that each donation references a donor, campaign, and payment method while communication logs reference both donors and staff.

Security Features

The system includes:

Secure login authentication
Encrypted passwords (bcrypt)
Role-based authorization
Restricted access to sensitive information
Data validation to maintain integrity

Only authorized personnel can access the system.

Platform & Technology

The application is web-based and accessible through common web browsers.

Technology stack:

Frontend: PHP-rendered HTML, Tailwind CSS, vanilla JavaScript (ES modules)
Backend: PHP (PDO)
Database: MySQL

The interface is designed to be simple enough for non-technical staff while remaining responsive across desktops, laptops, and tablets.

System Limitations

The system intentionally excludes several advanced features:

No online payment processing
No email or SMS sending
No donor behavior analytics
No predictive reporting or AI features
Only authorized internal staff can use the system

Its focus is solely on managing donor information, donations, campaigns, payment methods, staff records, communication logs, and financial reporting.

Overall Summary

DonorTrack is a centralized web-based donor management platform that enables nonprofit organizations to manage donors, fundraising campaigns, donations, payment methods, staff, and communication records in one integrated system. It provides secure role-based access, maintains complete donor histories, tracks campaign performance, records communication activities, classifies donors by contribution level, and generates financial transparency reports. Rather than processing donations or sending communications, its primary purpose is to organize, manage, and report donor-related information accurately and efficiently while ensuring data integrity and accountability.