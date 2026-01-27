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
    <section className="relative bg-[#F7F9FB] py-16">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#F7F9FB] to-[#FFFFFF]" />
      <div className="relative mx-auto max-w-5xl px-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">
              Zaufanie klientów
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-surface-900 sm:text-3xl">
              Ściana opinii zamiast logotypów.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Polska platforma", "Retail/Gastro", "Wsparcie wdrożeniowe"].map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-emerald-400 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700"
                >
                  {badge}
                </span>
              ),
            )}
          </div>
        </div>
        <div className="mt-8 columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3">
          {quotes.map((item) => (
            <div
              key={item.quote}
              className="break-inside-avoid rounded-2xl border border-surface-300 bg-surface-100 p-5 text-sm text-surface-600"
            >
              <p className="text-base text-surface-800">“{item.quote}”</p>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-emerald-600">
                {item.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
