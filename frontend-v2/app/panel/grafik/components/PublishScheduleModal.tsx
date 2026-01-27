import { Modal } from "@/components/Modal";
import type { WeekRange } from "../types";

interface PublishScheduleModalProps {
  open: boolean;
  range: WeekRange;
  publishing: boolean;
  onClose: () => void;
  onPublish: () => void;
}

export function PublishScheduleModal({
  open,
  range,
  publishing,
  onClose,
  onPublish,
}: PublishScheduleModalProps) {
  return (
    <Modal
      open={open}
      title="Opublikuj grafik"
      description="Powiadom pracowników o opublikowaniu grafiku na wybrany tydzień."
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn-primary" onClick={onPublish} disabled={publishing}>
            {publishing ? "Publikowanie..." : "Wyślij powiadomienia"}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-surface-700">
        <p>
          Zakres: <span className="font-semibold">{range.label}</span>
        </p>
        <p>Powiadomienia zostaną wysłane do wszystkich pracowników przypisanych do zmian w tym tygodniu.</p>
      </div>
    </Modal>
  );
}
