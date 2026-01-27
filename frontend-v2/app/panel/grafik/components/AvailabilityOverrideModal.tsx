import { Modal } from "@/components/Modal";

interface AvailabilityOverrideModalProps {
  open: boolean;
  severity: "partial" | "outside";
  reason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function AvailabilityOverrideModal({
  open,
  severity,
  reason,
  onReasonChange,
  onConfirm,
  onClose,
}: AvailabilityOverrideModalProps) {
  const title = severity === "outside" ? "Zmiana poza dostępnością" : "Zmiana częściowo poza dostępnością";
  const description =
    severity === "outside"
      ? "Wybrana zmiana jest całkowicie poza zadeklarowaną dostępnością pracownika. Podaj powód, aby kontynuować."
      : "Wybrana zmiana częściowo wykracza poza dostępność pracownika. Podaj powód lub potwierdź decyzję.";

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn-primary" onClick={onConfirm} disabled={severity === "outside" && !reason.trim()}>
            Potwierdź
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-surface-700">
        <label className="space-y-1 text-sm font-medium text-surface-700">
          Powód nadpisania dostępności
          <textarea
            className="input min-h-[80px]"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Np. zastępstwo, pilne zadanie"
          />
        </label>
        {severity === "outside" && !reason.trim() && (
          <p className="text-xs text-rose-600">Powód jest wymagany, aby kontynuować.</p>
        )}
      </div>
    </Modal>
  );
}
