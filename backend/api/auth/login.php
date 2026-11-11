<?php
// auth/login.php
require_once '../../core/initialize.php';
require_once '../../vendor/autoload.php';

use Firebase\JWT\JWT;

$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    try {
        // 1. البحث في المشرفين والمديرين
        $stmt = $db->prepare("SELECT id, name, username, email, password, role, is_blocked FROM staff_users WHERE email = :username OR username = :username LIMIT 1");
        $stmt->execute([':username' => $data->username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        $user_type = 'staff';

        // 2. إذا لم يوجد، البحث في المعلمين
        if (!$user) {
            $stmt = $db->prepare("SELECT id, name, email, phone, password, status, is_suspended FROM teachers WHERE email = :username OR phone = :username LIMIT 1");
            $stmt->execute([':username' => $data->username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $user_type = 'teacher';
            if ($user) $user['role'] = 'teacher';
        }

        // ملاحظة: لدعم البيانات الافتراضية، تم استخدام المقارنة المباشرة مع إمكانية استخدام password_verify
        if ($user && (password_verify($data->password, $user['password']) || $data->password === $user['password'])) {
            if ($user_type === 'staff' && $user['is_blocked'] == 1) {
                json_response(403, ["message" => "الحساب محظور، يرجى مراجعة الإدارة."]);
            }
            if ($user_type === 'teacher' && ($user['status'] !== 'active' || $user['is_suspended'] == 1)) {
                json_response(403, ["message" => "حساب المعلم موقوف أو غير نشط."]);
            }

            $secret_key = "e9a1dd43ded78ba3f20ace605f4dee78a075459d53ae0c1730f8f9ea010627d1";
            $payload = [
                'iat' => time(),
                'exp' => time() + (86400 * 30),
                'data' => [
                    'id' => $user['id'],
                    'role' => $user['role']
                ]
            ];

            $jwt = JWT::encode($payload, $secret_key, 'HS256');

            json_response(200, [
                "message" => "تم تسجيل الدخول بنجاح.",
                "token" => $jwt,
                "user" => [
                    "id" => $user['id'],
                    "name" => $user['name'],
                    "role" => $user['role']
                ]
            ]);
        } else {
            json_response(401, ["message" => "بيانات الدخول غير صحيحة."]);
        }
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في النظام: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "اسم المستخدم وكلمة المرور مطلوبان."]);
}
