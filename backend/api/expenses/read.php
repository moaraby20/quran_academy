<?php
// api/expenses/read.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']); // أدمن فقط
$db = (new Database())->connect();

try {
    $query = "SELECT * FROM expenses WHERE 1=1";
    $params = [];

    if (isset($_GET['category']) && !empty($_GET['category'])) {
        $query .= " AND category = :category";
        $params[':category'] = $_GET['category'];
    }

    if (isset($_GET['month']) && !empty($_GET['month'])) {
        // فلترة بالشهر (مثل: 2026-09)
        $query .= " AND DATE_FORMAT(date, '%Y-%m') = :month";
        $params[':month'] = $_GET['month'];
    }

    $query .= " ORDER BY date DESC, created_at DESC";

    // 👈 إضافة الباجينيشن السلس والآمن
    if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
        $limit = max(1, (int)$_GET['limit']);
        $page = isset($_GET['page']) && is_numeric($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $offset = ($page - 1) * $limit;
        $query .= " LIMIT {$limit} OFFSET {$offset}";
    }

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(200, $expenses);
} catch (PDOException $e) {
    json_response(500, ["message" => "خطأ في جلب بيانات المصروفات: " . $e->getMessage()]);
}