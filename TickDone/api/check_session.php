<?php
// check_session.php
session_start();

header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    // If a user_id is found in the session, they are logged in.
    echo json_encode(['loggedIn' => true]);
} else {
    // Otherwise, they are not logged in.
    echo json_encode(['loggedIn' => false]);
}
?>