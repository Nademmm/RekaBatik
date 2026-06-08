interface BatikBackgroundProps {
  className?: string;
  opacity?: number;
  patternType?: "parang" | "kawung" | "floral" | "mega";
}

export function BatikBackground({
  className = "",
  opacity = 0.06,
  patternType = "kawung",
}: BatikBackgroundProps) {
  const patternId = `batik-${patternType}-${Math.random().toString(36).substr(2, 9)}`;

  const renderPattern = () => {
    switch (patternType) {
      case "parang":
        return (
          <pattern id={patternId} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect fill="transparent" width="80" height="80" />
            {/* Parang diagonal motif */}
            <path d="M0,40 Q10,30 20,40 Q30,50 40,40 Q50,30 60,40 Q70,50 80,40" stroke="#7C3D12" strokeWidth="2.5" fill="none" />
            <path d="M0,60 Q10,50 20,60 Q30,70 40,60 Q50,50 60,60 Q70,70 80,60" stroke="#C9960C" strokeWidth="1.5" fill="none" />
            <path d="M0,20 Q10,10 20,20 Q30,30 40,20 Q50,10 60,20 Q70,30 80,20" stroke="#7C3D12" strokeWidth="1.5" fill="none" />
            <path d="M10,0 Q20,10 30,0 M50,0 Q60,10 70,0" stroke="#C9960C" strokeWidth="1" fill="none" />
            <circle cx="20" cy="40" r="2" fill="#7C3D12" />
            <circle cx="60" cy="40" r="2" fill="#C9960C" />
          </pattern>
        );
      case "floral":
        return (
          <pattern id={patternId} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect fill="transparent" width="100" height="100" />
            {/* Central flower */}
            <circle cx="50" cy="50" r="5" fill="#C9960C" />
            <ellipse cx="50" cy="35" rx="5" ry="9" fill="#7C3D12" />
            <ellipse cx="50" cy="65" rx="5" ry="9" fill="#7C3D12" />
            <ellipse cx="35" cy="50" rx="9" ry="5" fill="#7C3D12" />
            <ellipse cx="65" cy="50" rx="9" ry="5" fill="#7C3D12" />
            <ellipse cx="40" cy="40" rx="4" ry="8" fill="#C9960C" opacity="0.7" transform="rotate(45 40 40)" />
            <ellipse cx="60" cy="40" rx="4" ry="8" fill="#C9960C" opacity="0.7" transform="rotate(-45 60 40)" />
            <ellipse cx="40" cy="60" rx="4" ry="8" fill="#C9960C" opacity="0.7" transform="rotate(-45 40 60)" />
            <ellipse cx="60" cy="60" rx="4" ry="8" fill="#C9960C" opacity="0.7" transform="rotate(45 60 60)" />
            {/* Corner dots */}
            <circle cx="0" cy="0" r="2" fill="#7C3D12" />
            <circle cx="100" cy="0" r="2" fill="#7C3D12" />
            <circle cx="0" cy="100" r="2" fill="#7C3D12" />
            <circle cx="100" cy="100" r="2" fill="#7C3D12" />
          </pattern>
        );
      case "mega":
        return (
          <pattern id={patternId} x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
            <rect fill="transparent" width="120" height="60" />
            <path d="M0,30 Q15,10 30,30 Q45,50 60,30 Q75,10 90,30 Q105,50 120,30" stroke="#7C3D12" strokeWidth="3" fill="none" />
            <path d="M0,30 Q15,10 30,30 Q45,50 60,30 Q75,10 90,30 Q105,50 120,30" stroke="#C9960C" strokeWidth="1.5" fill="none" transform="translate(0,-8)" />
            <path d="M0,30 Q15,10 30,30 Q45,50 60,30 Q75,10 90,30 Q105,50 120,30" stroke="#7C3D12" strokeWidth="1" fill="none" transform="translate(0,-16)" opacity="0.5" />
            <path d="M0,30 Q15,10 30,30 Q45,50 60,30 Q75,10 90,30 Q105,50 120,30" stroke="#C9960C" strokeWidth="1.5" fill="none" transform="translate(0,8)" />
            <path d="M0,30 Q15,10 30,30 Q45,50 60,30 Q75,10 90,30 Q105,50 120,30" stroke="#7C3D12" strokeWidth="1" fill="none" transform="translate(0,16)" opacity="0.5" />
          </pattern>
        );
      default: // kawung
        return (
          <pattern id={patternId} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect fill="transparent" width="60" height="60" />
            {/* Kawung - four-petal motif */}
            <ellipse cx="30" cy="18" rx="8" ry="13" fill="none" stroke="#7C3D12" strokeWidth="1.5" />
            <ellipse cx="30" cy="42" rx="8" ry="13" fill="none" stroke="#7C3D12" strokeWidth="1.5" />
            <ellipse cx="18" cy="30" rx="13" ry="8" fill="none" stroke="#7C3D12" strokeWidth="1.5" />
            <ellipse cx="42" cy="30" rx="13" ry="8" fill="none" stroke="#7C3D12" strokeWidth="1.5" />
            <circle cx="30" cy="30" r="4" fill="none" stroke="#C9960C" strokeWidth="1.5" />
            <circle cx="30" cy="30" r="1.5" fill="#C9960C" />
            {/* Corner kawung halves */}
            <ellipse cx="0" cy="0" rx="8" ry="13" fill="none" stroke="#C9960C" strokeWidth="1" opacity="0.6" />
            <ellipse cx="60" cy="0" rx="8" ry="13" fill="none" stroke="#C9960C" strokeWidth="1" opacity="0.6" />
            <ellipse cx="0" cy="60" rx="8" ry="13" fill="none" stroke="#C9960C" strokeWidth="1" opacity="0.6" />
            <ellipse cx="60" cy="60" rx="8" ry="13" fill="none" stroke="#C9960C" strokeWidth="1" opacity="0.6" />
          </pattern>
        );
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} style={{ opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>{renderPattern()}</defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

export function BatikDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative h-16 overflow-hidden ${className}`}>
      <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <pattern id="divider-pattern" x="0" y="0" width="48" height="32" patternUnits="userSpaceOnUse">
            <path d="M0,16 Q6,8 12,16 Q18,24 24,16 Q30,8 36,16 Q42,24 48,16" stroke="#C9960C" strokeWidth="1.5" fill="none" opacity="0.6" />
            <circle cx="12" cy="16" r="2" fill="#7C3D12" opacity="0.5" />
            <circle cx="36" cy="16" r="2" fill="#7C3D12" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="1440" height="64" fill="url(#divider-pattern)" />
      </svg>
    </div>
  );
}
