<?php
/**
 * Database Connection Configuration — TEMPLATE
 *
 * config/database.php is gitignored so real credentials are never committed.
 * To set up a new checkout:
 *
 *     cp config/database.example.php config/database.php
 *
 * The defaults below match a stock XAMPP install, so on a local development
 * machine the copy works as-is with no edits. In production, do NOT edit the
 * defaults — set these environment variables instead, which take precedence:
 *
 *     DB_HOST      database hostname            (default: localhost)
 *     DB_USER      database username            (default: root)
 *     DB_PASSWORD  database password            (default: empty)
 *     DB_NAME      database name                (default: donortrack)
 *     DB_PORT      database port                (default: 3306)
 *
 * Apache example (httpd.conf / vhost):
 *     SetEnv DB_USER donortrack_app
 *     SetEnv DB_PASSWORD "your-strong-password"
 */

/**
 * Read an environment variable, falling back to $default when it is not set.
 * Uses an explicit false check rather than ?: so a legitimately falsy value
 * (a password of "0", say) is not silently replaced by the default.
 */
function env($key, $default = null) {
    $value = getenv($key);
    return $value === false ? $default : $value;
}

// Database credentials
define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_USER', env('DB_USER', 'root'));
define('DB_PASSWORD', env('DB_PASSWORD', ''));
define('DB_NAME', env('DB_NAME', 'donortrack'));
define('DB_PORT', env('DB_PORT', 3306));

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
