import { useState } from "react";
import { X, Banknote, Calendar, FileText, Check, Loader2 } from "lucide-react";
import { useSettleTeacherWagesMutation, useCreateExpenseMutation } from "../../rtk/slices/apiSlice";

const TeacherSettlementModal = ({
  isOpen,
  onClose,
  teacher,
  unsettledSessions
}) => {
  // استدعاء دوال الـ API
  const [settleWagesMut, { isLoading: isSettling }] = useSettleTeacherWagesMutation();
  const [createExpenseMut, { isLoading: isExpensing }] = useCreateExpenseMutation();

  const isSubmitting = isSettling || isExpensing;

  const [settledAt, setSettledAt] = useState((new Date()).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("تحويل إنستاباي");
  const [recordAsExpense, setRecordAsExpense] = useState(true);

  if (!isOpen) return null;

  const totalAmount = unsettledSessions.reduce((acc, s) => acc + (s.teacherWage || 0), 0);
  const count30 = unsettledSessions.filter((s) => s.duration === 30).length;
  const count45 = unsettledSessions.filter((s) => s.duration === 45).length;
  const count60 = unsettledSessions.filter((s) => s.duration === 60).length;

  const handleQuickNote = (tag) => {
    setNotes(tag);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (unsettledSessions.length === 0) {
      alert("لا توجد حصص غير مدفوعة لتصفيرها.");
      return;
    }

    try {
      const sessionIds = unsettledSessions.map(s => s.id);

      // الباك إند سيقوم بالصرف وإضافة المصروف معاً!
      await settleWagesMut({
        teacher_id: teacher.id,
        session_ids: sessionIds,
        amount: totalAmount,
        notes: notes.trim(),
        record_as_expense: recordAsExpense // <--- إرسال الأمر للباك إند
      }).unwrap();

      onClose();
    } catch (err) {
      console.error("Failed to settle wages:", err);
      alert(err?.data?.message || "حدث خطأ أثناء تصفير الحساب");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-100">
                صرف المستحقات وتصفير الحساب
              </h3>
              <p className="text-[11px] text-neutral-400">
                المعلم: <strong className="text-neutral-200">{teacher.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleConfirm} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Summary Box */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3 font-mono tabular-nums">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs text-neutral-400">المبلغ المستحق للصرف والتصفير:</span>
              <span className="text-base font-bold text-emerald-400">
                {totalAmount.toLocaleString("ar-EG")} ج.م
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
              <span className="font-sans">الحصص المشمولة في الصرف:</span>
              <span className="font-semibold text-neutral-200">
                {unsettledSessions.length} حصة
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
              <span className="font-sans">تفصيل الحصص:</span>
              <span>
                30د ({count30}) · 45د ({count45}) · 60د ({count60})
              </span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>تاريخ الصرف والتسوية *</span>
            </label>
            <input
              type="date"
              value={settledAt}
              onChange={(e) => setSettledAt(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono tabular-nums transition-colors duration-150 focus:outline-none"
              required
            />
          </div>

          {/* Payment Method / Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              <span>طريقة الصرف أو الملاحظات</span>
            </label>
            <input
              type="text"
              placeholder="مثال: تحويل إنستاباي، فودافون كاش، نقداً..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 transition-colors duration-150 focus:outline-none"
            />
            {/* Quick tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["تحويل إنستاباي", "فودافون كاش", "نقداً باليد", "تحويل بنكي", "محفظة إلكترونية"].map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleQuickNote(tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${notes === tag ? "bg-emerald-950 border-emerald-700 text-emerald-300" : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Record as Expense Checkbox */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="recordAsExpense"
              checked={recordAsExpense}
              onChange={(e) => setRecordAsExpense(e.target.checked)}
              className="mt-0.5 rounded bg-neutral-900 border-neutral-700 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="recordAsExpense" className="text-xs text-neutral-300 cursor-pointer select-none">
              <span className="font-medium text-neutral-200 block">
                تسجيل المبلغ كمصروف تشغيلي في حسابات الأكاديمية
              </span>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                يقوم تلقائياً بإضافة قيد في سجل المصروفات ليظهر ضمن المصروفات وصافي الأرباح.
              </span>
            </label>
          </div>

          {/* Notice */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
            💡 <strong className="text-neutral-300">ماذا سيحدث بعد التصفير؟</strong> سيصبح الرصيد المستحق الحالي للمعلم <strong className="text-emerald-400 font-mono">0 ج.م</strong>، وستبدأ الحصص الجديدة القادمة في الاحتساب من الصفر، وتبقى هذه الحصص محفوظة وموثقة بالكامل في الأرشيف وسجل التسويات.
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors duration-150 cursor-pointer disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || unsettledSessions.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white transition-all duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-950/40"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isSubmitting ? "جاري التسوية..." : "تأكيد الصرف وتصفير الرصيد"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { TeacherSettlementModal };