import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth-context";
import { CookieBanner } from "@/components/CookieBanner";
import { DEFAULT_LANG } from "@/lib/site-config";

export const viewport: Viewport = {
  themeColor: "#1EA574",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kadryhr.pl"),
  title: {
    default: "KadryHR — grafiki zmianowe, RCP i kadry dla retail",
    template: "%s · KadryHR",
  },
  description:
    "KadryHR to platforma HR i grafiku zmianowego dla retail i firm usługowych. Dyspozycyjność, urlopy i czas pracy w jednym miejscu.",
  applicationName: "KadryHR",
  keywords: [
    "grafik zmianowy",
    "RCP",
    "kadry",
    "time tracking",
    "retail HR",
    "urlopy",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "https://kadryhr.pl",
    siteName: "KadryHR",
    title: "KadryHR — grafiki zmianowe, RCP i kadry",
    description:
      "Zamknij grafiki i rozliczenia czasu pracy szybciej. KadryHR dla retail i zespołów zmianowych.",
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
    title: "KadryHR — grafiki zmianowe, RCP i kadry",
    description:
      "KadryHR porządkuje grafikowanie, urlopy i czas pracy w sieciach retail.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32x32.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={DEFAULT_LANG}>
      <body className="antialiased bg-surface-50 text-surface-900">
        <ToastProvider>
          <AuthProvider>
            {children}
            <CookieBanner />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
