import { Modal } from "@/components/Modal";
import type { EmployeeRecord, LocationRecord } from "@/lib/api";
import type { ShiftFormState } from "../types";
import { SHIFT_COLORS, SHIFT_TEMPLATES } from "../constants";

interface ShiftEditorModalProps {
  open: boolean;
  isEditing: boolean;
  form: ShiftFormState;
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onReset: () => void;
  onSave: () => void;
  onFormChange: (next: ShiftFormState) => void;
}

export function ShiftEditorModal({
  open,
  isEditing,
  form,
  employees,
  locations,
  saving,
  formError,
  onClose,
  onReset,
  onSave,
  onFormChange,
}: ShiftEditorModalProps) {
  return (
    <Modal
      open={open}
      title={isEditing ? "Edytuj zmianę" : "Dodaj zmianę"}
      description="Uzupełnij szczegóły zmiany i przypisz pracownika."
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn-secondary" type="button" onClick={onReset} disabled={saving}>
            Wyczyść
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zapisz"}
          </button>
        </>
      }
    >
      <div className="mb-4">
        <p className="text-xs font-medium text-surface-600 dark:text-surface-400 mb-2">Szybkie szablony:</p>
        <div className="flex flex-wrap gap-2">
          {SHIFT_TEMPLATES.map((template) => (
            <button
              key={template.name}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-brand-400 dark:hover:border-brand-700"
              style={{
                borderColor: template.color + "50",
                backgroundColor: template.color + "15",
                color: template.color,
              }}
              onClick={() =>
                onFormChange({
                  ...form,
                  startTime: template.startTime,
                  endTime: template.endTime,
                  color: template.color,
                })
              }
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: template.color }} />
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
          Pracownik
          <select
            className="input"
            value={form.employeeId}
            onChange={(e) => onFormChange({ ...form, employeeId: e.target.value })}
          >
            <option value="">Wybierz pracownika</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {`${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.email}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
          Lokalizacja
          <select
            className="input"
            value={form.locationId ?? ""}
            onChange={(e) => onFormChange({ ...form, locationId: e.target.value || undefined })}
          >
            <option value="">Brak lokalizacji</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
          Data
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => onFormChange({ ...form, date: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
          Godzina startu
          <input
            type="time"
            className="input"
            value={form.startTime}
            onChange={(e) => onFormChange({ ...form, startTime: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
          Godzina końca
          <input
            type="time"
            className="input"
            value={form.endTime}
            onChange={(e) => onFormChange({ ...form, endTime: e.target.value })}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
          Stanowisko / rola
          <input
            type="text"
            className="input"
            value={form.position}
            onChange={(e) => onFormChange({ ...form, position: e.target.value })}
            placeholder="np. Barista"
          />
        </label>
        <div className="space-y-1">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-200">Kolor zmiany</span>
          <div className="flex flex-wrap gap-2">
            {SHIFT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-7 h-7 rounded-md border-2 transition ${
                  form.color === color
                    ? "border-surface-900 dark:border-white ring-2 ring-brand-400"
                    : "border-transparent hover:border-surface-300 dark:hover:border-surface-600"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onFormChange({ ...form, color })}
                title={color}
              />
            ))}
            <button
              type="button"
              className={`w-7 h-7 rounded-md border-2 transition flex items-center justify-center ${
                !form.color
                  ? "border-surface-900 dark:border-white ring-2 ring-brand-400 bg-surface-100 dark:bg-surface-800"
                  : "border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-surface-50 dark:bg-surface-900"
              }`}
              onClick={() => onFormChange({ ...form, color: "" })}
              title="Brak koloru"
            >
              <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <label className="space-y-1 text-sm font-medium text-surface-700 dark:text-surface-200">
        Notatki
        <textarea
          className="input min-h-[70px]"
          value={form.notes}
          onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
          placeholder="Dodatkowe instrukcje dla zmiany"
        />
      </label>

      {formError && <p className="text-sm text-rose-600 dark:text-rose-300">{formError}</p>}
    </Modal>
  );
}
