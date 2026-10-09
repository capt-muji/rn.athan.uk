# Verification 07: blast radius and test census (R13, R14)

Independent spot-check of the file:line claims in `R13-BLAST-RADIUS.md` and `R14-TEST-CENSUS.md`
against the current checkout. R13 and R15 cite older shas (`5ad6aaba`, `cd47c70c`), the current uat
tip is `52109ec0`. Branch `verify/39-localisation-deepseek-20261009`. No file was modified.

## Findings

### F1. R13's header sha is stale provenance, not an error. CONFIRMED.
R13 says "every claim cites file:line at `uat` `5ad6aaba`" (`R13-BLAST-RADIUS.md:3`), and
`SINGLE-LANGUAGE-PIVOT.md:50` repeats it. R15 cites `cd47c70c` (`R15-IDENTIFIER-DESIGN.md:3`). Both
shas exist and are ancestors of `52109ec0` (30 and 24 commits back). R14 cites no sha.

### F2. R13 file:line citations are exact with zero drift. CONFIRMED.
Every spot-check matched the current checkout despite 30 intervening commits. Verified: `shared/types.ts`
PrayerRow `:266-276`, `english` `:270`, `arabic` `:272`. `shared/prayer.ts` `createPrayer` writes
`:302-303`, `getPrayerForDate` `:505`, `canonicalDisplayOrder` `:578`, `rawData[name.toLowerCase()]`
`:407`, literals `:398-399`. `shared/sequence.ts:25,194`. `component/prayer/Prayer.tsx:74,88-89,92`.
`stores/notifications.ts:207,433,487,664,877,1528-1533`. `device/notifications.ts:49-50,61-66`.
`shared/notifications.ts:17-24,147,387-390,410`. `shared/widgetTimeline.ts:135,188,247,290,303,306`.
`shared/widgetTypes.ts:48-53,80-81`. `stores/ui.ts:104-107,132,216`. `shared/constants.ts:9,15,26,32`.

### F3. R13's counts and risk seams stand. CONFIRMED.
No citation points at absent or altered content. The five silent seams (storage-key duality,
deterministic OS identifiers, the `canonicalPrayerIndex` fallback, name-keyed ordering and day rules,
widget prop contracts) are all real and each is confirmed by the identifier and upgrade verifications.

### F4. R14's "171 test files scanned" is wrong by 18. CONTRADICTED.
`R14-TEST-CENSUS.md:3` says "171 test files scanned". The repository holds 189 files matching
`*.test.ts`/`*.test.tsx` (147 `.ts`, 42 `.tsx`), confirmed with `find` and `git ls-tree -r HEAD` at
HEAD and at the cited shas. The Jest config matches all of them (`**/__tests__/**/*.test.ts(x)`). No
stated filter reproduces 171.

### F5. R14's "74 affected suites" is wrong by 11. CONTRADICTED.
`R14-TEST-CENSUS.md:3,111` says 74 distinct affected suites. Its own evidence table
(`:16-100`) lists 85 distinct rows, all real files, no duplicates. The stated total and the table
disagree.

### F6. R14's per-category subtotals are wrong. CONTRADICTED.
Counting each table row once per the category column gives 62, 38, 28, 17, 8 for categories 1 to 5.
R14 states 62, 38, 24, 18, 7 (`:106-110`). Categories 1 and 2 match, 3, 4 and 5 are off by 4, 1 and 1.

### F7. R14's individual file:line citations are accurate. CONFIRMED.
`stores/__tests__/schedule.test.ts:113,188`, `shared/__tests__/text.test.ts:8,14-56`,
`device/__tests__/notifications.test.ts:47-49` (the frozen `athan_extra_last third_2026-08-28`), plus
`stores/__tests__/notifications.test.ts:100-137` and `shared/__tests__/prayer.test.ts:139-146` all
match. The specific citations are trustworthy; only the aggregates are not.

### F8. The audio count is correct, the wording loose. CONFIRMED.
`assets/audio/reminders/` holds 67 mp3s: 66 named `reminder_<slug>_<interval>.mp3` (11 prayers x 6
intervals) plus `reminder.mp3`. R15's phrase "67 audio files named `reminder_<slug>_<interval>.mp3`" is
loose because only 66 match that pattern, but 67 is the directory total and matches the repo's own
guard (`shared/__tests__/audioMatrix.test.ts:148`).

## Spot-check table

| Item | Cited | Current | Status |
|---|---|---|---|
| R13 PrayerRow / english / arabic | 266-276 / 270 / 272 | same | CONFIRMED |
| R13 prayer.ts writes / lookup / order / literal | 302-303 / 407 / 578 / 398-399 | same | CONFIRMED |
| R13 sequence.ts listPosition / findNextOccurrence | 25 / 194 | same | CONFIRMED |
| R13 Prayer.tsx pass / english / arabic | 74 / 88-89 / 92 | same | CONFIRMED |
| R13 notifications.ts key / canonical / arabicName / legacy / sweep | 207 / 433,664 / 877 / 487 / 1528-1533 | same | CONFIRMED |
| R13 device identifiers | 49-50 / 61-66 | same | CONFIRMED |
| R13 shared/notifications.ts record / slug / channel | 17-24 / 147 / 387-390 | same | CONFIRMED |
| R13 widgetTimeline / widgetTypes | 135,188,247,290,303,306 / 48-53,80-81 | same | CONFIRMED |
| R13 ui.ts atoms / show / setter | 104-107 / 132 / 216 | same | CONFIRMED |
| R13 constants arrays | 9,15,26,32 | same | CONFIRMED |
| R14 test files scanned | 171 | 189 | CONTRADICTED |
| R14 affected suites | 74 | 85 table rows | CONTRADICTED |
| R14 category totals 1-5 | 62/38/24/18/7 | 62/38/28/17/8 | CONTRADICTED |
| R14 schedule.test.ts Fajr | 113,188 | same | CONFIRMED |
| R14 text.test.ts | 8,14-56 | same | CONFIRMED |
| R14 frozen identifier | 47-49 | same | CONFIRMED |
| Audio 67 plus reminder.mp3 | 67 | 66 patterned + reminder.mp3 = 67 | CONFIRMED (loose) |

## Better alternative and real cost

R13 needs no change. R14 needs its three headline aggregates corrected before it is used as a sizing
input: 189 test files scanned, 85 affected suites, and per-category subtotals 62, 38, 28, 17, 8. The
per-suite citations and the five-largest-refactor ranking remain valid as magnitudes. Cost: one edit to
three lines in R14, no re-derivation, because the evidence table is already correct and only the
summary disagreed with it.
