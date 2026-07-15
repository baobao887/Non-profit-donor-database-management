<?php
/**
 * Donations API
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';
require_once '../models/Donation.php';
require_once '../models/Campaign.php';
require_once '../models/Donor.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

try {
    $pdo = getDB();
    $donationModel = new Donation($pdo);
    $campaignModel = new Campaign($pdo);
    $donorModel = new Donor($pdo);
    
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? null;
    
    // GET requests
    if ($method === 'GET') {
        if ($action === 'list') {
            $page = (int)($_GET['page'] ?? 1);
            $donations = $donationModel->getAll($page, ITEMS_PER_PAGE);
            $total = $donationModel->getTotalCount();
            
            echo json_encode([
                'donations' => $donations,
                'total' => $total,
                'page' => $page,
                'limit' => ITEMS_PER_PAGE
            ]);
        }
        elseif ($action === 'get' && isset($_GET['id'])) {
            $donation = $donationModel->getById((int)$_GET['id']);
            if ($donation) {
                echo json_encode($donation);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Donation not found']);
            }
        }
        elseif ($action === 'recent') {
            $limit = (int)($_GET['limit'] ?? 10);
            $donations = $donationModel->getRecent($limit);
            echo json_encode($donations);
        }
        elseif ($action === 'by-donor' && isset($_GET['donor_id'])) {
            $donations = $donationModel->getByDonor((int)$_GET['donor_id']);
            echo json_encode($donations);
        }
        elseif ($action === 'by-campaign' && isset($_GET['campaign_id'])) {
            $donations = $donationModel->getByCampaign((int)$_GET['campaign_id']);
            echo json_encode($donations);
        }
        elseif ($action === 'trend') {
            $months = (int)($_GET['months'] ?? 6);
            $trend = $donationModel->getTrendByMonth($months);
            echo json_encode($trend);
        }
        elseif ($action === 'breakdown') {
            $breakdown = $donationModel->getBreakdownByCampaign();
            echo json_encode($breakdown);
        }
        elseif ($action === 'payment-breakdown') {
            $breakdown = $donationModel->getPaymentMethodBreakdown();
            echo json_encode($breakdown);
        }
        elseif ($action === 'weekday-revenue') {
            $revenue = $donationModel->getWeekdayRevenue();
            echo json_encode($revenue);
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
            $campaignId = (int)($data['campaign_id'] ?? 0);
            $amount = (float)($data['amount'] ?? 0);
            $donationDate = $data['donation_date'] ?? date(DATE_FORMAT);
            $paymentMethod = $data['payment_method'] ?? 'Card';
            
            if (!$donorId || !$campaignId) {
                throw new Exception('Donor ID and Campaign ID are required');
            }
            
            if ($amount <= 0) {
                throw new Exception('Amount must be greater than 0');
            }
            
            if (!in_array($paymentMethod, PAYMENT_METHODS)) {
                throw new Exception('Invalid payment method');
            }
            
            // Verify donor and campaign exist
            if (!$donorModel->getById($donorId)) {
                throw new Exception('Donor not found');
            }
            
            if (!$campaignModel->getById($campaignId)) {
                throw new Exception('Campaign not found');
            }
            
            $donationId = $donationModel->create($donorId, $campaignId, $amount, $donationDate, $paymentMethod);
            
            logActivity(getCurrentUserId(), 'create', "Created donation: $" . $amount . " from donor #$donorId", 'donation', $donationId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Donation recorded successfully',
                'donation_id' => $donationId
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
            $donationId = (int)($data['donation_id'] ?? 0);
            
            if (!$donationId) {
                throw new Exception('Donation ID required');
            }
            
            $donation = $donationModel->getById($donationId);
            if (!$donation) {
                http_response_code(404);
                throw new Exception('Donation not found');
            }
            
            $amount = (float)($data['amount'] ?? $donation['amount']);
            $paymentMethod = $data['payment_method'] ?? $donation['payment_method'];
            $paymentStatus = $data['payment_status'] ?? $donation['payment_status'];
            
            if ($amount <= 0) {
                throw new Exception('Amount must be greater than 0');
            }
            
            $donationModel->update($donationId, $amount, $paymentMethod, $paymentStatus);
            
            logActivity(getCurrentUserId(), 'update', "Updated donation #$donationId", 'donation', $donationId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Donation updated successfully'
            ]);
        }
        elseif ($action === 'update-status') {
            $data = json_decode(file_get_contents('php://input'), true);
            $donationId = (int)($data['donation_id'] ?? 0);
            $paymentStatus = $data['payment_status'] ?? null;
            
            if (!$donationId || !$paymentStatus) {
                throw new Exception('Donation ID and status required');
            }
            
            if (!in_array($paymentStatus, DONATION_STATUSES)) {
                throw new Exception('Invalid payment status');
            }
            
            $donationModel->updatePaymentStatus($donationId, $paymentStatus);
            
            logActivity(getCurrentUserId(), 'update', "Updated donation payment status to: $paymentStatus", 'donation', $donationId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Donation status updated successfully'
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
