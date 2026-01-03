import { apiClient, API_BASE_URL } from "./api-client";
import { clearAuthTokens } from "./auth";

export { API_BASE_URL };

export type UserRole = "OWNER" | "MANAGER" | "EMPLOYEE" | "ADMIN";
export type Permission =
  | "EMPLOYEE_MANAGE"
  | "RCP_EDIT"
  | "LEAVE_APPROVE"
  | "REPORT_EXPORT";

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

export type NotificationType = "TEST" | "LEAVE_STATUS" | "SHIFT_ASSIGNMENT" | "SCHEDULE_PUBLISHED" | "SWAP_STATUS" | "CUSTOM";
export type NotificationChannel = "IN_APP" | "EMAIL";
export type NotificationCampaignStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED";
export type NotificationRecipientStatus = "PENDING" | "DELIVERED_IN_APP" | "EMAIL_SENT" | "EMAIL_FAILED" | "SKIPPED";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  channels: NotificationChannel[];
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
}

export interface AudienceFilter {
  all?: boolean;
  roles?: UserRole[];
  locationIds?: string[];
  employeeIds?: string[];
}

export interface NotificationCampaign {
  id: string;
  organisationId: string;
  createdByUserId: string;
  title: string;
  body?: string | null;
  type: NotificationType;
  audienceFilter?: AudienceFilter | null;
  channels: NotificationChannel[];
  status: NotificationCampaignStatus;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
  _count?: {
    recipients: number;
  };
}

export interface NotificationRecipient {
  id: string;
  campaignId: string;
  userId: string;
  deliveredInAppAt?: string | null;
  emailAttemptId?: string | null;
  status: NotificationRecipientStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  };
}

export interface CampaignDetails extends NotificationCampaign {
  recipients: NotificationRecipient[];
  stats: {
    total: number;
    deliveredInApp: number;
    emailSent: number;
    emailFailed: number;
    skipped: number;
  };
}

export const LEAVE_TYPES = {
  PAID_LEAVE: "PAID_LEAVE",
  SICK: "SICK",
  UNPAID: "UNPAID",
  OTHER: "OTHER",
} as const;

export type RequestType = (typeof LEAVE_TYPES)[keyof typeof LEAVE_TYPES];

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface RequestItem {
  id: string;
  employeeId: string;
  employeeName: string;
  type: RequestType;
  status: RequestStatus;
  startDate: string;
  endDate: string;
  reason?: string | null;
  rejectionReason?: string | null;
  attachmentUrl?: string | null;
  decisionAt?: string | null;
  createdAt: string;
  updatedAt: string;
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
const LEAVE_PREFIX = "/leave-requests";
const NOTIFICATIONS_PREFIX = "/notifications";

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

export interface LeaveRequestQuery {
  status?: RequestStatus;
  type?: RequestType;
  from?: string;
  to?: string;
  employeeId?: string;
  take?: number;
  skip?: number;
}

export async function apiListLeaveRequests(
  params: LeaveRequestQuery = {},
): Promise<PaginatedResponse<RequestItem>> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.type) search.set("type", params.type);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.employeeId) search.set("employeeId", params.employeeId);
  if (params.take) search.set("take", String(params.take));
  if (params.skip) search.set("skip", String(params.skip));

  const query = search.toString();
  const response = await apiClient.request<PaginatedResponse<LeaveRequestResponse>>(
    `${LEAVE_PREFIX}${query ? `?${query}` : ""}`,
  );

  return {
    ...response,
    data: response.data.map(mapLeaveRequest),
  };
}

export async function apiCreateLeaveRequest(payload: {
  type: RequestType;
  startDate: string;
  endDate: string;
  reason?: string;
  attachmentUrl?: string;
  employeeId?: string;
}): Promise<RequestItem> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<LeaveRequestResponse>(`${LEAVE_PREFIX}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapLeaveRequest(response);
}

export async function apiUpdateLeaveRequest(
  id: string,
  payload: Partial<{
    type: RequestType;
    startDate: string;
    endDate: string;
    reason?: string;
    attachmentUrl?: string;
  }>,
): Promise<RequestItem> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<LeaveRequestResponse>(`${LEAVE_PREFIX}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapLeaveRequest(response);
}

export async function apiUpdateLeaveStatus(
  id: string,
  status: RequestStatus,
  rejectionReason?: string,
): Promise<RequestItem> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<LeaveRequestResponse>(`${LEAVE_PREFIX}/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejectionReason }),
  });
  return mapLeaveRequest(response);
}

export async function apiGetRequests(): Promise<RequestItem[]> {
  const response = await apiListLeaveRequests({ take: 50, skip: 0 });
  return response.data;
}

export async function apiListNotifications(params: {
  take?: number;
  skip?: number;
  unreadOnly?: boolean;
} = {}) {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams();
  if (params.take) search.set("take", String(params.take));
  if (params.skip) search.set("skip", String(params.skip));
  if (params.unreadOnly) search.set("unreadOnly", String(params.unreadOnly));

  const query = search.toString();
  const response = await apiClient.request<{
    data: NotificationResponse[];
    total: number;
    skip: number;
    take: number;
    unreadCount: number;
  }>(`${NOTIFICATIONS_PREFIX}${query ? `?${query}` : ""}`);

  return {
    ...response,
    data: response.data.map(mapNotification),
  };
}

export async function apiMarkNotificationRead(id: string): Promise<NotificationItem> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<NotificationResponse>(
    `${NOTIFICATIONS_PREFIX}/${id}/read`,
    {
      method: "PATCH",
    },
  );
  return mapNotification(response);
}

export async function apiMarkAllNotificationsRead() {
  apiClient.hydrateFromStorage();
  return apiClient.request<{ updated: number }>(`${NOTIFICATIONS_PREFIX}/mark-all-read`, {
    method: "PATCH",
  });
}

export async function apiGetNotificationPreferences(): Promise<NotificationPreference[]> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<NotificationPreference[]>(`${NOTIFICATIONS_PREFIX}/preferences`);
  return response;
}

export async function apiUpdateNotificationPreferences(
  preferences: NotificationPreference[],
): Promise<NotificationPreference[]> {
  apiClient.hydrateFromStorage();
  return apiClient.request<NotificationPreference[]>(`${NOTIFICATIONS_PREFIX}/preferences`, {
    method: "PUT",
    body: JSON.stringify({ preferences }),
  });
}

export async function apiGetUnreadNotificationCount(): Promise<{ count: number }> {
  apiClient.hydrateFromStorage();
  return apiClient.request<{ count: number }>(`${NOTIFICATIONS_PREFIX}/unread-count`);
}

export async function apiSendTestNotification(): Promise<NotificationItem | null> {
  apiClient.hydrateFromStorage();
  const response = await apiClient.request<NotificationResponse | null>(
    `${NOTIFICATIONS_PREFIX}/test`,
    { method: "POST" },
  );
  return response ? mapNotification(response) : null;
}

// Campaign API functions
export async function apiCreateCampaign(data: {
  title: string;
  body?: string;
  type?: NotificationType;
  channels: NotificationChannel[];
  audienceFilter: AudienceFilter;
}): Promise<NotificationCampaign> {
  apiClient.hydrateFromStorage();
  return apiClient.request<NotificationCampaign>(`${NOTIFICATIONS_PREFIX}/campaigns`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiSendCampaign(campaignId: string): Promise<{ success: boolean; recipientCount: number }> {
  apiClient.hydrateFromStorage();
  return apiClient.request<{ success: boolean; recipientCount: number }>(
    `${NOTIFICATIONS_PREFIX}/campaigns/${campaignId}/send`,
    { method: "POST" },
  );
}

export async function apiListCampaigns(params: {
  skip?: number;
  take?: number;
  status?: NotificationCampaignStatus;
} = {}): Promise<{
  data: NotificationCampaign[];
  total: number;
  skip: number;
  take: number;
}> {
  apiClient.hydrateFromStorage();
  const search = new URLSearchParams();
  if (params.skip !== undefined) search.set("skip", String(params.skip));
  if (params.take !== undefined) search.set("take", String(params.take));
  if (params.status) search.set("status", params.status);

  const query = search.toString();
  return apiClient.request<{
    data: NotificationCampaign[];
    total: number;
    skip: number;
    take: number;
  }>(`${NOTIFICATIONS_PREFIX}/campaigns${query ? `?${query}` : ""}`);
}

export async function apiGetCampaignDetails(campaignId: string): Promise<CampaignDetails> {
  apiClient.hydrateFromStorage();
  return apiClient.request<CampaignDetails>(`${NOTIFICATIONS_PREFIX}/campaigns/${campaignId}`);
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

interface LeaveRequestResponse {
  id: string;
  organisationId: string;
  employeeId: string;
  type: RequestType;
  status: RequestStatus;
  startDate: string;
  endDate: string;
  reason?: string | null;
  rejectionReason?: string | null;
  attachmentUrl?: string | null;
  decisionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

interface NotificationResponse {
  id: string;
  organisationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  channels: NotificationChannel[];
  readAt?: string | null;
  createdAt: string;
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

function mapLeaveRequest(request: LeaveRequestResponse): RequestItem {
  return {
    id: request.id,
    employeeId: request.employeeId,
    employeeName: formatUserName(request.employee) || "Pracownik",
    type: request.type,
    status: request.status,
    startDate: request.startDate,
    endDate: request.endDate,
    reason: request.reason ?? undefined,
    rejectionReason: request.rejectionReason ?? undefined,
    attachmentUrl: request.attachmentUrl ?? undefined,
    decisionAt: request.decisionAt ?? undefined,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function mapNotification(notification: NotificationResponse): NotificationItem {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body ?? undefined,
    data: notification.data ?? undefined,
    channels: notification.channels ?? [],
    readAt: notification.readAt ?? undefined,
    createdAt: notification.createdAt,
  };
}
