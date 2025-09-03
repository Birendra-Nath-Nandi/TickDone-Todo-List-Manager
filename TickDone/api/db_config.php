<?php
// db_config.php
$servername = "sql100.infinityfree.com";
$username = "if0_39836378";
$password = "ON3cKf0gSwnifCY";
$dbname = "if0_39836378_todos";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    // In a real app, you'd log this error, not echo it
    die(json_encode(['error' => "Database connection failed."])); 
}
?>