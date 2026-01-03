export function formatDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const formatter = new Intl.DateTimeFormat("pl-PL");
  if (formatter.format(startDate) === formatter.format(endDate)) {
    return formatter.format(startDate);
  }
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}
