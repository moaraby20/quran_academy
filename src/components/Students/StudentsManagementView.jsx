import { useState, useEffect } from "react";
import { useAcademy } from "../../context/AcademyContext";
import { useGetStudentsQuery, useDeleteStudentMutation } from "../../rtk/slices/apiSlice";
import { buildRenewalAlertMessage, getWhatsAppLink } from "../../utils/formatters";
import { StudentModal } from "../Modals/StudentModal";
import { ConfirmModal } from "../Modals/ConfirmModal";
import {
  UserPlus,
  Search,
  RotateCw,
  MessageCircle,
  Edit3,
  Trash2,
  Loader2,
  ChevronDown
} from "lucide-react";

const StudentsManagementView = () => {
  const { openRenewalModal } = useAcademy();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // 1. نظام السيرش المتأخر (Debounce)
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. نظام الباجنيشن من السيرفر
  const [fetchLimit, setFetchLimit] = useState(15);

  useEffect(() => {
    setFetchLimit(15);
  }, [searchQuery, statusFilter]);

  // 3. جلب البيانات مع تمرير المتغيرات للسيرفر
  const queryParams = {
    limit: fetchLimit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter })
  };

  const { data: rawStudents = [], isLoading, isFetching } = useGetStudentsQuery(queryParams, {
    pollingInterval: 15000,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  const [deleteStudentMut] = useDeleteStudentMutation();

  // توحيد المسميات فقط (السيرفر قام بالفلترة)
  const students = rawStudents.map(s => ({
    ...s,
    packageSize: Number(s.package_size),
    completedSessions: Number(s.completed_sessions),
    parentName: s.parent_name,
    parentPhone: s.parent_phone,
    teacherId: s.teacher_id,
    subscriptionFee: Number(s.subscription_fee),
    currentSurah: s.current_surah,
    currentJuz: s.current_juz,
    startDate: s.start_date,
    packageName: s.package_name
  }));

  const handleEdit = (student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleAdd = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleDelete = (id, name) => {
    setStudentToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await deleteStudentMut(studentToDelete.id).unwrap();
        setStudentToDelete(null);
      } catch (err) {
        console.error("Failed to delete student:", err);
        alert(err?.data?.message || "حدث خطأ أثناء الحذف");
      }
    }
  };

  const renewalDueTotal = students.filter((s) => s.completedSessions >= s.packageSize || s.status === "renewal_due").length;

  // الزر يختفي فقط في حالة "البحث النصي" المباشر، لكن يظهر طبيعياً مع فلاتر الحالة
  const isSearchActive = Boolean(searchQuery);
  const showLoadMoreBtn = !isSearchActive && students.length >= fetchLimit;

  if (isLoading && fetchLimit === 15) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">
            الطلاب والاشتراكات
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            متابعة الباقات ورصيد الحصص
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors duration-150 cursor-pointer active:scale-[0.98] self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>طالب جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-neutral-900 p-2 rounded-xl border border-neutral-800">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors duration-150 cursor-pointer ${statusFilter === "all" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              الكل {isSearchActive ? "" : `(${students.length}+)`}
            </button>
            <button
              onClick={() => setStatusFilter("renewal_due")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors duration-150 cursor-pointer flex items-center gap-1 ${statusFilter === "renewal_due" ? "bg-neutral-800 text-amber-400" : "text-neutral-400 hover:text-amber-400"}`}
            >
              <span>مستحق التجديد</span>
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors duration-150 cursor-pointer ${statusFilter === "active" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              ساري
            </button>
          </div>
        </div>
      </div>

      {/* Students Cards Grid */}
      {students.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-500">
          لم يتم العثور على طلاب مطابقين.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {students.map((student) => {
              const isDue = student.completedSessions >= student.packageSize || student.status === "renewal_due";
              const progressPercent = Math.min(100, Math.round((student.completedSessions / student.packageSize) * 100));
              const remaining = Math.max(0, student.packageSize - student.completedSessions);

              const renewalMsg = buildRenewalAlertMessage(student);
              const waLink = getWhatsAppLink(student.parentPhone, renewalMsg);

              return (
                <div
                  key={student.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between gap-3.5 transition-colors duration-150 hover:border-neutral-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-semibold text-neutral-100">
                          {student.name}
                        </h3>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          <span>ولي الأمر: {student.parentName || student.parentPhone}</span>
                        </div>
                      </div>

                      <div className="text-left font-mono tabular-nums text-xs">
                        {isDue ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>تجديد</span>
                          </span>
                        ) : (
                          <span className="text-neutral-400">ساري</span>
                        )}
                      </div>
                    </div>

                    <div className="py-2 my-2.5 border-y border-neutral-800/80 text-xs flex items-center justify-between gap-2 text-neutral-400 font-mono tabular-nums">
                      <div>
                        <span className="text-neutral-500 font-sans">باقة: </span>
                        <span className="text-neutral-200">{student.packageSize} حصص</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-sans">الاشتراك: </span>
                        <span className="text-neutral-200 font-semibold text-emerald-400">{student.subscriptionFee} ج.م</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono tabular-nums">
                        <span className="text-neutral-400">
                          الحصص: {student.completedSessions} من {student.packageSize}
                        </span>
                        <span className={isDue ? "text-amber-400" : "text-neutral-400"}>
                          {isDue ? "مكتملة 100%" : `متبقي ${remaining}`}
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${progressPercent}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${isDue ? "bg-amber-500" : "bg-emerald-600"}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-800/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openRenewalModal({ student })}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-medium bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors duration-150 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
                      <span>تجديد الباقة</span>
                    </button>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="واتساب"
                      className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 border border-neutral-800 transition-colors duration-150"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleEdit(student)}
                      title="تعديل"
                      className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-colors duration-150"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(student.id, student.name)}
                      title="حذف"
                      className="p-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 border border-neutral-800 transition-colors duration-150"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* زر تحميل المزيد */}
          {showLoadMoreBtn && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setFetchLimit((prev) => prev + 15)}
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <span>عرض المزيد من الطلاب</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {isStudentModalOpen && (
        <StudentModal
          isOpen={isStudentModalOpen}
          onClose={() => {
            setIsStudentModalOpen(false);
            setStudentToEdit(null);
          }}
          studentToEdit={studentToEdit || undefined}
        />
      )}

      {studentToDelete && (
        <ConfirmModal
          isOpen={Boolean(studentToDelete)}
          onClose={() => setStudentToDelete(null)}
          onConfirm={confirmDelete}
          title="حذف الطالب"
          description={`هل أنت متأكد من حذف الطالب "${studentToDelete.name}"؟`}
          details={[
            "سيتم حذف بيانات الطالب واشتراكه من قائمة الطلاب نهائياً.",
            "سيتم حذف الحصص المرتبطة بالطالب أيضاً من السجل."
          ]}
          confirmText="تأكيد حذف الطالب"
          variant="danger"
          iconType="trash"
        />
      )}
    </div>
  );
};

export { StudentsManagementView };