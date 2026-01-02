export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const STORAGE_KEY = "kadryhr_auth_tokens";

export function saveAuthTokens(tokens: AuthTokens) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function getAuthTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthTokens>;
    if (parsed.accessToken && parsed.refreshToken) {
      return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
    }
    return null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getAuthTokens()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getAuthTokens()?.refreshToken ?? null;
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
