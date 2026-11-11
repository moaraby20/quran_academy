import { useState, useEffect } from "react";
import { useUpdateSessionMutation } from "../../rtk/slices/apiSlice";
import { X, Save, Loader2 } from "lucide-react";

export const EditSessionModal = ({ isOpen, onClose, sessionToEdit }) => {
    const [updateSessionMut, { isLoading }] = useUpdateSessionMutation();

    const [date, setDate] = useState("");
    const [duration, setDuration] = useState(45);
    const [rating, setRating] = useState("ممتاز");
    const [topic, setTopic] = useState("");
    const [newMemorization, setNewMemorization] = useState("");
    const [revision, setRevision] = useState("");
    const [tajweedNotes, setTajweedNotes] = useState("");
    const [homework, setHomework] = useState("");
    const [prayers, setPrayers] = useState({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });

    useEffect(() => {
        if (sessionToEdit) {
            setDate(sessionToEdit.date || "");
            setDuration(sessionToEdit.duration || 45);
            setRating(sessionToEdit.rating || "ممتاز");
            setTopic(sessionToEdit.topic || "");
            setNewMemorization(sessionToEdit.newMemorization || sessionToEdit.new_memorization || "");
            setRevision(sessionToEdit.revision || "");
            setTajweedNotes(sessionToEdit.tajweedNotes || sessionToEdit.tajweed_notes || "");
            setHomework(sessionToEdit.homework || "");
            setPrayers({
                fajr: sessionToEdit.prayed_fajr == 1,
                dhuhr: sessionToEdit.prayed_dhuhr == 1,
                asr: sessionToEdit.prayed_asr == 1,
                maghrib: sessionToEdit.prayed_maghrib == 1,
                isha: sessionToEdit.prayed_isha == 1
            });
        }
    }, [sessionToEdit]);

    if (!isOpen || !sessionToEdit) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMemorization.trim()) {
            alert("حقل المحفوظ الجديد مطلوب.");
            return;
        }

        try {
            await updateSessionMut({
                id: sessionToEdit.id,
                data: {
                    date,
                    duration,
                    rating,
                    topic,
                    new_memorization: newMemorization,
                    revision,
                    tajweed_notes: tajweedNotes,
                    homework,
                    prayed_fajr: prayers.fajr ? 1 : 0,
                    prayed_dhuhr: prayers.dhuhr ? 1 : 0,
                    prayed_asr: prayers.asr ? 1 : 0,
                    prayed_maghrib: prayers.maghrib ? 1 : 0,
                    prayed_isha: prayers.isha ? 1 : 0
                }
            }).unwrap();
            onClose();
        } catch (err) {
            console.error("Failed to update session:", err);
            alert(err?.data?.message || "حدث خطأ أثناء حفظ التعديلات.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div
                className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950">
                    <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                        <span>تعديل تقرير الحصة</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 font-mono">
                            الطالب: {sessionToEdit.student_name || "المحدد"}
                        </span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="overflow-y-auto p-5">
                    <form id="edit-session-form" onSubmit={handleSubmit} className="space-y-4">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">التاريخ</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono transition-colors outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">المدة (دقائق)</label>
                                <div className="flex gap-2">
                                    {[30, 45, 60].map((dur) => (
                                        <button
                                            key={dur}
                                            type="button"
                                            onClick={() => setDuration(dur)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${duration === dur ? "bg-neutral-800 text-white border border-neutral-700" : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700"}`}
                                        >
                                            {dur}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">التقييم</label>
                                <div className="flex gap-2">
                                    {["ممتاز", "جيد جداً", "جيد", "يحتاج تمكين ومراجعة"].map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setRating(opt)}
                                            className={`flex-1 py-2 px-1 text-[10px] rounded-lg transition-colors cursor-pointer ${rating === opt ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60" : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-neutral-700"}`}
                                        >
                                            {opt === "يحتاج تمكين ومراجعة" ? "يحتاج مراجعة" : opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">الصلوات الخمس</label>
                                <div className="flex justify-between gap-1 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800">
                                    {[
                                        { id: "fajr", label: "الفجر" },
                                        { id: "dhuhr", label: "الظهر" },
                                        { id: "asr", label: "العصر" },
                                        { id: "maghrib", label: "المغرب" },
                                        { id: "isha", label: "العشاء" }
                                    ].map((p) => (
                                        <button
                                            type="button"
                                            key={p.id}
                                            onClick={() => setPrayers(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                            className={`flex-1 py-1 text-[10px] rounded-md transition-colors cursor-pointer flex flex-col items-center gap-0.5 ${prayers[p.id] ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60" : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 border border-transparent"}`}
                                        >
                                            <span>{p.label}</span>
                                            <span className="text-[9px]">{prayers[p.id] ? "✅" : "—"}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-neutral-800/60">
                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">موضوع اليوم *</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">المحفوظ الجديد *</label>
                                <input
                                    type="text"
                                    value={newMemorization}
                                    onChange={(e) => setNewMemorization(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">المراجعة</label>
                                <input
                                    type="text"
                                    value={revision}
                                    onChange={(e) => setRevision(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">ملاحظات التجويد</label>
                                <input
                                    type="text"
                                    value={tajweedNotes}
                                    onChange={(e) => setTajweedNotes(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-300 mb-1">المطلوب للقاء القادم</label>
                                <input
                                    type="text"
                                    value={homework}
                                    onChange={(e) => setHomework(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-200 outline-none"
                                />
                            </div>
                        </div>

                    </form>
                </div>

                <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-950 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        form="edit-session-form"
                        disabled={isLoading}
                        className="px-5 py-2 flex items-center gap-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>حفظ التعديلات</span>
                    </button>
                </div>
            </div>
        </div>
    );
};