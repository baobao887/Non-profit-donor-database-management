<?php
/**
 * Application Constants
 */

// Currency
define('CURRENCY_SYMBOL', '₱');
define('CURRENCY_CODE', 'PHP');

// User Roles
define('ROLE_ADMIN', 'Admin');
define('ROLE_STAFF', 'Staff');

// User Status
define('USER_STATUS_ACTIVE', 'Active');
define('USER_STATUS_INACTIVE', 'Inactive');
define('USER_STATUS_DISABLED', 'Disabled');

// Donor Status
define('DONOR_STATUS_ACTIVE', 'Active');
define('DONOR_STATUS_INACTIVE', 'Inactive');
define('DONOR_STATUS_ARCHIVED', 'Archived');

// Donor Ranks
define('DONOR_RANKS', ['Bronze', 'Silver', 'Gold', 'Platinum']);

// Campaign Status
define('CAMPAIGN_STATUS_PLANNING', 'Planning');
define('CAMPAIGN_STATUS_LIVE', 'Live');
define('CAMPAIGN_STATUS_PAUSED', 'Paused');
define('CAMPAIGN_STATUS_COMPLETED', 'Completed');
define('CAMPAIGN_STATUS_ARCHIVED', 'Archived');

define('CAMPAIGN_STATUSES', [
    'Planning',
    'Live',
    'Paused',
    'Completed',
    'Archived'
]);

// Donation Status
define('DONATION_STATUS_PENDING', 'Pending');
define('DONATION_STATUS_SUCCEEDED', 'Succeeded');
define('DONATION_STATUS_PROCESSING', 'Processing');
define('DONATION_STATUS_FAILED', 'Failed');
define('DONATION_STATUS_REFUNDED', 'Refunded');

define('DONATION_STATUSES', [
    'Pending',
    'Succeeded',
    'Processing',
    'Failed',
    'Refunded'
]);

// Payment Methods
define('PAYMENT_METHODS', [
    'Card',
    'Bank Transfer',
    'PayPal',
    'Check'
]);

// Session timeout (in seconds)
define('SESSION_TIMEOUT', 1800); // 30 minutes

// Pagination
define('ITEMS_PER_PAGE', 20);

// Date formats
define('DATE_FORMAT', 'Y-m-d');
define('DATETIME_FORMAT', 'Y-m-d H:i:s');
?>
