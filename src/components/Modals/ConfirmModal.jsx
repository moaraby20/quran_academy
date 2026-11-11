import { AlertTriangle, Info, Trash2, RotateCcw, X } from "lucide-react";
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  details,
  confirmText = "\u062A\u0623\u0643\u064A\u062F",
  cancelText = "\u0625\u0644\u063A\u0627\u0621",
  variant = "danger",
  iconType = "warning"
}) => {
  if (!isOpen) return null;
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };
  const getIcon = () => {
    switch (iconType) {
      case "trash":
        return <Trash2 className="w-5 h-5 text-red-400" />;
      case "revert":
        return <RotateCcw className="w-5 h-5 text-amber-400" />;
      case "info":
        return <Info className="w-5 h-5 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };
  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40";
      case "warning":
        return "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40";
      case "primary":
        return "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40";
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
    className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
    onClick={(e) => e.stopPropagation()}
  >
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                {getIcon()}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </div>
            <button
    onClick={onClose}
    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors"
  >
              <X className="w-4 h-4" />
            </button>
          </div>

          {details && details.length > 0 && <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 space-y-1.5 text-xs text-neutral-300">
              {details.map((item, idx) => <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </div>)}
            </div>}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-800">
            <button
    type="button"
    onClick={onClose}
    className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors cursor-pointer"
  >
              {cancelText}
            </button>
            <button
    type="button"
    onClick={handleConfirm}
    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-[0.98] ${getConfirmButtonClasses()}`}
  >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export {
  ConfirmModal
};
