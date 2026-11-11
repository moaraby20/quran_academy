<?php
// api/students/update.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

// التأكد من وجود البيانات الأساسية لمنع أي أخطاء
if (!empty($id) && !empty($data->name) && !empty($data->teacher_id)) {
    try {
        // تم إزالة current_surah و current_juz من جملة التحديث
        // لحماية تقدم حفظ الطالب ومنع رسائل التحذير (Warnings)
        $query = "UPDATE students SET
                    name = :name,
                    parent_name = :parent_name,
                    parent_phone = :parent_phone,
                    teacher_id = :teacher_id,
                    package_name = :package_name,
                    package_size = :package_size,
                    completed_sessions = :completed_sessions,
                    subscription_fee = :subscription_fee,
                    notes = :notes,
                    status = :status
                  WHERE id = :id";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $id,
            ':name' => htmlspecialchars(strip_tags($data->name)),
            ':parent_name' => htmlspecialchars(strip_tags($data->parent_name ?? '')),
            ':parent_phone' => htmlspecialchars(strip_tags($data->parent_phone ?? '')),
            ':teacher_id' => $data->teacher_id,
            ':package_name' => $data->package_name ?? '',
            ':package_size' => (int)($data->package_size ?? 8),
            ':completed_sessions' => (int)($data->completed_sessions ?? 0),
            ':subscription_fee' => (float)($data->subscription_fee ?? 0),
            ':notes' => $data->notes ?? null,
            ':status' => $data->status ?? 'active'
        ]);

        json_response(200, ["message" => "تم تحديث بيانات الطالب بنجاح."]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في تحديث بيانات الطالب: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "البيانات الأساسية مطلوبة (الاسم والمعلم)."]);
}
