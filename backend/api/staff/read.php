<?php
// api/staff/read.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']);
$db = (new Database())->connect();

try {
    $query = "SELECT id, name, email, username, phone, role, is_super_admin, is_blocked, blocked_at, avatar, notes, created_at
              FROM staff_users ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();

    $staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(200, $staff);
} catch (PDOException $e) {
    json_response(500, ["message" => "خطأ: " . $e->getMessage()]);
}
