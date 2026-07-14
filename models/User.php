<?php
/**
 * User Model
 */

class User {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Get user by ID
     */
    public function getById($userId) {
        $stmt = $this->pdo->prepare("
            SELECT user_id, first_name, last_name, email, role, status, created_at, updated_at
            FROM users
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
    
    /**
     * Get user by email
     */
    public function getByEmail($email) {
        $stmt = $this->pdo->prepare("
            SELECT * FROM users WHERE email = ?
        ");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }
    
    /**
     * Get all users
     */
    public function getAll($page = 1, $limit = ITEMS_PER_PAGE) {
        $offset = ($page - 1) * $limit;
        $stmt = $this->pdo->prepare("
            SELECT user_id, first_name, last_name, email, role, status, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$limit, $offset]);
        return $stmt->fetchAll();
    }
    
    /**
     * Get total user count
     */
    public function getTotalCount() {
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch();
        return $result['count'];
    }
    
    /**
     * Create user
     */
    public function create($firstName, $lastName, $email, $passwordHash, $role) {
        try {
            // Check if email exists
            if ($this->getByEmail($email)) {
                throw new Exception('Email already exists');
            }
            
            $stmt = $this->pdo->prepare("
                INSERT INTO users (first_name, last_name, email, password_hash, role, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$firstName, $lastName, $email, $passwordHash, $role, USER_STATUS_ACTIVE]);
            return $this->pdo->lastInsertId();
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Update user
     */
    public function update($userId, $firstName, $lastName, $role, $status) {
        $stmt = $this->pdo->prepare("
            UPDATE users
            SET first_name = ?, last_name = ?, role = ?, status = ?, updated_at = NOW()
            WHERE user_id = ?
        ");
        return $stmt->execute([$firstName, $lastName, $role, $status, $userId]);
    }
    
    /**
     * Update password
     */
    public function updatePassword($userId, $passwordHash) {
        $stmt = $this->pdo->prepare("
            UPDATE users
            SET password_hash = ?, updated_at = NOW()
            WHERE user_id = ?
        ");
        return $stmt->execute([$passwordHash, $userId]);
    }
    
    /**
     * Delete user
     */
    public function delete($userId) {
        $stmt = $this->pdo->prepare("DELETE FROM users WHERE user_id = ?");
        return $stmt->execute([$userId]);
    }
    
    /**
     * Get active staff users
     */
    public function getStaff() {
        $stmt = $this->pdo->prepare("
            SELECT user_id, first_name, last_name, email, role, status
            FROM users
            WHERE role IN (?, ?) AND status = ?
            ORDER BY first_name, last_name
        ");
        $stmt->execute([ROLE_ADMIN, ROLE_STAFF, USER_STATUS_ACTIVE]);
        return $stmt->fetchAll();
    }
}
?>
