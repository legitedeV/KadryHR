import { KadryButton, PricingField, PricingTable, Section } from "@kadryhr/ui";
import { LeadForm } from "@/components/LeadForm";

const plans = [
  {
    name: "Start",
    price: "Od 9 zł / pracownika",
    description: "Dla zespołów do 50 osób",
    features: [
      "Grafik pracy w chmurze",
      "Podstawowe RCP online",
      "Raporty zmianowe",
      "Wsparcie e-mail",
    ],
    ctaLabel: "Umów prezentację",
  },
  {
    name: "Standard",
    price: "Od 15 zł / pracownika",
    description: "Najczęstszy wybór dla firm wielolokalizacyjnych",
    features: [
      "Wszystko z planu Start",
      "Ewidencja czasu pracy",
      "Aplikacja mobilna dla pracowników",
      "Alerty i automatyzacje",
    ],
    ctaLabel: "Umów prezentację",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "Oferta indywidualna",
    description: "Dla firm powyżej 300 pracowników",
    features: [
      "Zaawansowane raporty kosztów",
      "Dedykowany opiekun wdrożenia",
      "Integracje i API",
      "SLA dla krytycznych procesów",
    ],
    ctaLabel: "Porozmawiaj z nami",
  },
];

export default function CennikPage() {
  return (
    <div>
      <Section
        eyebrow="Cennik"
        title="Dobierz plan do skali zespołu"
        description="Elastyczne plany i moduły, które rosną razem z Twoją organizacją."
      >
        <div className="mb-8 flex flex-wrap gap-3">
          <PricingField label="Start w 5 minut" value="Panel gotowy od razu" />
          <PricingField label="Rejestracja" value="Bez kontaktu z handlowcem" />
        </div>
        <div className="mb-10 flex flex-wrap gap-3">
          <KadryButton href="/auth/register">Załóż konto</KadryButton>
          <KadryButton variant="secondary" href="/auth/login">
            Zaloguj się
          </KadryButton>
        </div>
        <PricingTable plans={plans} />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <PricingField label="Lokalizacje" value="1-30" />
          <PricingField label="Wsparcie" value="biznesowe 8/5" />
          <PricingField label="Onboarding" value="2-4 tygodnie" />
        </div>
      </Section>

      <Section
        eyebrow="Zapytaj o ofertę"
        title="Chcesz spersonalizowaną wycenę?"
        description="Opisz swoją organizację, a przygotujemy propozycję dopasowaną do skali i branży."
      >
        <LeadForm source="cennik" />
      </Section>
    </div>
  );
}
