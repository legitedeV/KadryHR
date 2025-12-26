export type AppConfig = {
  apiUrl: string;
  webUrl: string;
  clientUrl: string;
};

function normalizeUrl(value?: string) {
  if (!value) return undefined;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const apiUrl =
  normalizeUrl(process.env.NEXT_PUBLIC_API_URL) ||
  normalizeUrl(process.env.API_URL) ||
  "http://localhost:3002/v2";

const webUrl =
  normalizeUrl(process.env.NEXT_PUBLIC_WEB_URL) ||
  normalizeUrl(process.env.WEB_URL) ||
  "http://localhost:3001";

const clientUrl =
  normalizeUrl(process.env.NEXT_PUBLIC_CLIENT_URL) ||
  normalizeUrl(process.env.CLIENT_URL) ||
  webUrl;

export const appConfig: AppConfig = {
  apiUrl,
  webUrl,
  clientUrl,
};
