<?php
/**
 * Path Configuration
 * Defines file system paths and URLs
 */

// Get the application root directory
$appRoot = dirname(__DIR__);

// Define file system paths (use __DIR__ from main entry point or this file)
if (!defined('APP_ROOT')) {
    define('APP_ROOT', $appRoot);
}

// File system paths
define('ROOT_PATH', APP_ROOT . '/');
define('CONFIG_PATH', APP_ROOT . '/config/');
define('ASSETS_PATH', APP_ROOT . '/assets/');
define('INCLUDES_PATH', APP_ROOT . '/includes/');
define('API_PATH', APP_ROOT . '/api/');
define('MODELS_PATH', APP_ROOT . '/models/');
define('CONTROLLERS_PATH', APP_ROOT . '/controllers/');
define('VIEWS_PATH', APP_ROOT . '/views/');
define('DATABASE_PATH', APP_ROOT . '/database/');
define('UPLOADS_PATH', APP_ROOT . '/uploads/');

// URL paths (for HTML asset references)
// These should be relative or absolute URLs based on how your server is configured
// Change these if your app is not at the root of the web server
define('BASE_URL', '/Non-profit-donor-database-management/');  // Change to your app's base URL if needed
define('ASSET_URL', BASE_URL . 'assets/');
define('API_URL', BASE_URL . 'api/');
define('VIEWS_URL', BASE_URL . 'views/');
?>
