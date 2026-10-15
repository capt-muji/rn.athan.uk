export const formatDateLocalized = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  // A calendar date needs no timezone: noon on the phone's own clock always exists
  const weekday = new Date(year, month - 1, day, 12).getDay();
  // The catalog keys are ISO-numbered, Monday 1 to Sunday 7
  const isoWeekday = weekday === 0 ? 7 : weekday;
  const composed = `${t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1])}, ${localizeDigits(String(day))} ${t(GREGORIAN_MONTH_KEYS[month - 1])} ${localizeDigits(String(year))}`;
  return composed;
};
