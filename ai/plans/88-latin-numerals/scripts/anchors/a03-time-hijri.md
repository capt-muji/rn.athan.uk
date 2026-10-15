export const formatHijriDateLocalized = (date: string): string => {
  try {
    const hijriFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      timeZone: PRAYER_TIMEZONE,
    });
    const parts = hijriFormatter.formatToParts(getDayAnchor(date));
    const hijriMonth = Number(parts.find((part) => part.type === 'month')?.value);
    const hijriDay = parts.find((part) => part.type === 'day')?.value;
    const hijriYear = parts.find((part) => part.type === 'year')?.value;
    const composed = `${t(HIJRI_MONTH_KEYS[hijriMonth - 1])} ${localizeDigits(String(hijriDay))}, ${localizeDigits(String(hijriYear))}`;
    return composed;
  } catch {
