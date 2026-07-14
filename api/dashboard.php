<?php
/**
 * Dashboard Statistics API
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';
require_once '../models/Donor.php';
require_once '../models/Campaign.php';
require_once '../models/Donation.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

try {
    $pdo = getDB();
    $donorModel = new Donor($pdo);
    $campaignModel = new Campaign($pdo);
    $donationModel = new Donation($pdo);
    
    // Get statistics
    $stats = [
        'totalDonors' => $donorModel->getActiveCount(),
        'totalDonations' => $donationModel->getTotalAmount('Succeeded'),
        'campaignCount' => $campaignModel->getTotalCount(),
        'activeCampaigns' => $campaignModel->getLiveCount(),
        'topDonors' => $donorModel->getTopDonors(3),
        'recentDonations' => $donationModel->getRecent(5),
        'campaignsNeedingAttention' => $campaignModel->getCampaignsNeedingAttention(2)
    ];
    
    echo json_encode($stats);
    
} catch (Exception $e) {
    error_log('Dashboard API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to retrieve dashboard data']);
}
?>
