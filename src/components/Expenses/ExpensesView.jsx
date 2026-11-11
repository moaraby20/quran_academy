import { useState, useMemo, useEffect } from "react";
import {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation
} from "../../rtk/slices/apiSlice";
import { formatDate } from "../../utils/formatters";
import { ConfirmModal } from "../Modals/ConfirmModal";
import { DateRangeFilter, isDateInRange } from "../Common/DateRangeFilter";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown
} from "lucide-react";

const ExpensesView = () => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(50);
  const [category, setCategory] = useState("zoom");
  const [date, setDate] = useState((new Date()).toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 1. نظام الباجنيشن من السيرفر
  const [fetchLimit, setFetchLimit] = useState(15);

  // إعادة تعيين الـ Limit عند استخدام الفلتر الزمني (المحلي) لعدم إرباك العرض
  useEffect(() => {
    setFetchLimit(15);
  }, [selectedMonth, startDate, endDate]);

  // 2. جلب المصروفات من السيرفر ممرراً الحد الأقصى الجديد
  const { data: rawExpenses = [], isLoading, isFetching } = useGetExpensesQuery(
    { limit: fetchLimit },
    {
      pollingInterval: 20000, // كل 20 ثانية كافية جداً للمصروفات
      refetchOnFocus: true,
      refetchOnReconnect: true
    }
  );

  const [createExpenseMut, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [deleteExpenseMut] = useDeleteExpenseMutation();

  // تحويل الحقول من snake_case (API) إلى camelCase (واجهة)
  const expenses = rawExpenses.map(e => ({
    ...e,
    amount: Number(e.amount)
  }));

  const availableMonths = useMemo(() => {
    return Array.from(new Set(expenses.map((e) => e.date?.substring(0, 7)))).sort().reverse();
  }, [expenses]);

  // 3. فلترة محلية بالتواريخ (لأن الباك إند يجلب الأحدث دائماً)
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date, selectedMonth, startDate, endDate));
  }, [expenses, selectedMonth, startDate, endDate]);

  // لاحظ أنه تم إزالة visibleCount و slice، فالعرض يعتمد على ما تم جلبه من السيرفر فقط.

  // للإحصائيات العلوية فقط
  const totalAllExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalFilteredExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const isDateFiltered = Boolean(selectedMonth || startDate || endDate);

  // تحديد متى نظهر زر "عرض المزيد"
  const showLoadMoreBtn = !isDateFiltered && expenses.length >= fetchLimit;

  const categoryLabels = {
    salaries: "أجور ورواتب معلمين",
    zoom: "اشتراكات Zoom وبث",
    software: "برمجيات وخدمات",
    rewards: "مكافآت وحوافز",
    marketing: "تسويق وإعلانات",
    operational: "تشغيل عام",
    other: "أخرى"
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    try {
      await createExpenseMut({
        title,
        amount,
        category,
        date,
        notes
      }).unwrap();

      setTitle("");
      setAmount(50);
      setNotes("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add expense:", err);
      alert(err?.data?.message || "حدث خطأ أثناء حفظ المصروف");
    }
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await deleteExpenseMut(expenseToDelete.id).unwrap();
        setExpenseToDelete(null);
      } catch (err) {
        console.error("Failed to delete expense:", err);
        alert(err?.data?.message || "حدث خطأ أثناء الحذف");
      }
    }
  };

  if (isLoading && fetchLimit === 15) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Header (Title + Action) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-neutral-100 flex items-center gap-2">
            <span>المصروفات التشغيلية</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              {filteredExpenses.length} {isDateFiltered ? "" : "+"} بنود
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            تسجيل ومتابعة بنود المصروفات العامة واشتراكات المنصات
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors duration-150 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? "إلغاء" : "إضافة مصروف جديد"}</span>
        </button>
      </div>

      {/* 2. Organized Filter Bar & Period Summary */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Right side: Period total indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-400">إجمالي مصروفات الفترة المفلترة:</span>
          <span className="font-mono tabular-nums text-sm font-bold text-emerald-400">
            {totalFilteredExpenses.toLocaleString("ar-EG")} ج.م
          </span>
          {isDateFiltered && (
            <span className="text-[11px] text-neutral-500 font-mono">
              (من إجمالي عام {totalAllExpenses.toLocaleString("ar-EG")} ج.م)
            </span>
          )}
        </div>

        {/* Left side: Time Filter */}
        <DateRangeFilter
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          availableMonths={availableMonths}
        />
      </div>

      {/* Add Expense Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4"
        >
          <h3 className="text-xs font-semibold text-neutral-200">
            تسجيل مصروف جديد
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                بيان المصروف *
              </label>
              <input
                type="text"
                placeholder="مثال: اشتراك شهري Zoom Pro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 transition-colors duration-150 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                المبلغ (ج.م) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono tabular-nums transition-colors duration-150 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                التصنيف
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 transition-colors duration-150 outline-none"
              >
                <option value="salaries">أجور ورواتب معلمين</option>
                <option value="zoom">اشتراكات Zoom وبث</option>
                <option value="software">برمجيات وخدمات</option>
                <option value="rewards">مكافآت وحوافز</option>
                <option value="marketing">تسويق وإعلانات</option>
                <option value="operational">تشغيل عام</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                تاريخ الصرف
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono tabular-nums transition-colors duration-150 outline-none focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              ملاحظات
            </label>
            <input
              type="text"
              placeholder="مثال: فاتورة المنصة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 transition-colors duration-150 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              disabled={isCreating}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors duration-150 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-1.5 flex items-center gap-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
            >
              {isCreating && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>حفظ المصروف</span>
            </button>
          </div>
        </form>
      )}

      {/* Expenses Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            {isDateFiltered ? "لا توجد مصروفات مسجلة في هذه الفترة المحددة." : "لا توجد مصروفات مسجلة حتى الآن."}
          </div>
        ) : (
          <>
            <div className="divide-y divide-neutral-800">
              {filteredExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-neutral-800/30 transition-colors duration-150"
                >
                  {/* Title & Mobile Amount */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                        {exp.title}
                      </span>
                      {/* Mobile prominent amount */}
                      <span className="sm:hidden text-xs font-bold text-emerald-400 font-mono tabular-nums whitespace-nowrap shrink-0">
                        {exp.amount.toLocaleString("ar-EG")} ج.م
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 mt-1 font-mono tabular-nums">
                      <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 font-sans">
                        {categoryLabels[exp.category]}
                      </span>
                      <span className="text-neutral-600">·</span>
                      <span>{formatDate(exp.date)}</span>
                      {exp.notes && (
                        <>
                          <span className="text-neutral-600">·</span>
                          <span className="font-sans text-neutral-400 truncate max-w-xs">{exp.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Desktop Amount & Delete Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                    <span className="hidden sm:inline-block text-xs sm:text-sm font-bold text-emerald-400 font-mono tabular-nums whitespace-nowrap">
                      {exp.amount.toLocaleString("ar-EG")} ج.م
                    </span>

                    <button
                      onClick={() => setExpenseToDelete(exp)}
                      title="حذف المصروف"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-950 transition-colors duration-150 cursor-pointer mr-auto sm:mr-0"
                    >
                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. زر تحميل المزيد المربوط بالسيرفر */}
            {showLoadMoreBtn && (
              <div className="flex justify-center p-4 bg-neutral-900/50 border-t border-neutral-800">
                <button
                  onClick={() => setFetchLimit((prev) => prev + 15)}
                  disabled={isFetching}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التحميل...</span>
                    </>
                  ) : (
                    <>
                      <span>عرض المزيد</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <ConfirmModal
          isOpen={Boolean(expenseToDelete)}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={confirmDelete}
          title="حذف المصروف"
          description={`هل أنت متأكد من حذف بند المصروف "${expenseToDelete.title}" بمبلغ ${expenseToDelete.amount.toLocaleString("ar-EG")} ج.م؟`}
          details={[
            "سيتم حذفه نهائياً من سجل المصروفات.",
            "سيتم تحديث إجمالي المصروفات وصافي الأرباح في الرئيسية فوراً."
          ]}
          confirmText="تأكيد الحذف"
          variant="danger"
          iconType="trash"
        />
      )}
    </div>
  );
};

export { ExpensesView };