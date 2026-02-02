import Image from "next/image";

const benefits = [
  "Indywidualne podejście do klienta",
  "Profesjonalne doradztwo kadrowe",
  "Aktualna wiedza o przepisach prawa pracy",
];

export function AboutSection() {
  return (
    <section id="o-nas" className="landing-section">
      <div className="landing-container grid items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-[clamp(0.7rem,0.4vw+0.6rem,0.8rem)] font-semibold uppercase tracking-wide text-orange-700">
            O nas
          </div>
          <h2 className="landing-title text-slate-900">Partnerstwo oparte na zaufaniu</h2>
          <p className="landing-body text-slate-600">
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
            className="inline-flex min-h-[44px] rounded-full border border-orange-200 bg-orange-50 px-6 py-3 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          >
            Dowiedz się więcej
          </a>
        </div>
        <div className="relative">
          <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80"
              alt="Konsultanci HR omawiający procesy z klientem"
              width={900}
              height={720}
              sizes="(min-width: 1024px) 42vw, (min-width: 768px) 60vw, 92vw"
              className="h-[clamp(220px,38vh,480px)] w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
