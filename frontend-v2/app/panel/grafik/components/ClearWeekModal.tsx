import { Modal } from "@/components/Modal";
import type { WeekRange } from "../types";

interface ClearWeekModalProps {
  open: boolean;
  range: WeekRange;
  shiftCount: number;
  clearing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearWeekModal({
  open,
  range,
  shiftCount,
  clearing,
  onClose,
  onConfirm,
}: ClearWeekModalProps) {
  return (
    <Modal
      open={open}
      title="Wyczyść tydzień"
      description="Usuń wszystkie zmiany z wybranego tygodnia. Ta akcja jest nieodwracalna."
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={clearing}>
            {clearing ? "Usuwanie..." : "Wyczyść tydzień"}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-surface-700">
        <p>
          Zakres: <span className="font-semibold">{range.label}</span>
        </p>
        <p>
          Liczba zmian do usunięcia: <span className="font-semibold">{shiftCount}</span>
        </p>
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
          ⚠️ Ostrzeżenie: Wszystkie zmiany z tego tygodnia zostaną trwale usunięte.
        </div>
      </div>
    </Modal>
  );
}
