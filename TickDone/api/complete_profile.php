<?php
// api/complete_profile.php
session_start();
require 'db_config.php';

header('Content-Type: application/json');

// Security Check: Ensure a user is logged in.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'You must be logged in to complete your profile.']);
    exit();
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'));

// Basic validation: First name and DOB are required. Last name is optional.
if (!empty($data->firstName) && !empty($data->dob)) {
    
    // --- Server-Side Validation Rules ---
    // First Name: Only letters, apostrophes, hyphens and spaces allowed
    if (!preg_match("/^[a-zA-Z-' ]*$/", $data->firstName)) {
        http_response_code(400);
        echo json_encode(['error' => 'First Name can only contain letters and spaces.']);
        exit();
    }
    
    // Last Name: Validate only if it was provided
    if (!empty($data->lastName) && !preg_match("/^[a-zA-Z-' ]*$/", $data->lastName)) {
        http_response_code(400);
        echo json_encode(['error' => 'Last Name can only contain letters and spaces.']);
        exit();
    }

    // DOB: Check for a valid date and realistic age (e.g., between 5 and 120 years old)
    try {
        $dob = new DateTime($data->dob);
        $now = new DateTime();
        $age = $now->diff($dob)->y;

        if ($dob > $now || $age < 5 || $age > 120) {
            http_response_code(400);
            echo json_encode(['error' => 'Please enter a valid date of birth.']);
            exit();
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format.']);
        exit();
    }

    // --- Update Profile ---
    $stmt = $conn->prepare("UPDATE users SET first_name = :first_name, last_name = :last_name, dob = :dob WHERE id = :id");
    $stmt->bindParam(':first_name', $data->firstName);
    // Use lastName if provided, otherwise save an empty string or NULL.
    $lastNameValue = !empty($data->lastName) ? $data->lastName : null;
    $stmt->bindParam(':last_name', $lastNameValue);
    $stmt->bindParam(':dob', $data->dob);
    $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(['success' => 'Profile completed successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile.']);
    }

} else {
    http_response_code(400);
    echo json_encode(['error' => 'First Name and Date of Birth are required.']);
}
?>