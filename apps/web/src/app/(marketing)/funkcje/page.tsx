import { Badge, KadryCard, Section } from "@kadryhr/ui";

const modules = [
  {
    title: "Grafik pracy w chmurze",
    tag: "Dla managerów",
    points: [
      "Planowanie zmian dla wielu lokalizacji i zespołów",
      "Automatyczne konflikty i alerty obsady",
      "Publikacja grafiku w aplikacji pracownika",
    ],
  },
  {
    title: "Rejestracja czasu pracy (RCP online)",
    tag: "Dla operacji",
    points: [
      "Logowanie wejść z telefonu, tabletu lub kiosku",
      "Kontrola przerw i nadgodzin w czasie rzeczywistym",
      "Historia zdarzeń gotowa do eksportu",
    ],
  },
  {
    title: "Ewidencja godzin pracy",
    tag: "Dla kadr",
    points: [
      "Zestawienia miesięczne i raporty okresowe",
      "Obsługa wielu typów umów i stanowisk",
      "Eksport danych dla systemów kadrowych",
    ],
  },
  {
    title: "Raporty i statystyki",
    tag: "Dla zarządu",
    points: [
      "Dashboard kosztów i wykorzystania etatów",
      "Analiza frekwencji oraz absencji",
      "Raporty porównawcze dla lokalizacji",
    ],
  },
  {
    title: "Aplikacja mobilna dla pracowników",
    tag: "Dla zespołów",
    points: [
      "Podgląd grafiku i powiadomienia o zmianach",
      "Zgłoszenia dostępności oraz wnioski urlopowe",
      "Szybki kontakt z przełożonym i HR",
    ],
  },
];

export default function FunkcjePage() {
  return (
    <Section
      eyebrow="Funkcje"
      title="Moduły KadryHR, które pracują razem"
      description="Każdy obszar jest spójny i zsynchronizowany, dzięki czemu harmonogramy, RCP oraz ewidencja godzin tworzą jedno źródło prawdy."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {modules.map((module) => (
          <KadryCard key={module.title} className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-950">{module.title}</h3>
              <Badge>{module.tag}</Badge>
            </div>
            <ul className="space-y-2 text-sm text-emerald-800/80">
              {module.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </KadryCard>
        ))}
      </div>
    </Section>
  );
}
