import { ApiClient } from "@/lib/api-client";

export type TimeEntryEvent = "CLOCK_IN" | "CLOCK_OUT" | "BREAK_START" | "BREAK_END" | "MANUAL";
export type TimeEntrySource = "QUICK_ACTION" | "QR" | "MANUAL";

export type TimeEntry = {
  id: string;
  orgId?: string;
  employeeId: string;
  recordedById?: string | null;
  event: TimeEntryEvent;
  source: TimeEntrySource;
  occurredAt: string;
  manualStartedAt?: string | null;
  manualEndedAt?: string | null;
  location?: string | null;
  note?: string | null;
  createdAt?: string;
  employee?: { id: string; name: string };
  recordedBy?: { id: string; fullName?: string | null; email?: string };
};

export type TimeStatus = {
  state: "working" | "on_break" | "clocked_out";
  lastEvent: TimeEntry | null;
  since: string | null;
};

export type StatusResponse = {
  employee: { id: string; name: string };
  status: TimeStatus;
  recent: TimeEntry[];
};

export type ReportResponse = {
  range: { start: string; end: string; days: number };
  totals: { minutes: number; hours: number };
  daily: { date: string; minutes: number }[];
};

export async function fetchStatus(api: ApiClient, employeeId: string) {
  return api.get<StatusResponse>("/time-tracking/status", { query: { employeeId } });
}

export async function fetchRecent(api: ApiClient, employeeId?: string) {
  return api.get<TimeEntry[]>("/time-tracking/recent", { query: employeeId ? { employeeId } : undefined });
}

export async function recordEvent(
  api: ApiClient,
  payload: { employeeId: string; event: TimeEntryEvent; source?: TimeEntrySource; note?: string; location?: string },
) {
  return api.post<{ entry: TimeEntry; status: TimeStatus }>("/time-tracking/events", payload);
}

export async function createManualEntry(api: ApiClient, payload: {
  employeeId: string;
  startedAt: string;
  endedAt: string;
  source?: TimeEntrySource;
  location?: string;
  note?: string;
}) {
  return api.post<{ entry: TimeEntry; status: TimeStatus }>("/time-tracking/manual", payload);
}

export async function fetchReport(api: ApiClient, employeeId?: string, days = 7) {
  return api.get<ReportResponse>("/time-tracking/report", { query: { employeeId, days } });
}

export async function generateQr(api: ApiClient, payload: { locationLabel: string; employeeId?: string; note?: string }) {
  return api.post<{ token: string; payload: Record<string, unknown>; qrDataUrl: string }>("/time-tracking/qr", payload);
}
