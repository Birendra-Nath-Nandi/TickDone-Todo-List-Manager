<?php
require 'db_config.php';
$data = json_decode(file_get_contents('php://input'));

if (empty($data->token) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Token and new password are required.']);
    exit();
}

// --- Server-Side Password Validation ---
if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/', $data->password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.']);
    exit();
}

$stmt = $conn->prepare("SELECT id, password_reset_expires FROM users WHERE password_reset_token = :token");
$stmt->bindParam(':token', $data->token);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $now = date("Y-m-d H:i:s");

    if ($now > $user['password_reset_expires']) {
        http_response_code(400);
        echo json_encode(['error' => 'This reset token has expired.']);
        exit();
    }

    $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
    $updateStmt = $conn->prepare("UPDATE users SET password = :password, password_reset_token = NULL, password_reset_expires = NULL WHERE id = :id");
    $updateStmt->bindParam(':password', $password_hash);
    $updateStmt->bindParam(':id', $user['id']);

    if ($updateStmt->execute()) {
        echo json_encode(['success' => 'Your password has been reset successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to reset password.']);
    }

} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid reset token.']);
}
?>