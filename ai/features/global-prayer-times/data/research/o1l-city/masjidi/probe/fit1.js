const L = require('./fitlib');
const path = process.argv[2];
const off = Number(process.argv[3] || 120);
const engine = process.argv[4] || 'adhan';
const year = Number(process.argv[5] || 2028);
const table = L.parseTable(path);
const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const t0 = Date.now();
const fit = L.fitSolar(table, off, leap, year, engine);
const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, leap, year));
const fn = engine === 'adhan' ? L.adhanTimes : L.prayTimesTimes;
const res = { Fajr: [], Sunrise: [], Dhuhr: [], Asr: [], Maghrib: [], Isha: [] };
const noon = [], half = [], dnoon = [], dhalf = [];
for (let i = 0; i < table.length; i++) {
  const c = fn(fit.lat, fit.lon, dates[i], off);
  for (const k of L.COLS) res[k].push(c[k] - table[i][k]);
  const tn = (table[i].Sunrise + table[i].Maghrib) / 2, tc = (c.Sunrise + c.Maghrib) / 2;
  const hn = (table[i].Maghrib - table[i].Sunrise) / 2, hc = (c.Maghrib - c.Sunrise) / 2;
  noon.push(tn); half.push(hn); dnoon.push(tc - tn); dhalf.push(hc - hn);
}
const out = { engine, year, lat: +fit.lat.toFixed(4), lon: +fit.lon.toFixed(4), solarRms: +fit.cost.toFixed(3) };
out.rms = {}, out.mean = {};
for (const k of L.COLS) { out.rms[k] = +L.rms(res[k]).toFixed(2); out.mean[k] = +L.mean(res[k]).toFixed(2); }
out.dnoonRms = +L.rms(dnoon).toFixed(2);
out.dhalfRms = +L.rms(dhalf).toFixed(2);
out.monthly = {};
for (let m = 0; m < 12; m++) {
  const idx = [];
  for (let i = 0; i < table.length; i++) if (dates[i].getUTCMonth() === m) idx.push(i);
  const avg = a => +(idx.reduce((s, i) => s + a[i], 0) / idx.length).toFixed(2);
  out.monthly[m + 1] = { dF: avg(res.Fajr), dS: avg(res.Sunrise), dD: avg(res.Dhuhr), dA: avg(res.Asr), dM: avg(res.Maghrib), dI: avg(res.Isha), dnoon: avg(dnoon), dhalf: avg(dhalf) };
}
out.secs = (Date.now() - t0) / 1000;
console.log(JSON.stringify(out, null, 1));
