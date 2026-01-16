"use client";

import { BrandLogoStatic, BrandLogoProps } from "@/components/brand/BrandLogoStatic";

type BrandLogoMotionProps = BrandLogoProps & {
  enableHover?: boolean;
};

function buildClassName(base: string, extra?: string) {
  return [base, extra].filter(Boolean).join(" ");
}

export function BrandLogoMotion({ className, enableHover = true, ...props }: BrandLogoMotionProps) {
  return (
    <BrandLogoStatic
      {...props}
      className={buildClassName(
        `brand-logo--motion${enableHover ? " brand-logo--hover" : ""}`,
        className,
      )}
    />
  );
}

export type { BrandLogoMotionProps };
