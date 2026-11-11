<?php
// api/teachers/settle_wages.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->teacher_id) && isset($data->session_ids) && is_array($data->session_ids)) {
    try {
        $db->beginTransaction();

        // جلب اسم المعلم لاستخدامه في عنوان المصروف
        $stmtTeacher = $db->prepare("SELECT name FROM teachers WHERE id = :id");
        $stmtTeacher->execute([':id' => $data->teacher_id]);
        $teacherName = $stmtTeacher->fetchColumn() ?: 'معلم';

        $settlementId = uniqid('stl-');
        $amount = $data->amount ?? 0;
        $sessions_count = count($data->session_ids);
        $notes = $data->notes ?? null;

        $expense_id = null;

        // 1. إذا طلب المستخدم تسجيلها كمصروف، ننشئ المصروف أولاً ونحتفظ بالـ ID
        if (isset($data->record_as_expense) && $data->record_as_expense) {
            $expense_id = uniqid('exp-');
            $exp_title = "صرف مستحقات المعلم: " . $teacherName . " (" . $sessions_count . " حصة)";
            $exp_notes = $notes ? "تسوية وتصفير الرصيد المستحق - " . $notes : "تسوية وتصفير الرصيد المستحق";

            $expQuery = "INSERT INTO expenses (id, title, amount, category, date, notes)
                         VALUES (:id, :title, :amount, 'salaries', CURRENT_DATE, :notes)";
            $stmtExp = $db->prepare($expQuery);
            $stmtExp->execute([
                ':id' => $expense_id,
                ':title' => $exp_title,
                ':amount' => (float)$amount,
                ':notes' => $exp_notes
            ]);
        }

        // 2. إنشاء سجل التسوية وربطه بـ expense_id
        $insertQuery = "INSERT INTO teacher_settlements (id, teacher_id, amount, sessions_count, settled_at, notes, expense_id)
                        VALUES (:id, :teacher_id, :amount, :sessions_count, CURRENT_DATE, :notes, :expense_id)";
        $stmtInsert = $db->prepare($insertQuery);
        $stmtInsert->execute([
            ':id' => $settlementId,
            ':teacher_id' => $data->teacher_id,
            ':amount' => (float)$amount,
            ':sessions_count' => $sessions_count,
            ':notes' => $notes,
            ':expense_id' => $expense_id
        ]);

        // 3. تحديث الحصص لتصبح مدفوعة وربطها برقم التسوية
        $placeholders = implode(',', array_fill(0, count($data->session_ids), '?'));
        $updateSessionsQuery = "UPDATE sessions SET settled = 1, settled_at = CURRENT_TIMESTAMP, settlement_id = ?
                                WHERE id IN ($placeholders) AND teacher_id = ?";

        $stmtUpdate = $db->prepare($updateSessionsQuery);
        $params = [$settlementId];
        foreach ($data->session_ids as $sessionId) {
            $params[] = $sessionId;
        }
        $params[] = $data->teacher_id;
        $stmtUpdate->execute($params);

        $db->commit();
        json_response(200, ["message" => "تم تصفية المستحقات وتسجيلها بنجاح."]);
    } catch (PDOException $e) {
        $db->rollBack();
        json_response(500, ["message" => "خطأ أثناء إجراء التسوية: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "يجب تحديد المعلم واختيار الحصص المراد تصفيتها."]);
}
