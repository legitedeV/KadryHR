export type PanelNavItemId =
  | "dashboard"
  | "schedule"
  | "availability"
  | "profile";

export type PanelNavItem = {
  id: PanelNavItemId;
  href: string;
  label: string;
  icon: string;
};

export const panelNavItems: PanelNavItem[] = [
  {
    id: "dashboard",
    href: "/panel/dashboard",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "schedule",
    href: "/panel/grafik",
    label: "Grafik",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    id: "availability",
    href: "/panel/dyspozycje",
    label: "Dyspozycje",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "profile",
    href: "/panel/profil",
    label: "Profil",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
];

export function getNavItemById(id: PanelNavItemId): PanelNavItem | undefined {
  return panelNavItems.find((item) => item.id === id);
}

export function getNavItemByHref(href: string): PanelNavItem | undefined {
  return panelNavItems.find((item) => item.href === href);
}

export const titleByPath: Record<string, string> = {
  "/panel/grafik": "Grafik zmian",
  "/panel/dyspozycje": "Dyspozycje",
  "/panel/profil": "Profil użytkownika",
  "/panel/dashboard": "Dashboard",
};
