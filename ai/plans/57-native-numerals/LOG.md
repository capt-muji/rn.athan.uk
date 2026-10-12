# Job 57 execution ledger

## Step 01: the digit localiser and the shared formatters

- Branch: `feat/57-01-digit-core` off `uat` (pre-flight `PREFLIGHT OK`, 7 anchors verified, jest existence check passed).
- Red: `digits.test.ts` failed on the absent module; `formatTime`/`formatPrayerTime` ar tests failed showing `2س 59د`/`05:44`; `dateLocalized` ar tests failed showing Latin. 4 named failures, no others.
- Change: `shared/i18n/digits.ts` (ARABIC_INDIC ten-glyph map, `localiseDigits` with the single `currentLocaleId() === 'ar'` test), re-export in `shared/i18n/index.ts`, all six `shared/time.ts` formatters wrap every return through `localiseDigits` (`formatPrayerTime` 1 return, `formatTime` 2, `formatTimeAgo` 4, `formatDateLocalized` 1, `formatHijriDateLocalized` 2 including the Gregorian fallback delegation, `footerFor` 2). Plan's parenthetical counts (6/4/3) do not match the code on uat (2/4/2; `shared/time.ts` unchanged since the planning commit `6195ab1f`); the operative contract "wrap each return" was followed literally. The catch-fallback split to three lines needed one added test (`2026-03-05 ` trailing space: ISO parse throws, field split composes) to hold the 100% coverage gate. Updated the `formatHijriDateLocalized` JSDoc and the dateLocalized test header comment, which the change made untrue.
- Green: `yarn validate` 5443 passed, 5443 total; Statements 100% (5202/5202), Branches 100% (2242/2242), Functions 100% (1080/1080), Lines 100% (4660/4660). `yarn test:tz` exit 0, four zones, 5443 passed each. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
- Break script: `ALL AS EXPECTED: 1` (locale test substitution fails the ar mapping with `05:44` shown, restore passes 5/5).
- Version: 2.0.57 (origin/uat fetched under the version lock at 2.0.56).
- Commit: `47bf4e24` (2.0.57; amended from `a67cc87b` to fold the LOG update in), hook green: `Tests: 5443 passed, 5443 total`; Statements 100% (5202/5202), Branches 100% (2242/2242), Functions 100% (1080/1080), Lines 100% (4660/4660).
- Review: read `git show` cold. Map covers exactly ten glyphs (pinned by test); en/ms/so/hi/th identity pinned; no output parsing; call-time locale read (loader law); cache-key paths (`formatDateShort`, `pad2`, `adjustTime`) untouched; the one untrue JSDoc updated. No findings.
- Merge: `6e568825` ("Merge feat/57-01-digit-core into uat: job 57 step 01").

## Step 02: the bridge substitution and the notification sites

- Branch: `feat/57-02-bridge` off `uat`.
- Red: `i18nBridge` ar substitution test failed showing `أذان 3`; `notifications` reminder-title test failed showing `العصر بعد 15 د`. 2 named failures, no others.
- Change: `shared/i18n/index.ts` pins `const localized = localiseDigits(String(supplied));` at the substitution site, import from `./digits`. No call-site changes. The pinned channel-name assertion (`notifications.test.ts`, `createReminderAndroidChannel` under ar) flipped from `تنبيه المغرب بعد 15 د` to `تنبيه المغرب بعد ١٥ د`: the step's goal names channel sites, the bridge change makes the name render native digits, and the test's intent (named from the active catalog) is unchanged. Not in the plan's step-04 inventory; recorded here.
- Green: `yarn validate` 5445 passed, 5445 total; Statements 100% (5203/5203), Branches 100% (2242/2242), Functions 100% (1080/1080), Lines 100% (4661/4661). `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
- Break script: `ALL AS EXPECTED: 1` (substitution pinned line replaced, ar test fails with `أذان 3` shown, restore passes).
- Version: 2.0.58 (origin/uat re-fetched under the held lock, still 2.0.56).
- Commit: `4563da13` (2.0.58; amended from `345fea40` to fold this ledger fill in), hook green: `Tests: 5445 passed, 5445 total`.
- Review: read `git show` cold. Substitution line matches the contract byte-for-byte; identifier suites green untouched (channel ids and file names build from raw values, never `t()`); only digit glyphs map, names and words pass through; the channel-name pinned flip is the plan's own goal (channel sites render native digits in ar). No findings.
- Merge: `3da75f88` ("Merge feat/57-02-bridge into uat: job 57 step 02").

## Step 03: the six point fixes

- Branch: `feat/57-03-point-fixes` off `uat` (step branches 01 and 02 deleted after their merges).
- Red: SoundItem ar preview failed showing `0:03`; Alert stepper ar interval failed showing `15`; widget renderer ar label failed showing `19د`. 3 named failures, no others.
- Change: `SoundItem.tsx` local `m:ss` composes into a const then `const localised = localiseDigits(composed);`; `Stepper.tsx` renders `const visible = localiseDigits(String(value));` as `{visible}` (a11y label already rides the bridge); `widgets/PrayerWidget.tsx` gains the inline ten-glyph `WIDGET_DIGITS` map plus `localiseDigits` INSIDE `AthanHomeWidget` keyed off the existing `__expoWidgetDeviceLocale` resolver (D61, no module-scope reference, no import), `ALabel`'s three returns compose through it, and the legacy footer fallback (654) parses unchanged and renders through it. The `Text(timerInterval:)` sites (729; LockPrayerWidget 263, 747) untouched in the diff (D58); v1 fallback literals untouched.
- Green: `yarn validate` 5448 passed, 5448 total; Statements 100% (5204/5204), Branches 100% (2242/2242), Functions 100% (1082/1082), Lines 100% (4667/4667). `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
- Break script: `ALL AS EXPECTED: 1` (the pinned localised line replaced by an identity parenthesisation, ar preview fails with `0:03` shown, restore passes 20/20).
- Version: 2.0.59 (origin/uat re-fetched under the held lock, still 2.0.56).
- Commit: `18f3c613` (2.0.59; amended from `5948f842` to fold this ledger fill in), hook green: `Tests: 5448 passed, 5448 total`.
- Review: read the staged diff cold. No import reaches PrayerWidget.tsx (D61 closure law), the widget map lives inside `AthanHomeWidget` keyed off the existing device-locale resolver, the SoundItem and Stepper lines are byte-exact per contract, `Text(timerInterval:)` absent from the diff (D58), v1 literals untouched, no pixel changes beyond digit glyphs, the widget runtime load suite green inside validate. No findings.
- Merge: `33defa40` ("Merge feat/57-03-point-fixes into uat: job 57 step 03").

## Step 04: the pinned assertions and the records - STOPPED

- Branch: `feat/57-04-tests-records` off `uat`. The sweep was written (nine suites extended: the census's Time, Countdown, Sound, InitialWidthMeasurement, time, widgetRenderer, widgetSimulation, stores/countdown twins plus the ar width proof) and every twin that does not touch the two defective surfaces passes. Two twins fail against the merged steps 1-3 and the step cannot proceed: the plan's premise that `formatPrayerTime` feeds the list times is false.
- The finding, both surfaces named by the plan's own acceptance criteria:
  - R1.1, list rows: `getShownTime` (hooks/usePrayer.ts:41-42) returns `prayer.time`, the raw stored API `HH:mm` string, so `components/prayer/Time.tsx` renders Latin under ar for fajr through isha, suhoor and duha (twin expected `٠٦:٤٦`, received `06:46`). Only the night rows (midnight, last third, istijaba) localise, composed through `formatPrayerTime` at shared/prayer.ts:397 - so under ar the merged list is internally MIXED, six Latin rows beside native night rows.
  - R4.1, widget props: `shared/widgetTimeline.ts` bakes `time: prayer.time` (156), `nextTime: next.time` (211, 271) and the Android day rows `time: prayer.time` (331) - raw Latin under ar (twin expected `٠١:٠٥`, received `01:05`), while the same widget's countdown label and footers render native.
- Where the localisation point sits is a decision the plan does not give (the row edge `getShownTime` vs `Time.tsx` vs recomposing every sequence time through `formatPrayerTime` vs the widget builder's bakes), each with different blast radius (overlay next-occurrence path, unread sentinel, alert sheet, stored-vs-rendered separation). Per the executor rules this returns to the lead rather than being filled.
- Disposition: all nine suites' test edits reverted from the tree and preserved verbatim at `$HOME/athan-gitree/sessions/57/step04-stopped.patch` (with `step04-stopped-status.txt`); the replan re-applies the patch and adds the production fix the plan owes. Steps 1-3 stay merged as landed: their step contracts were followed exactly, and en bytes are frozen throughout (R1.2 holds); the ar list's mixed state is the intermediate the stop leaves.
- Version: 2.0.60 (origin/uat fetched under the version lock, still 2.0.56).
- Commit: (this records commit)
- Merge: `e827326d`
- session: ses_ed2764c96ffe16EVsvp03ReEtF

## Plan repair A1 (2026-10-12, planning session)

The step-4 stop adjudicated from the repository: both defect surfaces sit in
the plan's own DONE definition, so no owner decision was missing - the census
was wrong, not the rulings. Amendment A1 (PLAN.md section 13) corrects the
map, adds step 03b (proven red to green in a scratch worktree at `e827326d`,
worktree removed), moves this sweep's two defect twins into step 03b, and
gives step 04 its resume note. Preflight gains five anchors (12 total).

## Step 03b: the shown time and every widget time bake (A1)

- Branch: `feat/57-03b-shown-and-widget-bakes` off `uat` (A1's five anchors each counted 1 at the branch point).
- Red: the two defect twins applied verbatim from `step04-stopped.patch` (`Time.test.tsx`, `widgetSimulation.test.ts`) failed showing `06:46` and `01:05`; the `widgetTimeline.test.ts` extension written from the step file failed showing `17:45`. 3 named failures, no others.
- Change: `hooks/usePrayer.ts` imports `localiseDigits` from `@/shared/i18n` and `getShownTime` carries the contract body verbatim (signature and null semantics unchanged); `shared/widgetTimeline.ts` adds `localiseDigits` to the `@/shared/i18n` import and wraps the four bakes (day-list row `prayer.time ?? UNAVAILABLE_TIME`, timeline entry `next.time`, stale entry `finalPrayer.time`, Android readable row `prayer.time`); the Android unreadable row keeps bare `UNAVAILABLE_TIME`; no epoch, schema version, props key or numeric value changed.
- Green: `yarn validate` 5451 passed, 5451 total; Statements 100% (5212/5212), Branches 100% (2246/2246), Functions 100% (1082/1082), Lines 100% (4669/4669); tsc and Biome exit 0 inside it. `widgetSnapshot`, `widgetContract` and `usePrayer` suites pass unchanged.
- Break script: `ALL AS EXPECTED: 1` (the wrap substituted back to raw values, widgetTimeline fails `Expected "١٧:٤٥"` / `Received "17:45"`, Time fails with `06:46` shown, restore passes 54/54 and 9/9).
- Version: 2.0.62 (origin/uat fetched under the version lock, still 2.0.56).
- Commit: `3354a2ce` (2.0.62; amended from `624bae7a` to fold the ledger fill in), hook green: `Tests: 5451 passed, 5451 total`; Statements 100% (5212/5212), Branches 100% (2246/2246), Functions 100% (1082/1082), Lines 100% (4669/4669).
- Review: read `git show` cold. Both production hunks match the contracts byte-for-byte; `getShownTime`'s only consumers are the `Time.tsx` render and the `=== null` comparison, so no stored-string comparison exists to break; the Android unreadable row keeps its bare `UNAVAILABLE_TIME`; no epoch, schema version or key changed. No findings.
- Merge: `2470a272` ("Merge feat/57-03b-shown-and-widget-bakes into uat: job 57 step 03b").

## Step 04: the pinned assertions and the records (resumed after A1)

- Branch: `feat/57-04-tests-records` off `uat` (the merge of step 03b). No anchors (records step).
- Red: recorded, not engineered, per the step's Red note. The two defect twins that exposed the census defect failed in the stopped run (`06:46`, `01:05` shown, preserved in the stop entry above) and are step 03b's proof now; this run re-applied the remaining six files' twins verbatim from `step04-stopped.patch` and each passed as engineered against the merged steps 01 to 03b (219 + 34 tests green on first run).
- Change: no production code. The six suites' twins, each named:
  - `components/countdown/__tests__/Countdown.test.tsx`: `counts down in native digits under ar` pins `٢س ٢٩د`.
  - `components/sheets/screens/__tests__/Sound.test.tsx`: `builds its rows with native digits under ar` pins `/^أذان [٠-٩]+$/` across every row.
  - `components/ui/__tests__/InitialWidthMeasurement.test.tsx`: `measures the widest ar label of each list and stores it under the ar width key` - the R7.1 width re-measure proof (the measure layer reads prayer names only; the ar width key is unchanged).
  - `shared/__tests__/time.test.ts`: `draws the negative, seconds-only, whole-minute and whole-hour branches under ar` (`٠ث`, `٤٥ث`, `١د`, `٢س`) and the `formatTimeAgo` native-digits describe (`٢د`, `١س`, `٢س ١د`, with the en twin `2h 1m`).
  - `shared/__tests__/widgetRenderer.test.ts`: `renders the derived v6 footer digits natively under an ar device locale` (`Rab ٣٠`) and `renders the v1 English fallback words with native digits under an ar device locale` (`١h ١٢m`).
  - `stores/__tests__/countdown.test.ts`: `display selector emits native digits under ar` pins `١س ١د`.
  Every en expectation in the six files stays byte-identical; no assertion loosened. Plus the records: the stopped entry's Merge line filled with `e827326d` (nothing else in it changed), step 03b's entry finalised above, and this entry.
- Green: `yarn validate` 5460 passed, 5460 total; Statements 100% (5212/5212), Branches 100% (2246/2246), Functions 100% (1082/1082), Lines 100% (4669/4669); `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0 inside it.
- Break script: none (records step, the house pattern for weight-1 records steps).
- Version: 2.0.63 (origin/uat fetched under the version lock, still 2.0.56).
- Commit: `c19192a2` (2.0.63), hook green: `Tests: 5460 passed, 5460 total`.
- Review: read `git show` cold. All six test files are pure additions: no en assertion changed bytes, none loosened. Census accounting: flipped or twinned across the steps - SoundItem, Alert and the widget ALabel in 03; notifications channel-name and the bridge in 02; the shared formatters in 01; Time and widgetSimulation in 03b; Countdown, Sound, the width proof, the time branches and formatTimeAgo, the widget v6 footer and v1 fallback, and the display selector here. Two census files need no twin because their pins assert bytes that stay frozen: `prayerIdContract.test.ts` pins the English catalog and source text (R1.2, R6.1), `widgetLockRenderer.test.ts` pins en renders of the baked props and the D58 native-timer sites. No findings.
- Merge: `4cab74a9` ("Merge feat/57-04-tests-records into uat: job 57 step 04").

## Records

The queue-row cell the lead applies on PASS (the plan's section 8 text, values
measured): "DONE 2026-10-12, audited: native numerals landed - ar draws Eastern
Arabic-Indic digits on every user-visible surface (D54, D57), the other five
locales byte-frozen Latin (D55, D56), the bridge and six point fixes covered,
the iOS native timers kept (D58); en bytes identical; the confidence build
carries the visual verification (D41)."

Measured at the final merge: versions 2.0.57 through 2.0.63 (amendment A1
documented at 2.0.61); last hook line `Tests: 5460 passed, 5460 total` with
Statements 100% (5212/5212), Branches 100% (2246/2246), Functions 100%
(1082/1082), Lines 100% (4669/4669); step merges `6e568825`, `3da75f88`,
`33defa40`, `e827326d` (the stopped records commit), `2470a272`, `4cab74a9`.
The step-04 stop preserved its sweep at
`~/athan-gitree/sessions/57/step04-stopped.patch`; its two defect twins landed
in step 03b, its remaining six in step 04. The evidence folder dies in the
audit merge with the plan folder.

session: ses_ed2386c07ffeOUx2G4edDf1ldL
