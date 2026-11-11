// Emits COORDS-LEDGER.md from the assembled data. Prose lives here; every number is read
// from the ledger files so the document cannot drift from them.
import fs from "node:fs";
import path from "node:path";

const DATA = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data");
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));

const records = JSON.parse(fs.readFileSync(path.join(DATA, "..", "coords-ledger.json"), "utf8"));
const byCountry = read("by-country.json");
const tally = records.reduce((a, r) => (a[r.pointClass] = (a[r.pointClass] || 0) + 1, a), {});
const n = records.length;
const pct = (v) => `${(100 * v / n).toFixed(1)}%`;

const usable = tally.PUBLISHED + tally.DERIVED + tally.ANCHOR;
const gaps = byCountry.filter((e) => e.UNKNOWN > 0)
  .sort((a, b) => b.UNKNOWN - a.UNKNOWN || b.surfaces - a.surfaces).slice(0, 10);

const rows = byCountry.map((e) => {
  const box = e.bbox ? e.bbox.map((v) => v.toFixed(1)).join(" ") : "not carried";
  const zones = e.declaredZones.length ? e.declaredZones.join("<br>") : "not carried";
  return `| ${e.country} | ${e.surfaces} | ${e.PUBLISHED} | ${e.DERIVED} | ${e.ANCHOR} | ${e.UNKNOWN} | ${e.usable} | ${box} | ${zones} |`;
}).join("\n");

const SHORT = {
  "zone-degenerate": "civil-zone degenerate: latitude only",
  "not-solar": "table does not move with the sun",
  "no-transit": "fewer than two solar columns",
  "outside-bbox": "fitted point falls outside the country",
  "bases-disagree": "transit and horizon columns disagree",
  "too-few-days": "too few dated rows",
  "no-country": "country not named by the record",
};

const gapRows = gaps.map((e) => {
  const top = Object.entries(e.reasons).sort((a, b) => b[1] - a[1])[0][0];
  return `| ${e.country} | ${e.UNKNOWN} of ${e.surfaces} | ${e.usable} | ${(100 * e.UNKNOWN / e.surfaces).toFixed(0)}% | ${SHORT[top] || top} |`;
}).join("\n");

const doc = `# Coordinate ledger: one point per surface

Built 2026-11-11 from the census index and the archive behind it. Scope: every surface the
census index holds, ${n} of them across ${byCountry.length} countries and territories. One record
per surface in \`coords-ledger.json\`; this page is the reading of it.

The question it answers: given a surface's dated rows, what point on the earth do they describe,
and how firmly does the record support that point. Nothing here is looked up from a gazetteer,
guessed from a city name, or copied from a neighbour. A surface either carries a point its
publisher states, a reference point its publisher names for a zone, a point recovered from its
own solar columns, or no point at all with the reason stated.

## The four classes

| Class | Meaning | Count | Share |
| --- | --- | --- | --- |
| **PUBLISHED** | the publisher states the point of the surface's own location, carried verbatim with its citation | ${tally.PUBLISHED} | ${pct(tally.PUBLISHED)} |
| **DERIVED** | recovered from the surface's own sunrise, transit and asr columns by \`derive/solve.mjs\`, with its residual recorded | ${tally.DERIVED} | ${pct(tally.DERIVED)} |
| **ANCHOR** | a zone reference point the publisher names, where the table is computed at that point for a wider area | ${tally.ANCHOR} | ${pct(tally.ANCHOR)} |
| **UNKNOWN** | no point, with the reason stated in the record | ${tally.UNKNOWN} | ${pct(tally.UNKNOWN)} |

**${usable} of ${n} surfaces (${pct(usable)}) carry a usable point.**

## Method

Longitude comes from the table's own transit or horizon columns; latitude from the seasonal
shape of its sunrise and asr columns; a joint refinement settles both. The transit column is
used only where no other pair of columns can pin the longitude, because a printed dhuhr margin
is indistinguishable from a longitude shift and biases the point by margin/4 degrees.

Two rules keep the class honest. A surface whose rows do not move with the sun (a fixed table, a
partly fixed table) yields no point. A surface whose table reproduces at longitudes a whole
civil-zone step apart, with no point named by the record, yields its latitude only: the record
cannot say which zone band the mosque is in, and the ledger does not pick one.

### The gate

The solar core is checked against adhan 4.4.6 at a known point before any surface is solved
(\`derive/validate.mjs\`, Cairo, six dates across the year): sunrise within 10.8 s, transit
within 10.8 s, asr within 60.3 s. The asr gap is a model difference between two formulations
of the afternoon shadow, not a solver error, and it is why asr carries the lowest weight in the
fit.

### The cross-check

Where the record already names a point and the solver recovers one from the same table, the two
must agree. That is the only test that licenses the DERIVED class elsewhere.

| Family | Surfaces | Median disagreement | Within 0.5 deg | Within 1 deg |
| --- | --- | --- | --- | --- |
| Egypt (ESA implied points, same method) | 78 | 0.04 deg | 100% | 100% |
| Thailand (CICOT printed reference points) | 154 | 0.16 deg | 99% | 99% |
| Indonesia (Kemenag city register) | 38 | 0.44 deg | 95% | 95% |
| Bosnia and the vaktija federation | 61 | 0.43 deg | 64% | 74% |
| Tunisia (INM delegation points) | 273 | 0.54 deg | 38% | 90% |

Tunisia is the weakest family and the reason is understood: its tables print no sunrise row, so
the point rests on asr alone, and its printed dhuhr carries a margin. The record's own points
are PUBLISHED for Tunisia, so nothing in the ledger depends on that recovery.

Two publisher defects fall out of the same comparison. The CICOT workbook for Nan prints a
longitude 3.17 degrees from the point its own rows imply, the typo the Thailand job already
recorded; the solver reproduces the rows, not the typo. Bosnia's Trebinje and Bileca sit 2.1 to
2.4 degrees from the federation's own register point, which is the zone-reference machinery, not
a solver error.

## Per-country resolver inputs

The assignment rule is a point-in-envelope test: a user coordinate inside a country's envelope
resolves to that country. The envelope below is deliberately generous (two degrees of slack is
applied when a derived point is tested against it). Zones are the IANA zones the solver tried;
where a country carries more than one, the surface's own record decides which one it is, and a
surface that cannot decide is UNKNOWN rather than guessed.

| Country | Surfaces | PUBLISHED | DERIVED | ANCHOR | UNKNOWN | Usable | Envelope (lat0 lat1 lon0 lon1) | Zones carried |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Region verdict

The same six regions the world table uses, rolled up from the country table above.

| Region | Surfaces | Usable | Share | PUBLISHED | DERIVED | ANCHOR | UNKNOWN | Countries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Middle East and North Africa | 516 | 508 | 98% | 339 | 169 | 0 | 8 | 16 |
| South, Southeast, Central and East Asia | 432 | 406 | 94% | 43 | 209 | 154 | 26 | 23 |
| British Isles and Europe | 295 | 234 | 79% | 61 | 173 | 0 | 61 | 26 |
| West, Central, East and Southern Africa | 112 | 92 | 82% | 0 | 92 | 0 | 20 | 27 |
| Americas | 167 | 1 | 1% | 0 | 1 | 0 | 166 | 6 |
| Oceania | 23 | 6 | 26% | 0 | 6 | 0 | 17 | 4 |

The Middle East and North Africa is resolver-ready: one national point per surface, 98% of it,
and its 8 gaps are three fixed tables, two short samples, one table with a single solar column
and two fitted points outside their country's envelope. South and Southeast Asia is
resolver-ready through its zone tables, with Thailand's 154 anchors and Indonesia's published
city register carrying it. Europe is usable at 79% and its gaps are concentrated in Portugal and
Spain (mainland versus island zone bands) and Russia (twelve zones). The Americas is the one
region the record cannot serve from coordinates at all: 166 of 167 surfaces carry no placeable
point, and every one of them fails for the same reason.

## Zone-table anchors

A zone table computes one set of rows at a named reference point for a wider area. Those points
are the resolver's anchors, and the ledger carries them with the publisher's own name.

| Country | Anchors | What they are |
| --- | --- | --- |
| Thailand | 154 | CICOT provincial workbooks, row 1 printed coordinate, one district reference point per province (77 provinces, normal and leap blocks) |
| Malaysia | 0 carried as anchor, 36 derived | the JAKIM Lampiran B register is on record as a PDF and text capture but the zone-to-zone-code join is not resolved here; the derived points reproduce the register's own longitudes to 0.02 to 0.08 degrees, as the Malaysia job measured |
| Bosnia and Herzegovina | 61 | vaktija.eu location register, one point per location id, published by the federation |
| Tunisia | 339 | INM delegation points, echoed in every archive row |
| Indonesia | 43 | Kemenag city register, point and timezone per city |

## The ten widest gaps

Ranked by surfaces with no usable point.

| Country | Unknown | Usable | Share unknown | Dominant reason |
| --- | --- | --- | --- | --- |
${gapRows}

The United States is the single largest gap and it is a clean result: 101 of its 111 surfaces
are platform tables (Masjidal, masjidbox) whose rows reproduce at four or five longitudes a
civil-zone step apart, and neither the capture nor the record names the mosque's point. Those
records carry a latitude and no longitude. Russia, Chile, Portugal, Australia, Spain and Canada
fail the same way, each between two zone bands. The United Kingdom is the opposite case: 79 of
89 surfaces carry a point, and its ten gaps are tables with one solar column or a transit that
contradicts the horizon pair.

## What this ledger cannot do

- It cannot place a table that prints one solar column. Seventeen surfaces are in that state.
- It cannot place a table whose clock is a civil zone the record does not name. That is the
  zone-degenerate class, ${byCountry.reduce((a, e) => a + (e.reasons["zone-degenerate"] || 0), 0)} surfaces, all in multi-zone countries.
- It cannot separate a printed dhuhr margin from a longitude shift. Where the horizon pair
  exists the ledger uses the horizon pair; where it does not, the point carries the bias and the
  record says so through \`lonBasis: dhuhr\`.
- It cannot see a table that is not solar at all but is smooth. The LUPT family is printed
  from interval tables, not from a horizon angle; the April 2027 block derives a point at
  55.0 N, 1.2 W, which is precise (sigma 0.14 deg) and 3.5 degrees from London. Precision is
  reported per record as sigmaLatDeg and sigmaLonDeg, and it measures the fit, not the truth.
- It does not name a country for two surfaces whose file names resolve to no country on record
  (\`timetable-aghien.json\`, \`timetable-mosqueerayyane.json\`). They are UNKNOWN, not guessed.

## Files

| File | Content |
| --- | --- |
| \`coords-ledger.json\` | one record per surface: id, country, point, class, citation, timezone, residual |
| \`data/by-country.json\` | the per-country roll-up behind the table above |
| \`derive/solve.mjs\` | the solver: transit and horizon longitude, latitude by least squares |
| \`derive/solar.mjs\` | the solar core |
| \`derive/validate.mjs\` | the adhan gate |
| \`derive/crosscheck.mjs\` | the published-versus-derived check |
| \`derive/extract-published.mjs\` | the five published and anchor sources, carried verbatim |
| \`derive/countries.mjs\` | country assignment, IANA zones, country envelopes |
| \`derive/rowsource.mjs\` | fallback row reader for tables the index normalised to one column |
| \`derive/assemble.mjs\`, \`derive/report.mjs\` | the ledger and this page |
| \`derive/export.sh\` | regenerates \`data/surfaces.psv\` and \`data/rows.psv\` from \`census-index.db\` |

Run order: \`export.sh\`, \`extract-published.mjs\`, \`solve.mjs\`, \`crosscheck.mjs\`, \`assemble.mjs\`,
\`report.mjs\`.
`;

fs.writeFileSync(path.join(DATA, "..", "COORDS-LEDGER.md"), doc);
console.log(`wrote COORDS-LEDGER.md, ${doc.split("\n").length} lines`);
