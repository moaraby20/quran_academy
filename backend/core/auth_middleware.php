<?php
// core/auth_middleware.php
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function get_authorization_header(): ?string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) return trim($_SERVER['HTTP_AUTHORIZATION']);
    if (!empty($_SERVER['Authorization'])) return trim($_SERVER['Authorization']);
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $h = array_change_key_case($headers, CASE_LOWER);
        if (!empty($h['authorization'])) return trim($h['authorization']);
    }
    return null;
}

function extract_bearer_token(?string $authHeader): ?string
{
    if (!$authHeader) return null;
    if (preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) return trim($m[1]);
    return null;
}

function verify_token($required_roles = [])
{
    $secret_key = "e9a1dd43ded78ba3f20ace605f4dee78a075459d53ae0c1730f8f9ea010627d1"; // يجب أن يكون موحداً ومعقداً
    $auth_header = get_authorization_header();
    $jwt = extract_bearer_token($auth_header);

    if (!$jwt) json_response(401, ['message' => 'الوصول مرفوض. لم يتم توفير التوكن.']);

    try {
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        $db = (new Database())->connect();
        $user_id = $decoded->data->id;
        $role = $decoded->data->role;

        if ($role === 'teacher') {
            $stmt = $db->prepare("SELECT id, status, is_suspended FROM teachers WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) json_response(401, ['message' => 'حساب المعلم غير موجود.']);
            if ($user['status'] !== 'active' || $user['is_suspended'] == 1) json_response(403, ['message' => 'تم إيقاف حسابك. يرجى مراجعة الإدارة.']);
        } else {
            $stmt = $db->prepare("SELECT id, role, is_blocked FROM staff_users WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) json_response(401, ['message' => 'الحساب الإداري غير موجود.']);
            if ($user['is_blocked'] == 1) json_response(403, ['message' => 'تم حظر حسابك الإداري.']);
            $role = $user['role'];
        }

        if (!empty($required_roles) && !in_array($role, $required_roles)) {
            json_response(403, ['message' => 'غير مصرح لك بتنفيذ هذا الإجراء.']);
        }

        $decoded->data->role = $role;
        return $decoded->data;
    } catch (Exception $e) {
        json_response(401, ['message' => 'التوكن غير صالح أو منتهي الصلاحية.']);
    }
}
