<?php
// api/get_profile.php
session_start();
require 'db_config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required.']);
    exit();
}

$user_id = $_SESSION['user_id'];

try {
    $stmt = $conn->prepare("SELECT username, email, first_name, last_name, dob, created_at FROM users WHERE id = :id");
    $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // --- Data Formatting ---
        // Set names, or provide a default if not set
        $user['first_name'] = $user['first_name'] ?: 'Not Set';
        $user['last_name'] = $user['last_name'] ?: 'Not Set';

        // Calculate age
        if ($user['dob']) {
            $dob = new DateTime($user['dob']);
            $now = new DateTime();
            $user['age'] = $now->diff($dob)->y;
        } else {
            $user['age'] = 'Not Set';
        }

        // Format joining date
        $join_date = new DateTime($user['created_at']);
        $user['joining_date'] = $join_date->format('d F Y');
        
        // Unset fields we don't need in the final JSON output
        unset($user['dob'], $user['created_at']);

        echo json_encode($user);

    } else {
        http_response_code(404);
        echo json_encode(['error' => 'User not found.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error.']);
}
?>