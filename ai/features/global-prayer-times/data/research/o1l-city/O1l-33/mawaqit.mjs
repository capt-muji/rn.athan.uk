import fs from 'node:fs';

const [, , htmlPath, outPath, url] = process.argv;
const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/let confData = (\{.*?\});\n/s);
if (!m) { console.error('no confData'); process.exit(2); }
const conf = JSON.parse(m[1]);
const cal = conf.calendar || {};
const rows = [];
const dim = (y, mo) => new Date(Date.UTC(y, mo, 0)).getUTCDate();
// mawaqit keys months 0-11; capture date fixes the calendar year
const year = Number(process.env.MW_YEAR || 2026);
for (let mo = 0; mo < 12; mo++) {
  const month = cal[String(mo)];
  if (!month) continue;
  for (let d = 1; d <= dim(year, mo + 1); d++) {
    const r = month[String(d)];
    if (!r) continue;
    const p = (s) => (s == null ? null : s);
    rows.push({
      date: `${year}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      fajr: p(r[0]), sunrise: p(r[1]), dhuhr: p(r[2]), asr: p(r[3]), maghrib: p(r[4]), isha: p(r[5]),
      ...(r[6] ? { fajr_iqama: p(r[6]) } : {}),
    });
  }
}
// live-page gate: today's calendar row must equal the page's own times_today
const now = process.env.MW_TODAY || '2026-11-11';
const todayRow = rows.find((r) => r.date === now);
const tt = conf.times || [];
const gate = todayRow
  ? [todayRow.fajr, todayRow.dhuhr, todayRow.asr, todayRow.maghrib, todayRow.isha].join() === tt.join()
  : false;
const out = {
  source: conf.name,
  label: conf.label,
  uuid: conf.uuid,
  url: url || null,
  latitude: conf.latitude,
  longitude: conf.longitude,
  timezone: conf.timezone,
  times_today: tt,
  shuruq_today: conf.shuruq,
  jumua: conf.jumua,
  iqama_delays: conf.iqama,
  live_page_gate: { date: now, pass: gate },
  rows_total: rows.length,
  rows,
};
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ name: out.source, lat: out.latitude, lon: out.longitude, tz: out.timezone, rows: out.rows_total, gate }, null, 0));
