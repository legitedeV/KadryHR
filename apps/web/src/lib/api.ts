export type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "MANAGER" | "EMPLOYEE";
};

export type ApiOrganization = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type Location = {
  id: string;
  name: string;
  address?: string | null;
};

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode?: string | null;
  email?: string | null;
};

export type Shift = {
  id: string;
  employeeId: string;
  locationId: string;
  start: string;
  end: string;
  published: boolean;
  status?: string | null;
  employee?: Employee;
  location?: Location;
};

export type TimeEntry = {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut?: string | null;
  employee?: Employee;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("kadryhr_token");
};

const setToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("kadryhr_token", token);
};

const clearToken = () => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("kadryhr_token");
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

export const api = {
  getToken,
  setToken,
  clearToken,
  async login(email: string, password: string) {
    const response = await request<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(response.token);
    return response;
  },
  async register(payload: {
    organizationName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await request<{ token: string; user: ApiUser; organization: ApiOrganization }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    setToken(response.token);
    return response;
  },
  getMe() {
    return request<{ user: ApiUser; organization: ApiOrganization }>("/auth/me");
  },
  getLocations() {
    return request<Location[]>("/locations");
  },
  createLocation(data: { name: string; address?: string }) {
    return request<Location>("/locations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getEmployees() {
    return request<Employee[]>("/employees");
  },
  createEmployee(data: { firstName: string; lastName: string; employeeCode?: string; email?: string }) {
    return request<Employee>("/employees", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getShifts(params: { from?: string; to?: string; locationId?: string }) {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.locationId) query.set("locationId", params.locationId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Shift[]>(`/shifts${suffix}`);
  },
  createShift(data: {
    employeeId: string;
    locationId: string;
    start: string;
    end: string;
    published?: boolean;
  }) {
    return request<Shift>("/shifts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  clockIn() {
    return request<TimeEntry>("/rcp/clock-in", { method: "POST" });
  },
  clockOut() {
    return request<TimeEntry>("/rcp/clock-out", { method: "POST" });
  },
  getTimeEntries(params: { from?: string; to?: string; employeeId?: string }) {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.employeeId) query.set("employeeId", params.employeeId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<TimeEntry[]>(`/rcp/entries${suffix}`);
  },
  getTimesheet(params: { from?: string; to?: string; employeeId?: string }) {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.employeeId) query.set("employeeId", params.employeeId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<{
      totalHours: number;
      totalEntries: number;
      entries: Array<{
        id: string;
        employeeId: string;
        employeeName: string;
        clockIn: string;
        clockOut: string;
        durationHours: number;
      }>;
    }>(`/reports/timesheets${suffix}`);
  },
};
