import { ModulePlaceholder } from "../../components/module-placeholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Ustawienia organizacji"
      description="Branding, domeny, integracje i konfiguracja tenantów. Wspólne miejsce dla adminów i właścicieli."
      status="Do zaprojektowania"
      ready={["Kontekst organizacji z auth", "Szkielet nawigacji AppShell", "Status API /health"]}
      inProgress={["Edycja brandu i logotypu", "Konfiguracja integracji SMTP/Slack", "Zmienne czasu pracy i strefy"]}
      planned={["Personalizacja motywu", "Limity płatności i payroll", "Import/eksport CSV"]}
    />
  );
}
