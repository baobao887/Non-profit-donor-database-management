<?php
/**
 * Session Check API
 * Returns current user info if authenticated
 */

require_once 'config/constants.php';
require_once 'config/database.php';
require_once 'includes/functions.php';
require_once 'includes/auth.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['authenticated' => false]));
}

$user = getCurrentUser();
if (!$user) {
    http_response_code(401);
    die(json_encode(['authenticated' => false]));
}

echo json_encode([
    'authenticated' => true,
    'user' => $user
]);
?>
