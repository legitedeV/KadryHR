"use client";

import { useSearchParams } from "next/navigation";
import { ScheduleExportView } from "@/features/schedule-v2/ScheduleExportView";

export default function GrafikExportPage() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month");
  return <ScheduleExportView month={month} />;
}
