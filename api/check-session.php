<?php
/**
 * Session Check API
 * Returns current user info if authenticated
 */

require_once __DIR__ . '/../config/paths.php';
require_once CONFIG_PATH . 'constants.php';
require_once CONFIG_PATH . 'database.php';
require_once INCLUDES_PATH . 'functions.php';
require_once INCLUDES_PATH . 'auth.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode([
        'authenticated' => false
    ]));
}

$user = getCurrentUser();

if (!$user) {
    http_response_code(401);
    die(json_encode([
        'authenticated' => false
    ]));
}

echo json_encode([
    'authenticated' => true,
    'user' => $user
]);
