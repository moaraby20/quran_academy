import React, { useState, useEffect } from "react";
import { useAcademy } from "../../context/AcademyContext";
import { useRenewStudentPackageMutation } from "../../rtk/slices/apiSlice";
import { buildRenewalAlertMessage, getWhatsAppLink } from "../../utils/formatters";
import {
  X,
  RotateCw,
  MessageCircle,
  ArrowUpRight,
  Loader2
} from "lucide-react";

const RenewPackageModal = () => {
  const { renewalModalStudent, closeRenewalModal } = useAcademy();
  const student = renewalModalStudent?.student;

  // دالة الـ API الخاصة بتجديد الباقة
  const [renewPackage, { isLoading }] = useRenewStudentPackageMutation();

  const [packageSize, setPackageSize] = useState(8);
  const [fee, setFee] = useState(800);

  useEffect(() => {
    if (student) {
      setPackageSize(student.packageSize || 8);
      setFee(student.subscriptionFee || 800);
    }
  }, [student]);

  if (!renewalModalStudent || !student) return null;

  const handleRenew = async (e) => {
    e.preventDefault();
    try {
      await renewPackage({
        studentId: student.id,
        package_name: `باقة ${packageSize} حصص`,
        package_size: packageSize,
        subscription_fee: fee,
      }).unwrap();

      closeRenewalModal();
    } catch (err) {
      console.error("Failed to renew package:", err);
      alert(err?.data?.message || "حدث خطأ أثناء تجديد الباقة");
    }
  };

  const renewalMessage = buildRenewalAlertMessage(student);
  const waLink = getWhatsAppLink(student.parentPhone, renewalMessage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-semibold text-neutral-100">
              تجديد باقة: {student.name}
            </h3>
          </div>
          <button
            onClick={closeRenewalModal}
            disabled={isLoading}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleRenew} className="p-4 sm:p-5 space-y-4">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-1 font-mono tabular-nums">
            <div className="flex justify-between text-neutral-400">
              <span className="font-sans">الحصص السابقة:</span>
              <span className="text-amber-400">{student.completedSessions} من {student.packageSize} حصة (مكتملة)</span>
            </div>
          </div>

          {/* New Package Size */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              عدد حصص الباقة الجديدة:
            </label>
            <div className="grid grid-cols-5 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 font-mono tabular-nums">
              {[4, 8, 12, 16, 20].map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => setPackageSize(size)}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${packageSize === size ? "bg-neutral-800 text-white font-semibold" : "text-neutral-400 hover:text-neutral-200"}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Fee input */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              رسوم الاشتراك (ج.م)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono tabular-nums transition-colors duration-150 outline-none"
              required
            />
          </div>

          {/* Direct WhatsApp alert button */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 transition-colors duration-150"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>مراسلة واتساب</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeRenewalModal}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                <span>{isLoading ? "جاري التجديد..." : "تأكيد التجديد"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export { RenewPackageModal };