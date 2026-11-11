import { Calendar, X, RotateCcw } from "lucide-react";
const formatMonthLabel = (monthStr) => {
  if (!monthStr) return "\u0643\u0627\u0641\u0629 \u0627\u0644\u0641\u062A\u0631\u0627\u062A";
  const parts = monthStr.split("-");
  if (parts.length !== 2) return monthStr;
  const year = parts[0];
  const month = parts[1];
  const monthNames = [
    "\u064A\u0646\u0627\u064A\u0631",
    "\u0641\u0628\u0631\u0627\u064A\u0631",
    "\u0645\u0627\u0631\u0633",
    "\u0623\u0628\u0631\u064A\u0644",
    "\u0645\u0627\u064A\u0648",
    "\u064A\u0648\u0646\u064A\u0648",
    "\u064A\u0648\u0644\u064A\u0648",
    "\u0623\u063A\u0633\u0637\u0633",
    "\u0633\u0628\u062A\u0645\u0628\u0631",
    "\u0623\u0643\u062A\u0648\u0628\u0631",
    "\u0646\u0648\u0641\u0645\u0628\u0631",
    "\u062F\u064A\u0633\u0645\u0628\u0631"
  ];
  const mIndex = parseInt(month, 10) - 1;
  const name = monthNames[mIndex] || month;
  return `\u0634\u0647\u0631 ${monthStr} (${name})`;
};
const isDateInRange = (dateStr, selectedMonth, startDate, endDate) => {
  if (!dateStr) return false;
  const cleanDate = dateStr.substring(0, 10);
  if (startDate || endDate) {
    if (startDate && cleanDate < startDate) return false;
    if (endDate && cleanDate > endDate) return false;
    return true;
  }
  if (selectedMonth) {
    return cleanDate.startsWith(selectedMonth);
  }
  return true;
};
const DateRangeFilter = ({
  selectedMonth,
  onMonthChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  availableMonths = [],
  onReset,
  className = "",
  label
}) => {
  const hasActiveFilter = Boolean(selectedMonth || startDate || endDate);
  const handleClear = () => {
    onMonthChange("");
    onStartDateChange("");
    onEndDateChange("");
    if (onReset) onReset();
  };
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-neutral-400 font-medium hidden sm:inline shrink-0">
          {label}
        </span>}

      {
    /* Month dropdown */
  }
      <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 transition-colors w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-neutral-500 text-[11px] sm:hidden">الشهر:</span>
        </div>
        <select
    value={selectedMonth}
    onChange={(e) => {
      const val = e.target.value;
      onMonthChange(val);
      if (val) {
        onStartDateChange("");
        onEndDateChange("");
      }
    }}
    style={{ colorScheme: "dark" }}
    className="bg-transparent text-neutral-200 border-none text-xs focus:outline-none cursor-pointer pr-1 flex-1 sm:flex-initial"
  >
          <option
    value=""
    style={{ backgroundColor: "#171717", color: "#f5f5f5" }}
    className="bg-neutral-900 text-neutral-100"
  >
            كافة الفترات
          </option>
          {availableMonths.map((m) => <option
    key={m}
    value={m}
    style={{ backgroundColor: "#171717", color: "#f5f5f5" }}
    className="bg-neutral-900 text-neutral-100 py-1"
  >
              {formatMonthLabel(m)}
            </option>)}
        </select>
      </div>

      {
    /* Custom Date Range (من - إلى) */
  }
      <div className="flex items-center gap-1 sm:gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2 sm:px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-700 transition-colors w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
          <span className="text-[11px] text-neutral-400 font-medium shrink-0">من:</span>
          <input
    type="date"
    dir="ltr"
    value={startDate}
    onChange={(e) => {
      onStartDateChange(e.target.value);
      if (e.target.value && selectedMonth) {
        onMonthChange("");
      }
    }}
    style={{ colorScheme: "dark" }}
    className="w-full sm:w-[115px] bg-neutral-900/90 border border-neutral-800 rounded px-1 py-0.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono text-center cursor-pointer min-w-0"
    title="تاريخ البداية"
  />
        </div>

        <span className="text-neutral-600 px-0.5 shrink-0">|</span>

        <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
          <span className="text-[11px] text-neutral-400 font-medium shrink-0">إلى:</span>
          <input
    type="date"
    dir="ltr"
    value={endDate}
    onChange={(e) => {
      onEndDateChange(e.target.value);
      if (e.target.value && selectedMonth) {
        onMonthChange("");
      }
    }}
    style={{ colorScheme: "dark" }}
    className="w-full sm:w-[115px] bg-neutral-900/90 border border-neutral-800 rounded px-1 py-0.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 font-mono text-center cursor-pointer min-w-0"
    title="تاريخ النهاية"
  />
        </div>

        {hasActiveFilter && <button
    onClick={handleClear}
    type="button"
    title="مسح التاريخ"
    className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 rounded transition-colors cursor-pointer mr-0.5 shrink-0"
  >
            <X className="w-3.5 h-3.5" />
          </button>}
      </div>

      {hasActiveFilter && <button
    onClick={handleClear}
    type="button"
    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-950/40 border border-amber-900/40 hover:bg-amber-950/70 transition-colors cursor-pointer shrink-0"
    title="مسح تصفية التاريخ"
  >
          <RotateCcw className="w-3 h-3" />
          <span>مسح التصفية</span>
        </button>}
    </div>;
};
export {
  DateRangeFilter,
  formatMonthLabel,
  isDateInRange
};
