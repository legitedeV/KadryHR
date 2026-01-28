import Image from "next/image";

const services = [
  {
    title: "Obsługa Kadrowo-Płacowa",
    description:
      "Prowadzimy dokumentację, umowy oraz ewidencję czasu pracy w zgodzie z aktualnymi przepisami.",
    icon: "/illustrations/service-docs.svg",
  },
  {
    title: "Rozliczanie Wynagrodzeń",
    description: "Listy płac, składki ZUS, PIT oraz raporty rozliczeniowe przygotowane terminowo.",
    icon: "/illustrations/service-payroll.svg",
  },
  {
    title: "Rekrutacja i Selekcja",
    description: "Sourcing, preselekcja oraz weryfikacja kandydatów z dopasowaniem do kultury firmy.",
    icon: "/illustrations/service-recruitment.svg",
  },
  {
    title: "Doradztwo HR",
    description: "Optymalizacja procesów, compliance i wsparcie menedżerów w decyzjach kadrowych.",
    icon: "/illustrations/service-advisory.svg",
  },
];

export function ServicesSection() {
  return (
    <section id="uslugi" className="bg-slate-50/60 py-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Nasze usługi</p>
          <h2 className="text-3xl font-semibold text-slate-900">Kompleksowe wsparcie HR dla biznesu</h2>
          <p className="text-base text-slate-600">
            Łączymy wiedzę ekspercką z nowoczesnymi procesami, aby odciążyć działy kadr i zapewnić
            bezpieczeństwo formalne.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.title}
              className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                <Image src={service.icon} alt="" width={32} height={32} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{service.description}</p>
              <a
                href="#kontakt"
                className="mt-6 text-sm font-semibold text-sky-700 transition hover:text-sky-600"
              >
                Dowiedz się więcej →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
