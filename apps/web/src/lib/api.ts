import { API_URL } from "./api-config";

export type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";
};

export type ApiOrganization = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  slug?: string | null;
  timezone?: string | null;
  weekStart?: string | null;
  locale?: string | null;
  industry?: string | null;
};

export type ApiMembership = {
  id: string;
  role: ApiUser["role"];
  organization: ApiOrganization;
};

export type OrganizationSummary = {
  locationsCount: number;
  employeesCount: number;
  shiftsLast7DaysCount: number;
  openTimeAnomaliesCount: number;
};

export type Location = {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  timezone?: string | null;
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

export type TimesheetEntry = {
  id: string;
  employeeId: string;
  employeeName: string;
  clockIn: string;
  clockOut: string;
  durationHours: number;
};

export type TimesheetFilters = {
  from?: string;
  to?: string;
  employeeId?: string;
};

export type TimesheetResponse = {
  totalHours: number;
  totalEntries: number;
  entries: TimesheetEntry[];
};

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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Brak połączenia z serwerem. Spróbuj ponownie za chwilę.");
    }
    throw error;
  }

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
    const response = await request<{ accessToken: string; user: ApiUser; organization: ApiOrganization }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    setToken(response.accessToken);
    return response;
  },
  async register(payload: {
    organizationName: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const response = await request<{
      accessToken: string;
      user: ApiUser;
      organization: ApiOrganization;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(response.accessToken);
    return response;
  },
  getMe() {
    return request<{ user: ApiUser; memberships: ApiMembership[]; currentOrganizationId: string }>("/auth/me");
  },
  switchOrganization(organizationId: string) {
    return request<{ accessToken: string }>("/auth/switch-organization", {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    }).then((response) => {
      setToken(response.accessToken);
      return response;
    });
  },
  getOrganizationSummary() {
    return request<OrganizationSummary>("/organizations/current/summary");
  },
  getLocations() {
    return request<Location[]>("/locations");
  },
  getLocation(id: string) {
    return request<Location>(`/locations/${id}` as const);
  },
  createLocation(data: { name: string; address?: string; city?: string; code?: string; timezone?: string }) {
    return request<Location>("/locations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateLocation(
    id: string,
    data: { name?: string; address?: string; city?: string; code?: string; timezone?: string }
  ) {
    return request<Location>(`/locations/${id}` as const, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteLocation(id: string) {
    return request<{ success: boolean }>(`/locations/${id}` as const, {
      method: "DELETE",
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
  updateEmployee(
    id: string,
    data: { firstName?: string; lastName?: string; employeeCode?: string; email?: string }
  ) {
    return request<Employee>(`/employees/${id}` as const, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteEmployee(id: string) {
    return request<{ success: boolean }>(`/employees/${id}` as const, {
      method: "DELETE",
    });
  },
  getShifts(params: { from?: string; to?: string; locationId?: string }) {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.locationId) query.set("locationId", params.locationId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Shift[]>(`/shifts${suffix}` as const);
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
  updateShift(
    id: string,
    data: { start?: string; end?: string; employeeId?: string; locationId?: string; published?: boolean }
  ) {
    return request<Shift>(`/shifts/${id}` as const, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteShift(id: string) {
    return request<{ success: boolean }>(`/shifts/${id}` as const, {
      method: "DELETE",
    });
  },
  getTimeEntries(params: { from?: string; to?: string; employeeId?: string }) {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.employeeId) query.set("employeeId", params.employeeId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<TimeEntry[]>(`/rcp${suffix}` as const);
  },
  clockIn() {
    return request<TimeEntry>("/rcp/clock-in", {
      method: "POST",
    });
  },
  clockOut() {
    return request<TimeEntry>("/rcp/clock-out", {
      method: "POST",
    });
  },
  manualEntry(data: { employeeId: string; clockIn: string; clockOut: string }) {
    return request<TimeEntry>("/rcp/manual", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getTimesheet(filters: TimesheetFilters) {
    const query = new URLSearchParams();
    if (filters.from) query.set("from", filters.from);
    if (filters.to) query.set("to", filters.to);
    if (filters.employeeId) query.set("employeeId", filters.employeeId);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<TimesheetResponse>(`/reports/timesheets${suffix}` as const);
  },
};
