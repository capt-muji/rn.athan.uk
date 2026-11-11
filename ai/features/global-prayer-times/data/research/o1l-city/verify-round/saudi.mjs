import { adhan, rawTimes, score, parseHM, readJSON, pct, ROUND, PRAYERS } from "./lib.mjs";

const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const SAMPLE = ["turaif", "arar", "sakaka", "al-khobar", "jizan", "samtah"];
const TZ = "Asia/Riyadh";

const cities = readJSON(`${W}/saudi-cities/data/cities.json`).cities;
const params = new adhan.CalculationParameters("Other", 18.5, 18);
params.rounding = adhan.Rounding.None;
params.madhab = adhan.Madhab.Shafi;
params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;

const ROUNDS = { fajr: ROUND.floorPlus1, dhuhr: ROUND.floorPlus1, asr: ROUND.floorPlus1, maghrib: ROUND.floorPlus1, sunrise: ROUND.floor };

function rowsFor(slug) {
  const f = `sa-${slug}-rows.json`;
  return readJSON(`${W}/saudi-cities/data/${f}`);
}

console.log("city\tlat\tn\texact%\twithin1%\tMAE\tworst\tfajrMAE\tsunMAE\tdhuhrMAE\tasrMAE\tmaghribMAE\tishaMAE");
const pooled = { n: 0, exact: 0, w1: 0, worst: 0 };
const perAll = Object.fromEntries(PRAYERS.map((p) => [p, []]));
const intervalAudit = [];

for (const slug of SAMPLE) {
  const c = cities.find((x) => x.name === slug);
  const rows = rowsFor(slug);
  const all = [];
  const local = Object.fromEntries(PRAYERS.map((p) => [p, []]));
  const intervals = new Map();
  for (const [iso, printed] of Object.entries(rows).sort()) {
    const mag = parseHM(printed.maghrib);
    const ish = parseHM(printed.isha);
    const iv = ish - mag;
    intervals.set(iv, (intervals.get(iv) || 0) + 1);
    const raw = rawTimes({ lat: c.lat, lon: c.lon, iso, tz: TZ, params });
    const model = {
      fajr: ROUNDS.fajr(raw.fajr / 60),
      sunrise: ROUNDS.sunrise(raw.sunrise / 60),
      dhuhr: ROUNDS.dhuhr(raw.dhuhr / 60),
      asr: ROUNDS.asr(raw.asr / 60),
      maghrib: ROUNDS.maghrib(raw.maghrib / 60),
      isha: ROUND.floorPlus1((raw.maghrib + iv * 60) / 60),
    };
    for (const p of PRAYERS) {
      const pr = parseHM(printed[p]);
      all.push({ model: model[p], printed: pr });
      local[p].push({ model: model[p], printed: pr });
      perAll[p].push({ model: model[p], printed: pr });
    }
  }
  const s = score(all);
  pooled.n += s.n; pooled.exact += s.exact; pooled.w1 += s.w1; pooled.worst = Math.max(pooled.worst, s.worst);
  const per = Object.fromEntries(PRAYERS.map((p) => [p, score(local[p])]));
  intervalAudit.push({ slug, intervals: Object.fromEntries(intervals) });
  console.log(
    [slug, c.lat, s.n, pct(s.exact, s.n).toFixed(2), pct(s.w1, s.n).toFixed(2), s.mae.toFixed(3), s.worst,
     ...PRAYERS.map((p) => per[p].mae.toFixed(2))].join("\t")
  );
}

console.log(`\nPOOLED n=${pooled.n} exact=${pct(pooled.exact, pooled.n).toFixed(2)}% within1=${pct(pooled.w1, pooled.n).toFixed(2)}% worst=${pooled.worst}`);
console.log("PER-PRAYER pooled:");
for (const p of PRAYERS) {
  const s = score(perAll[p]);
  console.log(`${p}\tMAE ${s.mae.toFixed(3)}\twithin1 ${pct(s.w1, s.n).toFixed(2)}%\texact ${pct(s.exact, s.n).toFixed(1)}%\tworst ${s.worst}`);
}

console.log("\nINTERVAL AUDIT (isha - maghrib, printed):");
for (const a of intervalAudit) console.log(a.slug, JSON.stringify(a.intervals));

// 120-day runs per city
console.log("\n120-RUNS per city:");
const runs = {};
for (const slug of SAMPLE) {
  const rows = rowsFor(slug);
  const isos = Object.keys(rows).sort();
  const flags = isos.map((iso) => parseHM(rows[iso].isha) - parseHM(rows[iso].maghrib) === 120);
  const out = [];
  let start = null;
  for (let i = 0; i <= isos.length; i++) {
    if (flags[i] && start === null) start = i;
    if ((!flags[i] || i === isos.length) && start !== null) {
      out.push(`${isos[start]}..${isos[i - 1]} (${i - start}d)`);
      start = null;
    }
  }
  runs[slug] = out;
  console.log(slug, out.join(" | "));
}

// alternative isha formulation: printed maghrib + interval
console.log("\nALT isha (printed maghrib + interval):");
for (const slug of SAMPLE) {
  const c = cities.find((x) => x.name === slug);
  const rows = rowsFor(slug);
  const pairs = [];
  for (const [iso, printed] of Object.entries(rows).sort()) {
    const iv = parseHM(printed.isha) - parseHM(printed.maghrib);
    const raw = rawTimes({ lat: c.lat, lon: c.lon, iso, tz: TZ, params });
    const model = ROUND.floorPlus1(raw.maghrib / 60) + iv;
    pairs.push({ model, printed: parseHM(printed.isha) });
  }
  const s = score(pairs);
  console.log(`${slug}\twithin1 ${pct(s.w1, s.n).toFixed(2)}%\tMAE ${s.mae.toFixed(3)}`);
}
