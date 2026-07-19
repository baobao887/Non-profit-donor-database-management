<?php
/**
 * Campaign Model
 */

class Campaign {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Get campaign by ID
     */
    public function getById($campaignId) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM campaigns WHERE campaign_id = ?
        ");
        $stmt->execute([$campaignId]);
        return $stmt->fetch();
    }
    
    /**
     * Get all campaigns
     */
    public function getAll($page = 1, $limit = ITEMS_PER_PAGE, $status = null) {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT * FROM campaigns";
        $params = [];
        
        if ($status) {
            $query .= " WHERE status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
        
        $stmt = $this->pdo->prepare($query);
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Get total campaign count
     */
    public function getTotalCount($status = null) {
        if ($status) {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM campaigns WHERE status = ?");
            $stmt->execute([$status]);
        } else {
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM campaigns");
        }
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Get live campaigns count.
     * A campaign only counts as "currently live" if its status is Live AND
     * today falls within its start/end date window - a Live campaign whose
     * end date has passed is expired, not currently active.
     */
    public function getLiveCount() {
        $stmt = $this->pdo->query("
            SELECT COUNT(*) as count FROM campaigns
            WHERE status = 'Live'
            AND start_date IS NOT NULL AND end_date IS NOT NULL
            AND CURDATE() BETWEEN start_date AND end_date
        ");
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Get campaigns by status
     */
    public function getByStatus($status, $limit = null) {
        $query = "SELECT * FROM campaigns WHERE status = ? ORDER BY updated_at DESC";
        if ($limit) {
            $query .= " LIMIT ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$status, $limit]);
        } else {
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$status]);
        }
        return $stmt->fetchAll();
    }
    
    /**
     * Get live campaigns (status Live AND within their start/end date window)
     */
    public function getLive($limit = null) {
        $query = "
            SELECT * FROM campaigns
            WHERE status = 'Live'
            AND start_date IS NOT NULL AND end_date IS NOT NULL
            AND CURDATE() BETWEEN start_date AND end_date
            ORDER BY updated_at DESC
        ";
        if ($limit) {
            $query .= " LIMIT ?";
            $stmt = $this->pdo->prepare($query);
            $stmt->execute([$limit]);
        } else {
            $stmt = $this->pdo->query($query);
        }
        return $stmt->fetchAll();
    }
    
    /**
     * Create campaign
     */
    public function create($campaignName, $description, $goalAmount, $startDate, $endDate, $createdBy, $status = CAMPAIGN_STATUS_PLANNING) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO campaigns (campaign_name, description, goal_amount, amount_raised, start_date, end_date, status, created_by, created_at)
                VALUES (?, ?, ?, 0, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $campaignName,
                $description,
                $goalAmount,
                $startDate,
                $endDate,
                $status,
                $createdBy
            ]);
            return $this->pdo->lastInsertId();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Update campaign
     */
    public function update($campaignId, $campaignName, $description, $goalAmount, $startDate, $endDate, $status) {
        $stmt = $this->pdo->prepare("
            UPDATE campaigns
            SET campaign_name = ?, description = ?, goal_amount = ?, start_date = ?, end_date = ?, status = ?, updated_at = NOW()
            WHERE campaign_id = ?
        ");
        return $stmt->execute([$campaignName, $description, $goalAmount, $startDate, $endDate, $status, $campaignId]);
    }
    
    /**
     * Update campaign status
     */
    public function updateStatus($campaignId, $status) {
        $stmt = $this->pdo->prepare("
            UPDATE campaigns
            SET status = ?, updated_at = NOW()
            WHERE campaign_id = ?
        ");
        return $stmt->execute([$status, $campaignId]);
    }
    
    /**
     * Update amount raised
     */
    public function updateAmountRaised($campaignId) {
        try {
            $stmt = $this->pdo->prepare("
                SELECT COALESCE(SUM(amount), 0) as total
                FROM donations
                WHERE campaign_id = ? AND payment_status IN ('Succeeded', 'Processing')
            ");
            $stmt->execute([$campaignId]);
            $result = $stmt->fetch();
            $total = (float)$result['total'];
            
            $stmt = $this->pdo->prepare("
                UPDATE campaigns
                SET amount_raised = ?, updated_at = NOW()
                WHERE campaign_id = ?
            ");
            $stmt->execute([$total, $campaignId]);
            
            return true;
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Get campaign progress
     */
    public function getProgress($campaignId) {
        $campaign = $this->getById($campaignId);
        if (!$campaign) return 0;
        return calculateCampaignProgress($campaign['amount_raised'], $campaign['goal_amount']);
    }
    
    /**
     * Archive campaign (soft delete)
     */
    public function archive($campaignId) {
        $stmt = $this->pdo->prepare("
            UPDATE campaigns
            SET status = ?, updated_at = NOW()
            WHERE campaign_id = ?
        ");
        return $stmt->execute([CAMPAIGN_STATUS_ARCHIVED, $campaignId]);
    }
    
    /**
     * Get the single campaign with the highest amount raised
     */
    public function getTopByRaised() {
        $stmt = $this->pdo->query("
            SELECT * FROM campaigns
            ORDER BY amount_raised DESC
            LIMIT 1
        ");
        return $stmt->fetch();
    }

    /**
     * Get aggregate totals across all campaigns (for reports)
     */
    public function getAggregateStats() {
        $stmt = $this->pdo->query("
            SELECT
                COALESCE(AVG(amount_raised), 0) as avg_raised,
                COALESCE(SUM(goal_amount), 0) as total_goal,
                COALESCE(SUM(amount_raised), 0) as total_raised
            FROM campaigns
        ");
        return $stmt->fetch();
    }

    /**
     * Get campaigns requiring attention (under 70% funded)
     */
    public function getCampaignsNeedingAttention($limit = 5) {
        $stmt = $this->pdo->prepare("
            SELECT *
            FROM campaigns
            WHERE status = ?
            AND (amount_raised / goal_amount) < 0.7
            ORDER BY updated_at DESC
            LIMIT ?
        ");
        $stmt->execute([CAMPAIGN_STATUS_LIVE, $limit]);
        return $stmt->fetchAll();
    }
}
?>
