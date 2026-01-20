"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";

const cases = [
  {
    id: "retail",
    label: "Sklepy i sieci",
    title: "Zamykaj grafiki na czas, nawet przy 15 lokalizacjach.",
    desc: "KadryHR daje jeden standard grafiku dla całej sieci, z lokalnymi różnicami w obsadach.",
    stats: [
      "Średnio 38% mniej telefonów o zmianach",
      "Podgląd luk obsady 30 dni do przodu",
      "Jedno źródło prawdy dla kierowników",
    ],
  },
  {
    id: "hospitality",
    label: "Gastronomia / produkcja",
    title: "Reaguj na zmienność bez chaosu.",
    desc: "Szybko przeliczysz obsadę, gdy rośnie ruch albo pojawiają się dodatkowe zamówienia.",
    stats: [
      "Grafik aktualizowany w 15 minut",
      "Natychmiastowe powiadomienia do zespołu",
      "Lepsza kontrola nad nadgodzinami",
    ],
  },
  {
    id: "services",
    label: "Usługi",
    title: "Pewne zmiany i dostępność w usługach lokalnych.",
    desc: "KadryHR pomaga łączyć grafiki pracowników z godzinami otwarcia i sezonowością.",
    stats: [
      "Mniej konfliktów z urlopami",
      "Dyspozycyjność zbierana automatycznie",
      "Pracownicy wiedzą o zmianach wcześniej",
    ],
  },
];

export function UseCases() {
  const [active, setActive] = useState(cases[0]);

  return (
    <section className="landing-section border-t border-surface-200/70 px-6 py-24 dark:border-surface-900/80" id="dla-kogo">
      <div className="mx-auto max-w-6xl space-y-12">
        <Reveal className="space-y-4" delay={80} distance={18}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">Dla kogo</p>
          <h2 className="text-3xl font-semibold text-surface-900 dark:text-surface-50">
            Trzy branże, jeden rytm pracy zmianowej.
          </h2>
        </Reveal>
        <div className="flex flex-wrap gap-3">
          {cases.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                active.id === item.id
                  ? "bg-brand-600 text-white shadow-soft"
                  : "border border-surface-200/70 bg-white/80 text-surface-600 hover:border-brand-400 dark:border-surface-800/60 dark:bg-surface-900/60 dark:text-surface-300 dark:hover:border-brand-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <Reveal
            className="rounded-3xl border border-surface-200/70 bg-white/80 p-6 shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-1 dark:border-surface-800/60 dark:bg-surface-900/60"
            delay={120}
            distance={20}
          >
            <h3 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">
              {active.title}
            </h3>
            <p className="mt-3 text-surface-600 dark:text-surface-300">{active.desc}</p>
            <ul className="mt-6 space-y-3 text-sm text-surface-600 dark:text-surface-300">
              {active.stats.map((stat) => (
                <li key={stat} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-brand-500" />
                  {stat}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal
            className="relative overflow-hidden rounded-3xl border border-brand-200/70 bg-brand-50/70 p-6 transition-transform duration-300 hover:-translate-y-1 dark:border-brand-800/50 dark:bg-brand-950/40"
            delay={180}
            distance={20}
          >
            <div className="absolute inset-0 opacity-70" aria-hidden="true">
              <svg className="h-full w-full" viewBox="0 0 400 300" fill="none">
                <g className="topo-lines" stroke="rgba(22, 132, 96, 0.35)" strokeWidth="1">
                  <path d="M-20 60 C80 20, 140 100, 260 60" />
                  <path d="M-10 110 C90 70, 150 150, 280 110" />
                  <path d="M0 160 C100 120, 160 200, 300 160" />
                  <path d="M10 210 C110 170, 170 250, 320 210" />
                </g>
              </svg>
            </div>
            <div className="relative space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">Mini animacja</p>
              <div className="grid gap-3">
                {["Zmiana poranna", "Zmiana popołudniowa", "Zmiana weekend"].map((item, index) => (
                  <div
                    key={item}
                    className={`rounded-2xl border border-surface-200/70 bg-white/80 p-4 text-sm font-semibold text-surface-900 shadow-sm dark:border-white/10 dark:bg-surface-900/70 dark:text-surface-100 ${
                      index === 1 ? "ambient-float delay-2" : index === 2 ? "ambient-float delay-3" : "ambient-float"
                    }`}
                  >
                    {item}
                    <p className="mt-2 text-xs font-medium text-surface-500 dark:text-surface-400">
                      {index === 0 ? "Obsada kompletna" : index === 1 ? "2 osoby do potwierdzenia" : "Wysoki popyt"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
