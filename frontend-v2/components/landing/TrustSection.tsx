import { Section } from "@/components/layout/Section";

const stats = [
  { label: "Lata doświadczenia", value: "12+" },
  { label: "Obsługiwanych firm", value: "300+" },
  { label: "Specjalistów HR", value: "40" },
  { label: "Terminowości procesów", value: "99.8%" },
];

export function TrustSection() {
  return (
    <Section className="page-shell-bleed bg-gradient-to-r from-slate-50 via-white to-orange-50 py-10 sm:py-12">
      <div className="page-shell-inner grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white/80 p-5 text-center shadow-sm">
            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
