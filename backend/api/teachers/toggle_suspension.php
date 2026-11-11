<?php
// api/teachers/toggle_suspension.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id)) {
    try {
        // جلب الحالة الحالية
        $check_stmt = $db->prepare("SELECT is_suspended FROM teachers WHERE id = :id LIMIT 1");
        $check_stmt->execute([':id' => $id]);
        $teacher = $check_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$teacher) json_response(404, ["message" => "المعلم غير موجود."]);

        $new_status = $teacher['is_suspended'] == 1 ? 0 : 1;
        $suspended_at = $new_status == 1 ? date('Y-m-d H:i:s') : null;

        $update_stmt = $db->prepare("UPDATE teachers SET is_suspended = :is_suspended, suspended_at = :suspended_at WHERE id = :id");
        $update_stmt->execute([
            ':is_suspended' => $new_status,
            ':suspended_at' => $suspended_at,
            ':id' => $id
        ]);

        $msg = $new_status == 1 ? "تم إيقاف حساب المعلم بنجاح." : "تم تفعيل حساب المعلم بنجاح.";
        json_response(200, ["message" => $msg]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ أثناء تغيير حالة الحساب: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف المعلم مطلوب."]);
}
