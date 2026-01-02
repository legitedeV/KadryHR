import { apiClient, API_BASE_URL } from "./api-client";
import { clearAuthTokens, getAuthTokens } from "./auth";
import { pushToast } from "./toast";

export { API_BASE_URL };

export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Shift {
  id: string;
  employeeName: string | null;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  locationName: string;
  status: "ASSIGNED" | "UNASSIGNED";
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  locationName: string;
  active: boolean;
}

export const REQUEST_TYPES = {
  VACATION: "VACATION",
  SICK: "SICK",
  SHIFT_GIVE: "SHIFT_GIVE",
  SHIFT_SWAP: "SHIFT_SWAP",
} as const;

export type RequestType = (typeof REQUEST_TYPES)[keyof typeof REQUEST_TYPES];

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RequestItem {
  id: string;
  employeeName: string;
  type: RequestType;
  status: RequestStatus;
  date: string;
  details: string;
}

const AUTH_PREFIX = "/auth";
const SHIFTS_PREFIX = "/shifts";
const EMPLOYEES_PREFIX = "/employees";
const AVAILABILITY_PREFIX = "/availability";

export async function apiLogin(email: string, password: string) {
  const data = await apiClient.request<LoginResponse>(`${AUTH_PREFIX}/login`, {
    method: "POST",
    auth: false,
    suppressToast: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const user = data?.user ?? {};
  const tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
  apiClient.setTokens(tokens);

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      role: isUserRole(user.role) ? user.role : "EMPLOYEE",
      name: formatUserName(user),
    },
  };
}

export async function apiGetMe(): Promise<User> {
  apiClient.hydrateFromStorage();
  const data = await apiClient.request<UserResponse>(`${AUTH_PREFIX}/me`, {
    suppressToast: true,
  });

  return {
    ...data,
    role: isUserRole(data.role) ? data.role : "EMPLOYEE",
    name: formatUserName(data),
  } as User;
}

export async function apiGetShifts(from: string, to: string): Promise<Shift[]> {
  apiClient.hydrateFromStorage();
  const data = await apiClient.request<ShiftResponse[]>(`${SHIFTS_PREFIX}`);
  const inRange = data.filter((s) => {
    const date = new Date(s.startsAt);
    const iso = date.toISOString().slice(0, 10);
    return iso >= from && iso <= to;
  });

  return inRange.map((s) => {
    const startsAt = new Date(s.startsAt);
    const endsAt = new Date(s.endsAt);
    return {
      id: s.id,
      employeeName:
        s.employee?.firstName || s.employee?.lastName
          ? `${s.employee.firstName ?? ""} ${s.employee.lastName ?? ""}`.trim()
          : null,
      date: startsAt.toISOString().slice(0, 10),
      start: formatTime(startsAt),
      end: formatTime(endsAt),
      locationName: s.location?.name ?? "Lokalizacja nieznana",
      status: s.employeeId ? "ASSIGNED" : "UNASSIGNED",
    } satisfies Shift;
  });
}

export async function apiGetEmployees(): Promise<Employee[]> {
  apiClient.hydrateFromStorage();
  const data = await apiClient.request<EmployeeResponse[]>(`${EMPLOYEES_PREFIX}`);
  return data.map((e) => ({
    id: e.id,
    name: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.email || "Pracownik",
    role: e.position ?? "Sprzedawca",
    locationName: e.defaultLocation?.name ?? "—",
    active: true,
  }));
}

export async function apiGetRequests(): Promise<RequestItem[]> {
  apiClient.hydrateFromStorage();
  const [availabilityRes, employees] = await Promise.all([
    apiClient.request<AvailabilityResponse[]>(`${AVAILABILITY_PREFIX}`, {
      suppressToast: true,
    }),
    apiGetEmployees(),
  ]);

  const byEmployee = new Map(employees.map((e) => [e.id, e.name]));

  return availabilityRes.map((item) => {
    const date = item.date
      ? new Date(item.date)
      : item.weekday
      ? nextWeekday(item.weekday)
      : new Date();
    const note = (item.notes ?? "").toLowerCase();
    const details = `${minutesToLabel(item.startMinutes)}–${minutesToLabel(
      item.endMinutes
    )}${item.notes ? ` · ${item.notes}` : ""}`;
    const status: RequestStatus = note.includes("zatwierd") // zatwierdzone
      ? "APPROVED"
      : note.includes("odrzuc")
      ? "REJECTED"
      : "PENDING";

    return {
      id: item.id,
      employeeName: byEmployee.get(item.employeeId) ?? "Pracownik",
      type: inferRequestType(item),
      status,
      date: date.toISOString(),
      details,
    };
  });
}

interface AvailabilityResponse {
  id: string;
  organisationId: string;
  employeeId: string;
  date: string | null;
  weekday: string | null;
  startMinutes: number;
  endMinutes: number;
  notes?: string | null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

interface UserResponse {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface ShiftResponse {
  id: string;
  employeeId?: string | null;
  employee?: { firstName?: string | null; lastName?: string | null };
  location?: { name?: string | null };
  startsAt: string;
  endsAt: string;
}

interface EmployeeResponse {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  position?: string | null;
  defaultLocation?: { name?: string | null };
}

function formatTime(date: Date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function minutesToLabel(total: number) {
  const h = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function nextWeekday(weekday: string) {
  const map: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0,
  };
  const target = map[weekday] ?? 0;
  const today = new Date();
  const date = new Date(today);
  const diff = (target + 7 - today.getDay()) % 7 || 7;
  date.setDate(today.getDate() + diff);
  return date;
}

function formatUserName(
  user:
    | Partial<{
        firstName: string | null;
        lastName: string | null;
        email: string | null;
      }>
    | null
    | undefined
) {
  const first = typeof user?.firstName === "string" ? user.firstName : "";
  const last = typeof user?.lastName === "string" ? user.lastName : "";
  const email = typeof user?.email === "string" ? user.email : "";
  const name = `${first} ${last}`.trim();
  return name || email;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "OWNER" || value === "MANAGER" || value === "EMPLOYEE";
}

function inferRequestType(item: AvailabilityResponse): RequestType {
  const note = (item.notes ?? "").toLowerCase();
  if (note.includes("chorob")) return REQUEST_TYPES.SICK;
  if (note.includes("urlop")) return REQUEST_TYPES.VACATION;
  if (item.weekday) return REQUEST_TYPES.SHIFT_SWAP;
  return REQUEST_TYPES.SHIFT_GIVE;
}

export function ensureSessionOrRedirect(callback: () => void) {
  const tokens = getAuthTokens();
  if (!tokens) {
    clearAuthTokens();
    pushToast({
      title: "Zaloguj się ponownie",
      description: "Twoja sesja wygasła.",
      variant: "warning",
    });
    callback();
  } else {
    apiClient.setTokens(tokens, false);
  }
}
