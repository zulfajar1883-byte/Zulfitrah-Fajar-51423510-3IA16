<?php
require_once "db.php";

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $res = $mysqli->query("SELECT id, name, price FROM ticket_types ORDER BY id DESC");
        $tickets = [];
        while ($row = $res->fetch_assoc()) {
            $row['price'] = (int)$row['price'];
            $tickets[] = $row;
        }
        echo json_encode($tickets);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $name = $data['name'] ?? '';
        $price = (int)($data['price'] ?? 0);

        if (!$name || !$price) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Nama & harga wajib diisi"]);
            exit;
        }

        $stmt = $mysqli->prepare("INSERT INTO ticket_types (name, price) VALUES (?, ?)");
        $stmt->bind_param("si", $name, $price);
        $stmt->execute();

        echo json_encode(["success" => true, "id" => $mysqli->insert_id]);
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID tiket dibutuhkan"]);
            exit;
        }
        $id = (int)$_GET['id'];
        $data = json_decode(file_get_contents("php://input"), true);
        $name = $data['name'] ?? '';
        $price = (int)($data['price'] ?? 0);

        $stmt = $mysqli->prepare("UPDATE ticket_types SET name = ?, price = ? WHERE id = ?");
        $stmt->bind_param("sii", $name, $price, $id);
        $stmt->execute();

        echo json_encode(["success" => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID tiket dibutuhkan"]);
            exit;
        }
        $id = (int)$_GET['id'];
        $stmt = $mysqli->prepare("DELETE FROM ticket_types WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        echo json_encode(["success" => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
}
 