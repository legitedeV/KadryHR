"use client";

import { Avatar, type AvatarSize } from "@/components/Avatar";
import type { EmployeeRecord } from "@/lib/api";

const formatEmployeeName = (
  employee?: Pick<EmployeeRecord, "firstName" | "lastName" | "email"> | null,
  nameOverride?: string,
) => {
  if (nameOverride) return nameOverride;
  const first = employee?.firstName?.trim() ?? "";
  const last = employee?.lastName?.trim() ?? "";
  const fullName = `${first} ${last}`.trim();
  return fullName || employee?.email?.trim() || "Pracownik";
};

const buildAvatarSrc = (src?: string | null, updatedAt?: string | null) => {
  if (!src || !updatedAt) return src ?? undefined;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${encodeURIComponent(updatedAt)}`;
};

type EmployeeInlineProps = {
  employee?: Pick<
    EmployeeRecord,
    "firstName" | "lastName" | "email" | "avatarUrl" | "avatarUpdatedAt"
  > | null;
  name?: string;
  subtitle?: string | null;
  size?: AvatarSize;
  className?: string;
  nameClassName?: string;
  subtitleClassName?: string;
};

export function EmployeeInline({
  employee,
  name,
  subtitle,
  size = "sm",
  className = "",
  nameClassName,
  subtitleClassName,
}: EmployeeInlineProps) {
  const displayName = formatEmployeeName(employee, name);
  const avatarSrc = buildAvatarSrc(employee?.avatarUrl ?? null, employee?.avatarUpdatedAt ?? null);

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <Avatar name={displayName} src={avatarSrc} size={size} />
      <div className="min-w-0">
        <span
          className={`block truncate text-sm font-semibold text-surface-800 ${nameClassName ?? ""}`}
        >
          {displayName}
        </span>
        {subtitle ? (
          <span
            className={`block truncate text-xs text-surface-500 ${subtitleClassName ?? ""}`}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
