import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useScheduleData, useSelection } from '../features/scheduleBuilderV2/hooks';
import { AssistantPanel } from '../features/scheduleBuilderV2/components/AssistantPanel';
import { ScheduleGrid } from '../features/scheduleBuilderV2/components/ScheduleGrid';
import { SelectionToolbar } from '../features/scheduleBuilderV2/components/SelectionToolbar';
import { ShiftModal } from '../features/scheduleBuilderV2/components/ShiftModal';
import { GridSelection, ShiftAssignment, ShiftPayload } from '../features/scheduleBuilderV2/types';

function buildDays(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year, monthIndex - 1, 1);
  const days: string[] = [];
  while (date.getMonth() === monthIndex - 1) {
    days.push(date.toISOString().slice(0, 10));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const monthFormatter = new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' });

export default function ScheduleBuilderV2() {
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(defaultMonth);
  const [scale, setScale] = useState(1);
  const [modalData, setModalData] = useState<{ cell: GridSelection; shift?: ShiftAssignment } | null>(null);
  const gridContainer = useRef<HTMLDivElement>(null);

  const days = useMemo(() => buildDays(month), [month]);
  const { selection, clear, setRange } = useSelection();
  const schedule = useScheduleData(month);

  useEffect(() => {
    const prevOverflow = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';
    return () => {
      document.body.style.overflowY = prevOverflow;
    };
  }, []);

  useLayoutEffect(() => {
    const recalc = () => {
      if (!gridContainer.current) return;
      const height = gridContainer.current.scrollHeight;
      const available = window.innerHeight - 240;
      if (height > available) {
        const ratio = available / height;
        setScale(Math.min(1, Math.max(0.75, ratio)));
      } else {
        setScale(1);
      }
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [schedule.scheduleQuery.data, days]);

  const handleCellClick = (cell: GridSelection, shift?: ShiftAssignment) => {
    setModalData({ cell, shift });
  };

  const handleDropShift = (shiftId: string, cell: GridSelection) => {
    schedule.updateShift.mutate({ shiftId, employeeId: cell.employeeId, date: cell.date });
  };

  const handleModalSave = (payload: ShiftPayload & { shiftId?: string }) => {
    if (!modalData) return;
    const basePayload: ShiftPayload = {
      ...payload,
      employeeId: modalData.cell.employeeId,
      date: modalData.cell.date,
      type: payload.type,
      startTime: payload.startTime,
      endTime: payload.endTime,
      notes: payload.notes,
      breakMinutes: payload.breakMinutes,
      allowConflict: payload.allowConflict
    };

    if (modalData.shift) {
      schedule.updateShift.mutate(
        { ...basePayload, shiftId: modalData.shift._id },
        {
          onSuccess: () => {
            setModalData(null);
            schedule.clearConflicts();
          }
        }
      );
    } else {
      schedule.createShift.mutate(basePayload, {
        onSuccess: () => {
          setModalData(null);
          schedule.clearConflicts();
        }
      });
    }
  };

  const handleDelete = (shiftId: string) => {
    schedule.deleteShift.mutate(shiftId);
    setModalData(null);
  };

  const handleBulkSet = (payload: ShiftPayload & { cells: GridSelection[] }) => {
    payload.cells.forEach((cell) => {
      schedule.createShift.mutate({
        employeeId: cell.employeeId,
        date: cell.date,
        type: payload.type,
        startTime: payload.startTime,
        endTime: payload.endTime,
        breakMinutes: payload.breakMinutes,
        allowConflict: true
      });
    });
  };

  const handleClearCells = (cells: GridSelection[]) => {
    cells.forEach((cell) => {
      const shift = schedule.groupedShifts[cell.employeeId]?.[cell.date];
      if (shift) {
        schedule.deleteShift.mutate(shift._id);
      }
    });
  };

  const activeConflict = schedule.conflicts && modalData ? schedule.conflicts.details : undefined;

  const employees = schedule.employeesQuery.data || [];

  return (
    <div className="space-y-4 overflow-hidden" ref={gridContainer} style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Grafik — edycja manualna</h1>
          <p className="text-slate-500 text-sm">
            Priorytet: ręczna praca na siatce. Automatyzacje dostępne opcjonalnie w panelu bocznym.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm"
          />
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {monthFormatter.format(new Date(`${month}-01`))}
          </div>
        </div>
      </div>

      <SelectionToolbar selection={selection} onClear={clear} onSetShift={handleBulkSet} onClearCells={handleClearCells} />

      <div
        className="grid grid-cols-12 gap-4 h-full"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${100 / scale}%` }}
      >
        <div className="col-span-9 space-y-3 overflow-hidden">
          <ScheduleGrid
            employees={employees}
            days={days}
            shifts={schedule.groupedShifts}
            onCellClick={handleCellClick}
            onSelectionChange={setRange}
            selection={selection}
            onDropShift={handleDropShift}
          />
        </div>
        <div className="col-span-3 space-y-3">
          <AssistantPanel />
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm text-sm">
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="text-slate-600">{schedule.scheduleQuery.data?.schedule?.status || 'draft'}</p>
          </div>
        </div>
      </div>

      {modalData && (
        <ShiftModal
          open={Boolean(modalData)}
          date={modalData.cell.date}
          employeeName={`${employees.find((e) => e._id === modalData.cell.employeeId)?.firstName || ''} ${employees.find((e) => e._id === modalData.cell.employeeId)?.lastName || ''}`}
          initialShift={modalData.shift}
          onClose={() => {
            setModalData(null);
            schedule.clearConflicts();
          }}
          onSave={handleModalSave}
          onDelete={handleDelete}
          pending={schedule.createShift.isPending || schedule.updateShift.isPending}
          conflictDetails={activeConflict}
        />
      )}
    </div>
  );
}
