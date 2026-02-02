import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/QueryProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth-context";
import { DEFAULT_LANG } from "@/lib/site-config";
import { PageShell } from "@/components/layout/PageShell";

export const viewport: Viewport = {
  themeColor: "#0ea371",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kadryhr.pl"),
  title: {
    default: "KadryHR — planowanie, dyspozycyjność i realizacja zmian",
    template: "%s · KadryHR",
  },
  description:
    "KadryHR to spokojny, skoncentrowany panel do planowania grafiku i dyspozycyjności zespołu.",
  applicationName: "KadryHR",
  keywords: [
    "grafik zmianowy",
    "planowanie",
    "dyspozycyjność",
    "grafik",
    "operacje",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "https://kadryhr.pl",
    siteName: "KadryHR",
    title: "KadryHR — planowanie grafiku i dyspozycyjności",
    description:
      "KadryHR to spokojny panel do planowania grafiku i dyspozycyjności zespołu.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "KadryHR — platforma HR i grafiku zmianowego",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KadryHR — planowanie grafiku i dyspozycyjności",
    description:
      "KadryHR porządkuje planowanie grafiku i dyspozycyjności zespołu.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon1.png", type: "image/png" },
      { url: "/icon0.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-title": "KadryHR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={DEFAULT_LANG}>
      <body className="antialiased">
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>
              <PageShell>{children}</PageShell>
            </AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
