import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

type LogoVariant = "full" | "compact" | "icon";
type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  showTagline?: boolean;
  className?: string;
  asLink?: string;
  align?: "row" | "column";
  priority?: boolean;
  alt?: string;
  label?: string;
};

const assets: Record<LogoVariant, { light: string; dark: string }> = {
  full: {
    light: "/brand/kadryhr-logo-full-light.svg",
    dark: "/brand/kadryhr-logo-full-dark.svg",
  },
  compact: {
    light: "/brand/kadryhr-logo-compact-light.svg",
    dark: "/brand/kadryhr-logo-compact-dark.svg",
  },
  icon: {
    light: "/brand/kadryhr-logo-mark.svg",
    dark: "/brand/kadryhr-logo-mark.svg",
  },
};

const baseDimensions: Record<LogoVariant, { width: number; height: number }> = {
  full: { width: 960, height: 260 },
  compact: { width: 760, height: 200 },
  icon: { width: 240, height: 240 },
};

const sizeScale: Record<LogoSize, number> = {
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
  priority,
  alt,
  label,
}: LogoProps) {
  const asset = assets[variant];
  const dimensions = baseDimensions[variant];
  const scale = sizeScale[size];
  const width = Math.round(dimensions.width * scale);
  const height = Math.round(dimensions.height * scale);
  const altText =
    alt ??
    (variant === "full"
      ? "KadryHR – Kadry i płace bez tajemnic"
      : "KadryHR");
  const content: ReactNode = (
    <div
      className={composeClassName(
        `flex ${align === "column" ? "flex-col items-start" : "items-center"} gap-2`,
        className,
      )}
      aria-label={label}
    >
      <div className="relative">
        <picture>
          <source media="(prefers-color-scheme: dark)" srcSet={asset.dark} />
          <Image
            src={asset.light}
            alt={altText}
            width={width}
            height={height}
            priority={priority}
            className="block h-auto w-auto select-none"
          />
        </picture>
      </div>
      {showTagline ? (
        <p className="text-xs font-medium text-surface-600 dark:text-surface-300 leading-tight">
          Kadry i płace bez tajemnic
        </p>
      ) : null}
    </div>
  );

  if (asLink) {
    return (
      <Link
        href={asLink}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-900"
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
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-900"
      >
        {mark}
      </Link>
    );
  }

  return mark;
}
