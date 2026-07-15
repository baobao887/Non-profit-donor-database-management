<?php
/**
 * DonorTrack Application Entry Point
 * Redirects to dashboard
 */

require_once __DIR__ . '/config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

// Check if user is authenticated
if (!checkSession()) {
    header('Location: login.php');
    exit;
}

// Redirect to dashboard
header('Location: dashboard.php');
exit;
