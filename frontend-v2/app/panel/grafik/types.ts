import type { AvailabilityRecord } from "@/lib/api";

export type ShiftDisplay = {
  id: string;
  date: string;
  start: string;
  end: string;
  employeeName: string;
  employeeId?: string;
  employeeAvatar?: string | null;
  locationName: string;
  locationId?: string | null;
  status: "ASSIGNED" | "UNASSIGNED";
  availabilityWarning?: string | null;
  position?: string | null;
  color?: string | null;
};

export type ShiftFormState = {
  employeeId: string;
  locationId?: string;
  position?: string;
  notes?: string;
  color?: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type WeekRange = { from: string; to: string; label: string };

export type AvailabilityStatus = "available" | "partial" | "unavailable";

export type AvailabilityIndicator = {
  status: AvailabilityStatus;
  label: string;
  windows: AvailabilityRecord[];
};
