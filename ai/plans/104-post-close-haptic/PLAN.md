# 104: the post-close haptic on the change-athan sheet, on time

| Field | Value |
| --- | --- |
| Brief | The post-close haptic on the change-athan sheet |
| Planned at | `f8884324` (2.0.784), 2026-10-15 |
| Planned by | The planning phase, this session |
| Needs first | nothing |
| Parent | nothing |
| Group | none: `components/sheets/parts/Sheet.tsx`, `components/sheets/screens/Sound.tsx` and their tests are shared with no open ticket (row 103 touches `app/Navigation.tsx`; row 106 holds no code) |
| Batch budget | 2 |
| Session budget | 7 |
| Steps | 4 (step 1 code, weight 2; step 2 device with the owner, weight 3, dispatches alone; step 3 code, weight 2, gated on step 2's verdict; step 4 owner read, weight 1) |
| Device | the owner's XS (iOS 18.7.10) for the reproduction and the final read; the iOS simulator for step 1's diagnosis |
| Owner decisions still needed | none taken now; step 2 can STOP for her under the D104.3 contingency |

## 1. Goal

Closing the change-athan sheet with a different sound picked delivers the close haptic one to two
seconds late on the owner's XS dev build. Closing it unchanged buzzes immediately, which is the
behaviour she keeps. The app carries no haptic on the commit path: the late buzz is the sheet's
own unified close haptic (owner rule 2026-09-08, one Light impact when a sheet finishes closing)
arriving late, delayed inside the dismiss-time commit's notification re-arming, which saturates
the threads for the same one-to-two-second window (the code's own recorded measurement). When
DONE the close haptic lands when the sheet finishes closing on every close path, changed pick or
not, nothing fires after the commit, and no new haptic exists anywhere. The owner notices: the
buzz arrives with the close, always, and never twice.

Owner rules that apply, quoted from their source:

- The 2026-09-08 close-haptic rule, recorded in the code: "a single Light impact when the sheet
  finishes closing, on every close path - swipe, backdrop, back, programmatic - landing on the
  same tick as any dismiss-time commit. Firing at close start instead buzzed the moment a drag
  began, detached from the outcome." The haptic stays at close completion.
- The 2026-09-08 no-error-haptic ruling (`hooks/useNotification.ts:247-249`): the revert plays
  visually only.
- `ai/AGENTS.md`: notification scheduling logic is ask-first ground.
- Her D104.2 assembly ruling: one on-time close buzz, no completion haptic, no second buzz.

## 2. Decisions

### 2.1 Taken

- D104.1 (owner, 2026-10-15, interview round 1): the one-to-two-second-late buzz is a defect.
  Her working theory (the scheduling commit finishing, then a haptic) is recorded; the code
  carries no such completion haptic, so the late buzz is the close haptic itself arriving late.
- D104.2 (owner, round 1 confirmed in round 2): target is one Light close buzz, immediate, on
  every close path. The immediate buzz on unchanged close stays. No confirmation haptic after
  the commit. No new haptic anywhere.
- D104.3 (owner, round 1): no notification banner shows at the buzz moment, her words: "this has
  absolutely nothing to do with the notification banners at all". Her contingency, same answer:
  if the capture shows a delivered notification anyway, the lane stops and investigates with her
  (scheduling is ask-first ground).
- D104.4 (owner, round 1): she reproduces the buzz on demand on the XS dev build, with the phone
  connectable for a log capture.
- D104.5 (owner, round 2): owner moments run batched: the XS reproduction and the final reads
  are collected passes, the lead asks once per pass.
- D104.6 (owner, round 2, carried by her chosen target option, whose text names the commit's
  notification re-arming saturating the threads as the delay): for verdicts T and T2 the fix is
  the sheet-side deferral - the commit start moves past the next paint inside the sound sheet's
  dismiss, the store and every scheduling decision untouched.

### 2.2 The executor must not decide

- Step 2's capture shows a delivered notification at the buzz moment (verdict N): STOP with the
  log excerpt. The scheduling path is ask-first and her contingency names the next move.
- Step 2's capture shows neither a delivered notification nor a dispatch-side delay nor a
  saturation overlap (verdict X): STOP with the evidence. Whether to chase an OS-level source
  upstream (row 51 discipline) or accept it is hers.
- Any change inside `stores/notifications.ts` scheduling logic, the channel update, or the arm
  order: not this ticket without her explicit sign-off.
- The fix shape for verdicts T and T2 is the contract in step 3. A different shape (moving the
  haptic, awaiting the impact inside the shared Sheet for every sheet, removing the haptic)
  contradicts D104.2 or the 2026-09-08 rule and is not the executor's to choose.

## 3. Pre-flight

`scripts/preflight-104.sh`, committed in this folder. The executor saves a copy to `$TMPDIR`
and runs it with the repository root as the working directory. It checks: the checkout is on `uat`, the tree is clean, `origin/uat` is
merged in, the version is not lower than 2.0.784, Needs first is nothing, and all 6 anchors
count exactly 1. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

The code map (anchors under `scripts/anchors/`, verbatim at `f8884324`):

- `components/sheets/parts/Sheet.tsx` (anchor `sheet-close-haptic`): the unified close haptic.
  `handleDismiss` fires `Haptics.impactAsync(Light)` then calls `onDismiss?.()` on the same tick,
  when the sheet finishes closing. Every sheet close path funnels here (swipe, back, backdrop,
  programmatic).
- `components/sheets/screens/Sound.tsx` (anchor `sound-handleDismiss`): the change-athan sheet's
  dismiss. No draft: early return, so an unchanged close runs only the close haptic (the
  immediate buzz the owner keeps). A draft: `await commitSoundSelection(...)`, un-awaited by the
  sheet library, so the sheet is closed and gone while the commit runs.
- `hooks/useNotification.ts` (anchor `commit-sound-selection`): `perfMark('sound_commit_start')`
  around the store commit and `perfMeasure('sound_commit', ...)` after it: the existing,
  gated instrumentation of the exact window.
- `stores/notifications.ts` (anchor `four-passes`): the commit awaits four parallel schedule
  passes over both schedules plus the stale sweep.
- `stores/notifications.ts` (anchor `saturation-comment`): the recorded measurement: "the
  timeline build saturates the JS thread ~0.5s per schedule on the A12 and used to land exactly
  on the sheet-dismiss home reveal". The same saturation window the late buzz lands in. The same
  file already carries the repo's deferral idiom for it: defer the work past the next paint
  (requestAnimationFrame, then setTimeout).
- `shared/perf.ts` (anchor `perf-gate`): `perfMark` and `perfMeasure` are no-ops unless
  `EXPO_PUBLIC_PERF_MONITOR=1`; marks stream to syslog with the `Athan` tag.
- Every haptic in the app, mapped: the sound rows' Medium impacts (`SoundItem.tsx:94,99`), the
  shared Sheet close Light (`Sheet.tsx:180`), the qibla pair (`useQibla.ts:218`,
  `Qibla.tsx:149`), the prayer row (`Prayer.tsx:75`), the bell (`components/prayer/Alert.tsx:149`), the overlay
  close (`Overlay.tsx:44`), the settings button and rows, the colour picker. None sits on the
  commit path.
- The re-arm path's fire-time guards, for the reproduction's reading:
  `stores/notifications.ts:843` arms any prayer whose instant has not yet passed, with none of
  the reminders' 30-second future buffer, so the dev build's near-term mock prayers are armed to
  fire imminently; the reminders skip inside 30 seconds
  (`stores/notifications.ts:1031-1055`). This is reading context for verdict N only; this
  ticket changes none of it.
- Tooling: `e2e/device-atlas-iphone-xs.md` carries the XS recipes (devicectl install, pymobiledevice3
  syslog live, the `Athan` tag). The iOS simulator delivers local notifications (the foreground
  handler shows banners) but has no haptics: the buzz itself cannot reproduce there, the timing
  chain can.

Existing tests: the Sheet and Sound suites cover the dismiss paths and the sheet's close haptic
rule; the perf mocks in neighbouring suites (Navigation's suite asserts `perfMeasure` calls)
show the mocking idiom. The executor maps the exact test files at red-test time from the two
source files' imports.

Why the obvious fixes are wrong: moving the haptic to close start contradicts the owner's
2026-09-08 rule (buzzing at drag start felt detached); removing the haptic contradicts D104.2
(she keeps the immediate buzz); a completion haptic after the commit contradicts D104.2 and
reproduces the reported defect on purpose; awaiting the impact inside the shared `Sheet.tsx`
handler changes the same-tick semantics for every other sheet, including the alert sheet's
settled save-and-bounce ordering.

## 5. Design

Two phases. Diagnose first: instrument the close-haptic dispatch with gated PERF marks beside
the existing `sound_commit` marks, then read the timing chain twice, once on the simulator
(step 1) and once on the owner's XS with her on-demand reproduction (step 2). The two captures
discriminate the verdicts:

- verdict T, dispatch-side: the settle mark lands after `sound_commit_start`, inside or past
  the `sound_commit` window: the scheduling prefix took the thread before the impact's native
  ack returned.
- verdict T2, glass-only: the settle mark lands before `sound_commit_start` and the buzz moment
  the owner notes falls inside the `sound_commit` window: the dispatch acked on time and the
  native execution still queued behind the saturation.
- verdict N: a notification delivers at the buzz moment (banner lines, delivery identifiers).
- verdict X: the settle mark lands before `sound_commit_start` and her noted buzz moment falls
  outside the `sound_commit` window: neither delivery nor a dispatch or saturation overlap -
  the source is outside the app's calls.

Fix second, gated on the verdict: for T and T2 the sound sheet's dismiss defers the commit start
past the next paint, the repo's own idiom for this exact saturation class (the widget push at
`stores/notifications.ts:1612-1614`): requestAnimationFrame, then setTimeout, then the commit.
The close haptic keeps its tick and its meaning; the commit is already un-awaited, so when it
starts changes nothing the sheet or the user observes. Invariant, testable in one line: no
scheduling call of the dismiss-time commit begins before the close-haptic dispatch has left the
JS thread, and the unchanged-close path is byte-identical to today.

Concurrency trace: `handleDismiss` runs once per close. The scheduling lock
(`withSchedulingLock`, `stores/notifications.ts:1692`) serializes the commit against other
scheduling passes; deferring the commit start means the lock is acquired one paint later, so a
pass queued in that gap may take the lock first. That is benign by construction: the commit
re-arms everything from the selection it was handed, inside the lock, so whichever pass takes
the lock first is overwritten by the next, the same ordering that exists today for every other
caller.

Acceptance criteria:

- [R1.1] WHEN the sound sheet finishes closing with a changed selection THE SYSTEM SHALL dispatch the unified close haptic before any notification scheduling call of the dismiss-time commit begins.
- [R1.2] WHEN the sound sheet finishes closing with an unchanged selection THE SYSTEM SHALL run no commit and fire the close haptic exactly as today.
- [R1.3] WHEN the sound sheet closes on any path THE SYSTEM SHALL fire exactly one haptic for the close and none after the commit completes.
- [R2.1] WHEN a sheet's dismiss path runs with the perf monitor enabled THE SYSTEM SHALL emit marks bracketing the close-haptic dispatch and its native settle beside the existing `sound_commit` marks.
- [R3.1] WHEN the owner closes the sound sheet with a changed pick on the XS dev build after the fix THE SYSTEM SHALL deliver the buzz at the close animation's completion with no second buzz (her read, the acceptance).

## 6. Steps

Checklist:

- [ ] Step 1: the dispatch marks and the simulator diagnosis (`steps/1-instrument-and-diagnose.md`)
- [ ] Step 2: the XS reproduction with the owner, the capture and the verdict
  (`steps/2-xs-reproduction.md`)
- [ ] Step 3: the fix, gated on verdict T or T2 (`steps/3-fix.md`)
- [ ] Step 4: the owner's read after the fix (`steps/4-owner-read.md`)

Steps carry their own Requirements, Weight, anchor check, goal, branch, files, red tests, change
contracts, green run, break script, version and commit, review checklist, merge and done-when.

## 7. Device proof

Step 1 probes on the iOS simulator through xcodebuildmcp and agent-device with
`EXPO_PUBLIC_PERF_MONITOR=1` on the bundle, driving the sound sheet open, a changed pick, and
the close; PERF lines land in the Metro log. Step 2 builds the Release dev build from the atlas
recipe with the same flag, installs it on the XS through devicectl, and captures
`pymobiledevice3 syslog live` while the owner reproduces both close paths on demand. The capture
file and its transcription land under `$HOME/athan-gitree/sessions/104/`, never committed. No
clock changes. No alarm is read or armed by the lane itself: the reproduction is hers, on her
phone, and the capture is read-only.

## 8. Records

`LOG.md` carries the ledger: every step entry opens `### Step NN - <state>` and ends
`session: <ses_id>`; planning sections use `## Planning (2026-10-15)` and `## Ticket 104`. The
verdict of steps 1 and 2 is recorded with the mark timestamps and the exact log lines that
decided it. The queue cell the lead applies on DONE: "DONE <date>, audited: the close haptic
lands when the sheet finishes closing on every path - the changed-pick commit defers past the
next paint so the re-arm's thread saturation cannot eat the buzz (diagnosed by gated PERF marks
on the simulator and on the owner's XS capture; one buzz per close, none after the commit; the
unchanged close byte-identical)". The docs commit message: "<VERSION> - docs(plans): row 104
READY, the post-close haptic plan".

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | What it means | Action |
| --- | --- | --- |
| No PERF lines in the simulator log | The flag never reached the bundle (Metro caches env at serve time) | Restart Metro with the env set on the command; re-drive; do not edit `perf.ts` |
| No PERF lines in the XS syslog | The flag never reached the iOS bundle (the atlas recipe does not carry it) | Clear `node_modules/.cache/metro`, rebuild with the env on the build command, reinstall |
| The marks appear but the commit marks never do | The commit bailed before scheduling (empty cache path) | Re-open the sheet from Settings after a sync; if it repeats, record it and read the cache guard |
| Verdict N on either capture | A notification delivers at the buzz moment | STOP per 2.2, first row, with the delivery lines |
| Verdict X on both captures | Neither delivery nor a dispatch delay | STOP per 2.2, second row, with both captures |
| The ordering red test cannot go red | The commit is already deferred in a caller | STOP: the plan's premise moved; NEEDS REPLAN |
| Any `stores/notifications.ts` test fails after step 3 | The deferral changed scheduling behaviour, not just its start | STOP per 2.2, third row: the contract defers the call site, never the store's internals |

Anticipated review fixes, word for word:

- "Name the mark constants where they are introduced; string literals twice each is a typo
  waiting."
- "The deferral helper belongs beside `clearAudio` in the sound sheet, not in the shared Sheet:
  only this sheet's commit saturates."
- "Add the verdict to the commit message of step 3: a reader of history needs T or T2, not a
  plan lookup."

Restore lists: step 1 touches `components/sheets/parts/Sheet.tsx` and its test; step 3 touches
`components/sheets/screens/Sound.tsx` and its test; each break run restores its file from its own
backup copy (`mv <file>.break-104-backup <file>`). `git checkout uat -- <file>` is only for
abandoning a step entire, never after a break run: the break precedes the commit, so a checkout
there destroys the step's own work.

## 11. Subagents

Planning used `explore` for the ground map. Delivery: the lead dispatches `athan-executor` for
steps 1 and 3, and the build half of step 2; `athan-reviewer` twice (plan-conformance and
blind), plus one more blind pass focused on threading and lifecycle because the change rides a
dismiss-time async path. A worker that cannot see a screenshot calls `vision`. Nothing else,
ever.

## 12. Report to the owner

Plain sentences: what the captures showed, what the deferral changes, that the buzz now lands
with the close on every path and never twice, and that the unchanged close is untouched. Then
the progress table, then the four-line handoff block, nothing after it.
