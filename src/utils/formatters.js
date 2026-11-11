const CURRENCY = "ج.م";

const formatCurrency = (amount, currency = CURRENCY) => {
  return `${Number(amount || 0).toLocaleString("ar-EG")} ${currency}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch {
    return dateStr;
  }
};

const formatShortDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric"
    });
  } catch {
    return dateStr;
  }
};

const cleanPhoneForWhatsApp = (phone) => {
  if (!phone) return "";
  let cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith("01") && cleaned.length === 11) {
    cleaned = "20" + cleaned.substring(1);
  }
  return cleaned;
};

const buildSessionReportMessage = (session, student, teacher) => {
  // دعم الحقول من الباك إند مباشرة (snake_case) أو من الواجهة (camelCase)
  const completed = Number(student.completedSessions !== undefined ? student.completedSessions : student.completed_sessions) || 0;
  const size = Number(student.packageSize !== undefined ? student.packageSize : student.package_size) || 0;
  const remaining = Math.max(0, size - completed);

  const topic = session.topic || "متابعة الحفظ"; // الحقل الجديد
  const newMem = session.newMemorization || session.new_memorization || "مراجعة";
  const rev = session.revision || "تمكين ما سبق";
  const notes = session.tajweedNotes || session.tajweed_notes || "أداء طيب";
  const hw = session.homework || "تثبيت المحفوظ";

  return `🌿 *تقرير الحصة - أكاديمية وسارعوا*

• الطالب: *${student.name}*
• المعلم: *${teacher.name}*
• التاريخ: ${formatDate(session.date)} (${session.duration} دقيقة)

📌 *موضوع اليوم:* ${topic}
📖 *الجديد:* ${newMem}
🔁 *المراجعة:* ${rev}
🎯 *التقييم:* ${session.rating}
💡 *الملاحظات:* ${notes}
📝 *المطلوب القادم:* ${hw}

📊 *رصيد الباقة:* (${completed} من ${size} حصص)
${remaining === 0 ? "⚠️ *اكتملت الباقة، يُرجى التجديد.*" : `المتبقي: *${remaining}* حصة`}

بارك الله فيكم 🤲`;
};

const buildRenewalAlertMessage = (student) => {
  // دعم الحقول من الباك إند أو الواجهة
  const completed = Number(student.completedSessions !== undefined ? student.completedSessions : student.completed_sessions) || 0;
  const size = Number(student.packageSize !== undefined ? student.packageSize : student.package_size) || 0;
  const fee = Number(student.subscriptionFee !== undefined ? student.subscriptionFee : student.subscription_fee) || 0;

  return `السلام عليكم ورحمة الله،
ولي أمر الطالب: *${student.name}* 🌸

نحيطكم علماً بانتهاء حصص الباقة الحالية (${completed}/${size} حصة).

• رسوم التجديد: *${formatCurrency(fee)}*

يرجى تأكيد التجديد لاستمرار الحلقات بانتظام. خالص الشكر والتقدير.`;
};

const getWhatsAppLink = (phone, text) => {
  const cleaned = cleanPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${cleaned}?text=${encoded}`;
};

const getWhatsAppDirectChatLink = (phone) => {
  const cleaned = cleanPhoneForWhatsApp(phone);
  return `https://wa.me/${cleaned}`;
};

export {
  CURRENCY,
  buildRenewalAlertMessage,
  buildSessionReportMessage,
  cleanPhoneForWhatsApp,
  formatCurrency,
  formatDate,
  formatShortDate,
  getWhatsAppDirectChatLink,
  getWhatsAppLink
};