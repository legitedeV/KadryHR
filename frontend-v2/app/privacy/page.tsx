import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Polityka prywatności KadryHR.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyRedirect() {
  redirect("/rodo");
}
