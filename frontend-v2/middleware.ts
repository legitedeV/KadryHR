import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ADMIN_APP_URL = "https://admin.kadryhr.pl";
const DEFAULT_PANEL_APP_URL = "https://panel.kadryhr.pl";
const adminBaseUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? DEFAULT_ADMIN_APP_URL;
const panelBaseUrl = process.env.NEXT_PUBLIC_PANEL_APP_URL ?? DEFAULT_PANEL_APP_URL;

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

  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost ?? request.headers.get("host") ?? nextUrl.hostname;
  const hostname = hostHeader.split(":")[0]?.toLowerCase() ?? nextUrl.hostname;
  const isAdminHost = hostname === adminHost;
  const isPanelHost = hostname === panelHost;
  const isAuthPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth");

  if (isAdminHost) {
    if (pathname.startsWith("/panel")) {
      const panelUrl = new URL(panelBaseUrl);
      panelUrl.pathname = pathname;
      panelUrl.search = nextUrl.search;
      return NextResponse.redirect(panelUrl);
    }

    if (pathname.startsWith("/console")) {
      return NextResponse.next();
    }

    const url = nextUrl.clone();
    if (pathname === "/") {
      url.pathname = "/console";
      return NextResponse.redirect(url);
    }

    if (!isAuthPath) {
      url.pathname = "/console";
      return NextResponse.redirect(url);
    }
    return NextResponse.rewrite(url);
  }

  if (isPanelHost) {
    if (pathname.startsWith("/console")) {
      const adminUrl = new URL(adminBaseUrl);
      adminUrl.pathname = pathname;
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

  if (pathname.startsWith("/panel")) {
    const panelUrl = new URL(panelBaseUrl);
    panelUrl.pathname = pathname;
    panelUrl.search = nextUrl.search;
    return NextResponse.redirect(panelUrl);
  }

  if (pathname.startsWith("/console")) {
    const adminUrl = new URL(adminBaseUrl);
    adminUrl.pathname = pathname;
    adminUrl.search = nextUrl.search;
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
