import { ModulePlaceholder } from "../../components/module-placeholder";

export default function NotificationsPage() {
  return (
    <ModulePlaceholder
      title="Centrum powiadomień"
      description="Lista alertów z całego systemu, możliwość oznaczania jako przeczytane i usuwania. Obecnie korzysta z API V2, UI wymaga dopracowania."
      status="W trakcie domykania"
      ready={[
        "Endpointy mark-all-read i delete",
        "Widok listy w AllNotifications",
        "Powiadomienia z urlopów i grafików",
      ]}
      inProgress={["Filtry po typie/priorytecie", "Websocket push + badge w nawigacji"]}
      planned={["Ustawienia preferencji kanałów", "Bulk actions i archiwum"]}
    />
  );
}
