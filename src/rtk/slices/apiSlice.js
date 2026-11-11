import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const getApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_PROJECTS_API || import.meta.env?.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl.replace(/\/$/, "")}/api`;
  }
  return "/api";
};
const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiBaseUrl()
});
const endpointAuth = {
  // ------- Public / Auth -------
  login: "none",
  getPublicStats: "none",

  // ------- Teacher Endpoints -------
  getMe: "teacher",
  updateMyProfile: "teacher",
  getMySessions: "teacher",
  getMyStudents: "teacher",
  logSession: "teacher",
  markSessionReportSent: "teacher",
  getTeacherPayroll: "teacher",
  getSettlements: "teacher", // 👈 تمت الإضافة هنا (لكي يتمكن المعلم من رؤية سجل تسوياته فقط)

  // ------- Moderator & Shared Management -------
  getStudents: "moderator",
  getStudentById: "moderator",
  createStudent: "moderator",
  updateStudent: "moderator",
  deleteStudent: "moderator",
  renewStudentPackage: "moderator",
  getTeachers: "moderator",
  getTeacherById: "moderator",
  createTeacher: "moderator",
  updateTeacher: "moderator",
  toggleTeacherSuspension: "moderator",
  settleTeacherWages: "moderator",
  revertSettlement: "moderator", // 👈 تمت الإضافة هنا (المشرف أو الإدارة هم فقط من يحق لهم التراجع عن الصرف)
  getSessions: "moderator",
  getSessionById: "moderator",
  updateSession: "moderator",
  deleteSession: "moderator",

  // ------- Admin Only -------
  getStudentRenewals: "admin",
  deleteTeacher: "admin",
  getAdminDashboardStats: "admin",
  getExpenses: "admin",
  createExpense: "admin",
  updateExpense: "admin",
  deleteExpense: "admin",
  getStaffUsers: "admin",
  createStaffUser: "admin",
  updateStaffUser: "admin",
  deleteStaffUser: "admin",
  toggleStaffBlock: "admin"
};

const baseQuery = async (args, api, extraOptions) => {
  const roleRequired = endpointAuth[api.endpoint] ?? "none";
  const token = localStorage.getItem("academy_token") || localStorage.getItem("token") || localStorage.getItem("admin_token") || localStorage.getItem("mod_token") || localStorage.getItem("teacher_token");
  const req = typeof args === "string" ? { url: args } : { ...args };
  req.headers = {
    ...req.headers || {}
  };
  if (token) {
    req.headers["Authorization"] = `Bearer ${token}`;
  } else if (roleRequired !== "none") {
    return {
      error: {
        status: 401,
        data: { message: "\u063A\u064A\u0631 \u0645\u0633\u062C\u0651\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0627\u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0644\u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628." }
      }
    };
  }
  const result = await rawBaseQuery(req, api, extraOptions);
  if (result?.error?.status === 403 || result?.error?.status === 401) {
    const errorData = result.error.data;
    const message = errorData?.message || "";
    if (message.includes("\u062D\u0638\u0631") || message.includes("\u0645\u0648\u0642\u0648\u0641") || message.includes("\u063A\u064A\u0631 \u0645\u0635\u0631\u062D") || result.error.status === 403) {
      try {
        localStorage.removeItem("academy_token");
        localStorage.removeItem("academy_user");
        localStorage.removeItem("user_role");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("mod_token");
        localStorage.removeItem("teacher_token");
      } catch (e) {
        console.error(e);
      }
    }
  }
  return result;
};
const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Students",
    "Teachers",
    "Sessions",
    "Expenses",
    "Staff",
    "Settlements",
    "Renewals",
    "Dashboard",
    "Auth"
  ],
  endpoints: (builder) => ({
    // ==========================================
    // 1. AUTHENTICATION & PROFILE
    // ==========================================
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login.php",
        method: "POST",
        body: credentials
      }),
      invalidatesTags: ["Auth", "Dashboard"]
    }),
    getMe: builder.query({
      query: () => "/auth/me.php",
      providesTags: ["Auth"]
    }),
    updateMyProfile: builder.mutation({
      query: (profileData) => ({
        url: "/auth/update_profile.php",
        method: "PUT",
        body: profileData
      }),
      invalidatesTags: ["Auth", "Staff"]
    }),
    // ==========================================
    // 2. STUDENTS MANAGEMENT
    // ==========================================
    getStudents: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.teacher_id) queryParams.append("teacher_id", params.teacher_id);
        if (params?.search) queryParams.append("search", params.search);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.limit) queryParams.append("limit", params.limit); // 👈 السطر الجديد
        const q = queryParams.toString();
        return `/students/read.php${q ? `?${q}` : ""}`;
      },
      providesTags: (result) => result ? [
        ...result.map(({ id }) => ({ type: "Students", id })),
        { type: "Students", id: "LIST" }
      ] : [{ type: "Students", id: "LIST" }]
    }),

    // جلب سجل التسويات والمدفوعات
    getSettlements: builder.query({
      query: () => '/settlements/read.php',
      providesTags: ['Settlements', 'Sessions'],
    }),

    // التراجع عن التسوية
    revertSettlement: builder.mutation({
      query: (id) => ({
        url: '/settlements/revert.php',
        method: 'POST',
        body: { id },
      }),
      invalidatesTags: ['Settlements', 'Sessions', 'Teachers', 'Expenses', "Dashboard"],
    }),

    getStudentRenewals: builder.query({
      query: () => '/students/read_renewals.php',
      providesTags: ['StudentRenewals'],
    }),

    getStudentById: builder.query({
      query: (id) => `/students/read_one.php?id=${id}`,
      providesTags: (_result, _error, id) => [{ type: "Students", id }]
    }),
    createStudent: builder.mutation({
      query: (studentData) => ({
        url: "/students/create.php",
        method: "POST",
        body: studentData
      }),
      invalidatesTags: [{ type: "Students", id: "LIST" }, "Dashboard"]
    }),
    updateStudent: builder.mutation({
      query: ({ id, data }) => ({
        url: `/students/update.php?id=${id}`,
        method: "PUT",
        body: { id, ...data }
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Students", id },
        { type: "Students", id: "LIST" },
        "Dashboard"
      ]
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({
        url: `/students/delete.php?id=${id}`,
        method: "DELETE",
        body: { id }
      }),
      invalidatesTags: [{ type: "Students", id: "LIST" }, "Dashboard", "Sessions"]
    }),
    renewStudentPackage: builder.mutation({
      query: (renewalData) => ({
        url: "/students/renew_package.php",
        method: "POST",
        body: renewalData
      }),
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: "Students", id: studentId },
        { type: "Students", id: "LIST" },
        "Renewals",
        "Dashboard"
      ]
    }),
    // ==========================================
    // 3. TEACHERS & PAYROLL
    // ==========================================
    getTeachers: builder.query({
      query: () => "/teachers/read.php",
      providesTags: (result) => result ? [
        ...result.map(({ id }) => ({ type: "Teachers", id })),
        { type: "Teachers", id: "LIST" }
      ] : [{ type: "Teachers", id: "LIST" }]
    }),
    getTeacherById: builder.query({
      query: (id) => `/teachers/read_one.php?id=${id}`,
      providesTags: (_result, _error, id) => [{ type: "Teachers", id }]
    }),
    createTeacher: builder.mutation({
      query: (teacherData) => ({
        url: "/teachers/create.php",
        method: "POST",
        body: teacherData
      }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }, "Dashboard"]
    }),
    updateTeacher: builder.mutation({
      query: ({ id, data }) => ({
        url: `/teachers/update.php?id=${id}`,
        method: "PUT",
        body: { id, ...data }
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Teachers", id },
        { type: "Teachers", id: "LIST" },
        "Dashboard"
      ]
    }),
    deleteTeacher: builder.mutation({
      query: (id) => ({
        url: `/teachers/delete.php?id=${id}`,
        method: "DELETE",
        body: { id }
      }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }, "Dashboard"]
    }),
    toggleTeacherSuspension: builder.mutation({
      query: (id) => ({
        url: `/teachers/toggle_suspension.php?id=${id}`,
        method: "PUT",
        body: { id }
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Teachers", id },
        { type: "Teachers", id: "LIST" }
      ]
    }),
    settleTeacherWages: builder.mutation({
      query: (payload) => ({
        url: "/teachers/settle_wages.php",
        method: "POST",
        body: payload
      }),
      invalidatesTags: ["Teachers", "Sessions", "Settlements", "Expenses", "Dashboard"]
    }),
    // ==========================================
    // 4. SESSIONS & REPORTS
    // ==========================================
    getSessions: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.teacher_id) queryParams.append("teacher_id", params.teacher_id);
        if (params?.student_id) queryParams.append("student_id", params.student_id);
        if (params?.date) queryParams.append("date", params.date);
        if (params?.settled !== void 0) queryParams.append("settled", params.settled ? "1" : "0");
        if (params?.limit) queryParams.append("limit", params.limit);
        if (params?.search) queryParams.append("search", params.search); // 👈 هذا هو السطر الذي كان مفقوداً
        const q = queryParams.toString();
        return `/sessions/read.php${q ? `?${q}` : ""}`;
      },
      providesTags: (result) => result ? [
        ...result.map(({ id }) => ({ type: "Sessions", id })),
        { type: "Sessions", id: "LIST" }
      ] : [{ type: "Sessions", id: "LIST" }]
    }),

    logSession: builder.mutation({
      query: (sessionData) => ({
        url: "/sessions/create.php",
        method: "POST",
        body: sessionData
      }),
      invalidatesTags: [
        { type: "Sessions", id: "LIST" },
        "Students",
        "Teachers",
        "Dashboard"
      ]
    }),
    updateSession: builder.mutation({
      query: ({ id, data }) => ({
        url: `/sessions/update.php?id=${id}`,
        method: "PUT",
        body: { id, ...data }
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Sessions", id },
        { type: "Sessions", id: "LIST" },
        "Dashboard"
      ]
    }),
    deleteSession: builder.mutation({
      query: (id) => ({
        url: `/sessions/delete.php?id=${id}`,
        method: "DELETE",
        body: { id }
      }),
      invalidatesTags: [
        { type: "Sessions", id: "LIST" },
        "Students",
        "Teachers",
        "Dashboard"
      ]
    }),
    markSessionReportSent: builder.mutation({
      query: (sessionId) => ({
        url: `/sessions/mark_report_sent.php?id=${sessionId}`,
        method: "PUT",
        body: { id: sessionId }
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Sessions", id }]
    }),
    // ==========================================
    // 5. OPERATIONAL EXPENSES (ADMIN ONLY)
    // ==========================================
    getExpenses: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append("category", params.category);
        if (params?.month) queryParams.append("month", params.month);
        if (params?.limit) queryParams.append("limit", params.limit); // 👈 السطر المضاف
        const q = queryParams.toString();
        return `/expenses/read.php${q ? `?${q}` : ""}`;
      },
      providesTags: (result) => result ? [
        ...result.map(({ id }) => ({ type: "Expenses", id })),
        { type: "Expenses", id: "LIST" }
      ] : [{ type: "Expenses", id: "LIST" }]
    }),

    createExpense: builder.mutation({
      query: (expenseData) => ({
        url: "/expenses/create.php",
        method: "POST",
        body: expenseData
      }),
      invalidatesTags: [{ type: "Expenses", id: "LIST" }, "Dashboard"]
    }),
    updateExpense: builder.mutation({
      query: ({ id, data }) => ({
        url: `/expenses/update.php?id=${id}`,
        method: "PUT",
        body: { id, ...data }
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Expenses", id },
        { type: "Expenses", id: "LIST" },
        "Dashboard"
      ]
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/delete.php?id=${id}`,
        method: "DELETE",
        body: { id }
      }),
      invalidatesTags: [{ type: "Expenses", id: "LIST" }, "Dashboard"]
    }),
    // ==========================================
    // 6. STAFF & MODERATORS (ADMIN ONLY)
    // ==========================================
    getStaffUsers: builder.query({
      query: () => "/staff/read.php",
      providesTags: (result) => result ? [
        ...result.map(({ id }) => ({ type: "Staff", id })),
        { type: "Staff", id: "LIST" }
      ] : [{ type: "Staff", id: "LIST" }]
    }),
    createStaffUser: builder.mutation({
      query: (staffData) => ({
        url: "/staff/create.php",
        method: "POST",
        body: staffData
      }),
      invalidatesTags: [{ type: "Staff", id: "LIST" }]
    }),
    updateStaffUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/staff/update.php?id=${id}`,
        method: "PUT",
        body: { id, ...data }
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Staff", id },
        { type: "Staff", id: "LIST" }
      ]
    }),
    deleteStaffUser: builder.mutation({
      query: (id) => ({
        url: `/staff/delete.php?id=${id}`,
        method: "DELETE",
        body: { id }
      }),
      invalidatesTags: [{ type: "Staff", id: "LIST" }]
    }),
    toggleStaffBlock: builder.mutation({
      query: (id) => ({
        url: `/staff/toggle_block.php?id=${id}`,
        method: "PUT",
        body: { id }
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Staff", id },
        { type: "Staff", id: "LIST" }
      ]
    }),
    // ==========================================
    // 7. DASHBOARD & FINANCIAL ANALYTICS
    // ==========================================
    getAdminDashboardStats: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.month) queryParams.append("month", params.month);
        if (params?.start_date) queryParams.append("start_date", params.start_date);
        if (params?.end_date) queryParams.append("end_date", params.end_date);
        const q = queryParams.toString();
        return `/dashboard/stats.php${q ? `?${q}` : ""}`;
      },
      providesTags: ["Dashboard", "Students", "Teachers", "Sessions", "Expenses", "Renewals"]
    })
  })
});
const {
  // Auth Hooks
  useLoginMutation,
  useGetMeQuery,
  useUpdateMyProfileMutation,
  // Student Hooks
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useRenewStudentPackageMutation,
  // Teacher Hooks
  useGetTeachersQuery,
  useGetTeacherByIdQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useToggleTeacherSuspensionMutation,
  useSettleTeacherWagesMutation,
  // Session Hooks
  useGetSessionsQuery,
  useLogSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  useMarkSessionReportSentMutation,
  // Expense Hooks
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  // Staff Hooks
  useGetStaffUsersQuery,
  useCreateStaffUserMutation,
  useUpdateStaffUserMutation,
  useDeleteStaffUserMutation,
  useToggleStaffBlockMutation,
  // Dashboard Hooks
  useGetAdminDashboardStatsQuery,
  useGetStudentRenewalsQuery,

  useGetSettlementsQuery,
  useRevertSettlementMutation,
} = apiSlice;
export {
  apiSlice,
  useCreateExpenseMutation,
  useCreateStaffUserMutation,
  useCreateStudentMutation,
  useCreateTeacherMutation,
  useDeleteExpenseMutation,
  useDeleteSessionMutation,
  useDeleteStaffUserMutation,
  useDeleteStudentMutation,
  useDeleteTeacherMutation,
  useGetAdminDashboardStatsQuery,
  useGetExpensesQuery,
  useGetMeQuery,
  useGetSessionsQuery,
  useGetStaffUsersQuery,
  useGetStudentByIdQuery,
  useGetStudentsQuery,
  useGetTeacherByIdQuery,
  useGetTeachersQuery,
  useLogSessionMutation,
  useLoginMutation,
  useMarkSessionReportSentMutation,
  useRenewStudentPackageMutation,
  useSettleTeacherWagesMutation,
  useToggleStaffBlockMutation,
  useToggleTeacherSuspensionMutation,
  useUpdateExpenseMutation,
  useUpdateMyProfileMutation,
  useUpdateSessionMutation,
  useUpdateStaffUserMutation,
  useUpdateStudentMutation,
  useGetStudentRenewalsQuery,
  useUpdateTeacherMutation,

  useGetSettlementsQuery,
  useRevertSettlementMutation,
};
