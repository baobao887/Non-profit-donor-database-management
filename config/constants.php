<?php
/**
 * Application Constants
 *
 * This is the first file required by every entry point (api/*.php, the root
 * routers, login-handler.php), so the environment/error-handling bootstrap
 * below runs before any application code.
 */

/**
 * Application environment: 'development' (default) or 'production'.
 * Set APP_ENV in the server environment on a live deployment — e.g. Apache
 * `SetEnv APP_ENV production` in the vhost, or the container/systemd env.
 */
define('APP_ENV', getenv('APP_ENV') ?: 'development');

if (APP_ENV === 'production') {
    // Never render PHP errors into the response. Messages carry absolute file
    // paths, SQL fragments and stack traces — information disclosure that also
    // corrupts the JSON body of api/* responses. Log them server-side instead.
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    ini_set('log_errors', '1');

    $logDir = dirname(__DIR__) . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0775, true);
    }
    // Fall back to the SAPI log (Apache error_log) if the directory could not
    // be created, rather than dropping errors on the floor entirely.
    if (is_dir($logDir) && is_writable($logDir)) {
        ini_set('error_log', $logDir . '/php-error.log');
    }
} else {
    // Local development: surface everything immediately (XAMPP's usual behavior).
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
}

error_reporting(E_ALL);

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

define('USER_STATUSES', [
    'Active',
    'Inactive',
    'Disabled'
]);

// Donor Status
define('DONOR_STATUS_ACTIVE', 'Active');
define('DONOR_STATUS_INACTIVE', 'Inactive');
define('DONOR_STATUS_ARCHIVED', 'Archived');

// Donor Ranks
define('DONOR_RANKS', ['Bronze', 'Silver', 'Gold', 'Platinum']);

define('DONOR_STATUSES', [
    'Active',
    'Inactive',
    'Archived'
]);

// Donor demographics — OPTIONAL fields collected for aggregate analytics only,
// consistent with data minimization. Never required to process a donation.
define('DONOR_GENDERS', [
    'Male',
    'Female',
    'Prefer not to say'
]);

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
    'Cash',
    'GCash',
    'Card',
    'Bank Transfer',
    'PayPal',
    'Check'
]);

// Communication Status
define('COMMUNICATION_STATUSES', [
    'Draft',
    'Sent',
    'In review',
    'Pending',
    'Completed'
]);

// Communication Types
define('COMMUNICATION_TYPES', [
    'Email outreach',
    'Call logged',
    'Meeting note',
    'Thank you',
    'Other'
]);

// Session timeout (in seconds)
define('SESSION_TIMEOUT', 1800); // 30 minutes

// Login rate limiting
define('LOGIN_MAX_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_MINUTES', 15);

// Pagination
define('ITEMS_PER_PAGE', 20);

// Date formats
define('DATE_FORMAT', 'Y-m-d');
define('DATETIME_FORMAT', 'Y-m-d H:i:s');
?>
