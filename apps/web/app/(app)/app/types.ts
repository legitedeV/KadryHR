export type DashboardSummary = {
  meta: {
    organization: { id: string; name: string };
    asOf: string;
    window: { start: string; end: string };
  };
  stats: {
    activeEmployees: number;
    publishedSchedules: number;
    pendingLeaves: number;
    upcomingShifts: number;
    unreadNotifications: number;
    coverageRatio: number;
  };
  schedule: {
    month: string;
    status: string;
    assignments: number;
    publishedSchedules: number;
    upcoming: Array<{
      id: string;
      employeeName: string;
      date: string;
      start: string;
      end: string;
      type: string;
    }>;
  };
  leaves: {
    pendingCount: number;
    upcoming: Array<{
      id: string;
      employeeName: string;
      date: string;
      type: string;
      status: 'PENDING' | 'APPROVED';
      note?: string | null;
    }>;
  };
  notifications: {
    unread: number;
    items: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      createdAt: string;
      unread?: boolean;
    }>;
  };
  availability: {
    activeEmployees: number;
    scheduledEmployees: number;
    coverageRatio: number;
    days: Array<{
      date: string;
      scheduledCount: number;
      openSpots: number;
    }>;
  };
};
