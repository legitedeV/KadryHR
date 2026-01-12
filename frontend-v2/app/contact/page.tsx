import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Contact",
  description: "Umów demo KadryHR.",
  alternates: { canonical: "/contact" },
};

export default function ContactRedirect() {
  redirect("/kontakt");
}
