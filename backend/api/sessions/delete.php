<?php
// api/sessions/delete.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token();
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id)) {
    try {
        $db->beginTransaction();

        $check_stmt = $db->prepare("SELECT student_id, teacher_id, settled FROM sessions WHERE id = :id");
        $check_stmt->execute([':id' => $id]);
        $session = $check_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) json_response(404, ["message" => "الحصة غير موجودة."]);

        if ($session['settled'] == 1) {
            json_response(409, ["message" => "لا يمكن حذف حصة تم تسوية حسابها (مدفوعة للمعلم)."]);
        }

        if ($user_data->role === 'teacher' && $session['teacher_id'] !== $user_data->id) {
            json_response(403, ["message" => "غير مصرح لك بحذف هذه الحصة."]);
        }

        // حذف الحصة
        $stmt = $db->prepare("DELETE FROM sessions WHERE id = :id");
        $stmt->execute([':id' => $id]);

        // إنقاص عدد حصص الطالب المنجزة
        $updateStudent = $db->prepare("UPDATE students SET completed_sessions = GREATEST(completed_sessions - 1, 0) WHERE id = :student_id");
        $updateStudent->execute([':student_id' => $session['student_id']]);

        $db->commit();
        json_response(200, ["message" => "تم حذف الحصة بنجاح وتعديل رصيد الطالب."]);
    } catch (Exception $e) {
        $db->rollBack();
        json_response(500, ["message" => "خطأ في عملية الحذف: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف الحصة مطلوب."]);
}
