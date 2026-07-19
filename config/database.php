<?php
/**
 * Database Connection Configuration
 * Uses PDO with prepared statements for security
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'donortrack');
define('DB_PORT', 3306);

// PDO connection options
$pdo_options = array(
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
);

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME,
        DB_USER,
        DB_PASSWORD,
        $pdo_options
    );
    
    // Set timezone
    $pdo->exec("SET time_zone = '+00:00'");

    // Fail loudly on bad data (invalid enums, malformed dates, over-length
    // strings) instead of MariaDB's default silent coercion/truncation.
    $pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Database connection failed']));
}

/**
 * Get database connection
 */
function getDB() {
    global $pdo;
    return $pdo;
}
?>
