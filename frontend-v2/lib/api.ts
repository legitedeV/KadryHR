export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE";

export interface AuthUserPayload {
  id: string;
  email: string;
  organisationId: string;
  role: UserRole;
}

export interface User extends AuthUserPayload {
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

export interface ApiShift {
  id: string;
  organisationId: string;
  employeeId: string;
  locationId: string | null;
  position: string | null;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
  location: {
    id: string;
    name: string;
    address?: string | null;
  } | null;
}

export interface Shift {
  id: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  locationName: string;
}

export interface ApiEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
}

/**
 * POST /auth/login
 * body: { email, password }
 * response: { accessToken, refreshToken, user }
 */
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nieprawidłowy login lub hasło");
  }

  const data = await res.json();
  return data as {
    accessToken: string;
    refreshToken: string;
    user: AuthUserPayload;
  };
}

/**
 * GET /auth/me
 * returns full user record
 */
export async function apiGetMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
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

/**
 * GET /shifts
 * returns all shifts for organisation with employee+location relations.
 */
export async function apiGetShifts(token: string): Promise<Shift[]> {
  const res = await fetch(`${API_BASE_URL}/shifts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nie udało się pobrać grafiku");
  }

  const data = (await res.json()) as ApiShift[];
  return data.map(mapShiftFromApi);
}

/**
 * GET /employees?skip=0&take=200
 */
export async function apiGetEmployees(token: string): Promise<Employee[]> {
  const params = new URLSearchParams({
    skip: "0",
    take: "200",
  });

  const res = await fetch(`${API_BASE_URL}/employees?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const msg = await safeErrorMessage(res);
    throw new Error(msg || "Nie udało się pobrać listy pracowników");
  }

  const data = (await res.json()) as ApiEmployee[];
  return data.map(mapEmployeeFromApi);
}

function mapShiftFromApi(api: ApiShift): Shift {
  const starts = new Date(api.startsAt);
  const ends = new Date(api.endsAt);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const date = starts.toISOString().slice(0, 10);
  const start = `${pad(starts.getHours())}:${pad(starts.getMinutes())}`;
  const end = `${pad(ends.getHours())}:${pad(ends.getMinutes())}`;

  const employeeNameRaw = api.employee
    ? `${api.employee.firstName} ${api.employee.lastName}`.trim()
    : "";
  const employeeName = employeeNameRaw || "Brak przypisanego pracownika";

  const locationName = api.location?.name ?? "Brak lokalizacji";

  return {
    id: api.id,
    employeeName,
    date,
    start,
    end,
    locationName,
  };
}

function mapEmployeeFromApi(api: ApiEmployee): Employee {
  const fullName = `${api.firstName} ${api.lastName}`.trim();
  return {
    id: api.id,
    fullName: fullName || api.email || "Pracownik",
    email: api.email ?? null,
    phone: api.phone ?? null,
    position: api.position ?? null,
  };
}

async function safeErrorMessage(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    if (typeof (data as any)?.message === "string") {
      return (data as any).message;
    }
    if (Array.isArray((data as any)?.message)) {
      return (data as any).message.join(", ");
    }
    return null;
  } catch {
    return null;
  }
}
