// Emits INTEGRITY-ROUND2.md from scan.json (the final snapshot).
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.env.HOME, 'athan-gitree/census/o1l-city')
const SELF = 'integrity2'
const { stamp, totals, ws, badJson } = JSON.parse(fs.readFileSync(path.join(ROOT, SELF, 'scan.json'), 'utf8'))

const ALT = {
  'algo-table': 'ALGO-TABLE-COMPARE.md',
  corrections: 'CORRECTIONS-ROUND.md',
  'gaps-closed': 'GAPS-CLOSED.md',
  summary: 'ROUND-SUMMARY.md',
  wtdiff2: 'WORLD-TABLE-DIFF-ROUND2.md',
  'span-ledger': 'SPAN-LEDGER.md',
}
const DECLARED = {
  'O1l-31': 22943, 'O1l-33': 4015, 'balkan-cities': 24910, 'china-capitals': 10250,
  eastasia2: 34314, 'egypt-82': 28468, 'fallback-sweep': 4440, fallback2: 1201,
  'germany-cities': 11076, 'germany-districts': 452965, 'il-ps': 78, 'india-cities': 13140,
  'indonesia-cities': 41610, indonesia2: 34648, 'latam-cities': 3385, 'mideast-cities': 12360,
  'morocco-cities': 11590, 'nigeria-states': 276, 'nz-finish': 1020, 'o1l-15r': 29565,
  'o1l-19r': 79570, 'o1l-20r': 4443, 'o1l-21r': 730, 'o1l-22': 5632, 'o1l-23': 55480,
  'o1l-28': 5602, 'o1l-29': 9459, 'O1l-27': 730, pacific2: 1095, 'pakistan-cities': 732,
  'russia-boards': 32120, 'saudi-cities': 30487, 'second-witnesses': 58, 'thailand-provinces': 56286,
  'tunisia-cities': 5144, 'uae-cities': 35880, 'us-states': 25208, 'us-unresolved': 33513,
  westafrica2: 7930,
}
const NOTE = {
  'O1l-33': 'disk holds 8,395 more: the `data/relabel-2027/` set, payload-identical to the 2026 files (one computed generation relabelled)',
  'O1l-31': 'disk ahead: the Mawaqeet block (2,190) is banked but outside the headline',
  'balkan-cities': 'disk ahead by 242; headline counts the listed tables only',
  'china-capitals': 'disk ahead: 28 capitals x 365 = 10,220 plus the calculator grid samples',
  eastasia2: 'disk ahead by 6,136 over the headline (re-captures)',
  'egypt-82': 'disk ahead by 310; 81 surface files against 78 named cities (one 274-row and one 6-row partial)',
  'germany-cities': 'disk ahead: the IGMG 26-table block is 11,076 of 18,376; Diyanet and mawaqit files make up the rest',
  'germany-districts': 'exact: 1,241 districts x 365',
  indonesia2: 'raw double-banks one dataset (`jsorg-raw.json` repeats `jadwalsholat-org-rows.json`); dedup 34,948 against 34,648 declared',
  'latam-cities': 'disk ahead: `br_iib_allyears.json` 3,000 plus country surfaces outside the headline',
  'mideast-cities': 'disk 10 short of the headline; the report components sum to 12,350 exactly, so the total line overstates by 10',
  'nigeria-states': 'disk ahead: masjidbox athan+iqamah pairs (399 each) for six surfaces',
  'nz-finish': 'disk ahead by 465 (2006 Ramadan block)',
  'o1l-15r': 'disk ahead by 1,095 (one extra city-year)',
  'o1l-19r': 'disk ahead by 1,316 (2006 and 2026 Ramadan blocks plus Fiji)',
  'o1l-20r': 'disk ahead by 9: the stored mawaqit file holds 3,294, the report says 3,285',
  'o1l-28': 'disk ahead: 53 data files, 18,982 rows; the headline counts the 32 new live surfaces only',
  'o1l-29': 'exactly double the headline: every city banked twice (`_printed` and measured)',
  pacific2: 'disk ahead: Fiji 2024 + Noumea + Tonga + 12 month sheets',
  'pakistan-cities': 'disk ahead: 732 chart rows plus 62 month-image rows',
  'russia-boards': 'disk ahead: `dumrt.json` is the 32,120 headline; the DUM RB and CDUM files add 43,069',
  'tunisia-cities': 'disk ahead: full-year files (123 rows) beside the 20-day delegation sweep',
  'uae-cities': 'declared 35,880. The federal file holds 60 areas x 516 days = 30,960 for the span 2026-01-01..2027-05-31, plus 92 Sharjah rows. The stated span yields 30,960 for the federal layer, so the headline overstates by 4,920',
  'us-states': 'raw counts the athan and iqamah layers separately; dedup 35,532',
  'us-unresolved': 'raw counts both layers; dedup 34,285 against 33,513 declared',
  westafrica2: 'row total matches the headline exactly',
}
const EXTRA = {
  athanpro: '2,699 data files and 80,700 rows written with no report',
  'pk-transcribe': 'empty stub: two copied PDFs, empty `data/` and `work/`, no report; superseded by `o1l-21r`',
  'africa-cities': 'nine captures, no data, no report; idle since 04:00',
  'bangladesh-cities': '25 captures, no data, no report; idle since 04:03',
  megacities: 'one citation does not resolve from this workspace: `data/dar-alifta-cairo-2026-11.json` lives in `egypt-82/data/`',
  'coords-ledger': '12 records carry the wrong country, not 14 (see Defects)',
  'o1l-21r': 'the second O1l-21r block in CONSOLIDATION.md describes this workspace; its twin `pk-transcribe` holds no rows',
  'masjidi': 'written to the cutoff: 257 data files, 61,122 rows',
  'final-sweep': 'REPORT.md landed during this pass',
  'fitter-audit': 'written to the cutoff, no report yet',
  'offset-registers': 'REPORT.md landed during this pass',
  'residual-fits': 'written to the cutoff, no report yet',
  flags2: 'written to the cutoff, no report yet',
  'us-unproven': 'REPORT.md landed during this pass',
  'second-witnesses': 'REPORT.md landed during this pass',
  eastasia2: 'REPORT.md landed during this pass',
}

const fmt = (n) => n.toLocaleString('en-US')
const now = Date.parse(stamp.replace(' ', 'T').replace('Z', 'Z'))
const results = []
for (const [d, w] of Object.entries(ws)) {
  const defects = []
  let verdict = 'PASS'
  const alt = ALT[d] || (w.alt.includes('REPORT.md') ? 'REPORT.md' : w.alt[0])
  const hasDeliverable = w.hasReport || !!ALT[d]
  const idleMin = (now - w.newest) / 60000

  if (!hasDeliverable) {
    if (idleMin < 15) verdict = 'IN-FLIGHT'
    else verdict = 'FAIL'
    defects.push('no REPORT.md and no named alternative deliverable')
  }
  if (w.badData.length) { verdict = 'FAIL'; defects.push(`unparseable JSON in data/: ${w.badData.length}`) }
  const zeroData = w.zero.filter((z) => z.includes('/data/'))
  if (zeroData.length) { defects.push(`zero-byte file in data/: ${zeroData.join(', ')}`); if (verdict === 'PASS') verdict = 'WARN' }
  const zeroCapture = w.zero.filter((z) => !z.includes('/data/') && !/\.(err|log)$/.test(z))
  const zeroLog = w.zero.filter((z) => /\.(err|log)$/.test(z))
  if (zeroCapture.length) { defects.push(`${zeroCapture.length} zero-byte ${zeroCapture.length === 1 ? 'capture' : 'captures'}: ${zeroCapture.join(', ')}`); if (verdict === 'PASS') verdict = 'WARN' }
  if (zeroLog.length) defects.push(`${zeroLog.length} empty stderr/log ${zeroLog.length === 1 ? 'file' : 'files'}`)
  if (DECLARED[d]) {
    const delta = w.rows - DECLARED[d]
    const pct = (delta / DECLARED[d]) * 100
    if (w.rows < DECLARED[d] * 0.99) { if (verdict === 'PASS') verdict = 'WARN'; defects.push(`rows short: ${fmt(w.rows)} on disk vs ${fmt(DECLARED[d])} declared (${pct.toFixed(1)}%)`) }
    else if (w.rows > DECLARED[d] * 1.01) defects.push(`rows over declared: ${w.rows} vs ${DECLARED[d]} (+${pct.toFixed(0)}%)`)
  }
  if (EXTRA[d]) defects.push(EXTRA[d])
  if (['coords-ledger', 'megacities'].includes(d) && verdict === 'PASS') verdict = 'WARN'
  results.push({ d, ...w, verdict, alt, defects })
}

const counts = results.reduce((a, r) => { a[r.verdict] = (a[r.verdict] || 0) + 1; return a }, {})
const L = []
L.push('# O1l-city deliverable integrity pass, round two')
L.push('')
L.push(`Cutoff: **${stamp}**. Scope: \`$HOME/athan-gitree/census/o1l-city/\`, excluding this \`integrity2/\` workspace.`)
L.push('Read-only: nothing outside `integrity2/` was created, changed or deleted. No repair was performed. Scripts and the raw snapshot sit beside this file (`scan.mjs`, `scan.json`).')
L.push('')
L.push('## Verdict')
L.push('')
L.push('| Verdict | Workspaces |')
L.push('| --- | --- |')
for (const k of ['PASS', 'WARN', 'IN-FLIGHT', 'FAIL']) L.push(`| ${k} | ${counts[k] || 0} |`)
L.push('')
L.push('## Totals')
L.push('')
L.push('| Metric | Value |')
L.push('| --- | --- |')
L.push(`| Workspaces | ${totals.workspaces} |`)
L.push(`| Files | ${fmt(totals.files)} |`)
L.push(`| Total bytes | ${fmt(totals.bytes)} (${(totals.bytes / 1073741824).toFixed(2)} GiB) |`)
L.push(`| \`data/\` bytes | ${fmt(totals.dataBytes)} (${(totals.dataBytes / 1048576).toFixed(1)} MiB) across ${fmt(totals.dataFiles)} files |`)
L.push(`| Zero-byte files | ${totals.zero} |`)
L.push(`| JSON files | ${fmt(totals.jsonFiles)} |`)
L.push(`| JSON parse failures in \`data/\` | ${totals.badData} |`)
L.push(`| JSON parse failures in \`captures/\` | ${totals.badCaptures} |`)
L.push(`| JSON parse failures elsewhere | ${totals.badOther} |`)
L.push(`| Dated rows in \`data/\` (raw) | ${fmt(totals.rows)} |`)
L.push(`| Dated rows in \`data/\` (deduplicated) | ${fmt(totals.deduped)} |`)
L.push('')
L.push('The totals include the six files at the round root (`BRIEF.md`, `FIT-RULES.md`, `CONSOLIDATION.md`, `QUEUE.md`, `monitor.log`, `watch.sh`), which belong to no workspace. Every other figure is the sum of the per-workspace column below.')
L.push('')
L.push('**Raw** counts every dated record in every data file. **Deduplicated** collapses a surface banked twice: `rows_X` beside `X`, an athan/iqamah layer pair over the same dates, `data/rows/` beside `data/`. One dated row is a prayer record: a value under a `YYYY-MM-DD` key, or an element of a row array carrying at least two time columns. A date carried by the file name or by a `{month, day}` pair still counts as a row.')
L.push('')
L.push('## Per-workspace results')
L.push('')
L.push('| Workspace | Verdict | Files | Bytes | Data files | Rows (raw) | Rows (dedup) | Declared | Note |')
L.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const r of results.sort((a, b) => a.d.localeCompare(b.d, 'en'))) {
  const clean = (s) => String(s).replace(/\|/g, '/').replace(/;/g, ',')
  const parts = [...new Set(r.defects.filter((x) => !x.startsWith('rows over declared')).map(clean))]
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
  if (NOTE[r.d]) { const n = clean(NOTE[r.d]); parts.push(n.charAt(0).toUpperCase() + n.slice(1)) }
  const note = parts.length ? parts.join('. ') + '.' : 'ok'
  L.push(`| ${r.d} | ${r.verdict} | ${r.files} | ${fmt(r.bytes)} | ${r.dataFiles} | ${fmt(r.rows)} | ${fmt(r.deduped)} | ${DECLARED[r.d] ? fmt(DECLARED[r.d]) : '-'} | ${note} |`)
}
L.push('')
L.push('The Declared column carries the headline count a report states, where it states one. A dash means the report gives per-surface figures only.')

// --- declared deliverables
L.push('')
L.push('## Declared deliverables')
L.push('')
L.push('- Every path a `REPORT.md` names under `data/` or `captures/` resolves on disk, once brace notation (`data/uz-islom.uz-{toshkent,samarqand,buxoro}-...`), range notation (`captures/federal-areas-emirate1..7.json`, `captures/fml-2024/January..December.jpg`) and truncated family prefixes (`data/eg-esa-`, `captures/mawaqit-`) are read as the families they denote.')
L.push('- One citation resolves in a sibling workspace rather than its own: `megacities/REPORT.md` names `data/dar-alifta-cairo-2026-11.json`, which is `egypt-82/data/dar-alifta-cairo-2026-11.json`. The data exists; the path is wrong from inside `megacities`.')
L.push('- Five paths are portal request paths rather than local files and are read as such: `watches-eu` records `data/horaires-2026-11.js` and its siblings as the Morocco ministry\'s URL, and `second-witnesses` records `data/horaires-2026-12.js` the same way.')
L.push('- No zero-byte file is named as a row source in any report.')

// --- json defects
const badByWs = {}
for (const b of badJson) { const w = b.rel.split('/')[0]; badByWs[w] = (badByWs[w] || 0) + 1 }
L.push('')
L.push('## Defects')
L.push('')
L.push(`### Unparseable \`.json\` files (${badJson.length})`)
L.push('')
L.push('None sits in a `data/` directory, so no dated deliverable is affected. Every one is a fetched HTTP body saved under a `.json` name: an HTML error page, the literal text `Not Found` or `Forbidden`, an empty file, or the Wayback offline page. The defect is the extension, which breaks any consumer that globs `**/*.json`.')
L.push('')
L.push('| Workspace | Files | Kind |')
L.push('| --- | --- | --- |')
for (const [w, n] of Object.entries(badByWs).sort((a, b) => b[1] - a[1])) {
  const tally = {}
  for (const b of badJson.filter((x) => x.rel.split('/')[0] === w)) {
    const kind = /Forbidden/.test(b.err) ? '`Forbidden` text'
      : /Not Found/.test(b.err) ? '`Not Found` text'
        : /Unexpected end/.test(b.err) ? 'empty or 1-byte'
          : /<html|<!doctype|<!DOCTYPE|<\?xml|<div/i.test(b.err) ? 'HTML body'
            : 'not JSON'
    tally[kind] = (tally[kind] || 0) + 1
  }
  const kind = Object.entries(tally).map(([k, v]) => `${k} x${v}`).join(', ')
  L.push(`| ${w} | ${n} | ${kind} |`)
}
L.push('')
L.push('The two genuinely empty files are `o1l-15r/captures/test-monthly-9541.json` and `o1l-15r/captures/test-states.json`; both are probe leftovers, and the workspace\'s report does not cite them. The remaining empty-input failure is a one-byte fetch in `o1l-28`.')

// --- zero byte
L.push('')
L.push(`### Zero-byte files (${totals.zero})`)
L.push('')
const zeroAll = []
for (const [d, w] of Object.entries(ws)) for (const z of w.zero) zeroAll.push(z)
const zErr = zeroAll.filter((z) => /\.err$/.test(z))
const zLog = zeroAll.filter((z) => /\.log$/.test(z))
const zCap = zeroAll.filter((z) => !/\.(err|log)$/.test(z))
L.push(`- ${zErr.length} empty \`.err\` files, which record a probe that wrote nothing to stderr. Normal, and no report cites one.`)
L.push(`- ${zLog.length} empty log files: ${zLog.map((z) => '\`' + z + '\`').join(', ')}. None is a row source, and no report cites one.`)
L.push(`- ${zCap.length} other empty files, nearly all failed-fetch captures recorded as negatives in their own reports:`)
L.push('')
L.push('| File | Bytes |')
L.push('| --- | --- |')
for (const z of zCap) L.push(`| \`${z}\` | 0 |`)

// --- row divergence
L.push('')
L.push('### Row-count divergence')
L.push('')
L.push('Two workspaces hold fewer rows than their headline claims, and one of those is an arithmetic slip rather than lost data.')
L.push('')
L.push('- **uae-cities** declares 35,880 dated rows for "2026-01-01..2027-05-31, 60 areas". That span is 516 days, and `data/federal-areas-rows.json` holds exactly 60 x 516 = 30,960. The data is complete for the stated span; the headline corresponds to 598 days. Nothing is missing, and the report\'s count is wrong by 4,920.')
L.push('- **mideast-cities** declares 12,360. Its own components (10 Saudi x 709, 6 Oman x 730, Iraq 365, Kuwait 365, Jordan 150) sum to 12,350, which is what `data/` holds. The total line overstates by 10.')
L.push('')
L.push('Every other divergence runs the other way, disk ahead of the headline, and each has a cause on record:')
L.push('')
L.push('- **indonesia2** banks the same 38-city payload twice (`jadwalsholat-org-rows.json` and `jsorg-raw.json`, 15,358 rows each). Deduplicated, the workspace holds 34,948 against a declared 34,648.')
L.push('- **o1l-29** banks every city twice, `_printed` and measured: 18,918 rows against a declared 9,459, exactly double.')
L.push('- **O1l-33** holds the eleven dated surfaces (4,015 rows) plus `data/relabel-2027/`, ten 2027 files whose payload is identical to the 2026 files. The report names that set as relabel evidence and grades it a frozen generation, which is the correct reading under FIT-RULES.')
L.push('- **russia-boards** holds the 32,120-row `dumrt.json` headline plus 43,069 rows in the DUM RB, CDUM and Ufa files.')
L.push('- **o1l-28**, **nigeria-states**, **tunisia-cities**, **latam-cities**, **O1l-31**, **o1l-15r**, **o1l-19r** and **germany-cities** all count newly banked surfaces in the headline while `data/` also holds re-captures, second layers or partial files.')

// --- known issues
L.push('')
L.push('### Known issues, verified')
L.push('')
L.push('**The fitter bug (`const isha += 1440`).** `us-states/fit_masjidal.js` declares `isha` as a `const` and then adds 1440 to it on the after-midnight branch, which throws `TypeError: Assignment to constant variable`. The throw is caught by the per-year `catch { continue }`, so a triggering year would vanish from the fit output silently rather than crash the run.')
L.push('')
L.push('The bug cannot reach banked data. The fitter reads `captures/` and `data/` and writes only `out/`; no dated row passes through it. Its practical reach is nil in this tree: a scan of all 403 date-keyed files in `us-states`, `us-unresolved` and `us-unproven` found zero rows with isha before maghrib in `us-states`, so the branch is never taken there. The 42 fits in `us-states/out/` are therefore unaffected. `us-unresolved/scripts/fit_masjidal.js` carries the fix (`let isha`), and the eleven after-midnight rows in its two files are safe. `o1l-22/work/fit_mq.mjs` uses a mutable `rows[d].isha` and is not affected.')
L.push('')
L.push('**The O1l-21r row count.** The round produced two workspaces for one job. `o1l-21r` holds the transcription and the data: 365 dated rows for Peshawar and 365 for Quetta, 730 in total, and its report states 366 chart rows against 365 dated for Peshawar because the printed chart carries a 29 February row that 2026 cannot hold. `pk-transcribe` holds the two copied PDFs and nothing else: `data/` and `work/` are empty and there is no report. The two `CONSOLIDATION.md` blocks differ only in that one counts chart rows (366) and the other dated rows (365). There is no data discrepancy, and `pk-transcribe` is a dead duplicate.')
L.push('')
L.push('**The wrong-country ledger records.** The ledger carries 30 records under `CA`. Twelve of them are misassigned, not fourteen: ten `rows_us_*` files, `rows_gt_aldaawa_guatemala_city.json` and `rows_hn_centro_islamico_san_pedro_sula.json`. The cause is `countryOf` in `derive/countries.mjs`: the ISO-prefix test is anchored at the start of the file name, so a `rows_` prefix defeats it and the workspace default `americas2: "CA"` takes over. `rows_ca_*` resolves correctly by coincidence. The two US files that are also banked without the prefix (`us_icgt_toledo.json`, `us_mcsamasjid_san_antonio.json`) carry `US` and are correct, which is why the summary figure of 14 double-counts two records.')
L.push('')
L.push('**Writes outside a workspace.** No wave script writes outside its own directory. The cross-workspace references found are reads: `germany-districts` reads `germany-cities`, `indonesia2` reads `indonesia-cities`, `gaps-closed` reads `mideast-cities` and `tunisia-cities`, `coords-ledger` reads five workspaces, `coords-americas` reads `us-states`, `nz-finish` reads `O1l-19r`, and `residual-fits` reads `o1k-wide`. One script writes `../fetch_ba.log` (`balkan-cities/fetch_ba.sh`), and no such file exists at the round root. The repository carries two uncommitted changes from the operation, `ai/plans/README.md` and `ai/features/global-prayer-times/RESEARCH-ROUNDS.md`; both are lead-level artefacts, not wave output. The shared `census/census-index.db` was written at 05:46Z by a process outside this tree and cannot be attributed from here.')

// --- closing artifacts
L.push('')
L.push('## Closing artifacts')
L.push('')
L.push('| Artifact | Exists | Bytes | Structure |')
L.push('| --- | --- | --- | --- |')
for (const p of ['BRIEF.md', 'FIT-RULES.md', 'CONSOLIDATION.md', 'QUEUE.md', 'monitor.log']) {
  const abs = path.join(ROOT, p)
  const exists = fs.existsSync(abs)
  const size = exists ? fs.statSync(abs).size : 0
  const txt = exists && p.endsWith('.md') ? fs.readFileSync(abs, 'utf8') : ''
  const h2 = (txt.match(/^## /gm) || []).length
  const h1 = (txt.match(/^# /gm) || []).length
  L.push(`| \`${p}\` | ${exists ? 'yes' : 'NO'} | ${fmt(size)} | ${p.endsWith('.md') ? `H1 x${h1}, H2 x${h2}` : 'append-only log'} |`)
}
L.push('')
L.push('- `CONSOLIDATION.md` carries one `##` block per returned wave and was still being appended at the cutoff.')
L.push('- `BRIEF.md` and `FIT-RULES.md` are the binding documents and are unchanged since 03:18Z and 02:52Z.')
L.push('- `QUEUE.md` is the round\'s opening queue and is unchanged since 02:57Z.')

// --- caveat
L.push('')
L.push('## Live-tree caveat')
L.push('')
const NEW_WS = ['final-sweep', 'fitindex2', 'fitter-audit', 'flags2', 'masjidi-highlat', 'residual-fits', 'summary', 'verify-round', 'wtdiff2'].filter((d) => ws[d])
const newNames = NEW_WS.map((d) => '`' + d + '`').join(', ')
L.push('The operation is still writing. This pass saw the tree grow from ' + (totals.workspaces - NEW_WS.length) + ' workspaces to ' + totals.workspaces + ' between the first sweep and the cutoff. The ' + NEW_WS.length + ' created after the sweep began: ' + newNames + '. No workspace disappeared. The IN-FLIGHT workspaces had writes inside the last 15 minutes and no report yet; their absence is timing, not loss. The figures here are a snapshot, not a final count: re-run `integrity2/scan.mjs` and `integrity2/gen.mjs` after the operation closes.')
L.push('')
fs.writeFileSync(path.join(ROOT, SELF, 'INTEGRITY-ROUND2.md'), L.join('\n'))
console.log('verdicts', JSON.stringify(counts), 'rows', totals.rows, 'dedup', totals.deduped)