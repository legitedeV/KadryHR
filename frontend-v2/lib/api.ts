export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3000";

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

export type RequestType = "VACATION" | "SICK" | "SHIFT_GIVE" | "SHIFT_SWAP";

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
  const res = await fetch(`${API_BASE_URL}${AUTH_PREFIX}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nieprawidłowy login lub hasło");
  }

  const data = await res.json();
  const userName =
    (typeof data?.user?.firstName === "string" || typeof data?.user?.lastName === "string"
      ? `${data.user.firstName ?? ""} ${data.user.lastName ?? ""}`.trim()
      : undefined) ?? data?.user?.email ?? "";

  const user = data?.user ?? {};

  return {
    accessToken: data.accessToken as string,
    user: {
      id: user.id,
      email: user.email,
      role: (user.role as UserRole) ?? "EMPLOYEE",
      name: userName,
    },
  };
}

export async function apiGetMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}${AUTH_PREFIX}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nie udało się pobrać danych użytkownika");
  }

  const data = await res.json();
  return {
    ...data,
    name: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || data.email,
  } as User;
}

export async function apiGetShifts(
  token: string,
  from: string,
  to: string
): Promise<Shift[]> {
  const res = await fetch(`${API_BASE_URL}${SHIFTS_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nie udało się pobrać grafiku");
  }

  const data: ShiftResponse[] = await res.json();
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

export async function apiGetEmployees(token: string): Promise<Employee[]> {
  const res = await fetch(`${API_BASE_URL}${EMPLOYEES_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nie udało się pobrać listy pracowników");
  }

  const data: EmployeeResponse[] = await res.json();
  return data.map((e) => ({
    id: e.id,
    name: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.email || "Pracownik",
    role: e.position ?? "Sprzedawca",
    locationName: e.defaultLocation?.name ?? "—",
    active: true,
  }));
}

interface Availability {
  id: string;
  employeeId: string;
  date: string | null;
  weekday: string | null;
  startMinutes: number;
  endMinutes: number;
  notes?: string | null;
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

export async function apiGetRequests(token: string): Promise<RequestItem[]> {
  const [availabilityRes, employees] = await Promise.all([
    fetch(`${API_BASE_URL}${AVAILABILITY_PREFIX}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    apiGetEmployees(token),
  ]);

  if (!availabilityRes.ok) {
    const msg = await safeErrorMessage(availabilityRes);
    throw new Error(msg || "Nie udało się pobrać wniosków");
  }

  const items = (await availabilityRes.json()) as Availability[];
  const byEmployee = new Map(employees.map((e) => [e.id, e.name]));

  return items.map((item) => {
    const date = item.date
      ? new Date(item.date)
      : item.weekday
      ? nextWeekday(item.weekday)
      : new Date();
    const details = `${minutesToLabel(item.startMinutes)}–${minutesToLabel(
      item.endMinutes
    )}${item.notes ? ` · ${item.notes}` : ""}`;

    return {
      id: item.id,
      employeeName: byEmployee.get(item.employeeId) ?? "Pracownik",
      type: "VACATION",
      status: "PENDING",
      date: date.toISOString(),
      details,
    };
  });
}

async function safeErrorMessage(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
    if (Array.isArray(data?.message)) return data.message.join(", ");
    return null;
  } catch {
    return null;
  }
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
