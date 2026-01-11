const logos = ["Żabka", "Costa", "Leroy", "Rossmann", "Empik"];

export function LogosStrip() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/60 bg-white/70 px-6 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          Zaufali nam
        </p>
        <div className="flex flex-wrap items-center gap-8">
          {logos.map((logo) => (
            <span key={logo} className="text-sm font-semibold text-slate-500">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
