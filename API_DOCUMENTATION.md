# توثيق قاعدة البيانات والـ API لربط PHP مع الفرونت إند
## أكاديمية وسارعوا لتعليم القرآن الكريم

تم إنشاء ملف قاعدة البيانات `database.sql` وهو جاهز للاستيراد المباشر في **MySQL / MariaDB / phpMyAdmin**.

---

### 1. الجداول الموجودة في قاعدة البيانات (`database.sql`):

| اسم الجدول | الوصف | المفتاح الأساسي | الحقول الرئيسية |
| :--- | :--- | :--- | :--- |
| **`staff_users`** | مدراء ومشرفي النظام | `id` (VARCHAR) | `name`, `email`, `password`, `phone`, `role`, `is_super_admin`, `is_blocked` |
| **`teachers`** | المعلمين والمعلمات | `id` (VARCHAR) | `name`, `phone`, `email`, `password`, `rate_30`, `rate_45`, `rate_60`, `status`, `is_suspended` |
| **`students`** | الطلاب والاشتراكات | `id` (VARCHAR) | `name`, `parent_name`, `parent_phone`, `teacher_id`, `package_name`, `package_size`, `completed_sessions`, `subscription_fee`, `status` |
| **`sessions`** | الحصص والتقارير | `id` (VARCHAR) | `student_id`, `teacher_id`, `date`, `duration`, `new_memorization`, `revision`, `rating`, `tajweed_notes`, `homework`, `teacher_wage`, `report_sent`, `settled` |
| **`teacher_settlements`** | صرف وتسوية مستحقات المعلمين | `id` (VARCHAR) | `teacher_id`, `amount`, `sessions_count`, `settled_at`, `notes`, `expense_id` |
| **`expenses`** | المصروفات التشغيلية | `id` (VARCHAR) | `title`, `amount`, `category`, `date`, `notes` |
| **`student_renewals`** | سجل تجديد الباقات | `id` (VARCHAR) | `student_id`, `package_name`, `package_size`, `subscription_fee`, `renewed_at` |

---

### 2. مطابقة أسماء الحقول (Field Mapping) بين الفرونت إند والباك إند:

تمت مراعاة تسمية الأعمدة في SQL بنمط `snake_case` القياسي لقواعد البيانات مع مطابقتها التامة لكائنات الـ TypeScript:

- `rates.rate30` ⟷ `rate_30`
- `rates.rate45` ⟷ `rate_45`
- `rates.rate60` ⟷ `rate_60`
- `teacherId` ⟷ `teacher_id`
- `studentId` ⟷ `student_id`
- `parentName` ⟷ `parent_name`
- `parentPhone` ⟷ `parent_phone`
- `packageName` ⟷ `package_name`
- `packageSize` ⟷ `package_size`
- `completedSessions` ⟷ `completed_sessions`
- `subscriptionFee` ⟷ `subscription_fee`
- `newMemorization` ⟷ `new_memorization`
- `tajweedNotes` ⟷ `tajweed_notes`
- `teacherWage` ⟷ `teacher_wage`
- `reportSent` ⟷ `report_sent`
- `isSuperAdmin` ⟷ `is_super_admin`
- `isBlocked` ⟷ `is_blocked`
- `isSuspended` ⟷ `is_suspended`

---

### 3. جاهزية الربط:
عندما تكون مستعداً للبدء في كتابة ملفات الـ PHP (`config/db.php` والـ API Endpoints) وإعداد اتصال الـ Fetch / Axios في التطبيق، سنقوم بإنشائها مباشرة خطوة بخطوة.
