import { ApiClient } from "@/app/lib/api-client";

export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: "ANNUAL" | "ON_DEMAND" | "UNPAID" | "OCCASIONAL" | "SICK";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  startDate: string;
  endDate: string;
  reason?: string | null;
  decisionNote?: string | null;
  createdAt: string;
  employee?: { id: string; name: string };
};

export type LeaveFilters = {
  status?: LeaveRequest["status"] | "all";
  type?: LeaveRequest["type"] | "all";
  employeeId?: string;
};

export async function fetchLeaves(api: ApiClient, filters: LeaveFilters = {}) {
  const query: Record<string, string> = {};
  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.type && filters.type !== "all") query.type = filters.type;
  if (filters.employeeId) query.employeeId = filters.employeeId;
  return api.get<LeaveRequest[]>("/leaves", { query });
}

export async function submitLeave(api: ApiClient, payload: {
  employeeId: string;
  type: LeaveRequest["type"];
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  return api.post<LeaveRequest>("/leaves", payload);
}

export async function updateLeave(api: ApiClient, id: string, payload: Partial<Omit<LeaveRequest, "id" | "employee" | "status">>) {
  return api.put<LeaveRequest>(`/leaves/${id}`, payload);
}

export async function actOnLeave(
  api: ApiClient,
  id: string,
  action: "approve" | "reject" | "cancel",
  payload?: { note?: string },
) {
  return api.post<LeaveRequest>(`/leaves/${id}/${action}`, payload || {});
}
