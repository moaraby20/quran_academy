<?php
// api/students/create.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->parent_phone) && !empty($data->teacher_id)) {
    try {
        $id = uniqid('s-');
        // تم إضافة completed_sessions
        $query = "INSERT INTO students
                  (id, name, parent_name, parent_phone, teacher_id, package_name, package_size, completed_sessions, subscription_fee, current_surah, current_juz, status, start_date, notes)
                  VALUES
                  (:id, :name, :parent_name, :parent_phone, :teacher_id, :package_name, :package_size, :completed_sessions, :subscription_fee, :current_surah, :current_juz, :status, :start_date, :notes)";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $id,
            ':name' => htmlspecialchars(strip_tags($data->name)),
            ':parent_name' => htmlspecialchars(strip_tags($data->parent_name ?? '')),
            ':parent_phone' => htmlspecialchars(strip_tags($data->parent_phone)),
            ':teacher_id' => $data->teacher_id,
            ':package_name' => $data->package_name ?? 'باقة 8 حصص',
            ':package_size' => $data->package_size ?? 8,
            ':completed_sessions' => $data->completed_sessions ?? 0, // <-- القيمة الجديدة
            ':subscription_fee' => $data->subscription_fee ?? 800,
            ':current_surah' => $data->current_surah ?? 'الفاتحة',
            ':current_juz' => $data->current_juz ?? 30,
            ':status' => $data->status ?? 'active',
            ':start_date' => $data->start_date ?? date('Y-m-d'),
            ':notes' => $data->notes ?? null
        ]);

        json_response(201, ["message" => "تم إضافة الطالب بنجاح.", "id" => $id]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في إنشاء ملف الطالب: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "البيانات الأساسية مطلوبة (الاسم، هاتف ولي الأمر، المعلم)."]);
}
