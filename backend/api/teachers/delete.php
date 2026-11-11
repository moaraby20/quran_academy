<?php
// api/teachers/delete.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']); // مقصور على الأدمن بناءً على طلبك[cite: 1]
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id)) {
    try {
        $query = "DELETE FROM teachers WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() > 0) {
            json_response(200, ["message" => "تم حذف المعلم بنجاح."]);
        } else {
            json_response(404, ["message" => "المعلم غير موجود."]);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == '23000') {
            json_response(409, ["message" => "لا يمكن حذف المعلم لوجود طلاب أو حصص مرتبطة به. يفضل إيقاف حسابه بدلاً من حذفه."]);
        } else {
            json_response(500, ["message" => "خطأ في عملية الحذف: " . $e->getMessage()]);
        }
    }
} else {
    json_response(400, ["message" => "معرف المعلم مطلوب لحذفه."]);
}
