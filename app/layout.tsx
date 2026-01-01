import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { THEME_STORAGE_KEY } from "../lib/theme";
import { ThemeProvider } from "../components/ThemeProvider";

export const metadata: Metadata = {
  title: "KadryHR",
  description: "Panel kadrowy dla małych sklepów",
};

const setThemeScript = `(() => {
  try {
    const stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.remove('dark');
    root.classList.add(theme);
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.error('Theme setup failed', error);
  }
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">{setThemeScript}</Script>
      </head>
      <body className="antialiased bg-white text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
