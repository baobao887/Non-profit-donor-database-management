<?php
// Root router for Staff
require_once __DIR__ . '/config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Staff';
$currentPage = 'staff.php';
$assetPath = ASSET_URL;

if (!checkSession()) {
    header('Location: login.php');
    exit;
}

requireRole(ROLE_ADMIN);

require_once VIEWS_PATH . 'staff/index.php';
