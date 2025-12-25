export type ShiftType = 'shift' | 'leave' | 'off' | 'sick' | 'holiday';

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  position?: string;
}

export interface ScheduleSummary {
  _id: string;
  month: string;
  year?: number;
  name: string;
  status: 'draft' | 'published' | 'archived';
  notes?: string;
}

export interface ShiftAssignment {
  _id: string;
  schedule: string;
  employee: Employee;
  date: string;
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  notes?: string;
}

export interface MonthScheduleResponse {
  schedule: ScheduleSummary;
  shifts: ShiftAssignment[];
}

export interface ShiftPayload {
  employeeId: string;
  date: string;
  type: ShiftType;
  startTime?: string;
  endTime?: string;
  notes?: string;
  breakMinutes?: number;
  allowConflict?: boolean;
}

export interface UpdateShiftPayload extends Partial<ShiftPayload> {
  shiftId: string;
}

export interface GridSelection {
  employeeId: string;
  date: string;
}
