<?php
// api/complete_profile.php
session_start();
require 'db_config.php';

header('Content-Type: application/json');

// Security Check: Ensure a user is logged in before proceeding.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'You must be logged in to complete your profile.']);
    exit();
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'));

// Basic validation
if (!empty($data->firstName) && !empty($data->lastName) && !empty($data->dob)) {
    
    // Update the user's record with the new information
    $stmt = $conn->prepare("UPDATE users SET first_name = :first_name, last_name = :last_name, dob = :dob WHERE id = :id");
    $stmt->bindParam(':first_name', $data->firstName);
    $stmt->bindParam(':last_name', $data->lastName);
    $stmt->bindParam(':dob', $data->dob);
    $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(['success' => 'Profile completed successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile.']);
    }

} else {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'All fields are required.']);
}
?>