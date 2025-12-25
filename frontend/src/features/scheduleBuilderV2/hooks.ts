import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createShift,
  deleteShift,
  fetchEmployees,
  fetchMonthSchedule,
  updateShift,
  upsertSchedule
} from './api';
import { GridSelection, MonthScheduleResponse, ShiftAssignment, ShiftPayload, UpdateShiftPayload } from './types';

const scheduleKey = (month: string) => ['schedule-month', month];

export function useScheduleData(month: string) {
  const queryClient = useQueryClient();
  const [conflicts, setConflicts] = useState<{
    action: 'create' | 'update';
    payload: ShiftPayload | UpdateShiftPayload;
    details: any[];
  } | null>(null);

  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees
  });

  const scheduleQuery = useQuery<MonthScheduleResponse>({
    queryKey: scheduleKey(month),
    queryFn: () => fetchMonthSchedule(month),
    enabled: Boolean(month)
  });

  const applyOptimistic = (
    updater: (current: MonthScheduleResponse | undefined) => MonthScheduleResponse,
    context: { previous?: MonthScheduleResponse }
  ) => {
    queryClient.setQueryData(scheduleKey(month), (current?: MonthScheduleResponse) => updater(current));
    return context;
  };

  const createShiftMutation = useMutation({
    mutationFn: (payload: ShiftPayload) => createShift(month, payload),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: scheduleKey(month) });
      const previous = queryClient.getQueryData<MonthScheduleResponse>(scheduleKey(month));
      const employee = employeesQuery.data?.find((item: any) => item._id === variables.employeeId);

      const optimisticShift: ShiftAssignment = {
        _id: `temp-${Date.now()}`,
        schedule: previous?.schedule?._id || 'temp',
        employee: employee || { _id: variables.employeeId, firstName: '...', lastName: '' },
        date: variables.date,
        type: variables.type,
        startTime: variables.startTime,
        endTime: variables.endTime,
        breakMinutes: variables.breakMinutes,
        notes: variables.notes
      } as ShiftAssignment;

      applyOptimistic((current) => {
        const next: MonthScheduleResponse = current || {
          schedule: {
            _id: 'temp',
            month,
            name: month,
            status: 'draft'
          } as any,
          shifts: []
        };

        return { ...next, shifts: [...(next.shifts || []), optimisticShift] };
      }, { previous });

      return { previous, optimisticId: optimisticShift._id };
    },
    onError: (error: any, _variables, context) => {
      if (error?.response?.status === 409) {
        setConflicts({ action: 'create', payload: _variables, details: error.response.data?.conflicts || [] });
      }
      if (context?.previous) {
        queryClient.setQueryData(scheduleKey(month), context.previous);
      }
    },
    onSuccess: ({ shift }, _variables, context) => {
      queryClient.setQueryData(scheduleKey(month), (current?: MonthScheduleResponse) => {
        if (!current) return current as any;
        const replaced = (current.shifts || []).map((item) => (item._id === context?.optimisticId ? shift : item));
        return { ...current, shifts: replaced };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKey(month) });
    }
  });

  const updateShiftMutation = useMutation({
    mutationFn: (payload: UpdateShiftPayload) => updateShift(month, payload),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: scheduleKey(month) });
      const previous = queryClient.getQueryData<MonthScheduleResponse>(scheduleKey(month));

      applyOptimistic((current) => {
        if (!current) return current as any;
        const shifts = (current.shifts || []).map((item) =>
          item._id === variables.shiftId
            ? { ...item, ...variables, employee: variables.employeeId ? { ...item.employee, _id: variables.employeeId } : item.employee }
            : item
        );
        return { ...current, shifts };
      }, { previous });

      return { previous };
    },
    onError: (error: any, variables, context) => {
      if (error?.response?.status === 409) {
        setConflicts({ action: 'update', payload: variables, details: error.response.data?.conflicts || [] });
      }
      if (context?.previous) {
        queryClient.setQueryData(scheduleKey(month), context.previous);
      }
    },
    onSuccess: ({ shift }) => {
      queryClient.setQueryData(scheduleKey(month), (current?: MonthScheduleResponse) => {
        if (!current) return current as any;
        const shifts = (current.shifts || []).map((item) => (item._id === shift._id ? shift : item));
        return { ...current, shifts };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKey(month) });
    }
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (shiftId: string) => deleteShift(month, shiftId),
    onMutate: async (shiftId) => {
      await queryClient.cancelQueries({ queryKey: scheduleKey(month) });
      const previous = queryClient.getQueryData<MonthScheduleResponse>(scheduleKey(month));

      applyOptimistic((current) => {
        if (!current) return current as any;
        const shifts = (current.shifts || []).filter((item) => item._id !== shiftId);
        return { ...current, shifts };
      }, { previous });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(scheduleKey(month), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKey(month) });
    }
  });

  const scheduleMutation = useMutation({
    mutationFn: (payload: Partial<{ name: string; status: string; notes?: string }>) => upsertSchedule(month, payload),
    onSuccess: ({ schedule }) => {
      queryClient.setQueryData(scheduleKey(month), (current?: MonthScheduleResponse) => {
        if (!current) return current as any;
        return { ...current, schedule };
      });
    }
  });

  const groupedShifts = useMemo(() => {
    if (!scheduleQuery.data) return {} as Record<string, Record<string, ShiftAssignment>>;
    const map: Record<string, Record<string, ShiftAssignment>> = {};
    scheduleQuery.data.shifts.forEach((shift) => {
      const dateKey = shift.date.slice(0, 10);
      if (!map[shift.employee._id]) map[shift.employee._id] = {};
      map[shift.employee._id][dateKey] = shift;
    });
    return map;
  }, [scheduleQuery.data]);

  return {
    employeesQuery,
    scheduleQuery,
    groupedShifts,
    createShift: createShiftMutation,
    updateShift: updateShiftMutation,
    deleteShift: deleteShiftMutation,
    scheduleMutation,
    conflicts,
    clearConflicts: () => setConflicts(null)
  };
}

export function useSelection() {
  const [selection, setSelection] = useState<GridSelection[]>([]);

  const toggleCell = (cell: GridSelection) => {
    setSelection((prev) => {
      const exists = prev.find((item) => item.employeeId === cell.employeeId && item.date === cell.date);
      if (exists) {
        return prev.filter((item) => !(item.employeeId === cell.employeeId && item.date === cell.date));
      }
      return [...prev, cell];
    });
  };

  const setRange = (range: GridSelection[]) => setSelection(range);
  const clear = () => setSelection([]);

  return { selection, toggleCell, setRange, clear };
}
