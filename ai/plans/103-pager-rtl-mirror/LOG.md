# LOG

## Planning (2026-10-15)

## Ticket 103

Frontier taken in two interview rounds with the owner:

- D103.1 mirror the pager under RTL (round 1, recommended option accepted).
- D103.2 acceptance is her read alone; no 3T device step (round 1).
- D103.3 today the pager stays physical LTR under Arabic on her XS dev build (round 2).
- D103.4 planner, from source: the mirror rides the native `layoutDirection` prop keyed off the
  app locale; never transforms, never child reordering, never the library's `I18nManager`
  deduction.

Facts (explore worker, verified against the code at `f8884324` by the planner):

- The pager is react-native-pager-view 9.0.4, a native component; the prop
  `layoutDirection` exists and is unused by the app today.
- The root direction mechanism (row 80) reads `localeDirection(currentLocaleId())`; the tree
  remounts on `localeVersion` and the D59 crossing reloads the context.
- The infobox anchors by row index inside the list with logical `start`; the catchers rebuild
  from live window measurements; the tip is locale-keyed and already mirrored; the timer row is
  pinned `direction: 'ltr'`. None of the four changes under a pager-only mirror.

## Planning (2026-10-15), second entry

Plan drafted through the gate: 2 steps, 5 anchors, preflight and break script committed. The
grill ran cold (athan-plan-griller) and its findings are adjudicated in the READY commit message.

### Step 1 - DONE

Branch `feat/pager-rtl-mirror` off `uat` (2.0.786). Preflight: `PREFLIGHT OK` (branch, clean
tree, origin merged in, version floor, all 5 anchors count 1).

Reds (recorded before the change; both failed with the plan's expected shape, the other 8 cases
in the file green):

- `the prayer pages, Friday 11 September 2026 at 14:00 › passes layoutDirection rtl to the pager
  under an RTL locale` - first failing line `expect(screen.getByTestId('pager')).toHaveProp('layoutDirection', 'rtl')`
  at `__tests__/app/Navigation.test.tsx:101:41`, `Expected instance to have prop:
  layoutDirection="rtl" / Received: undefined`.
- `... passes layoutDirection ltr to the pager under an LTR locale` - same shape at
  `__tests__/app/Navigation.test.tsx:109:41`, `layoutDirection="ltr" / Received: undefined`.

Change: `app/Navigation.tsx` carries the import pair, the `const direction =
localeDirection(currentLocaleId());` line after the chrome hooks, and
`layoutDirection={direction}` beside `initialPage`. Nothing else. One plan deviation, applied
and recorded: the plan's verbatim mock wrote `testID="pager"` and the repo's Biome formatter
mandates `jsxQuoteStyle: 'single'`; the committed mock is the formatter's own output
(`testID='pager'`), same string value, mechanism and semantics, because the plan's own green
criterion requires `biome check . --error-on-warnings` to exit 0.

Green: the Navigation suite 10/10; the four neighbouring pinning suites 27/27, zero snapshot
changes; `yarn validate` green (tsc, Biome, Jest 215 suites / 5676 tests, coverage 100% on
statements 5348/5348, branches 2312/2312, functions 1112/1112, lines 4790/4790).

Break: `BREAK OK` - the prop renamed away, both named cases failed with `undefined` received
(2 failed, 8 skipped), file restored clean.

Simulator probe (R4.1), Athan-77 iOS 18.5, fresh Debug build through xcodebuildmcp
(319937 ms SUCCEEDED) from the branch tree: under ar the Standard page mounts with its active
dot on the RIGHT (the mirrored page 0), one left-to-right drag (70,450 -> 330,450) settles the
EXTRAS page (نصف الليل، آخر ثلث، السحور، الضحى، استخارة) with the active dot moved to the
LEFT, and the return to en renders the Standard page whole, LTR, dot LEFT, no residual Arabic.
The ar-to-en reload did not starve. Evidence and transcriptions:
`$HOME/athan-gitree/sessions/103/step1-probe-evidence.md` and the nine frames it lists.

Version 2.0.787 (next patch after uat's 2.0.786, taken under the version lock): app.json first,
then package.json, then android/app/build.gradle `versionName` (gitignored, never added).

Ticket 103 set to `IN PROGRESS, step 1` in `ai/plans/README.md` in this commit.

