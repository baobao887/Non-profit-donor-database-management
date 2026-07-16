<?php
/**
 * Common Helper Functions
 */

/**
 * Format currency value to Philippine Peso
 */
function formatCurrency($amount) {
    return CURRENCY_SYMBOL . number_format($amount, 2);
}

/**
 * Format date
 */
function formatDate($date, $format = 'M d, Y') {
    if (empty($date)) return '—';
    try {
        $datetime = new DateTime($date);
        return $datetime->format($format);
    } catch (Exception $e) {
        return '—';
    }
}

/**
 * Sanitize output for HTML
 */
function sanitize($str) {
    if (is_array($str)) {
        return array_map('sanitize', $str);
    }
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone (basic)
 */
function validatePhone($phone) {
    $phone = preg_replace('/[^0-9+\- ]/', '', $phone);
    return strlen($phone) >= 10;
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Generate random string
 */
function generateRandomString($length = 32) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Get donor rank based on total donations
 */
function getDonorRank($totalDonated) {
    if ($totalDonated >= 50000) return 'Platinum';
    if ($totalDonated >= 20000) return 'Gold';
    if ($totalDonated >= 5000) return 'Silver';
    return 'Bronze';
}

/**
 * Calculate campaign progress percentage
 */
function calculateCampaignProgress($raised, $goal) {
    if ($goal <= 0) return 0;
    return min(100, round(($raised / $goal) * 100, 2));
}

/**
 * Send JSON response
 */
function jsonResponse($data = null, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data ?? []);
    exit;
}

/**
 * Send error response
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

/**
 * Send success response
 */
function successResponse($message = 'Success', $data = null) {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    jsonResponse($response, 200);
}

/**
 * Redirect to page
 */
function redirect($path) {
    header('Location: ' . $path);
    exit;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current user
 */
function getCurrentUser() {
    return isset($_SESSION['user']) ? $_SESSION['user'] : null;
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
}

/**
 * Check if user is admin
 */
function isAdmin() {
    return isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === ROLE_ADMIN;
}

/**
 * Check if user is staff
 */
function isStaff() {
    return isset($_SESSION['user']['role']) && ($_SESSION['user']['role'] === ROLE_STAFF || $_SESSION['user']['role'] === ROLE_ADMIN);
}

/**
 * Require authentication
 */
function requireAuth() {
    if (!isAuthenticated()) {
        redirect('login.php');
    }
}

/**
 * Require the current user to have an exact role for an API endpoint.
 * Unlike requireRole()/requireAnyRole() in includes/auth.php (which
 * redirect, for page routers), this returns JSON + 403 - API responses
 * must stay JSON for the frontend's fetch()-based error handling to work,
 * and this must never be bypassable via a direct API call.
 */
function requireApiRole($role) {
    if (!isAuthenticated() || ($_SESSION['user']['role'] ?? null) !== $role) {
        errorResponse('Access denied', 403);
    }
}

/**
 * Get initials from name
 */
function getInitials($name) {
    $parts = explode(' ', trim($name));
    $initials = '';
    foreach ($parts as $part) {
        $initials .= strtoupper(substr($part, 0, 1));
    }
    return substr($initials, 0, 2);
}

/**
 * Get avatar color class based on string
 */
function getAvatarClass($name) {
    $colors = ['bg-sky-100', 'bg-emerald-100', 'bg-violet-100', 'bg-amber-100', 'bg-pink-100', 'bg-indigo-100'];
    $hash = abs(crc32($name));
    return $colors[$hash % count($colors)];
}

/**
 * Get status badge class
 */
function getStatusBadgeClass($status) {
    $classes = [
        'Succeeded' => 'badge-success',
        'Pending' => 'badge-warning',
        'Processing' => 'badge-info',
        'Failed' => 'badge-danger',
        'Refunded' => 'badge-danger',
        'Active' => 'badge-success',
        'Inactive' => 'badge-secondary',
        'Archived' => 'badge-secondary',
        'Planning' => 'badge-secondary',
        'Live' => 'badge-success',
        'Paused' => 'badge-warning',
        'Completed' => 'badge-info',
    ];
    return $classes[$status] ?? 'badge-secondary';
}

/**
 * Validate form CSRF token
 */
function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Log activity
 */
function logActivity($userId, $action, $description, $entityType = null, $entityId = null) {
    try {
        $pdo = getDB();
        $stmt = $pdo->prepare("
            INSERT INTO activity_log (user_id, action, description, entity_type, entity_id, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $action, $description, $entityType, $entityId]);
    } catch (Exception $e) {
        // Silently fail activity logging
        error_log('Activity logging failed: ' . $e->getMessage());
    }
}
?>
