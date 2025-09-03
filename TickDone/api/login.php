<?php
// login.php
session_start(); // Start the session
require 'db_config.php';

$data = json_decode(file_get_contents('php://input'));

if (!empty($data->username) && !empty($data->password)) {
    $stmt = $conn->prepare("SELECT id, password FROM users WHERE username = :username");
    $stmt->bindParam(':username', $data->username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        // Verify the hashed password
        if (password_verify($data->password, $user['password'])) {
            // Success! Store user ID in the session
            $_SESSION['user_id'] = $user['id'];
            echo json_encode(['success' => 'Logged in successfully.']);
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