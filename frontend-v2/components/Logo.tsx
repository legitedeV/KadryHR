import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

interface LogoIconProps {
  size?: number;
  className?: string;
}

// Shared SVG icon component
function LogoSvg({ size = 40, className = "", gradientId }: { size?: number; className?: string; gradientId: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill={`url(#${gradientId})`} />
      
      {/* KH text */}
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontSize="40"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        KH
      </text>
    </svg>
  );
}

export function Logo({ size = 40, className = "", showText = true }: LogoProps) {
  const gradientId = React.useId();
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <LogoSvg size={size} gradientId={gradientId} />
      </div>
      {showText && (
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            KadryHR
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Grafik i kadry dla sklepów
          </div>
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ size = 40, className = "" }: LogoIconProps) {
  const gradientId = React.useId();
  
  return <LogoSvg size={size} className={className} gradientId={gradientId} />;
}
