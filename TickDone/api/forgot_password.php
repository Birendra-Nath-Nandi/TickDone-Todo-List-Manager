<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';
require 'db_config.php';

$data = json_decode(file_get_contents('php://input'));

if (empty($data->email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email address is required.']);
    exit();
}

// --- Server-Side Validation ---
if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please enter a valid email address.']);
    exit();
}

$stmt = $conn->prepare("SELECT id FROM users WHERE email = :email");
$stmt->bindParam(':email', $data->email);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $user_id = $user['id'];

    $token = bin2hex(random_bytes(50));
    $expires = date("Y-m-d H:i:s", time() + 3600); // Token expires in 1 hour

    $updateStmt = $conn->prepare("UPDATE users SET password_reset_token = :token, password_reset_expires = :expires WHERE id = :id");
    $updateStmt->bindParam(':token', $token);
    $updateStmt->bindParam(':expires', $expires);
    $updateStmt->bindParam(':id', $user_id);
    
    if ($updateStmt->execute()) {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'bnnandi.tech@gmail.com';
            $mail->Password   = 'frjz tksu vxbv kfra';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            $mail->setFrom('no-reply@tickdone.com', 'TickDone');
            $mail->addAddress($data->email);

            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            $path = rtrim(dirname(dirname($_SERVER['PHP_SELF'])), '/\\'); // Go up to the root
            $reset_link = "{$protocol}://{$host}{$path}/reset_password.html?token=" . $token;

            $mail->isHTML(true);
            $mail->Subject = 'Password Reset Request for TickDone';
            $mail->Body    = "<p>You requested a password reset. Click the link below to set a new password:</p><p><a href='{$reset_link}'>Reset Password</a></p><p>This link will expire in one hour.</p>";
            
            $mail->send();
            echo json_encode(['success' => 'Password reset link has been sent to your email.']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Email could not be sent.']);
        }
    }
} else {
    // To prevent user enumeration, send a success message even if the email doesn't exist.
    echo json_encode(['success' => 'If an account with that email exists, a reset link has been sent.']);
}
?>