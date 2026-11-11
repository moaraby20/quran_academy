import { useState } from "react";
import logo from "../assets/logo.jpg";

const OFFICIAL_LOGO_SRC = logo;

const AcademyLogo = ({
  className = "",
  size = 56,
  shape = "circle"
}) => {
  const [hasError, setHasError] = useState(false);
  const shapeClass = shape === "circle" ? "rounded-full" : shape === "square" ? "rounded-none" : "rounded-2xl";
  return <div
    className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-neutral-900 border border-amber-400/40 shadow-sm ${shapeClass} ${className}`}
    style={{ width: size, height: size }}
  >
    {!hasError ? <img
      src={OFFICIAL_LOGO_SRC}
      alt="أكاديمية وسارعوا لتحفيظ القرآن الكريم"
      className="w-full h-full object-cover select-none pointer-events-none"
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      loading="eager"
    /> : <span className="text-xl">📖</span>}
  </div>;
};
export {
  AcademyLogo,
  OFFICIAL_LOGO_SRC
};
