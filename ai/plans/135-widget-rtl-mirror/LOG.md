# LOG — ticket 135

Resume from: step 4 (device proof) stopped on the 3T Arabic read (the
mirrored hero half collapsed; transcription below). Steps 1 to 3 are merged
to `uat` (`1d69959c`, `efdee293`, `de55e9d9` through 2.0.1042) and lane/135
is rebased onto `uat`. The lead repair D135.13 (PLAN.md) pins the mirrored
wrapper to a fixed width; then: red test, fix, validate, mutation pass,
merge, rebuild the fleettest APK, re-read the 3T both directions, the XS
proof, the audit, the deep clean.

### Step 04, continued — the repair proven on the 3T (2026-10-18)

session: lane-135-resume

Red first (branch `fix/135-hero-collapse` off `uat` at `f91df6a2` 2.0.1053):
`pins the mirrored wrapper to a fixed width under rtl: a fill-first child
starves the hero` — `Expected value: {"modifier": "width", "value": 177} /
Received array: [{"modifier": "fillMaxHeight", "value": undefined},
{"modifier": "fillMaxWidth", "value": undefined}]` at
widgetRenderer.test.ts:1087. Change (widgets/PrayerWidget.tsx, the medium
branch only): the list wrapper's modifiers read
`[fillMaxHeight(), rtl ? width(LIST_WIDTH) : fillMaxWidth()]`, the why
comment extended with the starvation line; nothing else moves. Green: the
whole renderer suite `Tests: 71 passed, 71 total`. Mutation pass, two
mutants, each predicted before measured, each restored from `$TMPDIR`:

| Mutant | Predicted red | Measured |
| --- | --- | --- |
| fill restored unconditionally (the shipped bug) | the new case's rtl assertion | 1 failed, 70 skipped |
| fixed width unconditionally (the falsy fill lost) | the new case's falsy guard | 1 failed, 70 skipped |

Break scripts re-run: `break-135-mirror.sh` still red on the three mirror
cases under `-t "under rtl"`, file restored from TMPDIR. `yarn validate`
exit 0 (hook): `Test Suites: 222 passed, 222 total`, **Tests: 2 skipped,
5760 passed, 5762 total**, coverage 100 percent on all four measures.
Version 2.0.1054 (next free: 2.0.1051 lane/116, 2.0.1052 lane/138),
merged as `45faa440`; the main tree's `android/app/build.gradle` versionName
synced under the build lock; branch deleted after the merged check.

Fleettest rebuild (the step's scratch-worktree ritual, `plan-135` detached
at `45faa440`, yarn.lock hashes identical, node_modules symlinked, `.env`
from `.env.example`, widget flags ON): prebuild exit 0 (applicationId
`com.example.athan.fleettest`), gradle `assembleRelease --no-daemon
-PreactNativeArchitectures=arm64-v8a` exit 0 under the build lock (no other
build alive; lane 116's Duo simulator build had completed and released
before this one started). Gate: `aapt2` at the SDK build-tools path,
`aapt2 dump badging` prints `package: name='com.example.athan.fleettest'
versionCode='1000000' versionName='2.0.1054'` — GATE PASSED. APK and logs
kept at `~/athan-gitree/sessions/135/`; worktree and TMPDIR removed.

3T re-proof (every contact under the device lock, released after):

- Installed 2.0.1054 over the dead session's 2.0.1042 (widget stayed
  placed, id unchanged). Vision note unchanged: this session cannot see
  images, so every read below is the structured live read (Maestro's
  failure-artifact hierarchy: exact AX text plus bounds), the e2e README's
  sanctioned Android 9 reader.
- ARABIC read (app language العربية; the convergence pushes proven by
  logcat `WIDGET: Standard snapshot pushed` with Arabic names at 12:04:02
  and twice more): THE HERO RENDERS — the card splits at x460, the list
  half LEFT with the time column leftmost (12:00 to 12:06 at x121-193) and
  the Arabic names rightmost inside each row (الفجر to العشاء at
  x341-411), and the hero half RIGHT carrying المغرب at [600,1134][692,1183],
  the countdown label as separate texts `1` [599,1188][638,1280] + `m`
  [638,1192][693,1279] (unpadded Latin digit, lowercase Latin letter tight
  beside it, never `د`), the target 12:05 at [604,1295][688,1342] and the
  day الأحد at [617,1459][675,1502]. The collapsed zero-width containers
  are gone (the band holds the full node set; no `visible:false` zero-width
  wrapper remains). R1.1 and R3.1 MET ON GLASS; the defect the stop
  transcribed is healed.
- ENGLISH read (app language English restored, push at 12:07:05, read after
  HOME): the settled face, and its bounds are IDENTICAL to the dead
  session's pre-fix English read at 2.0.1042 — hero LEFT (MAGRIB at
  [205,1134][343,1183], label `1` [227,1188][266,1280] + `m`
  [266,1192][321,1279], target 12:08, day Sun), list RIGHT with name LEFT
  (x670-762) and time RIGHT (x888-960). R1.2 and R5.1 MET ON GLASS: the
  falsy path renders byte-identically after the repair.
- 3T end state: app language English, fleettest 2.0.1054 installed with
  the medium widget placed, production app and its widget untouched,
  automatic time never touched.

### Step 04, continued — the XS proof (2026-10-18)

session: lane-135-resume

Build (main tree, the build bay, uat `45faa440` content, under
`build.lock`): `EXPO_PUBLIC_IOS_WIDGETS=1 npx expo prebuild -p ios
--no-install --clean` exit 0; the workspace check passed (the
`ExpoWidgetsTarget` extension present, NSExtension keys, 26 pbxproj
references); `DEVELOPMENT_TEAM=<TEAM_ID> EXPO_PUBLIC_IOS_WIDGETS=1 npx
expo run:ios --configuration Release --device IPHONE_UDID` built Release
(products in `Release-iphoneos`), embedded `ExpoWidgetsTarget.appex`, and
installed: `devicectl device info apps` reads `com.example.athan 2.0.1054`
— her app upgraded in place, her data and placed widgets kept (the atlas's
standing route; no signing mismatch).

Her phone's as-found state, read before any change (every contact under
the XS device lock): the APP LANGUAGE IS ALREADY ARABIC (the accessibility
tree reads الفجر, لندن، المملكة المتحدة, جمادى الأولى 8، 1448 and the
app countdown `15h 28m` lettered Latin), the SYSTEM locale is English (the
system chrome reads Search, Page 1 of 1), and the home page carries the
placed Athan medium widget with the widget-extension process alive. The
restore target is therefore ARABIC, the as-found language.

Driving wedge, measured and routed around: the agent-device tap channel is
dead this session (the runner's `build-for-testing` fails on "No Account
for Team" / no runner profile; row 131's daemon-inherited runner cache did
not survive the 0.21.5 client's daemon replacement, and Xcode holds no
account session to mint one). The reads therefore went through
`pymobiledevice3 developer accessibility list-items` (no runner needed)
plus `developer dvt screenshot` — the app was left to the home screen by
terminating its pid through devicectl (the atlas's leave-an-app route).

XS ARABIC read (the as-found state, the timeline re-pushed on the app's
launch): the home screen's AX tree carries the widget's full content —
the six rows reading TIME THEN NAME in AX order (04:03/الفجر,
05:38/الشروق, 13:03/الظهر, 16:58/العصر, 20:19/المغرب, 21:31/العشاء: the
time captions lead each row, the AX engine sorting by visual position, so
the TIME column sits leftmost and the Arabic names rightmost — the
mirrored row), the rows block leading the widget and the countdown block
trailing it (the list half left, the hero half right), and the countdown
itself ticking `15:27:46, Updates Frequently` — LATIN DIGITS AND COLONS
under the Arabic app locale, the system timer interval her amendment
keeps, no letters anywhere (R4.1 ON GLASS). The Hijri day `جما 8` renders
in the hero's footer. The times are her real London day (Fajr 04:03
through Isha 21:31), the offline store standing after the in-place
upgrade.

Pixel corroboration, attempted and wedged: three `vision` dispatches (the
dry run on the dead session's sim screenshot, the home-screen inventory,
the widget screenshot at `~/athan-gitree/sessions/135/xs/135-xs-widget-ar.png`)
sat unstreaming past fifteen minutes each (session ids recorded in the
lane's return); the screenshots exist under the session folder, uncommitted.
The structural read above stands as the proof of record: the e2e rules
prefer the structured tree over pixels, and the AX order (time-then-name
per row, rows-then-countdown per card) is the mirror's own signature.

**D135.14 (agent-ruled 2026-10-18): the XS English re-read is waived on
evidence; her phone takes zero language switches.** The plan's English
re-read assumed an English as-found app; her app already sits in Arabic,
so the round trip would need two driven switches through a dead tap
channel. The English iOS face is unchanged by construction: the ticket
touches no iOS JS, and the patch's falsy path applies an explicit
`.leftToRight` (R2.2) that equals the no-environment default under every
locale (her system locale is English today; the RTL-system English-app
case is R2.2's own unit-pinned branch). The 3T already proved the English
face byte-identical on glass for the Android half. Challenge once: an
explicit LTR environment could differ from no environment under an RTL
system locale — true in principle, and it is exactly R2.2's pinned,
unit-tested branch; on her English-system phone the two are identical.
Survives. Committed: no switches, the least possible contact with her
phone; the lock-screen read is likewise not forced (locking needs the
dead tap channel, and the same patch site carries all 14 kinds).

XS end state: the app language stays Arabic (as found), the installed
build is the 2.0.1054 Release carrying the fix, her placed home medium
widget untouched and live, nothing uninstalled (the runner app found
pre-installed on the phone predates this session and stays), her app
data never opened, the system settings never touched.

Lock notes: `build.lock` held across the iOS device build and released
after; the XS device lock held through every contact and released after
the last read; the run:ios log-tail process killed once the install was
verified. The agent-device daemon was stopped once (routing around the
runner wedge); its state directory is intact for the next session.

## Ticket 135 (2026-10-18)

Lane opened on the previous lane-135 session's empty ground (no branch, no folder,
no commits; verified against the session store and the tree before any write).
Worktree `$HOME/athan-gitree/worktrees/lane-135` from `uat` at `cd171855`
(2.0.1013); `yarn install` with the tracked hooks pinned; patches applied.

## Planning (2026-10-18)

Survey: both widget layout modules in full, `stores/widget.ts`,
`shared/widgetTimeline.ts`, `shared/widgetTypes.ts`, the app countdown at HEAD
(`components/countdown/Countdown.tsx`, letters at 95 percent since `3a11aa38`),
`shared/time.ts` `formatTimeAgo`, the converter sources
(`expo-widgets` iOS `ViewRenderer.swift`, `TextView.swift`, `EntryView.swift`;
Android `ExpoWidgetEmittableTree.kt`, `ExpoWidgetsPeekWidget.kt`), the patch, the
widget test suites, and row 68's P16 record (`a3d8d282` and its LOG: the Host
compiles to a `HostView` node the runtime rejects).

Measurements taken at planning:

- SDK receipt: the iOS 27.1 SDK's SwiftUICore interface carries exactly one
  `Text(timerInterval:)` initializer (`pauseTime`, `countsDown`, `showsHours`); no
  per-unit overload exists.
- Probe (iOS 26.5 simulator, system Arabic, screenshots read by `vision`; raw files
  under `~/athan-gitree/tmp-135-probe/`, never committed): the default ticking timer
  renders Latin digits with colons under system Arabic (`1:48:57` at 1h49,
  `45:27` at 45m, unpadded hours, hours group auto-dropping, `108:57` total-minutes
  under `showsHours: false`); a pinned `en_US` environment changes nothing; and
  `.environment(\.layoutDirection, .rightToLeft)` flips an HStack pair natively
  (Arabic word right, countdown left).
- Build-site receipt: the Arabic unit letters are baked app-side in
  `widgetStrings()`; the patch's device-locale hunks feed only the STATIC tables.

Frontier: eleven decisions taken agent-ruled (PLAN.md section 2.1, D135.1 to
D135.11), each with the losing options argued. The two the owner vetoes by right:
D135.5 (the iOS countdown keeps the platform's ticking face; letters are impossible
on a ticking WidgetKit text) and D135.6 (no locale pin unless the iOS 18.5
simulator shows native digits under system Arabic).

Draft: PLAN.md, four step files, records, pre-flight, three break scripts, eight
anchors (each counted 1 at `cd171855`).

Grill round one (fifteen findings, all applied): the planned-at version was
2.0.1014 where `uat` at `cd171855` carries 2.0.1013 (header, pre-flight, LOG and
step references re-pinned); step 4's Android build named `build-mock.zsh`, which
hard-unsets the suffix and cannot produce the fleettest id (the step now spells
the ticket-134 scratch-worktree fleettest ritual with the suffix exported inside
the prebuild and the `aapt2` gate); the step-3 break script ran
`npx patch-package expo-widgets` after mutating the tree, which would have baked
the break into the committed patch (restores from `$TMPDIR` now, patch-package
ban recorded); step 2's tests 4 and 5 are guards green at red time (marked, and
the records text now says three reds plus two guards); the mirror table claimed
a `textAlign: 'end'` that today's tree never passes (the row now states the no-
prop truth, test 4 asserts the falsy path gains no prop, and the two stale
textAlign comments are named for deletion); R5.1 as written was false under step
1's own ms/so/hi/th byte change (scoped to direction inputs plus en bytes); step
3's docblock negative would never go green while the v8/v4 version comments keep
their provenance words (scoped to the two field docblocks); the locale seeding
pattern now names `setActiveLocale` and `widgetTimeline.test.ts:200-221`; the
step-1 comment placement is pinned above the fields so the break anchor holds;
the mutant count is the table's eight swappable rows; the XS in-place upgrade
now cites the atlas's dev-signed signing row with the `EXPO_IOS_SUFFIX`
fallback; and three nices (diff --git headers, the `unit` jest project, the
pre-flight comment's claim). Gate re-run: PLAN OK.

Grill round two (four musts, three shoulds, six nices, all applied): the step-3
Swift hunk carried a `return` keyword that breaks a ViewBuilder body (verified by
`swiftc` on the exact shape: `missing return in getter`; `-typecheck` hides it and
the failure would have surfaced only at the owner's step-4 phone build) — deleted;
PLAN section 7 still named the round-one-dead `build-mock.zsh` path and now names
the scratch-worktree ritual; the two step-1/2 break scripts restored with
`git checkout`, which would have reverted the uncommitted fix (both now copy the
pristine file to `$TMPDIR` and restore from it, ticket 134's pattern); D135.6's
trigger said "the XS under system Arabic" where step 4 rightly forbids touching
her phone's system settings (the trigger is the iOS 18.5 simulator, the XS read
is app-Arabic only); the step-2 done-when said six mutants (eight); step 3's
Files and Review now name `widgetContract.test.ts` (two test files); the
fleettest suffix now rides the gradle invocation too (`ai/AGENTS.md`'s "prebuild
and build"); the 3T read gains the LTR-ambient precondition (an Arabic system
locale double-flips the composition mirror); the break scripts carry
`--selectProjects=unit`; step 3's red reason is the docblock's missing consumer
name, not a "blocked" word the field docblocks never carried; the docblock
expectation matches the contract's verbatim wording; step 1 names `LOCALE_IDS`;
the convergence wait is bounded by its logcat line with a 60 second ceiling; and
the conceded `textAlign` non-defect left the anticipated-fixes list (the table is
correct as written). Gate re-run: PLAN OK both rounds.

The planning probe artefacts stay under `~/athan-gitree/tmp-135-probe/` (never
committed); the probe app itself is deleted at the lane's end unless step 4's
simulator branch needs the 18.5 rebuild.

OWNER AMENDMENT MID-PLAN, 2026-10-18 (queue commit `65a88291`, read after grill
round two): item 2 amended — the Android widget countdown is exactly the app
countdown component's face (Latin digits, lowercase h m s, HEAD sizing: letters
0.95 x, tight, 12 point group gap at the 26 point digit size, composed because the
runtime's Text is single-style); the iOS widget countdown keeps what it is now,
no formatting change, row 128 discarded outright. The planning frontier's D135.5
and D135.6 are therefore HER rulings now, not agent-ruled: the plan's evidence
(the SDK's single timerInterval initializer, row 22's concatenation finding, the
Latin-digit probe under system Arabic) stands recorded and agrees with her. The
conditional locale-pin branch is dead; step 4's simulator read is confirmatory
only. Rows 117 (unparked, runs after 135) and 116 (still benched) noted; neither
touches this lane.

### Step 00 — planning
session: pending


### Resume record and plan repair D135.12 (2026-10-18, lead session)

The 04:38 turn died on a provider limit mid-flight. Measured before any
write this resume (06:12): no live sibling on the ticket (session store:
the last lane-135 sibling messages 04:38; only this lane and its
orchestrator live), the worktree clean on `fix/135-android-letters` at
`5c4430c9` with the earlier rebase mess resolved, and two parked locks
whose holders were that dead turn (`commit.lock` holder "lane-135 step1
amend", `uat.lock` bare) reaped.

The amend commit carried no hook `Tests:` line, so the unhooked-commit rule
ran: `yarn validate` by hand on that exact tree — 221 suites, 5747 passed,
2 skipped, coverage 100 percent on all four measures, matching the ledger.

Merge of step 1 (lane weather, resolved): the direct merge conflicted on
`ai/plans/README.md` and the two version files; aborted, the branch rebased
onto `uat` `90855dc6` (row 135 from the branch, rows 136/137 from uat
verbatim), and the rebased commit hit a live version collision with lane
136's `2.0.1030` (`fix/136-chevron-paragraph-pin`). The uniqueness hook
refused the in-place amend while the branch tip itself sat on the colliding
number, so the branch was soft-reset to the uat tip and re-committed fresh
as `a3c55999` (`2.0.1031`), fully hooked: the hook's own run printed
`Tests: 2 skipped, 5747 passed, 5749 total` at 100 percent coverage.
Merged as `1d69959c`; the build bay's `android/app/build.gradle`
`versionName` synced to 2.0.1031 under the build lock; the lockstep filter
green in the main tree. All locks released clean.

Plan repair D135.12 (agent-ruled, recorded in PLAN.md): the executor's
step-2 anchor check STOPped — `alabel.txt` counted 0 because step 1's
owner-amended edits consumed the planning-time pin (`alabel`,
`widget-strings-bake`, `widget-strings-docblock` all pinned pre-step-1
text). All three anchors re-pinned to the post-step-1 tree (each counts 1
at `1d69959c`), the preflight header carries the note, and the step files
need no change. The executor left the ground clean: `lane/135`
fast-forwarded to `1d69959c`, `fix/135-android-letters` deleted after the
merged check, no commits of its own.

### Step 01 — android letters (red recorded 2026-10-18)

Branch `fix/135-android-letters` off `uat` (b5bee6a9, 2.0.1022) in the lane
worktree. Pre-flight `PREFLIGHT OK` (all eight anchors counted 1). Anchor
check: `widget-strings-bake.txt` = 1 in `shared/widgetTimeline.ts`,
`widget-strings-docblock.txt` = 1 in `shared/widgetTypes.ts`.

Red run (`npx jest widgetSnapshot.test.ts widgetRenderer.test.ts
--selectProjects=unit`): 4 failed, 71 passed, exactly the four named cases:

1. `bakes fixed Latin unit letters under the Arabic app locale` —
   `Expected: "h" / Received: "س"` at widgetSnapshot.test.ts:187.
2. `bakes the same fixed unit letters under every locale` — same diff at
   widgetSnapshot.test.ts:203 (fails on the ar iteration).
3. `composes the countdown label as digit runs with tight 0.95 letters` —
   `Expected length: 2 / Received length: 0` at widgetRenderer.test.ts:785
   (the label is one `AText` string today, so no digit-run Row exists).
4. `drops zero groups and clamps the final minute in the composed label` —
   `Expected length: 1 / Received length: 0` at widgetRenderer.test.ts:814.

Resumed 2026-10-18 by a fresh lane session (the predecessor was killed by a
provider switch mid-step). The interrupted state, measured before any write: the
lane worktree sat in an aborted-in-place rebase of this branch onto `uat`
`ae4e84fa` with conflicts in `ai/plans/README.md` and the version files and a
stray `)` line written into the README by the killed conflict resolution; the
committed branch tip was intact. The rebase was aborted (the tree returns to
`f2a1addd` and the half-resolution dies with it), and the branch tip was found
to carry the step-1 code with NO hook evidence: `f2a1addd` was made unhooked, so
every gate below was re-measured by hand on that exact tree before anything else
ran. No sibling session was live on the ticket (session store: the last lane-135
messages are 04:19 local, the only live sessions are this lane and the
orchestrator that dispatched it).

Green run (this session, same filter): `Test Suites: 2 passed`, `Tests: 75
passed, 75 total`. Then `yarn validate` exit 0: tsc and Biome clean, `Test
Suites: 221 passed, 221 total`, **Tests: 2 skipped, 5747 passed, 5749 total**,
coverage 100 percent on all four measures (statements 5408/5408, branches
2328/2328, functions 1131/1131, lines 4844/4844); `shared/widgetTimeline.ts` is
100 percent in every measure, and `widgets/` rides the gate's own `UNMEASURED`
list (AST-pinned by `widgetContract.test.ts`).

Mutation pass, four mutants, each restored from `$TMPDIR` (never `git checkout`,
never `patch-package`; the run's copy of the file is pristine), each predicted
before it was measured:

| Mutant | Predicted red | Measured |
| --- | --- | --- |
| letters relocalised to `t('duration.h'/'m'/'s')` (the committed break script) | `bakes fixed Latin unit letters under the Arabic app locale` | 1 failed, 9 skipped: the ar expectation diff |
| letter size `size * 0.95` to `size * 1.0` | `composes the countdown label as digit runs with tight 0.95 letters` | 1 failed: `Expected: 24.7, Received: 26` |
| group gap `width(12)` to `width(0)` | same case | 1 failed: the Spacer modifiers deep equality |
| group order swapped (minutes run first) | same case | 1 failed: the run order deep equality |

The tree was clean after every mutant (`git status --porcelain` empty).

### Step 02 — android mirror (red recorded 2026-10-18)

Branch `fix/135-android-mirror` off `uat` (`516f1408`, 2.0.1033) in the lane
worktree. Pre-flight re-run from `$TMPDIR`: `PREFLIGHT OK` (all eight anchors
count 1 post-re-pin). Anchor check: `medium-composition.txt` = 1 and
`alabel.txt` = 1 in `widgets/PrayerWidget.tsx`.

Red run (`npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false
--selectProjects=unit`): 3 failed, 67 passed, 70 total, exactly the three
named cases, with the two guards green at red time:

1. `mirrors the medium row order under rtl: time before name` —
   `Expected: 55 / Received: 84` at widgetRenderer.test.ts:990 (the name box
   draws first today).
2. `mirrors the medium halves under rtl: list before hero` —
   `Expected: "centerStart" / Received: "bottomCenter"` at
   widgetRenderer.test.ts:1017 (the hero half draws first today).
3. `mirrors the pill and rows insets to the END edge under rtl` —
   `Expected ArrayContaining [{"modifier":"padding","value":[0,1,14,0]}] /
   Received [{"modifier":"padding","value":[14,1,0,0]}]` at
   widgetRenderer.test.ts:1036 (the pill pads the START edge today).

Change (widgets/PrayerWidget.tsx, `androidRender` only): `const rtl =
input.rtl === true;` after the strings fallback; the swap table applied
through the medium branch's directional inputs with the values chosen once
(`rowFirst`/`rowSecond`, `firstHalf`/`secondHalf`, `nameBox`/`timeBox`),
no duplicated composition; `ATimeText` takes the rtl flag and spreads
`textAlign: 'start'` only under it (the falsy Text carries no textAlign
key at all, so the LTR bytes match the pre-mirror composition); the
`ATimeEl` cast widened to `textAlign?: 'start' | 'end'`; the two stale
textAlign comments deleted (the cast's note above `ATimeEl`, and the
rows' right-justify paragraph).

Green run (same filter): `Test Suites: 1 passed, Tests: 70 passed, 70
total`. `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings`
exit 0 after formatting the two touched files.

Break (`bash ai/plans/135-widget-rtl-mirror/scripts/break-135-mirror.sh`):
`Tests: 3 failed, 65 skipped, 2 passed, 70 total` with `-t "under rtl"`
(the three mirror cases fail, the two guards hold), last line
`BREAK 135-MIRROR: expected FAIL above, file restored from TMPDIR`;
`grep -c "const rtl = input.rtl === true;"` = 1 after the restore.

Mutation pass, eight mutants (the table's swappable rows), each restored
from `$TMPDIR` (never `git checkout`, never patch-package; the file proved
byte-identical at the end), each predicted before measured:

| Mutant | Predicted red | Measured |
| --- | --- | --- |
| outer Row children never swap (`firstHalf = heroHalf` fixed) | mirrors the medium halves under rtl | 1 failed: the halves case |
| list wrapper alignment stays `centerEnd` | mirrors the medium halves under rtl | 1 failed: the halves case |
| inner list alignment stays `topStart` | mirrors the medium halves under rtl | 1 failed: the halves case |
| pill inset stays `APad(PILL_LEAD, 1, 0, 0)` | mirrors the pill and rows insets | 1 failed: the insets case |
| rows inset stays `APad(ROWS_LEAD, 0, 0, 0)` | mirrors the pill and rows insets | 1 failed: the insets case |
| row line stays name-first | mirrors the medium row order under rtl | 1 failed: the row order case |
| time alignment + textAlign stay LTR | mirrors the medium row order under rtl | 1 failed: the row order case (each half alone also red) |
| name alignment stays `centerStart` | mirrors the medium row order under rtl | 1 failed: the row order case |

`yarn validate` exit 0: tsc and Biome clean, `Test Suites: 222 passed,
222 total`, **Tests: 2 skipped, 5756 passed, 5758 total**, coverage 100
percent on all four measures (statements 5417/5417, branches 2350/2350,
functions 1131/1131, lines 4853/4853).

Version 2.0.1036 (next free under the version lock; uat had taken
2.0.1034 and 2.0.1035 mid-flight, lane 137's step 2b and the lead's docs
reapply). session: executor-135-s2s3-2

Lane weather on the merge: the direct merge conflicted on app.json and
package.json (both sides had moved the version line); aborted, the branch
rebased onto uat `6ac3ff85` keeping 2.0.1036 (next free; the README
auto-merged, rows 116/117/128/129 taken from uat verbatim). The rebased
commit `3f135b56` was made unhooked (`rebase --continue` runs no
pre-commit hook), so `yarn validate` was re-run by hand on that exact
tree: exit 0, `Test Suites: 222 passed, 222 total`, `Tests: 2 skipped,
5756 passed, 5758 total`, coverage 100 percent on all four measures
(5417/5417, 2350/2350, 1131/1131, 4853/4853). session:
executor-135-s2s3-2

Step 2 merged as `efdee293` (retry after the lane-weather rebase), the
main tree's `android/app/build.gradle` versionName synced to 2.0.1036
under the build lock. Branch `fix/135-android-mirror` deleted after the
merged check. Note for the lead's docs carry (the D135.12 class): the
preflight's `medium-composition` anchor now counts 0 in
`widgets/PrayerWidget.tsx` — step 2's swap table rewrote exactly the
lines it pinned; the step-3 anchor check (entryview-body,
patch-test-hunk-count) counts 1 and 1.

### Step 03 — ios direction patch (red recorded 2026-10-18)

Branch `fix/135-ios-direction` off `uat` (`efdee293`, 2.0.1036) in the
lane worktree. Anchor check: `entryview-body.txt` = 1 in
`node_modules/expo-widgets/ios/Widgets/EntryView.swift`,
`patch-test-hunk-count.txt` = 1 in
`shared/__tests__/widgetOpenAppPatch.test.ts`.

Red run (`npx jest shared/__tests__/widgetOpenAppPatch.test.ts
shared/__tests__/widgetContract.test.ts --watchman=false
--selectProjects=unit`): 3 failed, 23 passed, 26 total, exactly the
named cases:

1. `patches exactly the known files, all inside the package` —
   `Expected length: 6 / Received length: 5` (five diff --git headers
   today).
2. `applies the entry's rtl as the native layout direction` —
   `Expected substring: 'let rtl = (entry.props?["rtl"] as? Bool) ??
   false'` (the installed EntryView.swift is upstream).
3. `documents rtl as consumed, not stamped-and-unread` —
   `Expected substring: "the patched entry view"` (the field docblocks
   name no consumer; they say "once it renders a Host").

Change: the installed `EntryView.swift` gained the plan's hunk verbatim
(the rtl read with the explicit falsy `.leftToRight` default, the
`.environment(\.layoutDirection, ...)` application around
`WidgetsDynamicView`, NO `return` keyword, one law comment line); the
whole patch regenerated with `npx patch-package expo-widgets` (six diff
--git headers; the git diff on the patch file is purely additive, 21
insertions, the five existing hunks untouched). `shared/widgetTypes.ts`:
the two `rtl` FIELD docblocks now name their consumers (the patched
entry view on iOS, the composition mirror on Android); the v8/v4
version-history comments keep their `(blocked, P16)` provenance words.

Green run: `Test Suites: 2 passed, Tests: 26 passed, 26 total` on the
two touched suites. The widget runtime load suite
(`npx jest shared/__tests__/widgetRuntimeLoads.test.ts
--watchman=false`): `Tests: 3 passed, 3 total` (the ai/AGENTS.md
install rule after any patch change). `npx tsc --noEmit` exit 0;
`npx biome check . --error-on-warnings` exit 0 (after rewrapping the
iOS docblock so the consumer phrase sits on one line, and quantifying
the test regex's two-space indent for Biome's adjacent-spaces rule).

Break (`bash ai/plans/135-widget-rtl-mirror/scripts/break-135-ios-direction.sh`):
`Tests: 1 failed, 7 passed, 8 total` — the direction test's
byte-for-byte `?? false` pin catches the flipped default, so the break
is red by construction; last line `BREAK 135-IOS-DIRECTION: expected
FAIL above (the guard pins the false default); file restored from
TMPDIR`; the installed Swift keeps `?? false` (count 1) after the
restore, and patch-package never ran inside the break.

`yarn validate` exit 0: tsc and Biome clean, `Test Suites: 222 passed,
222 total`, **Tests: 2 skipped, 5758 passed, 5760 total**, coverage 100
percent on all four measures (statements 5417/5417, branches 2350/2350,
functions 1131/1131, lines 4853/4853).

Version 2.0.1042 (ledger line repaired by the lead 2026-10-18: the commit
first scanned 2.0.1039 as next free — sibling lanes had taken 2.0.1037 and
2.0.1038 mid-flight, lane 136's step-3 proof docs commit `a8220b8e` now on
uat — then the lane-weather rebase below re-took the number twice and the
amended commit carries 2.0.1042). session: executor-135-s2s3-2

Lane weather on the merge: the direct merge conflicted on app.json,
package.json and ai/plans/README.md (lane 136 had merged its step 3 and
its executed docs while step 3 ran, uat tip `281e5560` at 2.0.1040);
aborted, the branch rebased onto it keeping BOTH lanes' rows (row 136
and row 137 taken from uat verbatim, row 135 mine at step 3). The
version re-took the next free patch twice under the lock: 2.0.1041 was
taken by lane 136's `docs/executed-136-20261018` (`db142e1f`) between
the scan and the write, so the commit carries 2.0.1042. The rebased
commit was made unhooked (`rebase --continue` runs no pre-commit hook)
and its message still read 2.0.1039, so it was amended with the
corrected 2.0.1042 message — the amend is hooked, and its gate output
is the evidence line below. session: executor-135-s2s3-2


### Step 04 — device proof

session: executor-135-s4 (STOPPED at the 3T Arabic read; see below)

Build (Android fleettest, the step's scratch-worktree ritual): uat verified
holding steps 1 to 3 (`de55e9d9` an ancestor; only lane-136 docs commits
beyond it), worktree `plan-135` detached at `de55e9d9`, yarn.lock hashes
identical (ac850220...), node_modules symlinked, `.env` from `.env.example`
(widget flags ON). Prebuild `EXPO_PUBLIC_ENV=local
EXPO_ANDROID_SUFFIX=fleettest npx expo prebuild -p android --no-install
--clean` exit 0 (applicationId baked `com.example.athan.fleettest`); gradle
`EXPO_ANDROID_SUFFIX=fleettest TMPDIR=~/athan-gitree/tmp-135-build
./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a`
exit 0, no other build process alive. Gate: `command -v aapt2` prints nothing
on the bare PATH (the SDK build-tools path carries it,
`~/Library/Android/sdk/build-tools/37.0.0/aapt2`, version 2.20-15087165);
`aapt2 dump badging` prints `package: name='com.example.athan.fleettest'
versionCode='1000000' versionName='2.0.1042'` — GATE PASSED. APK and logs
kept at `~/athan-gitree/sessions/135/`; worktree and TMPDIR removed.

Vision note: this session cannot see images AND the harness refused the
`vision` subagent (nesting depth limit), so every glass read below is the
structured live read the e2e README sanctions for Android 9 (Maestro
hierarchy: exact AX text plus bounds), cross-checked by pixel ink counts
(measurement only, no visual inference). Raw screenshots stay uncommitted
under `~/athan-gitree/sessions/135/`.

3T (every contact under `device-3T_SERIAL.lock`, ambient `en-US` LTR
precondition met, released after the last contact):

- Pre-existing state: a PRODUCTION-app medium widget (id=3,
  `com.example.athan` 2.0.908, Light) was already placed at [33,110][1047,692]
  and served as the before-record: under its Arabic-era props it rendered the
  defect face — list RIGHT half, names LEFT of times inside each row (name
  x607-696, time x870-960), hero trio LEFT, label `22د`/`19د` (Arabic dal,
  live-ticking). Nothing about it was modified.
- The fleettest app itself had NO bound widget (134's lane left the app
  language Arabic, its widget never placed), so the medium NP (Dark) 4x2 was
  placed per the atlas (picker driven by hierarchy reads: strip scrolled in
  two steps, the cell verified FULLY visible at [548,1378][908,1417] before
  the 900 ms long-press). New binding id=4
  `com.example.athan.fleettest/PrayerWidgetDarkMediumProvider` at
  [33,983][1047,1565].
- ARABIC read (app language العربية, pushes proven by logcat
  `WIDGET: Standard snapshot pushed` at 07:12:24 and 07:20:10, read twice,
  once after placement plus foreground, once after a full round trip —
  identical both times): the list half MIRRORS CORRECTLY — time column
  LEFTMOST (x121-193), Arabic names RIGHTMOST inside each row (x337-411),
  six rows الفجر..العشاء. THE HERO/COUNTDOWN HALF DOES NOT RENDER: no
  next-prayer name, no target time, no day, no countdown label anywhere in
  the AX tree (13 nodes vs 18 under English), zero bright pixels across the
  whole right half beyond the wallpaper corner bleed (0.0% ink at the
  predicted hero column x700-830), and Maestro's debug names the collapsed
  container: `glance_view_id_084` at Rect(993,1038 - 993,1502) — a
  ZERO-WIDTH RelativeLayout at the right edge (visible:false), plus a second
  zero-width wrapper `glance_view_id_011` at Rect(88,1083 - 88,1335). The
  mirrored label law (`Nh Nm` Latin) is unevaluable: the label lives inside
  the collapsed hero.
- ENGLISH read (app language English, push at 07:16:56, re-read after the
  round trip at 07:22:19): the full settled face — hero LEFT (next name
  `MAGRIB`/`ISHA` uppercase, target time, day `Sun`), list RIGHT with name
  LEFT (x670-762) and time RIGHT (x888-960) per row, and the composed label
  rendering as separate texts `1` [227,1188][266,1280] + `m`
  [266,1192][321,1279]: unpadded Latin digit, lowercase Latin letter tight
  beside it at 87/92px = 0.95 ratio. R3.1's label law is proven on glass;
  the English face matches 2.0.1013's shape (hero left, list right,
  name-left rows) with the owner-amended composed label.
- Bisect datum for the fix: the LTR path (rtl falsy, byte-identity path)
  renders the hero; ONLY the rtl path collapses it. The serialized tree is
  green in every step-2 test (the renderer pinned tree values, not the
  Android mapping), so the collapse is the platform mapping of the mirrored
  hero-half directional inputs on Android 9 Glance, not a missed table row.
- 3T end state: app language English (the step's end state; as-found from
  134 was Arabic, noted), fleettest 2.0.1042 installed with the widget left
  placed (the re-proof after a fix needs it), production app and its widget
  untouched, automatic time never touched.

STOP (PLAN 2.2): the 3T widget face under Arabic disagrees with the plan's
expected reading — the countdown trio is absent from the RIGHT half instead
of rendered there (R1.1 unmet on glass). Transcribed above. The XS proof was
NOT started (no contact with her phone, nothing to restore), the iOS 18.5
simulator confirmatory read below was still taken (independent of the
Android defect), and nothing was committed, merged, version-bumped,
queue-updated or records-repaired: the docs commit, the Step-03 ledger
version-line repair and the row status cell all ride the commit this stop
forbids. Locks all released; the lane and main trees are clean.

iOS 18.5 simulator confirmatory read (D135.5/D135.6, never her phone's
settings): Athan-76 booted on the iOS 18.5 runtime, system language Arabic
(`AppleLanguages -array "ar"`, `AppleLocale ar_AE`, sim rebooted), probe app
from `~/athan-gitree/tmp-135-probe/` installed and launched as-is (the 26.5
binary runs on 18.5). Structured read via the accessibility tree: default
timer rows render `A-default-1h49: 1:48:44` and `B-default-45m: 45:14` —
LATIN digits with colons under system Arabic, unpadded, hours group
auto-dropping (`E-envUS-noHours: 108:44`); the RTL HStack pair carries
`العصر` with `1:48:44`. CHANGE NOTHING was obeyed: the platform face is
untouched, transcribed as the confirmatory record. Screenshot at
`~/athan-gitree/sessions/135/sim185-probe-ar.png`, sim shut down after.

Lock notes: `build.lock` was taken for the build and found already removed by
a sibling at release time (07:04, after the build had completed — no
consequence, all sibling locks were free at that moment); the 3T device lock
was taken and released around each contact batch as ordered; no version,
commit or uat lock was ever needed (no commit happened).

### Step 04, continued — lead takeover and the STOP answered

session: lane-135-resume (2026-10-18, this commit)

The predecessor executor session ended hours ago; its Step 04 record above
was found uncommitted in the worktree and is owned by this commit. Liveness
verified before any write (no live 135 session in the store; the streaming
siblings are lane 116 and the orchestrator; no locks parked). The STOP is
answered by the lead, agent-ruled:

**D135.13 (agent-ruled 2026-10-18): the hero-collapse repair pins the
mirrored wrapper to a fixed width.** The 3T evidence pins the collapse to
the rtl path alone, and the widget file's own REFERENCE comment names the
mechanism class from the pre-snapshot era: Glance starves a sibling after a
fill-width column ("converter drops fillMaxWidth's fraction and ignores
weight, which is what starved the list on the 3T" — the reason the medium
Row moved to fixed widths off the granted width in the first place). Under
rtl the list wrapper draws FIRST still carrying `fillMaxWidth`, so the fill
(match-parent) is measured against the whole row and the fixed-width hero
after it collapses to the zero-width trailing container the AX tree named
(`glance_view_id_084`, zero bright pixels right of the list). Options: (a)
keep the fill and reorder nothing — rejected, the mirror law requires list
left, hero right; (b) swap the wrapper to `width(LIST_WIDTH)` under rtl
alone, both halves then fixed widths summing to the grant exactly; (c) drop
the fill unconditionally — rejected, R1.2 pins the falsy tree byte-identical
and the trailing fill is inert under LTR; (d) a transform hack — banned by
the owner's order. Challenge once: does the fixed width change the mirrored
geometry? No: LIST_WIDTH is defined as the grant minus HERO_WIDTH, exactly
the leftover the fill resolved to under LTR; the partition is identical and
only the measure-order dependence dies. Committed (b): the mirror table's
order, alignments, insets and textAlign all stand; a red renderer test pins
the wrapper's fixed width (and the falsy path's fill), with a mutation
pass; then the fleettest rebuild and the 3T re-proof, the XS proof, the
audit.
