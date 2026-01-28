import Image from "next/image";

const benefits = [
  "Indywidualne podejście do klienta",
  "Profesjonalne doradztwo kadrowe",
  "Aktualna wiedza o przepisach prawa pracy",
];

export function AboutSection() {
  return (
    <section id="o-nas" className="py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            O nas
          </div>
          <h2 className="text-3xl font-semibold text-slate-900">Partnerstwo oparte na zaufaniu</h2>
          <p className="text-base text-slate-600">
            Od ponad dekady wspieramy firmy w budowaniu stabilnych zespołów. Dostarczamy czytelne
            procesy, raporty i stałe doradztwo, dzięki czemu możesz skupić się na rozwoju biznesu.
          </p>
          <ul className="space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 8.5L6.5 11L12 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          <a
            href="#kontakt"
            className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-6 py-3 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
          >
            Dowiedz się więcej
          </a>
        </div>
        <div className="relative">
          <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl">
            <Image
              src="/illustrations/about-hr.svg"
              alt="Ilustracja zespołu HR konsultującego procesy"
              width={480}
              height={420}
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
