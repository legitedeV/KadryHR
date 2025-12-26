export type AppConfig = {
  apiUrl: string;
  webUrl: string;
  clientUrl: string;
};

function normalizeUrl(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const withoutTrailingSlash = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
  if (/^https?:\/\//.test(withoutTrailingSlash) || withoutTrailingSlash.startsWith("/")) {
    return withoutTrailingSlash;
  }

  return `/${withoutTrailingSlash}`;
}

function resolveApiUrl() {
  const envUrl =
    normalizeUrl(process.env.NEXT_PUBLIC_API_URL) ||
    normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    normalizeUrl(process.env.API_URL) ||
    normalizeUrl(process.env.API_BASE_URL);

  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
    if (isLocalHost) {
      return "http://localhost:3002/v2";
    }

    const origin = normalizeUrl(window.location.origin) || "";
    return `${origin}/v2`;
  }

  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "development") {
    return "http://localhost:3002/v2";
  }

  return "/v2";
}

function resolveWebUrl() {
  const envWebUrl = normalizeUrl(process.env.NEXT_PUBLIC_WEB_URL) || normalizeUrl(process.env.WEB_URL);

  if (envWebUrl) return envWebUrl;

  if (typeof window !== "undefined") {
    return normalizeUrl(window.location.origin);
  }

  return "http://localhost:3001";
}

const apiUrl = resolveApiUrl();
const webUrl = resolveWebUrl();

const clientUrl = normalizeUrl(process.env.NEXT_PUBLIC_CLIENT_URL) || normalizeUrl(process.env.CLIENT_URL) || webUrl;

export const appConfig: AppConfig = {
  apiUrl,
  webUrl,
  clientUrl,
};
