import { useState } from "react";
import { X, Banknote, Calendar, FileText, Check, Users, Loader2 } from "lucide-react";
import { useSettleTeacherWagesMutation, useCreateExpenseMutation } from "../../rtk/slices/apiSlice";

const BulkSettlementModal = ({
  isOpen,
  onClose,
  selectedTeachers,
  sessions
}) => {
  // استدعاء دوال الـ API
  const [settleWagesMut] = useSettleTeacherWagesMutation();
  const [createExpenseMut] = useCreateExpenseMutation();

  const [settledAt, setSettledAt] = useState((new Date()).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("تحويل إنستاباي");
  const [recordAsExpense, setRecordAsExpense] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || selectedTeachers.length === 0) return null;

  // تجهيز ملخص المعلمين والمبالغ المستحقة
  const teachersSummary = selectedTeachers.map((teacher) => {
    const unsettled = sessions.filter((s) => s.teacherId === teacher.id && !s.settled);
    const amount = unsettled.reduce((acc, s) => acc + (s.teacherWage || 0), 0);
    return {
      teacher,
      unsettled, // الاحتفاظ بالحلقات نفسها لجلب معرفاتها (IDs)
      unsettledCount: unsettled.length,
      amount
    };
  });

  const eligibleTeachers = teachersSummary.filter((t) => t.unsettledCount > 0);
  const totalAmount = eligibleTeachers.reduce((acc, t) => acc + t.amount, 0);
  const totalSessionsCount = eligibleTeachers.reduce((acc, t) => acc + t.unsettledCount, 0);

  const handleQuickNote = (tag) => {
    setNotes(tag);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (eligibleTeachers.length === 0) {
      alert("لا توجد حصص غير مدفوعة لدى المعلمين المحددين لتصفيرها.");
      return;
    }

    setIsSubmitting(true);

    try {
      const promises = [];

      for (const t of eligibleTeachers) {
        const sessionIds = t.unsettled.map(s => s.id);

        promises.push(
          settleWagesMut({
            teacher_id: t.teacher.id,
            session_ids: sessionIds,
            amount: t.amount,
            notes: notes.trim(),
            record_as_expense: recordAsExpense // <--- إرسال الأمر للباك إند
          }).unwrap()
        );
      }

      await Promise.all(promises);
      onClose();
    } catch (err) {
      console.error("Bulk settlement error:", err);
      alert("حدث خطأ أثناء تنفيذ بعض أو كل عمليات التصفير.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
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
                صرف وتصفير حسابات متعددة ({selectedTeachers.length} معلمين)
              </h3>
              <p className="text-[11px] text-neutral-400">
                تسجيل مستحقات كل معلم كبند مصروف منفصل في النظام
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
              <span className="font-sans text-xs text-neutral-400">إجمالي مبالغ الصرف المطلوبة:</span>
              <span className="text-base font-bold text-emerald-400">
                {totalAmount.toLocaleString("ar-EG")} ج.م
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
              <span className="font-sans">المعلمون الذين لديهم مستحقات:</span>
              <span className="font-semibold text-neutral-200">
                {eligibleTeachers.length} من أصل {selectedTeachers.length} معلم
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
              <span className="font-sans">إجمالي الحصص المستحقة:</span>
              <span>{totalSessionsCount} حصة</span>
            </div>
          </div>

          {/* List of Teachers and amounts */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span>تفصيل المعلمين وقيمة الصرف لكل منهم:</span>
            </label>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl divide-y divide-neutral-800/60 max-h-40 overflow-y-auto">
              {teachersSummary.map(({ teacher, unsettledCount, amount }) => (
                <div key={teacher.id} className="p-2.5 px-3 flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <span className="font-medium text-neutral-200 block truncate">{teacher.name}</span>
                    <span className="text-[11px] text-neutral-500 font-mono tabular-nums">
                      {unsettledCount > 0 ? `${unsettledCount} حصة مستحقة` : "لا توجد حصص معلقة (مصفّر)"}
                    </span>
                  </div>
                  <div className="text-left font-mono tabular-nums">
                    <span className={`font-semibold ${amount > 0 ? "text-emerald-400" : "text-neutral-500"}`}>
                      {amount.toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>
                </div>
              ))}
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
              <span>طريقة الصرف أو الملاحظات (تُسجل لكل معلم)</span>
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
              id="recordAsExpenseBulk"
              checked={recordAsExpense}
              onChange={(e) => setRecordAsExpense(e.target.checked)}
              className="mt-0.5 rounded bg-neutral-900 border-neutral-700 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="recordAsExpenseBulk" className="text-xs text-neutral-300 cursor-pointer select-none">
              <span className="font-medium text-neutral-200 block">
                تسجيل قيد مصروف منفصل لكل معلم على حدة
              </span>
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                سيتم إنشاء قيد مصروف تشغيلي مستقل باسم كل معلم ومبلغه في سجل المصروفات، لتسهيل التتبع المالي الدقيق.
              </span>
            </label>
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
              disabled={isSubmitting || eligibleTeachers.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white transition-all duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-950/40"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>
                {isSubmitting ? "جاري الصرف والتصفير..." : `تأكيد تصفير حسابات (${eligibleTeachers.length}) معلمين`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { BulkSettlementModal };