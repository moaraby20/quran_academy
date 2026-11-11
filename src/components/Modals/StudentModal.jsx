import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import {
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useGetTeachersQuery
} from "../../rtk/slices/apiSlice";

const StudentModal = ({ isOpen, onClose, studentToEdit }) => {
  // جلب المعلمين لربط الطالب
  const { data: teachers = [] } = useGetTeachersQuery();

  // دوال الحفظ والتعديل من الـ API
  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();

  const isSubmitting = isCreating || isUpdating;

  const [name, setName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [packageSize, setPackageSize] = useState(8);
  const [completedSessions, setCompletedSessions] = useState(0); // <-- الحقل الجديد
  const [subscriptionFee, setSubscriptionFee] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(studentToEdit?.name || "");
      setParentName(studentToEdit?.parentName || "");
      setParentPhone(studentToEdit?.parentPhone || "");
      setTeacherId(studentToEdit?.teacherId || "");
      setPackageSize(studentToEdit?.packageSize || 8);
      setCompletedSessions(studentToEdit?.completedSessions || 0); // <-- جلب القيمة القديمة
      setSubscriptionFee(studentToEdit?.subscriptionFee !== undefined ? String(studentToEdit.subscriptionFee) : "");
      setNotes(studentToEdit?.notes || "");
    }
  }, [isOpen, studentToEdit]);

  if (!isOpen) return null;

  const handlePackageSizeChange = (size) => {
    setPackageSize(size);
    if (completedSessions > size) setCompletedSessions(size); // منع رقم أكبر من الباقة
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !teacherId) {
      alert("يرجى إدخال اسم الطالب واختيار المعلم.");
      return;
    }

    const packageName = `باقة ${packageSize} حصص`;
    const numericFee = Number(subscriptionFee) || 0;

    const studentData = {
      name,
      parent_name: parentName,
      parent_phone: parentPhone,
      teacher_id: teacherId,
      package_name: packageName,
      package_size: packageSize,
      completed_sessions: completedSessions, // <-- إرسال الحقل للباك إند
      subscription_fee: numericFee,
      notes,
      status: studentToEdit?.status || "active",
    };

    try {
      if (studentToEdit) {
        // تحديث طالب موجود
        await updateStudent({
          id: studentToEdit.id,
          data: studentData
        }).unwrap();
      } else {
        // إضافة طالب جديد
        await createStudent({
          ...studentData,
          current_surah: "الفاتحة", // قيم افتراضية عند الإنشاء
          current_juz: 30,
          start_date: new Date().toISOString().split("T")[0]
        }).unwrap();
      }
      onClose();
    } catch (err) {
      console.error("Error saving student:", err);
      alert(err?.data?.message || "حدث خطأ أثناء حفظ بيانات الطالب");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
          <h3 className="text-xs font-semibold text-neutral-100">
            {studentToEdit ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                اسم الطالب *
              </label>
              <input
                type="text"
                placeholder="مثال: عبد الرحمن التميمي"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 transition-colors duration-150"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                اسم ولي الأمر
              </label>
              <input
                type="text"
                placeholder="مثال: أبو عبد الرحمن"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 transition-colors duration-150"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                رقم واتساب ولي الأمر *
              </label>
              <input
                type="tel"
                placeholder="مثال: 201012345678"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono transition-all duration-150 text-left outline-none focus:outline-none"
                dir="ltr"
                required
              />
              <p className="text-[10px] text-neutral-400 mt-1">بكود الدولة (مثال: 2010...)</p>
            </div>

            {/* Teacher Selection */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                المعلم المسؤول *
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-neutral-200 transition-colors duration-150 outline-none"
                required
              >
                <option value="">-- اختر المعلم --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Package Size options */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              باقة الحصص الشهرية:
            </label>
            <div className="grid grid-cols-6 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 font-mono tabular-nums">
              {[4, 8, 12, 16, 20, 25].map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => handlePackageSizeChange(size)} // تم تغيير الدالة هنا
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${packageSize === size ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:text-neutral-200"}`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* الحقل الجديد: الحصص المنجزة للترحيل */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                الحصص المنجزة مسبقاً (للترحيل):
              </label>
              <select
                value={completedSessions}
                onChange={(e) => setCompletedSessions(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-2 text-xs text-neutral-200 transition-colors duration-150 outline-none"
              >
                {/* تثبيت الخيارات من 0 إلى 8 فقط */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num === 0
                      ? "طالب جديد (0 حصص منجزة)"
                      : `منجز ${num} حصص (متبقي ${Math.max(0, packageSize - num)})`
                    }
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fees */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              رسوم الباقة (بالجنيه المصري ج.م) *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="مثال: 800"
              value={subscriptionFee}
              onChange={(e) => setSubscriptionFee(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono tabular-nums transition-colors duration-150"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              ملاحظات
            </label>
            <textarea
              rows={2}
              placeholder="مثال: يفضل مواعيد بعد العصر..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg p-2.5 text-xs text-neutral-200 placeholder-neutral-500 transition-colors duration-150 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 flex items-center gap-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{studentToEdit ? "حفظ التعديلات" : "إضافة الطالب"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { StudentModal };