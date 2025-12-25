import { useMemo, useState } from 'react';
import { Employee, GridSelection, ShiftAssignment } from '../types';

type Props = {
  employees: Employee[];
  days: string[];
  shifts: Record<string, Record<string, ShiftAssignment>>;
  onCellClick: (cell: GridSelection, shift?: ShiftAssignment) => void;
  onSelectionChange: (cells: GridSelection[]) => void;
  selection: GridSelection[];
  onDropShift: (shiftId: string, cell: GridSelection) => void;
};

export function ScheduleGrid({ employees, days, shifts, onCellClick, onSelectionChange, selection, onDropShift }: Props) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<GridSelection | null>(null);
  const [dragShiftId, setDragShiftId] = useState<string | null>(null);

  const selectionSet = useMemo(() => new Set(selection.map((cell) => `${cell.employeeId}-${cell.date}`)), [selection]);

  const handleMouseDown = (cell: GridSelection) => {
    setIsSelecting(true);
    setSelectionStart(cell);
    onSelectionChange([cell]);
  };

  const handleMouseEnter = (cell: GridSelection) => {
    if (!isSelecting || !selectionStart) return;
    const startRow = employees.findIndex((e) => e._id === selectionStart.employeeId);
    const endRow = employees.findIndex((e) => e._id === cell.employeeId);
    const startCol = days.indexOf(selectionStart.date);
    const endCol = days.indexOf(cell.date);

    const rowRange = [startRow, endRow].sort((a, b) => a - b);
    const colRange = [startCol, endCol].sort((a, b) => a - b);

    const range: GridSelection[] = [];
    for (let r = rowRange[0]; r <= rowRange[1]; r++) {
      for (let c = colRange[0]; c <= colRange[1]; c++) {
        range.push({ employeeId: employees[r]._id, date: days[c] });
      }
    }
    onSelectionChange(range);
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
  };

  const getCellShift = (employeeId: string, date: string) => shifts[employeeId]?.[date];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm" onMouseUp={handleMouseUp}>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="w-48 px-3 py-2 text-left text-xs font-semibold text-slate-600">Pracownik</th>
              {days.map((day) => (
                <th key={day} className="px-2 py-2 text-center text-xs font-semibold text-slate-600 min-w-[64px]">
                  {day.split('-')[2]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-left text-slate-800 dark:text-slate-100">
                  <div className="font-semibold">{emp.firstName} {emp.lastName}</div>
                  <div className="text-xs text-slate-500">{emp.position || '—'}</div>
                </td>
                {days.map((day) => {
                  const cellKey = `${emp._id}-${day}`;
                  const shift = getCellShift(emp._id, day);
                  const isSelected = selectionSet.has(cellKey);
                  return (
                    <td
                      key={cellKey}
                      className={`relative px-1 py-1 text-center align-top ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white' : ''}`}
                      onMouseDown={() => handleMouseDown({ employeeId: emp._id, date: day })}
                      onMouseEnter={() => handleMouseEnter({ employeeId: emp._id, date: day })}
                      onDoubleClick={() => onCellClick({ employeeId: emp._id, date: day }, shift)}
                      onClick={() => onCellClick({ employeeId: emp._id, date: day }, shift)}
                      onDragOver={(e) => {
                        if (dragShiftId) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragShiftId) {
                          onDropShift(dragShiftId, { employeeId: emp._id, date: day });
                          setDragShiftId(null);
                        }
                      }}
                    >
                      <div
                        draggable={Boolean(shift)}
                        onDragStart={() => shift && setDragShiftId(shift._id)}
                        className={`min-h-[56px] cursor-pointer rounded-lg border border-dashed border-slate-200 bg-white/70 p-1 text-xs shadow-sm transition hover:border-blue-300 ${shift ? 'border-solid bg-blue-50' : ''}`}
                      >
                        {shift ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-800">
                              {shift.type === 'shift' ? `${shift.startTime}–${shift.endTime}` : shift.type}
                            </div>
                            {shift.notes && <div className="text-[11px] text-slate-500 line-clamp-2">{shift.notes}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
