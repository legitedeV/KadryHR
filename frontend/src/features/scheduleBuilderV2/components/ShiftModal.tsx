import { useEffect, useState } from 'react';
import { ShiftAssignment, ShiftType, ShiftPayload } from '../types';

type Props = {
  open: boolean;
  date: string;
  employeeName: string;
  initialShift?: ShiftAssignment;
  onClose: () => void;
  onSave: (payload: ShiftPayload & { shiftId?: string }) => void;
  onDelete?: (shiftId: string) => void;
  pending?: boolean;
  conflictDetails?: any[];
};

const shiftTypes: { value: ShiftType; label: string }[] = [
  { value: 'shift', label: 'Zmiana' },
  { value: 'leave', label: 'Urlop' },
  { value: 'sick', label: 'L4' },
  { value: 'off', label: 'Wolne' },
  { value: 'holiday', label: 'Święto' }
];

export function ShiftModal({
  open,
  date,
  employeeName,
  initialShift,
  onClose,
  onSave,
  onDelete,
  pending,
  conflictDetails
}: Props) {
  const [type, setType] = useState<ShiftType>(initialShift?.type || 'shift');
  const [startTime, setStartTime] = useState(initialShift?.startTime || '08:00');
  const [endTime, setEndTime] = useState(initialShift?.endTime || '16:00');
  const [breakMinutes, setBreakMinutes] = useState(initialShift?.breakMinutes ?? 0);
  const [notes, setNotes] = useState(initialShift?.notes || '');
  const [allowConflict, setAllowConflict] = useState(false);

  useEffect(() => {
    if (initialShift) {
      setType(initialShift.type);
      setStartTime(initialShift.startTime || '08:00');
      setEndTime(initialShift.endTime || '16:00');
      setBreakMinutes(initialShift.breakMinutes || 0);
      setNotes(initialShift.notes || '');
    } else {
      setType('shift');
      setStartTime('08:00');
      setEndTime('16:00');
      setBreakMinutes(0);
      setNotes('');
    }
    setAllowConflict(false);
  }, [initialShift, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      shiftId: initialShift?._id,
      employeeId: initialShift?.employee?._id || '',
      date,
      type,
      startTime,
      endTime,
      breakMinutes,
      notes,
      allowConflict
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{employeeName}</p>
            <h2 className="text-xl font-semibold">{initialShift ? 'Edytuj zmianę' : 'Dodaj zmianę'}</h2>
            <p className="text-sm text-slate-500">{date}</p>
          </div>
          <button className="text-slate-500 hover:text-slate-800" onClick={onClose} aria-label="Zamknij">
            ✕
          </button>
        </div>

        {conflictDetails && conflictDetails.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-semibold mb-1">Wykryto konflikt</p>
            <ul className="list-disc pl-4 space-y-1">
              {conflictDetails.map((conflict) => (
                <li key={conflict.id}>
                  {conflict.type} {conflict.startTime ? `${conflict.startTime}-${conflict.endTime}` : 'cały dzień'}
                </li>
              ))}
            </ul>
            <label className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowConflict}
                onChange={(e) => setAllowConflict(e.target.checked)}
              />
              <span>Pomiń konflikt i zapisz mimo wszystko</span>
            </label>
          </div>
        )}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-600">
              Typ zmiany
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm dark:bg-slate-800"
                value={type}
                onChange={(e) => setType(e.target.value as ShiftType)}
              >
                {shiftTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              Przerwa (min)
              <input
                type="number"
                min={0}
                max={720}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm dark:bg-slate-800"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
              />
            </label>
          </div>

          {type === 'shift' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-600">
                Start
                <input
                  type="time"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm dark:bg-slate-800"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </label>
              <label className="text-sm text-slate-600">
                Koniec
                <input
                  type="time"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm dark:bg-slate-800"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </label>
            </div>
          )}

          <label className="text-sm text-slate-600 block">
            Notatka
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm dark:bg-slate-800"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </label>

          <div className="flex justify-between items-center pt-2">
            {initialShift && onDelete ? (
              <button
                type="button"
                className="text-red-600 hover:text-red-700 text-sm"
                onClick={() => onDelete(initialShift._id)}
              >
                Usuń zmianę
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                onClick={onClose}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                disabled={pending}
              >
                Zapisz
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
