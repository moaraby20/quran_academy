import { useAcademy } from "../../context/AcademyContext";
import { useGetStudentsQuery } from "../../rtk/slices/apiSlice";
import { buildRenewalAlertMessage, getWhatsAppLink } from "../../utils/formatters";
import {
  RotateCw,
  MessageCircle,
  CheckCircle2,
  ArrowUpRight,
  Loader2
} from "lucide-react";

const RenewalAlertsList = () => {
  const { openRenewalModal } = useAcademy();

  // 👈 التعديل الذهبي هنا: بنطلب من السيرفر (مستحقي التجديد فقط) بحد أقصى 20 طالب!
  const { data: rawStudents = [], isLoading } = useGetStudentsQuery(
    { status: "renewal_due", limit: 20 },
    {
      pollingInterval: 15000, // تحديث تنبيهات التجديد تلقائياً كل 15 ثانية
      refetchOnFocus: true,
      refetchOnReconnect: true
    }
  );

  if (isLoading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-center text-emerald-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  // 👈 تم إزالة الفلتر (filter) المحلي بالكامل، لأن السيرفر أرسل الخلاصة الجاهزة!
  // نقوم فقط بتوحيد أسماء الحقول (Mapping) لتناسب الواجهة
  const renewalDueStudents = rawStudents.map((s) => ({
    ...s,
    completedSessions: Number(s.completed_sessions),
    packageSize: Number(s.package_size),
    parentName: s.parent_name,
    parentPhone: s.parent_phone,
    teacherId: s.teacher_id,
    currentSurah: s.current_surah,
    currentJuz: s.current_juz,
    packageName: s.package_name,
    subscriptionFee: Number(s.subscription_fee)
  }));

  if (renewalDueStudents.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>جميع اشتراكات الطلاب سارية.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs font-semibold text-neutral-100">
            تنبيهات التجديد ({renewalDueStudents.length})
          </h3>
        </div>
        <span className="text-[11px] text-neutral-500">
          انتهت حصص الباقة
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {renewalDueStudents.map((student) => {
          const renewalMsg = buildRenewalAlertMessage(student);
          const waLink = getWhatsAppLink(student.parentPhone, renewalMsg);

          return (
            <div
              key={student.id}
              className="p-3.5 sm:p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between gap-3 hover:border-neutral-700 transition-colors duration-150"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                    {student.name}
                  </h4>
                  <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                    <span>ولي الأمر: {student.parentName || student.parentPhone}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md text-xs font-mono tabular-nums font-bold bg-amber-950/70 border border-amber-800/80 text-amber-300 shrink-0">
                  {student.completedSessions}/{student.packageSize} حصة
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-800/80 transition-colors duration-150"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>واتساب</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </a>

                <button
                  type="button"
                  onClick={() => openRenewalModal({ student })}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors duration-150 cursor-pointer active:scale-95"
                >
                  <RotateCw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>تجديد</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { RenewalAlertsList };