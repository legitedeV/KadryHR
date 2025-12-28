export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000";

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
  end: string;   // HH:mm
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

/**
 * Uwaga:
 *  Ścieżki są przyjęte przykładowo według typowego Nest backend-v2.
 *  Jeśli u Ciebie jest inny prefix (np. /api/v2), zmień tylko tę część.
 */

const AUTH_PREFIX = "/api/v2/auth";
const SHIFTS_PREFIX = "/api/v2/shifts";
const EMPLOYEES_PREFIX = "/api/v2/employees";
const REQUESTS_PREFIX = "/api/v2/requests";

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
  return data as { accessToken: string; user: User };
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

  return res.json();
}

export async function apiGetShifts(
  token: string,
  from: string,
  to: string
): Promise<Shift[]> {
  const res = await fetch(
    `${API_BASE_URL}${SHIFTS_PREFIX}?from=${encodeURIComponent(
      from
    )}&to=${encodeURIComponent(to)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nie udało się pobrać grafiku");
  }

  return res.json();
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

  return res.json();
}

export async function apiGetRequests(token: string): Promise<RequestItem[]> {
  const res = await fetch(`${API_BASE_URL}${REQUESTS_PREFIX}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nie udało się pobrać wniosków");
  }

  return res.json();
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
