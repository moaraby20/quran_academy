<?php
// api/teachers/read.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

// التحقق من التوكن
$user_data = verify_token();
$db = (new Database())->connect();

try {
    // جلب بيانات المعلمين (بدون حقل الباسورد للحماية)
    $query = "SELECT id, name, title, gender, phone, email, rate_30, rate_45, rate_60, is_suspended, notes, status, created_at
              FROM teachers
              WHERE 1=1";
    $params = [];

    // التعديل الجوهري لحل المشكلة:
    // إذا كان المستخدم معلماً، يتم إجباره على رؤية بياناته وتأكيد تسعيرته هو فقط
    if ($user_data->role === 'teacher') {
        $query .= " AND id = :teacher_id";
        $params[':teacher_id'] = $user_data->id;
    }

    $query .= " ORDER BY created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(200, $teachers);
} catch (PDOException $e) {
    json_response(500, ["message" => "خطأ في جلب بيانات المعلمين: " . $e->getMessage()]);
}
