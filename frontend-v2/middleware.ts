import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ADMIN_APP_URL = "https://admin.kadryhr.pl";
const DEFAULT_PANEL_APP_URL = "https://panel.kadryhr.pl";
const DEFAULT_APP_URL = "https://kadryhr.pl";

const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? DEFAULT_ADMIN_APP_URL;
const panelBaseUrl = process.env.NEXT_PUBLIC_PANEL_APP_URL ?? DEFAULT_PANEL_APP_URL;
const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;

const adminHost = new URL(adminBaseUrl).host;
const panelHost = new URL(panelBaseUrl).host;

const shouldSkipPath = (pathname: string) =>
  pathname.startsWith("/_next") ||
  pathname.startsWith("/api") ||
  pathname === "/favicon.ico";

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;

  if (shouldSkipPath(pathname)) {
    return NextResponse.next();
  }

  const hostname = nextUrl.hostname;
  const isAdminHost = hostname === adminHost;
  const isPanelHost = hostname === panelHost;

  if (isAdminHost) {
    if (pathname.startsWith("/panel/admin")) {
      const url = nextUrl.clone();
      url.pathname = pathname.replace(/^\/panel\/admin/, "") || "/";
      url.search = nextUrl.search;
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/panel")) {
      const appUrl = new URL(`${appBaseUrl}${pathname}`);
      appUrl.search = nextUrl.search;
      return NextResponse.redirect(appUrl);
    }

    const url = nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/panel/admin";
    } else if (!pathname.startsWith("/panel/admin")) {
      url.pathname = `/panel/admin${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  if (isPanelHost) {
    if (pathname.startsWith("/panel/admin")) {
      const adminUrl = new URL(adminBaseUrl);
      const adminPath = pathname.replace(/^\/panel\/admin/, "") || "/";
      adminUrl.pathname = adminPath;
      adminUrl.search = nextUrl.search;
      return NextResponse.redirect(adminUrl);
    }

    if (pathname.startsWith("/panel")) {
      return NextResponse.next();
    }

    const url = nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/panel";
    } else if (!pathname.startsWith("/panel")) {
      url.pathname = `/panel${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/panel/admin")) {
    const adminUrl = new URL(adminBaseUrl);
    const adminPath = pathname.replace(/^\/panel\/admin/, "") || "/";
    adminUrl.pathname = adminPath;
    adminUrl.search = nextUrl.search;
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
