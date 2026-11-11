import React, { useState, useEffect } from "react";
import { useAcademy } from "../../context/AcademyContext";
import {
  useGetTeachersQuery,
  useGetSessionsQuery,
  useGetSettlementsQuery, // تم إضافة جلب التسويات
  useDeleteTeacherMutation,
  useToggleTeacherSuspensionMutation,
  useSettleTeacherWagesMutation,
  useRevertSettlementMutation // تم إضافة التراجع
} from "../../rtk/slices/apiSlice";
import { formatDate } from "../../utils/formatters";
import { TeacherModal } from "../Modals/TeacherModal";
import { TeacherSettlementModal } from "../Modals/TeacherSettlementModal";
import { BulkSettlementModal } from "../Modals/BulkSettlementModal";
import { ConfirmModal } from "../Modals/ConfirmModal";
import { DateRangeFilter, isDateInRange } from "../Common/DateRangeFilter";
import {
  Printer,
  UserPlus,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Banknote,
  History,
  CheckCircle2,
  Clock,
  RotateCcw,
  Check,
  CheckSquare,
  Square,
  AlertTriangle,
  UserX,
  UserCheck,
  Loader2
} from "lucide-react";

const TeachersPayrollView = () => {
  const { currentUser } = useAcademy();
  const isTeacher = currentUser?.role === "teacher";
  const currentTeacherId = isTeacher ? currentUser.id : null;

  // جلب الداتا من الـ API (مع التحديث التلقائي لضمان دقة الرواتب والحصص)
  const pollingConfig = { pollingInterval: 15000, refetchOnFocus: true, refetchOnReconnect: true };

  const { data: rawTeachers = [], isLoading: isLoadingTeachers } = useGetTeachersQuery(undefined, pollingConfig);
  const { data: rawSessions = [], isLoading: isLoadingSessions } = useGetSessionsQuery(undefined, pollingConfig);
  const { data: rawSettlements = [], isLoading: isLoadingSettlements } = useGetSettlementsQuery(undefined, pollingConfig);

  const [deleteTeacherMut] = useDeleteTeacherMutation();
  const [toggleSuspensionMut] = useToggleTeacherSuspensionMutation();
  const [revertSettlementMut] = useRevertSettlementMutation();

  const isLoading = isLoadingTeachers || isLoadingSessions || isLoadingSettlements;

  // توحيد الحقول لتتوافق مع الواجهة
  const teachers = rawTeachers.map(t => ({
    ...t,
    isSuspended: t.is_suspended == 1,
    rates: {
      rate30: Number(t.rate_30),
      rate45: Number(t.rate_45),
      rate60: Number(t.rate_60)
    }
  }));

  const sessions = rawSessions.map(s => ({
    ...s,
    teacherId: s.teacher_id,
    studentId: s.student_id,
    teacherWage: Number(s.teacher_wage),
    settled: s.settled == 1,
    duration: Number(s.duration)
  }));

  // توحيد بيانات التسويات
  const settlements = rawSettlements.map(stl => ({
    ...stl,
    teacherId: stl.teacher_id,
    sessionsCount: Number(stl.sessions_count),
    amount: Number(stl.amount),
    settledAt: stl.settled_at || stl.created_at
  }));

  const [selectedTeacherId, setSelectedTeacherId] = useState(isTeacher && currentTeacherId ? currentTeacherId : "all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [teacherToEdit, setTeacherToEdit] = useState(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherToSettle, setTeacherToSettle] = useState(null);
  const [isBulkSettleModalOpen, setIsBulkSettleModalOpen] = useState(false);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);

  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [teacherToToggleSuspension, setTeacherToToggleSuspension] = useState(null);
  const [bulkSuspensionAction, setBulkSuspensionAction] = useState(null);
  const [settlementToRevert, setSettlementToRevert] = useState(null);

  const [expandedTeacherId, setExpandedTeacherId] = useState(isTeacher && currentTeacherId ? currentTeacherId : null);
  const [drawerTabs, setDrawerTabs] = useState({});
  const [printTeacherVoucher, setPrintTeacherVoucher] = useState(null);
  const [printSettlementReceipt, setPrintSettlementReceipt] = useState(null);

  useEffect(() => {
    if (isTeacher && currentTeacherId) {
      setSelectedTeacherId(currentTeacherId);
      setExpandedTeacherId(currentTeacherId);
    } else if (!isTeacher && teachers.length > 0 && !expandedTeacherId) {
      setExpandedTeacherId(teachers[0].id);
    }
  }, [isTeacher, currentTeacherId, teachers, expandedTeacherId]);

  const filteredSessions = sessions.filter(
    (s) => isDateInRange(s.date, selectedMonth, startDate, endDate)
  );

  const baseTeachers = isTeacher && currentTeacherId
    ? teachers.filter((t) => t.id === currentTeacherId)
    : selectedTeacherId === "all"
      ? teachers
      : teachers.filter((t) => t.id === selectedTeacherId);

  const displayedTeachers = baseTeachers.filter((t) => {
    if (selectedStatusFilter === "active") return !t.isSuspended;
    if (selectedStatusFilter === "suspended") return Boolean(t.isSuspended);
    return true;
  });

  const suspendedTeachersCount = teachers.filter((t) => t.isSuspended).length;

  const availableMonths = Array.from(
    new Set(sessions.map((s) => s.date?.substring(0, 7)).filter(Boolean))
  ).sort().reverse();

  const handleOpenEditTeacher = (teacher) => {
    setTeacherToEdit(teacher);
    setIsTeacherModalOpen(true);
  };

  const handleOpenAddTeacher = () => {
    setTeacherToEdit(null);
    setIsTeacherModalOpen(true);
  };

  const getTeacherDrawerTab = (teacherId) => {
    return drawerTabs[teacherId] || "pending";
  };

  const setTeacherDrawerTab = (teacherId, tab) => {
    setDrawerTabs((prev) => ({ ...prev, [teacherId]: tab }));
  };

  const handleToggleSelectTeacher = (id) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const handleSelectAllDisplayed = () => {
    if (selectedTeacherIds.length === displayedTeachers.length) {
      setSelectedTeacherIds([]);
    } else {
      setSelectedTeacherIds(displayedTeachers.map((t) => t.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTeacherIds.length === 0) return;
    setIsBulkDeleteConfirmOpen(true);
  };

  const confirmDeleteTeacher = async () => {
    if (teacherToDelete) {
      try {
        await deleteTeacherMut(teacherToDelete.id).unwrap();
        setTeacherToDelete(null);
      } catch (err) {
        alert(err?.data?.message || "حدث خطأ أثناء الحذف");
      }
    }
  };

  const confirmToggleSuspension = async () => {
    if (teacherToToggleSuspension) {
      try {
        await toggleSuspensionMut(teacherToToggleSuspension.teacher.id).unwrap();
        setTeacherToToggleSuspension(null);
      } catch (err) {
        alert(err?.data?.message || "حدث خطأ أثناء تغيير حالة الحساب");
      }
    }
  };

  const handleConfirmRevert = async () => {
    if (settlementToRevert) {
      try {
        await revertSettlementMut(settlementToRevert.id).unwrap();
        setSettlementToRevert(null);
      } catch (err) {
        alert(err?.data?.message || "حدث خطأ أثناء التراجع عن التسوية");
      }
    }
  };

  const teachersForBulkSettle = teachers.filter((t) => selectedTeacherIds.includes(t.id));
  const bulkTotalUnsettledDue = teachersForBulkSettle.reduce((acc, t) => {
    const un = filteredSessions.filter((s) => s.teacherId === t.id && !s.settled);
    return acc + un.reduce((sum, s) => sum + (s.teacherWage || 0), 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/*
        طبقة المحتوى الرئيسي:
        سيتم إخفاؤها بالكامل (print:hidden) عند فتح نافذة الطباعة لكي لا تتداخل.
      */}
      <div className="space-y-4 print:hidden">
        {/* 1. Header (Title + Primary Action) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-100 flex items-center gap-2">
              <span>{isTeacher ? "معلوماتي والمستحقات" : "المعلمين والمستحقات"}</span>
              {!isTeacher && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                  {teachers.length} معلمين
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isTeacher
                ? "كشف حساب الحصص المنفذة وتفاصيل المستحقات المالية الخاصة بي"
                : "كشف حساب الحصص وتصفير المستحقات وإدارة المعلمين (فردي وجماعي)"}
            </p>
          </div>

          {/* Primary Action Button (Admin only) */}
          {!isTeacher && (
            <button
              onClick={handleOpenAddTeacher}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors duration-150 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>معلم جديد</span>
            </button>
          )}
        </div>

        {/* 2. Organized Filter Bar */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Right side: Teacher & Status filters */}
          <div className="flex flex-wrap items-center gap-2">
            {!isTeacher && (
              <>
                <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="text-neutral-400 text-xs">المعلم:</span>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => {
                      setSelectedTeacherId(e.target.value);
                      setSelectedTeacherIds([]);
                    }}
                    className="bg-transparent text-neutral-200 border-none text-xs focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="all" className="bg-neutral-900 text-neutral-100">
                      كل المعلمين ({teachers.length})
                    </option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id} className="bg-neutral-900 text-neutral-100">
                        {t.name} {t.isSuspended ? " (معطل مؤقتاً)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="text-neutral-400 text-xs">الحالة:</span>
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => {
                      setSelectedStatusFilter(e.target.value);
                      setSelectedTeacherIds([]);
                    }}
                    className="bg-transparent text-neutral-200 border-none text-xs focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="all" className="bg-neutral-900 text-neutral-100">كافة الحالات</option>
                    <option value="active" className="bg-neutral-900 text-neutral-100">النشطين</option>
                    <option value="suspended" className="bg-neutral-900 text-neutral-100">المعطلين مؤقتاً</option>
                  </select>
                </div>
              </>
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

        {/* Admin Multi-Select Action Bar */}
        {!isTeacher && displayedTeachers.length > 0 && (
          <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllDisplayed}
                className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                {selectedTeacherIds.length > 0 && selectedTeacherIds.length === displayedTeachers.length ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-neutral-500" />}
                <span>
                  {selectedTeacherIds.length === 0 ? "تحديد معلمين للعمليات الجماعية" : `تم تحديد (${selectedTeacherIds.length} من ${displayedTeachers.length})`}
                </span>
              </button>
            </div>

            {selectedTeacherIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150 font-sans">
                <button
                  type="button"
                  onClick={() => setIsBulkSettleModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>
                    تصفير وصرف المحدد ({selectedTeacherIds.length})
                    {bulkTotalUnsettledDue > 0 && (
                      <span className="font-mono tabular-nums mr-1">
                        - {bulkTotalUnsettledDue.toLocaleString("ar-EG")} ج.م
                      </span>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTeacherIds([])}
                  className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                  title="إلغاء التحديد"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Teachers List */}
        <div className="space-y-3.5">
          {displayedTeachers.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-400">
              لا يوجد معلمين مسجلين حالياً أو لا يطابقون الفلتر.
            </div>
          ) : (
            displayedTeachers.map((teacher) => {
              const allTeacherSessions = filteredSessions.filter((s) => s.teacherId === teacher.id);
              const unsettledSessions = allTeacherSessions.filter((s) => !s.settled);
              const teacherSettlements = settlements.filter((stl) => stl.teacherId === teacher.id);

              const count30 = allTeacherSessions.filter((s) => s.duration === 30).length;
              const count45 = allTeacherSessions.filter((s) => s.duration === 45).length;
              const count60 = allTeacherSessions.filter((s) => s.duration === 60).length;

              const currentDue = unsettledSessions.reduce((acc, s) => acc + (s.teacherWage || 0), 0);
              const lifetimeEarnings = allTeacherSessions.reduce((acc, s) => acc + (s.teacherWage || 0), 0);

              const isExpanded = expandedTeacherId === teacher.id;
              const activeTab = getTeacherDrawerTab(teacher.id);
              const isSelected = selectedTeacherIds.includes(teacher.id);

              return (
                <div
                  key={teacher.id}
                  className={`bg-neutral-900 border rounded-xl overflow-hidden shadow-sm transition-colors ${isSelected ? "border-emerald-700/80 bg-neutral-900/90" : "border-neutral-800"}`}
                >
                  {/* Teacher Summary Header */}
                  <div className="p-3.5 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">

                    {/* Profile info & Checkbox */}
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                      {!isTeacher && (
                        <button
                          type="button"
                          onClick={() => handleToggleSelectTeacher(teacher.id)}
                          className="mt-0.5 text-neutral-500 hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-neutral-600 hover:text-neutral-400" />}
                        </button>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-neutral-100">
                            {teacher.name}
                          </h3>
                          {teacher.isSuspended && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 border border-amber-800 text-amber-300 flex items-center gap-1 shrink-0">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                              <span>معطل مؤقتاً</span>
                            </span>
                          )}
                          <span className="text-neutral-600 hidden sm:inline">·</span>
                          <span className="text-xs text-neutral-400 truncate">
                            {teacher.title}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1 font-mono tabular-nums">
                          <span>{teacher.phone}</span>
                          <span className="text-neutral-700">·</span>
                          <span>التسعيرة: 30د ({teacher.rates.rate30}) / 45د ({teacher.rates.rate45}) / 60د ({teacher.rates.rate60}) ج.م</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Stats & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">

                      {/* Current Unsettled Balance */}
                      <div className="flex items-center gap-2.5">
                        <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 flex-1 sm:flex-initial">
                          <span className="text-neutral-500 text-[10px] block font-sans">الرصيد المستحق حالياً:</span>
                          <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                            <span className={`text-sm font-bold ${currentDue > 0 ? "text-emerald-400" : "text-neutral-400"}`}>
                              {currentDue.toLocaleString("ar-EG")} ج.م
                            </span>
                            <span className="text-[10px] text-neutral-500 font-sans">
                              ({unsettledSessions.length} حصة)
                            </span>
                          </div>
                        </div>

                        {/* Historical Lifetime Total */}
                        <div className="hidden md:block bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800/60 font-sans">
                          <span className="text-neutral-500 text-[10px] block">إجمالي الأرشيف المفلتر:</span>
                          <span className="text-xs font-semibold text-neutral-300 font-mono tabular-nums">
                            {lifetimeEarnings.toLocaleString("ar-EG")} ج.م
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 font-sans">
                        {/* Settle & Reset Balance Button (Admin only) */}
                        {!isTeacher && (
                          <button
                            onClick={() => setTeacherToSettle(teacher)}
                            disabled={unsettledSessions.length === 0}
                            title={unsettledSessions.length > 0 ? "صرف المستحقات وتصفير الحساب الحالي" : "الحساب مصفّر ولا توجد حصص معلقة"}
                            className={`flex-1 sm:flex-initial px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${unsettledSessions.length > 0 ? "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-md shadow-emerald-950/40" : "bg-neutral-950 text-neutral-500 border border-neutral-800 cursor-not-allowed opacity-50"}`}
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>{currentDue > 0 ? "تصفير وصرف الحساب" : "الحساب مصفّر"}</span>
                          </button>
                        )}

                        {/* Icons Action Toolbar */}
                        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
                          <button
                            onClick={() => setPrintTeacherVoucher({
                              teacher,
                              teacherSessions: allTeacherSessions,
                              earnings: lifetimeEarnings,
                              sessions30: count30,
                              sessions45: count45,
                              sessions60: count60,
                              title: "كشف حساب شامل للحصص"
                            })}
                            title="طباعة كشف حساب"
                            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {!isTeacher && (
                            <button
                              onClick={() => setTeacherToToggleSuspension({ teacher, suspend: !teacher.isSuspended })}
                              title={teacher.isSuspended ? "فك التعطيل" : "تعطيل مؤقت"}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${teacher.isSuspended ? "text-amber-300 hover:text-emerald-300" : "text-neutral-400 hover:text-amber-400"}`}
                            >
                              {teacher.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                            </button>
                          )}

                          {!isTeacher && (
                            <button
                              onClick={() => handleOpenEditTeacher(teacher)}
                              title="تعديل بيانات وتسعيرة المعلم"
                              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-colors cursor-pointer"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          )}

                          {!isTeacher && (
                            <button
                              onClick={() => setTeacherToDelete(teacher)}
                              title="حذف المعلم"
                              className="p-1.5 rounded-md text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Toggle Drawer */}
                        <button
                          onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)}
                          className="px-3 py-2 sm:py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-xs border border-neutral-800 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>{isExpanded ? "إخفاء الحصص" : "عرض الحصص"}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sessions Drawer */}
                  {isExpanded && (
                    <div className="border-t border-neutral-800 bg-neutral-950/70 p-4 space-y-4">
                      {/* Drawer Sub-Tabs */}
                      <div className="flex flex-wrap items-center gap-1.5 border-b border-neutral-800 pb-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setTeacherDrawerTab(teacher.id, "pending")}
                          className={`px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${activeTab === "pending" ? "bg-neutral-800 text-emerald-400" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"}`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>الحصص المستحقة حالياً ({unsettledSessions.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTeacherDrawerTab(teacher.id, "settlements")}
                          className={`px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${activeTab === "settlements" ? "bg-neutral-800 text-emerald-400" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"}`}
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>سجل التسويات والمدفوعات ({teacherSettlements.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTeacherDrawerTab(teacher.id, "all")}
                          className={`px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${activeTab === "all" ? "bg-neutral-800 text-emerald-400" : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"}`}
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>أرشيف كافة الحصص ({allTeacherSessions.length})</span>
                        </button>
                      </div>

                      {/* Tab 1: Pending Unsettled Sessions */}
                      {activeTab === "pending" && (
                        <div>
                          {unsettledSessions.length === 0 ? (
                            <div className="py-6 text-center text-xs text-neutral-400 bg-neutral-900/50 rounded-xl border border-neutral-800/80 p-4">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                              <p className="font-semibold text-neutral-200">
                                تم تصفير وصرف كافة مستحقات هذا المعلم السابقة بنجاح.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1.5 border-b border-neutral-800 font-mono tabular-nums">
                                <span>الحصص المستحقة ({unsettledSessions.length} حصة)</span>
                                <span className="text-emerald-400 font-semibold">
                                  إجمالي المستحق: {currentDue.toLocaleString("ar-EG")} ج.م
                                </span>
                              </div>

                              <div className="divide-y divide-neutral-800/50 max-h-64 overflow-y-auto">
                                {unsettledSessions.map((s) => (
                                  <div key={s.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 sm:gap-3 font-mono tabular-nums">
                                    <div className="flex items-center gap-2 font-sans min-w-0">
                                      <span className="font-semibold text-neutral-200 truncate">
                                        {s.student_name || "طالب"}
                                      </span>
                                      <span className="text-neutral-600">·</span>
                                      <span className="text-neutral-400 text-[11px] truncate">
                                        {s.new_memorization}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 text-neutral-400 shrink-0">
                                      <span>{formatDate(s.date)}</span>
                                      <span className="text-neutral-600">·</span>
                                      <span>{s.duration} دقيقة</span>
                                      <span className="text-neutral-600">·</span>
                                      <span className="text-emerald-400 font-bold">
                                        {s.teacherWage} ج.م
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 2: Settlements & Payouts History (تم إرجاعه بالكامل) */}
                      {activeTab === "settlements" && (
                        <div className="space-y-3">
                          {teacherSettlements.length === 0 ? (
                            <div className="py-6 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-xl border border-neutral-800/80 p-4">
                              لم يتم إجراء أي عمليات تصفير أو صرف مستحقات سابقة لهذا المعلم بعد.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-[11px] text-neutral-400 pb-1.5 border-b border-neutral-800 font-mono tabular-nums flex items-center justify-between">
                                <span>سجل التسويات المعتمدة ({teacherSettlements.length} عملية صرف)</span>
                                <span>
                                  إجمالي المصروف: {teacherSettlements.reduce((acc, st) => acc + st.amount, 0).toLocaleString("ar-EG")} ج.م
                                </span>
                              </div>

                              <div className="space-y-2 max-h-72 overflow-y-auto">
                                {teacherSettlements.map((stl) => (
                                  <div key={stl.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <span className="font-semibold text-emerald-400 text-sm font-mono tabular-nums">
                                          {stl.amount.toLocaleString("ar-EG")} ج.م
                                        </span>
                                        <span className="text-neutral-600">·</span>
                                        <span className="text-neutral-300 font-mono tabular-nums">
                                          {stl.sessionsCount} حصة تمت تسويتها
                                        </span>
                                        <span className="text-neutral-600">·</span>
                                        <span className="text-neutral-400 font-mono tabular-nums">
                                          تاريخ الصرف: {formatDate(stl.settledAt)}
                                        </span>
                                      </div>
                                      {stl.notes && (
                                        <p className="text-[11px] text-neutral-400">
                                          ملاحظات: {stl.notes}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-auto font-sans shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setPrintSettlementReceipt({ teacher, settlement: stl })}
                                        className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                      >
                                        <Printer className="w-3 h-3 text-neutral-400" />
                                        <span>سند الصرف</span>
                                      </button>

                                      {/* زر التراجع عن التسوية */}
                                      {!isTeacher && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSettlementToRevert({
                                              id: stl.id,
                                              amount: stl.amount,
                                              count: stl.sessionsCount,
                                              teacherName: teacher.name
                                            });
                                          }}
                                          title="التراجع عن التسوية وإعادة الحصص كغير مدفوعة"
                                          className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-red-950/60 text-neutral-400 hover:text-red-300 border border-neutral-800 hover:border-red-800 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>تراجع</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 3: Full Archive of All Sessions */}
                      {activeTab === "all" && (
                        <div className="space-y-2">
                          {allTeacherSessions.length === 0 ? (
                            <div className="py-4 text-center text-xs text-neutral-500">
                              لا توجد حصص مسجلة لهذا المعلم خلال الفترة المحددة.
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-neutral-400 pb-1.5 border-b border-neutral-800 font-mono tabular-nums">
                                <span>كافة الحصص المسجلة ({allTeacherSessions.length} حصة)</span>
                                <span>
                                  30د: {count30} · 45د: {count45} · 60د: {count60}
                                </span>
                              </div>

                              <div className="divide-y divide-neutral-800/50 max-h-64 overflow-y-auto">
                                {allTeacherSessions.map((s) => (
                                  <div key={s.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 sm:gap-3 font-mono tabular-nums">
                                    <div className="flex items-center flex-wrap gap-2 font-sans min-w-0">
                                      <span className="font-semibold text-neutral-200 truncate">
                                        {s.student_name || "طالب"}
                                      </span>
                                      <span className="text-neutral-600">·</span>
                                      <span className="text-neutral-400 text-[11px] truncate">
                                        {s.new_memorization}
                                      </span>
                                      {s.settled ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0 flex items-center gap-1">
                                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                                          <span>تم الصرف</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/60 text-amber-300 shrink-0 flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" />
                                          <span>مستحق</span>
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 text-neutral-400 shrink-0">
                                      <span>{formatDate(s.date)}</span>
                                      <span className="text-neutral-600">·</span>
                                      <span>{s.duration} دقيقة</span>
                                      <span className="text-neutral-600">·</span>
                                      <span className="text-emerald-400 font-bold">
                                        {s.teacherWage} ج.م
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- النوافذ المنبثقة للطباعة (تصميم احترافي للفواتير وحل مشكلة الهيدر) --- */}

      {/* Print Statement Modal */}
      {printTeacherVoucher && (
        <>
          <style type="text/css" media="print">
            {`
              body * { visibility: hidden; }
              #printable-voucher, #printable-voucher * { visibility: visible; }
              #printable-voucher { position: absolute; left: 0; top: 0; width: 100%; }
              @page { margin: 15mm; }
            `}
          </style>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div id="printable-voucher" className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 sm:p-8 text-neutral-200 print:bg-white print:text-black print:shadow-none print:border-none print:p-0">

              {/* ترويسة الكشف */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-800 print:border-black print:border-b-2">
                <div>
                  <h2 className="text-xl font-black text-white print:text-black print:text-2xl mb-1">أكاديمية وسارعوا</h2>
                  <h3 className="text-sm font-bold text-emerald-400 print:text-gray-700 print:text-lg">
                    {printTeacherVoucher.title || "كشف حساب مستحقات مالية"}
                  </h3>
                </div>
                <div className="text-left">
                  <p className="text-base font-bold text-white print:text-black print:text-xl">{printTeacherVoucher.teacher.name}</p>
                  <p className="text-xs text-neutral-400 mt-1 print:text-gray-600 print:text-sm font-mono">
                    {startDate || endDate ? `الفترة: ${startDate || "البداية"} إلى ${endDate || "الآن"}` : selectedMonth ? `شهر: ${selectedMonth}` : "كافة الفترات بالأرشيف"}
                  </p>
                </div>
                <button onClick={() => setPrintTeacherVoucher(null)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 absolute top-4 left-4 sm:static print:hidden transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* جدول التفاصيل */}
              <div className="rounded-xl border border-neutral-800 overflow-hidden font-mono tabular-nums print:border-2 print:border-black print:rounded-none">
                <div className="flex justify-between items-center p-4 border-b border-neutral-800 print:border-black bg-neutral-950/50 print:bg-transparent">
                  <span className="font-sans text-neutral-400 print:text-black print:font-bold print:text-lg">إجمالي الحصص المنجزة:</span>
                  <span className="text-white font-bold text-base print:text-black print:text-xl">{printTeacherVoucher.teacherSessions.length} حصة</span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-neutral-800 print:border-black">
                  <span className="font-sans text-neutral-400 print:text-black print:font-bold">تفصيل حصص (30 دقيقة):</span>
                  <span className="print:text-black text-sm">
                    {printTeacherVoucher.sessions30} حصة × {printTeacherVoucher.teacher.rates.rate30} ج.م = <strong className="text-white print:text-black text-base ml-1">{(printTeacherVoucher.sessions30 * printTeacherVoucher.teacher.rates.rate30).toLocaleString("ar-EG")}</strong> ج.م
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-neutral-800 print:border-black bg-neutral-950/30 print:bg-transparent">
                  <span className="font-sans text-neutral-400 print:text-black print:font-bold">تفصيل حصص (45 دقيقة):</span>
                  <span className="print:text-black text-sm">
                    {printTeacherVoucher.sessions45} حصة × {printTeacherVoucher.teacher.rates.rate45} ج.م = <strong className="text-white print:text-black text-base ml-1">{(printTeacherVoucher.sessions45 * printTeacherVoucher.teacher.rates.rate45).toLocaleString("ar-EG")}</strong> ج.م
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-neutral-800 print:border-black">
                  <span className="font-sans text-neutral-400 print:text-black print:font-bold">تفصيل حصص (60 دقيقة):</span>
                  <span className="print:text-black text-sm">
                    {printTeacherVoucher.sessions60} حصة × {printTeacherVoucher.teacher.rates.rate60} ج.م = <strong className="text-white print:text-black text-base ml-1">{(printTeacherVoucher.sessions60 * printTeacherVoucher.teacher.rates.rate60).toLocaleString("ar-EG")}</strong> ج.م
                  </span>
                </div>
                <div className="flex justify-between items-center p-5 bg-emerald-950/30 print:bg-gray-100 print:border-t-2 print:border-black">
                  <span className="font-sans text-white font-bold text-lg print:text-black print:text-2xl">إجمالي المبلغ المستحق:</span>
                  <span className="text-emerald-400 font-black text-xl print:text-black print:text-3xl">{printTeacherVoucher.earnings.toLocaleString("ar-EG")} ج.م</span>
                </div>
              </div>



              <div className="flex items-center justify-end gap-3 pt-6 print:hidden">
                <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors duration-150 cursor-pointer shadow-lg shadow-emerald-900/50">
                  <Printer className="w-5 h-5" />
                  <span>طباعة الكشف الرسمي</span>
                </button>
                <button onClick={() => setPrintTeacherVoucher(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Print Settlement Receipt Modal */}
      {printSettlementReceipt && (
        <>
          <style type="text/css" media="print">
            {`
              body * { visibility: hidden; }
              #printable-receipt, #printable-receipt * { visibility: visible; }
              #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; }
              @page { margin: 15mm; }
            `}
          </style>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div id="printable-receipt" className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 sm:p-8 text-neutral-200 print:bg-white print:text-black print:shadow-none print:border-none print:p-0">

              {/* ترويسة السند */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-neutral-800 print:border-black print:border-b-2">
                <div>
                  <h2 className="text-xl font-black text-white print:text-black print:text-2xl mb-1">أكاديمية وسارعوا</h2>
                  <h3 className="text-sm font-bold text-emerald-400 print:text-gray-700 print:text-lg">
                    سند صرف نقدية / تسوية مستحقات
                  </h3>
                </div>
                <div className="text-left">
                  <p className="text-sm text-neutral-400 print:text-gray-600 font-mono">رقم السند</p>
                  <p className="text-base font-bold text-white print:text-black font-mono">{printSettlementReceipt.settlement.id}</p>
                </div>
                <button onClick={() => setPrintSettlementReceipt(null)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 absolute top-4 left-4 sm:static print:hidden transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* جدول السند */}
              <div className="rounded-xl border border-neutral-800 overflow-hidden font-mono tabular-nums print:border-2 print:border-black print:rounded-none">
                <div className="flex justify-between items-center p-4 border-b border-neutral-800 print:border-black bg-neutral-950/50 print:bg-transparent">
                  <span className="font-sans text-neutral-400 print:text-black print:font-bold print:text-lg">يُصرف إلى المعلم:</span>
                  <span className="text-white font-bold text-base print:text-black print:text-xl">{printSettlementReceipt.teacher.name}</span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-neutral-800 print:border-black">
                  <span className="font-sans text-neutral-400 print:text-black print:font-bold">تاريخ الصرف والتسوية:</span>
                  <span className="print:text-black text-sm">{formatDate(printSettlementReceipt.settlement.settledAt)}</span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-neutral-800 print:border-black bg-neutral-950/30 print:bg-transparent">
                  <span className="font-sans text-neutral-400 print:text-black print:font-bold">عدد الحصص المسواة:</span>
                  <span className="print:text-black text-sm">{printSettlementReceipt.settlement.sessionsCount} حصة</span>
                </div>
                {printSettlementReceipt.settlement.notes && (
                  <div className="flex justify-between items-center p-4 border-b border-neutral-800 print:border-black">
                    <span className="font-sans text-neutral-400 print:text-black print:font-bold">طريقة الصرف / البيان:</span>
                    <span className="print:text-black text-sm font-sans">{printSettlementReceipt.settlement.notes}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-5 bg-emerald-950/30 print:bg-gray-100 print:border-t-2 print:border-black">
                  <span className="font-sans text-white font-bold text-lg print:text-black print:text-2xl">المبلغ المصروف:</span>
                  <span className="text-emerald-400 font-black text-xl print:text-black print:text-3xl">
                    {printSettlementReceipt.settlement.amount.toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
              </div>



              <div className="flex items-center justify-end gap-3 pt-6 print:hidden">
                <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors duration-150 cursor-pointer shadow-lg shadow-emerald-900/50">
                  <Printer className="w-5 h-5" />
                  <span>طباعة سند الصرف</span>
                </button>
                <button onClick={() => setPrintSettlementReceipt(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Teacher Edit/Add Modal */}
      {isTeacherModalOpen && (
        <TeacherModal
          isOpen={isTeacherModalOpen}
          onClose={() => {
            setIsTeacherModalOpen(false);
            setTeacherToEdit(null);
          }}
          teacherToEdit={teacherToEdit || undefined}
        />
      )}

      {/* Single Settlement Modal */}
      {teacherToSettle && (
        <TeacherSettlementModal
          isOpen={Boolean(teacherToSettle)}
          onClose={() => setTeacherToSettle(null)}
          teacher={teacherToSettle}
          unsettledSessions={filteredSessions.filter((s) => s.teacherId === teacherToSettle.id && !s.settled)}
        />
      )}

      {/* Bulk Settlement Modal */}
      {isBulkSettleModalOpen && teachersForBulkSettle.length > 0 && (
        <BulkSettlementModal
          isOpen={isBulkSettleModalOpen}
          onClose={() => {
            setIsBulkSettleModalOpen(false);
            setSelectedTeacherIds([]);
          }}
          selectedTeachers={teachersForBulkSettle}
          sessions={filteredSessions}
        />
      )}

      {/* Revert Settlement Confirmation Modal */}
      {settlementToRevert && (
        <ConfirmModal
          isOpen={Boolean(settlementToRevert)}
          onClose={() => setSettlementToRevert(null)}
          onConfirm={handleConfirmRevert}
          title="التراجع عن تسوية الصرف"
          description={`هل أنت متأكد من التراجع عن صرف المستحقات للمعلم "${settlementToRevert.teacherName}" بمبلغ ${settlementToRevert.amount.toLocaleString("ar-EG")} ج.م؟`}
          details={[
            `ستعود (${settlementToRevert.count}) حصة كحصص مستحقة غير مدفوعة فوراً.`,
            `سيعود الرصيد المستحق للمعلم كما كان ولا كأنه استلم مستحقاته.`,
            `يُرجى تحديث سجل المصروفات يدوياً إذا كنت قد سجلت هذا الصرف كمصروف سابقاً.`
          ]}
          confirmText="تأكيد التراجع واستعادة الرصيد"
          variant="warning"
          iconType="revert"
        />
      )}

      {/* Single Teacher Delete Confirmation Modal */}
      {teacherToDelete && (
        <ConfirmModal
          isOpen={Boolean(teacherToDelete)}
          onClose={() => setTeacherToDelete(null)}
          onConfirm={confirmDeleteTeacher}
          title="حذف المعلم"
          description={`هل أنت متأكد من حذف المعلم "${teacherToDelete.name}"؟`}
          details={[
            "لن يتم حذف حصص الطلاب إطلاقاً وستظل محفوظة وموثقة في الأرشيف.",
            "سيتم حذف حساب المعلم وبيانات تسعيرته من قائمة المعلمين."
          ]}
          confirmText="تأكيد حذف المعلم"
          variant="danger"
          iconType="trash"
        />
      )}

      {/* Toggle Suspension Confirmation Modal */}
      {teacherToToggleSuspension && (
        <ConfirmModal
          isOpen={Boolean(teacherToToggleSuspension)}
          onClose={() => setTeacherToToggleSuspension(null)}
          onConfirm={confirmToggleSuspension}
          title={teacherToToggleSuspension.suspend ? "تعطيل مؤقت للمعلم" : "فك التعطيل المؤقت عن المعلم"}
          description={teacherToToggleSuspension.suspend ? `هل أنت متأكد من تعطيل المعلم "${teacherToToggleSuspension.teacher.name}" مؤقتاً؟` : `هل أنت متأكد من فك التعطيل عن المعلم "${teacherToToggleSuspension.teacher.name}"؟`}
          details={teacherToToggleSuspension.suspend ? [
            "سيتم منع المعلم من تسجيل أي حصص جديدة من حسابه طوال فترة التعطيل.",
            "تبدأ فترة التعطيل من الآن ويمكنك إعادتها لاحقاً."
          ] : [
            "سيتمكن المعلم فوراً من الدخول وتسجيل حصص الطلاب المعتادة."
          ]}
          confirmText={teacherToToggleSuspension.suspend ? "تأكيد التعطيل المؤقت" : "تأكيد فك التعطيل"}
          variant={teacherToToggleSuspension.suspend ? "warning" : "primary"}
          iconType={teacherToToggleSuspension.suspend ? "warning" : "info"}
        />
      )}
    </div>
  );
};

export { TeachersPayrollView };