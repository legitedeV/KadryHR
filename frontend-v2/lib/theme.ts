export type Theme = "light" | "dark";
export type ThemeSetting = Theme | "system";

export const THEME_STORAGE_KEY = "kadryhr-theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

type ClassListLike = Pick<DOMTokenList, "add" | "remove">;
type DocumentLike = Pick<Document, "documentElement">;
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type MatchMediaLike = (query: string) => MediaQueryList | null;

type ElementWithClassList = { classList: ClassListLike } & Partial<HTMLElement>;

type ThemeTargets = {
  root: ElementWithClassList | null;
  body: ElementWithClassList | null;
};

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
  const doc =
    targetDocument ?? (typeof document !== "undefined" ? document : null);

  if (!doc) return;

  const targets: ThemeTargets = {
    root: (doc as Document).documentElement as ElementWithClassList | null,
    body: (doc as Document).body as ElementWithClassList | null,
  };

  (Object.values(targets) as Array<ElementWithClassList | null>).forEach(
    (element) => {
      if (!element) return;
      element.classList.remove("light");
      element.classList.remove("dark");
      element.classList.add(theme);
      if ("style" in element && element.style) {
        element.style.colorScheme = theme === "dark" ? "dark" : "light";
      }
    },
  );
}
