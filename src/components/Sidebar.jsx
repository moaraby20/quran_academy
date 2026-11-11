import { useMemo } from "react";
import {
  LayoutDashboard,
  PenTool,
  Users,
  DollarSign,
  History,
  ReceiptText,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  ShieldCheck,
  Crown
} from "lucide-react";
import { useAcademy } from "../context/AcademyContext";
import { AcademyLogo } from "./AcademyLogo";

const Sidebar = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  setIsCollapsed
}) => {
  const { currentUser, logout } = useAcademy();

  const isTeacher = currentUser?.role === "teacher";
  const isModerator = currentUser?.role === "moderator";
  const isAdmin = currentUser?.role === "admin";

  const navItems = useMemo(() => {
    if (isTeacher) {
      return [
        { id: "logger", label: "تسجيل حصة", icon: PenTool },
        { id: "sessions", label: "سجل حصصي", icon: History },
        { id: "payroll", label: "معلوماتي والمستحقات", icon: DollarSign }
      ];
    }
    if (isModerator) {
      return [
        { id: "logger", label: "تسجيل حصة", icon: PenTool },
        { id: "students", label: "الطلاب", icon: Users },
        { id: "payroll", label: "المعلمين والمستحقات", icon: DollarSign },
        { id: "sessions", label: "سجل الحصص", icon: History }
      ];
    }
    return [
      { id: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
      { id: "logger", label: "تسجيل حصة", icon: PenTool },
      { id: "students", label: "الطلاب", icon: Users },
      { id: "payroll", label: "المعلمين والمستحقات", icon: DollarSign },
      { id: "sessions", label: "سجل الحصص", icon: History },
      { id: "expenses", label: "المصروفات", icon: ReceiptText },
      { id: "staff", label: "الإدارة والمشرفين", icon: ShieldCheck }
    ];
  }, [isTeacher, isModerator]);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const handleLogout = () => {
    logout();
    onCloseMobile();
  };

  const renderContent = (isMobileView = false) => {
    const collapsed = !isMobileView && isCollapsed;

    return (
      <div className="flex flex-col h-full bg-neutral-950 text-neutral-300 select-none overflow-hidden">

        {/* Brand Header */}
        <div className="h-16 px-3.5 border-b border-neutral-800/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <AcademyLogo size={36} className="shrink-0 rounded-full shadow-sm" />

            {(!collapsed || isMobileView) && (
              <div className="truncate">
                <h1 className="text-sm font-bold text-neutral-100 truncate tracking-tight">
                  أكاديمية وسارعوا
                </h1>
                <p className="text-[11px] text-neutral-400 leading-none mt-0.5 truncate">
                  تحفيظ القرآن الكريم
                </p>
              </div>
            )}
          </div>

          {!isMobileView && (
            <button
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors duration-150 cursor-pointer"
              title={collapsed ? "فتح وتوسيع القائمة" : "تصغير وإغلاق القائمة"}
            >
              {collapsed ? <ChevronLeft className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}

          {isMobileView && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors duration-150"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List - Scrollable Area (Independent of main page) */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${collapsed ? "justify-center px-2 py-3" : "justify-between px-3.5 py-2.5"} rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${isActive ? "bg-neutral-800 text-white font-semibold shadow-xs ring-1 ring-neutral-700/60" : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/90"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Icon className={`w-4.5 h-4.5 transition-colors duration-150 ${isActive ? "text-emerald-400" : "text-neutral-400"}`} />
                  </div>
                  {(!collapsed || isMobileView) && <span className="text-[13px] tracking-wide">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Card & Logout Section - Fixed at Bottom */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950 shrink-0 mt-auto space-y-2">

          {/* User info */}
          {!collapsed || isMobileView ? (
            <div
              onClick={() => {
                if (isAdmin) {
                  setActiveTab("staff");
                  if (isMobileView) onCloseMobile();
                } else if (isTeacher) {
                  setActiveTab("payroll");
                  if (isMobileView) onCloseMobile();
                }
              }}
              className={`w-full text-right p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800/90 flex items-center justify-between gap-2.5 transition-all ${isAdmin || isTeacher ? "hover:bg-neutral-900 hover:border-neutral-700 cursor-pointer group" : ""}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-neutral-300 shrink-0 group-hover:border-emerald-700/60 transition-colors">
                  {isTeacher ? <UserCheck className="w-4 h-4 text-teal-400" /> : isModerator ? <ShieldCheck className="w-4 h-4 text-teal-400" /> : <Crown className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">
                    {currentUser?.name || "مستخدم النظام"}
                  </p>

                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                if (isAdmin) setActiveTab("staff");
                else if (isTeacher) setActiveTab("payroll");
              }}
              className={`w-full flex justify-center p-1 ${isAdmin || isTeacher ? "cursor-pointer" : ""}`}
              title={`${currentUser?.name || "المستخدم"} (${isAdmin ? "مدير" : isModerator ? "مشرف" : "معلم"})`}
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex items-center justify-center text-neutral-300">
                {isTeacher ? <UserCheck className="w-4 h-4 text-teal-400" /> : isModerator ? <ShieldCheck className="w-4 h-4 text-teal-400" /> : <Crown className="w-4 h-4 text-amber-400" />}
              </div>
            </div>
          )}

          {/* Logout Button */}
          {!collapsed || isMobileView ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:border-red-800/60 transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>تسجيل خروج</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              title="تسجيل خروج"
              className="w-full flex items-center justify-center p-2 rounded-xl text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:block ${isCollapsed ? "w-20" : "w-64 xl:w-72"} border-l border-neutral-800/80 bg-neutral-950 shrink-0 h-screen z-30 transition-[width] duration-200 ease-in-out`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[82vw] h-full z-10 shadow-2xl animate-in slide-in-from-right-full duration-200">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

export { Sidebar };