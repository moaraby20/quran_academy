<?php
// api/staff/delete.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id)) {
    try {
        // التحقق من حالة المستخدم المراد حذفه
        $check_stmt = $db->prepare("SELECT is_super_admin FROM staff_users WHERE id = :id");
        $check_stmt->execute([':id' => $id]);
        $staff = $check_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$staff) {
            json_response(404, ["message" => "المستخدم غير موجود."]);
        }

        if ($staff['is_super_admin'] == 1) {
            json_response(403, ["message" => "لا يمكن حذف حساب المدير العام للنظام."]);
        }

        if ($id === $user_data->id) {
            json_response(403, ["message" => "لا يمكنك حذف حسابك الشخصي."]);
        }

        $query = "DELETE FROM staff_users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $id]);

        json_response(200, ["message" => "تم حذف المستخدم الإداري بنجاح."]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في عملية الحذف: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف المستخدم مطلوب لحذفه."]);
}
