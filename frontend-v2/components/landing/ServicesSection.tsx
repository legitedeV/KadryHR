import { BadgeDollarSign, Briefcase, FileText, UserSearch } from "lucide-react";
import { Section } from "@/components/layout/Section";

const services = [
  {
    title: "Obsługa Kadrowo-Płacowa",
    description:
      "Prowadzimy dokumentację, umowy oraz ewidencję czasu pracy w zgodzie z aktualnymi przepisami.",
    icon: FileText,
  },
  {
    title: "Rozliczanie Wynagrodzeń",
    description: "Listy płac, składki ZUS, PIT oraz raporty rozliczeniowe przygotowane terminowo.",
    icon: BadgeDollarSign,
  },
  {
    title: "Rekrutacja i Selekcja",
    description: "Sourcing, preselekcja oraz weryfikacja kandydatów z dopasowaniem do kultury firmy.",
    icon: UserSearch,
  },
  {
    title: "Doradztwo HR",
    description: "Optymalizacja procesów, compliance i wsparcie menedżerów w decyzjach kadrowych.",
    icon: Briefcase,
  },
];

export function ServicesSection() {
  return (
    <Section id="uslugi" className="page-shell-bleed bg-slate-50/60">
      <div className="page-shell-inner flex flex-col gap-8">
        <div className="max-w-prose space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
            Nasze usługi
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Kompleksowe wsparcie HR dla biznesu
          </h2>
          <p className="text-base text-slate-600 sm:text-lg">
            Łączymy wiedzę ekspercką z nowoczesnymi procesami, aby odciążyć działy kadr i zapewnić
            bezpieczeństwo formalne.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.title}
              className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                <service.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{service.description}</p>
              <a
                href="#kontakt"
                className="mt-auto pt-6 text-sm font-semibold text-orange-700 transition hover:text-orange-600"
              >
                Dowiedz się więcej →
              </a>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
