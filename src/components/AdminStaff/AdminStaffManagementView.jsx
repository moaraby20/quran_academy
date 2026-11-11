import { useState } from "react";
import { useAcademy } from "../../context/AcademyContext";
import {
  useGetStaffUsersQuery,
  useCreateStaffUserMutation,
  useUpdateStaffUserMutation,
  useDeleteStaffUserMutation,
  useToggleStaffBlockMutation
} from "../../rtk/slices/apiSlice";
import {
  UserPlus,
  Search,
  Trash2,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Loader2
} from "lucide-react";

const AdminStaffManagementView = () => {
  const { currentUser, setCurrentUser } = useAcademy();

  // جلب البيانات والدوال من الـ API
  const { data: rawStaff = [], isLoading } = useGetStaffUsersQuery();
  const [createStaffMut, { isLoading: isCreating }] = useCreateStaffUserMutation();
  const [updateStaffMut, { isLoading: isUpdating }] = useUpdateStaffUserMutation();
  const [deleteStaffMut, { isLoading: isDeleting }] = useDeleteStaffUserMutation();
  const [toggleBlockMut, { isLoading: isToggling }] = useToggleStaffBlockMutation();

  const isSubmitting = isCreating || isUpdating || isDeleting || isToggling;

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [blockingUser, setBlockingUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // حالات الإضافة والتعديل
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("moderator");

  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNewPassword, setEditNewPassword] = useState("");
  const [editRole, setEditRole] = useState("moderator");

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // تهيئة وعمل Mapping للبيانات القادمة من الباك إند
  const staffUsers = rawStaff.map(u => ({
    ...u,
    isSuperAdmin: u.is_super_admin == 1,
    isBlocked: u.is_blocked == 1
  }));

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditFullName(user.name);
    setEditEmail(user.email || user.username || "");
    setEditPhone(user.phone || "");
    setEditNewPassword("");
    setEditRole(user.role);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      showToast("يرجى كتابة الاسم والبريد الإلكتروني وكلمة المرور", "error");
      return;
    }

    try {
      await createStaffMut({
        name: newFullName.trim(),
        username: newEmail.trim().toLowerCase(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim() || undefined,
        password: newPassword.trim(),
        role: newRole
      }).unwrap();

      setIsAddModalOpen(false);
      setNewFullName("");
      setNewEmail("");
      setNewPassword("");
      setNewPhone("");
      setNewRole("moderator");
      showToast(`تمت إضافة ${newRole === "admin" ? "المدير" : "المشرف"} بنجاح.`);
    } catch (err) {
      showToast(err?.data?.message || "حدث خطأ أثناء الإنشاء", "error");
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editFullName.trim() || !editEmail.trim()) {
      showToast("يرجى إدخال الاسم والبريد الإلكتروني", "error");
      return;
    }

    try {
      const updatedData = {
        name: editFullName.trim(),
        username: editEmail.trim().toLowerCase(),
        email: editEmail.trim().toLowerCase(),
        phone: editPhone.trim() || undefined,
        role: editingUser.isSuperAdmin ? "admin" : editRole
      };

      if (editNewPassword.trim()) {
        updatedData.password = editNewPassword.trim();
      }

      await updateStaffMut({
        id: editingUser.id,
        data: updatedData
      }).unwrap();

      // تحديث بيانات الجلسة الحالية إذا كان يعدل حسابه الشخصي
      if (currentUser?.id === editingUser.id) {
        setCurrentUser(prev => ({
          ...prev,
          name: updatedData.name,
          role: updatedData.role
        }));
      }

      setEditingUser(null);
      showToast("تم حفظ التعديلات بنجاح");
    } catch (err) {
      showToast(err?.data?.message || "حدث خطأ أثناء التحديث", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await deleteStaffMut(deletingUser.id).unwrap();
      setDeletingUser(null);
      showToast("تم حذف الحساب بنجاح");
    } catch (err) {
      setDeletingUser(null);
      showToast(err?.data?.message || "حدث خطأ أثناء الحذف", "error");
    }
  };

  const handleConfirmToggleBlock = async () => {
    if (!blockingUser) return;

    try {
      await toggleBlockMut(blockingUser.id).unwrap();
      setBlockingUser(null);
      showToast("تم تغيير حالة الحظر بنجاح");
    } catch (err) {
      setBlockingUser(null);
      showToast(err?.data?.message || "فشل تغيير حالة الحظر", "error");
    }
  };

  const filteredStaff = staffUsers.filter((user) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(term) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.phone && user.phone.includes(searchQuery));

    if (!matchesSearch) return false;
    if (roleFilter === "admin") return user.role === "admin";
    if (roleFilter === "moderator") return user.role === "moderator";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 left-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 border text-xs font-semibold animate-in slide-in-from-bottom-3 duration-150 ${toastMessage.type === "success" ? "bg-emerald-950 text-emerald-200 border-emerald-700" : "bg-red-950 text-red-200 border-red-700"}`}>
          {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-100">إدارة الأدمن والمشرفين</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            إضافة وتعديل حسابات المدراء والمشرفين بالبريد الإلكتروني وكلمة المرور وتعيين الصلاحيات.
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl pr-8 pl-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Filter & Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-950 border border-neutral-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${roleFilter === "all" ? "bg-neutral-800 text-white" : "text-neutral-400"}`}
            >
              الكل ({staffUsers.length})
            </button>
            <button
              onClick={() => setRoleFilter("admin")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${roleFilter === "admin" ? "bg-neutral-800 text-amber-300" : "text-neutral-400"}`}
            >
              أدمن
            </button>
            <button
              onClick={() => setRoleFilter("moderator")}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${roleFilter === "moderator" ? "bg-neutral-800 text-teal-300" : "text-neutral-400"}`}
            >
              مشرف
            </button>
          </div>

          <button
            onClick={() => {
              setNewPassword("");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إضافة حساب</span>
          </button>
        </div>
      </div>

      {/* Clean User Cards Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-8 text-center text-xs text-neutral-400">
          لا توجد حسابات مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStaff.map((user) => {
            const isUserAdmin = user.role === "admin";
            const isSelf = currentUser?.id === user.id;

            return (
              <div
                key={user.id}
                className={`bg-neutral-900/80 border rounded-xl p-4 transition-all duration-150 flex flex-col justify-between ${user.isBlocked ? "border-red-900/50 bg-red-950/10" : isSelf ? "border-emerald-700/60 ring-1 ring-emerald-600/30" : "border-neutral-800 hover:border-neutral-700"}`}
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-neutral-100 truncate">{user.name}</h3>
                        {isSelf && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1 py-0.2 rounded">
                            أنت
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-neutral-400 mt-0.5 truncate max-w-[200px]">
                        {user.email || user.username}
                      </p>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${user.isBlocked ? "bg-red-950 text-red-300 border border-red-800" : isUserAdmin ? "bg-amber-950/70 text-amber-300 border border-amber-800/60" : "bg-teal-950/70 text-teal-300 border border-teal-800/60"}`}>
                      {user.isBlocked ? "محظور" : isUserAdmin ? " أدمن" : " مشرف"}
                    </span>
                  </div>

                  {/* Clean info fields */}
                  <div className="space-y-1.5 text-xs text-neutral-400 mb-3 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">البريد الإلكتروني:</span>
                      <span className="font-mono text-neutral-300 truncate max-w-[180px]">
                        {user.email || user.username}
                      </span>
                    </div>

                    {user.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">الهاتف:</span>
                        <span className="font-mono text-neutral-300">{user.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">الحالة:</span>
                      <span className={user.isBlocked ? "text-red-400 font-medium" : "text-emerald-400 font-medium"}>
                        {user.isBlocked ? "ممنوع من الدخول" : "نشط"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-2.5 border-t border-neutral-800/70 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تعديل الحساب / كلمة السر</span>
                  </button>

                  {!user.isSuperAdmin && !isSelf && (
                    <button
                      onClick={() => setBlockingUser(user)}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${user.isBlocked ? "bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border-emerald-800" : "bg-amber-950/40 hover:bg-amber-900/50 text-amber-400 border-amber-800"}`}
                      title={user.isBlocked ? "إلغاء الحظر" : "حظر الحساب"}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!user.isSuperAdmin && !isSelf && (
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/70 text-red-400 border border-red-900/50 transition-colors cursor-pointer"
                      title="حذف الحساب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD NEW USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 max-w-lg w-full shadow-2xl">
            <h3 className="text-sm font-bold text-neutral-100 mb-4 pb-2 border-b border-neutral-800">
              إضافة حساب أدمن أو مشرف جديد
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="مثال: أستاذ حازم المنشاوي"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">الرتبة / الصلاحية *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none cursor-pointer"
                  >
                    <option value="moderator"> مشرف (بدون رئيسية ومصروفات)</option>
                    <option value="admin"> مدير عام (أدمن كامل الصلاحيات)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@wasareo.com"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">رقم الهاتف / الواتساب (اختياري)</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="010xxxxxxx"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>إضافة الحساب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER & CHANGE PASSWORD */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 max-w-lg w-full shadow-2xl">
            <h3 className="text-sm font-bold text-neutral-100 mb-4 pb-2 border-b border-neutral-800">
              تعديل حساب: {editingUser.name}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">الرتبة</label>
                  <select
                    disabled={editingUser.isSuperAdmin}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="moderator"> مشرف</option>
                    <option value="admin"> أدمن</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  تعيين كلمة مرور جديدة (اتركها فارغة إذا لم ترد التغيير)
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer disabled:opacity-50"
                >
                  {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-sm font-bold text-neutral-100 mb-2">حذف الحساب نهائياً؟</h3>
            <p className="text-xs text-neutral-400 mb-4">
              هل أنت متأكد من رغبتك في حذف حساب <span className="text-neutral-200 font-semibold">{deletingUser.name}</span>؟
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeletingUser(null)}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>تأكيد الحذف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BLOCK DIALOG */}
      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-sm font-bold text-neutral-100 mb-2">
              {blockingUser.isBlocked ? "إلغاء حظر الحساب" : "حظر هذا الحساب"}
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              {blockingUser.isBlocked ? `هل تريد السماح لـ ${blockingUser.name} بتسجيل الدخول مجدداً؟` : `سيتم حظر ${blockingUser.name} وطرده فوراً من النظام ولن يتمكن من الدخول.`}
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setBlockingUser(null)}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmToggleBlock}
                disabled={isSubmitting}
                className={`px-4 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white disabled:opacity-50 ${blockingUser.isBlocked ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500"}`}
              >
                {isToggling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{blockingUser.isBlocked ? "تأكيد فك الحظر" : "تأكيد الحظر"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { AdminStaffManagementView };