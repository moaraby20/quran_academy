import { useState, useEffect } from "react";
import { useAcademy } from "../context/AcademyContext";
import { useGetStudentsQuery, useGetTeachersQuery } from "../rtk/slices/apiSlice";
import { Search, X, User, BookOpen, ArrowRight } from "lucide-react";

const CommandMenuModal = ({
  isOpen,
  onClose,
  onSelectStudent,
  onNavigateToTab
}) => {
  const { currentUser } = useAcademy();
  const isTeacher = currentUser?.role === "teacher";
  const [query, setQuery] = useState("");

  // جلب البيانات من الـ API (تُجلب فقط عندما تكون النافذة مفتوحة لتوفير الموارد)
  const { data: rawStudents = [] } = useGetStudentsQuery(undefined, { skip: !isOpen });
  const { data: rawTeachers = [] } = useGetTeachersQuery(undefined, { skip: !isOpen });

  // توحيد مسميات الحقول
  const students = rawStudents.map(s => ({
    ...s,
    parentName: s.parent_name || "",
    completedSessions: Number(s.completed_sessions) || 0,
    packageSize: Number(s.package_size) || 0,
  }));

  const teachers = rawTeachers;

  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStudents = students.filter(
    (s) => s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.parentName.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTeachers = teachers.filter(
    (t) => t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-800 bg-neutral-950">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
          <input
            autoFocus
            type="text"
            placeholder="اكتب للبحث عن طالب أو معلم..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-500 hover:text-neutral-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-medium text-neutral-500">
                إجراءات سريعة
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    onNavigateToTab("logger");
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-neutral-300 hover:bg-neutral-800/80 transition-colors duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                    <span>تسجيل تقرير حصة</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-neutral-600" />
                </button>
                <button
                  onClick={() => {
                    onNavigateToTab("sessions");
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-neutral-300 hover:bg-neutral-800/80 transition-colors duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isTeacher ? "سجل حصصي وتقارير واتساب" : "سجل الحصص المنفذة"}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-neutral-600" />
                </button>
                {!isTeacher && (
                  <>
                    <button
                      onClick={() => {
                        onNavigateToTab("students");
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-neutral-300 hover:bg-neutral-800/80 transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-neutral-400" />
                        <span>سجل الطلاب والباقات</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-neutral-600" />
                    </button>
                    <button
                      onClick={() => {
                        onNavigateToTab("staff");
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-neutral-300 hover:bg-neutral-800/80 transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>إدارة الحساب والمشرفين</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-neutral-600" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Students Results */}
          {filteredStudents.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-medium text-neutral-500">
                الطلاب ({filteredStudents.length})
              </div>
              <div className="space-y-0.5">
                {filteredStudents.slice(0, 5).map((s) => {
                  const isDue = s.completedSessions >= s.packageSize;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectStudent(s);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-neutral-200 hover:bg-neutral-800/80 transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-neutral-500">·</span>
                        <span className="text-neutral-400">ولي الأمر: {s.parentName}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span className={isDue ? "text-amber-400" : "text-neutral-400"}>
                          {s.completedSessions}/{s.packageSize}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Teachers Results */}
          {filteredTeachers.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-medium text-neutral-500">
                المعلمون ({filteredTeachers.length})
              </div>
              <div className="space-y-0.5">
                {filteredTeachers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onNavigateToTab("payroll");
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-neutral-200 hover:bg-neutral-800/80 transition-colors duration-150 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-400">{t.title}</span>
                    </div>
                    <span className="text-neutral-500 text-[11px] font-mono tabular-nums">
                      {t.phone}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && filteredStudents.length === 0 && filteredTeachers.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-500">
              لا توجد نتائج مطابقة لـ "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>اضغط ESC للإغلاق</span>
          <span className="font-mono">أكاديمية وسارعوا</span>
        </div>
      </div>
    </div>
  );
};

export { CommandMenuModal };