<?php
/**
 * Login Handler
 * Processes login form submission
 */

require_once 'config/constants.php';
require_once 'config/database.php';
require_once 'includes/functions.php';
require_once 'includes/auth.php';
require_once 'models/User.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method not allowed']));
}

try {
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    // Validate input
    if (empty($email) || empty($password)) {
        http_response_code(400);
        die(json_encode(['error' => 'Email and password are required']));
    }
    
    // Authenticate user
    $user = authenticateUser($email, $password);
    
    if (!$user) {
        http_response_code(401);
        die(json_encode(['error' => 'Invalid email or password']));
    }
    
    // Check user status
    if ($user['status'] !== USER_STATUS_ACTIVE) {
        http_response_code(403);
        die(json_encode(['error' => 'User account is not active']));
    }
    
    // Login user
    loginUser($user);
    
    // Determine redirect page
    $redirect = 'index.php';
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'redirect' => $redirect
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred during login']);
}
?>
