<?php
/**
 * Maintenance API
 *
 * Admin-only, on-demand integrity tooling. Nothing here runs on a schedule —
 * an administrator triggers it when the denormalized aggregates are suspected
 * to have drifted from the donations table.
 */

require_once '../config/constants.php';
require_once '../config/database.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';
require_once '../models/Campaign.php';
require_once '../models/Donor.php';
require_once '../models/Maintenance.php';

header('Content-Type: application/json');

if (!checkSession()) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

// All state-changing requests must carry a valid CSRF token (GET passes through)
requireApiCsrf();

// This endpoint rewrites financial aggregates across every campaign and
// donor — Admin only, never Staff.
requireApiRole(ROLE_ADMIN);

try {
    $pdo = getDB();
    $maintenanceModel = new Maintenance($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    // POST only: this mutates data, so it must not be reachable by a plain
    // GET (which would also bypass the CSRF check above).
    if ($method === 'POST' && $action === 'recalculate') {
        $summary = $maintenanceModel->recalculateAllTotals();

        logActivity(
            getCurrentUserId(),
            'maintenance',
            "Recalculated totals: {$summary['campaigns_corrected']} campaign(s) and {$summary['donors_corrected']} donor(s) corrected",
            'maintenance',
            null
        );

        echo json_encode(array_merge(['success' => true], $summary));
    }
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    // Never leak raw SQL error details to the client
    error_log('Maintenance API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'A server error occurred. Please try again.']);
} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(400);
    }
    echo json_encode(['error' => $e->getMessage()]);
}
?>
