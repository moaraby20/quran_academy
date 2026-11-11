import { useEffect, useMemo } from "react";
import { useAcademy } from "../context/AcademyContext";
import { useGetStudentsQuery } from "../rtk/slices/apiSlice";
import { Menu, Search } from "lucide-react";

const Header = ({
  onToggleMobileSidebar,
  onOpenSearchDialog
}) => {
  const { currentUser } = useAcademy();
  const isTeacher = currentUser?.role === "teacher";

  // جلب الطلاب لحساب الاشتراكات المنتهية (يتم التخطي إذا كان المستخدم معلم)
  const { data: students = [] } = useGetStudentsQuery(undefined, { skip: isTeacher });

  // حساب عدد الطلاب الذين يحتاجون لتجديد باقاتهم
  const renewalDueCount = useMemo(() => {
    if (!students.length) return 0;
    return students.filter(s => s.status === 'renewal_due' || Number(s.completed_sessions) >= Number(s.package_size)).length;
  }, [students]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenSearchDialog();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearchDialog]);

  return (
    // التعديل هنا: إضافة p-3 للموبايل لعمل حواف خارجية (Margins) وإلغائها على الشاشات الكبيرة
    <header className="sticky top-0 z-20 p-3 pb-1 sm:p-0">

      {/* التعديل هنا: إضافة حواف دائرية rounded-2xl وخلفية منفصلة للموبايل */}
      <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-4 bg-neutral-950/90 backdrop-blur-md border border-neutral-800/80 sm:border-x-0 sm:border-t-0 rounded-2xl sm:rounded-none shadow-lg sm:shadow-none">

        {/* Mobile menu & System Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 border border-neutral-800 transition-colors duration-150 cursor-pointer"
            aria-label="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-sm font-bold text-neutral-100 lg:hidden">
            أكاديمية وسارعوا
          </span>
        </div>

        {/* Quick Search */}
        <div className="flex-1 max-w-sm hidden md:block">
          <button
            type="button"
            onClick={onOpenSearchDialog}
            className="w-full h-9 px-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 text-xs flex items-center justify-between transition-colors duration-150 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-3.5 h-3.5 text-neutral-500" />
              <span>بحث سريع في الطلاب والحصص...</span>
            </div>
            <kbd className="h-5 px-1.5 rounded-md bg-neutral-950 border border-neutral-800 font-mono text-[10px] text-neutral-400 flex items-center">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Actions & User Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenSearchDialog}
            className="md:hidden p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-800 transition-colors duration-150 cursor-pointer"
            aria-label="بحث"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Renewal badge for admin/moderator */}
          {!isTeacher && renewalDueCount > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums text-amber-400 bg-amber-950/60 border border-amber-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>{renewalDueCount} تجديد</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export { Header };