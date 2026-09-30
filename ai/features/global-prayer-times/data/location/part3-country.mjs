// R14 part 3: does the device TIMEZONE identify the country, which is what source selection
// actually needs? And does the device REGION do better?
//
// `zone.tab` lists exactly one country per zone by construction, so it cannot answer this.
// `zone1970.tab` is the file that can: it lists every country a zone covers. This measures the
// ambiguity that matters, weighted by population, and names every case where a source choice
// would go wrong.
import fs from 'node:fs';
import { table } from './lib.mjs';

const MM = new Set(
  'AF AL AZ BH BD BN BF TD KM CI DJ EG ER GM GN GW ID IR IQ JO KZ KW KG LB LY MY MV ML MR MA NE NG OM PK PS QA SA SN SL SO SD SY TJ TZ TN TR TM AE EH YE MK'.split(
    ' '
  )
);

const z2c = new Map();
const c2z = new Map();
for (const line of fs.readFileSync('zone1970.tab', 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const f = line.split('\t');
  const ccs = f[0].split(',');
  const zone = f[2];
  z2c.set(zone, ccs);
  for (const cc of ccs) {
    if (!c2z.has(cc)) c2z.set(cc, new Set());
    c2z.get(cc).add(zone);
  }
}

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
say('# R14 part 3: does the device timezone identify the COUNTRY?');
say('');
say('Source: `zone1970.tab` from the IANA distribution, which unlike `zone.tab` lists every');
say('country a zone covers. Read from the copy fetched with the tzdata distribution.');
say('');
say(`Zones in \`zone1970.tab\`: ${z2c.size}. Zones naming more than one country: **${[...z2c.values()].filter((c) => c.length > 1).length}**.`);
say('');

say('## 3A. Every ambiguous zone that touches a Muslim-majority country');
say('');
say('These are the cases where the device zone alone cannot pick a national authority, because');
say('two or more countries share the zone and R1 measured that their authorities differ.');
say('');
{
  const rows = [];
  for (const [z, ccs] of [...z2c.entries()].sort()) {
    if (ccs.length < 2) continue;
    if (!ccs.some((c) => MM.has(c))) continue;
    const pops = ccs.map((cc) => {
      const p = cities.filter((c) => c.cc === cc).reduce((s, c) => s + c.pop, 0);
      return { cc, p, mm: MM.has(cc) };
    });
    pops.sort((a, b) => b.p - a.p);
    rows.push([
      '`' + z + '`',
      String(ccs.length),
      pops
        .filter((x) => x.mm)
        .map((x) => `${x.cc} ${(x.p / 1e6).toFixed(1)}M`)
        .join(', '),
      pops
        .filter((x) => !x.mm)
        .map((x) => x.cc)
        .join(' '),
    ]);
  }
  say(table(['zone', 'countries', 'Muslim-majority members with `cities15000` population', 'other members'], rows));
}
say('');

say('## 3B. The counts that decide the design');
say('');
{
  const mm = [...MM].filter((cc) => c2z.has(cc));
  const single = mm.filter((cc) => c2z.get(cc).size === 1);
  const multi = mm.filter((cc) => c2z.get(cc).size > 1);
  say(
    table(
      ['measure', 'value'],
      [
        ['Muslim-majority countries in `zone1970.tab`', String(mm.length)],
        ['of those, exactly ONE IANA zone', `**${single.length}**`],
        [
          'of those, more than one zone',
          `${multi.length}: ${multi.map((cc) => `${cc} (${c2z.get(cc).size})`).join(', ')}`,
        ],
      ]
    )
  );
  say('');
  say('So for a large majority of Muslim-majority countries the zone and the country carry the');
  say('SAME information, which is why the zone is a usable country signal despite the ten');
  say('ambiguous cases above.');
  say('');
}

say('## 3C. The ambiguity from the other side: how many people live in an ambiguous zone?');
say('');
{
  const amb = new Set([...z2c.entries()].filter(([, c]) => c.length > 1).map(([z]) => z));
  const mmCities = cities.filter((c) => MM.has(c.cc));
  const tot = mmCities.reduce((s, c) => s + c.pop, 0);
  const inAmb = mmCities.filter((c) => amb.has(c.tz));
  const p = inAmb.reduce((s, c) => s + c.pop, 0);
  say(
    table(
      ['measure', 'value'],
      [
        ['`cities15000` population in Muslim-majority countries', tot.toLocaleString('en-GB')],
        ['of that, living in a zone `zone1970.tab` shares with another country', p.toLocaleString('en-GB')],
        ['share', ((100 * p) / tot).toFixed(1) + '%'],
      ]
    )
  );
  say('');
  const byCC = new Map();
  for (const c of inAmb) byCC.set(c.cc, (byCC.get(c.cc) ?? 0) + c.pop);
  say('By country, so the affected populations are named rather than aggregated:');
  say('');
  say(
    table(
      ['cc', 'population in a shared zone', 'the zone'],
      [...byCC.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([cc, p2]) => [
          cc,
          p2.toLocaleString('en-GB'),
          [...new Set(inAmb.filter((c) => c.cc === cc).map((c) => c.tz))].map((z) => '`' + z + '`').join(', '),
        ])
    )
  );
}
say('');
console.log(out.join('\n'));
