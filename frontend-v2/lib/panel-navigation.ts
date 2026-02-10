import type { Permission } from "./api";

export type PanelNavItemId =
  | "dashboard"
  | "schedule"
  | "availability"
  | "rcp"
  | "employees"
  | "organisation"
  | "reports"
  | "profile";

export type PanelNavItem = {
  id: PanelNavItemId;
  href: string;
  label: string;
  icon: string;
  requiredPermissions?: Permission[];
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
    requiredPermissions: ["SCHEDULE_VIEW", "SCHEDULE_MANAGE"],
  },
  {
    id: "availability",
    href: "/panel/dyspozycje",
    label: "Dyspozycje",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    requiredPermissions: ["AVAILABILITY_MANAGE"],
  },
  {
    id: "rcp",
    href: "/panel/rcp",
    label: "RCP",
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    requiredPermissions: ["RCP_EDIT"],
  },
  {
    id: "employees",
    href: "/panel/pracownicy",
    label: "Pracownicy",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    requiredPermissions: ["SCHEDULE_VIEW"],
  },

  {
    id: "reports",
    href: "/panel/raporty",
    label: "Raporty",
    icon: "M9 17v-6m3 6V7m3 10v-4m5 6H4a1 1 0 01-1-1V6a1 1 0 011-1h16a1 1 0 011 1v12a1 1 0 01-1 1z",
    requiredPermissions: ["REPORTS_EXPORT"],
  },
  {
    id: "organisation",
    href: "/panel/organizacja",
    label: "Organizacja",
    icon: "M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
    requiredPermissions: ["ORGANISATION_SETTINGS"],
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
  "/panel": "Dashboard",
  "/panel/grafik": "Grafik",
  "/panel/grafik-v2": "Grafik",
  "/panel/dyspozycje": "Dyspozycje",
  "/panel/rcp": "RCP",
  "/panel/pracownicy": "Pracownicy",
  "/panel/organizacja": "Ustawienia organizacji",
  "/panel/profil": "Profil",
  "/panel/raporty": "Raporty",
  "/panel/urlopy": "Urlopy",
  "/panel/dashboard": "Dashboard",
};
