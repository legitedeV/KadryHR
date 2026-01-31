import { apiClient } from "./api-client";
import { clearAuthTokens } from "./auth";

export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE" | "ADMIN";
export type Permission =
  | "SCHEDULE_MANAGE"
  | "SCHEDULE_VIEW"
  | "AVAILABILITY_MANAGE"
  | "RCP_EDIT";

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
  permissions: Permission[];
}

export interface ShiftRecord {
  id: string;
  employeeId: string;
  locationId?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "CANCELLED" | string | null;
  position?: string | null;
  notes?: string | null;
  availabilityOverrideReason?: string | null;
  color?: string | null;
  startsAt: string;
  endsAt: string;
  employee?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  };
  location?: { id?: string; name?: string | null };
  availabilityWarning?: string | null;
  leaveWarning?: string | null;
}

export interface ScheduleShiftRecord {
  id: string;
  organisationId?: string;
  periodId?: string | null;
  employeeId: string;
  locationId?: string | null;
  positionId?: string | null;
  position?: string | null;
  notes?: string | null;
  note?: string | null;
  color?: string | null;
  startsAt: string;
  endsAt: string;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleShiftPayload {
  periodId?: string;
  employeeId: string;
  locationId?: string;
  positionId?: string;
  position?: string;
  note?: string;
  startAt: string;
  endAt: string;
}

export interface ScheduleShiftBulkPayload {
  shifts: ScheduleShiftPayload[];
}

export interface ShiftPayload {
  employeeId: string;
  locationId?: string;
  position?: string;
  notes?: string;
  availabilityOverrideReason?: string;
  color?: string;
  startsAt: string;
  endsAt: string;
}

export interface AvailabilityRecord {
  id: string;
  employeeId: string;
  availabilityWindowId?: string | null;
  date?: string | null;
  weekday?: string | null;
  startMinutes: number;
  endMinutes: number;
  status?: "AVAILABLE" | "DAY_OFF";
  notes?: string | null;
  employee?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  };
}

export interface AvailabilityWindowRecord {
  id: string;
  organisationId: string;
  title: string;
  startDate: string;
  endDate: string;
  deadline: string;
  isOpen: boolean;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityWindowInput {
  title?: string;
  startDate: string;
  endDate: string;
  deadline: string;
  isOpen?: boolean;
}

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface AvailabilityInput {
  weekday?: Weekday;
  date?: string;
  startMinutes: number;
  endMinutes: number;
  status?: "AVAILABLE" | "DAY_OFF";
  notes?: string;
}

export type AvailabilitySubmissionStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "REOPENED";

export interface AvailabilityWindowSubmissionResponse {
  window: AvailabilityWindowRecord;
  employeeId: string;
  status: AvailabilitySubmissionStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedByUserId?: string | null;
  availability: AvailabilityRecord[];
}

export interface AvailabilityWindowTeamStats {
  totalEmployees: number;
  submittedCount: number;
  reviewedCount: number;
  pendingCount: number;
}

export interface ScheduleMetadata {
  deliveryDays: string[];
  promotionDays: Array<{ date: string; type: "ZMIANA_PROMOCJI" | "MALA_PROMOCJA" }>;
}

export interface ApprovedLeaveRecord {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: string;
  leaveType?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  employee?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface ScheduleTemplateRecord {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  _count?: { shifts: number };
}

export interface ScheduleTemplateShift {
  id: string;
  employeeId: string;
  locationId?: string | null;
  position?: string | null;
  notes?: string | null;
  color?: string | null;
  weekday: Weekday;
  startMinutes: number;
  endMinutes: number;
  employee?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  location?: { id?: string; name?: string | null };
}

export interface ScheduleTemplateDetail extends ScheduleTemplateRecord {
  shifts: ScheduleTemplateShift[];
}

export interface ShiftPresetRecord {
  id: string;
  organisationId: string;
  name: string;
  code: string;
  startMinutes: number;
  endMinutes: number;
  color?: string | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
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
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  locations: LocationSummary[];
  isActive: boolean;
  isDeleted: boolean;
  employmentEndDate?: string | null;
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
  status?: "active" | "inactive" | "all";
}

const AUTH_PREFIX = "/auth";
const SHIFTS_PREFIX = "/shifts";
const EMPLOYEES_PREFIX = "/employees";
const LOCATIONS_PREFIX = "/locations";
const AVAILABILITY_PREFIX = "/availability";
const ORGANISATIONS_PREFIX = "/organisations";
const SCHEDULE_TEMPLATES_PREFIX = "/schedule-templates";
const SHIFT_PRESETS_PREFIX = "/shift-presets";
const SCHEDULE_PREFIX = "/schedule";

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

export async function apiRegisterOwner(payload: {
  organisationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  const data = await apiClient.request<LoginResponse>(`${AUTH_PREFIX}/register`, {
    method: "POST",
    auth: false,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const user = mapUser(data?.user);
  apiClient.setTokens({ accessToken: data.accessToken });
  return user;
}

export async function apiRequestPasswordReset(email: string) {
  return apiClient.request<{ success: boolean }>(`${AUTH_PREFIX}/password-reset/request`, {
    method: "POST",
    auth: false,
    suppressToast: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(payload: { token: string; password: string }) {
  return apiClient.request<{ success: boolean }>(`${AUTH_PREFIX}/password-reset/confirm`, {
    method: "POST",
    auth: false,
    suppressToast: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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

export async function apiGetSchedule(params: {
  from: string;
  to: string;
  locationIds?: string[];
  positionIds?: string[];
}): Promise<ScheduleShiftRecord[]> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  params.locationIds?.forEach((id) => search.append("locationIds[]", id));
  params.positionIds?.forEach((id) => search.append("positionIds[]", id));

  return apiClient.request<ScheduleShiftRecord[]>(`${SCHEDULE_PREFIX}?${search.toString()}`);
}

export async function apiGetShiftSummary(params: {
  from: string;
  to: string;
  locationId?: string;
  employeeId?: string;
}): Promise<Array<{ employeeId: string; employeeName: string; hours: number }>> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  if (params.locationId) search.set("locationId", params.locationId);
  if (params.employeeId) search.set("employeeId", params.employeeId);

  return apiClient.request(`${SHIFTS_PREFIX}/summary?${search.toString()}`);
}

export async function apiCreateShift(payload: ShiftPayload): Promise<ShiftRecord> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ShiftResponse>(`${SHIFTS_PREFIX}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiCreateScheduleShift(payload: ScheduleShiftPayload): Promise<ScheduleShiftRecord> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ScheduleShiftRecord>(`${SCHEDULE_PREFIX}/shifts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiCreateScheduleShiftsBulk(
  payload: ScheduleShiftBulkPayload,
): Promise<ScheduleShiftRecord[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ScheduleShiftRecord[]>(`${SCHEDULE_PREFIX}/shifts/bulk`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteScheduleShiftsBulk(payload: { shiftIds: string[] }) {
  apiClient.hydrateFromStorage();
  await apiClient.request(`${SCHEDULE_PREFIX}/shifts/bulk`, {
    method: "DELETE",
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

export async function apiPublishSchedule(payload: {
  employeeIds: string[];
  dateRange?: { from: string; to: string };
}): Promise<{ success: boolean; notified: number }> {
  apiClient.hydrateFromStorage();
  return apiClient.request<{ success: boolean; notified: number }>(`${SHIFTS_PREFIX}/publish-schedule`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiClearWeek(payload: {
  from: string;
  to: string;
  locationId?: string;
}): Promise<{ success: boolean; deletedCount: number }> {
  apiClient.hydrateFromStorage();
  return apiClient.request<{ success: boolean; deletedCount: number }>(`${SHIFTS_PREFIX}/clear-week`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiCopyPreviousWeek(payload: {
  from: string;
  to: string;
  locationId?: string;
}): Promise<ShiftPayload[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ShiftPayload[]>(`${SHIFTS_PREFIX}/copy-previous-week`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiCopyRange(payload: {
  sourceFrom: string;
  sourceTo: string;
  targetFrom: string;
  locationId?: string;
}): Promise<ShiftPayload[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ShiftPayload[]>(`${SHIFTS_PREFIX}/copy-range`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

// Availability Windows API
export async function apiGetAvailabilityWindows(): Promise<AvailabilityWindowRecord[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<AvailabilityWindowRecord[]>(`${AVAILABILITY_PREFIX}/windows`);
}

export async function apiGetApprovedLeaves(params: {
  from?: string;
  to?: string;
}): Promise<ApprovedLeaveRecord[]> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const query = search.toString();
  return apiClient.request<ApprovedLeaveRecord[]>(
    `/leave-requests/approved${query ? `?${query}` : ""}`,
  );
}

export async function apiGetActiveAvailabilityWindows(): Promise<AvailabilityWindowRecord[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<AvailabilityWindowRecord[]>(`${AVAILABILITY_PREFIX}/windows/active`);
}

export async function apiCreateAvailabilityWindow(
  payload: AvailabilityWindowInput,
): Promise<AvailabilityWindowRecord> {
  apiClient.hydrateFromStorage();
  return apiClient.request<AvailabilityWindowRecord>(`${AVAILABILITY_PREFIX}/windows`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiCloseAvailabilityWindow(windowId: string): Promise<AvailabilityWindowRecord> {
  apiClient.hydrateFromStorage();
  return apiClient.request<AvailabilityWindowRecord>(`${AVAILABILITY_PREFIX}/windows/${windowId}/close`, {
    method: "PATCH",
  });
}

// Team availability API (admin only)
export interface EmployeeAvailabilitySummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string | null;
  locations: Array<{ id: string; name: string }>;
  availabilityCount: number;
  hasWeeklyDefault: boolean;
  submissionStatus?: AvailabilitySubmissionStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export interface TeamAvailabilityResponse {
  data: EmployeeAvailabilitySummary[];
  total: number;
}

export interface TeamAvailabilityStatsResponse {
  totalEmployees: number;
  employeesWithAvailability: number;
  employeesWithoutAvailability: number;
  hasActiveWindow: boolean;
  activeWindow: AvailabilityWindowRecord | null;
  activeWindowSubmissionStats?: AvailabilityWindowTeamStats | null;
}

export interface EmployeeAvailabilityDetailResponse {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    position: string | null;
    locations: Array<{ id: string; name: string }>;
    role: string | null;
  };
  availability: AvailabilityRecord[];
}

export async function apiGetTeamAvailabilityStats(): Promise<TeamAvailabilityStatsResponse> {
  apiClient.hydrateFromStorage();
  return apiClient.request<TeamAvailabilityStatsResponse>(`${AVAILABILITY_PREFIX}/team/stats`);
}

export async function apiGetTeamAvailability(params: {
  search?: string;
  locationId?: string;
  role?: string;
  page?: number;
  perPage?: number;
}): Promise<TeamAvailabilityResponse> {
  apiClient.hydrateFromStorage();
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.locationId) searchParams.set("locationId", params.locationId);
  if (params.role) searchParams.set("role", params.role);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.perPage) searchParams.set("perPage", String(params.perPage));
  
  const query = searchParams.toString();
  return apiClient.request<TeamAvailabilityResponse>(
    `${AVAILABILITY_PREFIX}/employees${query ? `?${query}` : ""}`,
  );
}

export async function apiGetEmployeeAvailability(
  employeeId: string,
): Promise<EmployeeAvailabilityDetailResponse> {
  apiClient.hydrateFromStorage();
  return apiClient.request<EmployeeAvailabilityDetailResponse>(
    `${AVAILABILITY_PREFIX}/employee/${employeeId}`,
  );
}

export async function apiUpdateEmployeeAvailability(
  employeeId: string,
  availabilities: AvailabilityInput[],
): Promise<AvailabilityRecord[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<AvailabilityRecord[]>(
    `${AVAILABILITY_PREFIX}/employee/${employeeId}`,
    {
      method: "PUT",
      body: JSON.stringify({ availabilities }),
    },
  );
}

export async function apiGetMyWindowAvailability(
  windowId: string,
): Promise<AvailabilityWindowSubmissionResponse> {
  apiClient.hydrateFromStorage();
  return apiClient.request<AvailabilityWindowSubmissionResponse>(
    `${AVAILABILITY_PREFIX}/windows/${windowId}/me`,
  );
}

export async function apiSaveMyWindowAvailability(
  windowId: string,
  payload: { availabilities: AvailabilityInput[]; submit?: boolean },
): Promise<AvailabilityWindowSubmissionResponse> {
  apiClient.hydrateFromStorage();
  return apiClient.request<AvailabilityWindowSubmissionResponse>(
    `${AVAILABILITY_PREFIX}/windows/${windowId}/me`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function apiGetWindowTeamAvailabilityStats(
  windowId: string,
): Promise<AvailabilityWindowTeamStats> {
  apiClient.hydrateFromStorage();
  return apiClient.request<AvailabilityWindowTeamStats>(
    `${AVAILABILITY_PREFIX}/windows/${windowId}/team/stats`,
  );
}

export async function apiGetWindowTeamAvailability(
  windowId: string,
  params: {
    search?: string;
    locationId?: string;
    role?: string;
    page?: number;
    perPage?: number;
  },
): Promise<TeamAvailabilityResponse> {
  apiClient.hydrateFromStorage();
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.locationId) searchParams.set("locationId", params.locationId);
  if (params.role) searchParams.set("role", params.role);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.perPage) searchParams.set("perPage", String(params.perPage));
  const query = searchParams.toString();
  return apiClient.request<TeamAvailabilityResponse>(
    `${AVAILABILITY_PREFIX}/windows/${windowId}/team${query ? `?${query}` : ""}`,
  );
}

export async function apiGetWindowEmployeeAvailability(
  windowId: string,
  employeeId: string,
): Promise<EmployeeAvailabilityDetailResponse & { status: AvailabilitySubmissionStatus; submittedAt?: string | null; reviewedAt?: string | null }> {
  apiClient.hydrateFromStorage();
  return apiClient.request<EmployeeAvailabilityDetailResponse & {
    status: AvailabilitySubmissionStatus;
    submittedAt?: string | null;
    reviewedAt?: string | null;
  }>(`${AVAILABILITY_PREFIX}/windows/${windowId}/employee/${employeeId}`);
}

export async function apiUpdateWindowEmployeeAvailability(
  windowId: string,
  employeeId: string,
  payload: { availabilities: AvailabilityInput[] },
): Promise<{ employeeId: string; status: AvailabilitySubmissionStatus; reviewedAt?: string | null; availability: AvailabilityRecord[] }> {
  apiClient.hydrateFromStorage();
  return apiClient.request<{ employeeId: string; status: AvailabilitySubmissionStatus; reviewedAt?: string | null; availability: AvailabilityRecord[] }>(
    `${AVAILABILITY_PREFIX}/windows/${windowId}/employee/${employeeId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function apiUpdateWindowSubmissionStatus(
  windowId: string,
  employeeId: string,
  status: AvailabilitySubmissionStatus,
): Promise<{ status: AvailabilitySubmissionStatus }> {
  apiClient.hydrateFromStorage();
  return apiClient.request<{ status: AvailabilitySubmissionStatus }>(
    `${AVAILABILITY_PREFIX}/windows/${windowId}/employee/${employeeId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

// Schedule Metadata API (delivery days, promotion labels)
export async function apiGetScheduleMetadata(params: {
  from: string;
  to: string;
}): Promise<ScheduleMetadata> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams({ from: params.from, to: params.to });
  return apiClient.request<ScheduleMetadata>(`${ORGANISATIONS_PREFIX}/me/schedule-metadata?${search.toString()}`);
}

export async function apiListScheduleTemplates(): Promise<ScheduleTemplateRecord[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ScheduleTemplateRecord[]>(`${SCHEDULE_TEMPLATES_PREFIX}`);
}

export async function apiGetScheduleTemplate(id: string): Promise<ScheduleTemplateDetail> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ScheduleTemplateDetail>(`${SCHEDULE_TEMPLATES_PREFIX}/${id}`);
}

export async function apiCreateScheduleTemplateFromWeek(payload: {
  name: string;
  description?: string;
  from: string;
  to: string;
  locationId?: string;
}): Promise<ScheduleTemplateRecord> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ScheduleTemplateRecord>(`${SCHEDULE_TEMPLATES_PREFIX}/from-week`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  const response = await apiClient.request<PaginatedResponse<EmployeeResponse>>(
    `${EMPLOYEES_PREFIX}${query ? `?${query}` : ""}`,
  );

  return {
    ...response,
    data: response.data.map(mapEmployee),
  };
}

export async function apiListLocations(): Promise<LocationRecord[]> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<LocationResponse[]>(`${LOCATIONS_PREFIX}`);
  return response.map(mapLocation);
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
  permissions?: Permission[];
}

interface ShiftResponse {
  id: string;
  employeeId: string;
  locationId?: string | null;
  position?: string | null;
  notes?: string | null;
  employee?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  };
  location?: { id?: string; name?: string | null };
  startsAt: string;
  endsAt: string;
  availabilityWarning?: string | null;
  leaveWarning?: string | null;
}

interface EmployeeResponse {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  locations?: LocationSummary[];
  isActive: boolean;
  isDeleted: boolean;
  employmentEndDate?: string | null;
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

export function mapUser(user: UserResponse): User {
  return {
    id: user.id,
    email: user.email,
    role: isUserRole(user.role) ? user.role : "EMPLOYEE",
    name: formatUserName(user),
    organisation: user.organisation,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  } as User;
}

function mapEmployee(employee: EmployeeResponse): EmployeeRecord {
  return {
    id: employee.id,
    firstName: employee.firstName ?? "",
    lastName: employee.lastName ?? "",
    avatarUrl: employee.avatarUrl ?? undefined,
    email: employee.email ?? undefined,
    phone: employee.phone ?? undefined,
    position: employee.position ?? undefined,
    locations: employee.locations ?? [],
    isActive: employee.isActive,
    isDeleted: employee.isDeleted,
    employmentEndDate: employee.employmentEndDate ?? undefined,
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
// Profile API
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  avatarUpdatedAt?: string | null;
  organisationId: string;
  createdAt: string;
  organisation: {
    id: string;
    name: string;
  };
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangeEmailPayload {
  currentPassword: string;
  newEmail: string;
}

const USERS_PREFIX = "/users";

export async function apiGetProfile(): Promise<UserProfile> {
  apiClient.hydrateFromStorage();
  return apiClient.request<UserProfile>(`${USERS_PREFIX}/profile`);
}

export async function apiUpdateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  apiClient.hydrateFromStorage();
  return apiClient.request<UserProfile>(`${USERS_PREFIX}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface AvatarUploadResponse {
  avatarUrl: string;
  avatarUpdatedAt?: string;
  profile?: UserProfile;
}

export async function apiUploadAvatar(file: File): Promise<AvatarUploadResponse> {
  apiClient.hydrateFromStorage();
  const formData = new FormData();
  formData.append("avatar", file);
  return apiClient.request<AvatarUploadResponse>(`${USERS_PREFIX}/me/avatar`, {
    method: "POST",
    body: formData,
  });
}

export async function apiChangePassword(
  payload: ChangePasswordPayload,
): Promise<{ success: boolean; message: string }> {
  apiClient.hydrateFromStorage();
  return apiClient.request<{ success: boolean; message: string }>(
    `${USERS_PREFIX}/profile/change-password`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function apiChangeEmail(
  payload: ChangeEmailPayload,
): Promise<UserProfile> {
  apiClient.hydrateFromStorage();
  return apiClient.request<UserProfile>(`${USERS_PREFIX}/profile/change-email`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Shift Presets API
export async function apiListShiftPresets(): Promise<ShiftPresetRecord[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<ShiftPresetRecord[]>(`${SHIFT_PRESETS_PREFIX}`);
}
