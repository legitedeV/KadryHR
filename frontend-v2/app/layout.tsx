import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { CookieBanner } from "@/components/CookieBanner";

const setThemeScript = `(() => {
  try {
    const stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
    const root = document.documentElement;
    const body = document.body;
    [root, body].forEach((element) => {
      if (!element) return;
      element.classList.remove('light');
      element.classList.remove('dark');
      element.classList.add(theme);
    });
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.error('Theme setup failed', error);
  }
})();`;

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
    <html lang="pl" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {setThemeScript}
        </Script>
      </head>
      <body className="antialiased transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
              <CookieBanner />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
