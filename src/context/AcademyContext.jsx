import { createContext, useContext, useEffect, useState } from "react";

const AcademyContext = createContext(void 0);

const AcademyProvider = ({ children }) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("academy_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const currency = "ج.م";

  // UI Modals State
  const [whatsAppReportModal, setWhatsAppReportModal] = useState(null);
  const [renewalModalStudent, setRenewalModalStudent] = useState(null);
  const [suspensionAlertMessage, setSuspensionAlertMessage] = useState(null);

  const clearSuspensionAlert = () => {
    setSuspensionAlertMessage(null);
  };

  const logout = () => {
    setCurrentUser(null);
    // مسح جميع التوكنز المحتملة عند تسجيل الخروج
    localStorage.removeItem("academy_token");
    localStorage.removeItem("academy_user");
    localStorage.removeItem("user_role");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("mod_token");
    localStorage.removeItem("teacher_token");
  };

  // حفظ بيانات المستخدم في التخزين المحلي عند تحديثها
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("academy_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("academy_user");
    }
  }, [currentUser]);

  // Modal Handlers
  // ملاحظة: المكونات الآن هي من سيمرر تفاصيل الجلسة والطالب والمعلم مباشرة
  const openWhatsAppReport = (data) => {
    // data should be an object: { session, student, teacher }
    setWhatsAppReportModal(data);
  };

  const closeWhatsAppReport = () => {
    setWhatsAppReportModal(null);
  };

  const openRenewalModal = (data) => {
    // data should be an object: { student, teacher }
    setRenewalModalStudent(data);
  };

  const closeRenewalModal = () => {
    setRenewalModalStudent(null);
  };

  return (
    <AcademyContext.Provider
      value={{
        currency,
        currentUser,
        setCurrentUser, // تم تصديرها لتحديثها من داخل صفحة تسجيل الدخول
        logout,
        suspensionAlertMessage,
        clearSuspensionAlert,
        setSuspensionAlertMessage,
        whatsAppReportModal,
        openWhatsAppReport,
        closeWhatsAppReport,
        renewalModalStudent,
        openRenewalModal,
        closeRenewalModal,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};

const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error("useAcademy must be used within an AcademyProvider");
  }
  return context;
};

export { AcademyProvider, useAcademy };