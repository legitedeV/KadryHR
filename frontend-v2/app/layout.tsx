import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/lib/auth-context";

// Inline script so it can run before hydration and set the theme class without a network roundtrip.
const themeBootstrap = `(() => {
  try {
    const KEY = 'kadryhr_theme';
    const stored = window.localStorage.getItem(KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.warn('Theme bootstrap failed', error);
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
    // Theme is applied pre-hydration; suppress the initial class mismatch warning.
    <html lang="pl" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
