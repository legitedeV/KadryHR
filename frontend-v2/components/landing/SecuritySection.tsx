import { Reveal } from "@/components/motion/Reveal";

const items = [
  {
    title: "Role i uprawnienia",
    desc: "Precyzyjne role dla właścicieli, managerów i pracowników. Każda akcja ma swoją ścieżkę akceptacji.",
  },
  {
    title: "Logi i audyt zmian",
    desc: "Historia edycji grafików i wniosków jest dostępna dla administratorów. Zawsze wiesz kto co zmienił.",
  },
  {
    title: "Minimalizacja danych",
    desc: "Zbieramy tylko dane potrzebne do rozliczeń i planowania zmian. Możesz eksportować i usuwać dane na żądanie.",
  },
  {
    title: "Kopie zapasowe i bezpieczeństwo",
    desc: "Szyfrowane backupy oraz monitoring dostępności usług. Dane są przechowywane w ramach UE.",
  },
];

export function SecuritySection() {
  return (
    <section className="landing-section border-t border-surface-900/70 px-6 py-28" id="bezpieczenstwo">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="space-y-4" delay={80} distance={18}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-400">Bezpieczeństwo i RODO</p>
            <h2 className="text-3xl font-semibold text-surface-50">
              Dane kadrowe zasługują na pewny proces.
            </h2>
            <p className="text-surface-300">
              KadryHR działa zgodnie z europejskimi standardami ochrony danych. Zapewniamy kontrolę dostępu,
              historię zmian i czytelne zasady przetwarzania.
            </p>
          </Reveal>
          <Reveal className="rounded-[28px] border border-brand-800/50 bg-brand-950/40 p-6" delay={140} distance={20}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">W skrócie</p>
            <ul className="mt-4 space-y-3 text-sm text-brand-100">
              <li>• Dane przechowywane w UE</li>
              <li>• Szyfrowanie w spoczynku i tranzycie</li>
              <li>• Role i uprawnienia per lokalizacja</li>
              <li>• Eksport danych na żądanie</li>
            </ul>
          </Reveal>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <Reveal
              key={item.title}
              delay={160 + index * 70}
              className="rounded-[28px] border border-surface-800/60 bg-surface-900/60 p-6 shadow-[0_22px_50px_-38px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:-translate-y-0.5"
              distance={18}
            >
              <h3 className="text-lg font-semibold text-surface-50">{item.title}</h3>
              <p className="mt-2 text-sm text-surface-300">{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
