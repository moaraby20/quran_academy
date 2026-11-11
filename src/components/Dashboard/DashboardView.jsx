import { useState } from "react";
import { RenewalAlertsList } from "./RenewalAlertsList";
import { DateRangeFilter, formatMonthLabel } from "../Common/DateRangeFilter";
import {
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  Loader2
} from "lucide-react";
import { useGetAdminDashboardStatsQuery } from "../../rtk/slices/apiSlice";

const DashboardView = () => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isDateFiltered = Boolean(selectedMonth || startDate || endDate);

  // نمرر الفلاتر للـ API مباشرة ليتولى السيرفر الحسابات المعقدة
  const queryParams = {
    ...(selectedMonth && { month: selectedMonth }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
  };

  // جلب الإحصائيات المجمعة من السيرفر
  const { data: statsData, isLoading, isFetching } = useGetAdminDashboardStatsQuery(queryParams, {
    pollingInterval: 30000, // المؤشرات الأساسية تتحدث كل 30 ثانية لتخفيف الضغط
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // استخراج الأرقام الجاهزة من السيرفر
  const totalRevenue = statsData?.total_revenue || 0;
  const totalExpenses = statsData?.total_expenses || 0;
  const netProfit = statsData?.net_profit || 0;
  const profitMargin = statsData?.profit_margin || 0;
  const newStudentsRevenue = statsData?.new_students_revenue || 0;
  const renewalsRevenue = statsData?.renewals_revenue || 0;
  const displayedSessionsCount = statsData?.sessions_count || 0;
  const expensesCount = statsData?.expenses_count || 0;
  const availableMonths = statsData?.available_months || [];

  return (
    <div className="space-y-4">
      {/* 1. Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-neutral-100">
            لوحة المؤشرات
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            إحصائيات ومؤشرات الأداء العامة للأكاديمية والعمليات التشغيلية
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          {isFetching && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
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
      </div>

      {/* Filter status banner if filtered */}
      {isDateFiltered && (
        <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">📍 إحصائيات الفترة المحددة:</span>
            <span className="text-neutral-200 font-mono">
              {startDate || endDate ? `من ${startDate || "البداية"} إلى ${endDate || "الآن"}` : formatMonthLabel(selectedMonth)}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedMonth("");
              setStartDate("");
              setEndDate("");
            }}
            className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
          >
            إلغاء التصفية وعرض الإحصائيات العامة
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Revenue */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>{isDateFiltered ? "وارد الفترة المحددة" : "إجمالي الوارد"}</span>
            <TrendingUp className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold text-neutral-100 font-mono tabular-nums">
              {totalRevenue.toLocaleString("ar-EG")}
            </span>
            <span className="text-xs text-neutral-500 font-mono">ج.م</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1 font-mono tabular-nums flex gap-1">
            <span>طلاب: {newStudentsRevenue.toLocaleString("ar-EG")}</span>
            <span>|</span>
            <span>تجديد: {renewalsRevenue.toLocaleString("ar-EG")}</span>
          </div>
        </div>

        {/* Metric 2: Total Expenses */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>{isDateFiltered ? "مصروفات الفترة المحددة" : "إجمالي المصروفات"}</span>
            <TrendingDown className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold text-neutral-100 font-mono tabular-nums">
              {totalExpenses.toLocaleString("ar-EG")}
            </span>
            <span className="text-xs text-neutral-500 font-mono">ج.م</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono tabular-nums">
            {expensesCount} بنود مصروفات
          </div>
        </div>

        {/* Metric 3: Net Profit */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>{isDateFiltered ? "أرباح الفترة" : "صافي الأرباح"}</span>
            <span className={`text-[11px] font-mono tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {profitMargin}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-semibold font-mono tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netProfit.toLocaleString("ar-EG")}
            </span>
            <span className="text-xs text-neutral-500 font-mono">ج.م</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            صافي بعد التكاليف
          </div>
        </div>

        {/* Metric 4: Sessions */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>{isDateFiltered ? "حصص الفترة" : "إجمالي الحصص"}</span>
            <CalendarCheck className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-semibold text-neutral-100 font-mono tabular-nums">
              {displayedSessionsCount.toLocaleString("ar-EG")}
            </span>
            <span className="text-xs text-neutral-500">حصة</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono tabular-nums">
            {statsData?.total_active_teachers || 0} معلمين نشطين
          </div>
        </div>
      </div>

      {/* Subscription Renewal Alerts */}
      <RenewalAlertsList />
    </div>
  );
};

export { DashboardView };