import { Reveal } from "@/components/motion/Reveal";

const groups = [
  {
    title: "Planowanie",
    desc: "Zamykasz dyspozycyjność i układasz grafik bez konfliktów.",
    items: [
      "Miesięczne grafiki dla wielu lokalizacji",
      "Szablony zmian i automatyczne normy",
      "Podgląd obsady na każdej zmianie",
      "Inteligentne ostrzeżenia o brakach",
    ],
  },
  {
    title: "Czas pracy",
    desc: "RCP i raporty w jednym miejscu, bez ręcznych korekt.",
    items: [
      "Rejestracja QR i zamykanie sesji",
      "Podgląd nadgodzin w czasie rzeczywistym",
      "Eksport do kadr i płac",
      "Historia zmian i korekt",
    ],
  },
  {
    title: "Urlopy",
    desc: "Wnioski urlopowe i zastępstwa bez chaosu.",
    items: [
      "Wnioski online z historią decyzji",
      "Zastępstwa i zmiany w grafiku",
      "Limity i saldo urlopowe",
      "Powiadomienia dla managerów",
    ],
  },
  {
    title: "Raporty",
    desc: "Jeden widok, który mówi jak pracuje Twoja sieć.",
    items: [
      "Porównanie plan vs. wykonanie",
      "Analiza kosztów godzinowych",
      "Eksporty CSV i PDF",
      "Historia zmian i KPI",
    ],
  },
  {
    title: "Multi-tenant",
    desc: "Jedna platforma, wiele oddziałów i jasne uprawnienia.",
    items: [
      "Oddziały i lokalizacje w jednej instancji",
      "Role pracowników i managerów",
      "Logi audytowe i zgody",
      "SSO/SCIM dla większych sieci",
    ],
  },
];

export function FeatureGroups() {
  return (
    <section className="landing-section border-t border-surface-900/70 px-6 py-28" id="planowanie">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Reveal className="space-y-3" delay={80} distance={18}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">Funkcje</p>
            <h2 className="text-3xl font-semibold text-surface-50">
              Moduły, które działają razem.
            </h2>
            <p className="max-w-2xl text-surface-300">
              KadryHR nie jest listą funkcji. To spójny workflow, który prowadzi od planowania do rozliczeń.
            </p>
          </Reveal>
          <Reveal
            className="rounded-full border border-surface-800/60 bg-surface-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-surface-300 shadow-sm"
            delay={140}
            distance={16}
          >
            Zbudowane pod retail + zmianowość
          </Reveal>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {groups.map((group, index) => (
            <Reveal
              key={group.title}
              delay={160 + index * 80}
              className="rounded-[28px] border border-surface-800/60 bg-surface-900/60 p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] backdrop-blur transition-transform duration-500 hover:-translate-y-0.5"
              distance={20}
            >
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-surface-50">{group.title}</h3>
                <p className="text-sm text-surface-300">{group.desc}</p>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-surface-300">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
