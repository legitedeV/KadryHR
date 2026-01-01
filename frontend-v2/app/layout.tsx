import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pl">
      <body className="antialiased transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
