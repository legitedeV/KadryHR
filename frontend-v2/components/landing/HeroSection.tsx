import Image from "next/image";
import { ArrowRight, Phone } from "lucide-react";
import { Section } from "@/components/layout/Section";

export function HeroSection() {
  return (
    <Section className="relative">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
            Nowoczesne biuro HR
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Profesjonalna Obsługa Kadrowo-Płacowa
          </h1>
          <p className="max-w-prose text-base text-slate-600 sm:text-lg">
            Prowadzimy kompleksowe usługi kadrowe, naliczanie wynagrodzeń oraz doradztwo HR dla firm,
            które oczekują pełnej zgodności i partnerskiego wsparcia.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#kontakt"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Skontaktuj się
            </a>
            <a
              href="#uslugi"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              Nasza oferta
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
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
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-4 sm:p-6 shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80"
              alt="Zespół specjalistów HR pracujących przy nowoczesnym stanowisku"
              width={1000}
              height={760}
              priority
              sizes="(min-width: 1024px) 42vw, (min-width: 768px) 60vw, 92vw"
              className="h-[clamp(240px,42vh,520px)] w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
