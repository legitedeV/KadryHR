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
    <section id="faq" className="relative bg-[#F7F9FB] py-16">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#F7F9FB] to-[#FFFFFF]" />
      <div className="relative mx-auto max-w-5xl px-5">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">
              FAQ
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-surface-900 sm:text-3xl">
              Najczęstsze pytania i decyzje przed wdrożeniem.
            </h2>
            <p className="mt-4 text-surface-600">
              Jeśli czegoś nie znajdziesz, daj znać — pokażemy Ci platformę na żywo.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-surface-300 bg-surface-100 p-5 text-sm text-surface-600"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-surface-900">
                  {faq.question}
                  <span className="ml-4 text-emerald-600 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-surface-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="mt-10 rounded-2xl border border-emerald-400 bg-gradient-to-br from-emerald-50 via-white/[0.03] to-transparent p-6">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">
                Co dalej?
              </p>
              <h3 className="mt-2 text-xl font-semibold text-surface-900">
                Co się dzieje po zostawieniu kontaktu?
              </h3>
              <p className="mt-3 text-sm text-surface-600">
                Działamy konkretnie i bez przeciągania procesu. Oto standardowy
                scenariusz wdrożenia.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-surface-600">
              {[
                "Oddzwaniamy w ciągu 24h i umawiamy demo.",
                "Mapujemy Twoje procesy i proponujemy konfigurację.",
                "Wdrażamy dane, szkolimy managerów i startujemy.",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-3 rounded-xl border border-surface-300 bg-white p-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400 text-sm font-semibold text-emerald-700">
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
