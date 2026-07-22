<?php
/**
 * Staff API
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';
require_once '../models/User.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

// All state-changing requests must carry a valid CSRF token (GET passes through)
requireApiCsrf();

try {
    $pdo = getDB();
    $userModel = new User($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;

    // GET requests
    if ($method === 'GET') {
        // Staff cannot access user management at all, not even read-only -
        // gate the whole endpoint here rather than per-action below.
        requireApiRole(ROLE_ADMIN);

        if ($action === 'list') {
            $staff = $userModel->getStaff();
            echo json_encode(['staff' => $staff]);
        }
        elseif ($action === 'get' && isset($_GET['id'])) {
            $user = $userModel->getById((int)$_GET['id']);
            if ($user) {
                echo json_encode($user);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Staff member not found']);
            }
        }
        else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
    }
    // POST requests
    elseif ($method === 'POST') {
        if ($action === 'create') {
            requireApiRole(ROLE_ADMIN);
            $data = json_decode(file_get_contents('php://input'), true);

            $firstName = trim($data['first_name'] ?? '');
            $lastName = trim($data['last_name'] ?? '');
            $email = trim($data['email'] ?? '');
            $role = trim($data['role'] ?? '');

            if (empty($firstName) || empty($lastName)) {
                throw new Exception('First and last name are required');
            }

            if (empty($email) || !validateEmail($email)) {
                throw new Exception('A valid email is required');
            }

            if (!in_array($role, [ROLE_ADMIN, ROLE_STAFF])) {
                throw new Exception('Role must be "Admin" or "Staff"');
            }

            // The staff form doesn't collect a password — generate a random
            // temporary one; the account holder should reset it on first login.
            $tempPassword = bin2hex(random_bytes(8));
            $passwordHash = hashPassword($tempPassword);

            $userId = $userModel->create($firstName, $lastName, $email, $passwordHash, $role);

            logActivity(getCurrentUserId(), 'create', "Added staff member: $firstName $lastName", 'user', $userId);

            echo json_encode([
                'success' => true,
                'message' => 'Staff member added successfully',
                'user_id' => $userId,
                'temp_password' => $tempPassword
            ]);
        }
        else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
    }
    // PUT requests
    elseif ($method === 'PUT') {
        if ($action === 'update') {
            requireApiRole(ROLE_ADMIN);
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = (int)($data['user_id'] ?? 0);

            if (!$userId) {
                throw new Exception('Staff ID required');
            }

            $user = $userModel->getById($userId);
            if (!$user) {
                http_response_code(404);
                throw new Exception('Staff member not found');
            }

            $firstName = trim($data['first_name'] ?? $user['first_name']);
            $lastName = trim($data['last_name'] ?? $user['last_name']);
            $email = trim($data['email'] ?? $user['email']);
            $role = trim($data['role'] ?? $user['role']);
            $status = $data['status'] ?? $user['status'];

            if (empty($firstName) || empty($lastName)) {
                throw new Exception('First and last name are required');
            }

            if (empty($email) || !validateEmail($email)) {
                throw new Exception('A valid email is required');
            }

            if (!in_array($role, [ROLE_ADMIN, ROLE_STAFF])) {
                throw new Exception('Role must be "Admin" or "Staff"');
            }

            // Validate before hitting the ENUM column, so a bad value reads as
            // a validation error rather than a generic 500 from STRICT mode.
            if (!in_array($status, USER_STATUSES)) {
                throw new Exception('Invalid status');
            }

            $isSelf = $userId === (int)getCurrentUserId();
            $losesAdmin = $user['role'] === ROLE_ADMIN
                && ($role !== ROLE_ADMIN || $status !== USER_STATUS_ACTIVE);

            // You cannot strip your own admin access - the UI you'd need to
            // undo it is itself Admin-gated.
            if ($isSelf && $losesAdmin) {
                throw new Exception('You cannot remove your own admin access');
            }

            // Nor can the last remaining administrator be demoted or
            // deactivated by anyone, which would lock everyone out of Staff,
            // Campaigns and Reports for good.
            if ($losesAdmin && $userModel->countActiveAdmins($userId) === 0) {
                throw new Exception('This is the only active administrator - promote another admin first');
            }

            $userModel->update($userId, $firstName, $lastName, $email, $role, $status);

            logActivity(getCurrentUserId(), 'update', "Updated staff member: $firstName $lastName", 'user', $userId);

            echo json_encode([
                'success' => true,
                'message' => 'Staff member updated successfully'
            ]);
        }
        else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
    }
    // DELETE requests
    elseif ($method === 'DELETE') {
        if ($action === 'delete') {
            requireApiRole(ROLE_ADMIN);
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = (int)($data['user_id'] ?? 0);

            if (!$userId) {
                throw new Exception('Staff ID required');
            }

            $user = $userModel->getById($userId);
            if (!$user) {
                http_response_code(404);
                throw new Exception('Staff member not found');
            }

            if ($userId === (int)getCurrentUserId()) {
                throw new Exception('You cannot remove your own account');
            }

            // Deleting the last active administrator is unrecoverable through
            // the UI, since every admin screen is Admin-gated.
            if ($user['role'] === ROLE_ADMIN && $userModel->countActiveAdmins($userId) === 0) {
                throw new Exception('This is the only active administrator - promote another admin first');
            }

            $userModel->delete($userId);

            logActivity(getCurrentUserId(), 'delete', "Removed staff member: {$user['first_name']} {$user['last_name']}", 'user', $userId);

            echo json_encode([
                'success' => true,
                'message' => 'Staff member removed successfully'
            ]);
        }
        else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
    }
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    // Never leak raw SQL error details to the client
    error_log('Staff API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'A server error occurred. Please try again.']);
} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(400);
    }
    echo json_encode(['error' => $e->getMessage()]);
}
?>
