import { EmployeeContractRecord } from "@/lib/api";

type EmployeeContractsListProps = {
  contracts: EmployeeContractRecord[];
  contractTypeLabels: Record<EmployeeContractRecord["contractType"], string>;
  contractStatusLabels: Record<EmployeeContractRecord["status"], string>;
  formatCurrency: (amount: number, currency?: string) => string;
  onEdit: (contract: EmployeeContractRecord) => void;
  onTerminate: (contractId: string) => void;
};

export function EmployeeContractsList({
  contracts,
  contractTypeLabels,
  contractStatusLabels,
  formatCurrency,
  onEdit,
  onTerminate,
}: EmployeeContractsListProps) {
  return (
    <div className="mt-4 space-y-3">
      {contracts.map((contract, index) => (
        <div
          key={contract.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-200 bg-surface-50 p-4"
        >
          <div>
            <p className="font-medium text-surface-900">{contractTypeLabels[contract.contractType]}</p>
            <p className="text-xs text-surface-600">
              {contract.hourlyRate != null
                ? `${formatCurrency(contract.hourlyRate, contract.currency ?? "PLN")} / h`
                : "Brak stawki"}
            </p>
            <p className="text-xs text-surface-500">
              {new Date(contract.validFrom).toLocaleDateString("pl-PL")}
              {contract.validTo ? ` – ${new Date(contract.validTo).toLocaleDateString("pl-PL")}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                contract.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-surface-200 text-surface-700"
              }`}
            >
              {contractStatusLabels[contract.status]}
            </span>
            {index === 0 && (
              <button type="button" onClick={() => onEdit(contract)} className="btn-secondary">
                Edytuj
              </button>
            )}
            {contract.status === "ACTIVE" && (
              <button type="button" onClick={() => onTerminate(contract.id)} className="btn-secondary">
                Zakończ umowę
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
