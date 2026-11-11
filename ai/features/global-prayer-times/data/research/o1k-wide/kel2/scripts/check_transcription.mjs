// Structural checks on the transcribed mufti poster, before any geometry is fitted.
import { readFileSync } from 'node:fs';

const D = JSON.parse(readFileSync(new URL('../data/ktn-mufti-1441.json', import.meta.url), 'utf8'));
const MON = { jan: 1, feb: 2, mac: 3, apr: 4, mei: 5, jun: 6, jul: 7, julai: 7, ogos: 8, sep: 9, okt: 10, nov: 11, dis: 12 };
const DAY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const COL = ['subuh', 'syuruk', 'dhuha', 'zohor', 'asar', 'maghrib', 'isyak'];

const hhmm = (s) => {
  const [h, m] = s.split('.');
  return (+h % 12) * 60 + +m + (COL_MERIDIEM.has(s) ? 720 : 0);
};
// Poster prints imsak-class times in 12-hour form without a marker; the pm columns
// are the four after dhuha, so the marker is applied per column index instead.
function toMin(s, colIndex) {
  const [h, m] = s.split('.');
  return (+h + (colIndex >= 3 ? 12 : 0)) * 60 + +m;
}
const COL_MERIDIEM = new Set();

let failures = 0;
const fail = (msg) => { console.log('FAIL', msg); failures++; };

for (const [month, zones] of Object.entries(D.readings)) {
  for (const [zone, rows] of Object.entries(zones)) {
    const tag = `${month}/${zone}`;
    let prevDate = null;
    for (const row of rows) {
      const [hijri, dateStr, weekday, ...times] = row;
      const min = times.map((t, i) => toMin(t, i));
      const [dd, mon] = dateStr.trim().split(/\s+/);
      const y = 2020;
      const iso = `${y}-${String(MON[mon.toLowerCase()]).padStart(2, '0')}-${String(+dd).padStart(2, '0')}`;
      const dow = new Date(Date.UTC(y, MON[mon.toLowerCase()] - 1, +dd)).getUTCDay();
      if (DAY[dow].toLowerCase() !== weekday.toLowerCase()) fail(`${tag} r${hijri}: weekday ${weekday} != ${DAY[dow]} (${iso})`);
      if (prevDate && iso <= prevDate) fail(`${tag} r${hijri}: date ${iso} not after ${prevDate}`);
      prevDate = iso;
      const gapDhuha = min[2] - min[1];
      const gapIsha = min[6] - min[5];
      if (gapDhuha !== 28) console.log(`  note ${tag} r${hijri} ${iso}: dhuha - syuruk = ${gapDhuha}`);
      if (gapIsha < 69 || gapIsha > 73) console.log(`  note ${tag} r${hijri} ${iso}: isyak - maghrib = ${gapIsha}`);
      for (let i = 1; i < min.length; i++) {
        if (min[i] <= min[i - 1]) fail(`${tag} r${hijri} ${iso}: ${COL[i]} ${times[i]} not after ${COL[i - 1]} ${times[i - 1]}`);
      }
    }
    console.log(`${tag}: ${rows.length} rows, ${rows[0].length - 3} time columns, first ${rows[0][1]}, last ${rows[rows.length - 1][1]}`);
  }
}

// Cross-zone offset: the two zones must differ in a fixed, plausible way.
for (const [month, zones] of Object.entries(D.readings)) {
  const a = zones.zon1, b = zones.zon2;
  const delta = COL.map((_, i) => {
    const d = b.map((r, n) => toMin(r[3 + i], i) - toMin(a[n][3 + i], i));
    return `${COL[i]} ${[...new Set(d)].sort((x, y) => x - y).join('/')}`;
  });
  console.log(`${month} zon2-zon1 minutes:`, delta.join('  '));
}
console.log(failures === 0 ? 'no structural failures' : `${failures} failures`);
