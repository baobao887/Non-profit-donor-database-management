<?php
/**
 * Account API — self-service actions for the currently logged-in user.
 * Deliberately NOT admin-gated: every authenticated user manages their
 * own account here. All actions must operate on getCurrentUserId() only;
 * a user_id from the request body must never be honored, or any staff
 * member could take over any other account.
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

try {
    $pdo = getDB();

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;

    if ($method === 'POST') {
        if ($action === 'change-password') {
            $data = json_decode(file_get_contents('php://input'), true);

            $currentPassword = $data['current_password'] ?? '';
            $newPassword = $data['new_password'] ?? '';
            $confirmPassword = $data['confirm_password'] ?? '';

            if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
                throw new Exception('All fields are required');
            }

            if ($newPassword !== $confirmPassword) {
                throw new Exception('New password and confirmation do not match');
            }

            if (strlen($newPassword) < 8) {
                throw new Exception('New password must be at least 8 characters');
            }

            $userId = getCurrentUserId();

            $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE user_id = ?");
            $stmt->execute([$userId]);
            $row = $stmt->fetch();

            if (!$row || !verifyPassword($currentPassword, $row['password_hash'])) {
                throw new Exception('Current password is incorrect');
            }

            // Validates length again, hashes, and updates the users row.
            updateUserPassword($userId, $newPassword);

            logActivity($userId, 'update', 'Changed own password', 'user', $userId);

            echo json_encode([
                'success' => true,
                'message' => 'Password updated successfully'
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

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
