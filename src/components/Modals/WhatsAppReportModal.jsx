import { useRef, useState } from "react";
import { useAcademy } from "../../context/AcademyContext";
import { useGetSessionsQuery, useMarkSessionReportSentMutation } from "../../rtk/slices/apiSlice";
import { getWhatsAppDirectChatLink, cleanPhoneForWhatsApp } from "../../utils/formatters";
import {
  X,
  Copy,
  Check,
  MessageCircle,
  ArrowUpRight,
  Download,
  CheckCircle2
} from "lucide-react";
import { AcademyLogo, OFFICIAL_LOGO_SRC } from "../AcademyLogo";

const WhatsAppReportModal = () => {
  const { whatsAppReportModal, closeWhatsAppReport } = useAcademy();

  // جلب البيانات والدوال من الـ API
  const { data: sessions = [] } = useGetSessionsQuery();
  const [markReportSentMut] = useMarkSessionReportSentMutation();

  const [copiedImage, setCopiedImage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const cardRef = useRef(null);

  if (!whatsAppReportModal) return null;

  const { session, student, teacher } = whatsAppReportModal;

  // التأكد من جلب رقم الهاتف الصحيح
  const parentPhoneToUse = student.parentPhone || student.parent_phone;
  const directChatLink = getWhatsAppDirectChatLink(parentPhoneToUse);
  const cleanPhone = cleanPhoneForWhatsApp(parentPhoneToUse);

  const studentSessionsDesc = [...sessions]
    .filter((s) => s.student_id === student.id || s.studentId === student.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const reverseIndex = studentSessionsDesc.findIndex((s) => s.id === session.id);

  // 💡 التعديل النهائي المضمون:
  // إذا كانت الحصة جديدة (مُسجلة للتو)، نضيف 1 على الإجمالي.
  // إذا كانت من الأرشيف (تاريخية)، نحسب ترتيبها الحقيقي.
  const totalCompleted = Number(student.completedSessions || student.completed_sessions) || 0;

  let sessionNumber;

  if (session.isNewSession) {
    // حصة جديدة من صفحة التسجيل
    sessionNumber = totalCompleted + 1;
  } else {
    // حصة مفتوحة من الأرشيف
    const studentSessionsDesc = [...sessions]
      .filter((s) => s.student_id === student.id || s.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const reverseIndex = studentSessionsDesc.findIndex((s) => s.id === session.id);
    sessionNumber = reverseIndex !== -1 ? Math.max(1, totalCompleted - reverseIndex) : totalCompleted;
  }

  let dayName = "اليوم";
  let formattedFullDate = session.date;
  try {
    const d = new Date(session.date);
    dayName = d.toLocaleDateString("ar-EG", { weekday: "long" });
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    formattedFullDate = `${day}/${month}/${year}`;
  } catch { }

  // معالجة النصوص القادمة من الـ API
  const newMem = session.newMemorization || session.new_memorization;
  const rev = session.revision;
  const notes = session.tajweedNotes || session.tajweed_notes;
  const hw = session.homework;

  // استدعاء موضوع اليوم أو وضع قيمة افتراضية
  const topic = session.topic || "متابعة الحفظ";

  const todayTopicText = topic; // نستخدم المتغير الجديد هنا
  const teacherNoteText = notes && notes.trim() ? notes.trim() : "أداء متميز وتلاوة طيبة مباركة";
  const nextSessionRequiredText = hw && hw.trim() ? hw.trim() : "تثبيت ما تم حفظه ومراجعته جيداً";

  const loadLogoImage = () => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = OFFICIAL_LOGO_SRC;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  };

  const generateCanvasImage = async () => {
    const width = 1000;
    const padTop = 35;
    const padBottom = 40;
    const logoR = 75;
    const logoDiameter = logoR * 2;
    const titleAreaHeight = 150;
    const rowHeight = 76;
    const rowGap = 16;
    const numStandardRows = 6;
    const dateRowHeight = 104;
    const prayersHeight = 135;
    const eduHeight = 245; // الارتفاع يكفي لـ 3 أسطر بالظبط (موضوع اليوم، ملاحظة، المطلوب)
    const duaaHeight = 85;
    const rowsTotal = numStandardRows * rowHeight + dateRowHeight + 7 * rowGap;
    const contentTotal = titleAreaHeight + logoDiameter + rowsTotal + rowGap + prayersHeight + rowGap + eduHeight + rowGap + duaaHeight;
    const calculatedHeight = Math.round(contentTotal + padTop + padBottom);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = calculatedHeight;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FAF8F5";
    ctx.fillRect(0, 0, width, calculatedHeight);
    ctx.strokeStyle = "#E2B874";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(14, 14, width - 28, calculatedHeight - 28, 42);
    ctx.stroke();
    ctx.strokeStyle = "#FDF6E8";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(28, 28, width - 56, calculatedHeight - 56, 36);
    ctx.stroke();

    const logoImg = await loadLogoImage();
    const logoX = width / 2;
    const logoY = padTop + logoR + 10;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR + 5, 0, Math.PI * 2);
    ctx.fillStyle = "#DFB263";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
    ctx.clip();
    if (logoImg) {
      const srcSize = Math.min(logoImg.width, logoImg.height);
      const srcX = (logoImg.width - srcSize) / 2;
      const srcY = (logoImg.height - srcSize) / 2;
      ctx.drawImage(
        logoImg,
        srcX,
        srcY,
        srcSize,
        srcSize,
        logoX - logoR,
        logoY - logoR,
        logoR * 2,
        logoR * 2
      );
    } else {
      ctx.fillStyle = "#0B2338";
      ctx.fillRect(logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📖", logoX, logoY + 12);
    }
    ctx.restore();

    ctx.fillStyle = "#1E1B4B";
    ctx.font = 'bold 46px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    ctx.fillText("أكاديمية وسارعوا", width / 2, logoY + logoR + 45);
    ctx.fillStyle = "#BE185D";
    ctx.font = 'bold 32px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillText("📋 تقرير الحصة", width / 2, logoY + logoR + 90);

    let currentY = logoY + logoR + 120;
    const rowX = 50;
    const rowWidth = width - 100;
    const labelWidth = 230;
    const borderRadius = 20;

    const drawRowCard = (label, value, options) => {
      const h = options?.customHeight || rowHeight;
      ctx.save();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(rowX, currentY, rowWidth, h, borderRadius);
      ctx.fill();
      ctx.strokeStyle = "#E2B874";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.clip();
      ctx.fillStyle = "#9D174D";
      const labelX = rowX + rowWidth - labelWidth;
      ctx.fillRect(labelX, currentY, labelWidth, h);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = 'bold 24px "Cairo", "Segoe UI", Tahoma, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, labelX + labelWidth / 2, currentY + h / 2);
      const valueAreaX = rowX;
      const valueAreaWidth = rowWidth - labelWidth;
      ctx.fillStyle = options?.valueColor || "#1F2937";
      ctx.font = 'bold 26px "Cairo", "Segoe UI", Tahoma, sans-serif';
      ctx.textAlign = "center";
      if (options?.subBadge) {
        ctx.fillText(value, valueAreaX + valueAreaWidth / 2, currentY + 34);
        const badgeW = 260;
        const badgeH = 36;
        const bX = valueAreaX + (valueAreaWidth - badgeW) / 2;
        const bY = currentY + 54;
        ctx.fillStyle = "#10B981";
        ctx.beginPath();
        ctx.roundRect(bX, bY, badgeW, badgeH, 18);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = 'bold 18px "Cairo", "Segoe UI", Tahoma, sans-serif';
        ctx.fillText(options.subBadge, valueAreaX + valueAreaWidth / 2, bY + badgeH / 2 + 1);
      } else {
        ctx.fillText(value, valueAreaX + valueAreaWidth / 2, currentY + h / 2);
      }
      ctx.restore();
      currentY += h + rowGap;
    };

    drawRowCard("الاسم 👦", student.name);
    drawRowCard("التاريخ 📅", session.date, {
      subBadge: `${formattedFullDate} - ${dayName}`,
      customHeight: dateRowHeight
    });
    drawRowCard("رقم الحصة 🔢", `${sessionNumber}`);
    drawRowCard("وقت الحصة ⏱️", `${session.duration} دقيقة`);
    drawRowCard("الجديد 📖", newMem || "مراجعة");
    drawRowCard("المراجعة 🔄", rev || "-");
    drawRowCard("التقدير ⭐", session.rating || "ممتاز", {
      valueColor: session.rating === "يحتاج تمكين ومراجعة" ? "#DC2626" : "#15803D"
    });

    const prayersY = currentY;
    const prayersH = prayersHeight;
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(rowX, prayersY, rowWidth, prayersH, borderRadius);
    ctx.fill();
    ctx.strokeStyle = "#E2B874";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.clip();
    ctx.fillStyle = "#9D174D";
    ctx.fillRect(rowX, prayersY, rowWidth, 42);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = 'bold 23px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏓 متابعة الصلوات الخمس", width / 2, prayersY + 21);


    // 💡 التعديل هنا: نعتمد بقوة على المتغير session الممرر للمودال مباشرة
    // حيث يحتوي على أحدث القيم سواء من التسجيل الجديد أو من قاعدة البيانات.
    const fajrDone = Number(session.prayed_fajr) === 1 || session.prayed_fajr === true;
    const dhuhrDone = Number(session.prayed_dhuhr) === 1 || session.prayed_dhuhr === true;
    const asrDone = Number(session.prayed_asr) === 1 || session.prayed_asr === true;
    const maghribDone = Number(session.prayed_maghrib) === 1 || session.prayed_maghrib === true;
    const ishaDone = Number(session.prayed_isha) === 1 || session.prayed_isha === true;

    const prayers = [
      { name: "الفجر", icon: "🌅", done: fajrDone },
      { name: "الظهر", icon: "☀️", done: dhuhrDone },
      { name: "العصر", icon: "🌤️", done: asrDone },
      { name: "المغرب", icon: "🌇", done: maghribDone },
      { name: "العشاء", icon: "🌙", done: ishaDone }
    ];

    const colW = rowWidth / 5;
    ctx.strokeStyle = "#F3E8D6";
    ctx.lineWidth = 1.8;
    for (let i = 1; i < 5; i++) {
      const dividerX = rowX + rowWidth - i * colW;
      ctx.beginPath();
      ctx.moveTo(dividerX, prayersY + 42);
      ctx.lineTo(dividerX, prayersY + prayersH);
      ctx.stroke();
    }

    prayers.forEach((p, idx) => {
      const pX = rowX + rowWidth - (idx + 1) * colW;
      ctx.fillStyle = "#374151";
      ctx.font = 'bold 18px "Cairo", "Segoe UI", Tahoma, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(`${p.icon} ${p.name}`, pX + colW / 2, prayersY + 74);

      if (p.done) {
        ctx.fillStyle = "#10B981"; // لون أخضر للعلامة
        ctx.font = 'bold 26px sans-serif'; // خط يدعم الرموز في كل الأجهزة
        ctx.fillText("✔", pX + colW / 2, prayersY + 108);
      } else {
        ctx.fillStyle = "#9CA3AF";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("—", pX + colW / 2, prayersY + 108);
      }
    });


    ctx.restore();
    currentY += prayersH + rowGap;

    const eduY = currentY;
    const eduH = eduHeight;
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(rowX, eduY, rowWidth, eduH, borderRadius);
    ctx.fill();
    ctx.strokeStyle = "#9D174D";
    ctx.lineWidth = 2.8;
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#9D174D";
    ctx.font = 'bold 28px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = "right";
    ctx.fillText("🕊️ الجانب التربوي", rowX + rowWidth - 25, eduY + 44);

    // --- رسم النصوص داخل الجانب التربوي ---
    ctx.fillStyle = "#1E1B4B";
    ctx.font = 'bold 23px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillText("📌 موضوع اليوم:", rowX + rowWidth - 25, eduY + 95);
    ctx.font = 'bold 21px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = "#1F2937";
    ctx.fillText(todayTopicText, rowX + rowWidth - 210, eduY + 95);

    ctx.fillStyle = "#1E1B4B";
    ctx.font = 'bold 23px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillText("📝 ملاحظة المعلم:", rowX + rowWidth - 25, eduY + 148);
    ctx.font = '21px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = "#374151";
    ctx.fillText(teacherNoteText, rowX + rowWidth - 210, eduY + 148);

    ctx.fillStyle = "#1E1B4B";
    ctx.font = 'bold 23px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillText("🎯 المطلوب للقاء القادم:", rowX + rowWidth - 25, eduY + 201);
    ctx.font = 'bold 22px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.fillStyle = "#047857";
    ctx.fillText(nextSessionRequiredText, rowX + rowWidth - 280, eduY + 201);

    ctx.restore();
    currentY += eduH + 28;

    ctx.fillStyle = "#9D174D";
    ctx.font = 'bold 23px "Cairo", "Segoe UI", Tahoma, sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("💖 نسأل الله أن يبارك في ولدكم ويجعله من حفظة", width / 2, currentY);
    ctx.fillText("كتابه الكريم 🌿", width / 2, currentY + 34);

    return canvas;
  };

  const handleDownloadImage = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateCanvasImage();
      const link = document.createElement("a");
      link.download = `تقرير_${student.name.replace(/\s+/g, "_")}_حصة_${sessionNumber}.png`;
      link.href = canvas.toDataURL("image/png", 1);
      link.click();
    } catch (err) {
      console.error("Error exporting image:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImageToClipboard = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateCanvasImage();
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 2500);
          } catch {
            handleDownloadImage();
          }
        }
      }, "image/png", 1);
    } catch (err) {
      console.error("Error copying image:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setIsExporting(true);
    setStatusMessage("جارٍ تجهيز صورة التقرير وفتح محادثة ولي الأمر...");

    // تحديث حالة الحصة في الداتابيز لتصبح "تم إرسال التقرير"
    try {
      await markReportSentMut(session.id).unwrap();
    } catch (err) {
      console.error("Failed to mark report as sent", err);
    }

    try {
      const canvas = await generateCanvasImage();
      canvas.toBlob(async (blob) => {
        const fileName = `تقرير_${student.name.replace(/\s+/g, "_")}_حصة_${sessionNumber}.png`;
        if (blob) {
          let copied = false;
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob })
            ]);
            copied = true;
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 4000);
          } catch {
            const link = document.createElement("a");
            link.download = fileName;
            link.href = URL.createObjectURL(blob);
            link.click();
          }
          setStatusMessage(
            copied ? "✅ تم نسخ صورة التقرير! اضغط (لصق / Paste) في محادثة ولي الأمر لإرسالها فوراً." : "✅ تم تحميل صورة التقرير! اسحبها أو أرفقها في المحادثة المفتوحة."
          );
        }
        window.open(directChatLink, "_blank", "noopener,noreferrer");
        setIsExporting(false);
      }, "image/png", 1);
    } catch (err) {
      console.error("Error sending WhatsApp report image:", err);
      setIsExporting(false);
      window.open(directChatLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:py-3.5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <AcademyLogo size={36} shape="circle" className="border-amber-400/50" />
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>بطاقة تقرير الحصة - واتساب</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-800/60 text-pink-300 font-mono">
                  حصة رقم {sessionNumber}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                الطالب: <span className="text-neutral-200 font-medium">{student.name}</span> · المعلم: <span className="text-neutral-200">{teacher.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={closeWhatsAppReport}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body - Perfectly fitted card */}
        <div className="p-2 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 bg-neutral-950/60 flex flex-col items-center">

          {/* THE REPLICA REPORT CARD - Scaled down for mobile preview */}
          <div
            ref={cardRef}
            className="w-full max-w-[345px] sm:max-w-[540px] rounded-[24px] sm:rounded-[36px] p-3.5 sm:p-7 text-neutral-900 shadow-2xl relative select-none"
            style={{
              backgroundColor: "#FAF8F5",
              border: "4px solid #E2B874",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6), inset 0 0 0 2px #FDF6E8",
              direction: "rtl",
              fontFamily: "system-ui, -apple-system, sans-serif"
            }}
          >
            {/* Top Center Official Academy Logo */}
            <div className="flex justify-center -mt-1 mb-1.5 sm:mb-2.5">
              <div className="p-0.5 sm:p-1 rounded-full bg-linear-to-b from-amber-400 via-amber-200 to-amber-600 shadow-lg">
                <AcademyLogo size={56} shape="circle" className="rounded-full shadow-inner border-2 border-white sm:w-[84px] sm:h-[84px]" />
              </div>
            </div>

            {/* Academy Title */}
            <div className="text-center space-y-0.5 sm:space-y-1 mb-2.5 sm:mb-4">
              <h2 className="text-xl sm:text-3xl font-black text-[#1E1B4B] tracking-tight">
                أكاديمية وسارعوا
              </h2>
              <div className="inline-flex items-center gap-1 text-xs sm:text-lg font-bold text-[#BE185D]">
                <span>تقرير الحصة</span>
                <span>📋</span>
              </div>
            </div>

            {/* Rows Grid */}
            <div className="space-y-1.5 sm:space-y-2.5">
              {/* Row 1: Name */}
              <div className="flex items-stretch rounded-xl sm:rounded-2xl border sm:border-2 border-[#E2B874] overflow-hidden bg-white shadow-xs">
                <div className="w-24 sm:w-34 bg-[#9D174D] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
                  الاسم 👦
                </div>
                <div className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold text-neutral-800 flex items-center justify-center text-center">
                  {student.name}
                </div>
              </div>

              {/* Row 2: Date + Day Badge */}
              <div className="flex items-stretch rounded-xl sm:rounded-2xl border sm:border-2 border-[#E2B874] overflow-hidden bg-white shadow-xs">
                <div className="w-24 sm:w-34 bg-[#9D174D] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
                  التاريخ 📅
                </div>
                <div className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                  <span className="text-[11px] sm:text-sm font-bold text-neutral-800 font-mono tabular-nums">
                    {session.date}
                  </span>
                  <span className="inline-block px-2 sm:px-3 py-0.2 sm:py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-[#10B981] text-white shadow-xs">
                    {formattedFullDate} - {dayName}
                  </span>
                </div>
              </div>

              {/* Row 3: Session Number */}
              <div className="flex items-stretch rounded-xl sm:rounded-2xl border sm:border-2 border-[#E2B874] overflow-hidden bg-white shadow-xs">
                <div className="w-24 sm:w-34 bg-[#9D174D] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
                  رقم الحصة 🔢
                </div>
                <div className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold text-neutral-800 flex items-center justify-center font-mono tabular-nums">
                  {sessionNumber}
                </div>
              </div>

              {/* Row 4: Duration */}
              <div className="flex items-stretch rounded-xl sm:rounded-2xl border sm:border-2 border-[#E2B874] overflow-hidden bg-white shadow-xs">
                <div className="w-24 sm:w-34 bg-[#9D174D] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
                  وقت الحصة ⏱️
                </div>
                <div className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold text-neutral-800 flex items-center justify-center">
                  {session.duration} دقيقة
                </div>
              </div>

              {/* Row 5: New Memorization */}
              <div className="flex items-stretch rounded-xl sm:rounded-2xl border sm:border-2 border-[#E2B874] overflow-hidden bg-white shadow-xs">
                <div className="w-24 sm:w-34 bg-[#9D174D] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
                  الجديد 📖
                </div>
                <div className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold text-neutral-800 flex items-center justify-center text-center">
                  {newMem || "مراجعة"}
                </div>
              </div>

              {/* Row 6: Revision */}
              <div className="flex items-stretch rounded-xl sm:rounded-2xl border sm:border-2 border-[#E2B874] overflow-hidden bg-white shadow-xs">
                <div className="w-24 sm:w-34 bg-[#9D174D] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
                  المراجعة 🔄
                </div>
                <div className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold text-neutral-800 flex items-center justify-center text-center">
                  {rev || "-"}
                </div>
              </div>

              {/* Row 7: Rating */}
              <div className="flex items-stretch rounded-xl sm:rounded-2xl border sm:border-2 border-[#E2B874] overflow-hidden bg-white shadow-xs">
                <div className="w-24 sm:w-34 bg-[#9D174D] text-white font-bold text-[11px] sm:text-sm flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
                  التقدير ⭐
                </div>
                <div className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold flex items-center justify-center text-center ${session.rating === "يحتاج تمكين ومراجعة" ? "text-rose-600" : "text-emerald-700"}`}>
                  {session.rating || "ممتاز"}
                </div>
              </div>

              {/* Row 8: 5 Daily Prayers Tracker */}
              <div className="rounded-xl sm:rounded-2xl border sm:border-2 border-[#E2B874] overflow-hidden bg-white shadow-xs">
                <div className="bg-[#9D174D] text-white font-bold text-[10px] sm:text-xs py-1 sm:py-1.5 text-center">
                  🕌 متابعة الصلوات الخمس
                </div>
                <div className="grid grid-cols-5 py-1.5 sm:py-2 px-1 text-center">
                  {/* 1: الفجر */}
                  <div className="border-l border-[#F3E8D6]">
                    <div className="text-[10px] sm:text-xs font-semibold text-neutral-700 flex items-center justify-center gap-0.5">
                      <span>🌅</span>
                      <span>الفجر</span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 font-bold text-xs sm:text-sm">
                      {Number(session.prayed_fajr) === 1 || session.prayed_fajr === true ? <span className="text-emerald-500">✔</span> : <span className="text-neutral-400">—</span>}
                    </div>
                  </div>

                  {/* 2: الظهر */}
                  <div className="border-l border-[#F3E8D6]">
                    <div className="text-[10px] sm:text-xs font-semibold text-neutral-700 flex items-center justify-center gap-0.5">
                      <span>☀️</span>
                      <span>الظهر</span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 font-bold text-xs sm:text-sm">
                      {Number(session.prayed_dhuhr) === 1 || session.prayed_dhuhr === true ? <span className="text-emerald-500">✔</span> : <span className="text-neutral-400">—</span>}
                    </div>
                  </div>

                  {/* 3: العصر */}
                  <div className="border-l border-[#F3E8D6]">
                    <div className="text-[10px] sm:text-xs font-semibold text-neutral-700 flex items-center justify-center gap-0.5">
                      <span>🌤️</span>
                      <span>العصر</span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 font-bold text-xs sm:text-sm">
                      {Number(session.prayed_asr) === 1 || session.prayed_asr === true ? <span className="text-emerald-500">✔</span> : <span className="text-neutral-400">—</span>}
                    </div>
                  </div>

                  {/* 4: المغرب */}
                  <div className="border-l border-[#F3E8D6]">
                    <div className="text-[10px] sm:text-xs font-semibold text-neutral-700 flex items-center justify-center gap-0.5">
                      <span>🌇</span>
                      <span>المغرب</span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 font-bold text-xs sm:text-sm">
                      {Number(session.prayed_maghrib) === 1 || session.prayed_maghrib === true ? <span className="text-emerald-500">✔</span> : <span className="text-neutral-400">—</span>}
                    </div>
                  </div>

                  {/* 5: العشاء */}
                  <div>
                    <div className="text-[10px] sm:text-xs font-semibold text-neutral-700 flex items-center justify-center gap-0.5">
                      <span>🌙</span>
                      <span>العشاء</span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 font-bold text-xs sm:text-sm">
                      {Number(session.prayed_isha) === 1 || session.prayed_isha === true ? <span className="text-emerald-500">✔</span> : <span className="text-neutral-400">—</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 9: Educational & Teacher Notes */}
              <div className="rounded-xl sm:rounded-2xl border sm:border-2 border-dashed border-[#9D174D] p-2.5 sm:p-4.5 bg-white space-y-1.5 sm:space-y-3 shadow-xs">
                <div className="text-xs sm:text-base font-black text-[#9D174D] flex items-center gap-1 sm:gap-1.5">
                  <span>🕊️</span>
                  <span>الجانب التربوي</span>
                </div>

                <div className="text-[10px] sm:text-sm space-y-1 sm:space-y-2 text-neutral-800 pt-0.5">
                  {/* 1) موضوع اليوم */}
                  <div className="flex items-start gap-1 sm:gap-1.5 leading-relaxed">
                    <span className="font-extrabold text-[#1E1B4B] shrink-0 text-[10px] sm:text-sm">📌 موضوع اليوم:</span>
                    <span className="text-neutral-900 font-semibold text-[10px] sm:text-sm">{todayTopicText}</span>
                  </div>

                  {/* 2) ملاحظة المعلم */}
                  <div className="flex items-start gap-1 sm:gap-1.5 leading-relaxed">
                    <span className="font-extrabold text-[#1E1B4B] shrink-0 text-[10px] sm:text-sm">📝 ملاحظة المعلم:</span>
                    <span className="text-neutral-700 font-medium text-[10px] sm:text-sm">{teacherNoteText}</span>
                  </div>

                  {/* 3) المطلوب للقاء القادم */}
                  <div className="flex items-start gap-1 sm:gap-1.5 leading-relaxed">
                    <span className="font-extrabold text-[#1E1B4B] shrink-0 text-[10px] sm:text-sm">🎯 المطلوب للقاء القادم:</span>
                    <span className="text-emerald-700 font-bold text-[10px] sm:text-sm">{nextSessionRequiredText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Greeting */}
            <div className="text-center text-[10px] sm:text-xs font-bold text-[#9D174D] mt-2 sm:mt-3 space-y-0.5">
              <p>💖 نسأل الله أن يبارك في ولدكم ويجعله من حفظة</p>
              <p>كتابه الكريم 🌿</p>
            </div>
          </div>

          {/* Action Bar for Card */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-1 w-full">
            <button
              type="button"
              onClick={handleCopyImageToClipboard}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              {copiedImage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">تم نسخ الصورة للحافظة!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-400" />
                  <span>نسخ الصورة للحافظة</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-neutral-400" />
              <span>تحميل الصورة (PNG)</span>
            </button>
          </div>

        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div className="bg-emerald-950/90 border-t border-b border-emerald-800/80 px-4 py-3 flex items-center justify-between text-xs sm:text-sm text-emerald-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-4 py-3 sm:py-3.5 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-mono">
            <span>إرسال لشات ولي الأمر:</span>
            <span className="text-emerald-400 font-bold dir-ltr">+{cleanPhone}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeWhatsAppReport}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors duration-150 cursor-pointer"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-md disabled:opacity-60"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isExporting ? "جارٍ الفتح والتجهيز..." : "إرسال صورة التقرير لشات ولي الأمر"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { WhatsAppReportModal };