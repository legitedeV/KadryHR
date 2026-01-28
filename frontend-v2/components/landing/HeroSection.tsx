import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
            Nowoczesne biuro HR
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Profesjonalna Obsługa Kadrowo-Płacowa
          </h1>
          <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
            Prowadzimy kompleksowe usługi kadrowe, naliczanie wynagrodzeń oraz doradztwo HR dla firm,
            które oczekują pełnej zgodności i partnerskiego wsparcia.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#kontakt"
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              Skontaktuj się
            </a>
            <a
              href="#uslugi"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              Nasza oferta
            </a>
          </div>
          <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-lg font-semibold text-slate-900">12 lat</p>
              <p>doświadczenia w HR</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-lg font-semibold text-slate-900">300+</p>
              <p>obsługiwanych firm</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-lg font-semibold text-slate-900">99.8%</p>
              <p>terminowości SLA</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 top-10 h-40 w-40 rounded-full bg-sky-100 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl">
            <Image
              src="/illustrations/hero-hr.svg"
              alt="Ilustracja przedstawiająca specjalistów HR przy pracy"
              width={520}
              height={460}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
