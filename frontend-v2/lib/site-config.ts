const normalizeUrl = (value: string) => value.replace(/\/$/, "");

export const DEFAULT_LANG = process.env.NEXT_PUBLIC_SITE_LANG ?? "pl";
export const APP_URL = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL ?? "https://kadryhr.pl");
export const ADMIN_APP_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "https://admin.kadryhr.pl",
);
export const PANEL_APP_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_PANEL_APP_URL ?? "https://panel.kadryhr.pl",
);
