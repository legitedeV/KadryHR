import assert from "node:assert/strict";
import test from "node:test";
import {
  applyThemeClass,
  getStoredTheme,
  getSystemTheme,
  persistThemeSetting,
  resolveActiveTheme,
  THEME_STORAGE_KEY,
  Theme,
  ThemeSetting,
} from "../lib/theme";

type FakeClassList = {
  tokens: Set<string>;
  add: (token: string) => void;
  remove: (token: string) => void;
};

type FakeDocument = {
  documentElement: {
    classList: FakeClassList;
    style: Record<string, string>;
  };
};

function createClassList(tokens?: Iterable<string>): FakeClassList {
  const tokenSet = new Set(tokens ?? []);
  return {
    tokens: tokenSet,
    add: (token: string) => {
      tokenSet.add(token);
    },
    remove: (token: string) => {
      tokenSet.delete(token);
    },
  };
}

function createFakeDocument(initial?: Iterable<string>): FakeDocument {
  return {
    documentElement: {
      classList: createClassList(initial),
      style: {},
    },
  };
}

function createStorage(initial?: Record<string, string>) {
  const state = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => state.get(key) ?? null,
    setItem: (key: string, value: string) => {
      state.set(key, value);
    },
    removeItem: (key: string) => {
      state.delete(key);
    },
  };
}

const createMatchMedia = (prefersDark: boolean) => {
  return (query: string) => ({
    matches: query === "(prefers-color-scheme: dark)" ? prefersDark : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
};

test("resolves active theme based on system preference when storage is empty", () => {
  const storage = createStorage();
  const setting = getStoredTheme(storage as any);
  const systemTheme = getSystemTheme(createMatchMedia(true));
  const resolved = resolveActiveTheme(setting, systemTheme);

  assert.equal(setting, "system");
  assert.equal(systemTheme, "dark");
  assert.equal(resolved, "dark");
});

test("prefers stored theme over system preference", () => {
  const storage = createStorage({ [THEME_STORAGE_KEY]: "light" });
  const setting = getStoredTheme(storage as any);
  const systemTheme = getSystemTheme(createMatchMedia(true));
  const resolved = resolveActiveTheme(setting, systemTheme);

  assert.equal(setting, "light");
  assert.equal(systemTheme, "dark");
  assert.equal(resolved, "light");
});

test("applies theme classes and color scheme to documentElement", () => {
  const doc = createFakeDocument(["dark"]);
  applyThemeClass("light", doc as any);

  assert.deepEqual(Array.from(doc.documentElement.classList.tokens), ["light"]);
  assert.equal(doc.documentElement.style.colorScheme, "light");
});

test("persists theme selection and clears when using system", () => {
  const storage = createStorage();
  persistThemeSetting("dark", storage as any);
  assert.equal(storage.getItem(THEME_STORAGE_KEY), "dark");

  persistThemeSetting("system", storage as any);
  assert.equal(storage.getItem(THEME_STORAGE_KEY), null);
});

test("reacts to system theme changes when using system setting", () => {
  const storage = createStorage();
  const matchMedia = createMatchMedia(false);
  const initialSystem = getSystemTheme(matchMedia);
  const resolved = resolveActiveTheme("system", initialSystem);
  const doc = createFakeDocument(["dark"]);

  applyThemeClass(resolved, doc as any);
  assert.equal(doc.documentElement.style.colorScheme, "light");

  const updatedSystem: Theme = getSystemTheme(createMatchMedia(true));
  const nextResolved = resolveActiveTheme("system", updatedSystem);
  applyThemeClass(nextResolved, doc as any);

  assert.equal(doc.documentElement.style.colorScheme, "dark");
});
