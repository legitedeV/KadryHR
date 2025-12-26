"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootAppRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/app");
  }, [router]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-sm"
      style={{ color: "var(--text-secondary)" }}>
      Przekierowuję do pulpitu...
    </div>
  );
}
