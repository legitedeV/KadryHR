import type { OrganisationModuleKey } from "@/lib/api";
import type { PanelNavItemId } from "@/lib/panel-navigation";

export const MODULE_LABELS: Record<OrganisationModuleKey, string> = {
  grafik: "Grafik",
  dyspozycje: "Dyspozycje",
  rcp: "RCP",
  urlopy: "Urlopy",
  raporty: "Raporty",
};

export const MODULE_ROUTE_MATCHERS: Array<{
  module: OrganisationModuleKey;
  routePrefix: string;
}> = [
  { module: "grafik", routePrefix: "/panel/grafik" },
  { module: "dyspozycje", routePrefix: "/panel/dyspozycje" },
  { module: "rcp", routePrefix: "/panel/rcp" },
  { module: "urlopy", routePrefix: "/panel/urlopy" },
  { module: "raporty", routePrefix: "/panel/raporty" },
];

export const NAV_ITEM_TO_MODULE: Partial<Record<PanelNavItemId, OrganisationModuleKey>> = {
  schedule: "grafik",
  availability: "dyspozycje",
  rcp: "rcp",
  reports: "raporty",
};

export function findModuleForPath(pathname: string): OrganisationModuleKey | null {
  const normalized = pathname.replace(/\/+$/, "");
  const found = MODULE_ROUTE_MATCHERS.find(({ routePrefix }) =>
    normalized === routePrefix || normalized.startsWith(`${routePrefix}/`),
  );

  return found?.module ?? null;
}
