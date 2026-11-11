<?php
// students/renew_package.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->studentId) && !empty($data->package_name) && isset($data->package_size) && isset($data->subscription_fee)) {
    try {
        $db->beginTransaction();

        // 1. تصفير الحصص وتحديث الباقة في جدول الطلاب
        $updateQuery = "UPDATE students SET
                        package_name = :package_name,
                        package_size = :package_size,
                        subscription_fee = :subscription_fee,
                        completed_sessions = 0,
                        status = 'active',
                        start_date = CURRENT_DATE
                        WHERE id = :id";
        $stmtUpdate = $db->prepare($updateQuery);
        $stmtUpdate->execute([
            ':package_name' => htmlspecialchars(strip_tags($data->package_name)),
            ':package_size' => (int)$data->package_size,
            ':subscription_fee' => (float)$data->subscription_fee,
            ':id' => $data->studentId
        ]);

        // 2. إدراج العملية في أرشيف التجديدات للإيرادات
        $renewalId = uniqid('rnw-');
        $insertQuery = "INSERT INTO student_renewals
                        (id, student_id, package_name, package_size, subscription_fee, notes)
                        VALUES (:id, :student_id, :package_name, :package_size, :subscription_fee, :notes)";
        $stmtInsert = $db->prepare($insertQuery);
        $stmtInsert->execute([
            ':id' => $renewalId,
            ':student_id' => $data->studentId,
            ':package_name' => htmlspecialchars(strip_tags($data->package_name)),
            ':package_size' => (int)$data->package_size,
            ':subscription_fee' => (float)$data->subscription_fee,
            ':notes' => $data->notes ?? null
        ]);

        $db->commit();
        json_response(200, ["message" => "تم تجديد الباقة وتصفير الحصص بنجاح."]);
    } catch (PDOException $e) {
        $db->rollBack();
        json_response(500, ["message" => "خطأ أثناء التجديد: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "جميع بيانات التجديد (معرف الطالب، الباقة، الحصص، والمبلغ) مطلوبة."]);
}
