<?php
// Use PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Require the autoloader
require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'db_config.php';

$data = json_decode(file_get_contents('php://input'));

if (!empty($data->username) && !empty($data->email) && !empty($data->password)) {
    
    // --- Input Validation ---
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Invalid email format.']);
        exit();
    }
    
    // --- Check for existing username or email ---
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = :username OR email = :email");
    $stmt->bindParam(':username', $data->username);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['error' => 'Username or email already exists.']);
        exit();
    }
    
    // --- Create User ---
    $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
    $verification_token = bin2hex(random_bytes(50)); // Generate a secure random token

    $stmt = $conn->prepare("INSERT INTO users (username, email, password, verification_token) VALUES (:username, :email, :password, :token)");
    $stmt->bindParam(':username', $data->username);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':password', $password_hash);
    $stmt->bindParam(':token', $verification_token);

    if ($stmt->execute()) {
        // --- Send Verification Email ---
        $mail = new PHPMailer(true);
        try {
            // Server settings for a local GMail setup (you'll need to configure this)
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'bnnandi.tech@gmail.com'; // Your Gmail address
            $mail->Password   = 'frjz tksu vxbv kfra';    // Your Gmail App Password
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            // Recipients
            $mail->setFrom('no-reply@tickdone.com', 'TickDone');
            $mail->addAddress($data->email);

            // Content
            $verification_link = "http://localhost/TickDone/api/verify.php?token=" . $verification_token;
            $mail->isHTML(true);
            $mail->Subject = 'Verify Your Email for TickDone';
            $mail->Body    = "<h2>Welcome to TickDone!</h2><p>Please click the link below to verify your email address and complete your registration:</p><p><a href='{$verification_link}'>Verify My Email</a></p>";
            $mail->AltBody = "Copy and paste this link into your browser to verify: {$verification_link}";

            $mail->send();
            echo json_encode(['success' => 'Registration successful! Please check your email to verify your account.']);

        } catch (Exception $e) {
            http_response_code(500);
            // In a real app, you would log this and show a generic error
            echo json_encode(['error' => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"]);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user.']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Incomplete data provided.']);
}
?>