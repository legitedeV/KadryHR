import { appConfig } from "./config";

type AuthContext = {
  token?: string;
  orgId?: string;
};

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
};

export type ApiError = Error & { status?: number; payload?: unknown };

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = appConfig.apiUrl;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const baseWithoutTrailing = base.endsWith("/") ? base.slice(0, -1) : base;
  const joined = `${baseWithoutTrailing}/${normalizedPath}`;

  if (!query) {
    return joined.startsWith("http") ? joined : ensureLeadingSlash(joined);
  }

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  const urlWithQuery = queryString ? `${joined}?${queryString}` : joined;

  return urlWithQuery.startsWith("http") ? urlWithQuery : ensureLeadingSlash(urlWithQuery);
}

function ensureLeadingSlash(value: string) {
  return value.startsWith("/") ? value : `/${value}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => undefined) : await response.text();

  if (!response.ok) {
    const error: ApiError = new Error(
      (payload as { message?: string })?.message || `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as T;
}

export function createApiClient(getAuth: () => AuthContext) {
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { token, orgId } = getAuth();
    const url = buildUrl(path, options.query);

    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");

    if (!options.skipAuth && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (orgId && !headers.has("X-Org-Id")) {
      headers.set("X-Org-Id", orgId);
    }

    const body = options.body ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined;

    if (options.body && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
      body,
      mode: "cors",
      cache: "no-cache",
    });

    return parseResponse<T>(response);
  }

  return {
    request,
    get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "POST", body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PUT", body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>(path, { ...options, method: "PATCH", body }),
    delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
