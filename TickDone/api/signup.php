<?php
// signup.php
require 'db_config.php'; // We'll create this config file next

$data = json_decode(file_get_contents('php://input'));

if (!empty($data->username) && !empty($data->password)) {
    $username = $data->username;
    // IMPORTANT: Always hash passwords!
    $password_hash = password_hash($data->password, PASSWORD_DEFAULT);

    // Check if username already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = :username");
    $stmt->bindParam(':username', $username);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'Username already exists.']);
    } else {
        $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $password_hash);

        if ($stmt->execute()) {
            echo json_encode(['success' => 'User created successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create user.']);
        }
    }
}
?>