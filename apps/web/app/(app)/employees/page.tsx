import { ModulePlaceholder } from "../../components/module-placeholder";

export default function EmployeesPage() {
  return (
    <ModulePlaceholder
      title="Katalog pracowników"
      description="Widok listy, kontrakty, dostępności i struktura zespołów."
      status="Brak widoku V2"
      ready={["Model Employee w API", "Dane ról organizacyjnych", "Linki z pulpitu i grafiku"]}
      inProgress={["Lista z wyszukiwaniem i filtrami", "Profile stanowisk i umów", "Podgląd dostępności"]}
      planned={["Import z CSV/HRIS", "Widoki menedżera liniowego", "Self-service danych pracownika"]}
    />
  );
}
