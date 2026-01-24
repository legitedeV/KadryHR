import { KadryCard, Section, KadryButton } from "@kadryhr/ui";

const downloads = [
  {
    title: "Wzór grafiku pracy miesięcznego",
    description: "Gotowy szablon do planowania zmian na cały miesiąc.",
  },
  {
    title: "Wzór ewidencji czasu pracy",
    description: "Arkusz do ewidencji godzin, nadgodzin i przerw.",
  },
  {
    title: "Checklista wdrożenia RCP",
    description: "Lista kroków, które przyspieszą start z rejestracją czasu pracy.",
  },
];

const guides = [
  {
    title: "Jak przygotować zespół do cyfrowego grafiku pracy",
    lead: "Przewodnik po komunikacji zmian i dobrych praktykach organizacyjnych.",
  },
  {
    title: "5 wskaźników, które warto śledzić w ewidencji czasu",
    lead: "Dowiedz się, jak identyfikować nadgodziny i nierównomierne obłożenie.",
  },
  {
    title: "Checklist dla kierownika zmiany",
    lead: "Sprawdź, jak uporządkować start i koniec dnia pracy zespołu.",
  },
];

export default function MaterialyPage() {
  return (
    <Section
      eyebrow="Materiały"
      title="Materiały i szablony dla zespołów"
      description="Pobierz bezpłatne wzory i poradniki, które ułatwią planowanie czasu pracy."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {downloads.map((item) => (
          <KadryCard key={item.title} className="flex h-full flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-950">{item.title}</h3>
              <p className="mt-2 text-sm text-emerald-800/80">{item.description}</p>
            </div>
            <KadryButton variant="secondary" size="sm" href="#">
              Pobierz
            </KadryButton>
          </KadryCard>
        ))}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {guides.map((item) => (
          <KadryCard key={item.title} className="flex h-full flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-950">{item.title}</h3>
              <p className="mt-2 text-sm text-emerald-800/80">{item.lead}</p>
            </div>
            <KadryButton variant="ghost" size="sm" href="#">
              Czytaj dalej
            </KadryButton>
          </KadryCard>
        ))}
      </div>
    </Section>
  );
}
