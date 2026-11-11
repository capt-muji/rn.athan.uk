import { adhan, rawTimes, score, parseHM, readJSON, pct, ROUND } from "./lib.mjs";

const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const SAMPLE = ["jakarta-pusat", "banda-aceh", "medan", "bandung", "surabaya", "makassar", "kupang", "jayapura"];

const params = new adhan.CalculationParameters("Other", 20, 18);
params.rounding = adhan.Rounding.None;
params.madhab = adhan.Madhab.Shafi;
params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;

console.log("city\ttz\tn\texact%\twithin1%\tMAE\tworst\tfajrExact\tfajrW1\tishaExact\tishaW1\tdhuhrW1\tasrW1");
const pooled = { n: 0, exact: 0, w1: 0, worst: 0 };
const fails = [];
const gaps = [];

for (const slug of SAMPLE) {
  const d = readJSON(`${W}/indonesia-cities/data/sihat-2026-${slug}.json`);
  const tz = d.tz;
  const all = [];
  const per = { fajr: [], isha: [], dhuhr: [], asr: [] };
  for (const [iso, printed] of Object.entries(d.rows).sort()) {
    const raw = rawTimes({ lat: d.lat, lon: d.lng, iso, tz, params });
    // Kemenag ihtyati: fajr +2, isha +2, dhuhr +3, asr +2, all floor.
    const m = {
      fajr: ROUND.nearest(raw.fajr / 60 + 2),
      isha: ROUND.nearest(raw.isha / 60 + 2),
      dhuhr: ROUND.nearest(raw.dhuhr / 60 + 3),
      asr: ROUND.nearest(raw.asr / 60 + 2),
    };
    for (const c of Object.keys(m)) {
      const pr = parseHM(printed[c]);
      if (pr == null) continue;
      all.push({ model: m[c], printed: pr });
      per[c].push({ model: m[c], printed: pr });
      if (Math.abs(m[c] - pr) > 1) fails.push(`${slug} ${iso} ${c} model=${m[c]} printed=${pr}`);
    }
  }
  const s = score(all);
  pooled.n += s.n; pooled.exact += s.exact; pooled.w1 += s.w1; pooled.worst = Math.max(pooled.worst, s.worst);
  const f = score(per.fajr), i = score(per.isha), dh = score(per.dhuhr), a = score(per.asr);
  console.log(
    [slug, tz, s.n, pct(s.exact, s.n).toFixed(1), pct(s.w1, s.n).toFixed(2), s.mae.toFixed(3), s.worst,
     pct(f.exact, f.n).toFixed(1), pct(f.w1, f.n).toFixed(2), pct(i.exact, i.n).toFixed(1), pct(i.w1, i.n).toFixed(2),
     pct(dh.w1, dh.n).toFixed(2), pct(a.w1, a.n).toFixed(2)].join("\t")
  );

  // KHGT gap on fajr
  const k = readJSON(`${W}/indonesia-cities/data/khgt-2026-${slug}.json`);
  let sum = 0, n = 0, lo = 999, hi = -999;
  for (const iso of Object.keys(d.rows)) {
    if (!k.rows[iso]) continue;
    const g = parseHM(k.rows[iso].fajr) - parseHM(d.rows[iso].fajr);
    sum += g; n++; lo = Math.min(lo, g); hi = Math.max(hi, g);
  }
  gaps.push({ slug, mean: sum / n, lo, hi, n });
}

console.log(`\nPOOLED n=${pooled.n} exact=${pct(pooled.exact, pooled.n).toFixed(2)}% within1=${pct(pooled.w1, pooled.n).toFixed(2)}% worst=${pooled.worst}`);
console.log(`cells >1 min: ${fails.length}`);
for (const f of fails.slice(0, 15)) console.log("  " + f);

console.log("\nKHGT minus SIHAT fajr (minutes):");
for (const g of gaps) console.log(`${g.slug}\tmean ${g.mean.toFixed(2)}\tband [${g.lo}..${g.hi}]\tn=${g.n}`);
const gm = gaps.reduce((a, g) => a + g.mean, 0) / gaps.length;
console.log(`pooled mean ${gm.toFixed(2)}`);
