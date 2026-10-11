// Emits the 31 calendar keys per locale from Node's CLDR (full ICU ships with Node 18+).
// The app renders 'EEE, d MMM yyyy' (short weekday, short month) for Gregorian and a long
// Hijri month, so the key set is: monthShort x12, weekdayShort x7, hijri x12.
// Planning-time authoring only: the catalog ships the strings, the app never calls Intl
// for these names at runtime (ARCH-3/A2: Hermes has no full ICU and Intl swaps change
// order, era affixes and the Thai year).
//
// Usage: node gen-calendar-keys.mjs > calendar-keys.json
const LOCALES = ['ar', 'ms', 'so', 'hi', 'th'];
const MONTHS = Array.from({ length: 12 }, (_, i) => i);
// 2026-10-05..11 is Monday..Sunday; keys are ISO-numbered (weekdayShort.1 = Monday)
const WEEKDAYS = [5, 6, 7, 8, 9, 10, 11];

const forms = (locale, opts, dates) => dates.map((d) => new Intl.DateTimeFormat(locale, opts).format(d));

// The Hijri year is ~354 days, so sampling fixed Gregorian dates misses a month. Walk day
// by day and keep the first occurrence of each islamic month index 1..12.
const hijriMonths = (loc) => {
  const fmt = new Intl.DateTimeFormat(`${loc}-u-ca-islamic-umalqura`, { month: 'long' });
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric' });
  const out = [];
  const d = new Date(2026, 0, 15);
  const seen = new Set();
  while (seen.size < 12) {
    const idx = Number(parts.format(d));
    if (!seen.has(idx)) {
      seen.add(idx);
      out[idx - 1] = fmt.format(d);
    }
    d.setDate(d.getDate() + 1);
  }
  if (out.some((v) => v === undefined)) throw new Error(`sparse hijri year for ${loc}`);
  return out;
};

const out = {};
for (const loc of LOCALES) {
  const monthShort = forms(
    loc,
    { month: 'short' },
    MONTHS.map((m) => new Date(2026, m, 15))
  );
  const weekdayShort = forms(
    loc,
    { weekday: 'short' },
    WEEKDAYS.map((d) => new Date(2026, 9, d))
  );
  const hijri = hijriMonths(loc);
  out[loc] = {
    monthShort: Object.fromEntries(monthShort.map((v, i) => [`calendar.monthShort.${i + 1}`, v])),
    weekdayShort: Object.fromEntries(weekdayShort.map((v, i) => [`calendar.weekdayShort.${i + 1}`, v])),
    hijri: Object.fromEntries(hijri.map((v, i) => [`calendar.hijri.${i + 1}`, v])),
  };
}
process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
