<?php
/**
 * Campaigns API
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';
require_once '../models/Campaign.php';
require_once '../models/Donation.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

try {
    $pdo = getDB();
    $campaignModel = new Campaign($pdo);
    $donationModel = new Donation($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    // GET requests
    if ($method === 'GET') {
        if ($action === 'list') {
            $page = (int)($_GET['page'] ?? 1);
            $status = $_GET['status'] ?? null;
            $campaigns = $campaignModel->getAll($page, ITEMS_PER_PAGE, $status);
            $total = $campaignModel->getTotalCount($status);
            
            // Add progress to each campaign
            $campaigns = array_map(function($c) {
                $c['progress'] = calculateCampaignProgress($c['amount_raised'], $c['goal_amount']);
                return $c;
            }, $campaigns);
            
            echo json_encode([
                'campaigns' => $campaigns,
                'total' => $total,
                'page' => $page,
                'limit' => ITEMS_PER_PAGE
            ]);
        }
        elseif ($action === 'get' && isset($_GET['id'])) {
            $campaign = $campaignModel->getById((int)$_GET['id']);
            if ($campaign) {
                $campaign['progress'] = calculateCampaignProgress($campaign['amount_raised'], $campaign['goal_amount']);
                $campaign['donations'] = $donationModel->getByCampaign($campaign['campaign_id']);
                echo json_encode($campaign);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Campaign not found']);
            }
        }
        elseif ($action === 'live') {
            $campaigns = $campaignModel->getLive();
            $campaigns = array_map(function($c) {
                $c['progress'] = calculateCampaignProgress($c['amount_raised'], $c['goal_amount']);
                return $c;
            }, $campaigns);
            echo json_encode($campaigns);
        }
        elseif ($action === 'needs-attention') {
            $campaigns = $campaignModel->getCampaignsNeedingAttention();
            $campaigns = array_map(function($c) {
                $c['progress'] = calculateCampaignProgress($c['amount_raised'], $c['goal_amount']);
                return $c;
            }, $campaigns);
            echo json_encode($campaigns);
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
            
            $campaignName = trim($data['campaign_name'] ?? '');
            $description = trim($data['description'] ?? '');
            $goalAmount = (float)($data['goal_amount'] ?? 0);
            $startDate = $data['start_date'] ?? null;
            $endDate = $data['end_date'] ?? null;

            if (empty($campaignName)) {
                throw new Exception('Campaign name is required');
            }

            if ($goalAmount <= 0) {
                throw new Exception('Goal amount must be greater than 0');
            }

            if (empty($startDate) || empty($endDate)) {
                throw new Exception('Start date and end date are required');
            }

            if (strtotime($endDate) < strtotime($startDate)) {
                throw new Exception('End date cannot be before start date');
            }

            $campaignId = $campaignModel->create($campaignName, $description, $goalAmount, $startDate, $endDate, getCurrentUserId());
            
            logActivity(getCurrentUserId(), 'create', "Created campaign: $campaignName", 'campaign', $campaignId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Campaign created successfully',
                'campaign_id' => $campaignId
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
            $campaignId = (int)($data['campaign_id'] ?? 0);
            
            if (!$campaignId) {
                throw new Exception('Campaign ID required');
            }
            
            $campaign = $campaignModel->getById($campaignId);
            if (!$campaign) {
                http_response_code(404);
                throw new Exception('Campaign not found');
            }
            
            $campaignName = trim($data['campaign_name'] ?? $campaign['campaign_name']);
            $description = trim($data['description'] ?? $campaign['description']);
            $goalAmount = (float)($data['goal_amount'] ?? $campaign['goal_amount']);
            $startDate = $data['start_date'] ?? $campaign['start_date'];
            $endDate = $data['end_date'] ?? $campaign['end_date'];
            $status = $data['status'] ?? $campaign['status'];

            if (empty($campaignName)) {
                throw new Exception('Campaign name is required');
            }

            if ($goalAmount <= 0) {
                throw new Exception('Goal amount must be greater than 0');
            }

            if (empty($startDate) || empty($endDate)) {
                throw new Exception('Start date and end date are required');
            }

            if (strtotime($endDate) < strtotime($startDate)) {
                throw new Exception('End date cannot be before start date');
            }

            if (!in_array($status, CAMPAIGN_STATUSES)) {
                throw new Exception('Invalid campaign status');
            }

            $campaignModel->update($campaignId, $campaignName, $description, $goalAmount, $startDate, $endDate, $status);
            
            logActivity(getCurrentUserId(), 'update', "Updated campaign: $campaignName", 'campaign', $campaignId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Campaign updated successfully'
            ]);
        }
        elseif ($action === 'update-status') {
            requireApiRole(ROLE_ADMIN);
            $data = json_decode(file_get_contents('php://input'), true);
            $campaignId = (int)($data['campaign_id'] ?? 0);
            $status = $data['status'] ?? null;
            
            if (!$campaignId || !$status) {
                throw new Exception('Campaign ID and status required');
            }
            
            if (!in_array($status, CAMPAIGN_STATUSES)) {
                throw new Exception('Invalid campaign status');
            }
            
            $campaign = $campaignModel->getById($campaignId);
            $campaignModel->updateStatus($campaignId, $status);
            
            logActivity(getCurrentUserId(), 'update', "Updated campaign status to: $status", 'campaign', $campaignId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Campaign status updated successfully'
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
            $campaignId = (int)($data['campaign_id'] ?? 0);

            if (!$campaignId) {
                throw new Exception('Campaign ID required');
            }

            $campaign = $campaignModel->getById($campaignId);
            if (!$campaign) {
                http_response_code(404);
                throw new Exception('Campaign not found');
            }

            $campaignModel->archive($campaignId);

            logActivity(getCurrentUserId(), 'archive', "Archived campaign: {$campaign['campaign_name']}", 'campaign', $campaignId);

            echo json_encode([
                'success' => true,
                'message' => 'Campaign archived successfully'
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
