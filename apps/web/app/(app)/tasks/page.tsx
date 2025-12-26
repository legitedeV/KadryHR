import { ModulePlaceholder } from "../../components/module-placeholder";

export default function TasksPage() {
  return (
    <ModulePlaceholder
      title="Zadania organizacyjne"
      description="Widok wszystkich zadań zleconych zespołom i managerom (zgłoszenia urlopowe, zatwierdzenia grafików, prośby HR)."
      status="W przygotowaniu"
      ready={["Źródła zadań z urlopów i grafików", "Dostęp do kontekstu organizacji", "Nawigacja z pulpitu"]}
      inProgress={["Kolejka zadań dla adminów", "Priorytety i SLA", "Przypomnienia mail/Slack"]}
      planned={["Tagowanie i komentarze", "Delegowanie zadań", "Widok kanban"]}
    />
  );
}
