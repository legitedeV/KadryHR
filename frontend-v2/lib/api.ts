import { apiClient, API_BASE_URL } from "./api-client";
import { clearAuthTokens } from "./auth";

export { API_BASE_URL };

export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE" | "ADMIN";

export interface OrganisationSummary {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organisation: OrganisationSummary;
}

export interface ShiftRecord {
  id: string;
  employeeId: string;
  locationId?: string | null;
  position?: string | null;
  notes?: string | null;
  startsAt: string;
  endsAt: string;
  employee?: { id?: string; firstName?: string | null; lastName?: string | null };
  location?: { id?: string; name?: string | null };
  availabilityWarning?: string | null;
}

export interface ShiftPayload {
  employeeId: string;
  locationId?: string;
  position?: string;
  notes?: string;
  startsAt: string;
  endsAt: string;
}

export interface ShiftSummaryItem {
  employeeId: string;
  employeeName: string;
  hours: number;
}

export interface AvailabilityRecord {
  id: string;
  employeeId: string;
  date?: string | null;
  weekday?: string | null;
  startMinutes: number;
  endMinutes: number;
  notes?: string | null;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

export interface LocationSummary {
  id: string;
  name: string;
  address?: string | null;
}

export interface EmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  locations: LocationSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationRecord {
  id: string;
  name: string;
  address?: string | null;
  employees: EmployeeRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeQuery {
  search?: string;
  sortBy?: "firstName" | "lastName" | "email" | "createdAt" | "position";
  sortOrder?: "asc" | "desc";
  take?: number;
  skip?: number;
  page?: number;
}

export interface SaveEmployeePayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  locationIds?: string[];
}

export interface SaveLocationPayload {
  name: string;
  address?: string;
  employeeIds?: string[];
}

const AUTH_PREFIX = "/auth";
const SHIFTS_PREFIX = "/shifts";
const EMPLOYEES_PREFIX = "/employees";
const LOCATIONS_PREFIX = "/locations";
const AVAILABILITY_PREFIX = "/availability";

export async function apiLogin(email: string, password: string) {
  const data = await apiClient.request<LoginResponse>(`${AUTH_PREFIX}/login`, {
    method: "POST",
    auth: false,
    suppressToast: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const user = mapUser(data?.user);
  const tokens = { accessToken: data.accessToken };
  apiClient.setTokens(tokens);

  return {
    ...tokens,
    user,
  };
}

export async function apiGetMe(): Promise<User> {
  apiClient.hydrateFromStorage();
  const data = await apiClient.request<UserResponse>(`${AUTH_PREFIX}/me`, {
    suppressToast: true,
  });

  return mapUser(data);
}

export async function apiLogout() {
  apiClient.hydrateFromStorage();
  await apiClient.request(`${AUTH_PREFIX}/logout`, {
    method: "POST",
    suppressToast: true,
  });
  apiClient.setTokens(null);
  clearAuthTokens();
}

export async function apiGetShifts(params: {
  from: string;
  to: string;
  locationId?: string;
  employeeId?: string;
}): Promise<ShiftRecord[]> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  if (params.locationId) search.set("locationId", params.locationId);
  if (params.employeeId) search.set("employeeId", params.employeeId);

  return apiClient.request<ShiftResponse[]>(`${SHIFTS_PREFIX}?${search.toString()}`);
}

export async function apiCreateShift(payload: ShiftPayload): Promise<ShiftRecord> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ShiftResponse>(`${SHIFTS_PREFIX}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateShift(
  id: string,
  payload: Partial<ShiftPayload>,
): Promise<ShiftRecord> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ShiftResponse>(`${SHIFTS_PREFIX}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteShift(id: string) {
  apiClient.hydrateFromStorage();
  await apiClient.request(`${SHIFTS_PREFIX}/${id}`, { method: "DELETE" });
}

export async function apiGetShiftSummary(params: {
  from: string;
  to: string;
  employeeId?: string;
  locationId?: string;
}): Promise<ShiftSummaryItem[]> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams({ from: params.from, to: params.to });
  if (params.employeeId) search.set("employeeId", params.employeeId);
  if (params.locationId) search.set("locationId", params.locationId);
  return apiClient.request<ShiftSummaryItem[]>(`${SHIFTS_PREFIX}/summary?${search.toString()}`);
}

export async function apiGetAvailability(params: {
  from?: string;
  to?: string;
  employeeId?: string;
}): Promise<AvailabilityRecord[]> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.employeeId) search.set("employeeId", params.employeeId);
  const query = search.toString();
  return apiClient.request<AvailabilityRecord[]>(`${AVAILABILITY_PREFIX}${query ? `?${query}` : ""}`);
}

export async function apiListEmployees(
  params: EmployeeQuery = {},
): Promise<PaginatedResponse<EmployeeRecord>> {
  apiClient.hydrateFromStorage();
  const take = params.take ?? 10;
  const skip = params.skip ?? (params.page != null ? Math.max(params.page - 1, 0) * take : 0);
  const searchParams = new URLSearchParams();
  searchParams.set("take", String(take));
  searchParams.set("skip", String(skip));
  if (params.search) searchParams.set("search", params.search);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  const response = await apiClient.request<PaginatedResponse<EmployeeResponse>>(
    `${EMPLOYEES_PREFIX}${query ? `?${query}` : ""}`,
  );

  return {
    ...response,
    data: response.data.map(mapEmployee),
  };
}

export async function apiGetEmployee(id: string): Promise<EmployeeRecord> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<EmployeeResponse>(`${EMPLOYEES_PREFIX}/${id}`);
  return mapEmployee(response);
}

export async function apiCreateEmployee(
  payload: SaveEmployeePayload,
): Promise<EmployeeRecord> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<EmployeeResponse>(`${EMPLOYEES_PREFIX}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapEmployee(response);
}

export async function apiUpdateEmployee(
  id: string,
  payload: Partial<SaveEmployeePayload>,
): Promise<EmployeeRecord> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<EmployeeResponse>(`${EMPLOYEES_PREFIX}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapEmployee(response);
}

export async function apiDeleteEmployee(id: string) {
  apiClient.hydrateFromStorage();
  await apiClient.request(`${EMPLOYEES_PREFIX}/${id}`, { method: "DELETE" });
}

export async function apiListLocations(): Promise<LocationRecord[]> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<LocationResponse[]>(`${LOCATIONS_PREFIX}`);
  return response.map(mapLocation);
}

export async function apiCreateLocation(payload: SaveLocationPayload): Promise<LocationRecord> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<LocationResponse>(`${LOCATIONS_PREFIX}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapLocation(response);
}

export async function apiUpdateLocation(
  id: string,
  payload: Partial<SaveLocationPayload>,
): Promise<LocationRecord> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<LocationResponse>(`${LOCATIONS_PREFIX}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapLocation(response);
}

export async function apiUpdateLocationEmployees(
  id: string,
  employeeIds: string[],
): Promise<LocationRecord> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<LocationResponse>(`${LOCATIONS_PREFIX}/${id}/employees`, {
    method: "PATCH",
    body: JSON.stringify({ employeeIds }),
  });
  return mapLocation(response);
}

export async function apiDeleteLocation(id: string) {
  apiClient.hydrateFromStorage();
  await apiClient.request(`${LOCATIONS_PREFIX}/${id}`, { method: "DELETE" });
}

export async function apiGetRequests(): Promise<RequestItem[]> {
  apiClient.hydrateFromStorage();
  const [availabilityRes, employees] = await Promise.all([
    apiClient.request<AvailabilityResponse[]>(`${AVAILABILITY_PREFIX}`, {
      suppressToast: true,
    }),
    apiListEmployees({ take: 200, skip: 0 }),
  ]);

  const byEmployee = new Map(
    employees.data.map((e) => [e.id, `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.email || "Pracownik"]),
  );

  return availabilityRes.map((item) => {
    const date = item.date
      ? new Date(item.date)
      : item.weekday
      ? nextWeekday(item.weekday)
      : new Date();
    const note = (item.notes ?? "").toLowerCase();
    const details = `${minutesToLabel(item.startMinutes)}–${minutesToLabel(
      item.endMinutes,
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
  user: UserResponse;
}

interface UserResponse {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  organisation: OrganisationSummary;
}

interface ShiftResponse {
  id: string;
  employeeId: string;
  locationId?: string | null;
  position?: string | null;
  notes?: string | null;
  employee?: { id?: string; firstName?: string | null; lastName?: string | null };
  location?: { id?: string; name?: string | null };
  startsAt: string;
  endsAt: string;
  availabilityWarning?: string | null;
}

interface EmployeeResponse {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  locations?: LocationSummary[];
  createdAt: string;
  updatedAt: string;
}

interface LocationResponse {
  id: string;
  name: string;
  address?: string | null;
  employees: EmployeeResponse[];
  createdAt: string;
  updatedAt: string;
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
    | undefined,
) {
  const first = typeof user?.firstName === "string" ? user.firstName : "";
  const last = typeof user?.lastName === "string" ? user.lastName : "";
  const email = typeof user?.email === "string" ? user.email : "";
  const name = `${first} ${last}`.trim();
  return name || email;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "OWNER" || value === "MANAGER" || value === "EMPLOYEE" || value === "ADMIN";
}

function inferRequestType(item: AvailabilityResponse): RequestType {
  const note = (item.notes ?? "").toLowerCase();
  if (note.includes("chorob")) return REQUEST_TYPES.SICK;
  if (note.includes("urlop")) return REQUEST_TYPES.VACATION;
  if (item.weekday) return REQUEST_TYPES.SHIFT_SWAP;
  return REQUEST_TYPES.SHIFT_GIVE;
}

export function mapUser(user: UserResponse): User {
  return {
    id: user.id,
    email: user.email,
    role: isUserRole(user.role) ? user.role : "EMPLOYEE",
    name: formatUserName(user),
    organisation: user.organisation,
  } as User;
}

function mapEmployee(employee: EmployeeResponse): EmployeeRecord {
  return {
    id: employee.id,
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    email: employee.email ?? undefined,
    phone: employee.phone ?? undefined,
    position: employee.position ?? undefined,
    locations: employee.locations ?? [],
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

function mapLocation(location: LocationResponse): LocationRecord {
  return {
    id: location.id,
    name: location.name,
    address: location.address ?? undefined,
    employees: (location.employees ?? []).map(mapEmployee),
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}
