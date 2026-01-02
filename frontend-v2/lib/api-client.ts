import { AuthTokens, clearAuthTokens, getAuthTokens, saveAuthTokens } from "./auth";
import { pushToast } from "./toast";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type RequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
  suppressToast?: boolean;
};

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
    const { auth = true, retry = true, suppressToast = false, ...init } = options;
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

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    });

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
      throw new Error(message ?? response.statusText);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async refreshTokens(options?: { suppressToast?: boolean }) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

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
    try {
      const data = await res.json();
      if (typeof data?.message === "string") return data.message;
      if (Array.isArray(data?.message)) return data.message.join(", ");
      return null;
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
