import { ModulePlaceholder } from "../../components/module-placeholder";

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Raporty i analityka"
      description="Zestawienia HR/Payroll, SLA urlopów, pokrycie grafików i eksporty do BI."
      status="Backlog"
      ready={["Dane źródłowe z grafików i czasu pracy", "Kompilacja API /dashboard", "Eksport CSV w legacy"]}
      inProgress={["Definicje raportów per rola", "Eksporty zaplanowane", "Widgety pulpitu zarządu"]}
      planned={["Integracja z Looker/PowerBI", "Alerty progowe e-mail", "API raportowe dla partnerów"]}
    />
  );
}
