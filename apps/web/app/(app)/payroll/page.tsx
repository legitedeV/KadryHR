import { ModulePlaceholder } from "../../components/module-placeholder";

export default function PayrollPage() {
  return (
    <ModulePlaceholder
      title="Payroll"
      description="Wyliczenia wynagrodzeń na podstawie czasu pracy, stawek i potrąceń."
      status="Backlog"
      ready={["Modele czasu pracy i stawki w API", "Eksport csv w legacy", "Podstawowe raporty czasu"]}
      inProgress={["Rozliczenie nadgodzin i dodatków", "Walidacje listy płac", "Podgląd wyniku dla menedżera"]}
      planned={["Integracje z systemami płacowymi", "E-paski i akceptacje", "Automatyczne podatki/składki"]}
    />
  );
}
