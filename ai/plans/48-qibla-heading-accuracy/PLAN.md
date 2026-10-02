# Plan: Session 48. Where the heading comes from: research the alternatives, because the platform's own is not accurate enough

| Field | Value |
| --- | --- |
| Brief | `ai/plans/48-qibla-heading-accuracy/BRIEF.md` |
| Planned at | `ad131a51` (version 1.29.198), 2026-10-02 |
| Planned by | Planning session on 2026-10-02 |
| Needs first | 47 |
| Steps | 1 (the two step files run as ONE commit; see section 6) |
| Device | None in this plan. Step 2 ships a gate the owner judges on his own phones afterwards, and `DECISION.md` names the diagnostic that needs a native module he has not yet approved |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

The qibla compass points the right way about 95% of the time on both the owner's phones and **gives a
different answer on each app restart**, by 5, 10, 20 or 30 degrees at the same spot in the same orientation,
which is why he will not release it. This row was queued as RESEARCH, and the research is done: it is in
`MEASURED.md` (what this session computed), `FINDINGS.md` (what was read from platform source),
`agent-reports/` (three commissioned reports, each checked against this repository) and `DECISION.md` (the
conclusion). **The research found that the symptom has two halves: a cold sensor fusion the app can fix, and
iron in the room that no software can.** This plan ships the one measured fix for the first half, a settling
gate that refuses to draw a heading until the stream has converged, taking the error at first reading from
about 30 degrees to 0.71. When this plan is DONE the compass goes quiet for a few seconds on opening instead
of drawing a confident wrong arrow, and the owner can judge on his own phones whether the restarts now agree.

The owner's rules that apply, quoted:

🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy. No. I don't care about smoothness
anymore. Accuracy is number 1 importance." (2026-10-01)

🐋  "sometimes it's 20 degrees off, sometimes 30 degrees off. Sometimes 5 degrees, sometimes 10 degrees.
There's a lot of inconsistencies... I'm not happy settling with this yet." (2026-10-02)

🐋  "I want it to work, same as Android, Android phones, Android Google Maps... it should work in the whole
world." (2026-10-01), with the standing rule that follows from it: **no invented constant, no tuned offset,
no per-location calibration.**

🐋  "the comments should be extremely compact, and they should only explain the why, and they should never
explain the how or the what." (2026-09-26)

## 2. Decisions

### 2.1 Taken

1. **This row ships code rather than ending as research only.** Planner, 2026-10-02. The row was queued as a
   research row, and the research produced one change that is measured, cheap, and attacks the half of the
   owner's symptom that is attackable. Leaving it unshipped would mean a session that answered the question
   and changed nothing while the owner waits to release the feature.
2. **The gate tests DRIFT, never spread.** Planner, measured. A stream converging smoothly from 30 degrees of
   error is quiet between consecutive readings, so a spread gate passes it at 27.22 degrees wrong
   (`MEASURED.md` section 1). Recorded because it is session 47's lesson in a new place.
3. **The window is counted in TIME and must be SPANNED.** Planner, measured. A window counted in readings
   needs 120 seconds to open on a still phone, because `expo-location` suppresses anything within 2 degrees of
   the last reading on both platforms (`MEASURED.md` section 5). Without the span check the gate opens at
   29.18 degrees of error rather than 9.70 (`MEASURED.md` section 6).
4. **The numbers are 3000ms, 8 readings and 1.5 degrees.** Planner, measured across 50 runs per cell against
   a simulated `expo-location` stream carrying its real gate (`MEASURED.md` section 6). These are not tuned by
   eye: each was swept and the table of alternatives is in that section. They are thresholds on a measured
   residual, which the owner's no-constants rule permits, and none of them adjusts a heading.
5. **The field-magnitude and dip physics check is REJECTED and will not be built.** Planner, measured. It
   misses up to 30.8 degrees of heading error at a 10 uT offset, and is weakest at London's latitude
   (`MEASURED.md` section 4). Recorded here because session 40 specified it as a trustworthy lever and row 46
   still lists it as untried.
6. **The `event.values` by-reference item from session 40 is CLOSED as refuted**, on AOSP evidence that the
   `SensorEvent` pool is per-sensor-handle and that both registrations share one Looper
   (`agent-reports/R2-android.md`).
7. **No new dependency, no native module, and no permission change in this plan.** Planner. The gate is pure
   arithmetic. The diagnostic module `DECISION.md` recommends is a separate decision for the owner, because it
   adds native code to reach a number `expo-location` discards.
8. **The alignment haptic stays downstream of the gate.** Planner. A tap is the blind user's only signal, so
   it must never fire on a reading the app has refused to draw.

### 2.2 The executor must not decide

1. Any anchor count other than 1. Ask: "Anchor `<file>` counts `<n>` rather than 1. The plan is stale: should
   it be replanned?"
2. A test failing that this plan does not expect.
3. A break printing `BREAK NOT APPLIED`.
4. A reviewer finding that section 10 does not answer and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.
5. Anything a step does not answer that would otherwise be decided: "The plan does not say `<X>`. What should
   it be?"
6. Anything touching visuals, prayer times, a hand-edited release file, `uat` or EAS.
7. **Specific to this plan:** if the full suite reports any qibla test failing that this plan does not name,
   STOP. The qibla path is at 100% coverage across five suites and a surprise there means the gate changed
   behaviour the plan did not intend.

## 3. Pre-flight

Save to `$TMPDIR/preflight-48.sh` and run `bash $TMPDIR/preflight-48.sh <k>`, where `<k>` is the first step
in section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/bin/bash
set -u
STEP="${1:-1}"
cd /Users/muji/repos/rn.athan.uk || { echo "STOP: wrong checkout"; exit 1; }

BRANCH=$(git branch --show-current)
[ "$BRANCH" = "uat-2" ] || { echo "STOP: on $BRANCH, expected uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v 'ai/plans/README.md' | grep -v 'ai/plans/48-qibla-heading-accuracy/PLAN.md' | grep -v 'ai/plans/48-qibla-heading-accuracy/LOG.md')
[ -z "$DIRTY" ] && echo "tree clean" || { echo "STOP: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "STOP: uat-2 is not ahead of origin/uat-2"; exit 1; }
echo "uat-2 descends from origin/uat-2"

echo "version: $(node -e "console.log(require('./package.json').version)")"

grep -n '^| 47 ' ai/plans/README.md | grep -q 'DONE' && echo "needs-first row 47 is DONE" || { echo "STOP: row 47 is not DONE"; exit 1; }

count_anchor() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}

if [ "$STEP" -le 2 ]; then
  A=ai/plans/48-qibla-heading-accuracy/scripts/anchors
  for pair in "2-1-useQibla-processReading.txt hooks/useQibla.ts" \
              "2-2-useQibla-imports.txt hooks/useQibla.ts" \
              "2-3-useQibla-refs.txt hooks/useQibla.ts"; do
    set -- $pair
    N=$(count_anchor "$A/$1" "$2")
    echo "anchor $1 -> $2 : $N"
    [ "$N" = "1" ] || { echo "STOP: NEEDS REPLAN, anchor $1 counts $N"; exit 1; }
  done
fi

node -e "const p=require('./package.json');if(p.dependencies['expo-location']!=='58.0.9'){console.error('STOP: expo-location is '+p.dependencies['expo-location']+', expected 58.0.9');process.exit(1)}console.log('expo-location 58.0.9')"

echo PREFLIGHT OK
```

Expected last line `PREFLIGHT OK`. An anchor count other than 1 means NEEDS REPLAN. Any other failure means
STOP.

## 4. Background the executor needs

### Code map

| File | What it does |
| --- | --- |
| `device/qibla.ts` | The platform surface: permission, position, place name, and `watchHeading`, which wraps `Location.watchHeadingAsync` and passes `trueHeading` through |
| `hooks/useQibla.ts` | The sheet's whole behaviour. `processReading` is called per reading and decides alignment, the haptic, the shared value and `hasHeading` |
| `shared/qiblaAlignment.ts` | `alignmentOffset`, `isAligned`, `shouldTap`, and `NO_HEADING = -1` |
| `shared/qiblaCompass.ts` | The face's geometry and `unwrapHeading`, which keeps the dial from spinning the long way round |
| `shared/qiblaGeometry.ts` | `qiblaBearing`, the great-circle bearing. **Proven correct to 0.1 degrees and not touched by this plan** |
| `components/sheets/screens/Qibla.tsx` | Draws the sheet. `showsCompass = bearing !== null && hasHeading` |
| **NEW** `shared/qiblaSettle.ts` | This plan's only new file. Whether the stream has converged |

### Anchors

Saved in full under `scripts/anchors/`, each verified to count exactly 1 at `ad131a51`.

| Anchor | File | Line hint |
| --- | --- | --- |
| `2-1-useQibla-processReading.txt` | `hooks/useQibla.ts` | 104 |
| `2-2-useQibla-imports.txt` | `hooks/useQibla.ts` | 5 |
| `2-3-useQibla-refs.txt` | `hooks/useQibla.ts` | 61 |

### How the pieces interact

| Event | Order |
| --- | --- |
| Sheet opens | `start()` sets `activeRef`, requests permission, arms `watchHeading`, then reads the position |
| A reading arrives before the bearing exists | `processReading` stores it in `heldRef` and returns. **R3 flagged this: the EARLIEST reading is stored and replayed later at line 165, which is the worst one to keep** |
| A reading arrives with a bearing | Alignment, haptic, `heading.value`, `hasHeading = true` |
| `trueHeading === NO_HEADING` | Alignment cleared, a 1500ms grace timer before `hasHeading` goes false |
| Sheet closes | `stop()` clears the refs and unwatches |

### Existing tests

| Suite | Tests | What it proves |
| --- | --- | --- |
| `device/__tests__/qibla.test.ts` | 16 | The platform wrapper: permission order, the cached fix, the geocoder's failure, the watch's teardown |
| `components/sheets/screens/__tests__/Qibla.test.tsx` | 47 | The sheet end to end, including the haptic per crossing and the mid-await dismissal race |
| `shared/__tests__/qiblaAlignment.test.ts` | — | The enter and exit thresholds and the tap rule |
| `shared/__tests__/qiblaCompass.test.ts` | — | The face's geometry and `unwrapHeading` |
| `shared/__tests__/qiblaGeometry.test.ts` | — | The bearing, against published survey figures |

### Why the obvious simple fix is wrong

**"Wait a couple of seconds, then draw"** is a timer, and a timer cannot tell a converged stream from a
wandering one. `MEASURED.md` section 6 shows a stream that never converges being refused outright by the
drift gate, where a timer would draw it at 10.94 degrees of error.

**"Average the readings"** hides the problem rather than detecting it. The raw mean of a converging stream is
excellent (0.49 degrees) because the cold error decays, but the user is shown a live compass, not a mean, and
averaging a wandering stream produces a confident needle over a reading the phone cannot support.

**"Use the platform's accuracy band"** is not available: `expo-location` buckets the iOS value to 0 to 3
where bucket 3 spans 0 to 20 degrees, and on Android it reports the **accelerometer's** band rather than the
magnetometer's (`agent-reports/R2-android.md`). That is why `DECISION.md` makes reaching the real number a
separate, native-code decision for the owner.

## 5. Design

**The invariant, as one sentence a test can check:** the compass draws a heading only once the stream's
trailing 3000ms window holds at least 8 readings spanning at least nine tenths of that window whose two
halves agree within 1.5 degrees, and it draws nothing otherwise.

**The approach.** One new pure module, `shared/qiblaSettle.ts`, holding the window arithmetic. `useQibla`
keeps a trailing list of samples, and `processReading` consults the gate before it writes the shared value,
fires the haptic or sets `hasHeading`. Nothing else changes: the bearing, the face, the thresholds, the
sheet and the haptic rule are all untouched.

**Alternatives rejected**, each with its reason:

| Alternative | Why not |
| --- | --- |
| A spread or variance gate | Measured: passes a converging stream at 27.22 degrees of error (`MEASURED.md` 1) |
| A window counted in readings | Measured: 120 seconds to open on a still phone (`MEASURED.md` 5) |
| Waiting for platform silence | Measured: never opens beyond a 400ms quiet period (`MEASURED.md` 5) |
| A fixed delay before drawing | Cannot distinguish converged from wandering; would draw a wandering stream |
| The field-magnitude and dip check | Measured: misses 30.8 degrees, worst at London's latitude (`MEASURED.md` 4) |
| Switching the heading source | iOS is already on `CLHeading.trueHeading`, the value Apple Maps draws. Android's better source (FOP) needs native code and a `play-services-location` bump, which is a separate owner decision |

**The concurrency trace.** `processReading` is the only caller, and it is called from the watch callback.
Three orderings matter and each is covered by a named test:

| Ordering | Behaviour after this change |
| --- | --- |
| Readings arrive before the bearing | Still held, but the gate consumes samples from the first reading, so the window is already filling while the position resolves |
| `NO_HEADING` arrives mid-window | The samples are cleared, so a lost fix cannot leave a stale half-window that settles on resumption |
| The sheet closes mid-window | `stop()` clears the samples, so reopening starts a fresh window rather than settling instantly on the last session's readings |

**The design review**, done by this planning session reading its own design back cold on 2026-10-02:

| Finding | Change |
| --- | --- |
| The first draft's gate had no span check, so a fast burst settled instantly at full error | The span check was added and is now the module's load-bearing line, measured at 29.18 against 9.70 degrees |
| The first draft left the haptic upstream of the gate, so a blind user would feel a tap on a reading the screen refused to draw | The haptic moved downstream of the gate, and decision 2.1.8 records it |
| `stop()` not clearing the samples would let a reopened sheet settle on the previous session's window | `stop()` clears them, and a named test covers it |
| `NO_HEADING` not clearing the samples would let a stale half-window settle after a fix returns | It clears them, and a named test covers it |

## 6. Steps

- [ ] Step 1: The settling arithmetic AND the gate, in one commit (specified)

Its detail is in both step files, which are run together as one commit:

- `steps/1-settle-arithmetic.md`
- `steps/2-gate-the-compass.md`

**CORRECTED DURING EXECUTION, 2026-10-02: THE TWO STEPS ARE ONE COMMIT, AND THE PLAN WAS WRONG TO SPLIT
THEM.** The executing session ran step 1 exactly as written, and the pre-commit hook refused it:

```
FAIL unit shared/__tests__/unusedExports.test.ts
+   "hasSettled",
+   "trailingWindow",
```

`shared/__tests__/unusedExports.test.ts` fails the moment a module exports a symbol no production file
imports, and step 1 ships `shared/qiblaSettle.ts` with nothing importing it until step 2. Measured:
`python3 scripts/find-unused-exports.py` reports 7 unreachable exports after step 1 alone and the
pre-existing 5 once step 2's hook change lands.

**This is a defect in this plan, not in the executor**, and it is the third session running to meet it:
session 44 measured that its deletion could not be split for the same reason, and session 45 measured that
its whole feature was one commit because `unusedExports.test.ts` reports every new export as unreachable
until a production file imports it. Both wrote it down. This plan's section 6 split the work anyway.

So the two step files are run as ONE step: step 1's red, then step 2's change, then both break scripts, then
one commit carrying the message below. Everything else in both files stands, including every acceptance
criterion, and both break scripts are run and must each end `ALL AS EXPECTED: 1`.

**The combined commit message**, replacing the message in each step file:

```
<VERSION> - fix(qibla): the compass waits for the heading to settle before it draws

The owner's symptom: the same phone at the same spot read 5, 10, 20 or 30 degrees differently on
each app restart, which is why the feature is not released.

Half of that is a cold sensor fusion. A fused heading arms from cold and walks toward the truth,
and the app drew the first step of that walk: measured against a stream carrying expo-location's
own 2-degree and 50ms gate, the first reading is about 30 degrees out where the converged one is
0.71. `shared/qiblaSettle.ts` holds the gate, and the compass now draws nothing, and the haptic
fires nothing, until the stream's trailing 3000ms window holds 8 readings spanning the period
whose two halves agree within 1.5 degrees.

The gate tests DRIFT rather than spread, because a stream still converging is quiet between
consecutive readings: measured, a spread gate passes such a stream at 27.22 degrees of error.
Smoothness is not correctness, which is session 47's lesson in a new place. The window is counted
in TIME and must be SPANNED rather than merely filled: counting readings alone needs 120 seconds
to open on a still phone, because a converged stream emits almost nothing through the platform's
2-degree gate, and without the span check a fast stream fills the count in 400ms, which measured
29.18 degrees of error at the gate rather than 9.70.

`heldRef` is DELETED, and that is an improvement rather than a trade. It kept ONE reading to
replay once the bearing arrived; readings now enter the settling window before the bearing exists,
so the window fills DURING the position read instead of waiting for it.

The other half of the symptom is iron in the room and no software can fix it. That is measured
rather than asserted, and it retires the lever session 40 specified: a stable bias passes every
gate on the heading stream at 1.0x improvement, and the field-magnitude and dip check cannot bound
it either, missing 30.8 degrees at a 10 uT offset because a compass reads only the horizontal
field, 40% of the total at London. Detail in
`ai/plans/48-qibla-heading-accuracy/MEASURED.md` and `DECISION.md`.

18 of the sheet suite's 47 tests depended on one reading drawing the dial, and each was measured
rather than adjusted until green: a shared helper now reports a settled window, a separate helper
drives a lost heading without running down the dropout grace, and one test's name changed because
its behaviour genuinely did. Three tests were then added that drive the gate's refusal directly,
because the break script found that DELETING THE GATE still passed all 47: teaching the shared
helper to report a settled window had left no test able to tell a gated compass from an ungated
one.

The two steps this plan specified are ONE commit, because `unusedExports.test.ts` refuses a
module whose exports no production file imports yet. Sessions 44 and 45 both measured the same
thing about their own work; this plan split it anyway, and the correction is recorded in its
section 6.
```

## 7. Device proof

**None in this plan, deliberately.** The gate's effect is on the owner's own phones in his own house, which
is where the symptom lives, and the plan cannot reproduce his room. He judges it after this ships, which is
the same loop that accepted the compass in session 45.

What this plan proves instead is measurable without a device: the arithmetic is right (16 named tests, 100%
coverage, 10 of 10 breaks caught) and the sheet's behaviour is unchanged except where the plan intends
(the existing 47 sheet tests and 16 device tests stay green).

**The diagnostic that WOULD settle the remaining question is named in `DECISION.md` and not run here**,
because it needs a native module to reach `headingAccuracy` in degrees, which is a dependency decision for
the owner rather than a step in this plan.

## 8. Records

### Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md` under the exact heading `## Session 48: the heading settles before it is drawn`:

```markdown
## Session 48: the heading settles before it is drawn

The qibla compass refused to agree with itself across app restarts: the same phone at the same spot read 5,
10, 20 or 30 degrees differently each time the owner reopened the sheet. The research behind this session
divided that symptom in two, and only one half is the app's.

**The fixable half is a cold sensor fusion.** A fused heading arms from cold and walks toward the truth, and
the app drew the first step of that walk. Measured against a simulated stream carrying `expo-location`'s own
2-degree and 50ms gate, the first reading is about 30 degrees out where the converged one is 0.71.

`shared/qiblaSettle.ts` holds the gate. It tests DRIFT between the two halves of a trailing 3000ms window,
requires at least 8 readings, and requires the window to be SPANNED rather than merely filled.

Three negative results shaped it, and each would have shipped a worse gate:

- A SPREAD gate passes a smoothly converging stream at 27.22 degrees of error, because a stream still
  converging is quiet between consecutive readings. Smoothness is not correctness.
- A window counted in READINGS needs 120 seconds to open on a still phone, because the platform suppresses
  anything within 2 degrees of the last reading and a converged stream emits almost nothing: at 0.5 degrees
  of jitter only 0.1% of readings survive that gate.
- The SPAN requirement was found by a defect in the plan's own first gate. Without it a fast stream fills the
  count in 400ms, and the 8-second convergence opened at 29.18 degrees rather than 9.70 while the indoor
  jittery case read 22.19 rather than 3.52.

**The unfixable half is iron in the room**, and this is recorded so no later session spends a session on it.
No gate reading the heading stream alone can see a STABLE bias, by construction: it is quiet and it is not
moving, which is what settled means, and it was measured passing every gate at 1.0x improvement. **The
field-magnitude and dip physics check cannot bound it either, which retires the lever session 40 specified
and row 46 still lists as untried.** Swept over every offset direction and every phone heading, a 10 uT
offset swings the heading 30.8 degrees and passes gates of 10% on magnitude and 5 degrees on dip. The reason
generalises: a compass reads only the HORIZONTAL field, which at London is 40% of the total, and an offset
adds linearly to that component and in quadrature to the total, so 20 uT costs 45.7 degrees of heading and
8.0% of magnitude. The check is weakest exactly where the owner lives and weaker still toward the poles.

Apple states the limit in its own documentation: calibration "is able to filter out only those magnetic
fields that move with the device", so a field fixed in the room is indistinguishable from the earth's by any
software.

**What the research established about the platform, read from source rather than inferred.** `expo-location`
58.0.9 is faithful to `CLHeading` on iOS: `DeviceHeadingStreamer.swift` yields the raw value and
`BaseLocationProvider.swift` configures nothing, so the XS is already on the value Apple Maps draws and
there is no module bug to fix there. On Android the same API is accelerometer plus magnetometer with **no
gyroscope**, fused in Kotlin inside the module, so `watchHeadingAsync` is not symmetric across platforms and
no single swap could have fixed both.

Four smaller real defects were found and are recorded rather than fixed, each with its measured magnitude:
`DeviceHeadingStreamer` never calls `startUpdatingLocation` on its own manager, which Apple requires for a
valid `trueHeading`, worth about 1.2 degrees in London and more at high declination;
`onAccuracyChanged` has no sensor-type guard, so the Android accuracy this app receives is usually the
ACCELEROMETER's, which explains session 40's band 3 while 71 degrees wrong; `calcTrueNorth` does not
normalise and Kotlin's `%` keeps the sign, so a negative declination near north returns a negative heading
that collides with this app's own `NO_HEADING = -1`; and the app never gates on `headingAccuracy < 0`, which
Apple's own sample does unconditionally.

Two open items from earlier sessions are CLOSED. The `event.values` by-reference storage session 40 flagged
is refuted: AOSP allocates one `SensorEvent` per sensor handle and both of the module's registrations share
one Looper, so the arrays can never alias and delivery is serialized, verified in the Android 9 tree. And
the proposal to revisit Reanimated's gyro-fused sensor on a mirrored-sign theory is refuted three ways:
session 47's own `headingFromYaw` negated the yaw back, a test pinned it, and a mirror predicts a 122 degree
error at the London qibla rather than the 5 and 34 that were measured.

Suite after: <TESTS_AFTER> tests across <SUITES_AFTER> suites, 100% on all four measures.
```

### Table rows

The executor sets the `ai/plans/README.md` row to EXECUTED. For the auditor to apply on PASS, the
`ai/prompts/README.md` row text is:

```
DONE 2026-10-02. The heading settles before it is drawn, and the half of the symptom that is not fixable is measured and recorded rather than left for another session.
```

### Docs commit

`<VERSION> - docs(plans): session 48 executed, the heading settles before it is drawn`

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes
`uat-2` after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts other than 1 | `hooks/useQibla.ts` changed since `ad131a51` | NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4) |
| A `Qibla.test.tsx` test fails that this plan does not name | The gate changed sheet behaviour the plan did not intend | STOP and ask. Do not edit the test |
| `hasHeading` never becomes true in a sheet test | The test's readings do not span the window, so the gate correctly refuses | Expected for a test that sends one reading. Section 2.2 item 7 applies if a test the plan did NOT name fails |
| A break prints `BREAK NOT APPLIED` | The substitution does not match the code written | STOP and ask. Never reshape the code to fit a break |
| Coverage below 100% on `shared/qiblaSettle.ts` | A branch the named tests do not reach | STOP and ask. Never add an ignore comment |
| Anything else | | `EXECUTOR-BRIEF.md` section 7's table |

### Anticipated review fixes

Word for word, and these are the only fixes the executor may make to anything this plan fixed:

1. **If a comment in `shared/qiblaSettle.ts` explains WHAT the code does rather than WHY**, delete that
   comment. The owner's rule is why-only and extremely compact.
2. **If `trailingWindow` is called more than once per reading**, hoist it to a single call and pass the
   result. One reading, one window.
3. **If the samples array grows without bound**, drop anything older than the window when appending rather
   than only when reading, so a long sheet session cannot accumulate.

Anything else: `EXECUTOR-BRIEF.md` section 4, item 8's three conditions decide, and a finding that does not
meet all three is a STOP.

### Stopping part-way

| Step | Restore | Delete |
| --- | --- | --- |
| 1 | `git checkout -- app.json package.json` | `shared/qiblaSettle.ts`, `shared/__tests__/qiblaSettle.test.ts` |
| 2 | `git checkout -- hooks/useQibla.ts app.json package.json` | Nothing |

## 11. Subagents in this plan

**None.** The session does its own execution, review and audit (owner, 2026-09-26). The three research
reports under `agent-reports/` were commissioned by the planning session under the owner's explicit
authorisation of 2026-10-02 and are already incorporated, with every correction recorded; the executor reads
them rather than commissioning any.

No image needs reading in this plan, so `vision` is not named either.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, and
carries:

- what changed and what was proven, in a few plain sentences, including that the gate attacks the
  per-restart half of his symptom and that the residual from iron in his house is measured as unfixable;
- the progress table in `EXECUTOR-BRIEF.md`'s format;
- that the next thing needing his decision is whether to add the native diagnostic module `DECISION.md`
  recommends, because `headingAccuracy` in degrees cannot be reached through `expo-location`;
- the four-line handoff from the `athan-next` skill, section 5.
