<?php
// api/teachers/update.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id) && !empty($data->name)) {
    try {
        $query = "UPDATE teachers SET
                  name = :name, phone = :phone, email = :email,
                  title = :title, gender = :gender,
                  rate_30 = :rate_30, rate_45 = :rate_45, rate_60 = :rate_60,
                  status = :status, notes = :notes
                  WHERE id = :id";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':name' => htmlspecialchars(strip_tags($data->name)),
            ':phone' => htmlspecialchars(strip_tags($data->phone)),
            ':email' => $data->email ?? null,
            ':title' => $data->title,
            ':gender' => $data->gender,
            ':rate_30' => $data->rate_30,
            ':rate_45' => $data->rate_45,
            ':rate_60' => $data->rate_60,
            ':status' => $data->status,
            ':notes' => $data->notes ?? null,
            ':id' => $id
        ]);

        // تحديث كلمة المرور بشكل منفصل إذا تم إرسالها
        if (!empty($data->password)) {
            $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
            $pass_stmt = $db->prepare("UPDATE teachers SET password = :password WHERE id = :id");
            $pass_stmt->execute([':password' => $hashed_password, ':id' => $id]);
        }

        json_response(200, ["message" => "تم تحديث بيانات المعلم بنجاح."]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            json_response(409, ["message" => "البريد الإلكتروني مسجل لمعلم آخر."]);
        }
        json_response(500, ["message" => "خطأ في تحديث البيانات: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف المعلم والاسم مطلوبان."]);
}
