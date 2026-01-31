"use client";

import { useMemo, useState } from "react";

const COLOR_CLASSES = [
  "bg-brand-100 text-brand-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-lime-100 text-lime-800",
  "bg-green-100 text-green-800",
  "bg-rose-100 text-rose-800",
  "bg-orange-100 text-orange-800",
  "bg-accent-100 text-accent-800",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsFromName(name?: string) {
  if (!name) return "";
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export type AvatarSize = "sm" | "md";

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const [errorSrc, setErrorSrc] = useState<string | null>(null);
  const initials = useMemo(() => initialsFromName(name) || "?", [name]);
  const paletteClass = useMemo(() => {
    const hash = hashString(name || initials);
    return COLOR_CLASSES[hash % COLOR_CLASSES.length]!;
  }, [initials, name]);

  const dimensionClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const shouldShowImage = Boolean(src) && src !== errorSrc;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        shouldShowImage ? "bg-transparent" : paletteClass
      } ${dimensionClass} ${className}`}
      aria-label={name}
    >
      {shouldShowImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? undefined}
          alt={name}
          className="h-full w-full object-cover object-center"
          onError={() => setErrorSrc(src ?? null)}
        />
      ) : (
        <span className="font-semibold">{initials}</span>
      )}
    </span>
  );
}

export function buildAvatarFallback(name: string) {
  return {
    initials: initialsFromName(name) || "?",
    colorClass: COLOR_CLASSES[hashString(name) % COLOR_CLASSES.length]!,
  };
}
