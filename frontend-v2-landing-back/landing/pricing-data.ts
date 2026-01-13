export const pricingPlans = [
  {
    name: "Start",
    price: "12 zł",
    cadence: "/ użytkownik / mies.",
    desc: "Dla pojedynczych sklepów i zespołów do 20 osób.",
    features: [
      "Grafiki miesięczne i tygodniowe",
      "Dyspozycyjność i zgody urlopowe",
      "RCP (QR/kiosk) i raporty godzin",
      "Wsparcie e-mail w 24h",
    ],
  },
  {
    name: "Growth",
    price: "19 zł",
    cadence: "/ użytkownik / mies.",
    badge: "Najczęściej wybierany",
    desc: "Dla sieci 2-10 lokalizacji z managerami zmian.",
    features: [
      "Szablony grafiku i normy czasu",
      "Zamiany zmian i zastępstwa",
      "Panel managera + panel pracownika",
      "Priorytetowe wsparcie i onboarding",
    ],
    highlighted: true,
  },
  {
    name: "Scale",
    price: "29 zł",
    cadence: "/ użytkownik / mies.",
    desc: "Dla sieci powyżej 10 lokalizacji.",
    features: [
      "Oddziały, regiony, role zaawansowane",
      "Raporty kosztowe i KPI",
      "Integracje z kadrami i płacami",
      "Dedykowany opiekun wdrożenia",
    ],
  },
  {
    name: "Enterprise",
    price: "Wycena",
    cadence: "indywidualna",
    desc: "Dla organizacji z niestandardowymi procesami.",
    features: [
      "SLA i środowisko dedykowane",
      "SSO/SCIM i niestandardowe uprawnienia",
      "Integracje niestandardowe",
      "Audyt bezpieczeństwa i compliance",
    ],
  },
];

export const pricingFaq = [
  {
    question: "Czy płacę za wszystkich pracowników?",
    answer:
      "Tak, rozliczenie odbywa się per aktywny użytkownik w danym miesiącu. Dzięki temu możesz skalować koszt razem z zespołem.",
  },
  {
    question: "Czy jest minimalna liczba użytkowników?",
    answer:
      "Plan Start działa już od 5 osób. W planach Growth i Scale pomagamy zoptymalizować wdrożenie pod liczbę lokalizacji.",
  },
  {
    question: "Jak wygląda wdrożenie?",
    answer:
      "W planie Growth i wyższych dostajesz warsztat onboardingowy, a dane startowe importujemy razem z Tobą.",
  },
  {
    question: "Czy mogę zrezygnować?",
    answer:
      "Tak, umowy są elastyczne. Pomagamy w eksporcie danych i zamykamy konto na Twoje życzenie.",
  },
];
