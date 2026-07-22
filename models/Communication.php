<?php
/**
 * Communication Model
 */

class Communication {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Get communication by ID
     */
    public function getById($communicationId) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM communications WHERE communication_id = ?
        ");
        $stmt->execute([$communicationId]);
        return $stmt->fetch();
    }
    
    /**
     * Get all communications
     */
    public function getAll($page = 1, $limit = ITEMS_PER_PAGE) {
        $offset = ($page - 1) * $limit;
        $stmt = $this->pdo->prepare("
            SELECT c.*, d.first_name, d.last_name, u.first_name as staff_first_name, u.last_name as staff_last_name
            FROM communications c
            JOIN donors d ON c.donor_id = d.donor_id
            LEFT JOIN users u ON c.staff_id = u.user_id
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * Build the shared WHERE clause + bound params for the filtered list and
     * count below. Search matches donor name, type or content - the same
     * fields the page previously filtered client-side, but across the whole
     * table rather than only the rows already loaded. All terms are bound.
     */
    private function buildFilters($search) {
        $clauses = [];
        $params = [];

        if ($search !== null && $search !== '') {
            $like = '%' . $search . '%';
            $clauses[] = "(d.first_name LIKE ? OR d.last_name LIKE ? OR CONCAT(d.first_name, ' ', d.last_name) LIKE ? OR c.type LIKE ? OR c.content LIKE ?)";
            array_push($params, $like, $like, $like, $like, $like);
        }

        $where = $clauses ? ('WHERE ' . implode(' AND ', $clauses)) : '';
        return [$where, $params];
    }

    /**
     * One page of communications matching an optional search term.
     */
    public function getFiltered($page, $limit, $search = '') {
        $offset = ($page - 1) * $limit;
        [$where, $params] = $this->buildFilters($search);
        $sql = "
            SELECT c.*, d.first_name, d.last_name, u.first_name as staff_first_name, u.last_name as staff_last_name
            FROM communications c
            JOIN donors d ON c.donor_id = d.donor_id
            LEFT JOIN users u ON c.staff_id = u.user_id
            $where
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        ";
        $params[] = (int)$limit;
        $params[] = (int)$offset;
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Total rows matching the same search, for "Page X of Y" display.
     */
    public function countFiltered($search = '') {
        [$where, $params] = $this->buildFilters($search);
        $sql = "
            SELECT COUNT(*) AS count
            FROM communications c
            JOIN donors d ON c.donor_id = d.donor_id
            $where
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return (int)$row['count'];
    }

    /**
     * Get recent communications
     */
    public function getRecent($limit = 10) {
        $stmt = $this->pdo->prepare("
            SELECT c.*, d.first_name, d.last_name, u.first_name as staff_first_name, u.last_name as staff_last_name
            FROM communications c
            JOIN donors d ON c.donor_id = d.donor_id
            LEFT JOIN users u ON c.staff_id = u.user_id
            ORDER BY c.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get total communications count
     */
    public function getTotalCount() {
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM communications");
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Get communications for donor
     */
    public function getByDonor($donorId, $limit = null) {
        $query = "
            SELECT c.*, u.first_name as staff_first_name, u.last_name as staff_last_name
            FROM communications c
            LEFT JOIN users u ON c.staff_id = u.user_id
            WHERE c.donor_id = ?
            ORDER BY c.created_at DESC
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
     * Create communication
     */
    public function create($donorId, $type, $content, $staffId = null, $status = 'Draft') {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO communications (donor_id, type, content, status, staff_id, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $donorId,
                $type,
                $content,
                $status,
                $staffId
            ]);
            return $this->pdo->lastInsertId();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Update communication
     */
    public function update($communicationId, $type, $content, $status, $staffId) {
        $stmt = $this->pdo->prepare("
            UPDATE communications
            SET type = ?, content = ?, status = ?, staff_id = ?, updated_at = NOW()
            WHERE communication_id = ?
        ");
        return $stmt->execute([$type, $content, $status, $staffId, $communicationId]);
    }
    
    /**
     * Update communication status
     */
    public function updateStatus($communicationId, $status) {
        $stmt = $this->pdo->prepare("
            UPDATE communications
            SET status = ?, updated_at = NOW()
            WHERE communication_id = ?
        ");
        return $stmt->execute([$status, $communicationId]);
    }
    
    /**
     * Delete communication
     */
    public function delete($communicationId) {
        $stmt = $this->pdo->prepare("DELETE FROM communications WHERE communication_id = ?");
        return $stmt->execute([$communicationId]);
    }
}
?>
