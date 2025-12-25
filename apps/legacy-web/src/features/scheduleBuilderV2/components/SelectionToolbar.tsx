import { GridSelection, ShiftPayload, ShiftType } from '../types';

type Props = {
  selection: GridSelection[];
  onClear: () => void;
  onSetShift: (payload: ShiftPayload & { cells: GridSelection[] }) => void;
  onClearCells: (cells: GridSelection[]) => void;
};

const quickTypes: { value: ShiftType; label: string; start?: string; end?: string }[] = [
  { value: 'shift', label: '8-16', start: '08:00', end: '16:00' },
  { value: 'shift', label: '10-18', start: '10:00', end: '18:00' },
  { value: 'off', label: 'Wolne' },
  { value: 'sick', label: 'L4' }
];

export function SelectionToolbar({ selection, onClear, onSetShift, onClearCells }: Props) {
  if (selection.length === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm shadow-sm">
      <div className="text-slate-700">
        Zaznaczono <strong>{selection.length}</strong> pól
      </div>
      <div className="flex items-center gap-2">
        {quickTypes.map((qt) => (
          <button
            key={qt.label}
            className="rounded-lg border border-slate-200 px-3 py-1 hover:border-blue-300 hover:text-blue-700"
            onClick={() =>
              onSetShift({
                cells: selection,
                employeeId: '',
                date: '',
                type: qt.value,
                startTime: qt.start,
                endTime: qt.end,
                breakMinutes: 0
              })
            }
          >
            {qt.label}
          </button>
        ))}
        <button
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 hover:border-rose-300"
          onClick={() => onClearCells(selection)}
        >
          Wyczyść
        </button>
        <button className="text-slate-500 hover:text-slate-700" onClick={onClear}>
          Anuluj zaznaczenie
        </button>
      </div>
    </div>
  );
}
