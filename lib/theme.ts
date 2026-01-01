export type Theme = "light" | "dark";
export type ThemeSetting = Theme | "system";

export const THEME_STORAGE_KEY = "kadryhr-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

type ClassListLike = Pick<DOMTokenList, "add" | "remove">;
type DocumentLike = Pick<Document, "documentElement">;
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type MatchMediaLike = (query: string) => MediaQueryList | null;

export function getStoredTheme(storage?: StorageLike | null): ThemeSetting {
  if (!storage) return "system";
  const stored = storage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function persistThemeSetting(
  setting: ThemeSetting,
  storage?: StorageLike | null,
) {
  if (!storage) return;
  if (setting === "system") {
    storage.removeItem(THEME_STORAGE_KEY);
    return;
  }
  storage.setItem(THEME_STORAGE_KEY, setting);
}

export function getSystemTheme(matchMedia?: MatchMediaLike): Theme {
  if (!matchMedia) return "light";
  const query = matchMedia(DARK_QUERY);
  return query?.matches ? "dark" : "light";
}

export function resolveActiveTheme(
  setting: ThemeSetting,
  systemTheme: Theme,
): Theme {
  return setting === "system" ? systemTheme : setting;
}

export function applyThemeClass(
  theme: Theme,
  targetDocument?: DocumentLike | null,
) {
  const root =
    targetDocument?.documentElement ??
    (typeof document !== "undefined" ? document.documentElement : null);

  if (!root) return;

  const classList: ClassListLike = root.classList;
  classList.remove("light");
  classList.remove("dark");
  classList.add(theme);

  if ("style" in root && (root as HTMLElement).style) {
    (root as HTMLElement).style.colorScheme = theme === "dark" ? "dark" : "light";
  }
}
