import { useState } from "react";
import { useAcademy } from "../../context/AcademyContext";
import { useLoginMutation } from "../../rtk/slices/apiSlice";
import { BookOpen, Lock, Mail, AlertCircle, ArrowLeft, AlertTriangle, X } from "lucide-react";

const LoginPage = () => {
  const { setCurrentUser, suspensionAlertMessage, clearSuspensionAlert } = useAcademy();
  const [loginMutation, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("يرجى إدخال البريد الإلكتروني أو رقم الهاتف وكلمة المرور");
      return;
    }

    try {
      const result = await loginMutation({ username: email, password }).unwrap();

      localStorage.setItem("academy_token", result.token);

      setCurrentUser(result.user);

    } catch (err) {
      setError(err?.data?.message || "بيانات الدخول غير صحيحة أو حدث خطأ في الاتصال");
    }
  };

  return (
    // التعديل هنا: منع السكرول تماماً بحجم الشاشة الدقيق
    <div className="h-screen w-full overflow-hidden bg-neutral-950 flex flex-col justify-center items-center px-4 font-['IBM_Plex_Sans_Arabic',sans-serif] text-neutral-100">

      {/* Background Subtle Glow - تم تقليل حجمه لضمان عدم خروجه من الشاشة */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 overflow-hidden">
        <div className="w-[400px] h-[400px] bg-emerald-950/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 text-emerald-400 mb-3 shadow-lg shadow-emerald-950/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            أكاديمية وسارعوا
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            نظام إدارة الحلقات القرآنية والاشتراكات والمستحقات
          </p>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
          {suspensionAlertMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-200 text-xs flex items-start gap-2.5 shadow-lg shadow-amber-950/40 animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-bold text-amber-100 text-xs">تم تسجيل الخروج: الحساب معطل مؤقتاً</p>
                <p className="text-neutral-200 leading-relaxed text-[11px]">{suspensionAlertMessage}</p>
              </div>
              <button
                type="button"
                onClick={clearSuspensionAlert}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer transition-colors"
                title="إغلاق التنبيه"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                اسم المستخدم، البريد، أو رقم الهاتف
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 pr-9 font-mono transition-colors focus:outline-none"
                  required
                  autoFocus
                />
                <Mail className="w-4 h-4 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 pr-9 font-mono transition-colors focus:outline-none"
                  required
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer mt-2 disabled:opacity-60"
            >
              <span>{isLoading ? "جاري التحقق..." : "تسجيل الدخول"}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export { LoginPage };