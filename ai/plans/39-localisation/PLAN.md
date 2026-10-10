# Job 38: the single-language overhaul, stage one (of two, inside release 2.0.0)

| Field | Value |
| --- | --- |
| Brief | `SINGLE-LANGUAGE-PIVOT.md` (governs), `OWNER-DECISIONS.md` D17 to D35, `RECONCILIATION.md` (the external adjudication), research R8 to R18 with correction banners |
| Planned at | `uat` `c3149dfc` (1.29.305), 2026-10-10 |
| Planned by | Planning session (reconciliation of four external branches, owner-present rulings D34/D35) |
| Needs first | row 37 DONE (verified in the queue) |
| Steps | 15 (stage one; stage two is row 39, replanned separately) |
| Batch budget | 6 |
| Session budget | 12 |
| Device | OnePlus 3T (`3T_SERIAL`), Android 9; iPhone XS for the iOS-side checks |
| Owner decisions still needed | None for stage one. Row 39 opens with: the qibla place-name exception, the native-strings ruling, the null-props widget card, the channel-rename device check |

## 1. Goal

**What is wrong today:** the app renders two languages at once (English chrome, Arabic second
column and explanation line), every string is a hardcoded literal, and the English prayer name
doubles as the domain identifier without any type-level separation, so a future catalog could
silently corrupt stored preference keys, two OS identifier families and 67 audio slugs.

**What is true when DONE (stage one):** the Arabic column, the Arabic explanation line, the
"Show arabic names" toggle, its atom and its stored key are gone; every user-visible string
renders through a typed flat catalog (`t()`, `keyof typeof` key safety, `satisfies Catalog`,
no runtime fallback, English bytes identical to today's literals); the prayer identifier is the
closed space-form slug union on a field named `id`, pinned by `prayerIdContract.test.ts`; the
width cache is per-locale with the `en` keys seeded from today's values; the 2.0.0 upgrade is
the targeted no-wipe migration with the version-guarded stamp (R18 as corrected); a
hardcoded-string AST guard, a plural-construct guard and a catalog round-trip parity test run in
the existing pre-commit chain. The app looks byte-identical to 1.29.x in English.

**How the owner notices:** he cannot (that is the point of stage one); the row shows one name,
the box one explanation, and `yarn validate` carries three new gates.

**Owner rules that apply (sources):** D17 to D35 (`OWNER-DECISIONS.md`, including this
session's D34 forward-only convergence and D35 no-keep-list-additions); the hard rules in
`ai/AGENTS.md` (never substitute a prayer time; visuals settled, and this plan's visible deltas
are exactly the removals the owner ruled in Q1/Q2; full coverage, red before green; version
lockstep; no `console.log`; comments explain why only). The executor changes no pixel beyond
the ruled removals.

## 2. Decisions

**2.1 Taken.** D17 one language everywhere; D18/D28 superseded by D34 (forward-only; stage one
builds no switch at all); D19 2.0.0 release; D20 qibla sensor untouched; D21 Latin numerals;
D22 audio unchanged; D23 month names localise (mechanism: catalog keys, per the Q9 correction);
D24 transliterate; D25 release workflow; D26 native picker names (stage two); D27 no İmsak;
D29 upgrade-connectivity assumption; D30 no OTA; D31 left-align everything; D32 six-language
milestone (en ar ms so hi th) on a roadmap to fifty; D33 the two keys approved as named; D34
forward-only convergence; D35 clean database, no keep-list additions. Q1 to Q23 as recorded in
the pivot's frontier. Verdicts adopted: R15 identifiers, R16 architecture with its forced
changes as amended by `RECONCILIATION.md` (flat-JSON bridge, loader-indirected catalog), R17
scale, R18 upgrade as corrected.

**2.2 The executor must not decide.** Any output the plan does not predict: STOP and ask. The
`preference_language` stamp writes `'en'` only for upgrading installs (captured storedVersion
non-null and below 2.0.0); fresh installs keep the key absent. No keep-list prefix is added,
changed or reordered. No stored key, OS identifier, channel id or audio slug changes a byte.

## 3. Pre-flight

`scripts/preflight-38.sh` in this folder. Checks: checkout on `uat`, clean tree, `origin/uat`
merged in, version not lower than 1.29.305, row 37 DONE, every anchor under `scripts/anchors/`
counts exactly 1 at the planned-at sha, and the scanner census file exists and is non-empty.
Ends `PREFLIGHT OK`.

## 4. Background the executor needs

The code map IS `research/R13-BLAST-RADIUS.md` with its 2026-10-10 patch (every file:line to
touch, counts per file, the six silent seams) and the test census IS
`research/R14-TEST-CENSUS.md` with its correction banner (85 affected suites in the table; the
table is the truth, the headline is wrong). The upgrade design is `research/R18-UPGRADE-PATH.md`
as corrected by its banner. The identifier design with its test gate is
`research/R15-IDENTIFIER-DESIGN.md`. The architecture is `research/R16-ARCHITECTURE.md` as
amended by its banner. The external adjudication that changed this plan is `RECONCILIATION.md`.
The executor reads those six in full before step 1, plus `__tests__/README.md`. Anchors:
`scripts/anchors/` holds the verbatim excerpts each step edits against, extracted at
`c3149dfc` by `scripts/extract-anchors-38.sh`. Replan 2026-10-10: an anchor's pre-flight
owner is the FIRST step not yet DONE that edits its region. Eleven anchors named by steps
05 to 09 held text steps 02 to 04 already consumed, and were regenerated from the
post-step-04 tree at `76a40d3f` (the sha-guarded script that did it is deleted; git history
and the anchor files themselves are the record). The same day's gate retrofit split every
anchor over 15 lines into named pieces, so the anchor files now carry the final names the
map and the step Anchors lines cite. Seven anchors whose regions step 06's contracts retype
ahead of their original owners moved to step 06 in the pre-flight map: `ago-text`,
`content-builders`, `reminder-content`, `timeline-names`, `timeline-next`,
`overlaycontent-arabic`, and the channel-id pair now named `reminder-channel-id` and
`attime-channel-id`. Where a step names
an anchor an earlier step has since rewritten, its Anchors line says so in a parenthetical.

Why the obvious fix is wrong: renaming `Prayer.english` in place, or "translating" the arrays,
orphans alarms and resets preferences silently (R13 seams 1-2; the `last third` space-form
landmine, R15). A key-absence-guarded language stamp pins every fresh install to English
(`RECONCILIATION.md`, UPG-2). Any wipe or keep-list addition: rejected by measurement and by
D35 (R18). JSON catalogs as the design: rejected, kept only as the pre-decided contingency
behind the loader indirection (R16 as amended).

## 5. Design

**Invariant (one sentence a test can check):** after every stage-one commit, the app renders
exactly the bytes 1.29.305 rendered in English, every stored key and armed identifier is
unchanged byte-for-byte, and every user-visible string reaches the screen through `t()` or a
catalog read.

**The approach:** pin the frozen bytes first (freeze table, widened per the adjudication), then
remove the Arabic surfaces (self-contained), then land the identifier union with the migration
rewrite and the typed record access, then build the catalog, `t()` and `prayerLabel` behind a
one-module loader with the plural guard in the same commit, then the flat-JSON bridge with
round-trip parity, then migrate the display strings file by file in the scanner's measured
order, then the per-locale width keys with the module-eval seed, then the storage row-shape
change and the upgrade migrations with the version-guarded stamp, then the widget prop version
bump with tolerance and the render-time-string props, then switch on the AST guard against a
zero-length exclusion list, then the 3T pre-flights.

**Alternatives rejected:** numeric identifiers (R15d); a wipe upgrade (R18a, D35); a library
(R16 as amended); wrapping the removal and the catalog in one step (the removal must land alone
so a revert of the catalog work never resurrects the column); doing the row-shape change before
the freeze test exists (the freeze must be red-proof before the first byte moves); i18next-shaped
bridge JSON (flat JSON with `{name}` is the catalog itself); an `Intl`/date-fns month-name tag
swap (catalog keys; no Somali date-fns locale exists and Thai gains a Buddhist era).

**Concurrency trace:** stage one touches no scheduling logic except the record shape and the
migration; the scheduler runs unchanged against `id` because the bytes are identical. The width
seed runs at module evaluation of `stores/ui.ts` before any atom exists over the new keys (R18
step 2) - the only ordering hazard in the stage, and it is designed around, not tested around.
The upgrade stamp runs inside `handleAppUpgrade` guarded by the captured pre-overwrite
`storedVersion`, which distinguishes fresh installs (null) from upgraders without touching
first paint.

**Design review:** the synthesis pass (`SINGLE-LANGUAGE-PIVOT.md`) and the four external
branches played hostile reviewer across the whole record; every confirmed finding is adjudicated
in `RECONCILIATION.md`, and its two owner items became D34 and D35.

### Acceptance criteria (EARS)

- [R1.1] WHEN a prayer list row renders THE SYSTEM SHALL display exactly one name, byte-identical to the 1.29.305 English rendering
- [R2.1] WHEN a stored key, OS notification identifier, Android channel id or audio slug is built THE SYSTEM SHALL emit the bytes the 1.29.305 freeze table pins
- [R3.1] WHEN a display read needs a prayer name THE SYSTEM SHALL resolve it through `t()` or `prayerLabel()` typed over `PrayerId`, with no fallback
- [R3.2] WHILE the en catalog ships THE SYSTEM SHALL hold every user-visible English string as a flat dotted key whose value is byte-identical to the 1.29.305 literal
- [R4.1] WHEN the catalog is exported to flat JSON and re-imported THE SYSTEM SHALL round-trip to a deep-equal catalog with every token covered
- [R4.2] WHEN a catalog value carries a plural construct or an interpolation token without a typed parameter THE SYSTEM SHALL fail the guard suite
- [R5.1] WHEN the string guard scans the source tree THE SYSTEM SHALL fail on every display literal outside the catalog that the allowlist does not name
- [R6.1] WHEN the app upgrades from a version below 2.0.0 over a populated install THE SYSTEM SHALL keep every preference and armed alarm, delete the dead toggle key, and stamp `preference_language` to `en`
- [R6.2] WHEN a fresh install first runs THE SYSTEM SHALL leave `preference_language` absent
- [R7.1] WHILE `stores/ui.ts` evaluates THE SYSTEM SHALL seed the en width keys before any atom reads a per-locale width
- [R8.1] WHEN widget props are written THE SYSTEM SHALL carry `id`, tolerate version-5 entries, and version the payload at 6
- [R9.1] WHEN stage one runs on the 3T THE SYSTEM SHALL show the 1.29.x armed identifiers unchanged in `dumpsys alarm` and the catalog require timing in logcat

## 6. Steps (checklist; each step is a file under `steps/`)

1. `01-freeze-test.md` - `prayerIdContract.test.ts`: the widened freeze table (arrays' order,
   preference keys, OS identifiers, channel ids including the underscore forms, channel-name
   formats, bookkeeping record keys, the index-keyed legacy family and its map, the daily-prayer
   truth table) plus the disk join (67 files). The firewall fixtures land with step 06's
   retyping; the catalog closure with step 05. No production change.
2. `02-arabic-removal-row.md` - the row's second column and `showArabicNamesAtom` consumers in
   `Prayer.tsx`; `Time.tsx` untouched.
3. `03-arabic-removal-chrome.md` - the Settings toggle row, the explanation box's Arabic line,
   `toArabicNumbers` deleted, `overlayContent`'s Arabic fields.
4. `04-arabic-data-plumbing.md` - `PrayerRow.arabic` dies end to end (row builders, sheet
   state, commit signatures, bookkeeping writes; the commit-signature suites, R14's table).
5. `05-catalog-and-t.md` - the id vocabulary (`STANDARD_PRAYER_IDS` / `EXTRA_PRAYER_IDS`,
   space form, `PrayerId`, `StoredPrayerId`), `shared/i18n/` (loader-indirected), `en.ts`
   flat `as const` byte-identical, `t()` with `satisfies Catalog`, `prayerLabel(id)`, the
   plural guard, the catalog-closure assertion, the `en` byte-parity test.
6. `06-identifier-union.md` - `PrayerRow.english` becomes `id: PrayerId`, display reads
   become `prayerLabel`, builders retype and stop lowercasing, the migration rewritten line
   by line, the `shared/prayer.ts:398-407` branch rewrite, the typed loading row, dead casts
   deleted, firewall fixtures live (R15 complete with the adjudication's repairs).
7. `07-bridge.md` - `i18n:export` / `i18n:import` over flat key-value JSON with `{name}`, and
   the round-trip parity CI test.
8. `08-strings-wave-1.md` - the AST scanner lands (`scripts/scan-strings.mjs`, census JSON);
   then `shared/help.ts`, `shared/whatsNew.ts`, `Settings.tsx`.
9. `09-strings-wave-2.md` - `Alert.tsx` sheets, `constants.ts` display strings,
   `ColorPicker.tsx`, `Explanation.tsx`, qibla copy files.
10. `10-strings-wave-3.md` - the remaining copy files to zero, widgets' strings resolved in the
    app and baked into props.
11. `11-width-per-locale.md` - locale-keyed atoms, the module-eval seed, measurement reads the
    catalog, whitelist interactions, `InitialWidthMeasurement` extension.
12. `12-upgrade-migrations.md` - `migrateToLocaleDefaults` with the version-guarded stamp,
    the width seed, R18's corrected crash-window suite, `upgrade2_0_0.test.ts` with the
    pre-marker fixture population.
13. `13-widget-props.md` - widget prop contracts carry `id`, `WIDGET_PROPS_VERSION` 5 to 6 and
    `ANDROID_SNAPSHOT_VERSION` 1 to 2, layouts tolerate old entries, React keys off
    `id ?? name`, unit suffixes become props, the `props != null` guard fix, the closure walk
    over all three lock layouts, payload guard re-run.
14. `14-source-guard.md` - the two-part guard: context-scoped AST scan against a zero-length
    exclusion list, and the data-modules rule (catalog keys only).
15. `15-pre-flights.md` - the 3T first-catalog require-timing experiment with the JSON.parse
    decision behind the loader, the stage-two month-keys sourcing note, record the numbers.

Step contracts, red tests, break scripts, commit messages and review checklists: `steps/*.md`.
Anchors: `scripts/anchors/`. Census: `scripts/string-census.json` (scanner output).

## 7. Device proof

Stage one proves on the 3T with a local production build (`build-prod.zsh`): the row renders
one name, times aligned; `dumpsys alarm` shows the same armed identifiers as the 1.29.x build
(unchanged bytes); the width measurement lands in the seeded `en` keys; logcat carries the
catalog require timing. The upgrade path is proven by installing the stage-one build over a
populated 1.29.x install: preferences survive, the dead key is gone, no alarm orphan appears in
the sweep logs, and `preference_language` reads `en` while a fresh install keeps it absent.
Details per step in `steps/`.

## 8. Records

Row 38's cell on PASS: "DONE: stage one of the single-language overhaul landed as 2.0.0-stage-1
on uat; Arabic surfaces removed, identifier union frozen by the widened contract test, t()
pipeline with flat-JSON bridge and guards, per-locale width keys with seed, the R18 targeted
upgrade with the version-guarded stamp, widget props v6 with tolerance. The four external
branches are adjudicated in RECONCILIATION.md (kept until row 39 merges). Stage two is row 39."
The plan folder survives until its merge per the repo rule; R8 to R18 and RECONCILIATION.md
stay (cited by the row as the surviving artefacts).

## 9. Push

None. The executor never pushes; the audit session pushes after PASS.

## 10. When something goes wrong

| Symptom | Response |
| --- | --- |
| Any anchor count other than 1 | NEEDS REPLAN |
| A test failing that the step did not name | STOP |
| A suite asserting the removed Arabic strings | Delete the assertions with the surface (they are the change), never the suite |
| `versionLockstep` fails at commit time | The gitignored `android/app/build.gradle` lags branch switches; align it before committing |
| The hook's `audioMatrix` timeout | Wait for load average below 8 and retry (three tries) |
| The scanner reports a count a step does not predict | STOP: the census is committed artefact; a drift means the tree moved |

Per-step restore lists live in each step file.

## 11. Subagents

None. Vision only, if an image must be read.

## 12. Report to the owner

Plain sentences: what landed, what the device proved, the three gates now in the chain, and the
row 39 inheritance list from `RECONCILIATION.md`. Progress table. The four-line handoff.

## Resume from

All 15 step files are written. Nothing is executed. LOG.md starts empty. The next session runs
the pre-flight and executes step 1.
