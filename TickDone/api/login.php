<?php
// api/login.php
session_start();
require 'db_config.php';

$data = json_decode(file_get_contents('php://input'));

if (!empty($data->username) && !empty($data->password)) {
    $login_identifier = $data->username; // This can be either username or email

    // Updated query to check both username and email columns
    $stmt = $conn->prepare("SELECT id, password, is_verified FROM users WHERE username = :login OR email = :login");
    $stmt->bindParam(':login', $login_identifier);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // First, check if the password is correct
        if (password_verify($data->password, $user['password'])) {
            
            // Second, check if the account has been verified
            if ($user['is_verified'] == 1) {
                // Success! Store user ID in the session
                $_SESSION['user_id'] = $user['id'];
                echo json_encode(['success' => 'Logged in successfully.']);
            } else {
                http_response_code(403); // Forbidden
                echo json_encode(['error' => 'Please verify your email before logging in.']);
            }

        } else {
            http_response_code(401); // Unauthorized
            echo json_encode(['error' => 'Invalid credentials.']);
        }
    } else {
        http_response_code(401); // Unauthorized
        echo json_encode(['error' => 'Invalid credentials.']);
    }
}
?>