// The July window, dated: for the class delegations, solve the implied fajr/isha depression
// day by day across 24 Jun - 7 Aug 2026 and July 2025, to place the switch and its form.
// Run: TZ=Africa/Tunis node tn-july-window.js
const fs = require("fs");
const S = require("./solar");
const O = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const T = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const fits = JSON.parse(fs.readFileSync(`${T}/data/tn-fits-sw.json`, "utf8"));

const targets = [
  { name: "Kairouan/Kairouan", gouv: 357, deleg: 630, file: "tn-july-357-630-2026-06" },
  { name: "Sidi Bouzid/Sidi Bouzid", gouv: 355, deleg: 628, file: "tn-july-355-628-2026-06" },
  { name: "Kairouan/Haffouz", gouv: 357, deleg: 523, file: "tn-july-357-523-2026-06" },
  { name: "Sidi Bouzid/Sidi Ali Ben Aoun", gouv: 355, deleg: 509, file: "tn-july-355-509-2026-06" },
  { name: "Kebili/Kebili", gouv: 1012, deleg: 482, file: "tn-july-1012-482-2026-06" },
];

function band(coord, dip, date, col, printed) {
  let lo = null, hi = null;
  for (let a = 15; a <= 19.5; a += 0.01) {
    const t = S.times(coord, { fajrAngle: a, ishaAngle: a, dip, madhab: "shafi", tz: "Africa/Tunis" }, date);
    if (t[col] === null) continue;
    if (S.roundMin(t[col], 0, "round") === printed) { if (lo === null) lo = a; hi = a; }
  }
  return lo === null ? null : [+lo.toFixed(2), +hi.toFixed(2)];
}

const out = { job: "O1l-25 Tunisia July window", delegations: [] };
for (const t of targets) {
  const fit = fits.find((x) => x.deleg === t.deleg && x.gouv === t.gouv);
  const j = JSON.parse(fs.readFileSync(`${O}/data/${t.file}.json`, "utf8"));
  const coord = new S.A.Coordinates(Number(j.rows[Object.keys(j.rows)[0]].lat), Number(j.rows[Object.keys(j.rows)[0]].lng));
  const days = Object.keys(j.rows).sort().map((date) => {
    const r = j.rows[date];
    const printed = { fajr: S.toMin(r.fajr), isha: S.toMin(r.isha) };
    return {
      date, printed,
      fajrBand: band(coord, fit.dipDemDeg, date, "fajr", printed.fajr),
      ishaBand: band(coord, fit.dipDemDeg, date, "isha", printed.isha),
    };
  });
  out.delegations.push({ name: t.name, cls: fit.gouv === 355 || fit.gouv === 357 ? "class" : "control", dip: fit.dipDemDeg, days });

  // July 2025
  const f25 = `tn-july-${t.gouv}-${t.deleg}-2025-07`;
  if (fs.existsSync(`${O}/data/${f25}.json`)) {
    const k = JSON.parse(fs.readFileSync(`${O}/data/${f25}.json`, "utf8"));
    const c2 = new S.A.Coordinates(Number(k.rows[Object.keys(k.rows)[0]].lat), Number(k.rows[Object.keys(k.rows)[0]].lng));
    const days25 = Object.keys(k.rows).sort().map((date) => {
      const r = k.rows[date];
      const printed = { fajr: S.toMin(r.fajr), isha: S.toMin(r.isha) };
      return { date, printed, fajrBand: band(c2, fit.dipDemDeg, date, "fajr", printed.fajr), ishaBand: band(c2, fit.dipDemDeg, date, "isha", printed.isha) };
    });
    out.delegations.push({ name: t.name, year: 2025, cls: "class", dip: fit.dipDemDeg, days: days25 });
  }
}

fs.writeFileSync(`${O}/data/tn-july-window.json`, JSON.stringify(out, null, 1));
for (const d of out.delegations) {
  console.log(`\n== ${d.name} ${d.year || 2026} dip ${d.dip}`);
  for (const x of d.days) {
    const fb = x.fajrBand ? ((x.fajrBand[0] + x.fajrBand[1]) / 2).toFixed(2) : "----";
    const ib = x.ishaBand ? ((x.ishaBand[0] + x.ishaBand[1]) / 2).toFixed(2) : "----";
    console.log(`${x.date} ${String(x.printed.fajr).padStart(3)} ${String(x.printed.isha).padStart(4)}  fa ${fb}  ia ${ib}`);
  }
}
