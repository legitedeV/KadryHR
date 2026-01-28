const stats = [
  { label: "Lata doświadczenia", value: "12+" },
  { label: "Obsługiwanych firm", value: "300+" },
  { label: "Specjalistów HR", value: "40" },
  { label: "Terminowości procesów", value: "99.8%" },
];

export function TrustSection() {
  return (
    <section className="bg-gradient-to-r from-sky-50 via-white to-orange-50 py-16">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm">
            <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
