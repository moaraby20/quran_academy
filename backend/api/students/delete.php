<?php
// students/delete.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id)) {
    try {
        $query = "DELETE FROM students WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() > 0) {
            json_response(200, ["message" => "تم حذف الطالب وارتباطاته بنجاح."]);
        } else {
            json_response(404, ["message" => "الطالب غير موجود."]);
        }
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في عملية الحذف: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف الطالب مطلوب لحذفه."]);
}
