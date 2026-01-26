import { OnboardingTourConfig } from "./onboarding.types";

export const mainPanelTour: OnboardingTourConfig = {
  id: "main-panel-tour",
  title: "Poznaj KadryHR",
  steps: [
    {
      id: "schedule",
      title: "Grafik zmian",
      description:
        'W zakladce "Grafik" zaplanujesz zmiany i sprawdzisz obsade na caly tydzien - to serce planowania pracy.',
      targetId: "nav-schedule",
      moduleRouteName: "schedule",
      primaryActionType: "go-to-module",
    },
    {
      id: "availability",
      title: "Dyspozycje",
      description:
        'Modul "Dyspozycje" zbiera preferencje pracownikow, zanim opublikujesz grafik - dzieki temu latwiej unikniesz konfliktow.',
      targetId: "nav-availability",
      moduleRouteName: "availability",
      primaryActionType: "go-to-module",
    },
    {
      id: "time-tracking",
      title: "Czas pracy (RCP)",
      description:
        "W module RCP widzisz wejscia i wyjscia pracownikow, korekty czasu i roznice wzgledem grafiku.",
      targetId: "nav-time-tracking",
      moduleRouteName: "profile",
      primaryActionType: "go-to-module",
    },
    {
      id: "team-and-roles",
      title: "Zespol i role",
      description:
        'W sekcji "Pracownicy / Zespol" dodasz nowych pracownikow, przypiszesz role oraz wyslesz zaproszenia do logowania.',
      targetId: "nav-employees",
      moduleRouteName: "profile",
      primaryActionType: "go-to-module",
    },
    {
      id: "help-and-consulting",
      title: "Pomoc i konsultacje",
      description:
        "Gdy potrzebujesz wsparcia, uruchom komunikator, umow konsultacje lub zadzwon - kontakt znajdziesz w panelu pomocy.",
      targetId: "nav-help",
      primaryActionType: "finish",
    },
  ],
};
