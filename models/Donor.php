<?php
/**
 * Donor Model
 */

class Donor {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Get donor by ID
     */
    public function getById($donorId) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM donors WHERE donor_id = ?
        ");
        $stmt->execute([$donorId]);
        return $stmt->fetch();
    }
    
    /**
     * Get all donors
     */
    public function getAll($page = 1, $limit = ITEMS_PER_PAGE, $status = null) {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT * FROM donors";
        $params = [];
        
        if ($status) {
            $query .= " WHERE status = ?";
            $params[] = $status;
        }
        
        $query .= " ORDER BY total_donated DESC, updated_at DESC LIMIT ? OFFSET ?";
        
        $stmt = $this->pdo->prepare($query);
        $params[] = $limit;
        $params[] = $offset;
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Get total donor count
     */
    public function getTotalCount($status = null) {
        if ($status) {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM donors WHERE status = ?");
            $stmt->execute([$status]);
        } else {
            $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM donors");
        }
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Get active donors count
     */
    public function getActiveCount() {
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM donors WHERE status = 'Active'");
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Get total donations amount
     */
    public function getTotalDonated() {
        $stmt = $this->pdo->query("SELECT COALESCE(SUM(total_donated), 0) as total FROM donors");
        $result = $stmt->fetch();
        return (float)$result['total'];
    }
    
    /**
     * Get top donors
     */
    public function getTopDonors($limit = 5) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM donors
            WHERE status = 'Active'
            ORDER BY total_donated DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Create donor
     */
    public function create($firstName, $lastName, $email, $phone, $address) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO donors (first_name, last_name, email, phone, address, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $firstName,
                $lastName,
                $email,
                $phone,
                $address,
                DONOR_STATUS_ACTIVE
            ]);
            return $this->pdo->lastInsertId();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Update donor
     */
    public function update($donorId, $firstName, $lastName, $email, $phone, $address, $status) {
        $stmt = $this->pdo->prepare("
            UPDATE donors
            SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, status = ?, updated_at = NOW()
            WHERE donor_id = ?
        ");
        return $stmt->execute([$firstName, $lastName, $email, $phone, $address, $status, $donorId]);
    }
    
    /**
     * Update total donated and rank
     */
    public function updateTotalAndRank($donorId) {
        try {
            // Get total donated
            $stmt = $this->pdo->prepare("
                SELECT COALESCE(SUM(amount), 0) as total
                FROM donations
                WHERE donor_id = ? AND payment_status IN ('Succeeded', 'Processing')
            ");
            $stmt->execute([$donorId]);
            $result = $stmt->fetch();
            $total = (float)$result['total'];
            
            // Calculate rank
            $rank = getDonorRank($total);
            
            // Update donor
            $stmt = $this->pdo->prepare("
                UPDATE donors
                SET total_donated = ?, donor_rank = ?, updated_at = NOW()
                WHERE donor_id = ?
            ");
            $stmt->execute([$total, $rank, $donorId]);
            
            return true;
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Archive donor (soft delete)
     */
    public function archive($donorId) {
        $stmt = $this->pdo->prepare("
            UPDATE donors
            SET status = ?, updated_at = NOW()
            WHERE donor_id = ?
        ");
        return $stmt->execute([DONOR_STATUS_ARCHIVED, $donorId]);
    }
    
    /**
     * Search donors
     */
    public function search($query, $limit = 20) {
        $search = '%' . $query . '%';
        $stmt = $this->pdo->prepare("
            SELECT * FROM donors
            WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)
            AND status != ?
            ORDER BY first_name, last_name
            LIMIT ?
        ");
        $stmt->execute([$search, $search, $search, DONOR_STATUS_ARCHIVED, $limit]);
        return $stmt->fetchAll();
    }
}
?>
