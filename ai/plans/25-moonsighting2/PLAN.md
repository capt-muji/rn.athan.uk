# T-25: Moonsighting research, part 2

| Field | Value |
| --- | --- |
| Brief | Moonsighting research, part 2 (T-25, Research) |
| Planned at | `uat` a35ac116, version 2.52.26, 2026-11-11 |
| Planned by | Lane A (lane-25 worktree) |
| Needs first | None. The 2026-10-19 run removed the stale #37/#39 relations (both Done). |
| Steps | 5, all research/docs, 1 point each, 5 total |
| Device | None |
| Owner decisions still needed | None. All open choices are agent-ruled in planning and recorded on the ticket. |

## 1. Goal

Part 1 (T-24 research, 2026-09) read moonsighting.com completely: every live page, every
document, every Wayback version of the method pages. The o1h study then scored the method
naked against 73 fitted authorities and London's real published minutes (fajr 2.95 / isha
4.37 over 4,383 days, the only body inside 5 minutes of both), and the O1k night banked
131,678 dated rows including every high-latitude surface in Europe. Three questions survive,
named by the lead's 2026-11-11 reconciliation (T-25 comment 7002):

1. **Who actually follows Moonsighting?** A worldwide map of publishers, councils and
   national bodies whose published timetables run on the committee's method. Never apps,
   never aggregators, never a label read as provenance (the masjidway "UK Unified" trap).
2. **What does the committee itself document, beyond the banked statement?** Session 1 read
   the site at 2026-09-14. The delta since then, plus a systematic extraction of every
   follower claim the corpus already holds.
3. **Does the method hold in the 45-55 degree band?** The o1h seasonal audit proved the
   sub-50 blowup against fitted recipes (Tunisia July fajr +5.55, Balkan isha 30-54 early).
   It was never run against the real banked minutes of the high-latitude corpus. Run it:
   naked MC against every held surface at or above 45 N - Iceland, Estonia, Norway's three
   lines, Sweden, Denmark, Belarus, the UK mosaic at minimum, London's real minutes as the
   control.

When DONE: `ai/features/global-prayer-times/data/research/moonsighting2/` holds
FOLLOWERS.md, DOCS-DELTA.md and BAND-45-55.md with re-runnable scripts and committed score
data; the owner can read the three answers off the reports without opening anything else.

Owner rules that apply, quoted:

- "the worldwide map of who actually follows Moonsighting - publishers, councils, national
  bodies, never apps or aggregators" (lead dispatch, 2026-11-11).
- "Public web pages only: no login, no registration, no contact with anyone, never solve a
  captcha or challenge; local-language searches; forum hearsay is never data; community
  surfaces are labelled community, never authority" (lead dispatch, 2026-11-11).
- "Where the plan or a phase asks the owner, answer agent-ruled: state the options, take
  your recommendation, argue it twice, record it as a ticket comment" (lead dispatch,
  2026-11-11).
- "Never invent a prayer time" (standing, session 1 prompt; repo invariant).
- The e2e README gotchas do not apply: no device, no Metro, no dev server.

## 2. Decisions

### 2.1 Taken

- **Scope is the lead's three items, nothing else.** The 2026-11-09 agent ruling keeps the
  part-1 remainders (Palestine DST day, McMurdo runs, Sky Prayers apps, the three ports)
  mooted unless a decision needs their numbers; nothing here needs them. Recorded on the
  ticket with this plan's link.
- **Baseline facts carried in, not re-derived** (T-595, ticket comment 5956): the London
  timetable's printed Islamic dates are Umm al Qura with crescent-sighting precedence, and
  its fajr/isha rest on Hizbul Ulama's unpublished Blackburn 1987-88 observation durations.
  These frame the followers map, they are not questioned.
- **The followers map's classes**, fixed vocabulary, one per entry: `proven-table` (a
  published table that fits the MC curve at stated coordinates, with numbers from a script
  run), `stated` (the body's own page says it uses the method), `lineage` (the committee's
  astronomer computed the body's tables, documented), `community` (a mosque or platform
  surface, labelled community, never authority), `refuted` (claimed and contradicted by the
  table), `negative` (searched, nothing). Apps and aggregators are never listed as
  authority; they appear only as leads that point at a publisher.
- **The band sweep covers every banked surface at or above 45 N**, not only the seven the
  lead named: the named list is a minimum and the corpus is machine-sweepable. The 45-55
  core gets its own table; surfaces above 55 ride along because the same runs produce them
  and they close the curve's full range (Tromso 69.6 N exercises the documented slide-down
  rule).
- **Naked rule, o1h discipline:** the adhan 4.4.6 `MoonsightingCommittee` preset verbatim
  at each surface's coordinates, second resolution then explicit nearest-minute rounding,
  `TZ=<surface zone>`, no real clock, no per-surface tuning. The method side is never
  adjusted to fit - a surface either sits on the curve or does not.
- **Raw captures live outside git** in `$HOME/athan-gitree/census/moonsighting2/`; the repo
  carries reports, scripts and compact score JSON only. Nothing lands under /tmp.

### 2.2 The executor must not decide

None. Every stopping point in this plan has its action written. The one hard stop remains
an irreversible act (publishing, contacting anyone, a credential): report it as STOP, never
do it.

## 3. Pre-flight

```bash
cd "$HOME/athan-gitree/worktrees/lane-25"
git fetch origin && git status -sb   # expect: ## lane-25... (ahead of uat only by this lane's commits, tree clean)
node -p "require('./package.json').version"   # expect 2.52.26
test -d "$HOME/athan-gitree/census/adhan-build/node_modules/adhan" && echo ADHAN OK
test -d ai/features/global-prayer-times/data/research/o1k-wide/nordics2/data && echo O1K OK
test -d ai/features/moonsighting && echo PART1 OK
mkdir -p "$HOME/athan-gitree/census/moonsighting2" && echo CENSUS OK
echo PREFLIGHT OK
```

## 4. Background the executor needs

- `ai/features/moonsighting/RESEARCH-FINDINGS.md` - part 1's complete read. Sections that
  matter here: 2.5 (the documented method), 2.8 (Hizbul Ulama UK lineage: Shaukat computed
  Miftahi's national tables), 2.13 (method-page history 1999-2024), 2.16 (the coefficients
  resolved: Shaukat's 2015 booklet equals adhan's), 3.3 (nine written versions of the
  above-55 rule; Shafaq width 66-100 vs 66-105 unresolved), 3.5 (the read was complete at
  2026-09-14: 1,186 live paths, 59 documents, 157 method-page versions).
- `ai/features/global-prayer-times/data/research/o1h-global/` - the naked-rule study.
  SIM-REPORT.md (MC ranked 9/21 at 5.05 mean; London 2.95/4.37 over 4,383 days),
  SEASONAL-REPORT.md (the sub-50 blowup; MC is the only method that rewrites an existing
  angle: 1,031 substituted July days, mean drag 97 minutes), top30/TOP30-REPORT.md,
  methods/raw/ (fresh captures of how-we.html and faq_pt.html).
- `ai/features/global-prayer-times/data/research/o1k-wide/` - the banked corpus.
  CONSOLIDATION.md blocks O1k-F8 (Norway's Jamiat Ulama line = MoonsightingCommittee:
  Oslo fajr 253/365 exact, 365/365 within-1, isha MC+3.5 floor, Hanafi asr - the first
  proven real-world publisher) and O1k-W18 (the committee's statement captured; FCNA 2011
  second witness: moonsighting functions with 17.5/15 fallback USA).
  fitindex/FIT-INDEX.md (59 entries; the high-latitude ones: NO-JAMIAT-INTERVAL, NO-IRN,
  EE-EIC 15-with-clamp, IS-FELAG 14.2/14.0).
- High-latitude banked minutes, per surface, in the repo:
  `o1k-wide/nordics2/data/` (Iceland 2027 + 2025 in europe/data, Norway IRN years,
  mawaqeet years, Minsk 2025, Sweden IF three cities, Danish samples),
  `o1k-wide/europe/data/` (Estonia 2026+2027 both cities, Iceland 2025, no-islamweb 7
  city-years, Denmark Imam Ali, Germany Diyanet three cities),
  `o1k-wide/ukscotland/data/` and `o1k-wide/uktowns2/data/` (the 30-town UK mosaic),
  `o1k-wide/benelux2/data/` (NL/BE), `o1k-wide/centralasia/data/` (Russia: Moscow, St
  Petersburg, Salekhard), `o1k-wide/deep3/data/` (Iceland 3-year fit state).
  London's real minutes: `$HOME/athan-gitree/census/o1g-decade/data/2027.json` and
  `truth/truth-2028-2038.json` (the o1h control), plus the LUPT 2027-2076 monthly pages.
- Engine: adhan 4.4.6 at `$HOME/athan-gitree/census/adhan-build/node_modules/adhan`, the
  same build o1h and fit8 used. fit8's harness (`o1k-wide/fit8/engine.mjs`, `lib.mjs`,
  `lib8.mjs`) is the code shape to copy, not import across workspaces.
- `ai/features/global-prayer-times/data/census/policy-layer.v2.4.json` and
  `world-table-v2.md` - target-side context only; the band sweep scores REAL minutes, not
  recipes.

Why the obvious approach is wrong: scoring MC against the fitted recipes (the o1h table)
again would repeat the study, not verify the band against evidence. The band question is
about real published tables, which the O1k night banked after o1h ran.

## 5. Design

One invariant: **every number in the three reports is emitted by a script committed in the
same directory, reading only banked corpus files or captures made by this lane, and
re-runs green.**

- The band sweep (steps 1-2) is pure compute on banked data: one surface registry, one
  scorer, one report. A surface enters the registry with coordinates, IANA zone, source
  path, and a row-count check; the scorer emits per-prayer mean/worst/within-2 plus a
  January/July split per surface, into a committed JSON the report tables are rendered
  from.
- The followers map (step 3) starts from the corpus: any surface whose band-sweep score
  sits at MC-family distance (fajr and isha mean under 2 minutes, or the surface's own
  published statement says so) becomes a candidate; each candidate then gets its own-page
  check. The web sweep adds candidates by local-language search. Proof is always a fit
  number or the body's own page; a platform label is never proof.
- The docs delta (step 4) re-captures the handful of pages that carry the method
  (how-we.html, faq_pt.html, pray.php, plus the Wayback CDX for new captures since
  2026-09-14), diffs against part 1's banked versions, and extracts every follower claim
  held in the corpus (part 1 sections 2.17/2.18 notes, o1h methods raw, the W18 captures).
- Alternatives rejected: re-running the full o1h grid per surface (duplicates o1h, answers
  nothing new); fitting MC with margins (the naked rule forbids per-surface tuning, and a
  follower test is identity, not approximation); reading Wayback editions of every page
  again (part 1 did this; only the delta since 2026-09-14 is open).

Concurrency trace: none. The scripts are single-process, offline, deterministic. Web sweeps
run through TinyFish search/fetch (public pages, no login); anything challenged or blocked
is recorded negative-with-reason, never solved.

## 6. Steps

Checklist:

- [ ] Step 1: Surface registry + scorer harness
- [ ] Step 2: Band runs - BAND-45-55.md
- [ ] Step 3: Followers map - FOLLOWERS.md
- [ ] Step 4: Committee docs delta - DOCS-DELTA.md
- [ ] Step 5: Synthesis, validate, version bump 2.52.27, commit, board close

Each step lands its files under
`ai/features/global-prayer-times/data/research/moonsighting2/`. One branch (`lane-25`), one
commit at step 5 carrying everything, version 2.52.27 (patch; the commit subject is typed
`chore(research)`). Subtask ticked per step on the board.

### Step 1: Surface registry + scorer harness

Goal: `surfaces.json` naming every banked surface at or above 45 N with coordinates, zone,
source path and row count; `mc-score.mjs` scoring naked MC against any registry entry.
Files: `moonsighting2/surfaces.json`, `moonsighting2/mc-score.mjs`, `moonsighting2/lib.mjs`.
Contract: registry row = `{id, place, lat, lon, tz, path, rows, source, band: "45-55"|"55-60"|">60"}`;
scorer emits `{id, fajr: {mean, worst, within2, jan, jul}, isha: {same}, days}` at nearest
minute; identical input reproduces identical JSON byte-for-byte. The London control
(o1g truth minutes) is registry id `GB-LONDON-TRUTH`. Done when: the scorer runs over the
whole registry without a null cell unexplained by the surface (a surface's missing summer
rows are carried, never imputed), and the Jamiat Oslo entry reproduces fit8's published
shape (fajr within-1 365/365) - that is the harness's known-answer test.

### Step 2: Band runs

Goal: `data/band-scores.json` + `BAND-45-55.md`. Report sections: (a) the 45-55 core
table; (b) 55-60; (c) above 60 including Tromso's synthetic days excluded-and-counted;
(d) London control; (e) the verdict paragraph - where the curve tracks a real publisher,
where it does not, and what that says for a 45-55 deployment. Every table cell cites the
JSON. Done when: all seven lead-named surfaces plus every other registry entry appear, and
the verdict names numbers, not adjectives.

### Step 3: Followers map

Goal: `FOLLOWERS.md`. Starts from band-scores candidates (MC-family distance), then the
web sweep: local-language queries (Norwegian, Swedish, Danish, German, Dutch, French,
Spanish, Russian, Turkish, Bosnian, Albanian, Polish, Finnish, Estonian, Urdu, Arabic) for
councils, muftiates, federations and national bodies citing the committee's method or
site; each hit verified against the body's own page (capture saved to
`$HOME/athan-gitree/census/moonsighting2/`). Known entries to place: Jamiat Ulama Norway
(proven-table, fit8), FCNA 2011 position (stated, 17.5/15 fallback - never merge with
ISNA's current 15/15 statement), Hizbul Ulama UK via Shaukat (lineage, 2006/2009 editions),
the two code repos how-we names (community, code not publisher). Table columns: body,
country, class, evidence (URL + date), table fit numbers when claimed. Done when: every
candidate has a class, every proven-table entry has script numbers, the negatives list
carries what was searched in which languages, and no app or aggregator appears as
authority.

### Step 4: Committee docs delta

Goal: `DOCS-DELTA.md`. Re-capture how-we.html, faq_pt.html, pray.php (and the praytable
parameter surface); Wayback CDX diff for new captures of any moonsighting.com path since
2026-09-14; read each delta against part 1's banked versions; carry the two open
documentation questions (the nine above-55 versions, the Shafaq width) forward only if the
new captures move them. Follower-claims extraction table: every place the corpus's captures
name a user of the method. Done when: the delta table is complete (page, last banked
version, current version, change or none), raw captures are in the census dir, and any
method-page change is quoted, not paraphrased.

### Step 5: Synthesis and close

Goal: `moonsighting2/REPORT.md` - three-paragraph executive answer (one per question)
pointing into the three reports; cross-check pass (every number in the executive answer
appears in a report; every report's scripts re-run green from a clean checkout of the
lane's tree); `yarn validate` green; version bump package.json + app.json +
android/app/build.gradle to 2.52.27 (app.json first); one commit; subtasks ticked; ticket
to Audit with the closing comment; board snapshot not required (lead's run closes it).

## 7. Device proof

None. Research only, no app code, no build. `yarn validate` is the gate.

## 8. Records

- Findings directory: `ai/features/global-prayer-times/data/research/moonsighting2/`
  (REPORT.md, FOLLOWERS.md, DOCS-DELTA.md, BAND-45-55.md, surfaces.json, mc-score.mjs,
  lib.mjs, data/band-scores.json).
- Ticket comment at planning close: plan link + the agent-ruled decisions.
- Ticket comment at close: one line per question answered, the commit sha.
- Commit message: `2.52.27 - chore(research): T-25 moonsighting part 2 - the followers
  map, the committee docs delta, and the 45-55 band verified against every banked
  high-latitude surface`.

## 9. Push

None. The lane never pushes. The lead audits and pushes.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| A banked JSON's schema differs from the harness's reader | Read the file, extend the reader for that schema only, note the extension in the report's checks section. Never reshape a banked file. |
| adhan preset result differs from fit8's published Jamiat numbers | Stop. The harness is wrong; find the difference (rounding, TZ, coordinates) before any other run. |
| A page is challenge-walled or login-gated | Record negative-with-reason in the report. Never solve it. |
| TinyFish blocked on a domain | One retry, then record; the moonsighting.com pages also exist as Wayback captures - cite the capture when used. |
| A candidate follower's table does not fit MC | Class it `refuted` with the numbers, or `community` if the surface is a mosque/platform. Never force the class. |
| Session budget exhausts before step 5 | Commit what is complete with its own version, tick the finished subtasks only, comment the residue on the ticket, and report LANE_ROTATE with the next phase named. |

## 11. Subagents

At most two, one at a time, for the step-3 web sweep and the step-4 capture sweep only.
Each carries the supervision block (owner order 2026-10-31) and the public-pages rule.
Compute steps run in this session, no children.

## 12. Report to the owner

Plain sentences: who follows the committee's method (and who only claims to), what the
committee's own pages say today that they did not say in September, and whether the method
survives the band it was never tested in. The progress table and the decisions waiting on
the owner (none expected; the >55-rule choice stays part 1's open question unless new
captures move it).
