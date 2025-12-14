<?php
require_once "db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method tidak didukung"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');
$name     = trim($data['name'] ?? '');

// validasi basic
if (!$username || !$password) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Username dan password wajib diisi."
    ]);
    exit;
}

// kalau name kosong, pakai username
if ($name === '') {
    $name = $username;
}

// cek username sudah dipakai atau belum
$stmt = $mysqli->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();

if ($res->fetch_assoc()) {
    http_response_code(409);
    echo json_encode([
        "success" => false,
        "message" => "Username sudah digunakan. Silakan pilih yang lain."
    ]);
    exit;
}

// insert user baru, role selalu 'user'
$stmt = $mysqli->prepare("
    INSERT INTO users (username, password, name, role)
    VALUES (?, ?, ?, 'user')
");
$stmt->bind_param("sss", $username, $password, $name);
$stmt->execute();

$userId = $mysqli->insert_id;

echo json_encode([
    "success" => true,
    "user" => [
        "id" => $userId,
        "username" => $username,
        "name" => $name,
        "role" => "user"
    ]
]);
