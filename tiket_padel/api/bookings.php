<?php
require_once "db.php";

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // ?user_id=xx -> booking per user
        if (isset($_GET['user_id'])) {
            $userId = (int)$_GET['user_id'];
            $stmt = $mysqli->prepare("
                SELECT b.id, u.username, t.name AS ticketName,
                       b.date, b.time, b.players,
                       b.payment_method AS paymentMethod,
                       b.status, b.total
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN ticket_types t ON b.ticket_type_id = t.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
            ");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $res = $stmt->get_result();
        } else {
            // semua booking (admin)
            $res = $mysqli->query("
                SELECT b.id, u.username, t.name AS ticketName,
                       b.date, b.time, b.players,
                       b.payment_method AS paymentMethod,
                       b.status, b.total
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN ticket_types t ON b.ticket_type_id = t.id
                ORDER BY b.created_at DESC
            ");
        }

        $bookings = [];
        while ($row = $res->fetch_assoc()) {
            $row['players'] = (int)$row['players'];
            $row['total'] = (int)$row['total'];
            $bookings[] = $row;
        }
        echo json_encode($bookings);
        break;

    case 'POST':
        // buat booking
        $data = json_decode(file_get_contents("php://input"), true);

        $userId = (int)($data['user_id'] ?? 0);
        $ticketTypeId = (int)($data['ticket_type_id'] ?? 0);
        $date = $data['date'] ?? '';
        $time = $data['time'] ?? '';
        $players = (int)($data['players'] ?? 1);
        $paymentMethod = $data['payment_method'] ?? 'QRIS';

        if (!$userId || !$ticketTypeId || !$date || !$time) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Data booking tidak lengkap"]);
            exit;
        }

        // ambil harga
        $stmt = $mysqli->prepare("SELECT price, name FROM ticket_types WHERE id = ?");
        $stmt->bind_param("i", $ticketTypeId);
        $stmt->execute();
        $ticket = $stmt->get_result()->fetch_assoc();

        if (!$ticket) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Jenis tiket tidak ditemukan"]);
            exit;
        }

        $total = (int)$ticket['price'] * $players;

        $stmt = $mysqli->prepare("
            INSERT INTO bookings (user_id, ticket_type_id, date, time, players, payment_method, status, total)
            VALUES (?, ?, ?, ?, ?, ?, 'Belum Bayar', ?)
        ");
        $stmt->bind_param("iissisi", $userId, $ticketTypeId, $date, $time, $players, $paymentMethod, $total);
        $stmt->execute();

        echo json_encode(["success" => true, "id" => $mysqli->insert_id]);
        break;

    case 'PUT':
        // update status (bayar / konfirmasi)
        $data = json_decode(file_get_contents("php://input"), true);
        $id = (int)($data['id'] ?? 0);
        $status = $data['status'] ?? '';

        $allowed = ['Belum Bayar','Menunggu Konfirmasi','Lunas'];
        if (!$id || !in_array($status, $allowed)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID/status tidak valid"]);
            exit;
        }

        $stmt = $mysqli->prepare("UPDATE bookings SET status = ? WHERE id = ?");
        $stmt->bind_param("si", $status, $id);
        $stmt->execute();

        echo json_encode(["success" => true]);
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID booking dibutuhkan"]);
            exit;
        }
        $id = (int)$_GET['id'];
        $stmt = $mysqli->prepare("DELETE FROM bookings WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        echo json_encode(["success" => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method tidak didukung"]);
}
