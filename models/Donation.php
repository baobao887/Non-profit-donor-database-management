<?php
/**
 * Donation Model
 */

class Donation {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Get donation by ID
     */
    public function getById($donationId) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM donations WHERE donation_id = ?
        ");
        $stmt->execute([$donationId]);
        return $stmt->fetch();
    }
    
    /**
     * Get all donations
     */
    public function getAll($page = 1, $limit = ITEMS_PER_PAGE) {
        $offset = ($page - 1) * $limit;
        $stmt = $this->pdo->prepare("
            SELECT * FROM donations
            ORDER BY donation_date DESC, created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * Build the shared WHERE clause + bound params for the filtered list/count
     * below. Search matches donor name or campaign name; status is an optional
     * exact match. All terms are parameterized.
     */
    private function buildFilters($search, $status) {
        $clauses = [];
        $params = [];

        if ($search !== null && $search !== '') {
            $like = '%' . $search . '%';
            $clauses[] = "(do.first_name LIKE ? OR do.last_name LIKE ? OR CONCAT(do.first_name, ' ', do.last_name) LIKE ? OR c.campaign_name LIKE ?)";
            array_push($params, $like, $like, $like, $like);
        }
        if ($status !== null && $status !== '' && $status !== 'all') {
            $clauses[] = "d.payment_status = ?";
            $params[] = $status;
        }

        $where = $clauses ? ('WHERE ' . implode(' AND ', $clauses)) : '';
        return [$where, $params];
    }

    /**
     * Paginated donations with search + status filter. Joins donor and
     * campaign names into each row so the list renders without bulk-loading
     * the full donor/campaign tables client-side.
     */
    public function getFiltered($page, $limit, $search = '', $status = null) {
        $offset = ($page - 1) * $limit;
        [$where, $params] = $this->buildFilters($search, $status);
        $sql = "
            SELECT d.*, do.first_name, do.last_name, c.campaign_name
            FROM donations d
            JOIN donors do ON d.donor_id = do.donor_id
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            $where
            ORDER BY d.donation_date DESC, d.created_at DESC
            LIMIT ? OFFSET ?
        ";
        $params[] = (int)$limit;
        $params[] = (int)$offset;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Total rows matching the same filters, for "Page X of Y" display.
     */
    public function countFiltered($search = '', $status = null) {
        [$where, $params] = $this->buildFilters($search, $status);
        $sql = "
            SELECT COUNT(*) AS count
            FROM donations d
            JOIN donors do ON d.donor_id = do.donor_id
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            $where
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return (int)$row['count'];
    }

    /**
     * Header-card stats (revenue, average gift, refund rate) computed
     * server-side so they stay correct once the list is paginated.
     */
    public function getStats() {
        $stmt = $this->pdo->query("
            SELECT
                COALESCE(SUM(CASE WHEN payment_status = 'Succeeded' THEN amount END), 0) AS revenue,
                COUNT(CASE WHEN payment_status = 'Succeeded' THEN 1 END) AS succeeded_count,
                COUNT(CASE WHEN payment_status = 'Refunded' THEN 1 END) AS refunded_count,
                COUNT(*) AS total_count
            FROM donations
        ");
        $row = $stmt->fetch();
        $revenue = (float)$row['revenue'];
        $succeeded = (int)$row['succeeded_count'];
        $refunded = (int)$row['refunded_count'];
        $totalCount = (int)$row['total_count'];
        return [
            'revenue' => $revenue,
            'average' => $succeeded > 0 ? round($revenue / $succeeded) : 0,
            'refundRate' => $totalCount > 0 ? round(($refunded / $totalCount) * 100, 1) : 0,
        ];
    }

    /**
     * Get recent donations
     */
    public function getRecent($limit = 10) {
        $stmt = $this->pdo->prepare("
            SELECT d.*, do.first_name, do.last_name, c.campaign_name
            FROM donations d
            JOIN donors do ON d.donor_id = do.donor_id
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            ORDER BY d.donation_date DESC, d.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get total donation count
     */
    public function getTotalCount() {
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM donations");
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Get total donations amount
     */
    public function getTotalAmount($status = null) {
        if ($status) {
            $stmt = $this->pdo->prepare("
                SELECT COALESCE(SUM(amount), 0) as total
                FROM donations
                WHERE payment_status = ?
            ");
            $stmt->execute([$status]);
        } else {
            $stmt = $this->pdo->query("SELECT COALESCE(SUM(amount), 0) as total FROM donations");
        }
        $result = $stmt->fetch();
        return (float)$result['total'];
    }
    
    /**
     * Get donations by donor
     */
    public function getByDonor($donorId, $limit = null) {
        $query = "
            SELECT d.*, c.campaign_name
            FROM donations d
            JOIN campaigns c ON d.campaign_id = c.campaign_id
            WHERE d.donor_id = ?
            ORDER BY d.donation_date DESC
        ";
        
        if ($limit) {
            $query .= " LIMIT ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$donorId, $limit]);
        } else {
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$donorId]);
        }
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get donations by campaign
     */
    public function getByCampaign($campaignId) {
        $stmt = $this->pdo->prepare("
            SELECT d.*, do.first_name, do.last_name
            FROM donations d
            JOIN donors do ON d.donor_id = do.donor_id
            WHERE d.campaign_id = ?
            ORDER BY d.donation_date DESC
        ");
        $stmt->execute([$campaignId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Create donation
     */
    public function create($donorId, $campaignId, $amount, $donationDate, $paymentMethod, $paymentStatus = DONATION_STATUS_SUCCEEDED) {
        // The donation row and the aggregates derived from it
        // (campaigns.amount_raised, donors.total_donated/donor_rank) must
        // commit or roll back together.
        $this->pdo->beginTransaction();
        try {
            // Check if campaign is live
            $stmt = $this->pdo->prepare("SELECT status FROM campaigns WHERE campaign_id = ?");
            $stmt->execute([$campaignId]);
            $campaign = $stmt->fetch();
            if ($campaign['status'] !== CAMPAIGN_STATUS_LIVE && $campaign['status'] !== CAMPAIGN_STATUS_PAUSED) {
                throw new Exception('Campaign must be Live or Paused to accept donations');
            }

            $stmt = $this->pdo->prepare("
                INSERT INTO donations (donor_id, campaign_id, amount, donation_date, payment_method, payment_status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $donorId,
                $campaignId,
                $amount,
                $donationDate,
                $paymentMethod,
                $paymentStatus
            ]);

            $donationId = $this->pdo->lastInsertId();

            // Update campaign amount raised
            $campaignModel = new Campaign($this->pdo);
            $campaignModel->updateAmountRaised($campaignId);

            // Update donor totals
            $donorModel = new Donor($this->pdo);
            $donorModel->updateTotalAndRank($donorId);

            $this->pdo->commit();
            return $donationId;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Update donation
     */
    public function update($donationId, $amount, $paymentMethod, $paymentStatus) {
        $this->pdo->beginTransaction();
        try {
            $donation = $this->getById($donationId);

            $stmt = $this->pdo->prepare("
                UPDATE donations
                SET amount = ?, payment_method = ?, payment_status = ?, updated_at = NOW()
                WHERE donation_id = ?
            ");
            $stmt->execute([$amount, $paymentMethod, $paymentStatus, $donationId]);

            // Update campaign and donor totals
            $campaignModel = new Campaign($this->pdo);
            $campaignModel->updateAmountRaised($donation['campaign_id']);

            $donorModel = new Donor($this->pdo);
            $donorModel->updateTotalAndRank($donation['donor_id']);

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Update payment status
     */
    public function updatePaymentStatus($donationId, $paymentStatus) {
        $this->pdo->beginTransaction();
        try {
            $donation = $this->getById($donationId);

            $stmt = $this->pdo->prepare("
                UPDATE donations
                SET payment_status = ?, updated_at = NOW()
                WHERE donation_id = ?
            ");
            $stmt->execute([$paymentStatus, $donationId]);

            // Update campaign and donor totals
            $campaignModel = new Campaign($this->pdo);
            $campaignModel->updateAmountRaised($donation['campaign_id']);

            $donorModel = new Donor($this->pdo);
            $donorModel->updateTotalAndRank($donation['donor_id']);

            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Get donation trend by month
     */
    public function getTrendByMonth($months = 6) {
        $query = "
            SELECT 
                DATE_FORMAT(donation_date, '%Y-%m') as month,
                MONTH(donation_date) as month_num,
                SUM(amount) as total
            FROM donations
            WHERE payment_status IN ('Succeeded', 'Processing')
            AND donation_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(donation_date, '%Y-%m'), MONTH(donation_date)
            ORDER BY donation_date
        ";
        
        $stmt = $this->pdo->prepare($query);
        $stmt->execute([$months]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get donation counts grouped by payment method
     */
    public function getPaymentMethodBreakdown() {
        $stmt = $this->pdo->query("
            SELECT payment_method, COUNT(*) as count
            FROM donations
            GROUP BY payment_method
            ORDER BY count DESC
        ");
        return $stmt->fetchAll();
    }

    /**
     * Get total donation amount grouped by day of week (1=Sunday..7=Saturday)
     */
    public function getWeekdayRevenue() {
        $stmt = $this->pdo->query("
            SELECT DAYOFWEEK(donation_date) as dow, SUM(amount) as total, COUNT(*) as count
            FROM donations
            GROUP BY DAYOFWEEK(donation_date)
            ORDER BY dow
        ");
        return $stmt->fetchAll();
    }

    /**
     * Giving by donor gender: total amount and count of Succeeded donations
     * grouped by the donor's (optional) gender. Donors with no gender on file
     * are grouped as "Not specified" so the buckets still sum to the overall
     * Succeeded total.
     */
    public function getGenderBreakdown() {
        $stmt = $this->pdo->query("
            SELECT COALESCE(NULLIF(do.gender, ''), 'Not specified') AS gender,
                   COUNT(*) AS count,
                   SUM(d.amount) AS total
            FROM donations d
            JOIN donors do ON d.donor_id = do.donor_id
            WHERE d.payment_status = 'Succeeded'
            GROUP BY COALESCE(NULLIF(do.gender, ''), 'Not specified')
            ORDER BY total DESC
        ");
        return $stmt->fetchAll();
    }

    /**
     * Giving by location: top 10 cities by total Succeeded donations. Donors
     * with no city on file are grouped as "Not specified".
     */
    public function getCityBreakdown($limit = 10) {
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(NULLIF(do.city, ''), 'Not specified') AS city,
                   COUNT(*) AS count,
                   SUM(d.amount) AS total
            FROM donations d
            JOIN donors do ON d.donor_id = do.donor_id
            WHERE d.payment_status = 'Succeeded'
            GROUP BY COALESCE(NULLIF(do.city, ''), 'Not specified')
            ORDER BY total DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    /**
     * Giving by age group: total amount and count of Succeeded donations by
     * the donor's age bracket, computed from birthdate. Donors with no
     * birthdate are skipped (they can't be placed in a bracket).
     */
    public function getAgeBracketBreakdown() {
        $stmt = $this->pdo->query("
            SELECT bracket, COUNT(*) AS count, SUM(amount) AS total
            FROM (
                SELECT d.amount,
                    CASE
                        WHEN TIMESTAMPDIFF(YEAR, do.birthdate, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
                        WHEN TIMESTAMPDIFF(YEAR, do.birthdate, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
                        WHEN TIMESTAMPDIFF(YEAR, do.birthdate, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
                        ELSE '60+'
                    END AS bracket
                FROM donations d
                JOIN donors do ON d.donor_id = do.donor_id
                WHERE d.payment_status = 'Succeeded' AND do.birthdate IS NOT NULL
            ) t
            GROUP BY bracket
        ");
        return $stmt->fetchAll();
    }

    /**
     * Get donation breakdown by campaign
     */
    public function getBreakdownByCampaign() {
        $stmt = $this->pdo->query("
            SELECT 
                c.campaign_id,
                c.campaign_name,
                COUNT(d.donation_id) as count,
                SUM(d.amount) as total
            FROM campaigns c
            LEFT JOIN donations d ON c.campaign_id = d.campaign_id AND d.payment_status IN ('Succeeded', 'Processing')
            GROUP BY c.campaign_id, c.campaign_name
            ORDER BY total DESC
        ");
        return $stmt->fetchAll();
    }
}
?>
