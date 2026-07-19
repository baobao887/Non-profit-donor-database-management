<?php
/**
 * Donors API
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';
require_once '../models/Donor.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

// All state-changing requests must carry a valid CSRF token (GET passes through)
requireApiCsrf();

try {
    $pdo = getDB();
    $donorModel = new Donor($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    // GET requests
    if ($method === 'GET') {
        if ($action === 'list') {
            $page = (int)($_GET['page'] ?? 1);
            $status = $_GET['status'] ?? null;
            // Optional capped page size so list pages and form dropdowns can
            // load the full dataset instead of silently seeing only page 1.
            $limit = min(1000, max(1, (int)($_GET['limit'] ?? ITEMS_PER_PAGE)));
            $donors = $donorModel->getAll($page, $limit, $status);
            $total = $donorModel->getTotalCount($status);

            echo json_encode([
                'donors' => $donors,
                'total' => $total,
                'page' => $page,
                'limit' => $limit
            ]);
        }
        elseif ($action === 'get' && isset($_GET['id'])) {
            $donor = $donorModel->getById((int)$_GET['id']);
            if ($donor) {
                echo json_encode($donor);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Donor not found']);
            }
        }
        elseif ($action === 'top') {
            $limit = (int)($_GET['limit'] ?? 5);
            $donors = $donorModel->getTopDonors($limit);
            echo json_encode($donors);
        }
        elseif ($action === 'search') {
            $query = $_GET['q'] ?? '';
            if (strlen($query) < 2) {
                echo json_encode(['error' => 'Search query too short']);
                exit;
            }
            $results = $donorModel->search($query);
            echo json_encode($results);
        }
        else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
    }
    // POST requests
    elseif ($method === 'POST') {
        if ($action === 'create') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $firstName = trim($data['first_name'] ?? '');
            $lastName = trim($data['last_name'] ?? '');
            $email = trim($data['email'] ?? '');
            $phone = trim($data['phone'] ?? '');
            $address = trim($data['address'] ?? '');
            $notes = trim($data['notes'] ?? '');

            // Validate
            if (empty($firstName) || empty($lastName)) {
                throw new Exception('First and last name are required');
            }

            if (!empty($email) && !validateEmail($email)) {
                throw new Exception('Invalid email format');
            }

            if (!empty($phone) && !validatePhone($phone)) {
                throw new Exception('Invalid phone format');
            }

            $donorId = $donorModel->create($firstName, $lastName, $email, $phone, $address, $notes);
            
            logActivity(getCurrentUserId(), 'create', "Created donor: $firstName $lastName", 'donor', $donorId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Donor created successfully',
                'donor_id' => $donorId
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
            $data = json_decode(file_get_contents('php://input'), true);
            $donorId = (int)($data['donor_id'] ?? 0);
            
            if (!$donorId) {
                throw new Exception('Donor ID required');
            }
            
            $donor = $donorModel->getById($donorId);
            if (!$donor) {
                http_response_code(404);
                throw new Exception('Donor not found');
            }
            
            $firstName = trim($data['first_name'] ?? $donor['first_name']);
            $lastName = trim($data['last_name'] ?? $donor['last_name']);
            $email = trim($data['email'] ?? $donor['email']);
            $phone = trim($data['phone'] ?? $donor['phone']);
            $address = trim($data['address'] ?? $donor['address']);
            $status = $data['status'] ?? $donor['status'];
            $notes = trim($data['notes'] ?? $donor['notes']);

            if (!empty($email) && !validateEmail($email)) {
                throw new Exception('Invalid email format');
            }

            if (!empty($phone) && !validatePhone($phone)) {
                throw new Exception('Invalid phone format');
            }

            if (!in_array($status, DONOR_STATUSES)) {
                throw new Exception('Invalid donor status');
            }

            $donorModel->update($donorId, $firstName, $lastName, $email, $phone, $address, $status, $notes);
            
            logActivity(getCurrentUserId(), 'update', "Updated donor: $firstName $lastName", 'donor', $donorId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Donor updated successfully'
            ]);
        }
        else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
    }
    // DELETE requests
    elseif ($method === 'DELETE') {
        if ($action === 'archive') {
            requireApiRole(ROLE_ADMIN);
            $data = json_decode(file_get_contents('php://input'), true);
            $donorId = (int)($data['donor_id'] ?? 0);
            
            if (!$donorId) {
                throw new Exception('Donor ID required');
            }
            
            $donor = $donorModel->getById($donorId);
            if (!$donor) {
                http_response_code(404);
                throw new Exception('Donor not found');
            }
            
            $donorModel->archive($donorId);
            
            logActivity(getCurrentUserId(), 'archive', "Archived donor: {$donor['first_name']} {$donor['last_name']}", 'donor', $donorId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Donor archived successfully'
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
    error_log('Donors API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'A server error occurred. Please try again.']);
} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(400);
    }
    echo json_encode(['error' => $e->getMessage()]);
}
?>
