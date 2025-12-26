import { ModulePlaceholder } from "../../components/module-placeholder";

export default function PermissionsPage() {
  return (
    <ModulePlaceholder
      title="Role i uprawnienia"
      description="Granularne uprawnienia per moduł i organizacja, w tym promowanie adminów oraz delegowanie uprawnień."
      status="Po stronie API"
      ready={["Skrypty promote/demote admin", "Model ról ORGANIZATION", "RBAC w AppShell"]}
      inProgress={["UI do zarządzania rolami", "Matryca uprawnień per moduł", "Podgląd audytu zmian"]}
      planned={["Szablony ról niestandardowych", "Eksport/backup polityk", "Automatyczne nadawanie przy onboardingu"]}
    />
  );
}
