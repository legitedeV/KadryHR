import { ScheduleExportView } from "@/features/schedule-v2/ScheduleExportView";

export const dynamic = "force-dynamic";

type GrafikExportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function GrafikExportPage({ searchParams }: GrafikExportPageProps) {
  const resolvedSearchParams = await searchParams;
  const monthParam = resolvedSearchParams?.month;
  const month = Array.isArray(monthParam) ? monthParam[0] : monthParam;
  return <ScheduleExportView month={month ?? null} />;
}
