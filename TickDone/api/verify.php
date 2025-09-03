<?php
// api/verify.php
session_start();
require 'db_config.php';

// Check if a token is provided in the URL
if (isset($_GET['token'])) {
    $verification_token = $_GET['token'];

    // Find the user with the matching verification token
    $stmt = $conn->prepare("SELECT id FROM users WHERE verification_token = :token AND is_verified = 0");
    $stmt->bindParam(':token', $verification_token);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        // User found, let's verify them
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $user_id = $user['id'];

        // Update the user's status to verified and remove the token
        $updateStmt = $conn->prepare("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = :id");
        $updateStmt->bindParam(':id', $user_id);
        
        if ($updateStmt->execute()) {
            // Automatically log the user in by setting their session
            $_SESSION['user_id'] = $user_id;

            // Redirect them to the final step: completing their profile
            // NOTE: We will create this page in the next step.
            header('Location: ../complete_profile.html');
            exit();
        } else {
            echo "Error: Could not update your account. Please try again later.";
        }

    } else {
        // No user found with this token, or they are already verified
        echo "Invalid or expired verification link.";
    }

} else {
    // No token provided
    echo "No verification token found.";
}
?>