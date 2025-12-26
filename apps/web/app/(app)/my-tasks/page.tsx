import { ModulePlaceholder } from "../../components/module-placeholder";

export default function MyTasksPage() {
  return (
    <ModulePlaceholder
      title="Moje zadania"
      description="Skrzynka użytkownika z zadaniami do wykonania: potwierdzenie zmiany, akceptacja urlopu, odpowiedź na prośbę."
      status="Do implementacji"
      ready={["Kontekst użytkownika z auth", "Źródła zadań z modułów operacyjnych", "Nawigacja AppShell"]}
      inProgress={["Widok listy + statusy", "Szybkie akcje (akceptuj/odrzuć)", "Filtrowanie po module"]}
      planned={["Powiadomienia push po przypisaniu", "Synchronizacja z kalendarzem", "Mobilny tryb offline"]}
    />
  );
}
