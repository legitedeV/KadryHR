import { ModulePlaceholder } from "../../components/module-placeholder";

export default function ChatPage() {
  return (
    <ModulePlaceholder
      title="Chat zespołowy"
      description="Lista wątków, wiadomości i integracja z socketami dla komunikacji zespołu."
      status="Projektowanie"
      ready={["Modele Conversation/Message w API", "Routing do widoku", "Bezpieczne auth z tokenem"]}
      inProgress={["UI listy wątków i czatu", "Powiadomienia o nowych wiadomościach", "Zagnieżdżone odpowiedzi"]}
      planned={["Współdzielone notatki do zadań", "Transkrypcja audio", "Integracja z e-mail/Slack"]}
    />
  );
}
