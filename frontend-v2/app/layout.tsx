import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "KadryHR",
  description: "Panel kadrowy dla małych sklepów",
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
