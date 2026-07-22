<?php
/**
 * DonorTrack test suite — standalone CLI runner.
 *
 * This project has no Composer setup, so rather than introducing one just to
 * get a test runner, this is a dependency-free script covering the highest
 * value paths: authentication, the donation transaction (commit and rollback),
 * and the totals-recalculation maintenance tool.
 *
 *   One-time setup:  mysql -u root -e "CREATE DATABASE donortrack_test"
 *   Usage:           php tests/run-tests.php
 *
 * It runs against a SEPARATE database (donortrack_test by default) and resets
 * that database from database/database.sql before every run, so results are
 * deterministic and the development data is never touched. The guard below
 * refuses to run against the production database name outright.
 *
 * Override the target with the same environment variables the app itself
 * reads:  DB_NAME=some_other_test_db php tests/run-tests.php
 */

// ---------------------------------------------------------------------------
// Bootstrap — must happen before any output, because includes/auth.php starts
// a session at include time.
// ---------------------------------------------------------------------------

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    die('Tests are CLI-only.');
}

$testDb = getenv('DB_NAME') ?: 'donortrack_test';
if ($testDb === 'donortrack') {
    fwrite(STDERR, "Refusing to run: DB_NAME is 'donortrack', the development/production database.\n");
    fwrite(STDERR, "Tests destroy and recreate every table. Use a dedicated database, e.g. donortrack_test.\n");
    exit(1);
}
putenv("DB_NAME=$testDb");

$root = dirname(__DIR__);
require_once $root . '/config/constants.php';
require_once $root . '/config/database.php';
require_once $root . '/includes/functions.php';
require_once $root . '/includes/auth.php';
require_once $root . '/models/Campaign.php';
require_once $root . '/models/Donor.php';
require_once $root . '/models/Donation.php';
require_once $root . '/models/Communication.php';
require_once $root . '/models/User.php';
require_once $root . '/models/Maintenance.php';

// ---------------------------------------------------------------------------
// Minimal assertion harness
// ---------------------------------------------------------------------------

$GLOBALS['tests'] = ['passed' => 0, 'failed' => 0, 'failures' => []];

function ok($condition, $label) {
    if ($condition) {
        $GLOBALS['tests']['passed']++;
        echo "  \xE2\x9C\x93 $label\n";
    } else {
        $GLOBALS['tests']['failed']++;
        $GLOBALS['tests']['failures'][] = $label;
        echo "  \xE2\x9C\x97 $label\n";
    }
}

function equals($expected, $actual, $label) {
    $same = is_float($expected) || is_float($actual)
        ? abs((float)$expected - (float)$actual) < 0.001
        : $expected === $actual;
    ok($same, $same ? $label : "$label (expected " . var_export($expected, true) . ", got " . var_export($actual, true) . ")");
}

/** Assert that $fn throws, and return the exception message. */
function throws(callable $fn, $label) {
    try {
        $fn();
        ok(false, "$label (no exception thrown)");
        return null;
    } catch (Exception $e) {
        ok(true, $label);
        return $e->getMessage();
    }
}

function section($name) {
    echo "\n$name\n";
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Rebuild the test database from the canonical schema + seed data. */
function resetDatabase(PDO $pdo, $root) {
    $sql = file_get_contents($root . '/database/database.sql');
    if ($sql === false) {
        throw new Exception('Could not read database/database.sql');
    }
    $pdo->exec($sql);
}

$pdo = getDB();
echo "DonorTrack test suite\n";
echo "Database: $testDb\n";
resetDatabase($pdo, $root);
echo "Schema reset from database/database.sql\n";

// ---------------------------------------------------------------------------
// 1. authenticateUser()
// ---------------------------------------------------------------------------

section('authenticateUser()');

$result = authenticateUser('admin@donortrack.com', 'Admin@123');
ok($result['success'] === true, 'correct password authenticates');
ok(($result['user']['role'] ?? null) === 'Admin', 'returns the user row with its role');
ok(!isset($result['user']['password_hash']), 'password hash is stripped from the result');

$result = authenticateUser('admin@donortrack.com', 'wrong-password');
ok($result['success'] === false, 'wrong password is rejected');
equals('invalid', $result['error'], 'wrong password reports error "invalid"');

$result = authenticateUser('nobody@donortrack.com', 'Admin@123');
ok($result['success'] === false, 'unknown email is rejected');

// Clear the failure counter the wrong-password test just incremented.
$pdo->exec("UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = 'admin@donortrack.com'");

// An inactive account must not authenticate even with the right password.
$stmt = $pdo->prepare("
    INSERT INTO users (first_name, last_name, email, password_hash, role, status, created_at)
    VALUES ('Ina', 'Ctive', 'inactive@donortrack.com', ?, 'Staff', 'Inactive', NOW())
");
$stmt->execute([hashPassword('Test@1234')]);
$result = authenticateUser('inactive@donortrack.com', 'Test@1234');
ok($result['success'] === false, 'inactive account is rejected despite a correct password');

// A locked account must not authenticate even with the right password.
$pdo->exec("UPDATE users SET locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email = 'staff@donortrack.com'");
$result = authenticateUser('staff@donortrack.com', 'Staff@123');
ok($result['success'] === false, 'locked account is rejected despite a correct password');
equals('locked', $result['error'], 'locked account reports error "locked"');
$pdo->exec("UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE email = 'staff@donortrack.com'");

// The lockout actually trips after LOGIN_MAX_ATTEMPTS wrong passwords.
for ($i = 0; $i < LOGIN_MAX_ATTEMPTS; $i++) {
    $result = authenticateUser('staff@donortrack.com', 'nope');
}
equals('locked', $result['error'], 'account locks after ' . LOGIN_MAX_ATTEMPTS . ' failed attempts');
$result = authenticateUser('staff@donortrack.com', 'Staff@123');
ok($result['success'] === false, 'correct password still rejected while locked');
$pdo->exec("UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE email = 'staff@donortrack.com'");

// ---------------------------------------------------------------------------
// 2. Donation::create() — happy path commits donation + both aggregates
// ---------------------------------------------------------------------------

section('Donation::create() — commit');

$donationModel = new Donation($pdo);
$donorId = 1;
$liveCampaignId = 1; // 'Bayanihan School Kits 2026', status Live

$campaignBefore = (float)$pdo->query("SELECT amount_raised FROM campaigns WHERE campaign_id = $liveCampaignId")->fetch()['amount_raised'];
$donorBefore = (float)$pdo->query("SELECT total_donated FROM donors WHERE donor_id = $donorId")->fetch()['total_donated'];
$countBefore = (int)$pdo->query("SELECT COUNT(*) c FROM donations")->fetch()['c'];

$donationId = $donationModel->create($donorId, $liveCampaignId, 2500.00, date('Y-m-d'), 'Cash', 'Succeeded');

ok($donationId > 0, 'returns the new donation id');
equals($countBefore + 1, (int)$pdo->query("SELECT COUNT(*) c FROM donations")->fetch()['c'], 'donation row is inserted');

$row = $pdo->query("SELECT * FROM donations WHERE donation_id = $donationId")->fetch();
equals(2500.00, (float)$row['amount'], 'donation stores the correct amount');
equals('Cash', $row['payment_method'], 'donation stores the correct payment method');

$campaignAfter = (float)$pdo->query("SELECT amount_raised FROM campaigns WHERE campaign_id = $liveCampaignId")->fetch()['amount_raised'];
equals($campaignBefore + 2500.00, $campaignAfter, 'campaign amount_raised increases by the donation');

$donorAfter = $pdo->query("SELECT total_donated, donor_rank FROM donors WHERE donor_id = $donorId")->fetch();
equals($donorBefore + 2500.00, (float)$donorAfter['total_donated'], 'donor total_donated increases by the donation');
equals(getDonorRank($donorBefore + 2500.00), $donorAfter['donor_rank'], 'donor rank matches the new total');

// A Paused campaign is also allowed to accept donations.
$pausedCampaignId = 6; // 'Mobile Health Clinics', status Paused
$pausedId = $donationModel->create($donorId, $pausedCampaignId, 100.00, date('Y-m-d'), 'GCash', 'Succeeded');
ok($pausedId > 0, 'a Paused campaign still accepts donations');

// ---------------------------------------------------------------------------
// 3. Donation::create() — rollback leaves nothing behind
// ---------------------------------------------------------------------------

section('Donation::create() — rollback');

$planningCampaignId = 5; // 'Youth Coding Scholarships', status Planning

$countBefore = (int)$pdo->query("SELECT COUNT(*) c FROM donations")->fetch()['c'];
$campaignBefore = (float)$pdo->query("SELECT amount_raised FROM campaigns WHERE campaign_id = $planningCampaignId")->fetch()['amount_raised'];
$donorBefore = (float)$pdo->query("SELECT total_donated FROM donors WHERE donor_id = $donorId")->fetch()['total_donated'];

$message = throws(
    function () use ($donationModel, $donorId, $planningCampaignId) {
        $donationModel->create($donorId, $planningCampaignId, 9999.00, date('Y-m-d'), 'Cash', 'Succeeded');
    },
    'donation to a non-Live/Paused campaign throws'
);
ok(strpos((string)$message, 'Live or Paused') !== false, 'the error explains the campaign status rule');

equals($countBefore, (int)$pdo->query("SELECT COUNT(*) c FROM donations")->fetch()['c'], 'no donation row is left behind');
equals($campaignBefore, (float)$pdo->query("SELECT amount_raised FROM campaigns WHERE campaign_id = $planningCampaignId")->fetch()['amount_raised'], 'campaign amount_raised is unchanged');
equals($donorBefore, (float)$pdo->query("SELECT total_donated FROM donors WHERE donor_id = $donorId")->fetch()['total_donated'], 'donor total_donated is unchanged');
ok(!$pdo->inTransaction(), 'no transaction is left open after the rollback');

// ---------------------------------------------------------------------------
// 4. Maintenance::recalculateAllTotals()
// ---------------------------------------------------------------------------

section('Maintenance::recalculateAllTotals()');

$maintenance = new Maintenance($pdo);

// A healthy database should report nothing to fix...
$summary = $maintenance->recalculateAllTotals();
equals(0, $summary['total_corrected'], 'reports no corrections when the totals are already consistent');
ok($summary['campaigns_checked'] > 0 && $summary['donors_checked'] > 0, 'reports how many rows were checked');

// ...and should not disturb updated_at on rows it did not change, so a clean
// run cannot reshuffle lists that are ordered by updated_at.
$stampsBefore = $pdo->query("SELECT donor_id, updated_at FROM donors ORDER BY donor_id")->fetchAll();
$maintenance->recalculateAllTotals();
$stampsAfter = $pdo->query("SELECT donor_id, updated_at FROM donors ORDER BY donor_id")->fetchAll();
ok($stampsBefore === $stampsAfter, 'a clean run is a true no-op (updated_at untouched)');

// Deliberately corrupt both aggregates, the way a direct DB edit would.
$goodCampaign = $pdo->query("SELECT campaign_id, amount_raised FROM campaigns WHERE amount_raised > 0 ORDER BY campaign_id LIMIT 1")->fetch();
$goodDonor = $pdo->query("SELECT donor_id, total_donated, donor_rank FROM donors ORDER BY total_donated DESC LIMIT 1")->fetch();

$pdo->exec("UPDATE campaigns SET amount_raised = 1 WHERE campaign_id = {$goodCampaign['campaign_id']}");
$pdo->exec("UPDATE donors SET total_donated = 0, donor_rank = 'Bronze' WHERE donor_id = {$goodDonor['donor_id']}");

$summary = $maintenance->recalculateAllTotals();

equals(2, $summary['total_corrected'], 'detects exactly the two corrupted rows');
equals(1, $summary['campaigns_corrected'], 'counts the corrected campaign');
equals(1, $summary['donors_corrected'], 'counts the corrected donor');

$repairedCampaign = (float)$pdo->query("SELECT amount_raised FROM campaigns WHERE campaign_id = {$goodCampaign['campaign_id']}")->fetch()['amount_raised'];
equals((float)$goodCampaign['amount_raised'], $repairedCampaign, 'campaign amount_raised is restored');

$repairedDonor = $pdo->query("SELECT total_donated, donor_rank FROM donors WHERE donor_id = {$goodDonor['donor_id']}")->fetch();
equals((float)$goodDonor['total_donated'], (float)$repairedDonor['total_donated'], 'donor total_donated is restored');
equals($goodDonor['donor_rank'], $repairedDonor['donor_rank'], 'donor rank is recalculated from the restored total');

ok(!empty($summary['corrections']), 'returns a detail list of what it corrected');

// ---------------------------------------------------------------------------
// 5. Admin lockout guards (User::countActiveAdmins + staff directory)
// ---------------------------------------------------------------------------

section('Admin lockout guards');

$userModel = new User($pdo);

equals(1, $userModel->countActiveAdmins(), 'counts the seeded active admin');
equals(0, $userModel->countActiveAdmins(1), 'excluding the only admin leaves none — demotion must be blocked');

// With a second admin present, the first is no longer load-bearing.
$stmt = $pdo->prepare("
    INSERT INTO users (first_name, last_name, email, password_hash, role, status, created_at)
    VALUES ('Second', 'Admin', 'admin2@donortrack.com', ?, 'Admin', 'Active', NOW())
");
$stmt->execute([hashPassword('Test@1234')]);
equals(2, $userModel->countActiveAdmins(), 'counts both active admins');
equals(1, $userModel->countActiveAdmins(1), 'excluding one still leaves a spare — demotion is safe');

// An inactive admin does not count as cover for the last active one.
$pdo->exec("UPDATE users SET status = 'Inactive' WHERE email = 'admin2@donortrack.com'");
equals(1, $userModel->countActiveAdmins(), 'an Inactive admin is not counted');
equals(0, $userModel->countActiveAdmins(1), 'so the remaining admin is protected again');

// The staff directory must list deactivated accounts, or they can never be
// reactivated through the only UI that edits them.
$staff = $userModel->getStaff();
$emails = array_column($staff, 'email');
ok(in_array('admin2@donortrack.com', $emails, true), 'staff directory includes an Inactive account');
ok(in_array('inactive@donortrack.com', $emails, true), 'staff directory includes the Inactive staff member');
ok($staff[0]['status'] === USER_STATUS_ACTIVE, 'active accounts are listed first');

// ---------------------------------------------------------------------------
// 6. Communications search runs in SQL across every page
// ---------------------------------------------------------------------------

section('Communication search');

$commModel = new Communication($pdo);

$all = $commModel->countFiltered('');
ok($all > 0, 'counts all communications with no search term');
equals($all, count($commModel->getFiltered(1, 100, '')), 'unfiltered page returns every row');

// Pick a term from a record that is NOT on the first page of a small page size,
// which is exactly the case the old client-side filter got wrong.
$rows = $commModel->getFiltered(1, 100, '');
$lastRow = $rows[count($rows) - 1];
$needle = substr($lastRow['content'], 0, 20);

$matches = $commModel->getFiltered(1, 100, $needle);
ok(count($matches) >= 1, 'finds a record whose text sits on a later page');
equals(count($matches), $commModel->countFiltered($needle), 'count agrees with the returned rows');

// Searching by donor name must work too.
$donorRow = $pdo->query("
    SELECT d.first_name FROM communications c JOIN donors d ON c.donor_id = d.donor_id LIMIT 1
")->fetch();
ok($commModel->countFiltered($donorRow['first_name']) > 0, 'finds communications by donor name');
equals(0, $commModel->countFiltered('zzz-no-such-text-zzz'), 'a term with no matches returns nothing');

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

$t = $GLOBALS['tests'];
echo "\n" . str_repeat('-', 60) . "\n";
echo "{$t['passed']} passed, {$t['failed']} failed\n";
if ($t['failed'] > 0) {
    echo "\nFailures:\n";
    foreach ($t['failures'] as $f) {
        echo "  - $f\n";
    }
}
exit($t['failed'] > 0 ? 1 : 0);
