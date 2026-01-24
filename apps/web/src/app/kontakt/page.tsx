import { KadryCard, Section } from "@kadryhr/ui";
import { LeadForm } from "@/components/LeadForm";

export default function KontaktPage() {
  return (
    <Section
      eyebrow="Kontakt"
      title="Porozmawiajmy o KadryHR"
      description="Zostaw dane kontaktowe, a doradca pomoże dobrać odpowiednie moduły i plan."
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <LeadForm source="kontakt" />
        <div className="space-y-6">
          <KadryCard>
            <h3 className="text-lg font-semibold text-emerald-950">Dane kontaktowe</h3>
            <p className="mt-2 text-sm text-emerald-800/80">
              KadryHR Sp. z o.o.<br />
              ul. Zielona 12, 00-120 Warszawa
            </p>
            <p className="mt-3 text-sm text-emerald-800/80">
              kontakt@kadryhr.pl<br />
              +48 22 100 18 90
            </p>
          </KadryCard>
          <KadryCard>
            <h3 className="text-lg font-semibold text-emerald-950">Godziny pracy</h3>
            <p className="mt-2 text-sm text-emerald-800/80">Pon–Pt: 8:00–18:00</p>
            <p className="text-sm text-emerald-800/80">Sobota: 9:00–14:00</p>
          </KadryCard>
        </div>
      </div>
    </Section>
  );
}
