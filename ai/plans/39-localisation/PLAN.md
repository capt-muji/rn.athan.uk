# Job 39: the single-language overhaul, stage two (the six-language confidence build, inside release 2.0.0)

| Field | Value |
| --- | --- |
| Brief | `SINGLE-LANGUAGE-PIVOT.md` (governs), `OWNER-DECISIONS.md` D17 to D52, `RECONCILIATION.md` (the external adjudication), research R8 to R18 with correction banners |
| Planned at | `uat` `b0723e0d` (2.0.16), 2026-10-11 |
| Planned by | Planning session 2026-10-11 (frontier round 2: D51, D52) |
| Needs first | row 38 DONE, row 55 DONE (verified in the queue) |
| Parent | none |
| Group | notifications scheduling (`stores/notifications.ts`), shared with no other open row |
| Batch budget | 6 |
| Session budget | 12 |
| Steps | 16 (device steps 13, 14, 15 each dispatch alone) |
| Device | OnePlus 3T (`3T_SERIAL`), Android 9; iPhone XS (`IPHONE_UDID`) preferred wherever a choice exists (D38); one Android 15+ fleet phone (`S23_SERIAL`) for the tall-font checks (FONT-6) |
| Owner decisions still needed | None. The frontier closed 2026-10-11: D50, D51, D52 were the last three |

## 1. Goal

**What is wrong today:** stage one removed the Arabic surfaces and routed every string
through a typed English catalog, but the app still speaks exactly one language. The
language is hard-pinned (`CURRENT_LOCALE_ID = 'en'`), there is no Settings surface to
change it, notification and channel copy is frozen in English, dates format through
date-fns English tokens, widgets bake English into their props, and the native layer
(permissions, gallery names) holds English literals.

**What is true when DONE:** the app speaks six languages (en, ar, ms, so, hi, th, the
D20 confidence set). The active language follows the device locale until the user picks
one in Settings (D8, Q5); a switch re-renders the UI immediately, shows the in-sheet
blocking progress row (D51), and forward-only convergence re-arms notifications, renames
channels under their frozen ids, re-pushes widgets and stamps
`preference_language_last_armed` (D34, D45); a death mid-apply converges at the next
process start with never fewer alarms. Every user-visible string, date name and widget
label renders from the active catalog; the native layer follows the device language
(D43); the null-props widget card reads a static six-language table keyed by the widget
process's device locale (D44); the What's New entry ships translated (D48); the catalogs
are drafted (D42, `catalogs/*.json`, gates green) with every flagged fill recorded in
`catalogs/provenance.json` for the owner's confidence-build verification (D41).

**How the owner notices:** he switches languages on his phone and every surface follows:
list, sheets, notifications, widgets, the permission prompts. Nothing else changes: the
English bytes stay byte-identical, the layout stays LTR, identifiers and stored keys stay
frozen.

**Owner rules that apply (sources):** D17 to D52 (`OWNER-DECISIONS.md`); the hard rules
in `ai/AGENTS.md` (never substitute a prayer time; visuals settled and this plan's only
new visuals are the owner-ruled D8 globe row, the D51 progress row and the D52
placement; full coverage, red before green; version lockstep; comments explain why
only). The executor changes no pixel beyond those rulings.

## 2. Decisions

**2.1 Taken** (all in `OWNER-DECISIONS.md`, cited by number): D17 one language
everywhere; D19 2.0.0; D20 qibla sensors untouched; D21 Latin numerals; D22 audio
unchanged; D23 month names localise via catalog keys, formats unchanged (A2 mechanism);
D24 transliteration fills; D26 native picker names; D27 no İmsak; D31 left-align
everything; D32 the six-language confidence set (en ar ms so hi th); D33/D45 the two
storage keys as named; D34 forward-only convergence; D35 no keep-list additions; D39 row
55 ran first; D40 one job, one plan; D41 confidence build precedes public sizing; D42
planning drafts the catalogs, owner verifies; D43 native strings localise now; D44 the
null-props card reads the widget process's device locale; D46 expo-localization install
and app.json edits approved; D47 progress UI over convergence; D48 What's New now; D49
lock file yes, preview tier no; D50 the qibla place line stays as the geocoder returns
it; D51 the progress face is an in-sheet blocking row; D52 the Language row sits at the
top of the Display card. Facts settled this session: Android re-creating a channel under
the same id renames it while importance and sound stay frozen (developer.android.com,
notification channels page; verified 2026-10-11; a 3T `dumpsys notification` read rides
step 13); `expo.locales` reaches the widget target's resources
(`expo-widgets` reads `config.locales`, `withTargetXcodeProject.js:138`) and the Android
`Locales` config writes `res/values-b+<lang>/strings.xml`; `ios/` and `android/` are
gitignored prebuild output, so native localization must be config-driven (worker
verification, `.gitignore:13-14`).

**2.2 The executor must not decide.** Any output the plan does not predict: STOP and
ask. No stored key, OS identifier, channel id or audio slug changes a byte. The
`preference_language_last_armed` stamp writes only the active locale after a full
convergence pass. No catalog value changes beyond `catalogs/*.json` verbatim; a
translation defect is a STOP, never an in-flight edit. If the 3T channel-rename read
disagrees with the documented rename behaviour, STOP (the fallback design, locale-keyed
channel ids, is the owner's to order, not the executor's). The widget-runtime locale
patch must not grow: one global, both platforms, nothing else.

## 3. Pre-flight

`scripts/preflight-39.sh` in this folder. The executor saves a copy to `$TMPDIR`, runs
it from there. It checks: the checkout is on `uat`, a clean tree, `origin/uat` fetched
and merged, the version not lower than 2.0.16, rows 38 and 55 DONE in the queue, every
anchor under `scripts/anchors/` counts exactly 1 (python count, never `grep -c`), the
catalog files exist and `node scripts/gate-catalogs.mjs` (copied beside the preflight)
prints `CATALOG GATES OK`. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Read in full before step 1: `SINGLE-LANGUAGE-PIVOT.md`, `RECONCILIATION.md`,
`OWNER-DECISIONS.md` D17 to D52, `research/R8-FIRST-RUN-LOCALE.md`,
`research/R10-RTL-PINNING.md`, `research/R11-LANGUAGE-COMMIT.md` (superseded in part by
D34: its rollback layers are dead, its lock-and-arm sequencing is not),
`research/R13-BLAST-RADIUS.md`, `__tests__/README.md`, and this folder's
`catalogs/provenance.json`.

The code map, one line per file (anchors under `scripts/anchors/` carry the verbatim
regions):

- `shared/i18n/index.ts` — `t()`, `prayerLabel`, `CURRENT_LOCALE_ID = 'en'` (the pin this
  job removes). `t()` throws on a missing parameter; parameters are typed per key.
- `shared/i18n/loader.ts` — the one-module indirection (ARCH-17): `require('./en')`
  captured once. This job rewrites its body; no call site moves.
- `shared/i18n/en.ts` — 157 keys, `as const satisfies Record<string, string>`,
  `TranslationKey`, `Catalog`, `PRAYER_LABELS` resolved from the catalog's own members.
- `shared/i18n/dist/en.json` — the bridge export (`yarn i18n:export`), key truth.
- `shared/__tests__/i18nBridge.test.ts` — export/import modes via `I18N_BRIDGE`; the
  import mode asserts round-trip identity against `en` only (step 02 extends it per
  locale).
- `stores/ui.ts` — width atoms keyed `prayer_max_english_width_${CURRENT_LOCALE_ID}_...`,
  legacy-key seed at module evaluation, widen-only writes.
- `components/ui/InitialWidthMeasurement.tsx` — hidden Texts measure the longest name per
  schedule; the pick reads `getLongestPrayerNameIndex` (English lengths; step 03 makes it
  catalog-driven).
- `components/sheets/screens/Settings.tsx` — the Display card (D52 placement), the
  athan-row construction the Language row copies.
- `components/sheets/parts/Sheet.tsx` — sheet machinery (setRef, title, subtitle, icon,
  snapPoints, perfName, onFirstPresent).
- `components/sheets/screens/Sound.tsx` — the draft/commit-on-dismiss pattern and the
  `sheet.closeToSave` subtitle; the language sheet commits on pick instead (D47).
- `stores/notifications.ts` — the scheduling queue (`withSchedulingLock`, sequential,
  never dropped), `_rescheduleAllNotifications({deferWidgetRefresh})` (arms at-time +
  reminders for both schedules, budget 64), the refresh gate atom (2 h), row 55's
  keep-alive (`scheduleReminderNotificationForDate`, `REMINDER_BUFFER_SECONDS` 30: a
  reminder inside its final 30 seconds stays armed, its identifier lands in
  `attemptedIds`, its record survives the stale-cancel), `commitSoundSelection` (the
  lock-and-arm shape the language commit copies, minus its rollback layer: D34).
- `shared/notifications.ts` — channel ids (frozen: `athan_${n}_v4`,
  `reminder_${slug}_${n}_v3`, `extras_at_time_v3`), channel names via `t()` except the
  reminder channel's template literal (step 05 moves it to `channel.reminder`), the
  module-level dedup caches (`createdReminderChannels`, `createdAthanChannels`,
  `extrasChannelCreated`) a locale switch must reset, `genNotificationContent` (already
  `t()`-driven: copy freezes at schedule time, which is why a switch re-arms).
- `device/notifications.ts` — `updateAndroidChannel` (same-id re-creation, the rename
  path), arming calls.
- `device/listeners.ts` — the AppState foreground branch that hosts the convergence
  check.
- `app/index.tsx` — launch sequence, the 1.5 s init timeout, the What's New gate, the
  root the remount key lands on.
- `app/_layout.tsx` — `stores/bootstrap` hydrates before first render (the locale
  resolution point), `preventAutoHideAsync`.
- `shared/time.ts` — `formatDateLong` (date-fns `'EEE, d MMM yyyy'`, en-US),
  `formatHijriDateLong` (Intl en-US islamic, strips `' AH'`), `durationLabels()`
  (already call-time `t()`).
- `components/day/shownDate.ts`, `components/day/Day.tsx` — the list date header.
- `shared/widgetTimeline.ts` — `formatDateLabel`, `widgetStrings()` (snapshot v2 bakes
  `duration.*` and `widget.*`), rows carry `prayerLabel`.
- `shared/widgetTypes.ts` — `WIDGET_PROPS_VERSION = 6`, `ANDROID_SNAPSHOT_VERSION = 2`,
  old-entry tolerance patterns to copy for v7.
- `widgets/PrayerWidget.tsx` — the two English-shape date parsers (Android footer, iOS
  footer), the null-props neutral literals, the Android v1 strings fallback.
- `widgets/LockPrayerWidget.tsx` — three layout functions, each with a neutral block
  (identical triples; step 08 extracts one shared helper).
- `node_modules/expo-widgets` (58.0.14, patched at `patches/expo-widgets+58.0.14.patch`)
  — the plugin writes `ios/ExpoWidgetsTarget/*.swift` on every prebuild (hand edits do
  not survive); `withTargetXcodeProject.js:138` reads `config.locales`;
  `WidgetsJSRuntime.swift` (iOS, JSContext) and `WidgetsHermesRuntime.cpp` (Android,
  `rt.global().setProperty`) are the two `__expoWidgetDeviceLocale` injection points.
- `app.json` — `ios.infoPlist` (the two permission strings), the plugins array
  (expo-localization joins it), the expo-widgets block (gallery displayName/description
  sources), `expo.locales` (new).
- `app.config.ts` — widget env gates (`EXPO_PUBLIC_ANDROID_WIDGETS`,
  `EXPO_PUBLIC_IOS_WIDGETS`); build scripts set them.
- `shared/qiblaCompass.ts` — `CARDINALS` literals (step 10 catalogises them). Qibla
  sensors and math untouched (D20); the place line untouched (D50).
- `shared/whatsNew.ts` — the archive, `VISIBLE_WHATS_NEW` (module-scope `t()` capture,
  step 03 converts), the version-equality gate.
- `scripts/scan-strings.mjs` + `shared/__tests__/stringGuard.test.ts` — the guard with a
  zero-length allowlist; the data-modules rule (step 04 adds the language-names table's
  module to `DATA_MODULES`).
- `e2e/flows/*.yaml` — the six flows assert English on an English device (unchanged);
  step 12 adds the switch flow.

Why the obvious fix is wrong: swapping `CURRENT_LOCALE_ID` for a variable alone leaves
the module-scope `t()` captures (Alert options, reminder options, help labels,
`VISIBLE_WHATS_NEW`) rendering the old locale forever; re-arming without resetting the
channel dedup caches renames nothing (the caches skip re-creation); parsing localized
date labels with `split(',')`/`slice(0, 3)` breaks on Arabic and Thai weekdays;
editing `ios/ExpoWidgetsTarget/*.swift` by hand dies at the next prebuild; wiping
`preference_language` on upgrade contradicts the stage-one stamp; and a rollback layer
in the switch (R11's design) contradicts D34.

## 5. Design

**Invariant (one sentence a test can check):** after every step, an English-locale
device renders byte-identical output to 2.0.16, every stored key, OS identifier, channel
id and audio slug is byte-frozen, and in every locale every user-visible string resolves
through the active catalog.

**The approach:** resolve the locale before first paint and keep the catalog behind the
loader indirection; land the five drafted catalogs as data with the gates and the lock
file; switch the loader and fix the four module-scope captures and the width pick; build
the Settings row, the sheet and the in-sheet progress; converge surfaces forward-only at
commit, launch and foreground through the proven reschedule driver; localise dates
through catalog-composed formatters; structure the widget date props and localise the
widget statics through a one-global runtime patch; drive every native string from
committed config; prove on the 3T, the XS and an Android 15+ phone.

**Alternatives rejected:** per-component locale subscriptions (invasive; one remount key
at the root achieves the re-render); atomWithStorage for the active locale (the stored
key is the nullable preference, the derived value is memory); locale-keyed channel ids
as the primary design (breaks the frozen ids the row 38 contract test pins; the
documented same-id rename makes it unnecessary; it remains the named STOP fallback if
the 3T read disagrees); `Intl`-swapped date formatting (Hermes ICU gaps, era and order
changes, A2); editing generated native files (prebuild clobbers them); translating the
historical What's New archive (no installer at 2.0.0 can render it; English bytes stand
in, recorded in provenance); delivery-time notification localisation (frozen at schedule
time on both platforms, R4/repo law; the re-arm is the mechanism).

**Concurrency trace:** the language commit runs inside `withSchedulingLock` like
`commitSoundSelection`, so it serialises with every scheduling operation and no
convergence pass races an in-flight reschedule; the keep-alive guard runs inside the
re-arm pass (row 55's suites prove an imminent reminder survives); the width seed reads
the locale synchronously at module evaluation before any atom exists over the new keys
(the row 38 ordering hazard, now locale-aware); the catalog require happens once per
process at loader evaluation, before first paint, beside the bootstrap hydration.

**Design review:** the pivot synthesis, the four external branches (RECONCILIATION.md),
row 38's three-reviewer audit (its five carried inputs are steps 03 and 04 here), and
this session's griller pass.

### Acceptance criteria (EARS)

- [R1.1] IF no explicit language choice is stored WHEN the app starts THE SYSTEM SHALL derive the active language by RFC 4647 lookup over `expo-localization`'s `getLocales()` against the six shipped locales, falling back to `en`
- [R1.2] WHEN a language is picked in Settings THE SYSTEM SHALL persist it under `preference_language` and it shall win over the device locale thereafter
- [R1.3] WHEN any user-visible string renders THE SYSTEM SHALL resolve it through the active locale's catalog with no runtime fallback to English
- [R2.1] WHILE the six catalogs ship THE SYSTEM SHALL hold every `TranslationKey` in every locale's catalog, pinned by `satisfies Catalog`
- [R2.2] WHEN the catalogs are gated THE SYSTEM SHALL pass the committed gate script (key parity, placeholder parity, padding, paragraph breaks, brand bytes, glossary, length, bidi, echo) with `CATALOG GATES OK`
- [R2.3] WHEN the English source a locale was translated against changes THE SYSTEM SHALL fail the catalog lock suite until the lock is re-taken
- [R3.1] WHEN a language is picked THE SYSTEM SHALL re-render the whole UI in the new language before any surface re-arms
- [R3.2] WHILE the switch applies THE SYSTEM SHALL show the in-sheet blocking progress row and accept no other input in the sheet
- [R3.3] WHEN the switch's surfaces finish THE SYSTEM SHALL dismiss the language sheet
- [R3.4] WHEN a switch dies mid-apply THE SYSTEM SHALL converge the remaining surfaces at the next process start with never fewer alarms
- [R4.1] WHEN the active language differs from `preference_language_last_armed` at launch or foreground THE SYSTEM SHALL re-arm notifications, rename channels and re-push widgets, then stamp the key
- [R4.2] WHEN a convergence pass runs THE SYSTEM SHALL keep an armed reminder inside its final 30 seconds armed (row 55's keep-alive)
- [R4.3] WHEN channels are re-created under their frozen ids THE SYSTEM SHALL carry names from the active catalog
- [R5.1] WHEN the prayer list measures its name column THE SYSTEM SHALL pick the widest row by the active locale's rendered labels and store it under the active locale's width key
- [R5.2] WHEN the locale switches THE SYSTEM SHALL reflow the name column once against the new locale's width key
- [R5.3] WHEN any screen renders in any of the six locales THE SYSTEM SHALL keep layout LTR and left-aligned exactly as English, with `supportsRTL: false` pinned natively
- [R6.1] WHEN a date label renders THE SYSTEM SHALL compose it from the active catalog's calendar keys in the English shape and order, byte-identical for `en`
- [R6.2] WHEN the Hijri date renders THE SYSTEM SHALL compose its month name from the catalog with Latin digits and no era affix
- [R7.1] WHEN widget props are written THE SYSTEM SHALL version the payload at 7 and carry structured localized date parts, tolerating v6 entries
- [R7.2] WHEN a widget renders with absent props THE SYSTEM SHALL draw its neutral card from the static six-language table keyed by the widget process's device locale
- [R7.3] WHEN the widget gallery lists a widget THE SYSTEM SHALL show its displayName and description in the device language on both platforms
- [R8.1] WHEN the OS prompts for a permission THE SYSTEM SHALL show the purpose string in the device language
- [R8.2] WHEN prebuild regenerates the native folders THE SYSTEM SHALL reproduce every localized native resource from committed config
- [R9.1] WHEN a notification is armed THE SYSTEM SHALL freeze its title in the active language at schedule time
- [R9.2] WHEN a reminder title or channel name builds THE SYSTEM SHALL resolve every word through the catalog
- [R10.1] WHEN the release carrying the language feature runs THE SYSTEM SHALL show its translated What's New entry for that version
- [R11.1] WHEN the 3T runs the production build THE SYSTEM SHALL show unchanged armed identifiers in `dumpsys alarm` and channel names matching the active catalog in `dumpsys notification`
- [R11.2] WHEN the iPhone XS launches with an Arabic device locale THE SYSTEM SHALL pin LTR on the first frame and keep widget direction correct
- [R11.3] WHEN an Android 15+ fleet phone renders Arabic, Devanagari and Thai THE SYSTEM SHALL draw the tall font variants without clipping
- [R12.1] WHEN the language switch flow runs on the 3T THE SYSTEM SHALL switch to Arabic, render the list in Arabic, and switch back to English

## 6. Steps (checklist; each step is a file under `steps/`)

1. `01-locale-core.md` — expo-localization install, RTL pin, `shared/i18n/locale.ts`,
   resolution tests. No behavior change on an English device.
2. `02-catalogs-land.md` — the five catalogs from `catalogs/*.json`, the 40 new en keys,
   the gates suite, the lock file.
3. `03-loader-switch.md` — runtime catalog pick, the remount key, the four module-scope
   captures, the catalog-driven width pick.
4. `04-language-sheet.md` — the D52 Settings row, the language sheet, the native-names
   table, the D51 progress row, `preference_language`.
5. `05-convergence.md` — `commitLanguageSelection`, launch/foreground reconciliation,
   channel cache resets, `channel.reminder`, the last-armed stamp.
6. `06-dates.md` — catalog-composed Gregorian and Hijri labels, list header, widget
   labels, en parity.
7. `07-widget-props-v7.md` — structured date parts, parser replacement, tolerance.
8. `08-widget-statics.md` — the `__expoWidgetDeviceLocale` patch, the static tables, the
   three lock layouts plus the home neutral.
9. `09-native-strings.md` — `expo.locales`, plugin entries, locale filters, prebuild
   verification.
10. `10-residual-literals.md` — the qibla cardinals, the census re-run at zero.
11. `11-whatsnew.md` — the translated entry at the landing version.
12. `12-maestro-flow.md` — `e2e/flows/language-switch-x1.yaml`.
13. `13-device-3t.md` — production build: identifiers, channel rename, Arabic re-arm,
    the D36 require-timing re-run over six catalogs.
14. `14-device-xs.md` — Arabic launcher: first-frame LTR, widget direction, six scripts.
15. `15-device-android15.md` — tall-font variants on the Android 15+ fleet phone.
16. `16-records.md` — LOG and queue records, scratch cleanup.

Step contracts, red tests, break scripts, commit messages and review checklists:
`steps/*.md`. Anchors: `scripts/anchors/`. Catalogs: `catalogs/*.json` with
`catalogs/provenance.json`.

## 7. Device proof

The 3T (step 13, `build-prod.zsh`, never two builds at once): `dumpsys alarm` before and
after a switch shows the same armed identifiers (byte-compare); `dumpsys notification`
shows the re-created channel names in the active catalog language under the frozen ids;
the list, sheets and notifications render Arabic after the switch; the monitor release
build's `catalog_require_*` pair decides TS-require versus `JSON.parse` under the D36
5 ms rule with six catalogs in the bundle. The XS (step 14): Arabic device locale,
first frame LTR (no mirror), lock and home widgets draw Arabic with left-anchored
layout, the permission prompt reads Arabic. The Android 15+ phone (step 15): Arabic,
Devanagari and Thai render tall variants without clipping on the list, the sheets and
the widgets. Evidence lands under `$HOME/athan-gitree/sessions/39/`. Clock rules, alarm
dumps before any clock change, and the atlas rules follow `ai/AGENTS.md`; coordinates
live in the device atlases, never here.

## 8. Records

`LOG.md` gains each step's entry as it lands (the executor's ledger). The queue-row cell
the lead applies on PASS: "DONE 2026-<date>, audited: the six-language confidence build
landed on uat (en ar ms so hi th); runtime locale resolution with the device-locale
default, the Settings language row and sheet with the in-sheet progress face,
forward-only convergence over notifications, channels and widgets with the last-armed
stamp, catalog-composed dates, widget props v7 with structured date parts, the
widget-runtime locale patch, per-locale native strings from committed config, the
catalog gates and lock file; English bytes and every frozen identifier unchanged;
device-proven on the 3T, the XS and an Android 15+ phone; the owner's string
verification list is `catalogs/provenance.json`." Docs commit: `<VERSION> - docs(plans):
job 39 executed: <one line>`. The plan folder, the evidence under
`$HOME/athan-gitree/sessions/39/` and `ai/plans/SDK58-PROGRAMME.md` section D4 die in
the audit merge per the repo rule; the queue row keeps the summary.

## 9. Push

None. The executor never pushes; the audit session pushes after PASS.

## 10. When something goes wrong

| Symptom | Response |
| --- | --- |
| Any anchor count other than 1 | NEEDS REPLAN |
| A test failing that the step did not name | STOP |
| The 3T channel read shows no rename under the same id | STOP: the locale-keyed channel-id fallback is the owner's order |
| The gates script fails after a catalog edit | STOP: the catalogs are planned artefacts, not executor edits |
| `widgetRuntimeLoads` fails after the install | `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile`, retry once, then STOP (VERSIONS.md C3) |
| `versionLockstep` fails at commit time | Align the gitignored `android/app/build.gradle` before committing |
| The hook's `audioMatrix` timeout | Wait for load average below 8, retry (three tries) |
| A widget emulator or closure walk fails after the patch | Revert the patch file only, STOP: the patch is planned artefact |
| The XS first frame mirrors under Arabic | STOP: the RTL pin failed natively; do not JS-patch it (R10) |

Per-step restore lists live in each step file.

## 11. Subagents

Planning used `explore` workers for fact packs; delivery is the lead's `athan-executor`
and `athan-reviewer` dispatches per the workflow. Workers may call `vision` for images
the reader cannot see.

## 12. Report to the owner

Plain sentences: six languages live end to end, what each device proved, the flagged
fills awaiting the owner's eye in `catalogs/provenance.json`, and the confidence-build
verification D41 asks for. Progress table. The four-line handoff.

## Resume from

PLAN.md sections 1 to 12 are drafted; anchors extracted and verified (42, all count 1);
catalogs drafted and gated. NEXT: write the 16 step files under `steps/`, then
`scripts/preflight-39.sh`, then the griller pass, then `bash scripts/check-plan.sh
ai/plans/39-localisation` until `PLAN OK`, then the finish per section 8 of the planner
skill (row READY, docs commit, merge, push). The step contracts draw on the worker fact
packs recorded in this session's conversation; the load-bearing ones are already quoted
in section 4 with anchors.
