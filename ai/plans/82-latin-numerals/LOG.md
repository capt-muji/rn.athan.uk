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
