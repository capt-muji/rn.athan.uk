# Ticket 72 LOG

Write-through ledger. Every step entry opens with `### Step <NN> — <state>` and ends with a
line `session: <ses_id>`. Planning sections use `## Planning (<date>)` and `## Ticket <N>`.

## Planning (2026-10-13)

- Ticket taken: queue row 72, the only plannable row (63 DONE, needs-first nothing).
- Reference sha for the English revert pinned: `194ed701` (uat at 2.0.128), the parent of
  row 63's first-step merge `49c58aea` (2.0.129). The reference test files' own values are
  the en byte table.
- Row 63's plan folder recovered from `970d797f` (2.0.132) and read in full; its step shape,
  pin lists and device recipe are the model for this folder.
- Facts verified with file:line citations: the display atoms (`stores/countdown.ts:90-96`),
  the single hero render component for both schedules and the overlay
  (`components/countdown/Countdown.tsx:42-54`, ADR-014), the ago badge
  (`components/prayer/Ago.tsx:52-57`, rendered once per page at `app/Screen.tsx:43`), the
  row-cascade colour pair (`components/prayer/Prayer.tsx:52-60`,
  `hooks/useAnimation.ts:128-134`), the locale core (`shared/i18n/locale.ts:41`), the digit
  map (`shared/i18n/digits.ts:26`), the reminder copy paths
  (`shared/notifications.ts:182`, `:513`), and the catalog deltas between `194ed701` and
  HEAD.
- Planner rulings D72.1 to D72.8 taken under the owner's standing instruction to plan READY
  without her; four carry an audit-veto note (gap width, fade duration, badge fixed width,
  held-display colour).
- Sections drafted and committed; griller dispatched on the complete draft.

## Ticket 72

Grill round one (eight findings: three must, three should, two nice), all applied:
step 2's and step 4's preflight anchor lists pruned against the edits earlier steps make
(both steps would have STOPped on anchors their predecessors destroyed), the dim/bright
colour contract's verification moved to step 4's on-device transcription with the
mock-cannot-read-an-animated-colour caveat written into the step, the four title-only
rewrites' red behaviour corrected, the two-group ruling given its audit-veto note, the
mock alarm pin turned into a rule, the batch-budget wording fixed, and the vacuous-pass
sentence restored. The third break mutation the colour finding wanted is not added: the
mapping flip is invisible to the jest mock by the same caveat.

Replan round one (2026-10-13): the preflight inherited row 68's inverted upstream
check (`origin/uat..uat` counted local planning commits as unmerged); corrected to
`uat..origin/uat`, proven PREFLIGHT OK on the clean tree at 2.0.199.

Replan round two (2026-10-13): two of the step 1 pins contradicted the composer
contract they test. Ruled the composer wins: `formatTime(120, true)` under ar is
`٠٠:٠٢:٠٠` (rule 2 fixed three sections and rule 3 never-hide-hours; the two-group pin
also broke `599,true → ٠٠:٠٩:٥٩`), and `formatTime(60)` is `٠٠:٠١:٠٠` (60 s is one
minute; the pinned digits read transposed against the test title own whole-minute
branch). The executed diff survives at sessions/72/step1-unfinished.patch; execution
amends the two expectations and resumes from the green run.

Replan round three (2026-10-13), from step 1's second stop, two rulings. Finding A:
the step's new exports `splitColonSections`/`splitSingleColon` have no importer until
step 2, so the unreachable-export sweep reports them; ruled transitional allow-list
entries with reasons in `shared/__tests__/unusedExports.test.ts`, added by step 1 and
removed by step 2 (the sweep's `toEqual` fails on stale entries both ways). Finding B:
two biome format errors on step-verbatim snippets; ruled the repo's format gate wins —
contract code is semantic, Biome's formatted form is what lands, noted in step 2.


Replan round four (2026-10-13): the coverage gate refused the verbatim helpers —
`hideSeconds = false` and `labels = durationLabels()` default parameters each had one
side unreachable by construction (the dispatcher always passes hideSeconds, always
omits labels). Ruled: strip both defaults, the helpers take required parameters, the
dispatchers pass `durationLabels()` explicitly (behaviour-neutral; `formatTime` own
`hideSeconds = false` stays, both branches are tested). Step 1 contracts amended;
execution re-applies the r4 patch over this ruling and re-takes the version at commit
(replan commit takes 2.0.202, so the step commit takes the next free patch after it).

### Step 1 — executed

Branch `feat/72-formatters` off `uat` eb4582b1 (2.0.202). The full r4 patch
(`sessions/72/step1-full-r4.patch`) applied with `git apply --3way`, then the four
signature sites amended to the round-four ruled text: `formatTimeLettered(seconds,
hideSeconds: boolean, labels: DurationLabels)` and `formatTimeAgoLettered(seconds,
labels: DurationLabels)`, defaults stripped, both dispatchers passing
`durationLabels()` explicitly. The two dead default-param branches are gone, which is
what clears the coverage gate that stopped round four. Ruling A's two transitional
allow-list entries kept in `shared/__tests__/unusedExports.test.ts`; ruling B applied
once more (biome collapsed the multi-line helper signature; `biome check --write` on
the touched file, repo-wide check exit 0 after).

Gates: suite 1 `133 passed`, suite 2 `143 passed`, suite 3 `19 passed` (295 total,
the round-three record), `yarn test:tz` 208 suites / 5505 tests, `tsc --noEmit` exit 0,
`biome check . --error-on-warnings` exit 0. Break script `ALL AS EXPECTED: 1` (both
catches fired, restore clean; step files staged first per the r4 findings note).
Version re-taken under the lock: origin/uat unmoved (e58f29a0), next patch 2.0.203 in
app.json, package.json, android/app/build.gradle.

Round-four ruling applied to the third helper: the first commit attempt failed the
coverage gate at branches 2282/2283 — the one dead branch was `formatTimeFixedWidth`'s
`hideSeconds = false` (fresh lcov: the only zero-hit BRDA in `shared/time.ts`, line 669).
The dispatcher always passes hideSeconds and the module is private, so the not-passed
side is dead by the same architecture round four ruled on; its findings misattributed
that branch to formatTimeAgoLettered's labels param through a stale lcov line, and the
planner's amendment covered the two sites the misread named. Ruling applied as
recorded ("the helpers take required parameters", formatTime excepted because both its
branches are tested): the default stripped to `hideSeconds: boolean`, behaviour-neutral,
the sole call site already passing the argument. After the strip: tsc exit 0, 133
passed, zero zero-hit branches in the file.

Commit `2d6080b5` (2.0.203), merged `--no-ff` into uat as `ad6a1c89`. Hook lines:
`Tests: 5505 passed, 5505 total`; coverage `Statements 100% (5258/5258)`, `Branches
100% (2282/2282)`, `Functions 100% (1090/1090)`, `Lines 100% (4710/4710)`. Break
script's last line `ALL AS EXPECTED: 1`, rerun clean on the final tree after the
formatTimeFixedWidth strip. Review verdict: clean — scope to the ten listed files,
docblocks and pins consistent, no lifecycle/thread/residue/rule findings.

session: ses_ecaf448f0ffe67XG4Nv3GHF1dr

### Step 2 — executed

Branch `feat/72-render` off `uat` ad6a1c89 (2.0.203). Preflight: the five step anchors
(display-atom, hero-render, ago-render, cascade-pair, derived-color) each count exactly 1;
origin/uat unmoved; the clean-tree line fails solely on this file's uncommitted step 1
entry, which the dispatch declares designed, so the remaining checks were verified
manually and the run proceeded.

Red: exactly the four new section/gap cases failed on `getByText` (sections under ar,
three sections, colon dim, ago gap), the held-display and now-badge guards passed at red,
Screen.test.tsx and every unnamed case passed (4 failed, 20 passed).

Change: `Countdown.tsx` gained `CountdownSectionText` (useDerivedColor muted-to-primary
over `ANIMATION.durationSlow`), the locale-gated `splitColonSections` render with dim
gapped colon nodes and the `countdownColon` style; the `sections === null` branch is the
prior element byte for byte. `Ago.tsx` gained the locale-gated `splitSingleColon` gap
node; the `parts === null` branch is the prior render. The two transitional allow-list
entries left `unusedExports.test.ts`.

Three gate fixes, all recorded: (1) the contract's plain `Text` cannot carry an animated
style (tsc TS2322), so the section node renders `Animated.Text`, the repo's own pattern
(Prayer.tsx:91); (2) the plan's index keys raise blocking `noArrayIndexKey` warnings under
`--error-on-warnings`, so each key line carries a per-line biome-ignore with its reason,
the replan-round-three ruling that the repo's gate wins applied to lint; (3) the colon-dim
test's ternary took Biome's one-line form. After the fixes: the step suite 24 passed,
`npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings` exit 0.

Break script: run per the step-loop order, before the commit, it printed `caught: bright
colon node`, then `RESTORE FAILED` (the script's restore check diffs against HEAD, and the
step's changes were uncommitted; the script's own header says to run it with the step in
HEAD) and exited 1 with only 1 of 2 catches fired. Re-run after the commit below; its
output is recorded at the end of this entry. The second catch is unreachable by
construction: the emptied gap node renders `':'`, and RTL's default normalizer collapses
U+2009 (`'\u2009:\u2009'.replace(/\s+/g, ' ').trim() === ':'` probes true), so
`getByText(GAP_COLON)` still matches and the plan-verbatim ago test passes under the
break. Under the break the Ago suite passed 7/7. This is a plan defect in the break
script's design; the merge gate is withheld and the question returned to the lead.

Commit `66e516d3` (2.0.204) on `feat/72-render`, not merged. Hook lines: `Tests: 5510
passed, 5510 total`; coverage `Statements 100% (5263/5263)`, `Branches 100% (2294/2294)`,
`Functions 100% (1092/1092)`, `Lines 100% (4715/4715)`. Break script re-run against the
committed step: `break applied: bright colon node, empty gap node`, `caught: bright colon
node`, last line `BREAK NOT APPLIED (only 1 of 2 catches fired)`, exit 1, restore clean.
The step's Done-when is not met: the break line is not `ALL AS EXPECTED: 1`. Cold review
verdict: clean against the review checklist and the shipped classes — the null branches
byte-identical, only `countdownColon` added, cascade pair with `durationSlow`, hooks only
in `CountdownSectionText`, no stale comment, no residue (the two allow-list entries left
in the same commit that lands the importers). The three gate fixes stand as recorded.
Merge withheld; the version lock released; the question returned: the plan-verbatim ago
gap test cannot see the emptied gap node because RTL's default normalizer collapses
U+2009 into `:`, so the planner must rule how catch 2 becomes observable (for example an
identity-normalizer matcher in that test, or a different break mutation) before the step
can merge.

Version re-taken under the lock: origin/uat unmoved, next patch 2.0.204 in app.json,
package.json, android/app/build.gradle. Queue row 72 moved to `IN PROGRESS, step 2`.

session: ses_ecae3ad3effeVEDfDPmT8wLvKC

Replan round five applied (2026-10-13, re-dispatch): the four positive GAP_COLON
assertions query with the identity normalizer — `getByText(GAP_COLON, { normalizer:
(s) => s })` in the ar hero pin and the colon-dim test, `getAllByText(GAP_COLON, {
normalizer: (s) => s })` in the three-sections test, and the same normalizer on the ago
gap test's `getByText` — because RTL's default normalizer collapses U+2009 and made the
emptied-gap mutation invisible. The two negative `queryByText` pins keep the default
normalizer: the ruling names only the positive queries. Green run: 3 suites, 24 passed;
`npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0. Break script
on the amended tests: `break applied: bright colon node, empty gap node`, both catches
fired (`caught: bright colon node`, `caught: emptied gap node`), last line
`ALL AS EXPECTED: 1`, exit 0, restore clean. Commit amended onto `66e516d3` (same
message, version 2.0.204); hook lines and the amended and merge shas recorded
post-merge. The amendment landed as commit `7e600074` (2.0.207) on `feat/72-render`;
the branch merged `--no-ff` into uat as `cc903e99` (2.0.207).

session: ses_ecad34b22ffe73JLSScwFdpXyv

Replan round five (2026-10-13): the break script second catch was invisible to the
plan-verbatim test because RTL default normalizer collapses U+2009, so the emptied-gap
mutation matched `getByText(GAP_COLON)` anyway. Ruled: the GAP_COLON assertions query
with an identity normalizer and assert the exact thin-space string; the mutation then
fails the query and both catches fire. Step 2 (committed 66e516d3, unmerged) amends its
test file, re-runs the break script to ALL AS EXPECTED, and amends its commit.

Replan round six (2026-10-13): break-step3 catch 2 grepped the bare path while jest
prints the project-qualified form under --selectProjects=unit; the pattern now reads
`FAIL unit shared/__tests__/catalogLock.test.ts` (the staleness string stays the
second signal).
### Step 3 — executed

Branch `feat/72-reminder-copy` off `uat` f6262805 (2.0.210), the round-six re-dispatch:
the first run stopped at the break script's catch-2 grep and its verified red, change
and green ride this patch. Round six's fix rode the step-2 merge commit (f6262805,
files at 2.0.210): history is slightly tangled, complete and green. Preflight OK: the five step
anchors (en-reminder, en-channel, notif-pin, contract-pin, bridge-pin) each count
exactly 1; origin/uat unmoved; tree clean.

Red: the ten expectation rewrites failed in exactly the seven tests that carry them
(7 failed, 86 passed): builds the titles from the catalog templates, builds the reminder
title with native digits under ar (the post-finally en line; the ar line `العصر بعد ١٥`
untouched and passing), creates content with correct title format, creates content with
different intervals, the per-prayer × interval channel (its `name`), pins the
channel-name formats in English, and the bridge's replaces-{name}-and-{n}. All diffs
read `Expected: "Fajr in 15m"`-style against unchanged catalogs.

Change: the two en catalog values restored to the reference bytes — both replacements
grep-counted 1 before and after, and the working lines compared equal to
`git show 194ed701:shared/i18n/en.ts` lines 90 and 193. `git status --porcelain
shared/i18n/` lists only `en.ts` (then `catalog-lock.json` after the lock). Lock
re-taken: `git diff` shows exactly five changed hash lines (ar, ms, so, hi, th — the
lock writes one sha256 of the en catalog per translated locale), catalogLock 6 passed.
`yarn i18n:export` exit 0 with the expected `Object.exit (i18nBridge.test.ts)` trace;
the pass grep prints `"{name} in {n}m"` (and `"{name} in {n}m Reminder"`).

Green: the three copy suites 93 passed; `npx tsc --noEmit` exit 0;
`npx biome check . --error-on-warnings` exit 0.

Break: `bash $TMPDIR/break-step3.sh` against the staged step: `break applied: en
channel label lost its unit word`, both catches fired (`caught: contract pin on the
channel format`, `caught: en hash drifted from the lock`), last line
`ALL AS EXPECTED: 1`, exit 0, restore clean — the round-six project-qualified grep
fires. Final green re-run on the same tree: the three copy suites 93 passed,
catalogLock 6 passed, `npx tsc --noEmit` exit 0, `npx biome check . --error-on-warnings`
exit 0.

Version re-taken under the lock: origin/uat unmoved (e58f29a0, 2.0.196; local uat
f6262805, 2.0.210), next patch 2.0.211 in app.json, package.json,
android/app/build.gradle (versionName). Queue row 72 moved to `IN PROGRESS, step 3`.

Commit `1af23914` (2.0.211). Hook lines: `Tests: 5510 passed, 5510 total`; coverage
`Statements 100% (5263/5263)`, `Branches 100% (2294/2294)`, `Functions 100%
(1092/1092)`, `Lines 100% (4715/4715)`. Cold review verdict: clean — the nine-file
diff carries exactly the step's seven en rewrites, the two reference-byte catalog
values, the re-taken lock and the version trio; no non-en catalog value, no ar string,
no widget file in the diff; lock idempotence re-proven (a second `yarn i18n:lock`
diffs nothing).

Merge: `--no-ff` into uat (sha recorded post-merge).

session: ses_ecab85520ffeMEzBKuf7VrybVt

### Step 4 — done

Branch `docs/72-device-proof-2026-10-13` off `uat`, version 2.0.215 (the next
patch after the ticket 77 merges that landed on uat mid-proof: 7a681c1e,
2.0.214). Anchor check run twice, PREFLIGHT OK both times: at the proof's
start on 650570b8 and again on the moved uat before the commit
(display-atom, cascade-pair, derived-color, each counting 1). Ticket 77's
merges touch no countdown surface: `git diff 650570b8..7a681c1e` over
`shared/time.ts`, `components/countdown/`, `components/prayer/`,
`stores/countdown.ts`, `stores/schedule.ts`, `hooks/useAnimation.ts`,
`shared/i18n/en.ts` is empty, so the proof reads the merged code byte for
byte.

Build: `zsh $HOME/athan-gitree/bin/build-mock.zsh uat mocks/simple.ts
$HOME/athan-gitree/sessions/72/athan-72-mock.apk`, ref `uat` -> `650570b8`,
`BUILD-MOCK OK` in 343s (versionName 2.0.211, the owner's debug certificate,
real API key absent). Gate: `aapt2 dump badging | grep "^package"` prints
`package: name='com.mugtaba.athan' versionCode='1000000'
versionName='2.0.211'`, the production package id the mock build always
carries (row 68's pass shape). `adb -s 3T_SERIAL install -r`: Success; the
device reports 2.0.211. Pre-change face read before the install on the
carried 2.0.190 mock: the en hero in row 63's colon design (`2:07`, single
bright node, bare colon) — the red on device (`pre-change-en-hero.png`).

1. R7.1, ar inside the final window (the language crossed to العربية, the
   reload re-seeded, Asr 3m20s out): the hero reads three double-digit
   Eastern groups `٠٠:٠٣:٢٠` (bidi draws seconds leftmost), the hours
   group `٠٠` dim, minutes `٠٣` and seconds `٢٠` white, both colons dim
   with the thin-space gaps (`04-ar-final-window-b.png`). R3.1/R3.2
   colour transcription, this step's own read: at 14:15:33 the timer reads
   `٠٠:٠٠:٢٨` — the minutes group has reached ٠٠ and is NOW DIM, the
   seconds `٢٨` still white, hours dim — the zero-dim treatment caught in
   both states on device (`07-ar-hero-t.png`). The ٠ glyph renders as the
   font's small diamond on the 3T.
2. R7.4, the passed-row badge: the single per-page badge tracks the last
   passed row. Dhuhr 100s passed: `الظهر قبل ٠:٠١`, the colon carrying
   clear gaps both sides (`04-ar-badge-zoom.png`). Moments after a
   prayer's own minute the badge reads `الآن` (the ar now-word) for its
   first 60s — Magrib steals the badge exactly at Asr+60s in the mock's
   compressed runway — so the colon face is taken on Dhuhr and again on
   Asr itself at +2min: `العصر قبل ٠:٠١` (`09-ar-badge-magrib-zoom.png`).
   The badge holds its value between its own updates (a display-cadence
   nuance outside this ticket's rendering scope, recorded not poked).
3. R7.2, the clock moved past the window: `dumpsys alarm` saved first
   (`pre-clockchange-alarms.txt`) and audited — 62 app alarms, all
   explained: the mock's prayer rows for today plus days 1-10 with their
   -5m and asr -30m reminder rows (the channels named in check 4), the
   nightly extras rows (01:2x-01:5x, 23:27, today's 14:25/14:30 computed
   from the compressed mock day), and exactly one fixture alarm years out
   at `when 2104803640505`'s post — live-computed, read this day at
   `when 2107199034081` (2036-10-09), the known mock fixture the plan
   names. Nothing unexplained. Then `auto_time 0`, `service call alarm 2
   i64` +13min (job 55's recipe), `date` reads 14:35:06. The hero reads
   two double-digit groups `١٣:١٨` (visual order flipped), white hours,
   seconds hidden, one dim gapped colon, target الفجر 04:03 tomorrow —
   the day rolled to الأربعاء ١٤ أكتوبر and the list shows day1's real
   table (`12-ar-past-window.png`). Restored: `auto_time 1`, read back 1,
   the clock resynced to true time (device 14:32:22 = host 14:32:22).
4. R7.3, the switch to en (Settings, اللغة): the crossing's launch line
   re-appears 4s after the tap (`feature flags resolved`, pid unchanged —
   the in-process reload row 68 measured). After the re-seeded window
   passes the hero reads `13h 23m` under `Fajr` — the lettered `Xh Ym`
   face, one bright node, no colon, no gap — and the badge reads
   `Isha 2m ago`, the lettered `Xm ago` face (`15-en-hero-zoom.png`,
   `16-en-badge-zoom.png`). `dumpsys notification` names the reminder
   channels in the reverted reference copy: `Fajr in 5m Reminder`,
   `Magrib in 5m Reminder`, `Asr in 30m Reminder`, `Dhuhr in 30m/5m
   Reminder`, `Suhoor in 30m/5m Reminder`, `Midnight in 30m Reminder`
   among them — R6.1's en bytes on device, present, not absent
   (`dumpsys-notification-en.txt`).

Width reserve (rule 2's "digit changes never shift anything"): the timer
line's bright+dim pixel bbox across four frames spanning remaining
3:20 / 0:26 / 0:22 / 0:28 holds x425-653, y37-86 in the hero band — max
drift 5px at the left edge (the ٦/٢ glyph shapes), zero vertical drift.

Interference, recorded: between 14:20 and 14:27 a duplicate operator ran
against this phone and has withdrawn — its own streamed install
(`vmdl57525736`, package still `com.mugtaba.athan` 2.0.211) force-stopped
the app mid-proof (pid 29408 -> 30254) and left the launcher foregrounded.
Its window sits between my last check-2 capture (14:18:29) and my clock
jump (14:35): no evidence capture overlaps it; the jump, the alarm audit
file and every read after 14:27 are this session's alone. The resumed
launch at 14:38:40 re-seeded as the mock's per-download contract predicts
and R7.2 was taken from that seed.

Green run: `git status --porcelain` lists no repository file; all evidence
lives under `$HOME/athan-gitree/sessions/72/` (captures, zooms, the alarm
dump, the notification dump, `logcat-72.txt`, the apk and its
`.build.txt`). End state: the phone on the 2.0.211 mock build, automatic
time on (read back 1), Show time passed restored to off, the app
foregrounded in English.

Version: next patch after uat's package.json under the lock — 2.0.215 in
app.json, package.json, android/app/build.gradle (versionName). Queue row
72 -> EXECUTED. Commit and merge shas recorded post-merge by the lead (the
ledger's last entry cannot carry its own commit's sha; step 3's precedent
lands shas in the following commit and there is none after this).

session: ses_ecaacae69ffe7j5XGL9akv5dMv
