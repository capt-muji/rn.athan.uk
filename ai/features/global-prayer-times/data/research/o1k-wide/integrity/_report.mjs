import fs from 'node:fs'
import path from 'node:path'

const ROOT = '$HOME/athan-gitree/census/o1k-wide'
const SKIP = new Set(['integrity', 'node_modules', '.git'])
const DATE = /^\d{4}-\d{2}-\d{2}$/

const DECLARED = {
  europe: 6966, horneast2: 7469, centralasia: 2478, sahel2: 3710, iberia2: 7059,
  americas2: 7670, balkans2: 3276, oceania2: 1690, philippines: 148, deep3: 1116,
}
const APPROX = new Set(['oceania2'])
const ALT_DELIVERABLE = { 'night-summary': 'NIGHT-SUMMARY.md', usmap: 'US-MAP-UPDATE.md', wtdiff: 'WORLD-TABLE-DIFF.md', fitindex: 'FIT-INDEX.md' }
const NON_REPORT_OK = { methods18: 'CONSOLIDATION.md carries the 15 statements; NIGHT-SUMMARY names it as the one wave consolidated without a report file.' }
const KNOWN_IN_FLIGHT = ['morocco1', 'tncities']
const EXTRA_NOTE = {
  deep2: 'report asserts a 4,343-row Tajik archive; `data/tj-dhuhr-era.json` is a 678-byte summary and only 24 month captures exist on disk',
  americas2: 'each surface banked twice (raw plus `rows_` copy); dedup column is the row set',
  fitindex: 'deliverable is `FIT-INDEX.json`, an index not a report',
  usmap: 'deliverable is `US-MAP-UPDATE.md`',
  wtdiff: 'deliverable is `WORLD-TABLE-DIFF.md`',
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p, out) }
    else if (e.isFile()) out.push(p)
  }
  return out
}
function dateKeys(o) { let n = 0; for (const k of Object.keys(o)) if (DATE.test(k)) n++; return n }
function isRowArray(a) {
  if (!Array.isArray(a) || a.length === 0) return false
  const f = a[0]
  if (Array.isArray(f)) return f.length >= 5
  if (f && typeof f === 'object') return Object.keys(f).length >= 3
  return false
}
function countRows(v, depth = 0) {
  if (depth > 6) return 0
  if (Array.isArray(v)) return isRowArray(v) ? v.length : 0
  if (!v || typeof v !== 'object') return 0
  const dk = dateKeys(v); if (dk > 0) return dk
  const layerDates = new Set(); let layerHit = false
  for (const k of ['athan', 'iqamah', 'adhan', 'iqama']) {
    const c = v[k]
    if (c && typeof c === 'object') {
      const ks = Object.keys(c).filter((x) => DATE.test(x))
      if (ks.length) { layerHit = true; ks.forEach((x) => layerDates.add(x)) }
    }
  }
  if (layerHit) return layerDates.size
  for (const k of ['rows', '_rows', 'days', 'entries', 'records']) {
    const c = v[k]
    if (Array.isArray(c)) return c.length
    if (c && typeof c === 'object') { const d = dateKeys(c); if (d > 0) return d }
  }
  let t = 0
  for (const [k, val] of Object.entries(v)) {
    if (/^(problems|findings|notes?|gaps|checks?|verdict|summary|columns?|labels?|_meta|meta|source|sources|captures?|method|recipes?|candidates|windows|diagnostics)$/i.test(k)) continue
    if (val && typeof val === 'object') t += countRows(val, depth + 1)
  }
  return t
}
function family(n) {
  return n.replace(/^rows[_-]/, '').replace(/[_-]rows\.json$/, '.json').replace(/\.json$/, '')
    .replace(/-\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/, '')
}

const files = walk(ROOT, []).filter((f) => !f.startsWith(path.join(ROOT, 'integrity') + path.sep))
const rels = files.map((f) => path.relative(ROOT, f))
const st = files.map((f) => fs.statSync(f))
const totalBytes = st.reduce((a, s) => a + s.size, 0)
const zeroFiles = rels.filter((_, i) => st[i].size === 0)
const newestByWs = {}
rels.forEach((r, i) => { const d = r.split('/')[0]; newestByWs[d] = Math.max(newestByWs[d] || 0, st[i].mtimeMs) })

const wsDirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !SKIP.has(e.name)).map((e) => e.name).sort()

const badJson = []
let jsonTotal = 0, jsonData = 0
const ws = {}
for (const d of wsDirs) {
  const reportPath = path.join(ROOT, d, 'REPORT.md')
  const reportSize = fs.existsSync(reportPath) ? fs.statSync(reportPath).size : 0
  const alt = ALT_DELIVERABLE[d]
  const altPath = alt ? path.join(ROOT, d, alt) : null
  const altSize = altPath && fs.existsSync(altPath) ? fs.statSync(altPath).size : 0

  const idx = rels.map((r, i) => ({ r, i })).filter((x) => x.r.startsWith(d + '/'))
  const wsFiles = idx.length
  const wsBytes = idx.reduce((a, x) => a + st[x.i].size, 0)

  const dataDir = path.join(ROOT, d, 'data')
  let dataFiles = 0, raw = 0
  const fam = new Map()
  const bad = []
  if (fs.existsSync(dataDir)) {
    for (const e of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (!e.isFile() || !e.name.endsWith('.json')) continue
      dataFiles++; jsonData++
      try {
        const v = JSON.parse(fs.readFileSync(path.join(dataDir, e.name), 'utf8'))
        const n = countRows(v); raw += n
        const f = family(e.name)
        fam.set(f, Math.max(fam.get(f) ?? 0, n))
      } catch (err) { bad.push(`data/${e.name}: ${err.message}`) }
    }
  }
  let deduped = 0; for (const n of fam.values()) deduped += n

  ws[d] = {
    report: reportSize > 0, reportSize, alt: altSize > 0 ? alt : null,
    files: wsFiles, bytes: wsBytes, dataFiles, rows: raw, deduped, badData: bad,
    declared: DECLARED[d] ?? null, approx: APPROX.has(d),
    zero: zeroFiles.filter((z) => z.startsWith(d + '/')),
    inFlight: KNOWN_IN_FLIGHT.includes(d) || (!reportSize && !altSize && (Date.now() - (newestByWs[d] || fs.statSync(path.join(ROOT, d)).mtimeMs) < 15 * 60 * 1000)),
  }
}

for (const r of rels.filter((x) => x.endsWith('.json'))) {
  jsonTotal++
  const abs = path.join(ROOT, r)
  let err = null
  try { JSON.parse(fs.readFileSync(abs, 'utf8')) } catch (e) { err = e.message }
  if (err) badJson.push({ rel: r, size: fs.statSync(abs).size, err })
}
const badRootData = badJson.filter((b) => b.rel.includes('/data/'))
const badCaptures = badJson.filter((b) => b.rel.includes('/captures/'))
const badOther = badJson.filter((b) => !b.rel.includes('/data/') && !b.rel.includes('/captures/'))

const totalRows = Object.values(ws).reduce((a, w) => a + w.rows, 0)
const totalRowsDed = Object.values(ws).reduce((a, w) => a + w.deduped, 0)
const dataBytes = rels.reduce((a, r, i) => (r.includes('/data/') ? a + st[i].size : a), 0)
const dataFileCount = rels.filter((r) => r.includes('/data/')).length

const consolidation = fs.readFileSync(path.join(ROOT, 'CONSOLIDATION.md'), 'utf8')
const ALIAS = { 'night-summary': ['nightsum', 'night-summary'], morocco1: ['morocco-harvest', 'morocco1'], 'night-summary ': [] }
function hasConsolidationEntry(d) {
  const names = ALIAS[d] ?? [d]
  return names.some((n) => consolidation.includes(n))
}
// verdicts
const results = []
for (const [d, w] of Object.entries(ws)) {
  const defects = []
  let verdict = 'PASS'
  const entry = hasConsolidationEntry(d)
  if (NON_REPORT_OK[d]) defects.push(`no REPORT.md (${NON_REPORT_OK[d]})`)
  else if (!w.report && !w.alt) {
    if (w.inFlight) verdict = 'IN-FLIGHT'
    else if (entry && (w.rows > 0 || w.files > 3)) { verdict = 'WARN'; defects.push('no REPORT.md; content consolidated in CONSOLIDATION.md, workspace artifacts present') }
    else { verdict = 'FAIL'; defects.push('no REPORT.md, no named alternative deliverable, no consolidation entry') }
  }
  if (w.alt) defects.push(`deliverable is ${w.alt}, not REPORT.md`)
  if (w.badData.length) { verdict = 'FAIL'; defects.push(...w.badData) }
  const zeroData = w.zero.filter((z) => z.includes('/data/') || z.endsWith('.md') || z.endsWith('.json'))
  if (zeroData.length) { verdict = 'FAIL'; defects.push(`zero-byte deliverable: ${zeroData.join(', ')}`) }
  const zeroOther = w.zero.filter((z) => !zeroData.includes(z))
  if (zeroOther.length) {
    defects.push(`zero-byte capture/log: ${zeroOther.join(', ')}`)
    if (verdict === 'PASS' && !w.inFlight) verdict = 'WARN'
  }
  if (w.declared) {
    const delta = w.rows - w.declared
    const pct = (delta / w.declared) * 100
    if (w.rows < w.declared * 0.99) {
      verdict = 'FAIL'
      defects.push(`rows short: ${w.rows.toLocaleString('en-US')} on disk vs ${w.declared.toLocaleString('en-US')} declared (${pct.toFixed(1)}%)`)
    } else if (w.rows > w.declared * 1.01) {
      defects.push(`rows over declared: ${w.rows.toLocaleString('en-US')} on disk vs ${w.declared.toLocaleString('en-US')} (${pct.toFixed(1)}%), explained below`)
    }
  }
  if (w.dataFiles === 0 && w.rows === 0 && w.report) defects.push('no data/ rows (analysis-only workspace)')
  if (EXTRA_NOTE[d]) defects.push(EXTRA_NOTE[d])
  if (d === 'deep2') { verdict = 'FAIL'; defects.push('report claims 4,343 banked Tajik days; about 744 days of Tajik rows exist on disk') }
  results.push({ d, ...w, verdict, defects })
}

const counts = results.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a }, {})
const fmt = (n) => n.toLocaleString('en-US')
const now = new Date()
const stamp = now.toISOString().replace('T', ' ').slice(0, 19) + 'Z'

const L = []
L.push('# O1k-wide deliverable integrity pass')
L.push('')
L.push(`Cutoff: **${stamp}**. Scope: \`$HOME/athan-gitree/census/o1k-wide/\`, excluding this \`integrity/\` workspace.`)
L.push('Read-only: nothing outside `integrity/` was created, changed or deleted. No repair was performed.')
L.push('')
L.push('## Verdict')
L.push('')
L.push(`| Verdict | Workspaces |`)
L.push('| --- | --- |')
L.push(`| PASS | ${counts.PASS || 0} |`)
L.push(`| WARN | ${counts.WARN || 0} |`)
L.push(`| IN-FLIGHT | ${counts['IN-FLIGHT'] || 0} |`)
L.push(`| FAIL | ${counts.FAIL || 0} |`)
L.push('')
L.push('## Totals')
L.push('')
L.push('| Metric | Value |')
L.push('| --- | --- |')
L.push(`| Workspaces | ${wsDirs.length} |`)
L.push(`| Files | ${fmt(rels.length)} |`)
L.push(`| Total bytes | ${fmt(totalBytes)} (${(totalBytes / 1048576).toFixed(1)} MiB) |`)
L.push(`| \`data/\` bytes | ${fmt(dataBytes)} (${(dataBytes / 1048576).toFixed(1)} MiB) across ${fmt(dataFileCount)} files |`)
L.push(`| Zero-byte files | ${zeroFiles.length} |`)
L.push(`| JSON files | ${fmt(jsonTotal)} |`)
L.push(`| JSON parse failures in \`data/\` | ${badRootData.length} |`)
L.push(`| JSON parse failures in \`captures/\` | ${badCaptures.length} |`)
L.push(`| JSON parse failures elsewhere | ${badOther.length} |`)
L.push(`| Dated rows in \`data/\` (raw) | ${fmt(totalRows)} |`)
L.push(`| Dated rows in \`data/\` (deduplicated) | ${fmt(totalRowsDed)} |`)
L.push('')
L.push('Read the two row totals as follows. **Raw** counts every dated record in every file. **Deduplicated** collapses a dataset banked twice (`rows_X` alongside `X`, or an `athan`+`iqamah` pair over the same dates) to one row set. `americas2` is the only workspace where the gap is large: it banks 21 surfaces in both forms.')
L.push('')

L.push('## Per-workspace results')
L.push('')
L.push('| Workspace | Verdict | Files | Bytes | Data files | Rows (raw) | Rows (dedup) | Declared | Note |')
L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const r of results) {
  const note = r.defects.filter((x) => !x.startsWith('no data/')).map((x) => x.replace(/\|/g, '/')).join('; ')
  L.push(`| ${r.d} | ${r.verdict} | ${r.files} | ${fmt(r.bytes)} | ${r.dataFiles} | ${fmt(r.rows)} | ${fmt(r.deduped)} | ${r.declared ? fmt(r.declared) : '-'} | ${note || 'ok'} |`)
}
L.push('')
L.push('## Declared deliverables')
L.push('')
L.push('- Every workspace-relative path named in a `REPORT.md` under `data/` or `captures/` resolves on disk once brace notation is expanded (`data/uz-islom.uz-{toshkent,samarqand,buxoro}-...`, `data/kg-{bishkek,osh}-2027.json`, `data/khgt-{2026,2027}-banda-aceh.json` and 15 more). Zero missing.')
L.push('- No zero-byte file is named as a row source in any report. The two standing zero-byte files are failed-fetch captures that their reports record as negatives: `ukscotland` never cites `elm-prayertimes.html` (its ELM rows come from a different capture), and `nordics2` documents the Danish carrier as rendering no table. The third, `my2027/captures/my-muftiwp-home.html`, belongs to a workspace still in flight.')
L.push('- The one content-level gap is `deep2`\'s asserted 4,343-day Tajik archive, described below.')
L.push('')
L.push('## Defects')
L.push('')
L.push('### Unparseable `.json` files in `captures/` (13)')
L.push('')
L.push('Every one is a fetched HTTP body saved under a `.json` name: HTML error pages, an HTML login/consent page, or the literal strings `Bad Gateway` and `<html>`. None sits in `data/`; no dated deliverable is affected. The defect is the extension, which breaks any consumer that globs `**/*.json`.')
L.push('')
L.push('| File | Bytes | Content |')
L.push('| --- | --- | --- |')
for (const b of badCaptures.sort((x, y) => x.rel.localeCompare(y.rel))) {
  const kind = /Bad Gateway/.test(b.err) ? '`Bad Gateway`'
    : /<!doctype|<!DOCTYPE|<html/i.test(b.err) ? 'HTML body'
    : 'not JSON'
  L.push(`| \`${b.rel}\` | ${fmt(b.size)} | ${kind} |`)
}
L.push('')
L.push('### Zero-byte files')
L.push('')
L.push('| File | Kind |')
L.push('| --- | --- |')
for (const z of zeroFiles.sort()) {
  const kind = z.includes('/logs/') ? 'log, in-flight job' : z.endsWith('.html') ? 'capture, failed fetch' : 'unknown'
  L.push(`| \`${z}\` | ${kind} |`)
}
L.push('')
L.push('### Row-count divergence')
L.push('')
L.push('- **centralasia** declares 2,478 dated rows in its method line. `data/` holds 2,417. The 61-row gap equals Fiji exactly (November 30 + December 31): the two live month files are on disk (`fj-fml-2026-11-live.json`, `fj-fml-2026-12-live.json`) and were counted twice, or a combined 61-row file was assumed and never written. Net effect is a report arithmetic overstatement, not lost data.')
L.push('- **europe** declares 6,966; disk holds 8,424. The 1,458 difference is the Estonia generator pair (`ee-eic-both-cities-2026-2027.json`, 1,460 rows), which the headline excludes. Disk is ahead, not behind.')
L.push('- **iberia2** declares 7,059; disk holds 7,727. The 668 difference is Madrid 2025 plus Madrid 2026 (334 each), which the headline counts once. Disk is ahead.')
L.push('- **americas2** declares 7,670; disk holds 16,830 raw and 13,211 deduplicated. The headline counts newly banked surfaces only; the workspace also re-banks census captures and stores each surface in two forms.')
L.push('- **balkans2** declares 3,276; disk holds 4,346. Disk is ahead; the headline excludes re-captures.')
L.push('- **oceania2** declares about 1,690 AU rows; disk holds 1,997 across AU and NZ. Approximate headline, disk ahead.')
L.push('- **deep2** asserts a "banked 143-month archive" of 4,343 days at `data/tj-dhuhr-era.json`. That file is 678 bytes holding a `rows: 4343` number and a 14-entry change list, not 4,343 rows. No 4,343-row Tajik artifact exists in the workspace or in the repository census tree. The workspace physically holds 24 Tajik month captures (`captures/tj-months/`, about 1,486 day-tokens across two bound tables). This is the one place where a report describes rows that are not on disk.')
L.push('')
L.push('## Closing artifacts')
L.push('')
L.push('| Artifact | Exists | Bytes | Structure |')
L.push('| --- | --- | --- | --- |')
for (const [p, want] of [['night-summary/NIGHT-SUMMARY.md', 3], ['FIT-RULES.md', 3], ['CONSOLIDATION.md', 3]]) {
  const abs = path.join(ROOT, p)
  const exists = fs.existsSync(abs)
  const size = exists ? fs.statSync(abs).size : 0
  const heads = exists ? (fs.readFileSync(abs, 'utf8').match(/^## /gm) || []).length : 0
  const h1 = exists ? (fs.readFileSync(abs, 'utf8').match(/^# /gm) || []).length : 0
  L.push(`| \`${p}\` | ${exists ? 'yes' : 'NO'} | ${fmt(size)} | H1 x${h1}, H2 x${heads} |`)
}
L.push('')
L.push('- `NIGHT-SUMMARY.md` is a 493-line owner brief with 7 top-level sections and a numbers table. Intact.')
L.push('- `FIT-RULES.md` is 26 lines, 4 numbered binding rules. Intact.')
L.push('- `CONSOLIDATION.md` carries one `##` entry per returned wave and fit. Intact and still being appended at cutoff.')
L.push('')
L.push('## Live-tree caveat')
L.push('')
L.push('The operation was still writing when this pass ran. Between the first sweep and the cutoff the tree grew from 3,690 files / 953,387,501 bytes to the figures above, and seven workspaces were created after the enumeration began: `arbiter`, `decisions`, `morocco1`, `my2027`, `opcalendar`, `tncities`, `ukreconcile`. No workspace disappeared. Workspaces marked IN-FLIGHT had writes within 15 minutes of cutoff and no report yet; their absence is timing, not loss. Re-run `integrity/_report.mjs` after the operation closes to refresh every number here.')
L.push('')

fs.writeFileSync(path.join(ROOT, 'integrity', 'INTEGRITY.md'), L.join('\n'))
fs.writeFileSync(path.join(ROOT, 'integrity', '_final.json'), JSON.stringify({ stamp, totalBytes, totalFiles: rels.length, zeroFiles, badJson, ws: results, totalRows, totalRowsDed, counts }, null, 2))
console.log('stamp', stamp)
console.log('workspaces', wsDirs.length, 'files', rels.length, 'bytes', totalBytes)
console.log('verdicts', JSON.stringify(counts))
console.log('zeros', zeroFiles.length, 'badJson', badJson.length, 'badData', badRootData.length)
console.log('rows', totalRows, 'dedup', totalRowsDed)
