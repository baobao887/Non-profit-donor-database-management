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
     * Get donor counts grouped by rank (for donor distribution charts)
     */
    public function getRankBreakdown() {
        $stmt = $this->pdo->query("
            SELECT donor_rank, COUNT(*) as count
            FROM donors
            WHERE status = 'Active'
            GROUP BY donor_rank
        ");
        return $stmt->fetchAll();
    }

    /**
     * Create donor
     *
     * gender/birthdate/city/province are optional demographic fields (any may
     * be null); they are collected for aggregate analytics only and are never
     * required to record a donation.
     */
    public function create($firstName, $lastName, $email, $phone, $address, $notes = '', $gender = null, $birthdate = null, $city = null, $province = null) {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO donors (first_name, last_name, email, phone, address, gender, birthdate, city, province, notes, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $firstName,
                $lastName,
                $email,
                $phone,
                $address,
                $gender ?: null,
                $birthdate ?: null,
                $city,
                $province,
                $notes,
                DONOR_STATUS_ACTIVE
            ]);
            return $this->pdo->lastInsertId();
        } catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Update donor
     *
     * Demographic fields (gender/birthdate/city/province) are optional and
     * nullable — see create().
     */
    public function update($donorId, $firstName, $lastName, $email, $phone, $address, $status, $notes = null, $gender = null, $birthdate = null, $city = null, $province = null) {
        $stmt = $this->pdo->prepare("
            UPDATE donors
            SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, gender = ?, birthdate = ?, city = ?, province = ?, status = ?, notes = ?, updated_at = NOW()
            WHERE donor_id = ?
        ");
        return $stmt->execute([$firstName, $lastName, $email, $phone, $address, $gender ?: null, $birthdate ?: null, $city, $province, $status, $notes, $donorId]);
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

    /**
     * Build the shared WHERE clause + bound params for the list/count/export
     * queries below. Handles free-text search plus optional status and rank
     * filters together, all parameterized (including the LIKE terms).
     */
    private function buildFilters($search, $status, $rank) {
        $clauses = [];
        $params = [];

        if ($search !== null && $search !== '') {
            $like = '%' . $search . '%';
            $clauses[] = "(first_name LIKE ? OR last_name LIKE ? OR CONCAT(first_name, ' ', last_name) LIKE ? OR email LIKE ? OR phone LIKE ? OR notes LIKE ?)";
            array_push($params, $like, $like, $like, $like, $like, $like);
        }
        if ($status !== null && $status !== '' && $status !== 'all') {
            $clauses[] = "status = ?";
            $params[] = $status;
        }
        if ($rank !== null && $rank !== '' && $rank !== 'all') {
            $clauses[] = "donor_rank = ?";
            $params[] = $rank;
        }

        $where = $clauses ? (' WHERE ' . implode(' AND ', $clauses)) : '';
        return [$where, $params];
    }

    /**
     * One query handling search + status + rank filters together with
     * LIMIT/OFFSET, for true server-side pagination.
     */
    public function getFiltered($page, $limit, $search = '', $status = null, $rank = null) {
        $offset = ($page - 1) * $limit;
        [$where, $params] = $this->buildFilters($search, $status, $rank);
        $sql = "SELECT * FROM donors" . $where . " ORDER BY total_donated DESC, updated_at DESC LIMIT ? OFFSET ?";
        $params[] = (int)$limit;
        $params[] = (int)$offset;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Total rows matching the same filters, for "Page X of Y" display.
     */
    public function countFiltered($search = '', $status = null, $rank = null) {
        [$where, $params] = $this->buildFilters($search, $status, $rank);
        $stmt = $this->pdo->prepare("SELECT COUNT(*) AS count FROM donors" . $where);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return (int)$row['count'];
    }

    /**
     * Full filtered set (no LIMIT) for CSV export, so the export reflects the
     * entire filtered result rather than only the current page.
     */
    public function getForExport($search = '', $status = null, $rank = null) {
        [$where, $params] = $this->buildFilters($search, $status, $rank);
        $sql = "SELECT * FROM donors" . $where . " ORDER BY total_donated DESC, updated_at DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Lightweight id + name list for populating donor dropdowns (donation and
     * communication forms) without bulk-loading full paginated donor rows.
     * Excludes archived donors. This returns every non-archived donor; at very
     * large scale a search-backed typeahead would replace it, but for this
     * app's donor volume a lightweight id+name list is sufficient.
     */
    public function getOptions() {
        $stmt = $this->pdo->prepare("
            SELECT donor_id, first_name, last_name
            FROM donors
            WHERE status != ?
            ORDER BY first_name, last_name
        ");
        $stmt->execute([DONOR_STATUS_ARCHIVED]);
        return $stmt->fetchAll();
    }

    /**
     * Sidebar summary (Silver/Gold counts, lifetime total) computed
     * server-side so it stays correct once the list itself is paginated.
     */
    public function getSummary() {
        $stmt = $this->pdo->query("
            SELECT
                SUM(donor_rank = 'Silver') AS silver,
                SUM(donor_rank = 'Gold') AS gold,
                COALESCE(SUM(total_donated), 0) AS lifetime
            FROM donors
        ");
        $row = $stmt->fetch();
        return [
            'silver' => (int)($row['silver'] ?? 0),
            'gold' => (int)($row['gold'] ?? 0),
            'lifetime' => (float)($row['lifetime'] ?? 0),
        ];
    }
}
?>
