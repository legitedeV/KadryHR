import { ModulePlaceholder } from "../../components/module-placeholder";

export default function ProfilePage() {
  return (
    <ModulePlaceholder
      title="Profil użytkownika"
      description="Edycja danych konta, hasła i preferencji powiadomień w ramach wybranej organizacji."
      status="W planie sprintu"
      ready={["Dane profilu z endpointu /auth/me", "Kontekst organizacji i ról", "Mechanizm wylogowania / refresh"]}
      inProgress={["Formularz edycji danych osobowych", "Zmiana hasła z weryfikacją", "Preferencje email/push"]}
      planned={["Avatar + upload", "Oś audytowa zmian", "Delegacje i podpisy elektroniczne"]}
    />
  );
}
