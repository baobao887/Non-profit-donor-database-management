<?php
/**
 * Authentication Functions
 */

require_once __DIR__ . '/functions.php';

session_start();

/**
 * Check session validity
 */
function checkSession() {
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    // Check for session timeout
    if (isset($_SESSION['last_activity'])) {
        if (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT) {
            session_destroy();
            return false;
        }
    }
    
    $_SESSION['last_activity'] = time();
    return true;
}

/**
 * Require the current user to have an exact role, or redirect them away.
 * For PAGE routers (not API endpoints - those should use requireApiRole(),
 * which returns JSON instead of redirecting). Redirects to dashboard.php
 * rather than login.php since the user IS authenticated, just not
 * authorized to view this particular page.
 */
function requireRole($role) {
    requireAuth();
    if (($_SESSION['user']['role'] ?? null) !== $role) {
        redirect('dashboard.php');
    }
}

/**
 * Require the current user to have one of several roles, or redirect them
 * away. See requireRole() for the single-role case.
 */
function requireAnyRole($roles) {
    requireAuth();
    if (!in_array($_SESSION['user']['role'] ?? null, $roles, true)) {
        redirect('dashboard.php');
    }
}

/**
 * Login user
 */
function loginUser($user) {
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['user'] = [
        'user_id' => $user['user_id'],
        'first_name' => $user['first_name'],
        'last_name' => $user['last_name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'status' => $user['status']
    ];
    $_SESSION['last_activity'] = time();
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

/**
 * Logout user
 * Clears all session data, expires the session cookie, and destroys the
 * session server-side so it cannot be reused (e.g. via the back button).
 */
function logoutUser() {
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'], $params['secure'], $params['httponly']
        );
    }

    session_destroy();
}

/**
 * Authenticate user with email and password
 */
function authenticateUser($email, $password) {
    try {
        $pdo = getDB();
        $stmt = $pdo->prepare("
            SELECT user_id, first_name, last_name, email, password_hash, role, status
            FROM users
            WHERE email = ? AND status = ?
        ");
        $stmt->execute([$email, USER_STATUS_ACTIVE]);
        $user = $stmt->fetch();
        
        if ($user && verifyPassword($password, $user['password_hash'])) {
            return $user;
        }
        
        return false;
    } catch (PDOException $e) {
        error_log('Authentication error: ' . $e->getMessage());
        return false;
    }
}

/**
 * Create new user
 */
function createUser($firstName, $lastName, $email, $password, $role) {
    try {
        // Validate inputs
        if (empty($firstName) || empty($lastName) || empty($email) || empty($password)) {
            throw new Exception('All fields are required');
        }
        
        if (!validateEmail($email)) {
            throw new Exception('Invalid email format');
        }
        
        if (strlen($password) < 8) {
            throw new Exception('Password must be at least 8 characters');
        }
        
        // Check if email already exists
        $pdo = getDB();
        $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            throw new Exception('Email already exists');
        }
        
        // Create user
        $passwordHash = hashPassword($password);
        $stmt = $pdo->prepare("
            INSERT INTO users (first_name, last_name, email, password_hash, role, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $firstName,
            $lastName,
            $email,
            $passwordHash,
            $role,
            USER_STATUS_ACTIVE
        ]);
        
        return $pdo->lastInsertId();
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * Update user password
 */
function updateUserPassword($userId, $newPassword) {
    if (strlen($newPassword) < 8) {
        throw new Exception('Password must be at least 8 characters');
    }
    
    try {
        $pdo = getDB();
        $passwordHash = hashPassword($newPassword);
        $stmt = $pdo->prepare("
            UPDATE users
            SET password_hash = ?
            WHERE user_id = ?
        ");
        $stmt->execute([$passwordHash, $userId]);
        return true;
    } catch (Exception $e) {
        throw $e;
    }
}
?>
