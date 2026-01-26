const quotes = [
  {
    quote:
      "W końcu wiemy, kto i kiedy realnie był na zmianie. Bez kłótni o nadgodziny.",
    role: "Właścicielka sieci kawiarni, 6 lokali",
  },
  {
    quote:
      "Układanie grafiku z tygodniowego koszmaru stało się zadaniem na 15 minut.",
    role: "Manager operacyjny retail",
  },
  {
    quote:
      "KadryHR spiął grafik, RCP i urlopy — nie musimy przeklejać danych do księgowości.",
    role: "Kierowniczka ds. kadr, usługi",
  },
  {
    quote:
      "Pracownicy sami zgłaszają dyspozycyjność, a ja mam jasny obraz obsady.",
    role: "Regionalny manager gastronomii",
  },
  {
    quote:
      "Wreszcie mamy jeden system dla wszystkich lokalizacji, bez chaosu w Excelu.",
    role: "Dyrektor operacyjny sieci sklepów",
  },
  {
    quote:
      "Dostęp do historii zmian i akceptacji to spokój przy kontrolach.",
    role: "Właściciel firmy usługowej",
  },
];

export function SocialProofSection() {
  return (
    <section className="relative bg-[#0b1110] py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1916] via-[#0b1110] to-[#0f1916]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              Zaufanie klientów
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Ściana opinii zamiast logotypów.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Polska platforma", "Retail/Gastro", "Wsparcie wdrożeniowe"].map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100"
                >
                  {badge}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="mt-10 columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">
          {quotes.map((item) => (
            <div
              key={item.quote}
              className="break-inside-avoid rounded-[2.2rem] border border-white/10 bg-white/5 p-6 text-sm text-white/70"
            >
              <p className="text-base text-white/90">“{item.quote}”</p>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                {item.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
