<?php
// api/expenses/create.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->title) && !empty($data->amount) && !empty($data->date)) {
    try {
        $id = uniqid('exp-');
        $query = "INSERT INTO expenses (id, title, amount, category, date, notes)
                  VALUES (:id, :title, :amount, :category, :date, :notes)";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $id,
            ':title' => htmlspecialchars(strip_tags($data->title)),
            ':amount' => (float)$data->amount,
            ':category' => $data->category ?? 'operational',
            ':date' => $data->date,
            ':notes' => $data->notes ?? null
        ]);

        json_response(201, ["message" => "تم تسجيل المصروف بنجاح.", "id" => $id]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في تسجيل المصروف: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "البيانات الأساسية مطلوبة (العنوان، المبلغ، التاريخ)."]);
}
