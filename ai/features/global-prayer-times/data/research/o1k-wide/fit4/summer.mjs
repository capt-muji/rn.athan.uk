// Summer regime dump for Dundee/Glasgow: fajr lead and isha lag vs night.
// Run: TZ=Europe/London node summer.mjs <glasgow|dundee>
import { loadTable, makeContext } from './engine.mjs';
const HOME = process.env.HOME;
const tag = process.argv[2] ?? 'dundee';
const cfg = tag === 'glasgow'
  ? { file: HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/glasgow-central-mosque-2026.json', cols: { fajr: 'fajr_begins', sunrise: 'sunrise', maghrib: 'maghrib_begins', isha: 'isha_begins' }, lat: 55.8609, lng: -4.2479 }
  : { file: HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/dundee-almaktoum-mosque-2026.json', cols: { fajr: 'fajr_begins', sunrise: 'sunrise', maghrib: 'maghrib_begins', isha: 'isha_begins' }, lat: 56.4620, lng: -2.9707 };
const t = loadTable(cfg);
const ctx = await makeContext(cfg.lat, cfg.lng, t.slots);
const fmt = (v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
console.log('date  srChart srComp  fChart  lead  night  lead/night   mgChart mgComp  iChart  lag  lag/night');
for (let i = 0; i < t.slots.length; i++) {
  const k = t.slots[i].key;
  if (!(k >= '2026-04-15' && k <= '2026-09-05')) continue;
  const srC = ctx.raw.sunrise[i] / 60, mgC = ctx.raw.maghrib[i] / 60;
  const f = t.slots[i].chart.fajr, sr = t.slots[i].chart.sunrise, mg = t.slots[i].chart.maghrib, is = t.slots[i].chart.isha;
  const night = ctx.night[i] / 60;
  const lead = sr - f, lag = is - mg;
  console.log(`${k}  ${fmt(sr)}/${fmt(srC)}  ${fmt(f)}  ${String(lead).padStart(4)}  ${String(Math.round(night)).padStart(4)}  ${(lead / night).toFixed(3)}   ${fmt(mg)}/${fmt(mgC)}  ${fmt(is)}  ${String(lag).padStart(4)}  ${(lag / night).toFixed(3)}`);
}
