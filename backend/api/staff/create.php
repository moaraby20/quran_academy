<?php
// api/staff/create.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->email) && !empty($data->password)) {
    try {
        $id = uniqid('staff-');
        $password = password_hash($data->password, PASSWORD_DEFAULT);

        $query = "INSERT INTO staff_users (id, name, email, username, password, phone, role, notes)
                  VALUES (:id, :name, :email, :username, :password, :phone, :role, :notes)";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $id,
            ':name' => htmlspecialchars(strip_tags($data->name)),
            ':email' => htmlspecialchars(strip_tags($data->email)),
            ':username' => $data->username ?? $data->email,
            ':password' => $password,
            ':phone' => $data->phone ?? null,
            ':role' => $data->role ?? 'moderator',
            ':notes' => $data->notes ?? null
        ]);

        json_response(201, ["message" => "تم إضافة المستخدم بنجاح.", "id" => $id]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            json_response(409, ["message" => "البريد الإلكتروني أو اسم المستخدم موجود مسبقاً."]);
        }
        json_response(500, ["message" => "خطأ في الإنشاء: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "الاسم والبريد وكلمة المرور مطلوبون."]);
}
