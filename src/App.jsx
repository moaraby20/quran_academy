import { useState, useEffect } from "react";
import { AcademyProvider, useAcademy } from "./context/AcademyContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./components/Dashboard/DashboardView";
import { TeacherSessionLogger } from "./components/SessionLogger/TeacherSessionLogger";
import { StudentsManagementView } from "./components/Students/StudentsManagementView";
import { TeachersPayrollView } from "./components/Payroll/TeachersPayrollView";
import { SessionsArchiveView } from "./components/Sessions/SessionsArchiveView";
import { ExpensesView } from "./components/Expenses/ExpensesView";
import { AdminStaffManagementView } from "./components/AdminStaff/AdminStaffManagementView";
import { WhatsAppReportModal } from "./components/Modals/WhatsAppReportModal";
import { RenewPackageModal } from "./components/Modals/RenewPackageModal";
import { CommandMenuModal } from "./components/CommandMenuModal";
import { LoginPage } from "./components/Auth/LoginPage";

function AcademyAppContent () {
  const { currentUser } = useAcademy();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  const isTeacher = currentUser?.role === "teacher";
  const isModerator = currentUser?.role === "moderator";
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (isTeacher) {
      if (activeTab !== "logger" && activeTab !== "payroll" && activeTab !== "sessions") {
        setActiveTab("logger");
      }
    } else if (isModerator) {
      if (activeTab === "dashboard" || activeTab === "expenses" || activeTab === "staff") {
        setActiveTab("students");
      }
    }
  }, [currentUser, activeTab, isTeacher, isModerator]);

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    // التحكم الكامل بحجم الشاشة هنا: h-screen w-full overflow-hidden
    <div className="h-screen w-full overflow-hidden bg-neutral-950 text-neutral-100 flex flex-row font-['IBM_Plex_Sans_Arabic',sans-serif] selection:bg-emerald-950 selection:text-emerald-300">

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area - هذا الجزء هو الوحيد الذي يقبل السكرول الداخلي (overflow-y-auto) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto transition-all duration-200 desktop-zoom">

        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSearchDialog={() => setIsSearchDialogOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 max-w-7xl w-full mx-auto">
          {/* Admin Dashboard (Admin Only) */}
          {isAdmin && activeTab === "dashboard" && (
            <DashboardView
              onOpenSessionLogger={() => setActiveTab("logger")}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* Session Logger (available to Admin, Moderator, & Teacher) */}
          {activeTab === "logger" && <TeacherSessionLogger onSessionLogged={() => { }} />}

          {/* Students Management (Admin & Moderator) */}
          {!isTeacher && activeTab === "students" && <StudentsManagementView />}

          {/* Payroll View (Admin & Moderator view all, Teacher views "معلوماتي والمستحقات") */}
          {activeTab === "payroll" && <TeachersPayrollView />}

          {/* Sessions Archive (Admin & Moderator view all, Teacher views only their own logged sessions) */}
          {activeTab === "sessions" && <SessionsArchiveView />}

          {/* Operational Expenses (Admin Only - Hidden from Moderator & Teacher) */}
          {isAdmin && activeTab === "expenses" && <ExpensesView />}

          {/* Admin Staff and Account Management (Admin Only) */}
          {isAdmin && activeTab === "staff" && <AdminStaffManagementView />}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <WhatsAppReportModal />
      <RenewPackageModal />
      <CommandMenuModal
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        onSelectStudent={() => {
          if (!isTeacher) {
            setActiveTab("students");
          }
        }}
        onNavigateToTab={(tab) => {
          if (isTeacher) {
            if (tab === "logger" || tab === "payroll" || tab === "sessions") {
              setActiveTab(tab);
            }
          } else if (isModerator) {
            if (tab !== "dashboard" && tab !== "expenses" && tab !== "staff") {
              setActiveTab(tab);
            }
          } else {
            setActiveTab(tab);
          }
        }}
      />
    </div>
  );
}

function App () {
  return (
    <AcademyProvider>
      <AcademyAppContent />
    </AcademyProvider>
  );
}

export { App as default };