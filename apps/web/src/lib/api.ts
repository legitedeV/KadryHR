const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    name: string;
    orgName: string;
  }) {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  }

  async me() {
    return this.request<{ user: User & { tenant: Tenant } }>('/api/auth/me');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<{
      data: {
        employeesCount: number;
        shiftsThisMonth: number;
        pendingAvailability: number;
      };
    }>('/api/dashboard/stats');
  }

  // Employees
  async getEmployees(params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ data: unknown[] }>(`/api/employees${query ? `?${query}` : ''}`);
  }

  async createEmployee(data: unknown) {
    return this.request<{ data: unknown }>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: unknown) {
    return this.request<{ data: unknown }>(`/api/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string) {
    return this.request<{ success: boolean }>(`/api/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Positions
  async getPositions() {
    return this.request<{ data: unknown[] }>('/api/positions');
  }

  async createPosition(data: unknown) {
    return this.request<{ data: unknown }>('/api/positions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tags
  async getTags() {
    return this.request<{ data: unknown[] }>('/api/tags');
  }

  async createTag(data: unknown) {
    return this.request<{ data: unknown }>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Schedules
  async getSchedules() {
    return this.request<{ data: unknown[] }>('/api/schedules');
  }

  async createSchedule(data: unknown) {
    return this.request<{ data: unknown }>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScheduleShifts(scheduleId: string, params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ data: unknown[] }>(
      `/api/schedules/${scheduleId}/shifts${query ? `?${query}` : ''}`
    );
  }

  async publishSchedule(scheduleId: string, data: { publishedUntil: string }) {
    return this.request<{ data: unknown }>(`/api/schedules/${scheduleId}/publish`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Shifts
  async createShift(data: unknown) {
    return this.request<{ data: unknown }>('/api/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShift(id: string, data: unknown) {
    return this.request<{ data: unknown }>(`/api/shifts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteShift(id: string) {
    return this.request<{ success: boolean }>(`/api/shifts/${id}`, {
      method: 'DELETE',
    });
  }

  // Availability
  async getAvailability(params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ data: unknown[] }>(`/api/availability${query ? `?${query}` : ''}`);
  }

  async createAvailability(data: unknown) {
    return this.request<{ data: unknown }>('/api/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAvailability(id: string, data: unknown) {
    return this.request<{ data: unknown }>(`/api/availability/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Holidays
  async getHolidays(params?: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    return this.request<{ data: unknown[] }>(`/api/holidays${query ? `?${query}` : ''}`);
  }

  async createHoliday(data: unknown) {
    return this.request<{ data: unknown }>('/api/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteHoliday(id: string) {
    return this.request<{ success: boolean }>(`/api/holidays/${id}`, {
      method: 'DELETE',
    });
  }

  // Integrations
  async getIntegrations() {
    return this.request<{ data: unknown[] }>('/api/integrations');
  }

  async updateIntegration(id: string, data: unknown) {
    return this.request<{ data: unknown }>(`/api/integrations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Files
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/upload/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async getFileUrl(id: string) {
    return this.request<{ data: { url: string } }>(`/api/files/${id}/url`);
  }
}

export const apiClient = new ApiClient(API_BASE);
