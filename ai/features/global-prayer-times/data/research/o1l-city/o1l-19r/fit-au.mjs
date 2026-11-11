import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
import { ZONE, FALLBACK } from './au-zones.mjs'

const dir = '$HOME/athan-gitree/census/o1l-city/o1l-19r/data/diyanet'
const params = CalculationMethod.Turkey()
params.rounding = Rounding.None
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

const offMin = (iso, zone) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d, 4, 0, 0))
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  const p = Object.fromEntries(dtf.formatToParts(dt).map(x => [x.type, x.value]))
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - dt.getTime()) / 60000)
}
const predUTC = (lat, lon, iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  const pt = new PrayerTimes(new Coordinates(lat, lon), new Date(Date.UTC(y, m - 1, d, 4, 0, 0)), params)
  const f = (t) => (t.getTime() - Date.UTC(y, m - 1, d, 0, 0, 0)) / 60000
  return { fajr: f(pt.fajr), sunrise: f(pt.sunrise), dhuhr: f(pt.dhuhr), asr: f(pt.asr), maghrib: f(pt.maghrib), isha: f(pt.isha) }
}
const hm = (s) => { const [h, mi] = s.split(':').map(Number); return h * 60 + mi }
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }

const solveLon = (sample, printed) => {
  let lo = 90, hi = 180
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2
    const e = sample.reduce((a, d) => a + (predUTC(-30, mid, d).dhuhr - printed(d, 'dhuhr')), 0)
    if (e > 0) lo = mid; else hi = mid
  }
  return (lo + hi) / 2
}
const latErr = (lat, lon, sample, printed) => sample.reduce((a, d) => {
  const p = predUTC(lat, lon, d)
  return a + Math.abs(p.fajr - printed(d, 'fajr')) + Math.abs(p.sunrise - printed(d, 'sunrise')) + Math.abs(p.maghrib - printed(d, 'maghrib')) + Math.abs(p.isha - printed(d, 'isha'))
}, 0)
const fitLat = (lon, sample, printed) => {
  let best = { e: Infinity, lat: 0 }
  for (let lat = -45; lat <= -9; lat += 0.1) { const e = latErr(lat, lon, sample, printed); if (e < best.e) best = { e, lat } }
  let lo = best.lat - 0.15, hi = best.lat + 0.15
  for (let i = 0; i < 60; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (latErr(m1, lon, sample, printed) < latErr(m2, lon, sample, printed)) hi = m2; else lo = m1 }
  return +((lo + hi) / 2).toFixed(3)
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'manifest.json').sort()
const manifest = JSON.parse(fs.readFileSync(dir + '/manifest.json', 'utf8'))
const results = []
for (const file of files) {
  const slug = file.replace(/^au-\d+-/, '').replace(/-2026\.json$/, '')
  const rows = JSON.parse(fs.readFileSync(dir + '/' + file, 'utf8'))
  const dates = Object.keys(rows).sort()
  const sample = dates.filter(d => d.slice(8) === '01' || d.slice(8) === '15')
  const expected = ZONE[slug] || FALLBACK
  const CAND = ['Australia/Perth', 'Australia/Darwin', 'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Sydney']
  let zone = expected, offs = Object.fromEntries(dates.map(d => [d, offMin(d, zone)]))
  const mk = (shift) => (d, c) => hm(rows[d][c]) - offs[d] - shift
  let shift = 0
  let printed = mk(0)
  let lon = solveLon(sample, printed)
  let lat = fitLat(lon, sample, printed)

  // a platform clock defect shows as one constant residual across all six columns
  let resid = []
  for (const d of sample) { const p = predUTC(lat, lon, d); for (const c of COLS) resid.push(p[c] - printed(d, c)) }
  if (Math.max(...resid.map(Math.abs)) > 3) {
    const s2 = med(resid)
    printed = mk(s2)
    lon = solveLon(sample, printed)
    lat = fitLat(lon, sample, printed)
    resid = []
    for (const d of sample) { const p = predUTC(lat, lon, d); for (const c of COLS) resid.push(p[c] - printed(d, c)) }
    if (Math.max(...resid.map(Math.abs)) < 3) shift = +s2.toFixed(1)
  }
  const per = Object.fromEntries(COLS.map(c => [c, [0, 0]]))
  const res = Object.fromEntries(COLS.map(c => [c, []]))
  let worst = 0, worstAt = ''
  for (const d of dates) {
    const p = predUTC(lat, lon, d)
    for (const c of COLS) {
      const diff = p[c] - printed(d, c)
      res[c].push(diff)
      if (Math.abs(diff) < 1e-4) per[c][0]++
      if (Math.abs(diff) <= 1.0001) per[c][1]++
      if (Math.abs(diff) > worst) { worst = Math.abs(diff); worstAt = c + '@' + d }
    }
  }
  const rms = Object.fromEntries(COLS.map(c => [c, +Math.sqrt(res[c].reduce((a, x) => a + x * x, 0) / dates.length).toFixed(2)]))
  const bias = Object.fromEntries(COLS.map(c => [c, +(res[c].reduce((a, x) => a + x, 0) / dates.length).toFixed(2)]))
  const amp = { fajr: +(hm(rows['2026-01-15'].fajr) - hm(rows['2026-07-15'].fajr)).toFixed(0), isha: +(hm(rows['2026-01-15'].isha) - hm(rows['2026-07-15'].isha)).toFixed(0) }
  results.push({ slug, id: manifest[slug]?.id, zone, zoneExpected: expected, clockDefect: zone !== expected && (zone === 'Australia/Sydney' || expected === 'Australia/Sydney') && (zone !== expected), lat, lon: +lon.toFixed(3), clockShiftMin: shift, days: dates.length, per, rms, bias, amplitudeJanMinusJul: amp, worst: +worst.toFixed(2), worstAt })
}
fs.writeFileSync('$HOME/athan-gitree/census/o1l-city/o1l-19r/data/au-diyanet-fit-2026.json', JSON.stringify(results, null, 1))
const n = results.length
const avg = (c, i) => +(results.reduce((a, r) => a + r.per[c][i], 0) / n).toFixed(1)
console.log('cities', n, 'rows', results.reduce((a, r) => a + r.days, 0))
for (const c of COLS) console.log(c, 'exact', avg(c, 0), 'within1', avg(c, 1), 'meanrms', (results.reduce((a, r) => a + r.rms[c], 0) / n).toFixed(2))
console.log('cities all-columns worst<=1:', results.filter(r => r.worst <= 1).length, '<=2:', results.filter(r => r.worst <= 2).length)
console.log('clock defects:', results.filter(r => r.clockShiftMin !== 0).map(r => r.slug + ':' + r.clockShiftMin))
console.log('worst>2:', results.filter(r => r.worst > 2).sort((a, b) => b.worst - a.worst).slice(0, 10).map(r => `${r.slug} ${r.worst} ${r.worstAt} lat${r.lat} lon${r.lon}`))
