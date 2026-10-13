# LOG 82

## Planning (2026-10-13)

Planned by the lane/82 planner against `a4d0b8c6` (uat, 2.0.218). The owner's
discovery ruling sits in queue row 82 verbatim; every decision taken without her is
recorded in PLAN.md section 2.1 with its evidence.

## Ticket 82

- Code map: shared/time.ts (both dispatchers and the colon machinery), shared/i18n/
  digits.ts, shared/i18n/index.ts (t() interpolation), components/countdown/
  Countdown.tsx, components/prayer/Ago.tsx, stores/countdown.ts (display selector),
  hooks/usePrayer.ts, shared/typography.ts, shared/widgetTimeline.ts, Stepper.tsx,
  SoundItem.tsx, widgets/PrayerWidget.tsx (WIDGET_DIGITS), the pinning suites named
  in the steps.
- Scratch-worktree proof (deleted before 00:00): the two dispatchers flipped alone
  redden 25 tests (time 15, Countdown 5, Ago 3, selector 2); the map neutralised
  beyond that reddens the ar pins measured in step 2's red list, including the four
  widget-renderer pins after the widget map dies. tsc clean after each flip.
- 30 anchors generated from `a4d0b8c6`, each counted exactly 1.

### Grill round one (2026-10-13)

The griller verified the anchors, the suite totals, the deletion inventory and the
break substitutions against the code. Twelve findings, all applied: six must (three
wrong green values where the composer shows seconds by default, `formatTime(60)` is
`00:01:00` not `00:01`; the missed `formatPrayerTime` ar pin in the step-2 red list,
now six failed with the `05:44` flip; the break-step2 byte shape pinned in its
contract; the Ago badge's three-node query shape under en), five should (the complete
en pin list with its rule, the three negative assertions that die with the map, the
restore-list arithmetic, the seven widget call lines, the step-3 prebuild sequence
with the stale `ios/` derivation and the prod env staging), one nice (the preflight's
bash 3.2 empty-array guard). No second round: every finding was a numeric or shape
correction re-verified against the composer here, none structural; the griller's own
report confirms the structure sound. All twelve are applied, the nice included.


### Replan round one (2026-10-13, lead)

Step 1's Ago pin shape was unsatisfiable as the plan wrote it. The executor's STOP:
React Native Testing Library 14 matches a `Text`'s whole concatenated content, so with
the en gate dead the badge is one outer `Text` with children `["Dhuhr 0", <gap>, "03 ago"]`; `getByText('Dhuhr 0')` and `getByText('3 ago')` both return null, and the
duration's minutes half is `03 ago`, not `3 ago` (the plan's own red line already read
`Dhuhr 0:03 ago`). Repaired contract 5: query the outer node with the identity
normalizer (`getByText('Dhuhr 0\u2009:\u200903 ago', { normalizer: (s) => s })`) plus
the gap node, and the fade test asserts that outer node. No other step-1 item changed;
the executor's pre-flight and both anchor lists pass, and the tree is clean at
`3494857e`.

### Step 01 — STOPPED

Branch `feat/82-format-flip` off `uat` (`01b648c5`). Both anchor checks pass
(`PREFLIGHT OK`). Red recorded against the new test values: `time.test.ts` 15 failed /
118 passed / 133 total; `Countdown.test.tsx` + `Ago.test.tsx` 8 failed / 12 passed /
20 total; `countdown.test.ts` 2 failed / 26 passed / 28 total; `typography.test.ts`
4 failed / 4 total (`Expected: "Roboto-Medium", Received: undefined`). Green on the
five named suites (133, 20, 28, 4 passed), `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` both exit 0. Break `break-step1.sh` ends
`ALL AS EXPECTED: 1`. Version set to 2.0.222 in `app.json`, `package.json` and
`android/app/build.gradle` (all matching, `app.json` first).

STOP: the pre-commit hook fails on a suite the plan does not name. The full
unit + components run (`npx jest --watchman=false`) reports 2 failed suites and
4 failed tests, all pins of the en lettered display this step's flip removes:

- `__tests__/app/Screen.test.tsx:26` expects `Dhuhr 58m ago`, receives `Dhuhr 0\u2009:\u200958 ago`
- `__tests__/app/Screen.test.tsx:47` expects `Duha 7h 14m ago`, receives `Duha 7\u2009:\u200914 ago`
- `stores/__tests__/schedule.test.ts:2141` (`R12: a passed unreadable Fajr opens tomorrow, which is readable, in seconds`) expects `23h 54m`, receives `23:54`
- `stores/__tests__/schedule.test.ts:2141` (`R12: R11: a row of a day with no readable time opens its next occurrence`) expects `16h 55m`, receives `16:55`

Neither suite appears in `PLAN.md` section 4.3 or step 1's `Files`, so the plan's pin
inventory missed them. PLAN.md section 10 rules this a STOP with the planner
re-deriving the pin. No commit is made. Work saved at
`$HOME/athan-gitree/sessions/82/step1-unfinished.patch` (614 lines) and
`step1-unfinished-status.txt`; the branch is reverted and deleted; the version lock
is released.

session: ses_ec9243a21ffeY5ffi4kZhuOyEF


### Replan round two (2026-10-13, lead)

The step-1 pin inventory was short: the full unit plus components run reddens two suites
outside the five composer suites, both pinning the en lettered form. `Screen.test.tsx:26`
expects `Dhuhr 58m ago`, receives `Dhuhr 0\u2009:\u200958 ago`; `:47` expects
`Duha 7h 14m ago`, receives `Duha 7\u2009:\u200914 ago`; `schedule.test.ts:2099` (`23h 54m`)
and `:2123` (`16h 55m`) flip to `23:54` and `16:55`. Repaired: both suites join step 1's
`Files` and red list, `Screen.test.tsx:58`'s negative query flips with them, and PLAN.md
section 4.3 names both. Everything else in the executor's run passed (red counts matched
the plan, five suites green, tsc and Biome clean, `break-step1.sh` `ALL AS EXPECTED: 1`,
version 2.0.222 set); no commit was made and the tree is clean at `01b648c5`.

### Step 01 — DONE

Branch `feat/82-format-flip` off `uat` (`1ea44102`). The tree was applied from the accelerator
patch `$HOME/athan-gitree/sessions/82/step1-unfinished.patch` (the prior attempt's four source
files and five composer suites) and the two suites that patch predates were flipped on top:
`__tests__/app/Screen.test.tsx` (both en ago pins and the negative query, to the outer node
with the identity normalizer) and `stores/__tests__/schedule.test.ts` (`23:54`, `16:55`).
Both pre-flight runs end `PREFLIGHT OK`.

Red (measured in the prior attempt against this same code, recorded verbatim in the stop entry
above; this run applied that red state as the green tree and verified the contracts, it did not
re-measure red): `time.test.ts` 15 failed / 118 passed / 133 total; `Countdown.test.tsx` +
`Ago.test.tsx` 8 failed / 12 passed / 20 total; `countdown.test.ts` 2 failed / 26 passed / 28
total; `typography.test.ts` 4 failed / 4 total (`Expected: "Roboto-Medium", Received:
undefined`); `Screen.test.tsx:26` expected `Dhuhr 58m ago` received `Dhuhr 0\u2009:\u200958 ago`
and `:47` expected `Duha 7h 14m ago` received `Duha 7\u2009:\u200914 ago`; `schedule.test.ts`
`23h 54m` -> `23:54` and `16h 55m` -> `16:55`.

Green: named unit suites 4 passed / 275 total; named components suites 3 passed / 24 total;
`npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0; `break-step1.sh`
ends `ALL AS EXPECTED: 1`. Version 2.0.223 set in `app.json`, `package.json` and
`android/app/build.gradle` (`app.json` first). The commit hook runs `yarn validate` green:
`Tests: 5546 passed, 5546 total` (Test Suites: 210 passed, 210 total); coverage Statements
100% (5265/5265), Branches 100% (2265/2265), Functions 100% (1096/1096), Lines 100%
(4716/4716).

Review: read `git show` cold against the step-1 checklist. No locale branch survives in
`formatTime`, `formatTimeAgo`, `Countdown.tsx` or `Ago.tsx`; `currentLocaleId` imports remain
only at the module-scope `typographyFor` calls; no dim, colour, gap or size token moved; every
ar pin is byte-identical; the JSDoc examples match the JSDoc-contract test. No fix needed.

Merged into `uat` with the step-1 merge message (`2.0.223 - merge feat/82-format-flip: step 1,
the countdown format flip`); commit `02aaff91`, merge `eae82296`.

session: ses_ec9179891ffeKC048dtg1baPWV

### Step 02 — STOPPED

Step 2's pre-flight fails its own anchor list before any work begins: `sections-regex.txt` counts
0 in `shared/time.ts` (want 1). The anchor quotes the `splitColonSections` docblock as generated
from `a4d0b8c6`, but step 1's contract 1 rewrote that docblock: the phrase "English's lettered
strings and the held `--:--` fail the digit test, so they keep the single-node render" became
"the held `--:--` fails the digit test, so it keeps the single-node render". The anchor's other
lines (the `ALL_DIGITS`/`ALL_ZEROS` pair, the signature and the first two body lines) still match.
Every other step-2 anchor counts 1. No branch was created and no code changed; the tree holds
only the plan folder's step-1 records. NEEDS REPLAN: regenerate `sections-regex.txt` from the
post-step-1 tree, or cut it to its code-only lines.

Evidence: `$HOME/athan-gitree/sessions/82/step2-preflight-failure.txt`.

session: ses_ec9179891ffeKC048dtg1baPWV

### Replan round three (2026-10-13, lead)

Step 2's `sections-regex` anchor quoted `splitColonSections`'s pre-step-1 docblock, which
step 1's contract 1 rewrote, so it counted 0 and step 2's pre-flight failed before any
work. Re-pinned the anchor from the post-step-1 tree (the `ALL_DIGITS`/`ALL_ZEROS` pair
through the first body lines); it counts 1 again. Every other step-2 anchor counted 1.
No step-2 code changed. Step 1 is DONE and merged at `eae82296` (2.0.223).

### Step 02 — STOPPED (pin inventory)

Second attempt. Branch `feat/82-latin-digits` off `uat` (`bc0468c8`, 2.0.224). Both anchor
checks pass (`PREFLIGHT OK`). Every source contract and pin flip of step 2 landed and was
measured; the step stops at the green run on one suite the plan's inventory does not name,
so no commit was made, no branch survives and the tree is clean at `bc0468c8`.

Red (the eight source files changed, the twelve named suites still pinning the old bytes;
this reproduces the plan's recorded red verbatim):

- `time.test.ts` 6 failed / 127 passed / 133 total: the `hideSeconds` ar block (`Expected:
  "٠١:٠١", Received: "01:01"`), the three native-digit describes (`"٠٢:٥٩:٠٠"` / `"٠٠:٠٠:٠٠"` /
  `"٠:٠٢"` received Latin), `splitColonSections` ar case (`Expected: ["٠١", ":", "٣٢", ":",
  "٠٥"], Received: undefined`), `formatPrayerTime` ar pin (`Expected: "٠٥:٤٤", Received:
  "05:44"`).
- unit batch 7 failed / 223 passed / 230 total: `dateLocalized` 2 (`الأحد, ١١ أكتوبر ٢٠٢٦`
  receives `الأحد, 11 أكتوبر 2026`; `ربيع الآخر ٣٠, ١٤٤٨` receives `ربيع الآخر 30, 1448`),
  `notifications` 2 (`العصر بعد ١٥` receives `العصر بعد 15`; the channel name `تنبيه المغرب
  بعد ١٥` receives `تنبيه المغرب بعد 15`), `countdown` 1 (`٠١:٠١` receives `01:01`),
  `widgetTimeline` 1 (`١٧:٤٥` receives `17:45`), `widgetSimulation` 1 (`٠١:٠٥` receives
  `01:05`).
- `widgetRenderer.test.ts` 4 failed / 59 passed / 63 total: `Rab ٣٠` receives `Rab 30`,
  `١٩د` receives `19د`, `١h ١٢m` receives `1h 12m`, `Rab ٣٠` receives `Rab 30`.
- components 6 failed / 89 passed / 95 total: `Time` (`٠٦:٤٦` not found), `Countdown` 2
  (`٠٢` not found), `SoundItem` (`٠:٠٣` not found), `Alert` (`١٥` not found), `Sound`
  (`/^أذان [٠-٩]+$/` matched nothing).

Green: the twelve named suites pass (`unit` 7 suites / 426 tests, `components` 5 suites /
95 tests); `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0.
Deletions: `shared/i18n/digits.ts` and `shared/__tests__/digits.test.ts` (with their
subject). Nineteen files modified, two deleted.

STOP: the full run (`npx jest --watchman=false`) reports 1 failed suite of 209 and 1 failed
test of 5541, the suite `shared/__tests__/i18nBridge.test.ts` at line 74, which the plan's
Files list, red list and green run do not name:

    ● the catalog as its own transfer format › localises numeric parameter digits at
      substitution under ar and never under en
      Expected: "أذان ٣"
      Received: "أذان 3"

It is a second `t()` interpolation pin, the same class as the two `notifications.test.ts`
pins the plan does name: step 1's replan added its un-named composer suites, and this step's
inventory missed this one. PLAN.md section 10 and the step's green run rule any suite
outside the named twelve a STOP, with the planner re-deriving the pin. The step's own
`break-step2.sh` substitution and catch still fire (`caught: the ar reminder title carries
Arabic-Indic digits again`); under an uncommitted tree its restore check prints
`RESTORE FAILED` spuriously, because `git diff --quiet` there compares against the index and
the contract changes are unstaged.

Question for the planner: add `shared/__tests__/i18nBridge.test.ts` to step 2's Files and
red list, flipping line 74 to `أذان 3` and renaming the test to the Latin-digit truth (the
same repair shape as replan round two).

Work saved: `$HOME/athan-gitree/sessions/82/step2-unfinished.patch` (829 lines),
`step2-unfinished-status.txt`, `step2-red.log`, `step2-green.log`, `step2-full.log`.

Left alone, not a STOP: `shared/__tests__/time.test.ts:260` keeps its
`splitSingleColon('الظهر قبل ٠:٥٨')` input. `splitSingleColon` splits on the colon and is
digit-agnostic, so the case never reddened and the plan does not name it.

session: ses_ec911c3cfffefIM4E6l4A4FKKT

### Replan round four (2026-10-13, lead)

Step 2's pin inventory was short one suite. `shared/__tests__/i18nBridge.test.ts:74`
pins the ar `t()` substitution (`أذان ٣`), which the digit map's death flips to
`أذان 3`; it sits in `yarn validate` but outside the twelve named suites, so step 2's
Done-when was unreachable. Repaired: `i18nBridge.test.ts` joins step 2's `Files`, its
red-list unit batch and contract 10; the twelve-test arithmetic becomes thirteen.
Everything else in the executor's run matched the plan (red counts verbatim, the named
suites green, tsc and Biome clean); no commit was made and the tree is clean at
`bc0468c8`.

### Step 02 — DONE

Branch `feat/82-latin-digits` off `uat` (`122d7b13`, 2.0.226 after the bump). Both anchor
checks pass (`PREFLIGHT OK`). The tree was applied from the accelerator patch
`$HOME/athan-gitree/sessions/82/step2-unfinished.patch` (the prior attempt's eight source
contracts and twelve pin flips), the `i18nBridge.test.ts` flip the patch predates was added on
top (line 74 `أذان ٣` -> `أذان 3`, test renamed to the Latin truth), and one contract wording was
aligned (`SoundItem.tsx`'s local `formatTime` keeps its `composed` variable and returns it, per
contract 7).

Red (the eight source contracts landed, the named suites still pinning uat's Arabic-Indic bytes;
reproduced this run, not copied):

- `time.test.ts` 6 failed / 127 passed / 133 total: `formatTime › hideSeconds option › draws the
  fixed-width shapes under ar` `Expected: "٠١:٠١", Received: "01:01"`; `formatTime › native digits
  (D57) › draws Eastern Arabic-Indic digits under ar` `"٠٢:٥٩:٠٠"` receives `"02:59:00"`;
  `formatTime › native digits (D57) › draws the negative, seconds-only, whole-minute and
  whole-hour branches under ar` `"٠٠:٠٠:٠٠"` receives `"00:00:00"`; `formatTimeAgo › native digits
  (D57) › draws the minute, whole-hour and mixed branches under ar` `"٠:٠٢"` receives `"0:02"`;
  `splitColonSections › reads Eastern Arabic-Indic groups and dims the zero groups` `Expected:
  ["٠١", ":", "٣٢", ":", "٠٥"], Received: undefined`; `formatPrayerTime › native digits (D57) ›
  draws Eastern Arabic-Indic digits under ar` `"٠٥:٤٤"` receives `"05:44"`.
- unit batch 8 failed / 228 passed / 236 total: `i18nBridge` `Expected: "أذان ٣", Received: "أذان
  3"`; `countdown` `"٠١:٠١"` receives `"01:01"`; `dateLocalized` 2 (`"الأحد, ١١ أكتوبر ٢٠٢٦"`
  receives `"الأحد, 11 أكتوبر 2026"`; `"ربيع الآخر ٣٠, ١٤٤٨"` receives `"ربيع الآخر 30, 1448"`);
  `notifications` 2 (`"العصر بعد ١٥"` receives `"العصر بعد 15"`; the channel name `"تنبيه المغرب
  بعد ١٥"` receives `"تنبيه المغرب بعد 15"`); `widgetTimeline` `"١٧:٤٥"` receives `"17:45"`;
  `widgetSimulation` `"٠١:٠٥"` receives `"01:05"`.
- `widgetRenderer.test.ts` 4 failed / 59 passed / 63 total, all `... under an ar device locale`:
  `"Rab ٣٠"` receives `["Asr", "", "15:20", "Rab 30"]`; `"١٩د"` receives `["ASR", "19د", "15:20",
  "Sat"]`; `"١h ١٢m"` receives `["ASR", "1h 12m", "15:20", "Sat"]`; the parsed legacy day footer
  `"Rab ٣٠"` receives `["ASR", "1h 12m", "15:20", "Rab 30"]`.
- components batch 6 failed / 89 passed / 95 total: `Time` `Unable to find an element with text:
  ٠٦:٤٦`; `Countdown` 2 (`٠٢` not found); `SoundItem` `٠:٠٣` not found; `Alert` `١٥` not found;
  `Sound` `/^أذان [٠-٩]+$/` matched nothing.

`shared/__tests__/digits.test.ts` is deleted with its subject (contract 9), so it is not in the
red run; the plan's red section lists it as measured against the neutralised map in the planning
worktree.

Green: the thirteen named suites pass (unit 8 suites / 432 tests; components 5 suites / 95
tests); `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0. The full unit
and components run (`npx jest --watchman=false`) is green: 209 suites, 5541 tests, 0 failed.
`break-step2.sh` ends `ALL AS EXPECTED: 1`. Version 2.0.226 set in `app.json` (first),
`package.json` and `android/app/build.gradle` (`versionName`). Deletions:
`shared/i18n/digits.ts` and `shared/__tests__/digits.test.ts`. The commit changes 27 files:
25 modified and the two deletions; `shared/__tests__/i18nBridge.test.ts` joins the inventory.

Review: read `git show` cold against the step-2 checklist. `grep -r "localiseDigits\|ARABIC_INDIC"
--include="*.ts" --include="*.tsx" .` outside `node_modules` returns nothing (R2.5); no catalog
file, `catalog-lock.json`, `dist/` or `native-strings.json` byte changed; no channel id,
notification scheduling line or alert behaviour changed; the en reminder title and channel label
pins are byte-identical (`{name} in {n}m`, `Athan {n}`); the `now`/`الآن` word pins survive; the
widget's `localeKey` still selects `STATIC`, only the digit map died.

Review fix: the cold read found three residues the plan's per-file flips leave behind.
`shared/__tests__/widgetSimulation.test.ts:341-343` kept the description `bakes native digits
into the pushed times under ar` and the comment `Eastern Arabic-Indic digits`;
`components/sheets/screens/__tests__/Sound.test.tsx:142` kept `builds its rows with native
digits under ar`; `shared/__tests__/dateLocalized.test.ts:1-5` kept `native digits under ar
(D57)` in its docblock. All three sit in files this step already flips and name behaviour the
change removed. Fix applied under PLAN.md section 10's three conditions (un-specified code, no
assertion, signature, log line or behaviour moved, every criterion still met): the two
descriptions and the comment dropped the digit-localisation wording for the Latin truth, and the
docblock reads `Latin digits and no era in every locale`. Re-ran the two affected unit suites
(71 passed), the affected component suite (22 passed), `npx tsc --noEmit` (rc 0) and
`break-step2.sh` (`ALL AS EXPECTED: 1`); amended into the step commit.

Merged into `uat` with the step-2 merge message (`2.0.226 - merge feat/82-latin-digits: step 2,
Latin digits everywhere`): commit `3a9e568b`, merge `63e3262f`.

session: ses_ec909af78ffe667y7LBBE0W4Pn

### Step 03 — DONE

Branch `feat/82-device-proof` off `uat` (`63e3262f`). The step's anchor list is empty, so the
landed state was verified instead: `ai/plans/README.md` row 82 reads `IN PROGRESS`, and both
landed steps sit on `uat` (`eae82296` step 1's merge, `63e3262f` step 2's merge). The cursor
read `step 2`, not `step 3` as the anchor prose expects; the repo's convention is that each
step's own commit carries its own number (step 1's commit wrote `step 1`, step 2's wrote
`step 2`), so this step's commit moves it to `step 3`.

Version 2.0.227 set in `app.json` (first), `package.json` and `android/app/build.gradle`
(`versionName`); uat's `package.json` was 2.0.226. `npx expo prebuild -p ios --clean` with
`EXPO_PUBLIC_ENV=prod EXPO_PUBLIC_API_KEY="$(cat ~/.config/athan/.api_key)"` inline (never
printed, never written anywhere) exits 0 and rewrites the stale `ios/` derivation (it read
2.0.45); `ios/Athan/Info.plist` then reads 2.0.227. `build_run_sim` (workspace
`ios/Athan.xcworkspace`, scheme `Athan`, configuration Release, simulator Athan-77, iPhone 16,
iOS 18.5, placeholder `SIMULATOR_UDID`) exits `SUCCEEDED` after 519 s, installs
`com.mugtaba.athan` and launches it; the home screen shows the Standard list with its
countdown. Screenshot inventory, all under `$HOME/athan-gitree/sessions/82/` and none committed:
`step3-en-home.png` (the en read), `step3-ar-home.png` (the ar read), and the two route
diagnostics `step3-settings-sheet.png` (the Settings sheet with its `Language` row) and
`step3-language-sheet.png` (the six-row picker, `العربية` the fourth row).

Env note, recorded, not fixed here: the prebuild carried the production env as the step
dictates, but the Xcode bundle step (`expo export:embed`, run inside `build_run_sim`) had no
`EXPO_PUBLIC_ENV` in its process environment (the build log carries zero occurrences), so the
bundle took the local env and the app served mock times: the ar read's rows cluster within a
few minutes of the 22:01 relaunch, the `mocks/simple.ts` shape. No criterion and no expected
transcription of this step depends on the data source: R4.1 and the three reads are about the
countdown design, and both reads show it.

**en read**, `step3-en-home.png` (21:53). Countdown block, top to bottom: `Asr`, then
`00 : 01 : 49`. Digits and colons only, no `h`, `m` or `s`. Both colons carry space on each
side (the thin space `\u2009` either side of each colon, `components/countdown/Countdown.tsx:75`)
and render lighter than the white digit groups: `00` and the two colons measure about a third
of the white `01` and `49` brightness. Badge: `Dhuhr 0 : 02 ago`. Row time: `21:55`.

**ar read**, `step3-ar-home.png` (22:02, after Settings, then the `Language` row, then
`العربية`, and the 22:01:36 relaunch in the runtime log). Countdown block: `العصر`, then
`00 : 01 : 54`, the same Latin digit groups, the same gapped dim colons, no unit letter. No
Eastern Arabic-Indic glyph anywhere on the screen. The accessibility tree at the same state
gives the composed strings byte-exact: badge `العشاء قبل 0 : 01`, timer `05 : 55`, rows
`الفجر, 21:58`, `الشروق, 21:59`, `الظهر, 22:00`, `العصر, 22:04`, `المغرب, 22:05`,
`العشاء, 22:06`.

**Identity, R4.1**, the two reads side by side:

| locale | prayer name | timer line | badge | row time |
| --- | --- | --- | --- | --- |
| en | `Asr` | `00 : 01 : 49` | `Dhuhr 0 : 02 ago` | `21:55` |
| ar | `العصر` | `00 : 01 : 54` | `العشاء قبل 0 : 01` | `22:04` |

One design in both: three fixed-width sections, Latin double digits, dim gapped colons, the
`00` group dim and the live groups white, no letters anywhere. Outside the final ten minutes
both locales take the `HH : MM` shape with the same treatment (en `06 : 05`, ar `05 : 55`).
Only the prayer name's words differ by locale.

Review: both screenshots exist under `sessions/82/` and are named above; the transcriptions
quote the characters as read; `git show` on the commit carries the plan files and the version
bump only, no source file.

Merged into `uat` with the step-3 merge message (`2.0.227 - merge feat/82-device-proof: step 3,
the simulator proof`).

session: ses_ec900563cffeYgP6bGi49t5pXq
