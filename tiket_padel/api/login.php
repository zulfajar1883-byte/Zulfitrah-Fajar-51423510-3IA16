<?php
require_once "db.php"; // WAJIB ADA

$input = json_decode(file_get_contents("php://input"), true);

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Username dan password wajib diisi"
    ]);
    exit;
}

// Ambil user berdasarkan username
$stmt = $mysqli->prepare(
    "SELECT id, username, password, name, role FROM users WHERE username = ?"
);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Username atau password salah"
    ]);
    exit;
}

// password tanpa hashing (karena kita pakai plain text di DB)
if ($user['password'] !== $password) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Username atau password salah"
    ]);
    exit;
}

// hapus password dari output
unset($user['password']);

echo json_encode([
    "success" => true,
    "user" => $user
]);
