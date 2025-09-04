<?php
// api/signup.php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'db_config.php';

$data = json_decode(file_get_contents('php://input'));

if (!empty($data->username) && !empty($data->email) && !empty($data->password)) {
    
    // --- Server-Side Validation Rules ---
    // Username: 3-20 chars, no spaces, only letters, numbers, underscore, hyphen
    if (!preg_match('/^[a-zA-Z0-9_-]{3,20}$/', $data->username)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens.']);
        exit();
    }
    // Email: Must be a valid email format
    if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Please enter a valid email address.']);
        exit();
    }
    // Password: At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/', $data->password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.']);
        exit();
    }

    // --- Check for existing username or email ---
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = :username OR email = :email");
    $stmt->bindParam(':username', $data->username);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Username or email is already taken.']);
        exit();
    }
    
    // --- Create User (if validation passes) ---
    $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
    $verification_token = bin2hex(random_bytes(50));

    $stmt = $conn->prepare("INSERT INTO users (username, email, password, verification_token) VALUES (:username, :email, :password, :token)");
    // ... (rest of the file is the same)
    $stmt->bindParam(':username', $data->username);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':password', $password_hash);
    $stmt->bindParam(':token', $verification_token);

    if ($stmt->execute()) {
        // --- Send Verification Email ---
        $mail = new PHPMailer(true);
        try {
            // Server settings for a local GMail setup
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'your_email_address';
            $mail->Password   = 'your_app_password';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            // Recipients
            $mail->setFrom('no-reply@tickdone.com', 'TickDone');
            $mail->addAddress($data->email);

            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            $path = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');
            $verification_link = "{$protocol}://{$host}{$path}/verify.php?token=" . $verification_token;

            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Verify Your Email for TickDone';
            $mail->Body    = "<h2>Welcome to TickDone!</h2><p>Please click the link below to verify your email address and complete your registration:</p><p><a href='{$verification_link}'>Verify My Email</a></p>";
            $mail->AltBody = "Copy and paste this link into your browser to verify: {$verification_link}";

            $mail->send();
            echo json_encode(['success' => 'Registration successful! Please check your email to verify your account.']);

        } catch (Exception $e) {
            http_response_code(500);
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