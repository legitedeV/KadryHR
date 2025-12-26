import { ModulePlaceholder } from "../../../components/module-placeholder";

export default function AdminRequestsPage() {
  return (
    <ModulePlaceholder
      title="Admin requests"
      description="Kolejka wniosków administracyjnych (uprawnienia, webhooks, zgłoszenia bezpieczeństwa)."
      status="Backlog"
      ready={["RBAC i role admin/super_admin", "Kontekst organizacji", "Ścieżki nawigacji"]}
      inProgress={["Formularze wniosków", "SLA i eskalacje", "Widok historii decyzji"]}
      planned={["Automatyczne akcje (self-service)", "Integracja z ITSM/Jira", "Raportowanie utrzymania"]}
    />
  );
}
