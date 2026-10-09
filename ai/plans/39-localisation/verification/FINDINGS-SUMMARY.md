# Findings summary: independent verification of the session 39 localisation record

| Field | Value |
| --- | --- |
| Base | `uat` `52109ec0` (1.29.303) |
| Date | 2026-10-09 |
| Branch | `verify/39-localisation-20261009` |
| Scope | Documents only. No code, plan or research file is changed. Nothing ran on a device. |
| Result | 129 findings: 61 confirmed, 54 contradicted, 14 uncertain |
| Contradictions by severity | 1 BLOCKER, 27 MAJOR, 26 MINOR |

## How this was done

Seven verification passes ran in parallel, one per theme, with no access to the planning session.
Each read the record and the code directly at `52109ec0` and wrote one file in this folder. A
coordinating pass then re-read the cited lines for the blocker and for most major contradictions
before listing them here. The "Re-checked" column says which: **yes** means the coordinating pass
read the cited code or record lines itself, **part** means it confirmed the code facts and took a
measurement or a library-source read from the theme pass, **no** means the entry rests on the theme
pass alone.

No source or test file differs between the record's shas (`5ad6aaba`, `500e5037`) and `52109ec0`.
Only the version lines moved. So no mismatch below is drift.

Severity: `BLOCKER` means the plan as written ships a defect. `MAJOR` means the plan must change
before execution. `MINOR` means a count, a citation or a sentence is wrong and the design stands.

## The seven claims, one line each

| # | Claim | Verdict | File |
| --- | --- | --- | --- |
| 1 | No bundled fonts for Arabic, Devanagari or Thai | **Holds for those three scripts.** The supporting argument does not: wrong OS floors, no account of Android 15 and later, a line-height premise that is not in the code, and "ever" fails for Hausa, Uzbek and Yoruba on iOS | `01-FONTS.md` |
| 2 | Space-form slug union for the prayer identifier | **The choice holds.** Its stated reason is false for store installs, two of its migration steps conflict, and its freeze gate misses stored families | `02-IDENTIFIERS.md` |
| 3 | No wipe, no schema bump, three guarded migrations | **Holds for installs that carry the schema marker.** The published store build gets a wipe from existing code, the `en` stamp guard pins every fresh install to English, and the widget stores change shape | `03-UPGRADE.md` |
| 4 | All-or-nothing language commit with no zero-alarm window | **The core holds:** in-place replace, no cancel pass, never fewer alarms. The rollback layer and the picker-only marker do not | `04-TRANSACTION.md` |
| 5 | Hand-rolled typed catalogs, `t()`, a JSON bridge, no library | **The central choice holds at six languages.** Six major gaps sit in what the design leaves outside `t()`: dates, widget text, native strings, the string count, the guard and the bridge format | `05-ARCHITECTURE.md` |
| 6 | LTR pin through the `expo-localization` plugin | **The plugin behaves as claimed on Android and is the right mechanism.** It cannot reach the Android widget, and on iOS left alignment needs a step the plan lacks | `06-RTL.md` |
| 7 | R13 and R14 counts as the execution map | **The `file:line` map is accurate (207 of 208).** The counts are not: the string census overcounts and undercounts, the suite census is short, and the plan's anchors do not exist | `07-BLAST-RADIUS-AND-TEST-CENSUS.md` |

## Contradictions

### BLOCKER

| Id | Contradiction | Key evidence | The plan must | Re-checked |
| --- | --- | --- | --- | --- |
| UPG-2 | The `en` stamp is guarded by key absence alone, so it stamps every fresh install too. First-run device-locale following (Q5, D33) never works. A fresh install on its second launch and an upgrade killed after the version write hold identical keys and need opposite answers | `research/R18-UPGRADE-PATH.md` step 5 and crash row 4. `stores/version.ts:269`, `:279`, `:289` | Gate the stamp on the stored version captured before it is overwritten (present and below `2.0.0`), and write the stamp before `setStoredVersion`. Add a nullable string atom factory | yes |

### MAJOR

| Id | Contradiction | Key evidence | The plan must | Re-checked |
| --- | --- | --- | --- | --- |
| UPG-1, ID-4 | The space-form bytes are not on disk for store installs, and "no wipe" is false for them. The App Store serves 1.5.1 (2026-02-16). That build holds index-keyed preferences, OS-assigned identifiers and no schema marker. A missing marker forces the existing wipe | `stores/version.ts:166-173`, `:258-260`. Marker first appears in `5da7be0a` (1.24.33). Name keys and deterministic identifiers arrive in `9681e866`. `device/updates.ts:15` | Name both populations. Give the upgrade suites a pre-marker fixture. Pin the index-to-name map in the freeze table. Prove the upgrade on a phone over the store build, not only over 1.29.x | yes |
| UPG-3 | R18's ordering proof assumes an absent language key renders `en`. D33 makes it "follow the device". The stamp runs inside `handleAppUpgrade`, after module evaluation and the first reads | `research/R18-UPGRADE-PATH.md` ordering proof. `stores/bootstrap.ts:60-64` | Move the stamp to module evaluation, beside the width seed and above the atom. Rewrite the crash-window table for that order | yes |
| UPG-4 | The widget stores are a stored family that changes shape (steps 10 and 13), and R18's family table omits them. Both version constants say to bump on a shape change. No layout reads the version | `shared/widgetTypes.ts:10-21`. `shared/widgetTimeline.ts:185`, `:244`, `:315` write `v`, nothing under `widgets/` reads it | Bump both versions in step 13, make layouts tolerate old entries, key rows by index or `id ?? name` | yes |
| ID-5 | R15 step 5 deletes `PRAYERS_ENGLISH` and `EXTRAS_ENGLISH`. Step 6 leaves the migration alone. The migration reads both arrays. A naive swap compiles and deletes pre-1.0.27 extras settings. An existing test catches it, so the executor stops on a failure no step names | `stores/notifications.ts:552`, `:557-558`, `:567`, `:589-590` | Specify the migration edit line by line in step 5 | yes |
| ID-6 | The freeze table pins four families. Two more embed the vocabulary through position: the bookkeeping keys carry the canonical index. Array order is never stated, and its only test pins an array step 5 removes. A reordered array makes one prayer cancel another's alarms | `stores/database.ts:193`, `:258`. `research/R15-IDENTIFIER-DESIGN.md` section (c) | Add to the freeze table: the order of both id arrays, one bookkeeping key per family, the daily-prayer truth table, the legacy channel ids, and the `en` reminder channel name (UPG-5) | part |
| ID-7 | Three type-safety claims fail as written. The cast at `shared/prayer.ts:407` does not delete itself, because the branch is a conjunction with the schedule type. `any` from `JSON.parse` passes into a `PrayerId` parameter. The loading sentinel's replacement is unspecified | `shared/prayer.ts:398-407`. `stores/database.ts:42-48`. `hooks/usePrayer.ts:90-92` | Specify the rewritten branch, type the record reader, and define the loading row | part |
| TXN-8 | In `commitSoundSelection`, the model being copied, a refused or timed-out request is not a failure. Refusals become repair marks and the commit returns true. The rollback runs only on a throw, which the suite proves for a refused channel only. So D28's failure face almost never shows | `stores/notifications.ts:871-881`, `:1605-1610`, `:1720`, `:1725-1726`. `stores/__tests__/notificationSoundCommit.test.ts:128-158` | Define failure before the step files: count refusals as failure (ask-first scheduling logic), or state that refusals finish forward through repair marks | yes |
| TXN-9 | The language can change with no commit. A null preference re-derives from the device locale. Nothing then re-arms on iOS: the cold-launch gate reopen is Android only and the 2 hour gate skips | `stores/notifications.ts:1787-1788`, `:1794-1800`. Pivot synthesis finding 8 | Re-arm whenever the language in force differs from the language last armed, at launch and on foreground | yes |
| TXN-10 | D18 as worded cannot be met for OS-held state. Up to 64 separate native calls, and every repair path needs a running process. R11 itself concedes mixed copy after a mid-batch death | `research/R11-LANGUAGE-COMMIT.md:82-85`. `stores/notifications.ts:926-930` | Restate the guarantee the design delivers (never fewer alarms, mixed copy bounded by the next process start) and take it to the owner | yes |
| TXN-11 | The record does not say which way a surviving marker completes. After a double failure, completing toward the marker's target flips the app to the language the user was told had failed | `research/R11-LANGUAGE-COMMIT.md` section B row 1 against section B's stored-language sentence and step 10 | Pin one rule: repair converges on the stored preference, the marker is a dirty flag | yes |
| ARCH-2 | `Intl.DisplayNames` cannot localise the qibla place name. Hermes does not ship it, it names codes not cities, and the geocoder takes no locale | `shared/qiblaPlace.ts:11-17`, `:46`. Hermes `Intl.cpp` at the pinned tag registers three constructors only | Rewrite pivot finding 23d. The owner rules the place line a named exception to D17 or hides it when the languages differ | part |
| ARCH-3 | Month names are not "the existing formatter with the locale tag swapped". The Gregorian label is `date-fns`, not `Intl`. No Somali `date-fns` locale exists. A tag swap changes order and era affix, and gives Thai a Buddhist-era year. Two widget parsers assume the English shape. Pivot code fact 6 is wrong for Gregorian | `shared/time.ts:232`, `:243`, `:250`. `widgets/PrayerWidget.tsx:303-310`, `:545-555` | Replace the step before stage two is written. Preferred: month and weekday names as catalog keys | yes |
| ARCH-5, CNT-4, CNT-5 | The string count and the planned guard share one blind spot. The regex sees only quoted capitalised literals. At least 29 of the 123 "display copy" rows are not copy, and 14 of the 25 "widget copy" rows are widget kind ids. At least 90 visible source sites and 31 `app.json` values sit outside the 205 | `scripts/inventory-strings.py:10`. `components/ui/Error.tsx:37-42`. `widgets/PrayerWidget.tsx:769-776` | Recount with a scan that sees JSX text and template literals. Stop quoting 123 and 25 as work counts | yes |
| CNT-6 | Step 14's zero-exclusion scan is not achievable as described. A literal scan flags 330 code literals. A context scan cannot see copy in data modules | `PLAN.md` step 14. `shared/help.ts` | Specify the guard as two parts: a context-scoped AST scan, and a rule that the named data modules export catalog keys only | no |
| ARCH-9 | Baked props do not reach every string a widget draws. Null-props cards draw literals. Android computes its countdown units at render time inside the widget | `widgets/PrayerWidget.tsx:292-299`, `:520-525` | Make unit suffixes and stale or neutral strings props, with a version bump. The owner rules on the null-props cards | yes |
| ARCH-10 | Native strings have no step, and some have no mechanism: the app name, two permission purpose strings and 28 widget gallery strings. They follow the OS language, never the in-app choice. The Android widget plugin writes no per-locale strings | `app.json:23-25`, `:204-379`. `PLAN.md` section 6 | Add a native-strings step and a ruling that these follow the device language | yes |
| ARCH-14 | The bridge targets i18next JSON, which uses `{{x}}`, reserved key suffixes and nesting. The catalog uses `{name}`. The record's own fifty-locale destination, Lingui, uses PO with ICU, which `{name}` already satisfies | `research/R16-ARCHITECTURE.md` (d) item 1 and (b). `SPIKE-EVIDENCE.md` | Change forced change 1 before step 7: flat key-value JSON with `{name}`, which is the catalog itself | part |
| FONT-5 | The configured floors are API 24 and iOS 16.4, not Android 9 and iOS 18. Fallback line spacing is API 28 and later only | `app.json:53`. `node_modules/react-native/gradle/libs.versions.toml:3-4` | Name the real minimums. Raise `minSdkVersion` to 28 or add a check on an older image | yes |
| FONT-6 | The app targets SDK 36. Android 15 and later draw the tall font variants that the Android 9 phone never draws (Naskh 1.703em against 1.362em). The record never mentions it. A proof on the Android 9 phone alone does not hold on a current phone | Target SDK as above. Android 15 and 16 behaviour-change pages | Add an Android 15 or later phone to every per-script check | part |
| FONT-12 | "Never bundle" fails for Latin-script roadmap languages on iOS. The bundled Roboto lacks the Hausa hooked letters, Uzbek U+02BB and Yoruba dot-below letters. They draw mid-word in another face. Not a milestone issue | cmap parse of `assets/fonts/Roboto-Regular.ttf` | Replace the bundled pair before Hausa, Uzbek or Yoruba ship | no |
| RTL-13 | The pin cannot reach the Android home-screen widget. Remote views resolve RTL support from the launcher's application info. Widget rows are start and end relative. The record has no widget direction mechanism or check | `widgets/PrayerWidget.tsx:437-444`. Android SDK `RemoteViews.java:899-939`, `View.java:22451-22453` | Add a device check on an Arabic-language launcher. Build nothing before it | no |
| CNT-7 | R14's own table lists 85 affected suites, not 74, and at least 5 more are missing | `research/R14-TEST-CENSUS.md` lines 16-100 | Regenerate R14 from written patterns and name suites from it, because the plan stops the executor on any unnamed failing test | yes |
| CNT-11 | None of the plan's anchors exists: no `scripts/preflight-38.sh`, no `scripts/anchors/`, no `steps/` | `PLAN.md` sections 3, 4 and 6 | Reword to future tense or write the artefacts | yes |
| CNT-12 | R13 misses the sites where the name travels under another identifier: the countdown name slot and its sentinel (a sixth silent seam), the plan key, and the widget unit formatter | `stores/countdown.ts:423`. `components/countdown/Countdown.tsx:46-47`. `shared/notifications.ts:252-253` | Add these sites to the map before steps 5, 6, 10 and 13 are written | yes |

### MINOR

| Id | Contradiction | Re-checked |
| --- | --- | --- |
| FONT-7 | The "18px on a 22px line, 1.22em" premise is not in the code. The size-18 texts set no `lineHeight` (`components/prayer/Prayer.tsx:106-109`). The tightest box is 1.333em | yes |
| FONT-8 | 1.70em and 1.4em describe two different Arabic faces, and neither is a clipping floor. The record's unvocalised Arabic names ink at most 1.13em | no |
| FONT-9 | A 2.5em Nastaliq line at 18px is 45px, inside the 57px row. The rejection of a Nastaliq bundle stands on taste and bytes | yes |
| FONT-11 | Fallback glyphs lose the Medium weight for Arabic and Thai on both platforms. Titles draw at body weight | no |
| FONT-15 | The countdown name sets no `fontFamily` (`components/countdown/Countdown.tsx:63-72`), so on iOS it draws in a different Arabic face from the rows | yes |
| FONT-16 | The compass letters are SVG text. On Android a label of two or more joining Arabic letters draws as isolated letters | no |
| ID-8, CNT-13 | "27 MMKV preference keys" matches no measurement. The cited script prints 8 sites. The distinct keys number 66 | yes |
| UPG-5 | The freeze gate does not pin the index-keyed record family or the reminder channel name. Same root as ID-6 | part |
| UPG-6 | Four slips in R18's text: `Database.remove` is `removeItem`, width values are strings on disk, a line citation, and a stale atom default | no |
| TXN-12 | The widget re-push runs after the lock releases, and its errors are swallowed (`stores/notifications.ts:1646-1658`) | yes |
| TXN-14 | The set of channels to rename is unspecified. Channels are created only for armed Sound alerts, so unused ones keep old names (`device/notifications.ts:106-113`) | yes |
| ARCH-6 | 27 user-visible template literals in 9 files, 17 of them count-bearing, against the record's "complete list" of five. A plural guard keyed on syntax cannot fire | part |
| ARCH-13 | The specified `t()` leaves compile-time completeness and typed parameters unused, and keeps an English fallback that D17 and D24 rule out | no |
| ARCH-16 | D1 and D2 as worded do not describe in-tree TypeScript catalogs, and neither carries a supersede banner | yes |
| ARCH-17 | The pre-flight that can change the catalog format is step 15, after steps 6 to 10 are built on that format | yes |
| ARCH-18 | R5 states that Hermes ships `Intl.PluralRules` on Android. It does not | part |
| RTL-4 | On iOS the value is not applied "before React loads". The first frame is still LTR, by an ordering inside React Native. One iOS first-launch device proof is needed | no |
| RTL-10 | The base direction of a `Text` paragraph is first-strong on both platforms, not LTR. The two failure examples in `R3-FINDINGS.md` do not occur. The real hazard is a Latin-led string in an RTL locale | no |
| RTL-17 | The same plugin call also appends `locale|layoutDirection` to the activity's `configChanges`, writes `resourceConfigurations` into `build.gradle`, and adds a runtime dependency | no |
| CNT-8 | There are 189 suites, not 171, at every sha the record names | yes |
| CNT-9 | The commit-signature set is six suites, not eight, and a different six: one is outside R14's eight, and three of the eight call neither function | no |
| CNT-10 | The "five largest refactors" figures cannot be reproduced and the order differs | no |
| CNT-14 | Pivot code fact 9 says the stored day rows carry name fields. They do not (`shared/types.ts:108-122`) | yes |
| CNT-15 | All six Maestro flows assert English text and the plan never mentions them. Stage one is unaffected | part |
| CNT-16 | Eleven places where the record gives two numbers for one thing, tabled with the right value | no |

One more gap is confirmed, not contradicted, and still needs a step: D31's "everything left" is not
met on iOS by the pin alone. The tree holds zero `textAlign: 'left'` declarations across 79 `Text`
sites, and `PLAN.md` has no step for it (RTL-9, re-checked).

## Better alternatives, with real costs

Where the record's choice is right, this says so.

| # | Alternative | Cost | What it displaces | Recommendation |
| --- | --- | --- | --- | --- |
| A1 | **Forward-only language commit with a persisted "armed language" stamp**, compared at launch, foreground and background. The picker writes the preference and runs the same pass. No undo | One key in place of the marker, one comparison at three call sites, a gate bypass on iOS. Less code than marker plus rollback. One crash-window suite over one flag | The rollback layer and D28's failure face, so the owner must rule. Closes TXN-9 and TXN-11 and removes the weak step in TXN-8 | Recommended (TXN) |
| A2 | **Month and weekday names as catalog keys** instead of platform `Intl` | 31 keys per language, generated once from CLDR and reviewed like any term. No runtime cost | The "swap the tag" step and the month-name pre-flight. Removes per-phone ICU variance, covers Somali | Recommended (ARCH-3) |
| A3 | **A format-neutral bridge, or none yet**: flat key-value JSON with `{name}` | Less than the planned bridge, because the catalog is already the transfer format | The i18next-specific export and import | Recommended (ARCH-14) |
| A4 | **One AST scanner as both the string census and the step 14 guard**, run by the pre-flight | About 150 lines and one test file. `@babel/parser` is already installed. No bundle or runtime cost. The visible-attribute list needs one review | The three counting scripts and the tracked inventory JSON | Recommended (CNT-4 to CNT-6) |
| A5 | **Global `textAlign: 'left'` default on iOS** through the existing JSX shim | About 5 lines plus tests. No Android or English change. Style merge order must keep the 12 `center` declarations winning | Editing 65 or more `Text` sites by hand | Recommended (RTL-9, RTL-15) |
| A6 | **Stronger `t()` types**: `satisfies Catalog` on every catalog, typed parameters per key, no English fallback | Four type lines. Type-check of fifty 164-key catalogs measured at 0.016 s | The runtime fallback and a separate parity test | Recommended (ARCH-13) |
| A7 | **Extra gates**: Biome `noJsxLiterals` with a template-literal scan, a numeric-parameter allow-list, placeholder parity, a pseudo-locale sweep, a length budget per key, translator context | One Biome rule and a scan extension, two unit tests, a 20-line generator and one components suite. A per-key character budget for sheet titles, buttons and widget strings. Comments in the catalog for context | Nothing | Recommended |
| A8 | **Name the stored-time subset type** (`PrayerId` minus the two night ids) | A few lines | The cast at `shared/prayer.ts:407`, for real | Recommended (ID-7, ID-9) |
| A9 | **Regenerate R14 from written patterns** | A 40-line script plus a reread of 16 suites | The unreproducible marker counts | Recommended (CNT-7) |
| A10 | **Patch R13, do not redo it** | One paragraph in step 5 | Nothing. R13's citations are accurate | Recommended (CNT-12) |
| A11 | **Fuller Roboto** (AOSP 2.138 static pair) | +275,240 B for the full pair, or about +58 KB as a Latin, Greek and Cyrillic subset. "Sunrise" at 18px shifts by 0.05px, so the width cache and the visual rule need one re-check | The current bundled pair | Only from the release that adds Hausa, Uzbek or Yoruba. Not for the milestone |
| A12 | **System font for non-Latin locales** | 0 bytes. Repairs the weight loss on iOS. Changes the digits and today's Arabic face on iOS | `fontFamily` per locale | An owner decision on pixels. `R3-FINDINGS.md` proposes it and the pivot does not carry it |
| A13 | **Keep alarms manageable through the pre-marker wipe**: add the two `scheduled_` prefixes to the upgrade keep-list | Two lines. Touches notification scheduling logic, which is ask-first | Nothing | Owner decision (UPG-1) |
| A14 | **Local config plugin for the LTR pin, no dependency** | About 30 lines plus a test, string surgery on a generated Swift file, hand-rolled locale reads | `expo-localization` for the pin only | Not recommended. R8 needs `getLocales()` from the same package |
| A15 | **Write the plan's anchors, or check citations in pre-flight** | Verbatim anchors for 15 steps are about a day of planning work. The other route is a 30-line checker that runs the citation list at the execution sha | The missing anchor mechanism | One of the two is needed (CNT-11) |
| A16 | **Android post-time copy through the repository's own presentation delegate** | Kotlin in the config plugin, a native-readable copy table, a prayer id and kind in the request data, new plugin tests and a device proof. It touches the path that posts every alarm, and iOS still re-arms | The Android re-arm on a language change | Worth a later spike, not for 2.0.0 (TXN) |
| A17 | **Per-surface widget direction handling** | iOS: one prebuild test that the extension stays unlocalised. Android: `expo-widgets` exposes no direction setter and is pinned exact, so it needs an upstream change or a local native module. Cost unknown until the device check | Nothing | Do the device check in RTL-13 first. Build nothing before it |
| A18 | **Force LTR at the UIKit level on iOS** | The same app-delegate surgery as A14. Reaches the two `Alert.alert` sites, not OS-owned prompts | Platform-directed system alerts | Not recommended. If the alerts must not mirror, replace the two call sites with the app's own modal, which is a visible change for the owner |

Rejected after a real attempt, as the record says: an underscore-form union (about 30 more lines
and a migration suite, cheaper than the record states since no store install holds a space-form key
today, but still an ask-first key change for no gain), a branded opaque id, a numeric or enum id
(the legacy sweep deletes its keys every launch), a schema bump or full wipe on upgrade, a two-phase
commit under temporary identifiers (128 pending against a budget of 64), applying the language on
the next reschedule with no stamp (the iOS gate leaves old copy armed), delivery-time localisation
on iOS for 2.0.0, bundled Noto faces (about 0.55 MB for three scripts), the current variable Roboto
(488,584 B, same letters missing), and the i18n libraries at six languages: i18next, Lingui, FormatJS
and Paraglide (each needs an `Intl` API that Hermes lacks, or has no React Native support) and
`i18n-js` (a `lodash` dependency and no key typing).

## What survived attack

- Deterministic identifiers replace in place on both platforms. No cancel-all exists. No interleaving
  found that loses an alarm (TXN-2 to TXN-5).
- One JavaScript runtime per process runs the scheduler on Android, so the in-memory lock serialises
  every JavaScript writer (TXN-15).
- No stored byte depends on the device locale. Every builder uses `.toLowerCase()` on ASCII (ID-2).
- A space inside an identifier is legal and unmangled on every surface that carries it (ID-3).
- The stored day records hold no name field, no record reader requires `arabicName`, and no MMKV
  family needs a schema bump (UPG-7 to UPG-9).
- Requests armed by an older build keep firing and are all replaced or swept (UPG-10).
- OS fallback covers Arabic, Devanagari and Thai on both platforms, and Latin digits stay in Roboto
  inside fallback strings (FONT-1 to FONT-4, FONT-14).
- On Android the manifest attribute alone pins the first frame (RTL-3).
- No library beats the hand-rolled design at six languages, and catalog weight and type-check cost
  stay small at fifty (ARCH-11, ARCH-12, ARCH-19).
- R13's `file:line` citations: 207 of 208 hold, one is off by a line (CNT-1).

## Open observations that need a device

| Id | What to observe |
| --- | --- |
| FONT-10 | Whether iOS picks a Nastaliq face for Urdu by device language |
| FONT-19 | Whether Thai, and Devanagari on iOS, clip in the two tightest line boxes |
| FONT-20 | Arabic, Hindi and Thai screens on each fleet phone with a non-default system font |
| ID-11, UPG-18 | What the new widget layout does with an entry the old build pushed |
| UPG-17 | Which version the Play Store serves |
| UPG-19 | Whether the sync timer fires before the first render |
| TXN-19 | Duration of a full 64-request re-arm on the Android 9 phone |
| TXN-20 | Whether iOS delivery-time keys follow an in-app language |
| ARCH-4 | Localised month names on the Android 9 phone and the iPhone for `ar ms so hi th` |
| ARCH-8 | `getLocales()` from the headless background task with a null preference |
| RTL-13, RTL-14 | Widget column order on an Arabic-language launcher, both platforms |
| RTL-15 | Natural alignment of digit-only text when the app runs in Arabic |
| CNT-17 | Whether the `app.json` strings can follow the in-app language |

## Limits of this verification

- Nothing ran on a phone or simulator. Apple font results are CoreText on macOS as a proxy.
- Each theme file lists its own partial reads under "Not verified". Several library and platform
  sources were read in cited ranges only.
- The coordinating pass did not re-read every contradiction. The "Re-checked" column is exact about
  which ones it did.
- The Play Store version rests on a pattern match of the listing page. The App Store version (1.5.1)
  comes from the lookup endpoint the app itself calls.
- This branch carries no version bump. It holds findings only and is not meant to merge.
