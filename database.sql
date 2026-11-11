-- =====================================================================
-- أكاديمية وسارعوا لتعليم القرآن الكريم والقراءات
-- Wasareo Quran Academy - Complete Database Schema & Seed Data
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+, and PHP PDO / MySQLi
-- Charset: utf8mb4 / utf8mb4_unicode_ci (Full Arabic Support)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. جدول مدراء ومشرفي النظام (Staff Users: Admin & Moderator)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `staff_users`;
CREATE TABLE `staff_users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL COMMENT 'الاسم الكامل',
  `email` VARCHAR(191) NOT NULL COMMENT 'البريد الإلكتروني لتسجيل الدخول',
  `username` VARCHAR(191) DEFAULT NULL COMMENT 'اسم مستخدم اختياري أو بريد',
  `password` VARCHAR(255) NOT NULL COMMENT 'كلمة المرور (نص أو Hash)',
  `phone` VARCHAR(50) DEFAULT NULL COMMENT 'رقم الهاتف والواتساب',
  `role` ENUM('admin', 'moderator') NOT NULL DEFAULT 'moderator' COMMENT 'الرتبة: admin مدير أو moderator مشرف',
  `is_super_admin` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'هل هو المدير العام الرئيسي؟',
  `is_blocked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'حالة الحظر من دخول النظام',
  `blocked_at` DATETIME DEFAULT NULL COMMENT 'تاريخ ووقت الحظر',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT 'رابط الصورة الشخصية',
  `notes` TEXT DEFAULT NULL COMMENT 'ملاحظات إدارية',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_staff_email` (`email`),
  KEY `idx_staff_role` (`role`),
  KEY `idx_staff_blocked` (`is_blocked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول حسابات الإدارة والمشرفين';

-- ---------------------------------------------------------------------
-- 2. جدول المعلمين والمعلمات (Teachers)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL COMMENT 'اسم المعلم',
  `phone` VARCHAR(50) NOT NULL COMMENT 'رقم هاتف / واتساب المعلم',
  `email` VARCHAR(191) DEFAULT NULL COMMENT 'بريد المعلم لتسجيل الدخول لحسابه الخاص',
  `password` VARCHAR(255) DEFAULT '123456' COMMENT 'كلمة مرور المعلم',
  `title` VARCHAR(191) NOT NULL DEFAULT 'مُجاز بالقراءات العشر' COMMENT 'الصفة / اللقب العلمي',
  `gender` ENUM('male', 'female') NOT NULL DEFAULT 'male' COMMENT 'الجنس',
  `rate_30` DECIMAL(10,2) NOT NULL DEFAULT 60.00 COMMENT 'أجر الحصة 30 دقيقة بالجنيه',
  `rate_45` DECIMAL(10,2) NOT NULL DEFAULT 85.00 COMMENT 'أجر الحصة 45 دقيقة بالجنيه',
  `rate_60` DECIMAL(10,2) NOT NULL DEFAULT 110.00 COMMENT 'أجر الحصة 60 دقيقة بالجنيه',
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active' COMMENT 'حالة الحساب',
  `is_suspended` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'هل الحساب موقوف إدارياً؟',
  `suspended_at` DATETIME DEFAULT NULL COMMENT 'تاريخ الإيقاف',
  `joined_date` DATE NOT NULL COMMENT 'تاريخ الانضمام للأكاديمية',
  `avatar` VARCHAR(500) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL COMMENT 'ملاحظات وتخصص المعلم',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_teachers_email` (`email`),
  KEY `idx_teachers_status` (`status`),
  KEY `idx_teachers_suspended` (`is_suspended`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المعلمين وأسعار الحصص';

-- ---------------------------------------------------------------------
-- 3. جدول الطلاب وأولياء الأمور (Students)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL COMMENT 'اسم الطالب الرباعي',
  `parent_name` VARCHAR(191) NOT NULL COMMENT 'اسم ولي الأمر',
  `parent_phone` VARCHAR(50) NOT NULL COMMENT 'رقم واتساب ولي الأمر لاستلام التقارير',
  `teacher_id` VARCHAR(64) NOT NULL COMMENT 'المعلم المسؤول عن الطالب',
  `package_name` VARCHAR(100) NOT NULL DEFAULT 'باقة 8 حصص' COMMENT 'اسم الباقة الحالية',
  `package_size` INT(11) NOT NULL DEFAULT 8 COMMENT 'عدد حصص الباقة الإجمالي',
  `completed_sessions` INT(11) NOT NULL DEFAULT 0 COMMENT 'عدد الحصص المنجزة في الباقة الحالية',
  `subscription_fee` DECIMAL(10,2) NOT NULL DEFAULT 800.00 COMMENT 'رسوم اشتراك الباقة بالجنيه (ج.م)',
  `current_surah` VARCHAR(100) NOT NULL DEFAULT 'سورة الفاتحة' COMMENT 'السورة الحالية التي يحفظها الطالب',
  `current_juz` INT(11) NOT NULL DEFAULT 1 COMMENT 'رقم الجزء الحالي (1-30)',
  `status` ENUM('active', 'renewal_due', 'completed', 'paused') NOT NULL DEFAULT 'active' COMMENT 'حالة اشتراك الطالب',
  `start_date` DATE NOT NULL COMMENT 'تاريخ بدء الاشتراك',
  `last_session_date` DATE DEFAULT NULL COMMENT 'تاريخ آخر حصة تم تسجيلها',
  `notes` TEXT DEFAULT NULL COMMENT 'ملاحظات الطالب ومستواه',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_students_teacher` (`teacher_id`),
  KEY `idx_students_status` (`status`),
  CONSTRAINT `fk_students_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الطلاب واشتراكاتهم';

-- ---------------------------------------------------------------------
-- 4. جدول تسويات ومستحقات المعلمين المصروفة (Teacher Settlements)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `teacher_settlements`;
CREATE TABLE `teacher_settlements` (
  `id` VARCHAR(64) NOT NULL,
  `teacher_id` VARCHAR(64) NOT NULL COMMENT 'المعلم الذي تم تصفية حسابه',
  `amount` DECIMAL(10,2) NOT NULL COMMENT 'إجمالي المبلغ المصروف بالجنيه',
  `sessions_count` INT(11) NOT NULL DEFAULT 0 COMMENT 'عدد الحصص التي تم تصفيتها في هذه العملية',
  `settled_at` DATE NOT NULL COMMENT 'تاريخ عملية الصرف والتسوية',
  `notes` TEXT DEFAULT NULL COMMENT 'ملاحظات الصرف (رقم تحويل فودافون كاش / انستاباي)',
  `expense_id` VARCHAR(64) DEFAULT NULL COMMENT 'معرف سجل المصروف المقابل إن وُجد',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_settlements_teacher` (`teacher_id`),
  CONSTRAINT `fk_settlements_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='سجل عمليات تسوية وصرف مستحقات المعلمين';

-- ---------------------------------------------------------------------
-- 5. جدول سجل الحصص المنفذة والتقارير (Sessions)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` VARCHAR(64) NOT NULL,
  `student_id` VARCHAR(64) NOT NULL COMMENT 'الطالب',
  `teacher_id` VARCHAR(64) NOT NULL COMMENT 'المعلم الذي سجل الحصة',
  `date` DATE NOT NULL COMMENT 'تاريخ الحصة',
  `time` TIME DEFAULT NULL COMMENT 'وقت انعقاد الحصة',
  `duration` INT(11) NOT NULL DEFAULT 45 COMMENT 'مدة الحصة بالدقائق (30 / 45 / 60)',
  `new_memorization` TEXT DEFAULT NULL COMMENT 'الجديد في الحفظ (مثال: البقرة 40-52)',
  `revision` TEXT DEFAULT NULL COMMENT 'المراجعة (مثال: البقرة 1-39)',
  `rating` VARCHAR(100) NOT NULL DEFAULT 'ممتاز' COMMENT 'التقدير (ممتاز / جيد جداً / جيد / يحتاج تمكين ومراجعة)',
  `tajweed_notes` TEXT DEFAULT NULL COMMENT 'ملاحظات التجويد وملاحظات المعلم',
  `homework` TEXT DEFAULT NULL COMMENT 'المطلوب للقاء القادم / الواجب',
  `teacher_wage` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'أجر المعلم المحتسب لهذه الحصة',
  `report_sent` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'هل تم إرسال تقرير الواتساب لولي الأمر؟',
  `settled` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'هل تم تصفية وصرف أجر هذه الحصة للمعلم؟',
  `settled_at` DATETIME DEFAULT NULL COMMENT 'تاريخ التصفية والصرف',
  `settlement_id` VARCHAR(64) DEFAULT NULL COMMENT 'رقم عملية التسوية المرتبطة',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sessions_student` (`student_id`),
  KEY `fk_sessions_teacher` (`teacher_id`),
  KEY `fk_sessions_settlement` (`settlement_id`),
  KEY `idx_sessions_date` (`date`),
  KEY `idx_sessions_settled` (`settled`),
  CONSTRAINT `fk_sessions_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sessions_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sessions_settlement` FOREIGN KEY (`settlement_id`) REFERENCES `teacher_settlements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الحصص والتقارير ومستحقات المعلمين';

-- ---------------------------------------------------------------------
-- 6. جدول المصروفات التشغيلية (Expenses)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(191) NOT NULL COMMENT 'عنوان ووصف المصروف',
  `amount` DECIMAL(10,2) NOT NULL COMMENT 'المبلغ بالجنيه (ج.م)',
  `category` ENUM('zoom', 'software', 'rewards', 'marketing', 'operational', 'salaries', 'other') NOT NULL DEFAULT 'operational' COMMENT 'تصنيف المصروف',
  `date` DATE NOT NULL COMMENT 'تاريخ صرف المبلغ',
  `notes` TEXT DEFAULT NULL COMMENT 'ملاحظات إضافية',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_category` (`category`),
  KEY `idx_expenses_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المصروفات التشغيلية للأكاديمية';

-- ---------------------------------------------------------------------
-- 7. جدول سجل تجديد اشتراكات الطلاب (Student Package Renewals History)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `student_renewals`;
CREATE TABLE `student_renewals` (
  `id` VARCHAR(64) NOT NULL,
  `student_id` VARCHAR(64) NOT NULL COMMENT 'الطالب المجدد',
  `package_name` VARCHAR(100) NOT NULL COMMENT 'اسم الباقة المجددة',
  `package_size` INT(11) NOT NULL COMMENT 'عدد الحصص',
  `subscription_fee` DECIMAL(10,2) NOT NULL COMMENT 'المبلغ المدفوع للتجديد',
  `renewed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ ووقت التجديد',
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_renewals_student` (`student_id`),
  CONSTRAINT `fk_renewals_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='أرشيف تجديد اشتراكات الطلاب والإيرادات';

-- =====================================================================
-- البيانات الافتراضية الأولية للسيستم (Initial Seed Data)
-- =====================================================================

-- مدراء ومشرفين
INSERT INTO `staff_users` (`id`, `name`, `email`, `username`, `password`, `phone`, `role`, `is_super_admin`, `is_blocked`, `notes`, `created_at`) VALUES
('staff-admin-1', 'مدير الأكاديمية (المهندس محمود)', 'admin@wasareo.com', 'admin@wasareo.com', 'admin', '01000000001', 'admin', 1, 0, 'المدير العام ومؤسس النظام', '2025-01-01 10:00:00'),
('staff-mod-1', 'أستاذ حازم المنشاوي', 'hazem@wasareo.com', 'hazem@wasareo.com', '123456', '01099887766', 'moderator', 0, 0, 'مشرف الحلقات والطلاب ومتابعة الحصص', '2025-02-15 12:00:00'),
('staff-mod-2', 'أستاذة سارة الشناوي', 'sara@wasareo.com', 'sara@wasareo.com', '123456', '01122334455', 'moderator', 0, 0, 'مشرفة شؤون المعلمين والحصص المنفذة', '2025-03-01 14:00:00');

-- المعلمين
INSERT INTO `teachers` (`id`, `name`, `phone`, `email`, `password`, `title`, `gender`, `rate_30`, `rate_45`, `rate_60`, `status`, `is_suspended`, `joined_date`, `notes`) VALUES
('t-1', 'الشيخ أحمد الزيات', '01011122334', 'zayat@gmail.com', '123456', 'مُجاز بالقراءات العشر', 'male', 60.00, 85.00, 110.00, 'active', 0, '2025-01-10', 'متخصص تصحيح التلاوة والإجازات'),
('t-2', 'المعلمة فاطمة الزهراء', '01122233445', 'fatima@gmail.com', '123456', 'معلمة مجازة وتأسيس صغار', 'female', 50.00, 75.00, 95.00, 'active', 0, '2025-02-01', 'تحفيظ جزء عمّ وتبارك'),
('t-3', 'الشيخ محمود عبد العليم', '01233344556', 'mahmoud@gmail.com', '123456', 'مقرئ معتمد ومدرب تجويد', 'male', 55.00, 80.00, 100.00, 'active', 0, '2025-03-15', 'حلقات الحفظ المكثف');

-- الطلاب
INSERT INTO `students` (`id`, `name`, `parent_name`, `parent_phone`, `teacher_id`, `package_name`, `package_size`, `completed_sessions`, `subscription_fee`, `current_surah`, `current_juz`, `status`, `start_date`, `last_session_date`, `notes`) VALUES
('s-1', 'عبد الرحمن التميمي', 'أبو عبد الرحمن', '201012345678', 't-1', 'باقة 8 حصص', 8, 8, 800.00, 'سورة البقرة', 2, 'renewal_due', '2026-08-01', '2026-09-24', 'حفظ متقن'),
('s-2', 'سارة بنت فهد', 'أم سارة', '966509876543', 't-2', 'باقة 12 حصة', 12, 12, 1100.00, 'سورة مريم', 16, 'renewal_due', '2026-07-15', '2026-09-23', NULL),
('s-3', 'عمر خالد الدوسري', 'خالد الدوسري', '966541244433', 't-1', 'باقة 8 حصص', 8, 5, 800.00, 'سورة الكهف', 15, 'active', '2026-09-01', '2026-09-22', NULL),
('s-4', 'لينة محمد الشريف', 'محمد الشريف', '201077788990', 't-2', 'باقة 16 حصة', 16, 14, 1400.00, 'سورة القمر', 27, 'active', '2026-08-10', '2026-09-25', NULL),
('s-5', 'عبد الله السبيعي', 'إبراهيم السبيعي', '971501666778', 't-3', 'باقة 4 حصص', 4, 4, 450.00, 'سورة القلم', 29, 'renewal_due', '2026-09-05', '2026-09-24', NULL),
('s-6', 'مريم أحمد العتيبي', 'أحمد العتيبي', '966551233322', 't-2', 'باقة 8 حصص', 8, 3, 750.00, 'سورة النبأ', 30, 'active', '2026-09-12', '2026-09-21', NULL),
('s-7', 'يوسف الهلالي', 'ماجد الهلالي', '201022211009', 't-3', 'باقة 12 حصة', 12, 9, 1100.00, 'سورة يوسف', 12, 'active', '2026-08-20', '2026-09-23', NULL);

-- الحصص
INSERT INTO `sessions` (`id`, `student_id`, `teacher_id`, `date`, `duration`, `new_memorization`, `revision`, `rating`, `tajweed_notes`, `homework`, `teacher_wage`, `report_sent`, `settled`, `created_at`) VALUES
('ses-1', 's-1', 't-1', '2026-09-24', 60, 'البقرة (40 - 52)', 'البقرة (1 - 39)', 'ممتاز', 'أحكام الإقلاب والإخفاء', 'تثبيت الآيات ومراجعة الحزب الأول', 110.00, 1, 0, '2026-09-24 16:30:00'),
('ses-2', 's-2', 't-2', '2026-09-23', 45, 'مريم (50 - 65)', 'سورة الكهف كاملة', 'ممتاز', 'ترقيق الراء المكسورة', 'تكرار حتى آية 65', 75.00, 1, 0, '2026-09-23 17:00:00'),
('ses-3', 's-5', 't-3', '2026-09-24', 45, 'القلم (1 - 25)', 'سورة الملك كاملة', 'جيد جداً', 'تفخيم الصاد والطاء', 'حفظ بقية سورة القلم', 80.00, 1, 0, '2026-09-24 18:15:00'),
('ses-4', 's-4', 't-2', '2026-09-25', 45, 'القمر (1 - 22)', 'سورة النجم كاملة', 'ممتاز', 'مخارج الدال والذال', 'مراجعة النجم وتسميع القمر', 75.00, 0, 0, '2026-09-25 11:00:00'),
('ses-5', 's-3', 't-1', '2026-09-22', 60, 'الكهف (30 - 45)', 'الإسراء من آية 80 للنهاية', 'جيد جداً', 'المد المنفصل والغنة', 'حفظ الصفحة التالية', 110.00, 1, 0, '2026-09-22 15:45:00');

-- المصروفات
INSERT INTO `expenses` (`id`, `title`, `amount`, `category`, `date`, `notes`, `created_at`) VALUES
('exp-1', 'اشتراك Zoom Pro شهري', 650.00, 'zoom', '2026-09-01', 'غرف الحلقات المباشرة', '2026-09-01 10:00:00'),
('exp-2', 'مكافأة تميز المعلم (الشيخ أحمد)', 500.00, 'rewards', '2026-09-05', 'التزام المواعيد', '2026-09-05 12:00:00'),
('exp-3', 'حملة إعلانية للطلاب الجدد', 850.00, 'marketing', '2026-09-10', 'استقطاب طلاب جدد', '2026-09-10 14:00:00');

SET FOREIGN_KEY_CHECKS = 1;
-- =====================================================================
-- تم إنشاء قاعدة البيانات بنجاح وبكل العلاقات والمفاتيح الأجنبية
-- =====================================================================
