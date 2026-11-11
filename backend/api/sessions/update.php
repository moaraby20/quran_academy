<?php
// api/sessions/update.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token();
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));
$id = $_GET['id'] ?? $data->id ?? null;

if (!empty($id)) {
    try {
        // التحقق من الحصة ومنع المعلم من تعديل حصة مسددة أو لا تخصه
        $check_stmt = $db->prepare("SELECT teacher_id, settled FROM sessions WHERE id = :id");
        $check_stmt->execute([':id' => $id]);
        $session = $check_stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) json_response(404, ["message" => "الحصة غير موجودة."]);

        if ($user_data->role === 'teacher' && $session['teacher_id'] !== $user_data->id) {
            json_response(403, ["message" => "لا يمكنك تعديل حصة لمعلم آخر."]);
        }
        if ($session['settled'] == 1 && $user_data->role === 'teacher') {
            json_response(403, ["message" => "لا يمكن تعديل حصة تم تسوية حسابها مالياً."]);
        }

        // 👈 الإضافة هنا: جلب أجر المعلم المحدث بناءً على المدة الجديدة
        $rate_column = 'rate_' . $data->duration; // rate_30, rate_45, rate_60
        if (!in_array($data->duration, [30, 45, 60])) {
            $rate_column = 'rate_30'; // افتراضي
        }

        $stmtTeacher = $db->prepare("SELECT {$rate_column} as wage FROM teachers WHERE id = :id");
        $stmtTeacher->execute([':id' => $session['teacher_id']]);
        $teacher = $stmtTeacher->fetch(PDO::FETCH_ASSOC);
        $teacher_wage = $teacher ? (float)$teacher['wage'] : 0;

        // إضافة teacher_wage للاستعلام
        $query = "UPDATE sessions SET
                  date = :date, time = :time, duration = :duration, topic = :topic,
                  new_memorization = :new_memorization, revision = :revision,
                  rating = :rating, tajweed_notes = :tajweed_notes, homework = :homework,
                  prayed_fajr = :prayed_fajr, prayed_dhuhr = :prayed_dhuhr, prayed_asr = :prayed_asr,
                  prayed_maghrib = :prayed_maghrib, prayed_isha = :prayed_isha,
                  teacher_wage = :teacher_wage
                  WHERE id = :id";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':date' => $data->date,
            ':time' => $data->time ?? null,
            ':duration' => $data->duration,
            ':topic' => $data->topic ?? null,
            ':new_memorization' => $data->new_memorization ?? null,
            ':revision' => $data->revision ?? null,
            ':rating' => $data->rating ?? 'ممتاز',
            ':tajweed_notes' => $data->tajweed_notes ?? null,
            ':homework' => $data->homework ?? null,
            ':prayed_fajr' => !empty($data->prayed_fajr) ? 1 : 0,
            ':prayed_dhuhr' => !empty($data->prayed_dhuhr) ? 1 : 0,
            ':prayed_asr' => !empty($data->prayed_asr) ? 1 : 0,
            ':prayed_maghrib' => !empty($data->prayed_maghrib) ? 1 : 0,
            ':prayed_isha' => !empty($data->prayed_isha) ? 1 : 0,
            ':teacher_wage' => $teacher_wage, // 👈 تمرير الأجر المحدث
            ':id' => $id
        ]);

        json_response(200, ["message" => "تم تحديث بيانات الحصة بنجاح."]);
    } catch (PDOException $e) {
        json_response(500, ["message" => "خطأ في تحديث الحصة: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "معرف الحصة مطلوب."]);
}
