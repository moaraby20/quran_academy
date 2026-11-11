<?php
// api/settlements/read.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token();
$db = (new Database())->connect();

try {
    // نفترض أن جدول التسويات اسمه teacher_settlements
    $query = "SELECT s.*, t.name as teacher_name
              FROM teacher_settlements s
              LEFT JOIN teachers t ON s.teacher_id = t.id
              WHERE 1=1";
    $params = [];

    // إذا كان المستخدم معلماً، يرى تسوياته هو فقط
    if ($user_data->role === 'teacher') {
        $query .= " AND s.teacher_id = :teacher_id";
        $params[':teacher_id'] = $user_data->id;
    }

    $query .= " ORDER BY s.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $settlements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(200, $settlements);
} catch (PDOException $e) {
    json_response(500, ["message" => "خطأ في جلب بيانات التسويات: " . $e->getMessage()]);
}
