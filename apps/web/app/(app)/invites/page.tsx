import { ModulePlaceholder } from "../../components/module-placeholder";

export default function InvitesPage() {
  return (
    <ModulePlaceholder
      title="Zaproszenia"
      description="Tworzenie i śledzenie zaproszeń e-mail do nowych użytkowników oraz przypisywanie ról."
      status="Do implementacji"
      ready={["Modele Invite w API", "Walidacja ról i tenantów", "Linki z pulpitu"]}
      inProgress={["UI generowania zaproszeń", "Przypisanie organizacji i roli", "Przypomnienia o wygasaniu"]}
      planned={["Linki magiczne i SSO", "Import listy zaproszeń", "Webhooki o przyjęciu zaproszenia"]}
    />
  );
}
