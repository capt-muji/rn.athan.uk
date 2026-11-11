// O1l-city round-2 integrity scan. Read-only over the archive.
// Emits scan.json: per-workspace file/byte/row totals, JSON parse failures, zero-byte files,
// and the declared-deliverable resolution for every REPORT.md.
//
// A "dated row" is one prayer record: a value under a YYYY-MM-DD key, or an element of a row
// array carrying at least two prayer-time columns. The date itself may be carried by the key,
// by the file name, or by a {month, day} pair; the row count is what the disk holds either way.
// Deduplication is by payload hash: two files holding the same row sequence are one dataset.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.env.HOME, 'athan-gitree/census/o1l-city')
const SELF = 'integrity2'
const DATE = /^\d{4}-\d{2}-\d{2}$/
const PRAYER = /^(fajr|imsak|sunrise|shuruq|shurooq|dhuhr|zuhr|asr|maghrib|sunset|isha|ishaa|iftar|sahur|suhoor|sehri|tahajjud)$/i
const META = /^(problems|findings|notes?|gaps|checks?|verdict|summary|columns?|labels?|_meta|meta|source|sources|captures?|method|recipe|recipes?|candidates|windows|diagnostics|publisher|tier|city|city_slug|lat|lon|tz|timezone|name|id|_source|_captured|authority|engine|params|margins?|offsets?|rules?|changes?|regime|span|stats|totals?|count|counts|schema|version|generated|url|link|title|country|province|region|areas?|mosques?|districts?|zones?|iqamah|athan|adhan|iqama)$/i

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.isFile()) out.push(p)
  }
  return out
}

function dateKeys(o) { const out = []; for (const k of Object.keys(o)) if (DATE.test(k)) out.push(k); return out }
function looksRow(o) {
  let hits = 0
  for (const k of Object.keys(o)) if (PRAYER.test(k)) hits++
  return hits >= 2
}

// Rolling FNV-1a over the row values, so identical payloads share a hash.
function hashRow(h, r) {
  const keys = Object.keys(r).sort()
  for (const k of keys) {
    const v = r[k]
    if (v && typeof v === 'object') continue
    const s = k + '=' + String(v)
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  }
  return h >>> 0
}

function count(v, acc, depth = 0) {
  if (!v || typeof v !== 'object' || depth > 6) return 0
  if (Array.isArray(v)) {
    let n = 0
    for (const r of v) {
      if (r && typeof r === 'object' && !Array.isArray(r)) {
        if (looksRow(r)) { acc.h = hashRow(acc.h, r); n++ }
        else n += count(r, acc, depth + 1)
      } else if (Array.isArray(r) && r.length >= 5) { n++ }
    }
    return n
  }
  const dk = dateKeys(v)
  if (dk.length) {
    for (const k of dk) {
      const row = v[k]
      acc.h = hashRow(acc.h, row && typeof row === 'object' ? row : { v: row })
    }
    return dk.length
  }
  // athan/iqamah layers over the same dates: one row set
  const layerSet = new Set()
  let layered = 0
  for (const k of ['athan', 'iqamah', 'adhan', 'iqama', 'fajr_athan']) {
    const c = v[k]
    if (c && typeof c === 'object') {
      const ks = dateKeys(c)
      if (ks.length) { ks.forEach((x) => layerSet.add(x)); layered++ }
    }
  }
  if (layered) {
    const ks = [...layerSet].sort()
    for (const k of ks) {
      const layer = v.athan?.[k] || v.iqamah?.[k] || v.adhan?.[k] || v.iqama?.[k]
      acc.h = hashRow(acc.h, layer && typeof layer === 'object' ? layer : { v: layer })
    }
    return ks.length
  }
  let n = 0
  for (const [k, val] of Object.entries(v)) {
    if (META.test(k)) continue
    if (val && typeof val === 'object') n += count(val, acc, depth + 1)
  }
  return n
}

function rowCount(v) {
  const acc = { h: 2166136261 }
  const rows = count(v, acc)
  return { rows, hash: acc.h.toString(16) + ':' + rows }
}

// One surface banked twice: `rows_X` beside `X`, an athan/iqamah layer pair, `data/rows/`
// beside `data/`. The family key strips exactly those markers and nothing else.
// The one exception is a renamed re-serialisation: indonesia2 banks the same 38-city payload
// twice, as `jadwalsholat-org-rows.json` and as `jsorg-raw.json`.
const ALIAS = { 'indonesia2/data/jsorg-raw.json': 'indonesia2/data/jadwalsholat-org-rows.json' }
function family(rel) {
  const key = ALIAS[rel] ?? rel
  const dir = path.dirname(key).replace(/(^|\/)rows$/, '')
  const base = path.basename(key, '.json')
    .replace(/^(rows[_-]|iqamah[_-]|athan[_-]|adhan[_-]|masjidal[_-])/, '')
    .replace(/[_-]rows$/, '')
  return dir + '/' + base
}

// A report path may use brace notation: data/x-{a,b}.json
function expand(p) {
  const m = /^(.*)\{([^{}]+)\}(.*)$/.exec(p)
  if (!m) return [p]
  return m[2].split(',').flatMap((alt) => expand(m[1] + alt.trim() + m[3]))
}

const all = walk(ROOT, []).filter((f) => !path.relative(ROOT, f).startsWith(SELF + path.sep))
const rels = all.map((f) => path.relative(ROOT, f))
const st = all.map((f) => fs.statSync(f))
const wsDirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== SELF).map((e) => e.name).sort()

const badJson = []
const ws = {}
for (const d of wsDirs) {
  const idx = []
  rels.forEach((r, i) => { if (r.startsWith(d + path.sep)) idx.push(i) })
  const files = idx.length
  const bytes = idx.reduce((a, i) => a + st[i].size, 0)
  const payload = new Map()
  const fam = new Map()
  let dataFiles = 0, dataBytes = 0, raw = 0
  const badData = []
  for (const i of idx) {
    const r = rels[i]
    const inData = r.split(path.sep).includes('data')
    if (r.endsWith('.json')) {
      let v
      try { v = JSON.parse(fs.readFileSync(all[i], 'utf8')) } catch (e) {
        badJson.push({ rel: r, size: st[i].size, err: e.message.slice(0, 120) })
        if (inData) badData.push(r)
        continue
      }
      if (inData) {
        dataFiles++; dataBytes += st[i].size
        const { rows, hash } = rowCount(v)
        raw += rows
        if (rows > 0) {
          const f = family(r)
          fam.set(f, Math.max(fam.get(f) ?? 0, rows))
          if (!payload.has(hash)) payload.set(hash, [])
          payload.get(hash).push(r)
        }
      }
    } else if (inData) { dataFiles++; dataBytes += st[i].size }
  }
  let deduped = 0
  for (const n of fam.values()) deduped += n
  const dupGroups = [...payload.values()].filter((g) => g.length > 1)

  const reportPath = path.join(ROOT, d, 'REPORT.md')
  const hasReport = fs.existsSync(reportPath)
  const report = hasReport ? fs.readFileSync(reportPath, 'utf8') : ''
  const named = new Set()
  for (const m of report.matchAll(/(?:`|^|\s|\()((?:data|captures|work|out|fit|fits|scripts|tools|derive|bin)\/[A-Za-z0-9_.\-{},\/]+)/gm)) {
    const p = m[1].replace(/[.,;:)]+$/, '')
    for (const q of expand(p)) named.add(q)
  }
  const missing = [...named].filter((p) => !fs.existsSync(path.join(ROOT, d, p)))
  const newest = idx.length ? idx.reduce((a, i) => Math.max(a, st[i].mtimeMs), 0) : fs.statSync(path.join(ROOT, d)).mtimeMs
  const alt = fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.md'))
  ws[d] = {
    files, bytes, dataFiles, dataBytes, rows: raw, deduped, dupGroups,
    badData, hasReport, alt, named: named.size, missing, newest,
    zero: idx.filter((i) => st[i].size === 0).map((i) => rels[i]),
  }
}

const totals = {
  workspaces: wsDirs.length,
  files: rels.length,
  bytes: st.reduce((a, s) => a + s.size, 0),
  dataFiles: Object.values(ws).reduce((a, w) => a + w.dataFiles, 0),
  dataBytes: Object.values(ws).reduce((a, w) => a + w.dataBytes, 0),
  rows: Object.values(ws).reduce((a, w) => a + w.rows, 0),
  deduped: Object.values(ws).reduce((a, w) => a + w.deduped, 0),
  zero: rels.filter((_, i) => st[i].size === 0).length,
  jsonFiles: rels.filter((r) => r.endsWith('.json')).length,
  badData: badJson.filter((b) => b.rel.split(path.sep).includes('data')).length,
  badCaptures: badJson.filter((b) => b.rel.split(path.sep).includes('captures')).length,
  badOther: badJson.filter((b) => !b.rel.split(path.sep).includes('data') && !b.rel.split(path.sep).includes('captures')).length,
}
const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z'
fs.writeFileSync(path.join(ROOT, SELF, 'scan.json'), JSON.stringify({ stamp, totals, ws, badJson }, null, 1))

if (process.argv[2] === '--files') {
  const want = process.argv[3]
  for (const d of wsDirs) {
    if (want && d !== want) continue
    const rows = []
    rels.forEach((r, i) => {
      if (!r.startsWith(d + path.sep) || !r.endsWith('.json')) return
      if (!r.split(path.sep).includes('data')) return
      let j
      try { j = JSON.parse(fs.readFileSync(all[i], 'utf8')) } catch { return }
      const { rows: n, hash } = rowCount(j)
      rows.push([r, n, hash, st[i].size])
    })
    rows.sort((a, b) => b[1] - a[1])
    let t = 0
    for (const r of rows) { t += r[1]; console.log(r.join('\t')) }
    console.log('TOTAL\t' + t + '\tfiles=' + rows.length)
  }
  process.exit(0)
}

console.log(stamp, JSON.stringify(totals))
for (const [d, w] of Object.entries(ws)) {
  console.log([d, w.files, w.bytes, w.dataFiles, w.rows, w.deduped, w.hasReport ? 'R' : '-', w.missing.length ? 'MISSING:' + w.missing.join(',') : '', w.zero.length ? 'ZERO:' + w.zero.length : ''].join(' | '))
}
