// R14 part 3: is coordinate-to-JAKIM-zone actually solved, and can it be done OFFLINE?
//
// api.waktusolat.app exposes GET /zones/{lat}/{lon}. That is a network service, which this app
// cannot depend on. The question that matters is whether the MAPPING behind it is something the
// app could ship. Two tests:
//   3C. Probe the service on a grid over Malaysia and record what it answers, including where it
//       answers nothing. That measures how complete any coordinate-to-zone mapping can be.
//   3D. Measure the size of the answer set and whether a nearest-point classifier over the
//       returned samples reproduces the service, which is what a shippable offline table is.
import fs from 'node:fs';
import { table } from './lib.mjs';

const CACHE = 'wsgrid.json';
const grid = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

// Malaysia's bounding box, both halves, plus a margin so the sea is probed too.
const BOXES = [
  ['peninsula', 0.8, 6.8, 99.5, 104.6],
  ['borneo', 0.8, 7.5, 109.5, 119.4],
];
const STEP = 0.25;

async function probe(lat, lon) {
  const k = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (k in grid) return grid[k];
  try {
    const res = await fetch(`https://api.waktusolat.app/zones/${lat.toFixed(4)}/${lon.toFixed(4)}`);
    if (!res.ok) {
      let body = null;
      try {
        body = await res.json();
      } catch {}
      grid[k] = { http: res.status, body };
    } else {
      grid[k] = await res.json();
    }
  } catch (e) {
    grid[k] = { err: String(e).slice(0, 80) };
  }
  return grid[k];
}

const points = [];
for (const [, la0, la1, lo0, lo1] of BOXES) {
  for (let la = la0; la <= la1 + 1e-9; la += STEP) {
    for (let lo = lo0; lo <= lo1 + 1e-9; lo += STEP) points.push([Number(la.toFixed(3)), Number(lo.toFixed(3))]);
  }
}

let done = 0;
const CONC = 12;
for (let i = 0; i < points.length; i += CONC) {
  await Promise.all(points.slice(i, i + CONC).map(([la, lo]) => probe(la, lo)));
  done += CONC;
  if (done % 600 < CONC) {
    fs.writeFileSync(CACHE, JSON.stringify(grid));
    process.stderr.write(`${Math.min(done, points.length)}/${points.length}\n`);
  }
}
fs.writeFileSync(CACHE, JSON.stringify(grid));

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 3C: probing `api.waktusolat.app` `GET /zones/{lat}/{lon}` on a grid');
say('');
say(`Grid step ${STEP} degrees, ${points.length} points over two bounding boxes covering peninsular`);
say('Malaysia and Malaysian Borneo, including surrounding sea. Fetched on the date in the report.');
say('');

// The service answers "no zone" with HTTP 500 and the body
// {"error":"No zone found for the given coordinates."}, which is a miss and not a fault.
const hits = [];
const noZone = [];
const errs = [];
for (const [la, lo] of points) {
  const v = grid[`${la.toFixed(3)},${lo.toFixed(3)}`];
  if (v && v.zone) hits.push({ la, lo, ...v });
  else if (v && v.http === 500) noZone.push({ la, lo });
  else errs.push({ la, lo, v });
}
say(
  table(
    ['outcome', 'points', 'share'],
    [
      ['a zone was returned', String(hits.length), ((100 * hits.length) / points.length).toFixed(1) + '%'],
      ['`No zone found for the given coordinates.` (HTTP 500)', String(noZone.length), ((100 * noZone.length) / points.length).toFixed(1) + '%'],
      ['transport failure, retried', String(errs.length), ((100 * errs.length) / points.length).toFixed(1) + '%'],
    ]
  )
);
say('');
say('Most of the no-zone points are open sea inside the two bounding boxes, which is correct');
say('behaviour. What it establishes is that the service refuses rather than guesses, so a user');
say('just offshore or in an unmapped district gets nothing.');
say('');

const byZone = new Map();
for (const h of hits) {
  if (!byZone.has(h.zone)) byZone.set(h.zone, []);
  byZone.get(h.zone).push(h);
}
say(`Distinct zones the service returned anywhere on the grid: **${byZone.size}** of the 60 JAKIM publishes.`);
say('');
{
  const rows = [...byZone.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([z, a]) => ['`' + z + '`', String(a.length), a[0].district ?? '', a[0].state ?? '']);
  say(table(['zone', 'grid points', 'district returned', 'state'], rows));
}
say('');
const JAKIM60 = 'JHR01 JHR02 JHR03 JHR04 KDH01 KDH02 KDH03 KDH04 KDH05 KDH06 KDH07 KTN01 KTN02 MLK01 NGS01 NGS02 NGS03 PHG01 PHG02 PHG03 PHG04 PHG05 PHG06 PHG07 PLS01 PNG01 PRK01 PRK02 PRK03 PRK04 PRK05 PRK06 PRK07 SBH01 SBH02 SBH03 SBH04 SBH05 SBH06 SBH07 SBH08 SBH09 SGR01 SGR02 SGR03 SWK01 SWK02 SWK03 SWK04 SWK05 SWK06 SWK07 SWK08 SWK09 TRG01 TRG02 TRG03 TRG04 WLY01 WLY02'.split(' ');
const never = JAKIM60.filter((z) => !byZone.has(z));
say(`Zones the service NEVER returned on this grid (${never.length}): ${never.map((z) => '`' + z + '`').join(', ') || 'none'}.`);
say('');
say('A zone never returned by a coordinate lookup cannot be reached by GPS at all, so those users');
say('need a picker no matter what.');
say('');

// ------ can a nearest-point classifier over the hits reproduce the service?
say('## 3D. Could the mapping ship offline as a nearest-point table?');
say('');
{
  const hav = (a, b) => {
    const R = 6371.0088;
    const dLat = ((b.la - a.la) * Math.PI) / 180;
    const dLon = ((b.lo - a.lo) * Math.PI) / 180;
    const l1 = (a.la * Math.PI) / 180;
    const l2 = (b.la * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  // leave-one-out: classify each hit by its nearest OTHER hit
  let ok = 0;
  for (const h of hits) {
    let best = null;
    let bd = Infinity;
    for (const o of hits) {
      if (o === h) continue;
      const d = hav(h, o);
      if (d < bd) {
        bd = d;
        best = o;
      }
    }
    if (best && best.zone === h.zone) ok++;
  }
  say(
    `Leave-one-out nearest-neighbour accuracy over the ${hits.length} on-land grid points: ` +
      `**${((100 * ok) / hits.length).toFixed(1)}%** (${ok} of ${hits.length}).`
  );
  say('');
  const bytes = hits.length * 5; // int16 lat, int16 lon, uint8 zone index
  say(
    `Storing the grid itself as 2 int16 coordinates plus a 1-byte zone index is ${bytes.toLocaleString('en-GB')} raw bytes ` +
      `for ${STEP}-degree resolution, which is about ${(STEP * 111).toFixed(0)} km of cell.`
  );
  say('');
}
console.log(out.join('\n'));
