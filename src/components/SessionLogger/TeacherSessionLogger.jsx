import { useState, useRef, useMemo, useEffect } from "react";
import { useAcademy } from "../../context/AcademyContext";
import {
  useGetTeachersQuery,
  useGetStudentsQuery,
  useGetSessionsQuery,
  useLogSessionMutation
} from "../../rtk/slices/apiSlice";
import { buildSessionReportMessage, getWhatsAppLink } from "../../utils/formatters";
import {
  Send,
  CheckCircle2,
  MessageCircle,
  Check,
  AlertTriangle,
  ChevronDown,
  Search,
  X,
  History,
  Users,
  Loader2
} from "lucide-react";

const TeacherSessionLogger = ({ onSessionLogged }) => {
  const { currentUser, openRenewalModal, openWhatsAppReport } = useAcademy();
  const isTeacherRole = currentUser?.role === "teacher";

  const pollingConfig = { pollingInterval: 15000, refetchOnFocus: true, refetchOnReconnect: true };

  // 1. تعريف حالات البحث والباجينيشن أولاً
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [studentLimit, setStudentLimit] = useState(15);

  // 2. تحديث كلمة البحث بعد التوقف عن الكتابة بـ 400ms (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStudentSearch(studentSearchQuery), 400);
    return () => clearTimeout(timer);
  }, [studentSearchQuery]);

  // 3. إعادة تعيين الـ Limit لـ 15 عند كتابة حرف جديد
  useEffect(() => {
    setStudentLimit(15);
  }, [studentSearchQuery]);

  // 4. جلب المعلمين أولاً وتوحيد بياناتهم
  const { data: rawTeachers = [], isLoading: isLoadingT } = useGetTeachersQuery(undefined, pollingConfig);
  const teachers = useMemo(() => rawTeachers.map(t => ({
    ...t,
    isSuspended: t.is_suspended == 1
  })), [rawTeachers]);

  // 5. تعريف حالة المعلم المختار (لأننا سنحتاجها في جلب الطلاب)
  const effectiveTeacherId = isTeacherRole ? currentUser?.id || "" : (teachers[0]?.id || "");
  const [selectedTeacherId, setSelectedTeacherId] = useState(effectiveTeacherId);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  // 6. جلب باقي البيانات بناءً على المعلم المختار
  const { data: rawSessions = [], isLoading: isLoadingSes } = useGetSessionsQuery(undefined, pollingConfig);
  const [logSessionMut, { isLoading: isSubmitting }] = useLogSessionMutation();

  // 👈 جلب الطلاب بالباجينيشن والسيرش الذكي بناءً على المعلم
  const { data: rawStudents = [], isLoading: isLoadingS, isFetching: isFetchingStudents } = useGetStudentsQuery({
    limit: studentLimit,
    search: debouncedStudentSearch,
    ...(selectedTeacherId && { teacher_id: selectedTeacherId })
  }, pollingConfig);

  const isLoading = isLoadingT || isLoadingS || isLoadingSes;

  // 7. توحيد حقول الطلاب والحصص
  const students = useMemo(() => rawStudents.map(s => ({
    ...s,
    completedSessions: Number(s.completed_sessions),
    packageSize: Number(s.package_size),
    parentPhone: s.parent_phone,
    parentName: s.parent_name,
    teacherId: s.teacher_id
  })), [rawStudents]);

  const sessions = useMemo(() => rawSessions.map(s => ({
    ...s,
    studentId: s.student_id,
    teacherId: s.teacher_id
  })), [rawSessions]);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isTeacherRole && currentUser?.id) {
      // 💡 التعديل هنا: منع الحلقة المفرغة بتحديث القيمة فقط إذا كانت مختلفة
      if (selectedTeacherId !== currentUser.id) {
        setSelectedTeacherId(currentUser.id);
      }
    } else if (!isTeacherRole && !selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [isTeacherRole, currentUser, teachers, selectedTeacherId]);

  // 💡 لضمان عدم حدوث تداخل: تفريغ الطالب المختار إذا قام الأدمن بتغيير المعلم من القائمة
  useEffect(() => {
    if (!isTeacherRole) {
      setSelectedStudentId("");
      setCachedStudent(null);
    }
  }, [selectedTeacherId, isTeacherRole]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsStudentDropdownOpen(false);
      }
    };
    if (isStudentDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStudentDropdownOpen]);

  const [duration, setDuration] = useState(45);
  const [sessionDate, setSessionDate] = useState((new Date()).toISOString().split("T")[0]);
  const [rating, setRating] = useState("ممتاز");
  const [topic, setTopic] = useState("");
  const [newMemorization, setNewMemorization] = useState("");
  const [revision, setRevision] = useState("");
  const [tajweedNotes, setTajweedNotes] = useState("");
  const [homework, setHomework] = useState("");
  const [prayers, setPrayers] = useState({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });

  const [lastLoggedResult, setLastLoggedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const currentTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const previousStudentIds = useMemo(() => {
    const ids = new Set();
    sessions.forEach((s) => {
      if (s.teacherId === selectedTeacherId) {
        ids.add(s.studentId);
      }
    });
    students.forEach((s) => {
      if (s.teacherId === selectedTeacherId) {
        ids.add(s.id);
      }
    });
    return ids;
  }, [sessions, selectedTeacherId, students]);

  // 💡 تم إزالة فلتر البحث المحلي لأن السيرفر أصبح يقوم بالمهمة
  const previousStudents = useMemo(
    () => students.filter((s) => previousStudentIds.has(s.id)),
    [students, previousStudentIds]
  );

  const otherStudents = useMemo(
    () => students.filter((s) => !previousStudentIds.has(s.id)),
    [students, previousStudentIds]
  );

  // 1. الاحتفاظ ببيانات الطالب المختار لتجنب ضياعه عند مسح البحث أو الباجينيشن
  const [cachedStudent, setCachedStudent] = useState(null);

  useEffect(() => {
    // نحدث الكاش دايماً لو الطالب موجود في القائمة اللي راجعة من السيرفر
    const found = students.find((s) => s.id === selectedStudentId);
    if (found && JSON.stringify(found) !== JSON.stringify(cachedStudent)) {
      setCachedStudent(found);
    }

    // تم إلغاء الاختيار التلقائي للطالب لمنع ارتباك المعلم وتسجيل حصص مزدوجة بالخطأ
  }, [students, selectedStudentId, cachedStudent]);

  // 2. جلب الطالب من القائمة الحالية، أو من الكاش لو كان مختفي بسبب مسح السيرش
  const currentStudent = students.find((s) => s.id === selectedStudentId) || cachedStudent;

  const isStudentCompleted = Boolean(
    currentStudent && (currentStudent.completedSessions >= currentStudent.packageSize || currentStudent.status === "renewal_due")
  );

  const isCurrentTeacherSuspended = Boolean(currentTeacher?.isSuspended);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isTeacherRole && isCurrentTeacherSuspended) {
      alert("حسابك معطل مؤقتاً من قِبل إدارة الأكاديمية، ولا يمكنك تسجيل حصص جديدة حالياً. يرجى مراجعة الإدارة.");
      return;
    }

    if (isStudentCompleted) {
      alert("لا يمكن تسجيل حصة جديدة لهذا الطالب لأن باقته مكتملة بالكامل وتتطلب التجديد.");
      return;
    }

    if (!selectedStudentId || !selectedTeacherId || !newMemorization.trim()) {
      alert("يرجى ملء اسم الطالب والمحفوظ الجديد");
      return;
    }

    try {
      const res = await logSessionMut({
        student_id: selectedStudentId,
        teacher_id: selectedTeacherId,
        date: sessionDate,
        duration: duration,
        topic: topic || "",
        new_memorization: newMemorization,
        revision: revision || "مراجعة الحفظ السابق",
        rating: rating,
        tajweed_notes: tajweedNotes || "أداء طيب",
        homework: homework || "تثبيت ما تم حفظه",
        prayed_fajr: prayers.fajr ? 1 : 0,
        prayed_dhuhr: prayers.dhuhr ? 1 : 0,
        prayed_asr: prayers.asr ? 1 : 0,
        prayed_maghrib: prayers.maghrib ? 1 : 0,
        prayed_isha: prayers.isha ? 1 : 0
      }).unwrap();

      const createdSession = {
        id: res.id,
        date: sessionDate,
        duration,
        topic: topic || "",
        newMemorization,
        revision: revision || "مراجعة الحفظ السابق",
        rating,
        tajweedNotes: tajweedNotes || "أداء طيب",
        homework: homework || "تثبيت ما تم حفظه",
        isNewSession: true,
        prayed_fajr: prayers.fajr ? 1 : 0,
        prayed_dhuhr: prayers.dhuhr ? 1 : 0,
        prayed_asr: prayers.asr ? 1 : 0,
        prayed_maghrib: prayers.maghrib ? 1 : 0,
        prayed_isha: prayers.isha ? 1 : 0
      };

      const reportText = buildSessionReportMessage(createdSession, currentStudent, currentTeacher);
      const link = getWhatsAppLink(currentStudent.parentPhone, reportText);

      setLastLoggedResult({
        sessionId: res.id,
        waLink: link,
        messageText: reportText,
        studentName: currentStudent.name,
        session: createdSession,
        student: currentStudent,
        teacher: currentTeacher
      });

      setTopic("");
      setNewMemorization("");
      setRevision("");
      setTajweedNotes("");
      setHomework("");
      setPrayers({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });

      // 👈 الأسطر الجديدة لتصفير حقل الطالب وإغلاق أي كاش متعلق به
      setSelectedStudentId("");
      setCachedStudent(null);
      setStudentSearchQuery("");

      if (onSessionLogged) {
        onSessionLogged();
      }
    } catch (err) {
      console.error("Failed to log session:", err);
      alert(err?.data?.message || "حدث خطأ أثناء تسجيل الحصة.");
    }
  };

  const handleCopyMessage = () => {
    if (lastLoggedResult) {
      navigator.clipboard.writeText(lastLoggedResult.messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading && studentLimit === 15) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">
          تسجيل تقرير حصة
        </h2>
      </div>

      {/* Success Notification */}
      {lastLoggedResult && (
        <div className="bg-emerald-950/80 border border-emerald-800/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              تم تسجيل حصة الطالب <strong className="text-white">{lastLoggedResult.studentName}</strong> بنجاح!
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {lastLoggedResult.session && (
              <button
                type="button"
                onClick={() => openWhatsAppReport({
                  session: lastLoggedResult.session,
                  student: lastLoggedResult.student,
                  teacher: lastLoggedResult.teacher
                })}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال التقرير واتساب</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">

        {/* Warning if Teacher is Suspended (Teacher View) */}
        {isTeacherRole && isCurrentTeacherSuspended && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-3 animate-in fade-in duration-150">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-amber-100 text-sm">
                الحساب معطل مؤقتاً
              </h4>
              <p className="text-neutral-300 leading-relaxed">
                تم تعطيل حسابك مؤقتاً من قِبل إدارة الأكاديمية، ولا يمكنك تسجيل أي حصص جديدة في الوقت الحالي. يرجى مراجعة إدارة الأكاديمية لفك التعطيل المؤقت.
              </p>
            </div>
          </div>
        )}

        {/* Warning if Teacher is Suspended (Admin View) */}
        {!isTeacherRole && isCurrentTeacherSuspended && (
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>تنبيه: المعلم المختار ({currentTeacher?.name}) معطل مؤقتاً حالياً من قِبل الإدارة.</span>
          </div>
        )}

        {/* Teacher & Student Selection */}
        <div className={`grid ${isTeacherRole ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-3`}>
          {!isTeacherRole && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                المعلم *
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-2 text-xs text-neutral-200 transition-colors duration-150 outline-none"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isSuspended ? " (معطل مؤقتاً)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-neutral-300">
                {isTeacherRole ? "اختر الطالب المراد تسجيل حصته *" : "الطالب *"}
              </label>
              {currentStudent && (
                <span className="text-xs font-mono tabular-nums text-neutral-300">
                  المنجز:{" "}
                  <strong className={currentStudent.completedSessions >= currentStudent.packageSize ? "text-amber-400 font-bold" : "text-neutral-200 font-medium"}>
                    {currentStudent.completedSessions}/{currentStudent.packageSize} حصة
                  </strong>
                </span>
              )}
            </div>

            {/* Searchable Student Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsStudentDropdownOpen((prev) => !prev)}
                className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-600 rounded-lg px-3 py-2 text-xs text-neutral-200 transition-colors duration-150 flex items-center justify-between gap-2 text-right cursor-pointer"
              >
                <div className="flex items-center gap-2 overflow-hidden truncate">
                  {currentStudent ? (
                    <>
                      <span className="font-medium text-neutral-100 truncate">{currentStudent.name}</span>
                      <span className="text-[11px] text-neutral-400 font-mono tabular-nums shrink-0">
                        (المنجز: {currentStudent.completedSessions}/{currentStudent.packageSize} حصة)
                      </span>
                      {currentStudent.completedSessions >= currentStudent.packageSize && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/80 text-amber-300 font-sans shrink-0">
                          باقة مكتملة
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-neutral-500">اختر الطالب...</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${isStudentDropdownOpen ? "rotate-180 text-neutral-200" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isStudentDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-80">
                  {/* Search Bar */}
                  <div className="p-2.5 border-b border-neutral-800 bg-neutral-950 sticky top-0 z-10 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="ابحث باسم الطالب أو رقم الهاتف..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-0 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
                    />
                    {isFetchingStudents && <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />}
                    {studentSearchQuery && !isFetchingStudents && (
                      <button type="button" onClick={() => setStudentSearchQuery("")} className="text-neutral-400 hover:text-neutral-200 p-0.5 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="overflow-y-auto p-1.5 space-y-3 max-h-64 divide-y divide-neutral-800/60 relative">
                    {/* Previous Students */}
                    {previousStudents.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2.5 py-1 text-[10px] font-semibold text-emerald-400/90 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-3 h-3 text-emerald-400" />
                          <span>طلاب تم التدريس لهم من قبل ({previousStudents.length})</span>
                        </div>
                        <div className="space-y-0.5">
                          {previousStudents.map((s) => {
                            const isSelected = s.id === selectedStudentId;
                            const isCompleted = s.completedSessions >= s.packageSize;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(s.id);
                                  setIsStudentDropdownOpen(false);
                                  setStudentSearchQuery("");
                                }}
                                className={`w-full text-right px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${isSelected ? "bg-neutral-800 text-white font-medium" : "text-neutral-300 hover:bg-neutral-800/60"}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="truncate">{s.name}</span>
                                  {isCompleted && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/70 text-amber-300 shrink-0">
                                      باقة مكتملة
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[11px] font-mono tabular-nums ${isCompleted ? "text-amber-400 font-semibold" : "text-neutral-400"}`}>
                                    المنجز: {s.completedSessions}/{s.packageSize} حصة
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Other Students */}
                    {otherStudents.length > 0 && (
                      <div className="space-y-1 pt-1.5">
                        <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-neutral-400" />
                          <span>{isTeacherRole ? `باقي طلابك (${otherStudents.length})` : `باقي الطلاب المخصصين للمعلم (${otherStudents.length})`}</span>
                        </div>
                        <div className="space-y-0.5">
                          {otherStudents.map((s) => {
                            const isSelected = s.id === selectedStudentId;
                            const isCompleted = s.completedSessions >= s.packageSize;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(s.id);
                                  setIsStudentDropdownOpen(false);
                                  setStudentSearchQuery("");
                                }}
                                className={`w-full text-right px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${isSelected ? "bg-neutral-800 text-white font-medium" : "text-neutral-300 hover:bg-neutral-800/60"}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="truncate">{s.name}</span>
                                  {isCompleted && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800/70 text-amber-300 shrink-0">
                                      باقة مكتملة
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[11px] font-mono tabular-nums ${isCompleted ? "text-amber-400 font-semibold" : "text-neutral-400"}`}>
                                    المنجز: {s.completedSessions}/{s.packageSize} حصة
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* زر تحميل المزيد */}
                    {rawStudents.length >= studentLimit && !isFetchingStudents && !debouncedStudentSearch && (
                      <div className="pt-2 border-t border-neutral-800/60">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStudentLimit(prev => prev + 15);
                          }}
                          className="w-full py-2 rounded-lg text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>عرض المزيد</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {previousStudents.length === 0 && otherStudents.length === 0 && !isFetchingStudents && (
                      <div className="py-6 text-center text-xs text-neutral-500">
                        لا توجد نتائج مطابقة لـ "{studentSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning if Student Completed Package */}
        {isStudentCompleted && currentStudent && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-amber-200">
                  الطالب منجز الحصص كاملة ({currentStudent.completedSessions}/{currentStudent.packageSize} حصة)
                </p>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  انتهت باقة الطالب ولا يمكن تسجيل حصة جديدة إلا بعد تجديد باقة الحصص.
                </p>
              </div>
            </div>

            {!isTeacherRole ? (
              <button
                type="button"
                onClick={() => openRenewalModal({ student: currentStudent, teacher: currentTeacher })}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
              >
                تجديد الباقة الآن
              </button>
            ) : (
              <span className="text-[11px] px-2.5 py-1 rounded-md bg-amber-900/60 border border-amber-800 text-amber-300 shrink-0 font-medium">
                يلزم تجديد الاشتراك
              </span>
            )}
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            المدة والأجر
          </label>
          <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
            {[30, 45, 60].map((dur) => {
              const isSelected = duration === dur;
              const rateKey = `rate_${dur}`;
              const wageForDur = currentTeacher ? Number(currentTeacher[rateKey] || 0) : 0;

              return (
                <button
                  type="button"
                  key={dur}
                  onClick={() => setDuration(dur)}
                  className={`py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer ${isSelected ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:text-neutral-200"}`}
                >
                  <span className="font-mono tabular-nums">{dur}</span> دقيقة
                  <span className="block text-[10px] text-neutral-500 font-mono tabular-nums">
                    {wageForDur} ج.م
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Rating */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              التاريخ
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono tabular-nums transition-all duration-150 outline-none focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              التقييم
            </label>
            <div className="grid grid-cols-4 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              {[
                { label: "ممتاز", value: "ممتاز" },
                { label: "جيد جداً", value: "جيد جداً" },
                { label: "جيد", value: "جيد" },
                { label: "يحتاج مراجعة", value: "يحتاج تمكين ومراجعة" }
              ].map((opt) => {
                const isSelected = rating === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setRating(opt.value)}
                    className={`py-1 text-[11px] rounded transition-colors duration-150 cursor-pointer ${isSelected ? "bg-neutral-800 text-emerald-400 font-medium" : "text-neutral-400 hover:text-neutral-200"}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* Prayers Tracker */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            متابعة الصلوات الخمس
          </label>
          <div className="flex justify-between items-center gap-1 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
            {[
              { id: "fajr", label: "الفجر", icon: "🌅" },
              { id: "dhuhr", label: "الظهر", icon: "☀️" },
              { id: "asr", label: "العصر", icon: "🌤️️" },
              { id: "maghrib", label: "المغرب", icon: "🌇" },
              { id: "isha", label: "العشاء", icon: "🌙" }
            ].map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPrayers(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                className={`flex-1 py-1.5 flex flex-col items-center gap-1 rounded-md transition-all duration-150 cursor-pointer ${prayers[p.id] ? "bg-emerald-900/40 border border-emerald-700/50" : "bg-neutral-900/50 border border-transparent hover:bg-neutral-800"}`}
              >
                <span className="text-[10px] sm:text-xs text-neutral-300">{p.icon} {p.label}</span>
                <span className="text-[10px] font-bold">
                  {prayers[p.id] ? <span className="text-emerald-400">✅</span> : <span className="text-neutral-600">—</span>}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Details */}
        <div className="space-y-3 pt-1">


          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              المحفوظ الجديد *
            </label>
            <input
              type="text"
              placeholder="مثال: سورة البقرة (1 - 20)"
              value={newMemorization}
              onChange={(e) => setNewMemorization(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 transition-all duration-150 outline-none focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              المراجعة
            </label>
            <input
              type="text"
              placeholder="مثال: سورة الفاتحة وجزء عمّ"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 transition-all duration-150 outline-none focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              ملاحظات التجويد
            </label>
            <input
              type="text"
              placeholder="مثال: أحكام النون الساكنة والمدود"
              value={tajweedNotes}
              onChange={(e) => setTajweedNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 transition-all duration-150 outline-none focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              المطلوب للقاء القادم
            </label>
            <input
              type="text"
              placeholder="مثال: تثبيت الآيات وحفظ الآيات التالية"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 transition-all duration-150 outline-none focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              موضوع اليوم *
            </label>
            <input
              type="text"
              placeholder="مثال: الجانب التربوي، مراجعة عامة، إلخ..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 transition-all duration-150 outline-none focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            type="submit"
            disabled={isStudentCompleted || (isTeacherRole && isCurrentTeacherSuspended) || isSubmitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${isStudentCompleted || (isTeacherRole && isCurrentTeacherSuspended) || isSubmitting ? "bg-neutral-800 text-neutral-500 border border-neutral-700/60 cursor-not-allowed opacity-80" : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.98]"}`}
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>
              {isSubmitting ? "جاري التسجيل..." : (isTeacherRole && isCurrentTeacherSuspended) ? "غير متاح - الحساب معطل مؤقتاً" : isStudentCompleted ? "غير متاح - باقة الطالب مكتملة" : "تسجيل الحصة"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export { TeacherSessionLogger };