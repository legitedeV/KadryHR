import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: "Informacje o przetwarzaniu danych osobowych w KadryHR.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default function RodoPage() {
  redirect("/polityka-prywatnosci");
}
