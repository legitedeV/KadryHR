import { OnboardingTourConfig } from "./onboarding.types";

export const mainScheduleTour: OnboardingTourConfig = {
  id: "schedule-v2-tour",
  title: "Grafik pracy v2",
  steps: [
    {
      id: "schedule-overview",
      title: "Widok tygodniowy grafiku",
      description:
        "Tutaj widzisz pracowników po lewej i dni tygodnia na górze. Każda komórka to lista zmian dla danej osoby.",
      targetId: "schedule-grid",
    },
    {
      id: "schedule-add-shift",
      title: "Dodaj nową zmianę",
      description:
        "Kliknij, aby dodać zmianę i od razu sprawdzić dyspozycję oraz ewentualne urlopy.",
      targetId: "schedule-add-shift",
    },
    {
      id: "schedule-publish",
      title: "Publikacja grafiku",
      description:
        "Po ułożeniu zmian opublikuj grafik, aby pracownicy otrzymali powiadomienie.",
      targetId: "schedule-publish",
    },
    {
      id: "schedule-summary",
      title: "Podsumowania i alerty",
      description:
        "W tym panelu sprawdzisz liczbę godzin, braki w obsadzie i osoby bez zmian.",
      targetId: "schedule-summary",
      primaryActionType: "finish",
    },
  ],
};
