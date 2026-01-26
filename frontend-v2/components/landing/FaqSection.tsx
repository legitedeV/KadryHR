const faqs = [
  {
    question: "Czy KadryHR działa w wielu lokalizacjach jednocześnie?",
    answer:
      "Tak. KadryHR obsługuje wiele lokalizacji, zespołów i ról w ramach jednej organizacji. Masz wspólny widok i możliwość porównywania wydajności placówek.",
  },
  {
    question: "Jak szybko możemy wystartować?",
    answer:
      "Najczęściej uruchamiamy system w 7-14 dni, w zależności od liczby lokalizacji i zakresu migracji danych. Wdrażamy i szkolimy cały zespół.",
  },
  {
    question: "Czy dane z RCP można eksportować do payrollu?",
    answer:
      "Tak. Eksportujemy dane do popularnych formatów oraz oferujemy API dla integracji z systemami payroll i księgowością.",
  },
  {
    question: "Czy pracownicy muszą instalować dodatkową aplikację?",
    answer:
      "Nie jest to wymagane. KadryHR działa w przeglądarce i można go otworzyć na telefonie. Dla większych wdrożeń przygotowujemy dedykowane onboarding.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="relative bg-[#0b1110] py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1916] via-[#0b1110] to-[#0f1916]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
              FAQ
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              Najczęstsze pytania i decyzje przed wdrożeniem.
            </h2>
            <p className="mt-4 text-white/70">
              Jeśli czegoś nie znajdziesz, daj znać — pokażemy Ci platformę na żywo.
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-white">
                  {faq.question}
                  <span className="ml-4 text-emerald-200 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-white/70">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="mt-12 rounded-[2.5rem] border border-emerald-300/20 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-transparent p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">
                Co dalej?
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">
                Co się dzieje po zostawieniu kontaktu?
              </h3>
              <p className="mt-3 text-sm text-white/70">
                Działamy konkretnie i bez przeciągania procesu. Oto standardowy
                scenariusz wdrożenia.
              </p>
            </div>
            <div className="grid gap-4 text-sm text-white/70">
              {[
                "Oddzwaniamy w ciągu 24h i umawiamy demo.",
                "Mapujemy Twoje procesy i proponujemy konfigurację.",
                "Wdrażamy dane, szkolimy managerów i startujemy.",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-[#111b18] p-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/40 text-sm font-semibold text-emerald-200">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
