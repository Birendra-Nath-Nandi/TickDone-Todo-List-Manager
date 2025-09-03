<?php
session_start();
require 'db_config.php';

header('Content-Type: application/json');

// Security Check: If no user_id is in the session, deny access immediately.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['error' => 'Authentication required.']);
    exit();
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Only get todos WHERE user_id matches the logged-in user.
        $stmt = $conn->prepare("SELECT id, task, completed, position FROM todos WHERE user_id = :user_id ORDER BY position ASC");
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($todos as &$todo) {
            $todo['completed'] = (bool)$todo['completed'];
        }
        echo json_encode($todos);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'));
        $action = $data->action ?? null;

        switch ($action) {
            case 'create':
                if (!empty($data->text)) {
                    $posStmt = $conn->prepare("SELECT MAX(position) as max_pos FROM todos WHERE user_id = :user_id");
                    $posStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $posStmt->execute();
                    $maxPos = $posStmt->fetch(PDO::FETCH_ASSOC)['max_pos'];
                    $newPos = ($maxPos === null) ? 0 : $maxPos + 1;

                    // When creating a todo, INSERT it with the current user_id.
                    $stmt = $conn->prepare("INSERT INTO todos (task, position, user_id) VALUES (:task, :position, :user_id)");
                    $stmt->bindParam(':task', $data->text);
                    $stmt->bindParam(':position', $newPos, PDO::PARAM_INT);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->execute();
                    $lastId = $conn->lastInsertId();
                    echo json_encode(['id' => $lastId, 'task' => $data->text, 'completed' => false, 'position' => $newPos]);
                }
                break;
            
            case 'update_status':
                if (isset($data->id) && isset($data->completed)) {
                    // Update only if the todo ID belongs to the current user.
                    $stmt = $conn->prepare("UPDATE todos SET completed = :completed WHERE id = :id AND user_id = :user_id");
                    $stmt->bindParam(':completed', $data->completed, PDO::PARAM_BOOL);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->execute();
                    echo json_encode(['success' => true]);
                }
                break;

            case 'rename':
                if (isset($data->id) && isset($data->text)) {
                    // Rename only if the todo ID belongs to the current user.
                    $stmt = $conn->prepare("UPDATE todos SET task = :task WHERE id = :id AND user_id = :user_id");
                    $stmt->bindParam(':task', $data->text);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->execute();
                    echo json_encode(['success' => true]);
                }
                break;
            
            case 'delete':
                if (isset($data->id)) {
                    // Delete only if the todo ID belongs to the current user.
                    $stmt = $conn->prepare("DELETE FROM todos WHERE id = :id AND user_id = :user_id");
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->execute();
                    echo json_encode(['success' => true]);
                }
                break;

            case 'reorder':
                if (isset($data->order) && is_array($data->order)) {
                    $conn->beginTransaction();
                    foreach ($data->order as $index => $id) {
                        // Reorder only if the todo ID belongs to the current user.
                        $stmt = $conn->prepare("UPDATE todos SET position = :position WHERE id = :id AND user_id = :user_id");
                        $stmt->bindParam(':position', $index, PDO::PARAM_INT);
                        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
                        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                        $stmt->execute();
                    }
                    $conn->commit();
                    echo json_encode(['success' => true]);
                }
                break;
        }
        break;
}
?>