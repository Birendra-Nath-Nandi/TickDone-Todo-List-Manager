<?php
session_start();
require 'db_config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required.']);
    exit();
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? null;

if ($method === 'GET') {
    if ($resource === 'initial_data') {
        // Fetch lists
        $lists_stmt = $conn->prepare("SELECT id, name FROM lists WHERE user_id = :user_id ORDER BY name ASC");
        $lists_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $lists_stmt->execute();
        $lists = $lists_stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch todos
        $todos_stmt = $conn->prepare("SELECT id, task, completed, due_date, list_id, position FROM todos WHERE user_id = :user_id ORDER BY position ASC");
        $todos_stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $todos_stmt->execute();
        $todos = $todos_stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($todos as &$todo) {
            $todo['completed'] = (bool)$todo['completed'];
        }

        echo json_encode(['lists' => $lists, 'todos' => $todos]);

    } elseif ($resource === 'todos' && isset($_GET['id'])) {
        $todo_id = $_GET['id'];
        
        $stmt = $conn->prepare("SELECT id, task, description, completed, due_date, list_id FROM todos WHERE id = :id AND user_id = :user_id");
        $stmt->bindParam(':id', $todo_id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $todo = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($todo) {
            $todo['completed'] = (bool)$todo['completed'];
            echo json_encode($todo);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Task not found.']);
        }
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'));
    $action = $data->action ?? null;

    if ($resource === 'todos') {
        switch ($action) {
             case 'create':
                if (!empty($data->text) && isset($data->list_id)) {
                    $posStmt = $conn->prepare("SELECT MAX(position) as max_pos FROM todos WHERE user_id = :user_id AND list_id = :list_id");
                    $posStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $posStmt->bindParam(':list_id', $data->list_id, PDO::PARAM_INT);
                    $posStmt->execute();
                    $maxPos = $posStmt->fetch(PDO::FETCH_ASSOC)['max_pos'];
                    $newPos = ($maxPos === null) ? 0 : $maxPos + 1;

                    $stmt = $conn->prepare("INSERT INTO todos (task, description, position, list_id, user_id, due_date) VALUES (:task, :description, :position, :list_id, :user_id, :due_date)");
                    $stmt->bindParam(':task', $data->text);
                    $stmt->bindValue(':description', $data->description ?? '');
                    $stmt->bindParam(':position', $newPos, PDO::PARAM_INT);
                    $stmt->bindParam(':list_id', $data->list_id, PDO::PARAM_INT);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->bindParam(':due_date', $data->due_date);
                    $stmt->execute();
                    $lastId = $conn->lastInsertId();
                    echo json_encode(['id' => $lastId, 'task' => $data->text, 'completed' => false, 'position' => $newPos, 'list_id' => $data->list_id, 'due_date' => $data->due_date]);
                }
                break;
            case 'update_details':
                if (isset($data->id)) {
                    $stmt = $conn->prepare("UPDATE todos SET task = :task, description = :description, list_id = :list_id, due_date = :due_date WHERE id = :id AND user_id = :user_id");
                    $stmt->bindParam(':task', $data->task);
                    $stmt->bindParam(':description', $data->description);
                    $stmt->bindParam(':list_id', $data->list_id, PDO::PARAM_INT);
                    $stmt->bindParam(':due_date', $data->due_date);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->execute();
                    echo json_encode(['success' => true]);
                }
                break;
            case 'update_status':
                 if (isset($data->id) && isset($data->completed)) {
                    $stmt = $conn->prepare("UPDATE todos SET completed = :completed WHERE id = :id AND user_id = :user_id");
                    $stmt->bindParam(':completed', $data->completed, PDO::PARAM_BOOL);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->execute();
                    echo json_encode(['success' => true]);
                }
                break;
            case 'delete':
                if (isset($data->id)) {
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
    } elseif ($resource === 'lists') {
         switch ($action) {
            case 'create':
                if (!empty($data->name)) {
                    $stmt = $conn->prepare("INSERT INTO lists (name, user_id) VALUES (:name, :user_id)");
                    $stmt->bindParam(':name', $data->name);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                    $stmt->execute();
                    $lastId = $conn->lastInsertId();
                    echo json_encode(['id' => $lastId, 'name' => $data->name]);
                }
                break;
            case 'delete':
                if (!empty($data->id)) {
                    $list_id = $data->id;
                    $stmt = $conn->prepare("DELETE FROM lists WHERE id = :id AND user_id = :user_id");
                    $stmt->bindParam(':id', $list_id, PDO::PARAM_INT);
                    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);

                    if ($stmt->execute()) {
                        echo json_encode(['success' => true]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['error' => 'Failed to delete list.']);
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'List ID not provided.']);
                }
                break;
        }
    }
}
?>