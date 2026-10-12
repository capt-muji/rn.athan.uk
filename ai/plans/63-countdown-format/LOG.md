# Ticket 63: Countdown format: numbers and colons only, every language

## Planning (2026-10-12)

Session opened from `/athan-next` with the owner's instruction: plan the smallest
tickets that need no owner questions while she is away. Rows 67 and 68 share this
ticket's widget files (`widgets/PrayerWidget.tsx`, `shared/widgetTimeline.ts`,
widget props), so the cluster serializes and 63, the smallest, plans first.

The owner returned mid-session and ruled: widgets are excluded from 63 entirely
(D77), so the widget countdown label job splits to its own row (69) and this
plan narrowed to the app surfaces. She then took, in one question round: D75
(always H:MM, seconds shapes, 0:00 clamp, ago badge same, `now` stays), D76
(reminder titles and channel labels drop the unit word in all six locales) and
the row-67 ruling (plan it too, D61 superseded for digit keying only).

Scratch-worktree proof (deleted): red lines, the green pass, the ten failing
suites, the biome catch (`intervalToDuration` import), the lock re-take and the
dist write are recorded in PLAN.md section 4. Anchors extracted at `fc1e3b89`,
all seventeen counting 1. Gate: `PLAN OK`.

Grill round one (twelve findings, all applied): three unnamed pin sites added,
the D57 Arabic values corrected to the files' real inputs, the preflight
invocation made CWD-safe, row 69's exact cell recorded, the device step's build
command named with its mocks file and expected `BUILD-MOCK OK`, the days
attribution split, the JSDoc pin extended, the catalog-count instruction moved
to `grep -F`, and the `tsc` ordering note reworded.

Grill round two (seventeen findings, all applied): the branch test's whole-hour
value corrected to `'٢:٠٠:٠٠'`, the ago `ar` table completed with `120 → '٠:٠٢'`
and the phantom `en` twin dropped, the hero `1m` case corrected to `1:00`
(59.4 s ceils to 60), the device package check aligned with BUILD.md (the mock
carries the production id), the fourth docblock string in
`getSecondsRemaining` named, the two-site `Fajr in 15m` noted, row 69's
duplicate insertion removed (the planning commit carries it), the
`usePrayerAgo` docblock examples joined to contract item 6, the two prose-pinning
`it` titles rewritten, the stale `DurationLabels` mention in
`shared/widgetTypes.ts:168` ruled row 69's, the minute-rule formula fixed, the
blank-line deletions added for Biome, the file counts corrected, the boundary
comment scoped to the 599/600 pair, R4.2 made observable, the break scripts
moved to `$TMPDIR`, and the JSDoc describe comment's wrong-example clause
rewritten. Gate rerun: `PLAN OK`.

## Ticket 63 (2026-10-12)

### Step 1 — DONE

Branch `feat/63-colon-formatters` off uat. Deviation recorded: the main checkout
is shared with the concurrent 59 planning and 67 finishing sessions (67's own
STOP entry names the collision), so the pre-flight's clean-tree gate could not
hold; all red/green work ran in a scratch worktree
(`$HOME/athan-gitree/worktrees/exec63`, node_modules symlinked, branch
fast-forwarded to `194ed701` before the commit), and the merge into uat runs in
the main directory inside a clean-tree window. The pre-flight's substantive
gates were verified directly: all 17 anchors count exactly 1, uat's
package.json at 2.0.126 (then 2.0.128) is at or above 2.0.122; its two
remaining failures were the sibling sessions' uncommitted files and uat sitting
commits ahead of origin (the lead pushes; the executor never does).

Red, exactly as planned: time.test.ts 18 failed / 110 passed, every failure a
colon shape Expected against a letter shape Received; countdown+schedule 5
failed / 133 passed; Countdown+Screen+Ago 11 failed / 8 passed. Nothing outside
the rewritten cases failed.

Green: 128/128, 138/138, 19/19; `npx tsc --noEmit` exit 0; `npx biome check .
--error-on-warnings` exit 0 (430 files); full `yarn validate` exit 0: 5468
passed, 2 skipped, 5470 total, coverage 100% statements 5188/5188, branches
2221/2221, functions 1081/1081, lines 4645/4645.

Break: `bash $TMPDIR/break-step1.sh` (the repaired script, grepping the
deterministic `Received: "0:0"` signature) printed `break applied: pad2 removed
from three groups`, `caught: unpadded seconds group (0:0)`, `caught:
zero-padded minute group (1:01)` and ended `ALL AS EXPECTED: 1`; the tree then
listed exactly the eight step files.

Unnamed-comment fixes applied under the section-10 stale-comment rule, all in
code the plan did not give verbatim, changing no test: deleted the now-false
`never "1h 0s"`-class trailing comments on formatTime(3600), formatTime(7200)
and formatTime(90000) in time.test.ts, and dropped the `:546` line reference
from the hideSeconds threshold describe's comment (the line moved with the
rewrite).

Version 2.0.129 (next patch after uat's 2.0.128, taken under the version lock;
android/app/build.gradle versionName set to 2.0.129 in the main checkout,
never git-added).

session: ses_ece59c1c9ffess0PpEuF3XrmKe

Step 1 commit: `c720391` on `feat/63-colon-formatters` (2.0.129). The worktree
lacked the generated `.husky/_` shims, so the first commit attempt ran no hook;
the shims were copied in, the commit soft-reset and re-committed with the hook
live: `Tests: 2 skipped, 5468 passed, 5470 total`, coverage `Statements 100%
(5188/5188)`, `Branches 100% (2221/2221)`, `Functions 100% (1081/1081)`,
`Lines 100% (4645/4645)`, exit 0. Stale pre-194ed701 copies of app.json and
package.json were restored to HEAD in the main checkout (index and worktree)
to unblock the merge; the planner's own staged README edit was left untouched.

### Step 2 — DONE

Branch `feat/63-reminder-copy` off uat `49c58aea` (step 1's merge), same
scratch worktree. Anchor check: all seven step-2 anchors count 1.

Red: notifications + prayerIdContract + i18nBridge ran 8 failed / 85 passed,
every failure carrying the old letter strings in Received (the `m`, ` د`,
`मि.`, `d`, `นาที` tokens); catalogLock still passed against the unchanged
catalogs.

Change: the twelve catalog values replaced after a `grep -F` count of 1 each
(en, ar, ms, hi, so, th × notification.reminder + channel.reminder). `yarn
i18n:lock` printed `catalog lock written for ar, ms, so, hi, th`; the
catalog-lock diff shows five changed hashes and nothing else. `yarn
i18n:export` printed the expected jest trace naming
`Object.exit (shared/__tests__/i18nBridge.test.ts:38:11)`, and
`grep '"notification.reminder"' shared/i18n/dist/en.json` printed
`"{name} in {n}"`; nothing from dist is committed.

Green: the five suites (notifications, prayerIdContract, i18nBridge,
catalogLock, i18n) 103/103; `npx tsc --noEmit` exit 0; `npx biome check .
--error-on-warnings` exit 0 (430 files).

Break: `bash $TMPDIR/break-step2.sh` printed `break applied: unit token
restored in en notification.reminder`, `caught: reminder title regains the
unit token` and ended `ALL AS EXPECTED: 1`; the tree then listed exactly the
step's ten files plus this LOG.

Version 2.0.130 (next patch after uat's 2.0.129, under the version lock;
gradle versionName set to 2.0.130 in the main checkout, never git-added).

session: ses_ece59c1c9ffess0PpEuF3XrmKe
