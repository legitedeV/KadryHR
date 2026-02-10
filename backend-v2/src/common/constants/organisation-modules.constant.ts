export const ORGANISATION_MODULES = [
  'grafik',
  'dyspozycje',
  'rcp',
  'urlopy',
  'raporty',
] as const;

export type OrganisationModule = (typeof ORGANISATION_MODULES)[number];

export const CORE_ORGANISATION_MODULES: ReadonlySet<OrganisationModule> = new Set([
  'grafik',
]);

export type OrganisationModuleState = Record<OrganisationModule, boolean>;

export const DEFAULT_ORGANISATION_MODULES: OrganisationModuleState = {
  grafik: true,
  dyspozycje: true,
  rcp: true,
  urlopy: true,
  raporty: true,
};

export function normalizeOrganisationModules(
  value: unknown,
): OrganisationModuleState {
  const input =
    value && typeof value === 'object'
      ? (value as Partial<Record<OrganisationModule, unknown>>)
      : {};

  return ORGANISATION_MODULES.reduce<OrganisationModuleState>((acc, moduleName) => {
    const raw = input[moduleName];
    if (CORE_ORGANISATION_MODULES.has(moduleName)) {
      acc[moduleName] = true;
      return acc;
    }

    acc[moduleName] = typeof raw === 'boolean' ? raw : DEFAULT_ORGANISATION_MODULES[moduleName];
    return acc;
  }, { ...DEFAULT_ORGANISATION_MODULES });
}
