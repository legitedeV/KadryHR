import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@kadryhr/config";
import { Footer, Navbar } from "@kadryhr/ui";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "KadryHR – grafik pracy i rejestracja czasu pracy",
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
