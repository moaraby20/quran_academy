import React, { useState, useEffect } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import {
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation
} from "../../rtk/slices/apiSlice";

const TeacherModal = ({ isOpen, onClose, teacherToEdit }) => {
  // استدعاء دوال الـ API
  const [createTeacher, { isLoading: isCreating }] = useCreateTeacherMutation();
  const [updateTeacher, { isLoading: isUpdating }] = useUpdateTeacherMutation();
  const [deleteTeacherMut, { isLoading: isDeleting }] = useDeleteTeacherMutation();

  const isSubmitting = isCreating || isUpdating;

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [gender, setGender] = useState("male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rate30, setRate30] = useState("");
  const [rate45, setRate45] = useState("");
  const [rate60, setRate60] = useState("");
  const [isSuspended, setIsSuspended] = useState(false);
  const [notes, setNotes] = useState("");

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(teacherToEdit?.name || "");
      setTitle(teacherToEdit?.title || "");
      setGender(teacherToEdit?.gender || "male");
      setPhone(teacherToEdit?.phone || "");
      setEmail(teacherToEdit?.email || "");
      setPassword(teacherToEdit?.password || "");
      setRate30(teacherToEdit?.rates?.rate30 !== undefined ? String(teacherToEdit.rates.rate30) : "");
      setRate45(teacherToEdit?.rates?.rate45 !== undefined ? String(teacherToEdit.rates.rate45) : "");
      setRate60(teacherToEdit?.rates?.rate60 !== undefined ? String(teacherToEdit.rates.rate60) : "");
      setIsSuspended(Boolean(teacherToEdit?.isSuspended));
      setNotes(teacherToEdit?.notes || "");
      setIsDeleteConfirmOpen(false);
    }
  }, [isOpen, teacherToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const teacherData = {
      name,
      title: title || "معلم قرآن كريم",
      gender,
      phone,
      email,
      password: password || "123456",
      rate_30: Number(rate30) || 0,
      rate_45: Number(rate45) || 0,
      rate_60: Number(rate60) || 0,
      status: isSuspended ? "suspended" : "active",
      notes
    };

    try {
      if (teacherToEdit) {
        await updateTeacher({ id: teacherToEdit.id, data: teacherData }).unwrap();
      } else {
        await createTeacher(teacherData).unwrap();
      }
      onClose();
    } catch (err) {
      console.error("Error saving teacher:", err);
      alert(err?.data?.message || "حدث خطأ أثناء حفظ بيانات المعلم");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteTeacherMut(teacherToEdit.id).unwrap();
      onClose();
    } catch (err) {
      alert(err?.data?.message || "حدث خطأ أثناء حذف المعلم");
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
            {teacherToEdit ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting || isDeleting}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Name & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                الاسم بالكامل *
              </label>
              <input
                type="text"
                placeholder="مثال: الشيخ أحمد الزيات"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 transition-colors duration-150 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                الصفة
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 transition-colors duration-150 outline-none"
              >
                <option value="male">معلم / مقرئ</option>
                <option value="female">معلمة / مقرئة</option>
              </select>
            </div>
          </div>

          {/* Title / Qualification */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              المؤهل أو التخصص
            </label>
            <input
              type="text"
              placeholder="مثال: مجاز بالقراءات العشر، أو معلمة تأسيس أطفال"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 transition-colors duration-150 outline-none"
            />
          </div>

          {/* Contact & Login Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                رقم الهاتف (واتساب) *
              </label>
              <input
                type="text"
                placeholder="01xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono transition-colors duration-150 text-right dir-ltr outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                البريد الإلكتروني (للدخول) *
              </label>
              <input
                type="email"
                placeholder="teacher@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono transition-colors duration-150 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                كلمة المرور للحساب *
              </label>
              <input
                type="text"
                placeholder="مثال: 123456"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono transition-colors duration-150 outline-none"
                required
              />
            </div>
          </div>

          {/* Rates Setup */}
          <div className="pt-2 border-t border-neutral-800">
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              تسعيرة أجر الحصة المحدد للمعلم (بالجنيه المصري ج.م):
            </label>

            <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
              <div>
                <span className="block text-[11px] text-neutral-400 mb-1">حصة 30 دقيقة:</span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={rate30}
                    onChange={(e) => setRate30(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 font-mono tabular-nums text-center outline-none"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 block text-center mt-0.5">ج.م</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] text-neutral-400 mb-1">حصة 45 دقيقة:</span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={rate45}
                    onChange={(e) => setRate45(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 font-mono tabular-nums text-center outline-none"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 block text-center mt-0.5">ج.م</span>
                </div>
              </div>

              <div>
                <span className="block text-[11px] text-neutral-400 mb-1">حصة 60 دقيقة:</span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={rate60}
                    onChange={(e) => setRate60(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 font-mono tabular-nums text-center outline-none"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 block text-center mt-0.5">ج.م</span>
                </div>
              </div>
            </div>
          </div>

          {/* Temporary Suspension Setting */}
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-neutral-200">
                تعطيل مؤقت للمعلم
              </span>
              <span className="block text-[11px] text-neutral-400 mt-0.5">
                منع المعلم من تسجيل أي حصص جديدة من حسابه مؤقتاً
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSuspended}
                onChange={(e) => setIsSuspended(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
            </label>
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
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
            <div>
              {teacherToEdit && (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isSubmitting || isDeleting}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 transition-colors duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف المعلم</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors duration-150 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{teacherToEdit ? "حفظ التعديلات" : "إضافة المعلم"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {teacherToEdit && (
        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="حذف المعلم"
          description={`هل أنت متأكد من حذف المعلم "${teacherToEdit.name}"؟`}
          details={[
            "لن يتم حذف أي من حصص الطلاب أو تقاريرهم وستظل محفوظة بالأرشيف.",
            "سيتم حذف حساب المعلم فقط."
          ]}
          confirmText={isDeleting ? "جاري الحذف..." : "تأكيد الحذف"}
          variant="danger"
          iconType="trash"
        />
      )}
    </div>
  );
};

export { TeacherModal };