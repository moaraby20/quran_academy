<?php
// api/staff/update.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id) && !empty($data->name) && !empty($data->email)) {
    try {
        $query = "UPDATE staff_users SET
                  name = :name, email = :email, username = :username,
                  phone = :phone, role = :role, notes = :notes
                  WHERE id = :id";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':name' => htmlspecialchars(strip_tags($data->name)),
            ':email' => htmlspecialchars(strip_tags($data->email)),
            ':username' => htmlspecialchars(strip_tags($data->username ?? $data->email)),
            ':phone' => htmlspecialchars(strip_tags($data->phone ?? '')),
            ':role' => htmlspecialchars(strip_tags($data->role ?? 'moderator')),
            ':notes' => htmlspecialchars(strip_tags($data->notes ?? '')),
            ':id' => $id
        ]);

        // تحديث كلمة المرور بشكل منفصل فقط إذا تم إرسال كلمة مرور جديدة
        if (!empty($data->password)) {
            $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
            $pass_stmt = $db->prepare("UPDATE staff_users SET password = :password WHERE id = :id");
            $pass_stmt->execute([':password' => $hashed_password, ':id' => $id]);
        }

        json_response(200, ["message" => "تم تحديث بيانات المستخدم بنجاح."]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            json_response(409, ["message" => "البريد الإلكتروني أو اسم المستخدم مسجل مسبقاً لمستخدم آخر."]);
        }
        json_response(500, ["message" => "خطأ في تحديث البيانات: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف المستخدم، الاسم، والبريد الإلكتروني مطلوبون."]);
}
