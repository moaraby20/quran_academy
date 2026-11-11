<?php
// api/settlements/revert.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token();

// حماية إضافية: منع المعلم من التراجع عن تسوياته
if ($user_data->role === 'teacher') {
    json_response(403, ["message" => "غير مصرح لك بتنفيذ هذا الإجراء."]);
}

$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || empty($data->id)) {
    json_response(400, ["message" => "معرف التسوية مطلوب."]);
}

try {
    $db->beginTransaction();

    // 1. جلب معرف المصروف (إن وجد) المرتبط بهذه التسوية قبل حذفها
    $stmt_get = $db->prepare("SELECT expense_id FROM teacher_settlements WHERE id = :id");
    $stmt_get->execute([':id' => $data->id]);
    $settlement = $stmt_get->fetch(PDO::FETCH_ASSOC);
    $expense_id = $settlement ? $settlement['expense_id'] : null;

    // 2. إعادة الحصص المرتبطة بهذه التسوية إلى حالة "مستحقة" (ومسح تواريخ التسوية)
    $update_query = "UPDATE sessions SET settled = 0, settlement_id = NULL, settled_at = NULL WHERE settlement_id = :id";
    $stmt_update = $db->prepare($update_query);
    $stmt_update->execute([':id' => $data->id]);

    // 3. حذف سجل التسوية
    $delete_query = "DELETE FROM teacher_settlements WHERE id = :id";
    $stmt_delete = $db->prepare($delete_query);
    $stmt_delete->execute([':id' => $data->id]);

    // 4. حذف المصروف المرتبط (إن وُجد)
    if ($expense_id) {
        $delete_exp_query = "DELETE FROM expenses WHERE id = :expense_id";
        $stmt_delete_exp = $db->prepare($delete_exp_query);
        $stmt_delete_exp->execute([':expense_id' => $expense_id]);
    }

    $db->commit();
    json_response(200, ["message" => "تم التراجع عن التسوية بنجاح واستعادة الحصص، وحذف المصروف المرتبط."]);
} catch (PDOException $e) {
    $db->rollBack();
    json_response(500, ["message" => "خطأ أثناء التراجع عن التسوية: " . $e->getMessage()]);
}
