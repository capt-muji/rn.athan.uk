// Fit every FIANZ sheet year: the (fajr, isha) pair per city, plus the sheet's
// defects against adhan 4.4.6 at the town's own coordinates.
//
// The pair is fitted on fajr and isha only, exactly as the prior wave fitted the
// 2006 sheets, so the two years compare like with like. Every other column is then
// scored at that pair and point, and three diagnostics are reported per city:
//   dhuhr_off   printed zuhr minus adhan's solar noon, i.e. how far east or west
//               of the town the sheet's reference point sits
//   dl_excess   printed day length minus adhan's, the sunrise/iftar defect
//   point       where the sheet is computed when fajr and isha cannot be fitted
//               at the town at all
// Shafi asr, maghrib read as sunset + 5 per the note printed on every sheet,
// Rounding.None, TZ Pacific/Auckland, local dates at UTC noon, no clock read.
import { PrayerTimes, Coordinates, CalculationMethod, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js'
import fs from 'node:fs'
import path from 'node:path'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const DATA = path.join(HERE, '..', 'data')
const ZONE = 'Pacific/Auckland'
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
const MAGHRIB_OFFSET = 5
const PAIR_THRESH = 1.5

const TOWNS = {
  'Ashburton-1': ['Ashburton', -43.90, 171.75],
  Auckland: ['Auckland', -36.85, 174.76],
  Balclutha: ['Balclutha', -46.24, 169.74],
  Blenheim: ['Blenheim', -41.51, 173.96],
  Christchurch: ['Christchurch', -43.53, 172.63],
  Dannevirke: ['Dannevirke', -40.21, 176.10],
  Dargaville: ['Dargaville', -35.94, 173.87],
  Dunedin: ['Dunedin', -45.87, 170.50],
  Fielding: ['Feilding', -40.22, 175.57],
  Gisborne: ['Gisborne', -38.66, 178.02],
  Gore: ['Gore', -46.10, 168.94],
  Greymouth: ['Greymouth', -42.45, 171.21],
  Hamilton: ['Hamilton', -37.79, 175.28],
  Hastings: ['Hastings', -39.64, 176.84],
  Hawera: ['Hawera', -39.59, 174.28],
  Invercargill: ['Invercargill', -46.41, 168.35],
  Masterton: ['Masterton', -40.95, 175.66],
  Napier: ['Napier', -39.49, 176.91],
  Nelson: ['Nelson', -41.27, 173.28],
  'New-Plymouth': ['New Plymouth', -39.06, 174.08],
  Oamaru: ['Oamaru', -45.10, 170.97],
  'Palmerston-North': ['Palmerston North', -40.35, 175.61],
  Queenstown: ['Queenstown', -45.03, 168.66],
  Rotorua: ['Rotorua', -38.14, 176.25],
  Taihape: ['Taihape', -39.68, 175.80],
  Taupo: ['Taupo', -38.69, 176.08],
  Tauranga: ['Tauranga', -37.69, 176.17],
  'Te-Kuiti': ['Te Kuiti', -38.33, 175.17],
  'Te-Puke': ['Te Puke', -37.78, 176.33],
  Timaru: ['Timaru', -44.40, 171.25],
  Wairoa: ['Wairoa', -39.03, 177.37],
  Wanganui: ['Whanganui', -39.93, 175.05],
  Wellington: ['Wellington', -41.29, 174.78],
  Whangarei: ['Whangarei', -35.73, 174.32],
}
const CODE = { akl: 'Auckland', chc: 'Christchurch', dud: 'Dunedin', gre: 'Greymouth',
  haw: 'Hastings', hlz: 'Hamilton', ivc: 'Invercargill', npe: 'Napier',
  npl: 'New Plymouth', nsn: 'Nelson', pmr: 'Palmerston North', rot: 'Rotorua',
  trg: 'Tauranga', wlg: 'Wellington', zqn: 'Queenstown' }

const offMin = (iso) => {
  const [y, m, dd] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, dd, 4, 0, 0))
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  const p = Object.fromEntries(dtf.formatToParts(dt).map((x) => [x.type, x.value]))
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - dt.getTime()) / 60000)
}
const hm = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5))

const mk = (fa, ia) => {
  const p = CalculationMethod.Other()
  p.fajrAngle = fa
  p.ishaAngle = ia
  p.rounding = Rounding.None
  return p
}
const pred = (fa, ia, lat, lon, iso, off) => {
  const [y, m, dd] = iso.split('-').map(Number)
  const pt = new PrayerTimes(new Coordinates(lat, lon), new Date(Date.UTC(y, m - 1, dd, 12, 0, 0)), mk(fa, ia))
  const base = Date.UTC(y, m - 1, dd, 0, 0, 0)
  const o = {}
  for (const c of COLS) o[c] = (pt[c].getTime() - base) / 60000 + off
  return o
}

function pairErr(dates, obs, lat, lon, fa, ia, sample) {
  let t = 0
  for (const iso of sample) {
    const p = pred(fa, ia, lat, lon, iso, offMin(iso))
    t += Math.abs(p.fajr - obs[iso].fajr) + Math.abs(p.isha - obs[iso].isha)
  }
  return t
}

function fitPair(dates, obs, lat, lon, sample) {
  let best = null
  for (let f = 12; f <= 20.001; f += 0.25) for (let i = 12; i <= 20.001; i += 0.25) {
    const e = pairErr(dates, obs, lat, lon, f, i, sample)
    if (!best || e < best[0]) best = [e, f, i]
  }
  let fine = null
  for (let f = best[1] - 0.3; f <= best[1] + 0.301; f += 0.02) for (let i = best[2] - 0.3; i <= best[2] + 0.301; i += 0.02) {
    const e = pairErr(dates, obs, lat, lon, f, i, sample)
    if (!fine || e < fine[0]) fine = [e, f, i]
  }
  return [+fine[1].toFixed(2), +fine[2].toFixed(2)]
}

function fitPoint(dates, obs, lat0, lon0, fa, ia, sample) {
  const err = (la, lo) => {
    let t = 0
    for (const iso of sample) {
      const p = pred(fa, ia, la, lo, iso, offMin(iso))
      t += Math.abs(p.fajr - obs[iso].fajr) + Math.abs(p.isha - obs[iso].isha) + Math.abs(p.dhuhr - obs[iso].dhuhr)
    }
    return t
  }
  let cl = null
  for (let la = lat0 - 2.5; la <= lat0 + 2.501; la += 0.1) for (let lo = lon0 - 2.5; lo <= lon0 + 2.501; lo += 0.1) {
    const e = err(la, lo)
    if (!cl || e < cl[0]) cl = [e, la, lo]
  }
  let cf = null
  for (let la = cl[1] - 0.2; la <= cl[1] + 0.201; la += 0.02) for (let lo = cl[2] - 0.2; lo <= cl[2] + 0.201; lo += 0.02) {
    const e = err(la, lo)
    if (!cf || e < cf[0]) cf = [e, la, lo]
  }
  return [+cf[1].toFixed(3), +cf[2].toFixed(3)]
}

function table(dates, obs, lat, lon, fa, ia) {
  const st = {}
  for (const c of COLS) {
    const vals = dates.map((iso) => pred(fa, ia, lat, lon, iso, offMin(iso))[c] + (c === 'maghrib' ? MAGHRIB_OFFSET : 0) - obs[iso][c])
    st[c] = {
      mean: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
      min: +Math.min(...vals).toFixed(1),
      max: +Math.max(...vals).toFixed(1),
      within1: +(vals.filter((v) => Math.abs(v) <= 1.01).length / vals.length).toFixed(3),
    }
  }
  return st
}

function fitCity(name, rows, quiet) {
  const dates = Object.keys(rows).sort()
  const obs = {}
  for (const iso of dates) {
    obs[iso] = {}
    for (const c of COLS) obs[iso][c] = hm(rows[iso][c])
  }
  const sample = dates.filter((_, k) => k % 3 === 0)
  const key = Object.keys(TOWNS).find((k) => TOWNS[k][0] === name) || name
  const [town, latT, lonT] = TOWNS[key]
  let pair = fitPair(dates, obs, latT, lonT, sample)
  let st = table(dates, obs, latT, lonT, pair[0], pair[1])
  let point = { lat: latT, lon: lonT, solved: false }
  const pairWorst = (s) => Math.max(Math.abs(s.fajr.min), Math.abs(s.fajr.max), Math.abs(s.isha.min), Math.abs(s.isha.max))
  if (pairWorst(st) > PAIR_THRESH) {
    const [lat, lon] = fitPoint(dates, obs, latT, lonT, pair[0], pair[1], sample)
    const pair2 = fitPair(dates, obs, lat, lon, sample)
    const st2 = table(dates, obs, lat, lon, pair2[0], pair2[1])
    if (pairWorst(st2) < pairWorst(st)) {
      pair = pair2; st = st2
      point = { lat, lon, solved: true, dlat: +(lat - latT).toFixed(2), dlon: +(lon - lonT).toFixed(2) }
    }
  }
  const dl = dates.map((iso) => (obs[iso].maghrib - MAGHRIB_OFFSET - obs[iso].sunrise)
    - (pred(pair[0], pair[1], point.lat, point.lon, iso, offMin(iso)).maghrib - pred(pair[0], pair[1], point.lat, point.lon, iso, offMin(iso)).sunrise))
  const pairInt = [Math.round(pair[0]), Math.round(pair[1])]
  const stInt = table(dates, obs, point.lat, point.lon, pairInt[0], pairInt[1])
  const r = {
    city: name, town: [town, latT, lonT], days: dates.length,
    pair, pair_int: pairInt, point, resid: st, resid_int: stInt,
    dhuhr_off: st.dhuhr.mean,
    dl_excess: +(dl.reduce((a, b) => a + b, 0) / dl.length).toFixed(1),
    worst_pair: +pairWorst(st).toFixed(1),
    worst_all: +Math.max(...COLS.map((c) => Math.max(Math.abs(st[c].min), Math.abs(st[c].max)))).toFixed(1),
    worst_all_int: +Math.max(...COLS.map((c) => Math.max(Math.abs(stInt[c].min), Math.abs(stInt[c].max)))).toFixed(1),
  }
  if (!quiet) console.error(`${name.padEnd(17)} ${pairInt.join('/')} (fit ${pair.join('/')}) pairWorst ${r.worst_pair} all ${r.worst_all} dhuhrOff ${r.dhuhr_off} dlExcess ${r.dl_excess}${point.solved ? ` POINT ${point.dlat}lat ${point.dlon}lon` : ''}`)
  return r
}

const which = process.argv[2] || '2026'
const out = {}
if (which === '2026') {
  for (const f of fs.readdirSync(DATA).filter((x) => /^nz-2026-(?!fit)/.test(x)).sort()) {
    const city = f.replace('nz-2026-', '').replace('.json', '')
    const doc = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
    if (!doc.rows) continue
    out[city] = fitCity(city, doc.rows)
  }
} else {
  const doc = JSON.parse(fs.readFileSync(path.join(DATA, 'nz-2006-ramadan-15cities.json'), 'utf8'))
  for (const [code, rows] of Object.entries(doc)) {
    const name = CODE[code]
    out[code] = fitCity(name, rows)
    out[code].code = code
  }
}
fs.writeFileSync(path.join(DATA, `nz-${which}-fit.json`), JSON.stringify(out, null, 1))
console.log('cities', Object.keys(out).length)
