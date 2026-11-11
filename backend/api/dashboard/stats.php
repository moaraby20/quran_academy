<?php
// api/dashboard/stats.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']);
$db = (new Database())->connect();

try {
    $stats = [];
    $params = [];

    // بناء شرط التاريخ ديناميكياً
    $date_condition_template = "1=1";

    if (isset($_GET['month']) && !empty($_GET['month'])) {
        $date_condition_template = "DATE_FORMAT(%s, '%%Y-%%m') = :month";
        $params[':month'] = $_GET['month'];
    } elseif (!empty($_GET['start_date']) || !empty($_GET['end_date'])) {
        $start = !empty($_GET['start_date']) ? $_GET['start_date'] : '2000-01-01';
        $end = !empty($_GET['end_date']) ? $_GET['end_date'] : '2099-12-31';
        $date_condition_template = "%s BETWEEN :start_date AND :end_date";
        $params[':start_date'] = $start;
        $params[':end_date'] = $end;
    }

    // 1. عدد الطلاب النشطين (دائماً شامل)
    $stmt = $db->query("SELECT COUNT(*) as total FROM students WHERE status IN ('active', 'renewal_due')");
    $stats['total_active_students'] = $stmt->fetch()['total'];

    // 2. عدد المعلمين النشطين (دائماً شامل)
    $stmt = $db->query("SELECT COUNT(*) as total FROM teachers WHERE status = 'active' AND is_suspended = 0");
    $stats['total_active_teachers'] = $stmt->fetch()['total'];

    // 3. عدد الحصص
    $cond = sprintf($date_condition_template, 'date');
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM sessions WHERE $cond");
    $stmt->execute($params);
    $stats['sessions_count'] = $stmt->fetch()['total'];

    // 4. إيرادات الطلاب الجدد
    $cond = sprintf($date_condition_template, 'start_date');
    $stmt = $db->prepare("SELECT COALESCE(SUM(subscription_fee), 0) as total FROM students WHERE $cond");
    $stmt->execute($params);
    $stats['new_students_revenue'] = (float)$stmt->fetch()['total'];

    // 5. إيرادات التجديدات (تم تصحيح اسم الحقل هنا)
    $cond = sprintf($date_condition_template, 'renewed_at');
    $stmt = $db->prepare("SELECT COALESCE(SUM(subscription_fee), 0) as total FROM student_renewals WHERE $cond");
    $stmt->execute($params);
    $stats['renewals_revenue'] = (float)$stmt->fetch()['total'];

    // 6. المصروفات
    $cond = sprintf($date_condition_template, 'date');
    $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total_amount, COUNT(*) as exp_count FROM expenses WHERE $cond");
    $stmt->execute($params);
    $exp_row = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['total_expenses'] = (float)$exp_row['total_amount'];
    $stats['expenses_count'] = (int)$exp_row['exp_count'];

    // 7. الحسابات النهائية
    $stats['total_revenue'] = $stats['new_students_revenue'] + $stats['renewals_revenue'];
    $stats['net_profit'] = $stats['total_revenue'] - $stats['total_expenses'];
    $stats['profit_margin'] = $stats['total_revenue'] > 0 ? round(($stats['net_profit'] / $stats['total_revenue']) * 100) : 0;

    // 8. جلب الشهور المتاحة للفلتر بذكاء من كل الجداول
    $months_query = "
        SELECT DATE_FORMAT(date, '%Y-%m') as m FROM sessions WHERE date IS NOT NULL
        UNION
        SELECT DATE_FORMAT(date, '%Y-%m') as m FROM expenses WHERE date IS NOT NULL
        UNION
        SELECT DATE_FORMAT(start_date, '%Y-%m') as m FROM students WHERE start_date IS NOT NULL
        UNION
        SELECT DATE_FORMAT(renewed_at, '%Y-%m') as m FROM student_renewals WHERE renewed_at IS NOT NULL
        ORDER BY m DESC
    ";
    $months_stmt = $db->query($months_query);
    $stats['available_months'] = $months_stmt->fetchAll(PDO::FETCH_COLUMN);

    json_response(200, $stats);
} catch (PDOException $e) {
    json_response(500, ["message" => "خطأ في جلب الإحصائيات: " . $e->getMessage()]);
}