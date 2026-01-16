import { AuthTokens, clearAuthTokens, getAuthTokens, saveAuthTokens } from "./auth";
import { pushToast } from "./toast";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api";
const DEFAULT_TIMEOUT_MS = 15000;

type RequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
  suppressToast?: boolean;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status?: number;
  kind?: "timeout" | "network";

  constructor(
    message: string,
    options?: { status?: number; kind?: "timeout" | "network" },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status;
    this.kind = options?.kind;
  }
}

class ApiClient {
  private tokens: AuthTokens | null = null;
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      this.tokens = getAuthTokens();
    }
  }

  async refreshSession(options?: { suppressToast?: boolean }) {
    return this.refreshTokens(options);
  }

  hydrateFromStorage() {
    if (typeof window === "undefined") return;
    if (!this.tokens) {
      this.tokens = getAuthTokens();
    }
  }

  setTokens(tokens: AuthTokens | null, persist = true) {
    this.tokens = tokens;
    if (!persist) return;

    if (tokens) {
      saveAuthTokens(tokens);
    } else {
      clearAuthTokens();
    }
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      auth = true,
      retry = true,
      suppressToast = false,
      timeoutMs,
      ...init
    } = options;
    const headers = new Headers(init.headers ?? {});

    if (auth) {
      this.hydrateFromStorage();
      const token = this.tokens?.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
      response = await this.fetchWithTimeout(
        `${this.baseUrl}${path}`,
        {
          ...init,
          headers,
          credentials: init.credentials ?? "include",
        },
        timeoutMs,
      );
    } catch (error) {
      const apiError = this.normalizeNetworkError(error);
      if (!suppressToast) {
        pushToast({
          title: "Błąd sieci",
          description: apiError.message,
          variant: "error",
        });
      }
      throw apiError;
    }

    if (response.status === 401 && auth && retry) {
      const refreshed = await this.refreshTokens({ suppressToast });
      if (refreshed?.tokens) {
        return this.request<T>(path, { ...options, retry: false });
      }
    }

    if (!response.ok) {
      const message = await this.safeErrorMessage(response);
      if (!suppressToast) {
        pushToast({
          title: "Błąd", 
          description: message ?? "Coś poszło nie tak. Spróbuj ponownie.",
          variant: "error",
        });
      }
      throw new ApiError(message ?? response.statusText, {
        status: response.status,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async refreshTokens(options?: { suppressToast?: boolean }) {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
        DEFAULT_TIMEOUT_MS,
      );

      if (!response.ok) {
        this.setTokens(null);
        if (!options?.suppressToast) {
          pushToast({
            title: "Sesja wygasła",
            description: "Zaloguj się ponownie, aby kontynuować.",
            variant: "warning",
          });
        }
        return null;
      }

      const data = await response.json();
      const tokens: AuthTokens = {
        accessToken: data.accessToken,
      };
      this.setTokens(tokens);
      return { tokens, user: data.user };
    } catch {
      this.setTokens(null);
      if (!options?.suppressToast) {
        pushToast({
          title: "Błąd sieci",
          description: "Nie udało się odświeżyć sesji.",
          variant: "error",
        });
      }
      return null;
    }
  }

  private async safeErrorMessage(res: Response): Promise<string | null> {
    const text = await res.text();
    if (!text) return null;
    try {
      const data = JSON.parse(text);
      if (typeof data?.message === "string") return data.message;
      if (Array.isArray(data?.message)) return data.message.join(", ");
      return null;
    } catch {
      return text;
    }
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    if (timeoutMs === undefined || timeoutMs === null) {
      return fetch(url, init);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private normalizeNetworkError(error: unknown) {
    if (error instanceof ApiError) return error;
    if (error instanceof Error && error.name === "AbortError") {
      return new ApiError("Brak połączenia z serwerem.", { kind: "timeout" });
    }
    return new ApiError("Brak połączenia z serwerem.", { kind: "network" });
  }
}

export const apiClient = new ApiClient();
