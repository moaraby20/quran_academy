<?php
// api/expenses/update.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id) && !empty($data->title)) {
    try {
        $query = "UPDATE expenses SET
                  title = :title, amount = :amount, category = :category,
                  date = :date, notes = :notes
                  WHERE id = :id";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':title' => htmlspecialchars(strip_tags($data->title)),
            ':amount' => (float)$data->amount,
            ':category' => $data->category,
            ':date' => $data->date,
            ':notes' => $data->notes ?? null,
            ':id' => $id
        ]);

        json_response(200, ["message" => "تم تحديث المصروف بنجاح."]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في تحديث البيانات: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف المصروف والعنوان مطلوبان."]);
}
