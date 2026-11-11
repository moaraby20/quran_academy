<?php
// api/students/read_renewals.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

// التحقق من التوكن وصلاحيات المستخدم
$user_data = verify_token();
$db = (new Database())->connect();

try {
    // جلب التجديدات وربطها بجدول الطلاب لجلب اسم الطالب
    $query = "SELECT r.*, s.name as student_name
              FROM student_renewals r
              LEFT JOIN students s ON r.student_id = s.id
              WHERE 1=1";
    $params = [];

    // إذا كان المستخدم معلماً، يُجبر على رؤية تجديدات طلابه فقط
    if ($user_data->role === 'teacher') {
        $query .= " AND s.teacher_id = :teacher_id";
        $params[':teacher_id'] = $user_data->id;
    }

    // التعديل هنا: استخدام renewed_at بدلاً من created_at
    $query .= " ORDER BY r.renewed_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $renewals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // إرجاع النتيجة باستخدام دالة الاستجابة الموحدة
    json_response(200, $renewals);
} catch (PDOException $e) {
    // معالجة الأخطاء
    json_response(500, ["message" => "خطأ في جلب بيانات التجديدات: " . $e->getMessage()]);
}
