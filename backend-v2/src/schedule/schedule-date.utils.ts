const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const addUtcDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

export const buildScheduleRange = (from: string, to: string) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const isDateOnly = DATE_ONLY_REGEX.test(to);
  const toExclusive = isDateOnly ? addUtcDays(toDate, 1) : toDate;

  return {
    from: fromDate,
    to: toDate,
    toExclusive,
    isDateOnly,
  };
};
