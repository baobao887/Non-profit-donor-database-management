<?php
// Root router for Login

require_once __DIR__ . '/config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Sign In';
$currentPage = 'login.php';
$assetPath = ASSET_URL;

// Redirect authenticated users
if (checkSession()) {
    header('Location: dashboard.php');
    exit;
}

// Load the login view
require_once VIEWS_PATH . 'auth/login.php';