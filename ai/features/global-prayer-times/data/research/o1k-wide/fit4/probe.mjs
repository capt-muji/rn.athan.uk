// Probe: fast path (pairSec) must equal full PrayerTimes to the second,
// including the night-portion fallback on days the angle fails.
// Run: TZ=Europe/London node probe.mjs
import { loadAdhan } from './lib.mjs';
import { loadTable, makeContext } from './engine.mjs';

const HOME = process.env.HOME;
const adhan = await loadAdhan();

const cfg = {
  file: HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/glasgow-central-mosque-2026.json',
  cols: { fajr: 'fajr_begins', sunrise: 'sunrise', dhuhr: 'zuhr_begins', asr: 'asr_mithl_1', maghrib: 'maghrib_begins', isha: 'isha_begins' },
};
const t = loadTable(cfg);
console.log('glasgow rows', t.rowsParsed, 'pm', JSON.stringify(t.pm));

const ctx = await makeContext(55.8609, -4.2479, t.slots);
const coords = ctx.coords;
const PT = adhan.PrayerTimes;

// days: winter (angle holds), June (18/15 fail at 55.86N), shoulder
const pick = ['2026-01-15', '2026-03-15', '2026-06-10', '2026-06-21', '2026-08-01', '2026-12-21'];
for (const key of pick) {
  const i = t.slots.findIndex((s) => s.key === key);
  const date = t.slots[i].date;
  for (const madhab of ['shafi', 'hanafi']) {
    // bare angles
    {
      const p = new adhan.CalculationParameters(null, 18, 15);
      p.rounding = 'none';
      p.madhab = madhab;
      const pt = new PT(coords, date, p);
      const fast = ctx.pairSec(i, 18, 15, null);
      const okF = fast.f === null ? 'null' : fast.f;
      const ptF = pt.fajr.getHours() * 3600 + pt.fajr.getMinutes() * 60 + pt.fajr.getSeconds();
      console.log(key, madhab, 'bare fajr fast', okF, 'pt', ptF, fast.f === null ? '(angle NaN -> pt falls to highLatRule)' : fast.f === ptF ? 'OK' : 'MISMATCH');
    }
    // Wifaqul portions 1/2 + 1/7
    {
      const p = new adhan.CalculationParameters(null, 18, 15);
      p.rounding = 'none';
      p.madhab = madhab;
      p.nightPortions = () => ({ fajr: 1 / 2, isha: 1 / 7 });
      const pt = new PT(coords, date, p);
      const fast = ctx.pairSec(i, 18, 15, { fajr: 1 / 2, isha: 1 / 7 });
      const ptF = pt.fajr.getHours() * 3600 + pt.fajr.getMinutes() * 60 + pt.fajr.getSeconds();
      const ptI = pt.isha.getHours() * 3600 + pt.isha.getMinutes() * 60 + pt.isha.getSeconds();
      console.log(key, madhab, 'wifaqul portions fajr', fast.f === ptF ? 'OK' : 'MISMATCH ' + fast.f + ' vs ' + ptF, 'isha', fast.i === ptI ? 'OK' : 'MISMATCH ' + fast.i + ' vs ' + ptI);
    }
    // solar columns
    {
      const p = new adhan.CalculationParameters(null, 18, 15);
      p.rounding = 'none';
      p.madhab = madhab;
      const pt = new PT(coords, date, p);
      const s = (d) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
      const st = ctx.solar[i];
      const okS = s(pt.sunrise) === s(ctx.inst(date, st.sunrise));
      const okA = s(pt.asr) === s(ctx.inst(date, st.afternoon(madhab === 'shafi' ? 1 : 2)));
      const okM = s(pt.maghrib) === s(ctx.inst(date, st.sunset));
      console.log(key, madhab, 'solar sunrise/asr/maghrib', okS && okA && okM ? 'OK' : `MISMATCH ${okS} ${okA} ${okM}`);
    }
  }
}

// pm detection on the mixed-format files
for (const [file, cols] of [
  [HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/bolton-zakariyya-2026.json', { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }],
  [HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/aberdeen-amic-central-2026.json', { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }],
  [HOME + '/athan-gitree/census/o1k-wide/europe/data/no-islamweb-oslo-2026.json', { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }],
]) {
  const x = loadTable({ file, cols });
  console.log(file.split('/').pop(), x.rowsParsed, 'pm', JSON.stringify(x.pm));
}
