import { OnboardingTourConfig } from "./onboarding.types";

export const mainPanelTour: OnboardingTourConfig = {
  id: "main-panel-tour",
  title: "Poznaj KadryHR",
  steps: [
    {
      id: "schedule",
      title: "Grafik zmian",
      description:
        "W zakładce „Grafik” zaplanujesz zmiany i sprawdzisz obsadę na cały tydzień – to serce planowania pracy.",
    },
    {
      id: "availability",
      title: "Dyspozycje",
      description:
        "Moduł „Dyspozycje” zbiera preferencje pracowników, zanim opublikujesz grafik – dzięki temu łatwiej unikniesz konfliktów.",
    },
    {
      id: "time-tracking",
      title: "Czas pracy (RCP)",
      description:
        "W module RCP widzisz wejścia i wyjścia pracowników, korekty czasu i różnice względem grafiku.",
    },
    {
      id: "team-and-roles",
      title: "Zespół i role",
      description:
        "W sekcji „Pracownicy / Zespół” dodasz nowych pracowników, przypiszesz role oraz wyślesz zaproszenia do logowania.",
    },
    {
      id: "help-and-consulting",
      title: "Pomoc i konsultacje",
      description:
        "Gdy potrzebujesz wsparcia, uruchom komunikator, umów konsultację lub zadzwoń – kontakt znajdziesz w panelu pomocy.",
    },
  ],
};
