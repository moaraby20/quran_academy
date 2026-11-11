<?php
// api/staff/toggle_block.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id)) {
    try {
        $check = $db->prepare("SELECT is_blocked, is_super_admin FROM staff_users WHERE id = :id");
        $check->execute([':id' => $id]);
        $staff = $check->fetch(PDO::FETCH_ASSOC);

        if (!$staff) json_response(404, ["message" => "المستخدم غير موجود."]);
        if ($staff['is_super_admin'] == 1) json_response(403, ["message" => "لا يمكن حظر المدير العام."]);

        $new_status = $staff['is_blocked'] == 1 ? 0 : 1;
        $blocked_at = $new_status == 1 ? date('Y-m-d H:i:s') : null;

        $update = $db->prepare("UPDATE staff_users SET is_blocked = :is_blocked, blocked_at = :blocked_at WHERE id = :id");
        $update->execute([':is_blocked' => $new_status, ':blocked_at' => $blocked_at, ':id' => $id]);

        $msg = $new_status == 1 ? "تم حظر المستخدم بنجاح." : "تم إلغاء الحظر بنجاح.";
        json_response(200, ["message" => $msg]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "المعرف مطلوب."]);
}
