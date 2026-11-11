<?php
// api/sessions/mark_report_sent.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token();
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id)) {
    try {
        $query = "UPDATE sessions SET report_sent = 1 WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $id]);

        json_response(200, ["message" => "تم تحديث حالة التقرير بنجاح."]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف الحصة مطلوب."]);
}
