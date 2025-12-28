// app/lib/api.ts
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Shift {
  id: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string;   // HH:mm
  locationName: string;
  status: "ASSIGNED" | "UNASSIGNED";
}

/**
 * Uwaga: ścieżki /auth/login, /auth/me, /shifts to PRZYKŁAD.
 * Podmień je na realne endpointy z backend-v2.
 */

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Nieprawidłowy login lub hasło");
  }

  // zakładam, że backend zwraca { accessToken, user }
  const data = await res.json();
  return data as { accessToken: string; user: User };
}

export async function apiGetMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Nie udało się pobrać danych użytkownika");
  }

  return res.json();
}

export async function apiGetShifts(
  token: string,
  from: string,
  to: string
): Promise<Shift[]> {
  const res = await fetch(
    `${API_BASE_URL}/shifts?from=${encodeURIComponent(
      from
    )}&to=${encodeURIComponent(to)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Nie udało się pobrać grafiku");
  }

  return res.json();
}
