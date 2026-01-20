const normalizeUrl = (value: string) => value.replace(/\/$/, "");

export const DEFAULT_LANG = process.env.NEXT_PUBLIC_SITE_LANG ?? "pl";
export const PANEL_APP_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_PANEL_APP_URL ?? "https://panel.kadryhr.pl",
);
