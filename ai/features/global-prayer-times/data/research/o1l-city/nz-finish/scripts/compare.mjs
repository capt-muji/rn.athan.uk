// Twenty-year comparison of the FIANZ pairs: Ramadan 1427 (2006) against 1447 (2026).
//
// A city is comparable only when both years' sheets are internally consistent, so
// the 2006 zuhr offset (printed zuhr against adhan's solar noon at the town) is
// carried into the verdict: a sheet whose afternoon block sits minutes off its own
// fajr and isha cannot support a pair claim.
import fs from 'node:fs'
import path from 'node:path'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const DATA = path.join(HERE, '..', 'data')
const y2006 = JSON.parse(fs.readFileSync(path.join(DATA, 'nz-2006-fit.json'), 'utf8'))
const y2026 = JSON.parse(fs.readFileSync(path.join(DATA, 'nz-2026-fit.json'), 'utf8'))

const rows = []
for (const [code, a] of Object.entries(y2006)) {
  const norm = (n) => n.toLowerCase().replace(/[^a-z]/g, '')
  const b = y2026[Object.keys(y2026).find((k) => norm(y2026[k].city) === norm(a.city))]
  if (!b) continue
  const same = a.pair_int[0] === b.pair_int[0] && a.pair_int[1] === b.pair_int[1]
  rows.push({
    city: a.city,
    pair_2006: a.pair_int.join('/'), pair_2026: b.pair_int.join('/'),
    fit_2006: a.pair.join('/'), fit_2026: b.pair.join('/'),
    worst_pair_2006: a.worst_pair, worst_pair_2026: b.worst_pair,
    dhuhr_off_2006: a.dhuhr_off, dhuhr_off_2026: b.dhuhr_off,
    dl_excess_2006: a.dl_excess, dl_excess_2026: b.dl_excess,
    verdict: same ? 'identical' : 'changed',
    consistent_2006: Math.abs(a.dhuhr_off) <= 1.5 && a.worst_pair <= 1.5,
    consistent_2026: Math.abs(b.dhuhr_off) <= 1.5 && b.worst_pair <= 1.5,
  })
}
const norm2 = (n) => n.toLowerCase().replace(/[^a-z]/g, '')
const newCities = Object.values(y2026).filter((b) => !Object.values(y2006).some((a) => norm2(a.city) === norm2(b.city)))
fs.writeFileSync(path.join(DATA, 'nz-20year.json'), JSON.stringify({ pair_test: rows, new_2026: newCities.map((b) => ({ city: b.city, pair: b.pair_int.join('/'), fit: b.pair.join('/'), worst_pair: b.worst_pair, dl_excess: b.dl_excess, dhuhr_off: b.dhuhr_off })) }, null, 1))
for (const r of rows) console.log(`${r.city.padEnd(17)} 2006 ${r.pair_2006.padEnd(6)} 2026 ${r.pair_2026.padEnd(6)} ${r.verdict.padEnd(9)} worst ${r.worst_pair_2006}/${r.worst_pair_2026} dhuhr ${r.dhuhr_off_2006}/${r.dhuhr_off_2026} dl ${r.dl_excess_2006}/${r.dl_excess_2026}`)
console.log('identical', rows.filter((r) => r.verdict === 'identical').length, 'of', rows.length, '| new 2026 cities', newCities.length)
