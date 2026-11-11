<?php
// api/sessions/read.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(); // متاح للكل (معلم، مشرف، مدير)
$db = (new Database())->connect();

try {
    $query = "SELECT s.*, st.name as student_name, t.name as teacher_name
              FROM sessions s
              LEFT JOIN students st ON s.student_id = st.id
              LEFT JOIN teachers t ON s.teacher_id = t.id
              WHERE 1=1";
    $params = [];

    // إذا كان المستخدم معلماً، يُجبر على رؤية حصصه فقط
    if ($user_data->role === 'teacher') {
        $query .= " AND s.teacher_id = :teacher_id";
        $params[':teacher_id'] = $user_data->id;
    } else if (isset($_GET['teacher_id']) && !empty($_GET['teacher_id'])) {
        $query .= " AND s.teacher_id = :teacher_id";
        $params[':teacher_id'] = $_GET['teacher_id'];
    }

    if (isset($_GET['student_id']) && !empty($_GET['student_id'])) {
        $query .= " AND s.student_id = :student_id";
        $params[':student_id'] = $_GET['student_id'];
    }

    if (isset($_GET['date']) && !empty($_GET['date'])) {
        $query .= " AND s.date = :date";
        $params[':date'] = $_GET['date'];
    }

    if (isset($_GET['settled']) && $_GET['settled'] !== '') {
        $query .= " AND s.settled = :settled";
        $params[':settled'] = (int)$_GET['settled'];
    }

    if (isset($_GET['search']) && !empty(trim($_GET['search']))) {
        $search = '%' . trim($_GET['search']) . '%';
        $query .= " AND (
            st.name LIKE :search OR
            st.parent_phone LIKE :search OR
            t.name LIKE :search OR
            s.new_memorization LIKE :search OR
            s.topic LIKE :search
        )";
        $params[':search'] = $search;
    }

    $query .= " ORDER BY s.date DESC, s.created_at DESC";

    // إضافة الباجينيشن (Pagination) السلس والآمن
    // إذا لم تقم الواجهة بإرسال limit، سيعمل الملف كما كان للحفاظ على لوحة المؤشرات
    if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
        $limit = max(1, (int)$_GET['limit']);
        $page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $offset = ($page - 1) * $limit;
        $query .= " LIMIT {$limit} OFFSET {$offset}";
    }

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(200, $sessions);
} catch (PDOException $e) {
    json_response(500, ["message" => "خطأ في جلب بيانات الحصص: " . $e->getMessage()]);
}