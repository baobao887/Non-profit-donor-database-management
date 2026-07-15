<?php
/**
 * Communications API
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';
require_once '../models/Communication.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

try {
    $pdo = getDB();
    $communicationModel = new Communication($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    // GET requests
    if ($method === 'GET') {
        if ($action === 'list') {
            $page = (int)($_GET['page'] ?? 1);
            $communications = $communicationModel->getAll($page, ITEMS_PER_PAGE);
            $total = $communicationModel->getTotalCount();
            
            echo json_encode([
                'communications' => $communications,
                'total' => $total,
                'page' => $page,
                'limit' => ITEMS_PER_PAGE
            ]);
        }
        elseif ($action === 'get' && isset($_GET['id'])) {
            $communication = $communicationModel->getById((int)$_GET['id']);
            if ($communication) {
                echo json_encode($communication);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Communication not found']);
            }
        }
        elseif ($action === 'recent') {
            $limit = (int)($_GET['limit'] ?? 10);
            $communications = $communicationModel->getRecent($limit);
            echo json_encode($communications);
        }
        elseif ($action === 'by-donor' && isset($_GET['donor_id'])) {
            $communications = $communicationModel->getByDonor((int)$_GET['donor_id']);
            echo json_encode($communications);
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
            
            $donorId = (int)($data['donor_id'] ?? 0);
            $type = $data['type'] ?? 'Email outreach';
            $content = trim($data['content'] ?? '');
            $staffId = (int)($_SESSION['user_id'] ?? 0);
            
            if (!$donorId) {
                throw new Exception('Donor ID is required');
            }
            
            if (empty($content)) {
                throw new Exception('Content is required');
            }
            
            $communicationId = $communicationModel->create($donorId, $type, $content, $staffId);
            
            logActivity(getCurrentUserId(), 'create', "Created communication for donor #$donorId", 'communication', $communicationId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Communication created successfully',
                'communication_id' => $communicationId
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
            $communicationId = (int)($data['communication_id'] ?? 0);
            
            if (!$communicationId) {
                throw new Exception('Communication ID required');
            }
            
            $communication = $communicationModel->getById($communicationId);
            if (!$communication) {
                http_response_code(404);
                throw new Exception('Communication not found');
            }
            
            $type = $data['type'] ?? $communication['type'];
            $content = trim($data['content'] ?? $communication['content']);
            $status = $data['status'] ?? $communication['status'];
            $staffId = $communication['staff_id'];
            
            if (empty($content)) {
                throw new Exception('Content is required');
            }
            
            $communicationModel->update($communicationId, $type, $content, $status, $staffId);
            
            logActivity(getCurrentUserId(), 'update', "Updated communication #$communicationId", 'communication', $communicationId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Communication updated successfully'
            ]);
        }
        elseif ($action === 'update-status') {
            $data = json_decode(file_get_contents('php://input'), true);
            $communicationId = (int)($data['communication_id'] ?? 0);
            $status = $data['status'] ?? null;
            
            if (!$communicationId || !$status) {
                throw new Exception('Communication ID and status required');
            }
            
            $communicationModel->updateStatus($communicationId, $status);
            
            logActivity(getCurrentUserId(), 'update', "Updated communication status to: $status", 'communication', $communicationId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Communication status updated successfully'
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
            $data = json_decode(file_get_contents('php://input'), true);
            $communicationId = (int)($data['communication_id'] ?? 0);
            
            if (!$communicationId) {
                throw new Exception('Communication ID required');
            }
            
            $communication = $communicationModel->getById($communicationId);
            if (!$communication) {
                http_response_code(404);
                throw new Exception('Communication not found');
            }
            
            $communicationModel->delete($communicationId);
            
            logActivity(getCurrentUserId(), 'delete', "Deleted communication #$communicationId", 'communication', $communicationId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Communication deleted successfully'
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
