import api from '../../api/axios';
import { MonthScheduleResponse, ShiftPayload, UpdateShiftPayload } from './types';

export async function fetchMonthSchedule(month: string): Promise<MonthScheduleResponse> {
  const { data } = await api.get(`/schedules/${month}`);
  return data;
}

export async function upsertSchedule(month: string, payload: Partial<{ name: string; status: string; notes?: string }>) {
  const { data } = await api.put(`/schedules/${month}`, payload);
  return data;
}

export async function createShift(month: string, payload: ShiftPayload) {
  const { data } = await api.post(`/schedules/${month}/shifts`, payload);
  return data;
}

export async function updateShift(month: string, payload: UpdateShiftPayload) {
  const { shiftId, ...body } = payload;
  const { data } = await api.put(`/schedules/${month}/shifts/${shiftId}`, body);
  return data;
}

export async function deleteShift(month: string, shiftId: string) {
  const { data } = await api.delete(`/schedules/${month}/shifts/${shiftId}`);
  return data;
}

export async function fetchEmployees() {
  const { data } = await api.get('/employees');
  return data.employees || [];
}
