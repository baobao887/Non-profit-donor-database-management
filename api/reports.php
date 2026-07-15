<?php
/**
 * Reports API
 * Aggregate analytics for the Reports page — every figure here is computed
 * from live data in campaigns/donations/donors, nothing is hardcoded.
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';
require_once '../models/Campaign.php';
require_once '../models/Donation.php';
require_once '../models/Donor.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

try {
    $pdo = getDB();
    $campaignModel = new Campaign($pdo);
    $donationModel = new Donation($pdo);
    $donorModel = new Donor($pdo);

    $topCampaign = $campaignModel->getTopByRaised();
    $aggregate = $campaignModel->getAggregateStats();
    $totalGoal = (float)($aggregate['total_goal'] ?? 0);
    $totalRaised = (float)($aggregate['total_raised'] ?? 0);

    echo json_encode([
        'topCampaign' => $topCampaign ?: null,
        'avgRaised' => round((float)($aggregate['avg_raised'] ?? 0), 2),
        'conversionPct' => $totalGoal > 0 ? round(($totalRaised / $totalGoal) * 100) : 0,
        'donationTrend' => $donationModel->getTrendByMonth(6),
        'campaignBreakdown' => $donationModel->getBreakdownByCampaign(),
        'paymentBreakdown' => $donationModel->getPaymentMethodBreakdown(),
        'weekdayActivity' => $donationModel->getWeekdayRevenue(),
        'donorRankBreakdown' => $donorModel->getRankBreakdown(),
    ]);

} catch (Exception $e) {
    error_log('Reports API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to retrieve report data']);
}
?>
