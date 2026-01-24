import { KadryCard, Section } from "@kadryhr/ui";

const cases = [
  {
    industry: "Gastronomia",
    challenge: "Rotacja zespołu i brak spójnego grafiku na kilku lokalizacjach.",
    result: "15% mniej nadgodzin i stała obsada na szczytowe godziny.",
  },
  {
    industry: "Retail",
    challenge: "Duże wahania ruchu klienta i ręczne układanie zmian.",
    result: "Grafiki tworzone 3x szybciej, więcej czasu na sprzedaż.",
  },
  {
    industry: "Hotelarstwo",
    challenge: "Nieregularne obłożenie i problemy z rejestracją czasu pracy.",
    result: "Automatyczne raporty RCP dla wszystkich działów.",
  },
  {
    industry: "Logistyka",
    challenge: "Brak bieżącej kontroli nad zmianami i obsadą magazynu.",
    result: "Bieżący podgląd obsady oraz raporty absencji w jednym panelu.",
  },
  {
    industry: "Opieka zdrowotna",
    challenge: "Wiele typów umów i ręczne rozliczenia dyżurów.",
    result: "Jednolita ewidencja godzin oraz szybki eksport do kadr.",
  },
  {
    industry: "Usługi terenowe",
    challenge: "Rozproszone zespoły i brak potwierdzania godzin pracy.",
    result: "Mobilne logowania i weryfikacja czasu w czasie rzeczywistym.",
  },
];

export default function KlienciPage() {
  return (
    <Section
      eyebrow="Klienci"
      title="Zaufali nam liderzy różnych branż"
      description="KadryHR wspiera organizacje, które zarządzają zmianami, pracą sezonową i wieloma lokalizacjami."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cases.map((item) => (
          <KadryCard key={item.industry} className="flex h-full flex-col gap-4">
            <h3 className="text-lg font-semibold text-emerald-950">{item.industry}</h3>
            <div className="text-sm text-emerald-800/80">
              <p className="font-semibold text-emerald-900">Problem</p>
              <p>{item.challenge}</p>
            </div>
            <div className="text-sm text-emerald-800/80">
              <p className="font-semibold text-emerald-900">Efekt</p>
              <p>{item.result}</p>
            </div>
          </KadryCard>
        ))}
      </div>
    </Section>
  );
}
