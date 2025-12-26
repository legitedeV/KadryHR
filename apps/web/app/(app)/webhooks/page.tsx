import { ModulePlaceholder } from "../../components/module-placeholder";

export default function WebhooksPage() {
  return (
    <ModulePlaceholder
      title="Webhooki"
      description="Konfiguracja outbound webhooków do integracji z zewnętrznymi systemami (BI, płace, ITSM)."
      status="Backlog"
      ready={["Modele eventów w API", "Status health do monitoringu", "Konfiguracja bazowego CORS"]}
      inProgress={["Panel tworzenia endpointów", "Podpisy HMAC i retry", "Logi dostarczania"]}
      planned={["Szablony integracji (Slack/Teams)", "Filtry po module", "On/off per organizacja"]}
    />
  );
}
