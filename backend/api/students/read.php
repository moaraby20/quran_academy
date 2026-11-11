<?php
// api/students/read.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token();
$db = (new Database())->connect();

try {
    $query = "SELECT s.*, t.name as teacher_name
              FROM students s
              LEFT JOIN teachers t ON s.teacher_id = t.id
              WHERE 1=1";
    $params = [];

    // السماح بجلب جميع الطلاب، مع إمكانية الفلترة إذا تم تمرير teacher_id
    if (isset($_GET['teacher_id']) && !empty($_GET['teacher_id'])) {
        $query .= " AND s.teacher_id = :teacher_id";
        $params[':teacher_id'] = $_GET['teacher_id'];
    }

    if (isset($_GET['status']) && !empty($_GET['status'])) {
        // فلترة مخصصة لحالة التجديد (سواء من الحالة أو من انتهاء الحصص)
        if ($_GET['status'] === 'renewal_due') {
            $query .= " AND (s.status = 'renewal_due' OR s.completed_sessions >= s.package_size)";
        } else if ($_GET['status'] === 'active') {
            $query .= " AND s.status = 'active' AND s.completed_sessions < s.package_size";
        } else {
            $query .= " AND s.status = :status";
            $params[':status'] = $_GET['status'];
        }
    }

    if (isset($_GET['search']) && !empty(trim($_GET['search']))) {
        $query .= " AND (s.name LIKE :search OR s.parent_name LIKE :search OR s.parent_phone LIKE :search)";
        $params[':search'] = '%' . trim($_GET['search']) . '%';
    }

    $query .= " ORDER BY s.created_at DESC";

    // إضافة الباجينيشن السلس
    if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
        $limit = max(1, (int)$_GET['limit']);
        $page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $offset = ($page - 1) * $limit;
        $query .= " LIMIT {$limit} OFFSET {$offset}";
    }

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(200, $students);
} catch (PDOException $e) {
    json_response(500, ["message" => "خطأ في جلب بيانات الطلاب: " . $e->getMessage()]);
}