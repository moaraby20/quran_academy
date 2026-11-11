<?php
// api/teachers/create.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(['admin', 'moderator']);
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name) && !empty($data->phone)) {
    try {
        $id = uniqid('t-');
        $password = !empty($data->password) ? password_hash($data->password, PASSWORD_DEFAULT) : password_hash('123456', PASSWORD_DEFAULT); // كلمة مرور افتراضية

        $query = "INSERT INTO teachers
                  (id, name, phone, email, password, title, gender, rate_30, rate_45, rate_60, status, joined_date, notes)
                  VALUES
                  (:id, :name, :phone, :email, :password, :title, :gender, :rate_30, :rate_45, :rate_60, :status, :joined_date, :notes)";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $id,
            ':name' => htmlspecialchars(strip_tags($data->name)),
            ':phone' => htmlspecialchars(strip_tags($data->phone)),
            ':email' => $data->email ?? null,
            ':password' => $password,
            ':title' => $data->title ?? 'مُجاز بالقراءات العشر',
            ':gender' => $data->gender ?? 'male',
            ':rate_30' => $data->rate_30 ?? 60.00,
            ':rate_45' => $data->rate_45 ?? 85.00,
            ':rate_60' => $data->rate_60 ?? 110.00,
            ':status' => $data->status ?? 'active',
            ':joined_date' => $data->joined_date ?? date('Y-m-d'),
            ':notes' => $data->notes ?? null
        ]);

        json_response(201, ["message" => "تم إضافة المعلم بنجاح.", "id" => $id]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            json_response(409, ["message" => "البريد الإلكتروني مسجل لمعلم آخر."]);
        }
        json_response(500, ["message" => "خطأ في إنشاء حساب المعلم: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "الاسم ورقم الهاتف مطلوبان."]);
}
