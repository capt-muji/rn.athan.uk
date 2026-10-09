// R14 part 2: @photostructure/tz-lookup, re-verified at scale.
//
// R4 verified it on 16 hand-picked coordinates. This checks it against every one of the 34,152
// GeoNames cities15000 places, which carry their own IANA zone, so the disagreement rate is
// measurable rather than asserted. Then it measures what a disagreement COSTS in prayer minutes,
// because a wrong zone is a wrong UTC offset and therefore a whole-hour error.
import fs from 'node:fs';
import tzlookup from '@photostructure/tz-lookup';
import { table } from './lib.mjs';

const cities = [];
for (const line of fs.readFileSync('cities15000.txt', 'utf8').split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  const lat = Number(f[4]);
  const lon = Number(f[5]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  cities.push({ name: f[1], cc: f[8], lat, lon, pop: Number(f[14]) || 0, tz: f[17] });
}

const out = [];
const say = (s = '') => out.push(s);

const pkg = JSON.parse(fs.readFileSync('node_modules/@photostructure/tz-lookup/package.json', 'utf8'));
say('# R14 part 2: `@photostructure/tz-lookup` verified against 34,152 GeoNames places');
say('');
say(`Version ${pkg.version}, licence ${pkg.license} (both read from the installed package).`);
say('GeoNames `cities15000` carries its own IANA zone per place, so this is a two-source check.');
say('');

const offsetAt = (zone, date) => {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'longOffset' });
  const p = f.formatToParts(date).find((x) => x.type === 'timeZoneName').value;
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(p);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
};

const PROBE = [new Date(Date.UTC(2026, 0, 15)), new Date(Date.UTC(2026, 6, 15))];

let agree = 0;
const differ = [];
let threw = 0;
for (const c of cities) {
  let got;
  try {
    got = tzlookup(c.lat, c.lon);
  } catch {
    threw++;
    continue;
  }
  if (got === c.tz) {
    agree++;
    continue;
  }
  let maxOff = 0;
  for (const d of PROBE) {
    try {
      maxOff = Math.max(maxOff, Math.abs(offsetAt(got, d) - offsetAt(c.tz, d)));
    } catch {
      maxOff = -1;
    }
  }
  differ.push({ ...c, got, offsetDiff: maxOff });
}

say('## 2N. Agreement on the zone NAME');
say('');
say(
  table(
    ['outcome', 'places', 'share'],
    [
      ['identical zone name', agree.toLocaleString('en-GB'), ((100 * agree) / cities.length).toFixed(2) + '%'],
      ['different zone name', String(differ.length), ((100 * differ.length) / cities.length).toFixed(2) + '%'],
      ['the library threw', String(threw), ((100 * threw) / cities.length).toFixed(2) + '%'],
    ]
  )
);
say('');

say('## 2O. What the disagreements actually cost, in UTC offset minutes');
say('');
say('A different zone NAME with the SAME offset all year costs a prayer time nothing. Only an');
say('offset difference is an error, and it is a whole-hour error.');
say('');
{
  const same = differ.filter((d) => d.offsetDiff === 0);
  const real = differ.filter((d) => d.offsetDiff > 0);
  const bad = differ.filter((d) => d.offsetDiff < 0);
  say(
    table(
      ['class', 'places', 'population'],
      [
        ['different name, identical offset at both probes', String(same.length), same.reduce((s, d) => s + d.pop, 0).toLocaleString('en-GB')],
        ['**different offset, a real error**', String(real.length), real.reduce((s, d) => s + d.pop, 0).toLocaleString('en-GB')],
        ['offset unreadable on this platform', String(bad.length), bad.reduce((s, d) => s + d.pop, 0).toLocaleString('en-GB')],
      ]
    )
  );
  say('');
  if (real.length) {
    say('Every place where the offset genuinely differs:');
    say('');
    say(
      table(
        ['place', 'cc', 'population', 'GeoNames zone', 'tz-lookup zone', 'max offset gap min'],
        real
          .sort((a, b) => b.pop - a.pop)
          .slice(0, 60)
          .map((d) => [d.name, d.cc, d.pop.toLocaleString('en-GB'), '`' + d.tz + '`', '`' + d.got + '`', String(d.offsetDiff)])
      )
    );
    say('');
  }
  if (same.length) {
    say('The name-only disagreements, grouped by the pair, top 25 by count:');
    say('');
    const byPair = new Map();
    for (const d of same) {
      const k = `${d.tz} -> ${d.got}`;
      if (!byPair.has(k)) byPair.set(k, { n: 0, pop: 0, ex: d.name });
      const r = byPair.get(k);
      r.n++;
      r.pop += d.pop;
    }
    say(
      table(
        ['GeoNames zone', 'tz-lookup zone', 'places', 'example'],
        [...byPair.entries()]
          .sort((a, b) => b[1].n - a[1].n)
          .slice(0, 25)
          .map(([k, v]) => {
            const [a, b] = k.split(' -> ');
            return ['`' + a + '`', '`' + b + '`', String(v.n), v.ex];
          })
      )
    );
    say('');
  }
}

say('## 2P. The measured bundle cost');
say('');
{
  const dir = 'node_modules/@photostructure/tz-lookup';
  const walk = (d) => {
    let t = 0;
    const rows = [];
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) {
        const [st, sr] = walk(p);
        t += st;
        rows.push(...sr);
      } else {
        const s = fs.statSync(p).size;
        t += s;
        rows.push([p.replace('node_modules/@photostructure/tz-lookup/', ''), s]);
      }
    }
    return [t, rows];
  };
  const [total, rows] = walk(dir);
  say(
    table(
      ['file', 'bytes'],
      rows
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([f, s]) => ['`' + f + '`', s.toLocaleString('en-GB')])
    )
  );
  say('');
  say(`Installed total on disk: **${total.toLocaleString('en-GB')} bytes** (measured).`);
  say('');
}

fs.writeFileSync('part2-tzlookup-differ.json', JSON.stringify(differ, null, 1));
console.log(out.join('\n'));
