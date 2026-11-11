<?php
// api/teachers/read_one.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$id = $_GET['id'] ?? null;

if ($id) {
    try {
        $query = "SELECT id, name, phone, email, title, gender, rate_30, rate_45, rate_60, status, is_suspended, joined_date, avatar, notes
                  FROM teachers
                  WHERE id = :id LIMIT 1";
        $stmt = $db->prepare($query);
        $stmt->execute([':id' => $id]);

        $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($teacher) {
            json_response(200, $teacher);
        } else {
            json_response(404, ["message" => "المعلم غير موجود."]);
        }
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في جلب بيانات المعلم: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف المعلم مطلوب."]);
}
