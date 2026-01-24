import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../utils";

const variants = {
  primary:
    "bg-emerald-600 text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-500",
  secondary:
    "bg-white text-emerald-700 border border-emerald-200 hover:border-emerald-300 hover:text-emerald-800",
  ghost: "text-emerald-700 hover:bg-emerald-50",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3 text-base",
};

export type KadryButtonProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  href?: string;
  icon?: ReactNode;
  children: ReactNode;
} & ComponentProps<"button"> &
  ComponentProps<"a">;

export function KadryButton({
  variant = "primary",
  size = "md",
  href,
  icon,
  className,
  children,
  ...props
}: KadryButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition",
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as ComponentProps<"a">)}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ComponentProps<"button">)}>
      {icon}
      {children}
    </button>
  );
}
