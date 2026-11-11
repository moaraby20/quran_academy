<?php
// api/sessions/create.php
require_once '../../core/initialize.php';
require_once '../../core/auth_middleware.php';

$user_data = verify_token(); // متاح للمعلمين والإدارة
$db = (new Database())->connect();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->student_id) && !empty($data->date) && !empty($data->duration)) {
    try {
        $db->beginTransaction();

        $teacher_id = ($user_data->role === 'teacher') ? $user_data->id : $data->teacher_id;
        if (empty($teacher_id)) {
            throw new Exception("يجب تحديد المعلم.");
        }

        // [إضافة الحماية من النقرات المزدوجة وتكرار الحصص]
        $check_duplicate = $db->prepare("SELECT id FROM sessions WHERE student_id = :student_id AND teacher_id = :teacher_id AND created_at >= NOW() - INTERVAL 1 MINUTE");
        $check_duplicate->execute([
            ':student_id' => $data->student_id,
            ':teacher_id' => $teacher_id
        ]);
        if ($check_duplicate->fetch()) {
            throw new Exception("لقد قمت بتسجيل حصة لهذا الطالب منذ لحظات قليلة، يرجى الانتظار لتجنب التكرار.");
        }
        // [نهاية إضافة الحماية]

        // 1. جلب أجر المعلم بناءً على المدة
        $rate_column = 'rate_' . $data->duration; // rate_30, rate_45, rate_60
        if (!in_array($data->duration, [30, 45, 60])) {
            $rate_column = 'rate_30'; // افتراضي
        }

        $stmtTeacher = $db->prepare("SELECT {$rate_column} as wage FROM teachers WHERE id = :id");
        $stmtTeacher->execute([':id' => $teacher_id]);
        $teacher = $stmtTeacher->fetch(PDO::FETCH_ASSOC);
        $teacher_wage = $teacher ? (float)$teacher['wage'] : 0;

        // 2. إدراج الحصة مع الصلوات
        $id = uniqid('ses-');
        $query = "INSERT INTO sessions
                  (id, student_id, teacher_id, date, time, duration, topic, new_memorization, revision, rating, tajweed_notes, homework, teacher_wage, report_sent, settled, prayed_fajr, prayed_dhuhr, prayed_asr, prayed_maghrib, prayed_isha)
                  VALUES
                  (:id, :student_id, :teacher_id, :date, :time, :duration, :topic, :new_memorization, :revision, :rating, :tajweed_notes, :homework, :teacher_wage, 0, 0, :prayed_fajr, :prayed_dhuhr, :prayed_asr, :prayed_maghrib, :prayed_isha)";

        $stmt = $db->prepare($query);
        $stmt->execute([
            ':id' => $id,
            ':student_id' => $data->student_id,
            ':teacher_id' => $teacher_id,
            ':date' => $data->date,
            ':time' => $data->time ?? null,
            ':duration' => $data->duration,
            ':topic' => $data->topic ?? 'متابعة حفظ',
            ':new_memorization' => $data->new_memorization ?? null,
            ':revision' => $data->revision ?? null,
            ':rating' => $data->rating ?? 'ممتاز',
            ':tajweed_notes' => $data->tajweed_notes ?? null,
            ':homework' => $data->homework ?? null,
            ':teacher_wage' => $teacher_wage,
            ':prayed_fajr' => !empty($data->prayed_fajr) ? 1 : 0,
            ':prayed_dhuhr' => !empty($data->prayed_dhuhr) ? 1 : 0,
            ':prayed_asr' => !empty($data->prayed_asr) ? 1 : 0,
            ':prayed_maghrib' => !empty($data->prayed_maghrib) ? 1 : 0,
            ':prayed_isha' => !empty($data->prayed_isha) ? 1 : 0
        ]);

        // 3. تحديث بيانات الطالب (زيادة الحصص المنجزة وتاريخ آخر حصة)
        $updateStudent = $db->prepare("UPDATE students SET completed_sessions = completed_sessions + 1, last_session_date = :date WHERE id = :student_id");
        $updateStudent->execute([':date' => $data->date, ':student_id' => $data->student_id]);

        $db->commit();
        json_response(201, ["message" => "تم تسجيل الحصة بنجاح.", "id" => $id]);
    } catch (Exception $e) {
        $db->rollBack();
        json_response(500, ["message" => "خطأ في تسجيل الحصة: " . $e->getMessage()]);
    }
} else {
    json_response(400, ["message" => "بيانات الحصة الأساسية (الطالب، التاريخ، المدة) مطلوبة."]);
}
