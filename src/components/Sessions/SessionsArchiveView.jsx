import { useState, useMemo, useEffect } from "react";
import { useAcademy } from "../../context/AcademyContext";
import {
  useGetSessionsQuery,
  useGetStudentsQuery,
  useGetTeachersQuery,
  useDeleteSessionMutation
} from "../../rtk/slices/apiSlice";
import { formatDate } from "../../utils/formatters";
import { ConfirmModal } from "../Modals/ConfirmModal";
import { EditSessionModal } from "../Modals/EditSessionModal"; // 👈 استدعاء المودال الجديد
import { DateRangeFilter, isDateInRange } from "../Common/DateRangeFilter";
import {
  Search,
  Share2,
  Trash2,
  Edit3, // 👈 استدعاء أيقونة التعديل
  Calendar,
  Clock,
  BookOpen,
  Loader2,
  ChevronDown
} from "lucide-react";

const SessionsArchiveView = () => {
  const { currentUser, openWhatsAppReport } = useAcademy();
  const isTeacher = currentUser?.role === "teacher";
  const currentTeacherId = isTeacher ? currentUser.id : null;

  const pollingConfig = { pollingInterval: 15000, refetchOnFocus: true, refetchOnReconnect: true };

  const { data: students = [], isLoading: isLoadingStudents } = useGetStudentsQuery(undefined, pollingConfig);
  const { data: teachers = [], isLoading: isLoadingTeachers } = useGetTeachersQuery(undefined, pollingConfig);
  const [deleteSessionMut] = useDeleteSessionMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionToEdit, setSessionToEdit] = useState(null); // 👈 حالة المودال

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [fetchLimit, setFetchLimit] = useState(15);

  const { data: rawSessions = [], isLoading: isLoadingSessions, isFetching: isFetchingSessions } = useGetSessionsQuery({
    limit: fetchLimit,
    search: debouncedSearch
  }, pollingConfig);

  const isLoading = isLoadingSessions || isLoadingStudents || isLoadingTeachers;

  useEffect(() => {
    setFetchLimit(15);
  }, [searchQuery, selectedTeacherId, selectedRating, selectedMonth, startDate, endDate]);

  const sessions = rawSessions.map(s => ({
    ...s,
    studentId: s.student_id,
    teacherId: s.teacher_id,
    newMemorization: s.new_memorization,
    tajweedNotes: s.tajweed_notes,
    teacherWage: Number(s.teacher_wage)
  }));

  const baseSessions = isTeacher
    ? sessions.filter((s) => s.teacherId === currentTeacherId)
    : sessions;

  const availableMonths = useMemo(() => {
    return Array.from(new Set(baseSessions.map((s) => s.date?.substring(0, 7)))).sort().reverse();
  }, [baseSessions]);

  const filteredSessions = baseSessions.filter((s) => {
    const matchesTeacher = isTeacher || selectedTeacherId === "all" || s.teacherId === selectedTeacherId;
    const matchesRating = selectedRating === "all" || s.rating === selectedRating;
    const matchesDate = isDateInRange(s.date, selectedMonth, startDate, endDate);
    return matchesTeacher && matchesRating && matchesDate;
  });

  const handleDelete = (id, studentName) => {
    setSessionToDelete({ id, studentName: studentName || "المحدد" });
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      try {
        await deleteSessionMut(sessionToDelete.id).unwrap();
        setSessionToDelete(null);
      } catch (err) {
        console.error("Failed to delete session:", err);
        alert(err?.data?.message || "حدث خطأ أثناء حذف الحصة");
      }
    }
  };

  const isDateFiltered = Boolean(selectedMonth || startDate || endDate);
  const isSearchActive = Boolean(searchQuery || (selectedTeacherId !== "all" && !isTeacher) || selectedRating !== "all" || isDateFiltered);
  const showLoadMoreBtn = !isSearchActive && filteredSessions.length >= fetchLimit;

  if (isLoading && fetchLimit === 15) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-neutral-100 flex items-center gap-2">
            <span>{isTeacher ? "سجل حصصي المنفذة" : "سجل الحصص المنفذة"}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
              {filteredSessions.length} {isSearchActive ? "" : "+"}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {isTeacher
              ? "استعراض حصص طلابك وإرسال تقارير المتابعة عبر واتساب"
              : "استعراض كافة الحصص المسجلة وإرسال تقارير المتابعة لأولياء الأمور"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="بحث باسم الطالب، موضوع اليوم، أو السورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {!isTeacher && (
            <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-neutral-400 text-xs">المعلم:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="bg-transparent border-none text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-neutral-900 text-neutral-100">كل المعلمين</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id} className="bg-neutral-900 text-neutral-100">{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-neutral-400 text-xs">التقييم:</span>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="bg-transparent border-none text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-neutral-900 text-neutral-100">كل التقييمات</option>
              <option value="ممتاز" className="bg-neutral-900 text-neutral-100">ممتاز</option>
              <option value="جيد جداً" className="bg-neutral-900 text-neutral-100">جيد جداً</option>
              <option value="جيد" className="bg-neutral-900 text-neutral-100">جيد</option>
              <option value="يحتاج تمكين ومراجعة" className="bg-neutral-900 text-neutral-100">يحتاج تمكين</option>
            </select>
          </div>
        </div>

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

      {/* List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500 space-y-2">
          <BookOpen className="w-8 h-8 text-neutral-600 mx-auto stroke-[1.5]" />
          <p>{isTeacher ? "لا توجد حصص مسجلة لك حتى الآن أو لا تطابق البحث." : "لم يتم العثور على حصص مطابقة."}</p>
        </div>
      ) : (
        <>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800/80">
            {filteredSessions.map((session) => {
              const student = students.find((st) => st.id === session.studentId);
              const teacher = teachers.find((t) => t.id === session.teacherId);

              return (
                <div
                  key={session.id}
                  className="p-3.5 sm:p-5 hover:bg-neutral-800/30 transition-colors duration-150 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm font-bold text-neutral-100">
                          {student?.name || session.student_name || "طالب غير محدد"}
                        </span>
                        {!isTeacher && (
                          <>
                            <span className="text-neutral-600 hidden sm:inline">·</span>
                            <span className="text-xs text-neutral-400">مع {teacher?.name || session.teacher_name}</span>
                          </>
                        )}
                        <span className="text-neutral-600 hidden sm:inline">·</span>
                        <span className="text-[11px] font-mono tabular-nums text-neutral-400 inline-flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800/80">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{session.duration} دقيقة</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-400 mt-1 font-mono tabular-nums">
                        <span className="flex items-center gap-1 text-neutral-300">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          <span>{formatDate(session.date)}</span>
                        </span>
                        <span className="text-neutral-700">·</span>
                        <span className="text-amber-400 font-semibold">الأجر: {session.teacherWage} ج.م</span>
                        {student?.parent_phone && (
                          <>
                            <span className="text-neutral-700 hidden sm:inline">·</span>
                            <span className="text-neutral-500 font-sans hidden sm:inline">هاتف ولي الأمر: {student.parent_phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0 ${session.rating === "يحتاج تمكين ومراجعة" ? "bg-rose-950/80 text-rose-300 border border-rose-800/50" : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/50"}`}>
                      {session.rating}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3 text-xs text-neutral-400 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/60">
                    <div>
                      <span className="text-neutral-500 block text-[10px] font-medium">موضوع اليوم:</span>
                      <span className="text-amber-300 font-medium">{session.topic || "متابعة الحفظ"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] font-medium">المحفوظ:</span>
                      <span className="text-neutral-200 font-medium">{session.newMemorization}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] font-medium">المراجعة:</span>
                      <span className="text-neutral-300">{session.revision || "-"}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] font-medium">الملاحظات:</span>
                      <span className="text-neutral-300">{session.tajweedNotes || "-"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 border-t sm:border-t-0 border-neutral-800/60">
                    {student?.parent_phone && (
                      <span className="text-neutral-500 text-[11px] font-mono sm:hidden truncate max-w-[140px]">
                        {student.parent_phone}
                      </span>
                    )}

                    <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                      <button
                        type="button"
                        onClick={() => openWhatsAppReport({ session, student, teacher })}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-800/70 transition-colors cursor-pointer active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تقرير واتساب</span>
                      </button>

                      {/* 👈 زر التعديل الجديد */}
                      <button
                        type="button"
                        onClick={() => setSessionToEdit(session)}
                        title="تعديل الحصة"
                        className="p-2 sm:p-1.5 rounded-lg text-neutral-400 hover:text-emerald-400 hover:bg-neutral-950 transition-colors cursor-pointer shrink-0"
                      >
                        <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(session.id, student?.name || session.student_name)}
                        title="حذف الحصة"
                        className="p-2 sm:p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-950 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showLoadMoreBtn && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setFetchLimit((prev) => prev + 15)}
                disabled={isFetchingSessions}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isFetchingSessions ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <span>عرض المزيد من الأرشيف</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* 👈 نافذة التعديل المنبثقة */}
      <EditSessionModal
        isOpen={Boolean(sessionToEdit)}
        onClose={() => setSessionToEdit(null)}
        sessionToEdit={sessionToEdit}
      />

      <ConfirmModal
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        onConfirm={confirmDelete}
        title="حذف الحصة"
        description={`هل أنت متأكد من حذف حصة الطالب "${sessionToDelete?.studentName}"؟`}
        details={[
          "سيتم حذف الحصة نهائياً من الأرشيف وسجل المتابعة.",
          "سيتم تحديث رصيد حصص الطالب ومستحقات المعلم تلقائياً."
        ]}
        confirmText="تأكيد حذف الحصة"
        variant="danger"
        iconType="trash"
      />
    </div>
  );
};

export { SessionsArchiveView };