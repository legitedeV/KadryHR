import Link from "next/link";
import { ReactNode } from "react";
import { BrandLogoStatic } from "@/components/brand/BrandLogoStatic";

type LogoVariant = "full" | "compact" | "icon";
type LogoSize = "xs" | "sm" | "md" | "lg";

type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  showTagline?: boolean;
  className?: string;
  asLink?: string;
  align?: "row" | "column";
  alt?: string;
  label?: string;
};

const baseDimensions: Record<LogoVariant, { width: number; height: number }> = {
  full: { width: 420, height: 140 },
  compact: { width: 320, height: 120 },
  icon: { width: 160, height: 160 },
};

const sizeScale: Record<LogoSize, number> = {
  xs: 0.25,
  sm: 0.6,
  md: 0.8,
  lg: 1,
};

function composeClassName(base: string, extra?: string) {
  return [base, extra].filter(Boolean).join(" ");
}

export function Logo({
  variant = "full",
  size = "md",
  showTagline = false,
  className,
  asLink,
  align = "row",
  alt,
  label,
}: LogoProps) {
  const dimensions = baseDimensions[variant];
  const scale = sizeScale[size];
  const height = Math.round(dimensions.height * scale);
  const altText = alt ?? (showTagline ? "KadryHR – Kadry i płace bez tajemnic" : "KadryHR");
  const logoVariant = variant === "icon" ? "icon" : "full";
  const withPL = variant !== "compact";
  const content: ReactNode = (
    <div
      className={composeClassName(
        `flex ${align === "column" ? "flex-col items-start" : "items-center"} gap-2`,
        className,
      )}
      aria-label={label}
    >
      <div className="relative">
        <BrandLogoStatic
          size={height}
          variant={logoVariant}
          withPL={withPL}
          ariaLabel={altText}
          className="select-none"
        />
      </div>
      {showTagline ? (
        <p className="text-xs font-medium text-surface-300 leading-tight">
          Kadry i płace bez tajemnic
        </p>
      ) : null}
    </div>
  );

  if (asLink) {
    return (
      <Link
        href={asLink}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export function LogoMark({ size = "md", className, asLink, alt = "KadryHR", ariaLabel }: { size?: LogoSize; className?: string; asLink?: string; alt?: string; ariaLabel?: string }) {
  const mark = (
    <Logo
      variant="icon"
      size={size}
      className={className}
      alt={alt}
      label={ariaLabel}
      align="row"
    />
  );

  if (asLink) {
    return (
      <Link
        href={asLink}
        aria-label={ariaLabel ?? alt}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900"
      >
        {mark}
      </Link>
    );
  }

  return mark;
}
