import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme";

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
  themeColor: "#12BBD1",
};

export const metadata: Metadata = {
  title: "KadryHR – Nowoczesne grafiki i kadry",
  description:
    "KadryHR łączy grafikowanie, wnioski urlopowe i komunikację zespołu w jednym nowoczesnym panelu.",
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
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
