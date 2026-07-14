<?php
/**
 * Logout Handler
 */

require_once 'includes/auth.php';

// Logout user
logoutUser();

// Redirect to login
header('Location: login.html');
exit;
?>
