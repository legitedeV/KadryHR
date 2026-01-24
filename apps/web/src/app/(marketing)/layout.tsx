import type { ReactNode } from "react";
import { Footer, Navbar } from "@kadryhr/ui";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </div>
  );
}
