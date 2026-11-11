<?php
// auth/me.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token();
$db = (new Database())->connect();

try {
    if ($user_data->role === 'teacher') {
        $stmt = $db->prepare("SELECT id, name, email, phone, title, rate_30, rate_45, rate_60, avatar FROM teachers WHERE id = :id LIMIT 1");
    } else {
        $stmt = $db->prepare("SELECT id, name, email, username, phone, role, avatar FROM staff_users WHERE id = :id LIMIT 1");
    }

    $stmt->execute([':id' => $user_data->id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $user['role'] = $user_data->role;
        json_response(200, $user);
    } else {
        json_response(404, ["message" => "لم يتم العثور على بيانات المستخدم."]);
    }
} catch (PDOException $e) {
    json_response(500, ["message" => "خطأ في النظام: " . $e->getMessage()]);
}
