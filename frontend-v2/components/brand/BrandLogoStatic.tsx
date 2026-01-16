import { useId } from "react";
import { brandLogoTokens } from "@/src/styles/brand";

type BrandLogoVariant = "full" | "icon";

type BrandLogoProps = {
  size?: number;
  variant?: BrandLogoVariant;
  withPL?: boolean;
  className?: string;
  ariaLabel?: string;
};

const fullViewBox = "0 0 320 96";
const iconViewBox = "0 0 72 72";

const sizeRatio: Record<BrandLogoVariant, number> = {
  full: 320 / 96,
  icon: 1,
};

function buildClassName(base: string, extra?: string) {
  return [base, extra].filter(Boolean).join(" ");
}

function WordmarkText({
  x,
  y,
  withPL,
  wordmarkGradientId,
  fillOverride,
}: {
  x: number;
  y: number;
  withPL: boolean;
  wordmarkGradientId: string;
  fillOverride?: string;
}) {
  const primaryFill = fillOverride ?? brandLogoTokens.wordmarkPrimary;
  const gradientFill = fillOverride ?? `url(#${wordmarkGradientId})`;
  const secondaryFill = fillOverride ?? brandLogoTokens.wordmarkSecondary;
  return (
    <text
      x={x}
      y={y}
      fontFamily="Inter, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
      fontSize={40}
      fontWeight={600}
      letterSpacing="-0.02em"
    >
      <tspan fill={primaryFill}>Kadry</tspan>
      <tspan fill={gradientFill} fontWeight={700}>
        HR
      </tspan>
      {withPL ? (
        <tspan
          dx={6}
          dy={-14}
          fontSize={18}
          fontWeight={600}
          fill={secondaryFill}
        >
          .PL
        </tspan>
      ) : null}
    </text>
  );
}

export function BrandLogoStatic({
  size = 40,
  variant = "full",
  withPL = true,
  className,
  ariaLabel = "KadryHR",
}: BrandLogoProps) {
  const id = useId();
  const iconGradientId = `brand-icon-gradient-${id}`;
  const wordmarkGradientId = `brand-wordmark-gradient-${id}`;
  const glowFilterId = `brand-glow-${id}`;
  const wordmarkMaskId = `brand-wordmark-mask-${id}`;
  const shineGradientId = `brand-shine-${id}`;

  const height = size;
  const width = Math.round(size * sizeRatio[variant]);

  if (variant === "icon") {
    return (
      <span
        role="img"
        aria-label={ariaLabel}
        className={buildClassName("brand-logo", className)}
        style={{ height, width }}
      >
        <svg
          viewBox={iconViewBox}
          width={width}
          height={height}
          aria-hidden
          className="brand-logo__svg"
        >
          <defs>
            <linearGradient id={iconGradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={brandLogoTokens.iconGradient[0]} />
              <stop offset="52%" stopColor={brandLogoTokens.iconGradient[1]} />
              <stop offset="100%" stopColor={brandLogoTokens.iconGradient[2]} />
            </linearGradient>
            <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g className="brand-logo__icon">
            <rect x="2" y="2" width="68" height="68" rx="20" fill={`url(#${iconGradientId})`} />
            <rect
              x="8"
              y="8"
              width="56"
              height="56"
              rx="18"
              fill="rgba(4, 12, 9, 0.25)"
            />
            <g fill={brandLogoTokens.iconFill}>
              <circle cx="36" cy="26" r="8" />
              <circle cx="22" cy="30" r="6" fill={brandLogoTokens.iconFillMuted} />
              <circle cx="50" cy="30" r="6" fill={brandLogoTokens.iconFillMuted} />
              <path d="M20 54c2.5-8 9-12 16-12s13.5 4 16 12v6H20v-6z" />
              <path d="M10 54c2-6 6-9 12-9 2.5 0 4.5.4 6.5 1.3-3.8 2-6.6 5-8.5 9H10z" fill={brandLogoTokens.iconFillMuted} />
              <path d="M50 46.3c2-1 4.1-1.3 6.5-1.3 6 0 10 3 12 9H52c-1.8-4-4.6-7-8.5-9z" fill={brandLogoTokens.iconFillMuted} />
            </g>
            <rect
              x="2"
              y="2"
              width="68"
              height="68"
              rx="20"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
            />
          </g>
          <g className="brand-logo__glow" filter={`url(#${glowFilterId})`} opacity="0.5">
            <rect x="6" y="6" width="60" height="60" rx="18" fill={brandLogoTokens.glow} />
          </g>
        </svg>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={buildClassName("brand-logo", className)}
      style={{ height, width }}
    >
      <svg
        viewBox={fullViewBox}
        width={width}
        height={height}
        aria-hidden
        className="brand-logo__svg"
      >
        <defs>
          <linearGradient id={iconGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={brandLogoTokens.iconGradient[0]} />
            <stop offset="52%" stopColor={brandLogoTokens.iconGradient[1]} />
            <stop offset="100%" stopColor={brandLogoTokens.iconGradient[2]} />
          </linearGradient>
          <linearGradient id={wordmarkGradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={brandLogoTokens.wordmarkGradient[0]} />
            <stop offset="55%" stopColor={brandLogoTokens.wordmarkGradient[1]} />
            <stop offset="100%" stopColor={brandLogoTokens.wordmarkGradient[2]} />
          </linearGradient>
          <linearGradient id={shineGradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <mask id={wordmarkMaskId}>
            <rect x="0" y="0" width="320" height="96" fill="black" />
            <WordmarkText
              x={96}
              y={60}
              withPL={withPL}
              wordmarkGradientId={wordmarkGradientId}
              fillOverride="white"
            />
          </mask>
        </defs>
        <g className="brand-logo__icon">
          <rect x="8" y="12" width="72" height="72" rx="20" fill={`url(#${iconGradientId})`} />
          <rect
            x="14"
            y="18"
            width="60"
            height="60"
            rx="18"
            fill="rgba(4, 12, 9, 0.22)"
          />
          <g fill={brandLogoTokens.iconFill}>
            <circle cx="44" cy="36" r="9" />
            <circle cx="28" cy="40" r="7" fill={brandLogoTokens.iconFillMuted} />
            <circle cx="60" cy="40" r="7" fill={brandLogoTokens.iconFillMuted} />
            <path d="M24 68c3-9 10.5-14 20-14s17 5 20 14v8H24v-8z" />
            <path d="M10 68c2.5-7 7.5-11 14-11 2.8 0 5 .4 7.2 1.4-4.2 2.2-7.2 5.5-9.2 9.6H10z" fill={brandLogoTokens.iconFillMuted} />
            <path d="M58.8 58.4c2.2-1 4.5-1.4 7.2-1.4 6.5 0 11.5 4 14 11H66c-2-4-5-7.4-9.2-9.6z" fill={brandLogoTokens.iconFillMuted} />
          </g>
          <rect
            x="8"
            y="12"
            width="72"
            height="72"
            rx="20"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
          />
        </g>
        <g className="brand-logo__glow" filter={`url(#${glowFilterId})`} opacity="0.5">
          <rect x="12" y="16" width="64" height="64" rx="18" fill={brandLogoTokens.glow} />
        </g>
        <g className="brand-logo__wordmark">
          <WordmarkText x={96} y={60} withPL={withPL} wordmarkGradientId={wordmarkGradientId} />
          <text
            x={220}
            y={60}
            fontFamily="Inter, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
            fontSize={40}
            fontWeight={700}
            letterSpacing="-0.02em"
            fill={brandLogoTokens.glowStrong}
            className="brand-logo__hr-glow"
          >
            HR
          </text>
        </g>
        <rect
          className="brand-logo__shine"
          x="96"
          y="20"
          width="200"
          height="50"
          fill={`url(#${shineGradientId})`}
          opacity="0.35"
          mask={`url(#${wordmarkMaskId})`}
        />
      </svg>
    </span>
  );
}

export type { BrandLogoProps, BrandLogoVariant };
