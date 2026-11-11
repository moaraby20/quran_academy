<?php
// students/read_one.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token();
$db = (new Database())->connect();
$id = $_GET['id'] ?? null;

if ($id) {
    try {
        $query = "SELECT s.*, t.name as teacher_name
                  FROM students s
                  LEFT JOIN teachers t ON s.teacher_id = t.id
                  WHERE s.id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $id]);

        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($student) {
            // منع المعلم من استعراض بيانات طالب لا يتبعه
            if ($user_data->role === 'teacher' && $student['teacher_id'] !== $user_data->id) {
                json_response(403, ["message" => "غير مصرح لك باستعراض بيانات هذا الطالب."]);
            }
            json_response(200, $student);
        } else {
            json_response(404, ["message" => "الطالب غير موجود."]);
        }
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في جلب بيانات الطالب: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف الطالب مطلوب."]);
}
