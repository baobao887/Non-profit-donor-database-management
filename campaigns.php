<?php
// Root router for Campaigns
require_once __DIR__ . '/config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'auth.php';

$pageTitle = 'DonorTrack | Campaigns';
$currentPage = 'campaigns.php';
$assetPath = ASSET_URL;

if (!checkSession()) {
    header('Location: login.php');
    exit;
}

require_once VIEWS_PATH . 'campaigns/index.php';
