import type { CSSProperties } from "react";

type BrandLogoVariant = "full" | "icon";

type BrandLogoProps = {
  size?: number;
  variant?: BrandLogoVariant;
  withPL?: boolean;
  className?: string;
  ariaLabel?: string;
};

const sizeRatio: Record<BrandLogoVariant, number> = {
  full: 2048 / 1365,
  icon: 1,
};

const logoSrc: Record<BrandLogoVariant, string> = {
  full: "/brand/kadryhr-logo.png",
  icon: "/brand/kadryhr-logo-square.png",
};

function buildClassName(base: string, extra?: string) {
  return [base, extra].filter(Boolean).join(" ");
}

export function BrandLogoStatic({
  size = 40,
  variant = "full",
  withPL = true,
  className,
  ariaLabel = "KadryHR",
}: BrandLogoProps) {
  const height = size;
  const width = Math.round(size * sizeRatio[variant]);
  const style: CSSProperties = { height, width };
  const altText = withPL ? ariaLabel : ariaLabel.replace(".PL", "");

  return (
    <span
      role="img"
      aria-label={altText}
      className={buildClassName("brand-logo", className)}
      style={style}
    >
      <img
        src={logoSrc[variant]}
        alt={altText}
        width={width}
        height={height}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export type { BrandLogoProps, BrandLogoVariant };
