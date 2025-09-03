<?php
// db_config.php for LOCAL XAMPP environment
$servername = "localhost";
$username = "root";
$password = ""; // Default XAMPP password is empty
$dbname = "tickdone_db"; // The new database you just created

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => "Database connection failed."])); 
}
?>