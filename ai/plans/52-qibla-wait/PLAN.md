# Plan: Session 52. The qibla wait: one-line subtitle, an instant warm reopen, and why 3 seconds stays

| Field | Value |
| --- | --- |
| Brief | `ai/plans/NEXT-SESSION-QIBLA-CRASH.md` (section 7 holds the open questions) |
| Planned at | `e0ba6125` (version 1.29.235), 2026-10-03 |
| Planned by | Planning session on 2026-10-03 |
| Needs first | nothing |
| Steps | 3, each one branch, one commit, one version |
| Device | OnePlus 3T, mock build, for the convergence measurement in section 7 |
| Owner decisions still needed | None. Nine were taken on 2026-10-03; see section 2.1 |

**Read `MEASURED.md` first, then `RESEARCH.md`.** Two of the row's own premises are refuted there, and one
claim this session made to the owner was wrong and he caught it. The design follows from those corrections.

## 1. Goal

The owner accepted 1.29.233 on both phones and then asked whether the wait could be shorter: 🐋 "Both phones
work fantastically. I tested both. They both work accurately 100%. I love it, very smooth, fantastic,
amazing." Nothing is broken. Three things are worth changing, and each was measured to cost nothing.

**Today:** the compass subtitle *Hold flat, turn until it vibrates* wraps to two lines on the 3T, so the sheet
header changes height when the compass arrives and the cross-fade is not a pure fade. Every open of the sheet
pays the full settling wait, including a reopen seconds later in the same spot where the heading has not moved.
And the success haptic fires whenever the compass appears, which on an instant open would fire as part of the
sheet opening.

**When this plan is DONE:** the subtitle reads *Hold flat and turn slowly* on one line at every text size the
app supports; a reopen whose first eight readings agree with the heading the sheet last drew paints the compass
on its first frame with no animation and no haptic; and a reopen after the user has moved still pays the full
gate. `SETTLE_WINDOW_MS` is unchanged at 3000ms, and `MEASURED.md` section 3 records why.

**How the owner notices:** the header no longer grows when the compass arrives; closing the sheet and opening
it again in the same spot shows the compass at once instead of the animation; and walking to another room
before reopening still shows the animation.

### The owner's rules that apply

🐋 "we want accuracy, 1000% accuracy, always, always, always accuracy. No. I don't care about smoothness
anymore." (2026-10-02, row 48)

🐋 "Always accuracy, never trade it for speed" (2026-10-03, this session's decision 9): a speed win ships only
when it costs nothing in degrees.

🐋 "the comments should be extremely compact, and they should only explain the why, and they should never
explain the how or the what" (2026-09-26, `ai/AGENTS.md` section 15).

🐋 "we don't want to lock it... what if the magnetometer doesn't actually work the first time" (row 52
handoff section 4c): anything gating this screen must fail OPEN.

**And the rule this session's own research earned, which binds the next heading session:** the error at the
instant a gate opens is not a user-facing quantity. The user-facing quantity is the error at the moment the app
makes a claim, which on this screen is the alignment haptic. See `RESEARCH.md` Part 1.

## 2. Decisions

### 2.1 Taken

1. **The subtitle becomes `Hold flat and turn slowly`.** Owner, 2026-10-03, choosing from five candidates. His
   dictated phrase (*Hold flat and turn until it vibrates*, 35 characters) is longer than the one that already
   wraps (32), so it could not fit; this keeps both of his ideas at 25 characters. Recorded in
   `ai/prompts/README.md`.
2. **`SETTLE_WINDOW_MS` stays at 3000ms.** Owner, 2026-10-03, choosing "keep 3000ms, chase the warm reopen".
   Justified by measurement rather than preference: it is the shortest window whose p95 error fits
   `ALIGNMENT_ENTER_DEGREES = 4` (`MEASURED.md` section 3).
3. **A warm reopen draws the compass instantly, with no animation at all.** Owner, 2026-10-03.
4. **No success haptic on an instant open.** Owner, 2026-10-03. Nothing arrived, so there is nothing to
   announce. The alignment haptic is untouched.
5. **A fail-open path shows a visible warning rather than failing silently.** Owner, 2026-10-03. **Not built in
   this session**, because decision 6 removed the gate that would have needed it; recorded so the next session
   does not re-ask.
6. **The motion-rejecting gate is VOID.** Owner chose it on 2026-10-03, and this session's own measurements
   then refuted it before any code was written: no stream-only gate separates a 60-degree wave from a
   12-degree hand sway, and every shape tried refused a hand-held phone 100% of the time (`MEASURED.md`
   section 5). The owner then challenged the defect it was meant to fix and was right: the user-experienced
   error is 0.70 degrees still against 0.73 waving (`RESEARCH.md` Part 1). **Planner's ruling: a fix for a
   defect that does not reach the user, built on a mechanism measured not to work, does not ship.**
7. **The wave hint and its animation STAY, unchanged.** Owner asked whether to replace it with a flat hint and
   a new flat animation. Answered with NXP AN4246's own least-squares fit per gesture: a flat still phone
   leaves 497.6% of the hard-iron offset unremoved against the figure of eight's 1.3%, and a flat phone turning
   on the spot lies on a circle, which does not determine a sphere's centre (`RESEARCH.md` Part 2). The
   redesign he deferred stays deferred (decision 8).
8. **The wave animation is not redesigned in this session.** Owner, 2026-10-03.
9. **Accuracy is never traded for speed without asking.** Owner, 2026-10-03. This is what rules out the
   13-second time floor (`MEASURED.md` section 6) and what makes all three shipped changes admissible: each
   costs zero degrees.
10. **The 13-second time floor is recorded, not shipped.** Planner, because decision 9 forbids adding up to 3.5
    seconds to every open on two phones the owner has judged accurate, to improve a number no user reads. It
    is the right fix for a slow-fusion phone, and section 7 measures whether either phone is one.

### 2.2 The executor must not decide

The executor STOPs and asks the owner when any of these happens. `EXECUTOR-BRIEF.md` section 4, item 8 governs
reviewer findings and is never restated here in other words.

1. **Any anchor count other than 1.** This means NEEDS REPLAN, not a search for the moved code. Ask: "Anchor
   `<file>` counts `<n>`, not 1. `uat-2` has moved under the plan. Replan?"
2. **A test failing that this plan does not predict.** Ask: "`<test name>` fails with `<first failing line>`,
   which step `<k>` does not predict. What should it be?"
3. **A break printing `BREAK NOT APPLIED`.** Ask: "Break `<label>` changed no bytes, so it tested nothing. The
   plan's search text no longer matches. Replan?"
4. **Anything the step does not answer.** Ask: "The plan does not say `<X>`. What should it be?"
5. **Any change to a visual the owner has approved**, which on this screen is the dial, the Kaaba, the needle,
   the palettes, the wave drawing and every spacing constant. The subtitle text in step 1 is the single
   exception and its exact string is given. Ask before touching anything else.
6. **A prayer time, a hand-edited release file, `uat`, or EAS.** Never, under any circumstance.
7. **The device measurement in section 7 reporting a time constant over 6000ms on either phone.** That is the
   regime where waving genuinely harms the user (99.7% false taps, `RESEARCH.md` Part 1). Ask: "The 3T's
   fusion converges on a `<N>`ms time constant, which is the slow regime. `MEASURED.md` section 6 has a
   13-second floor measured for exactly this. Ship it in a follow-up session?"

## 3. Pre-flight

Save as `$TMPDIR/preflight-52.sh` and run `bash $TMPDIR/preflight-52.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a fresh run).

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || { echo "STOP: wrong checkout"; exit 1; }

STEP="${1:-1}"
FAIL=0
note() { echo "  $1"; }
bad() { echo "FAIL: $1"; FAIL=1; }

[ "$(git rev-parse --abbrev-ref HEAD)" = "uat-2" ] || bad "not on uat-2"

DIRTY=$(git status --porcelain | grep -v -E '^\?\? ai/plans/52-qibla-wait/|^ M ai/plans/README.md$|^ M ai/plans/52-qibla-wait/' || true)
[ -z "$DIRTY" ] && note "tree clean apart from this plan" || bad "unexpected changes:
$DIRTY"

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 && note "uat-2 contains origin/uat-2" || bad "uat-2 is behind origin/uat-2"

VERSION=$(node -p "require('./package.json').version")
note "package.json version $VERSION (planned at 1.29.235; never lower)"
node -e 'const v=require("./package.json").version.split(".").map(Number);const p=[1,29,235];for(let i=0;i<3;i++){if(v[i]>p[i])process.exit(0);if(v[i]<p[i])process.exit(1);}process.exit(0)' \
  || bad "version $VERSION is lower than the planned 1.29.235"

count() {
  python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$1" "$2"
}
check_anchor() {
  local label="$1" anchor="$2" source="$3"
  local n
  n=$(count "$anchor" "$source")
  [ "$n" = "1" ] && note "anchor $label counts 1" || bad "anchor $label counts $n, not 1 -> NEEDS REPLAN"
}

A=ai/plans/52-qibla-wait/scripts/anchors
[ "$STEP" -le 1 ] && check_anchor 1-1 $A/1-1.txt components/sheets/screens/Qibla.tsx
[ "$STEP" -le 2 ] && check_anchor 2-1 $A/2-1.txt hooks/useQibla.ts
[ "$STEP" -le 3 ] && check_anchor 3-1 $A/3-1.txt components/sheets/screens/Qibla.tsx

adb -s 8f7ada76 get-state 2>/dev/null | grep -qx device \
  && note "3T reachable" \
  || note "3T not reachable (steps 1 to 3 do not need it; section 7 does)"

[ "$FAIL" = "0" ] && echo "PREFLIGHT OK" || { echo "PREFLIGHT FAILED"; exit 1; }
```

An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does | Changed by |
| --- | --- | --- |
| `components/sheets/screens/Qibla.tsx` | The sheet. Holds `QiblaSubtitle` (the cross-fade), `QiblaCalibration` (the wave hint), the success-haptic effect, and chooses between compass, hint and refusal | Steps 1 and 3 |
| `hooks/useQibla.ts` | The whole behaviour: permission, position, the heading watch, the settling latch, alignment and the haptic | Step 2 |
| `shared/qiblaSettle.ts` | `SETTLE_WINDOW_MS`, `SETTLE_MIN_READINGS`, `SETTLE_DRIFT_DEGREES`, `trailingWindow`, `hasSettled`, `circularMean`, `headingDelta` | Step 2 adds to it; no existing export changes |
| `shared/qiblaAlignment.ts` | `ALIGNMENT_ENTER_DEGREES = 4`, `ALIGNMENT_EXIT_DEGREES = 8`, `NO_HEADING = -1`, `alignmentOffset`, `isAligned`, `shouldTap` | Read only. It is what justifies 3000ms |
| `device/qibla.ts` | `watchHeading` over `Location.watchHeadingAsync`, `readPosition`, `readPlaceName`, `requestQiblaPermission` | Read only |
| `patches/expo-location+58.0.9.patch` | Removes the 2-degree gate, raises the rate to `SENSOR_DELAY_GAME`, sets `kCLHeadingFilterNone`. **Leaves `TIME_DELTA = 50f`**, which is why the rate is not a lever | Read only |

### Anchors

Each is saved in full under `ai/plans/52-qibla-wait/scripts/anchors/` and counts exactly 1 at `e0ba6125`.

| Anchor | File | Line at "Planned at" (hint only) |
| --- | --- | --- |
| `1-1.txt` | `components/sheets/screens/Qibla.tsx` | 75 to 77 |
| `2-1.txt` | `hooks/useQibla.ts` | 129 to 130 |
| `3-1.txt` | `components/sheets/screens/Qibla.tsx` | 118 to 122 |

### How the pieces interact

`Settings.tsx` asks for permission on the Qibla tap, then calls `showQiblaSheet()`. The sheet's `onPresent`
runs `start()` and its `onDismiss` runs `stop()`.

| Order | What happens | State after |
| --- | --- | --- |
| 1 | `start()` sets `activeRef`, clears `bearingRef` | nothing drawn |
| 2 | `watchHeading` is armed, not awaited | readings may begin before the bearing exists |
| 3 | A remembered position draws its bearing at once | `bearing` set, `hasHeading` still false |
| 4 | `readPosition()` resolves; the watch's unwatch is stored | the hint is up |
| 5 | Each reading appends to `samplesRef`, then `hasSettled` is tested once | the gate latches on first pass |
| 6 | After the latch, every reading drives alignment and the dial | compass up |
| 7 | `stop()` clears `samplesRef`, `settledRef` and `hasHeading`, and tears the watch down | nothing drawn |

**The concurrency trap step 2 must respect.** A reading can arrive before `bearingRef` is set (step 2 before
step 3), and `processReading` returns early in that case **after** appending to the window. So the window fills
during the position read, which is deliberate and must not change.

**The teardown trap.** `stop()` already clears `settledRef` and `samplesRef`. Step 2's remembered heading must
survive `stop()`, because it is the whole point, so it is stored in a ref that `stop()` does not clear. An
executor that clears it alongside the others has built nothing.

### Existing tests over this code

| File | What it proves |
| --- | --- |
| `shared/__tests__/qiblaSettle.test.ts` | 11 tests: `circularMean` across north, `headingDelta` both ways, `trailingWindow`'s edge, and `hasSettled`'s minimum, span and drift rules |
| `components/sheets/screens/__tests__/Qibla.test.tsx` | The sheet: what draws when, the latch's behaviour through the mocked hook, the refusal path, the place line |
| `components/sheets/screens/__tests__/QiblaDiagnostic.test.tsx` | The diagnostic flag's gated readout |
| `shared/__tests__/qiblaAlignment.test.ts` | The two thresholds, and that one threshold alone chatters |

### Why the obvious simple fix is wrong

**Shortening `SETTLE_WINDOW_MS` is the obvious fix and it is wrong.** The error at the moment the compass
appears rises linearly as the window shrinks, and at 2000ms the p95 is 5.51 degrees against an alignment window
of 4, so the haptic would fire while the user is outside it (`MEASURED.md` section 3).

**Assuming a reopen is warm because it happened recently is also wrong.** The OS fusion may have been reset,
the user may have walked into a different magnetic environment, or the phone may simply be pointing elsewhere.
Step 2 therefore **verifies** the remembered heading against live readings rather than trusting elapsed time,
and a phone that has moved 5 degrees or more falls through to the full gate (`MEASURED.md` section 7).

## 5. Design

**The invariant, as one sentence a test can check:** the compass draws without the settling wait only when the
mean of the first `WARM_CONFIRM_READINGS` readings of a reopen is within `WARM_TOLERANCE_DEGREES` of the
heading the sheet last drew, and in every other case the settling gate alone decides.

**The approach.** The sheet remembers the last heading it drew, in a ref that survives `stop()`. On a reopen,
the first eight readings are collected and their circular mean compared with that remembered heading. Within 3
degrees, the gate is considered already satisfied and the compass draws; otherwise the remembered heading is
discarded and the normal gate runs untouched.

Eight readings at 3 degrees is the first cell that agreed on every run across every jitter level, so it is the
first that does not sometimes discard a genuinely warm stream, and it refuses a phone that has moved 5 degrees
or more every time (`MEASURED.md` section 7). At the ~14Hz the gate actually receives, eight readings is about
420ms, which is inside the sheet's own open animation.

**Why this is free in degrees.** A reopen that draws instantly draws on a stream that has been **measured** to
agree with a heading which itself passed the full 3000ms gate. The accuracy is the accuracy of that earlier
open. Nothing is assumed about elapsed time, the OS, or the user.

### Alternatives rejected

| Alternative | Why not |
| --- | --- |
| Shorten `SETTLE_WINDOW_MS` to 1500 or 2000ms | p95 error 8.01 and 5.51 degrees against a 4-degree alignment window. Decision 9 forbids it |
| Drop to 25Hz and halve the window | The gate sees ~14Hz at any sensor rate, because `TIME_DELTA = 50f` survives the patch. 1.4% faster, and it costs the smoothness row 50 measured |
| A grace period: instant if the sheet closed under N seconds ago | Trusts elapsed time instead of measuring. A phone can be turned, moved or reset inside any N |
| Range or spread cap beside the drift test | Refuses a hand-held phone 100% of the time at a 15-degree cap (`MEASURED.md` section 5) |
| More window segments | One cell of fifteen met the accuracy bar and it refuses a hand 100% of the time |
| The 13-second time floor | Correct for a slow-fusion phone and unconfirmed on either of his. Adds up to 3.5s to every open. Recorded, not shipped (decision 10) |
| Replace the wave hint with a flat hint | A flat still phone cannot calibrate: 497.6% of the offset unremoved against the figure of eight's 1.3% (`RESEARCH.md` Part 2) |
| Keep the haptic on an instant open | It announces an arrival. On an instant open nothing arrived (decision 4) |

### The concurrency trace, after the change

| Caller | Before | After |
| --- | --- | --- |
| First ever open | gate decides | unchanged: no remembered heading exists |
| Reopen, same spot, phone still | gate decides, ~2.7s | eight readings agree, compass on the first frame, no haptic |
| Reopen after turning 90 degrees | gate decides | eight readings disagree, remembered heading discarded, gate decides |
| Reopen after a lost fix | gate decides | `NO_HEADING` clears the window as today; the remembered heading is discarded on the first disagreement |
| Sheet closed mid-confirmation | `activeRef` guards every write | unchanged: the same guard covers the new path |

### The design review

Reviewed by this session on 2026-10-03, reading the design and the code map cold and attacking it.

**Four findings, all fixed in this plan before any code:**

1. **A remembered heading must not survive a `NO_HEADING` run.** If the fix is lost and regained, the phone may
   have been carried. Fixed: the confirmation compares against live readings, and a lost fix clears the
   confirmation buffer exactly as it already clears `samplesRef`.
2. **The confirmation must not fire twice in one visit.** Once the compass is up the latch owns the decision, or
   a later reading could re-enter the confirmation path and re-trigger the instant draw. Fixed: the
   confirmation is attempted only while `settledRef` is false, and sets it on success.
3. **The warm path must not skip the bearing check.** An instant draw with `bearingRef` still null would draw a
   dial with no qibla on it. Fixed: the existing `bearing === null` early return sits above the confirmation,
   so it is structurally impossible.
4. **The haptic suppression must key on the instant path, not on elapsed time.** A cold open that happens to be
   fast is still an arrival. Fixed: the hook reports whether the compass arrived warm, and the sheet keys the
   haptic on that flag.

## 6. Steps

- [ ] Step 1: The compass subtitle fits one line (specified)
- [ ] Step 2: A verified warm reopen draws the compass at once (specified)
- [ ] Step 3: No success haptic on an instant open (specified)

Each step is in `steps/`:

- `steps/1-subtitle-one-line.md`
- `steps/2-warm-reopen.md`
- `steps/3-no-haptic-on-instant-open.md`

## 7. Device proof

**Purpose: measure the fusion's real convergence time constant on the 3T.** This is the one number that decides
whether `MEASURED.md` section 6's 13-second floor is needed, and nothing in this programme has measured it. It
is also the number that decides whether waving the phone genuinely harms the owner (`RESEARCH.md` Part 1).

**The cable is honest for this measurement, and that is not an exception to session 49's rule.** That rule says
a tethered phone's absolute heading is evidence about nothing, because the laptop's field biases it. This
measures how the heading **changes over time from a cold start**, and a stationary magnetic bias is a constant
that drops out of a rate. The absolute value is discarded; only the decay is read.

### Build and install

```bash
zsh ~/athan-device-sweep/session3/bin/build-mock.zsh uat-2 mocks/simple.ts ~/athan-device-sweep/session52/mock.apk
```
Success ends `BUILD-MOCK OK`. Then:
```bash
adb -s 8f7ada76 install -r ~/athan-device-sweep/session52/mock.apk
```
Expect `Success`.

### Safety, before anything else

No clock change is made in this session, so no armed alarm can be fired by it. Read the alarms anyway, so the
reading exists if a later session needs it:

```bash
adb -s 8f7ada76 shell dumpsys alarm | grep -c 'Alarm{' | tee ~/athan-device-sweep/session52/alarms-before.txt
```
Every 3T dump also lists one app alarm at `when 2104803640505` (year 2036, not identified). Expect a non-zero
count and take no action on it.

### The measurement

1. Confirm the heading owns its sensors alone, which is the rule session 52 earned:
   ```bash
   adb -s 8f7ada76 shell dumpsys sensorservice | grep -A6 'Connection Number' | tee ~/athan-device-sweep/session52/sensors.txt
   ```
   Expect the app's connection to list exactly one accelerometer and one magnetometer. `active-count` on
   `0x00000001` may read 2, and the second holder is Google Play Services'
   `com.google.android.location.collectionlib.BatchSignalCollector`, not this app. Count the per-connection
   list, never the aggregate.

2. Open the qibla sheet with the phone lying still on a non-magnetic surface, and capture the heading stream:
   ```bash
   adb -s 8f7ada76 logcat -c
   adb -s 8f7ada76 logcat -v time | grep -i 'heading' | tee ~/athan-device-sweep/session52/heading-stream.txt
   ```
   Let it run 30 seconds, then stop it.

3. **If the app logs no heading line**, the mock build's Pino logger is disabled outside dev and the stream
   cannot be read this way. In that case record `heading-stream.txt` as empty, write in `LOG.md` that the time
   constant is UNMEASURED and why, and leave decision 10 as it stands. **Do not add a log line to the app to
   get this measurement**: that is a code change outside the three steps and section 2.2 item 4 applies.

4. Fit the decay, if a stream was captured:
   ```bash
   node ai/plans/52-qibla-wait/scripts/probes/fit-tau.mjs ~/athan-device-sweep/session52/heading-stream.txt
   ```
   It prints `TAU_MS: <n>` and `SAMPLES: <n>`. A `TAU_MS` over 6000 triggers section 2.2 item 7.

### The phone is left on

The mock build, with automatic time ON (it was never turned off). The owner's own build is **not** restored by
this session, and `LOG.md` says so, because he installs what he tests.

## 8. Records

### Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md` under the exact heading
`### Session 52: the qibla wait, measured rather than shortened`:

```markdown
**The row asked whether the settling gate's 3 seconds could shrink, and the answer is no, with the arithmetic
to show why.** `SETTLE_WINDOW_MS` is not a timer: the gate opens once the heading's drift across a trailing
3000ms window is under 1.5 degrees, which on a cold fusion takes 9.7 seconds, and that is the wait the owner
was actually asking about. **Shrinking it costs accuracy linearly and 3000ms is the shortest value whose p95
error fits `ALIGNMENT_ENTER_DEGREES = 4`** (2000ms gives 5.51 degrees, 2500ms gives 4.02, 3000ms gives 3.02),
so the constant is now justified by the app's own alignment window rather than by preference. **The row's
premise that 50Hz sets the wait is refuted by the patch's own code**: `patches/expo-location+58.0.9.patch`
leaves `TIME_DELTA = 50f` in place, so the gate receives ~14Hz at any sensor rate, and dropping to 25Hz changes
the wait by 1.4% while costing the smoothness row 50 measured on the device. **THE OWNER CAUGHT A WRONG CLAIM
AND WAS RIGHT, and it is the most valuable thing in this row.** This session told him that waving the phone
during the animation costs a 4x worse reading, repeating row 50's own figure. He answered that he shakes his
phone on every test and feels no penalty. He is right: that figure measures the error at the instant the gate
OPENS, and the gate LATCHES, so the fusion keeps converging while the user turns toward the qibla. Simulating
the whole visit including the turn, **the true error at the moment the app fires the alignment haptic is 0.70
degrees for a still user and 0.73 for a waving one, with zero false taps in 300 runs each.** The durable rule:
the error at the instant a gate opens is not a user-facing quantity, and the user-facing one is the error at
the moment the app makes a claim. **The gate IS gameable on paper and the measurement bounds where that
matters**: it is defeated by any motion and by noise, so a noisier phone opens EARLIER at a HIGHER error (jitter
0.5 opens at 9705ms, jitter 5 at 7453ms), and in the one regime where the fusion converges slowly (an 8000ms
time constant) a waving user gets 99.7% false taps. That regime is unconfirmed on either of the owner's phones.
**Two stream-only fixes were measured and rejected**: a range cap refuses a hand-held phone 100% of the time at
15 degrees, and of fifteen window-and-segment combinations exactly one met the 4-degree bar and it also refuses
a hand 100% of the time. **The general result, which is session 48's own finding in a new place: a gate reading
the heading stream alone cannot separate the fusion's convergence from the user's motion, because a slow turn
and a slow drift are the same signal.** A 13-second time floor WAS measured to work (3.43 degrees worst case
across every user behaviour, refusing nobody) and is deliberately NOT shipped, because it adds up to 3.5
seconds to every open on two phones the owner has judged accurate. **THE WAVE HINT IS KEPT ON EXTERNAL
EVIDENCE rather than assumption, answering the owner's question about a flat hint**: running NXP AN4246's own
hard-iron least-squares fit per gesture, a flat still phone leaves **497.6%** of the offset unremoved and a
flat phone turning on the spot lies on a CIRCLE, which does not determine a sphere's centre, while the figure
of eight leaves 1.3% and a wrist-rolled figure of eight 1.3%. The trap in that table is "tilt up and down
only", which feels like diligent calibration and costs **176.90 degrees** of heading error. **Both platforms
were compared from their own headers on this machine** (iPhoneOS27.0.sdk, android-35): iOS reports
`headingAccuracy` in degrees with a negative value meaning invalid, and has an OS-drawn calibration alert
behind `locationManagerShouldDisplayHeadingCalibration:` that this app's users have never seen; Android offers
only a 0 to 3 accuracy band and no OS prompt at all, which is why every Android compass draws its own hint.
Neither is reachable through `expo-location`, which is row 51's work. **What shipped is the three changes
measured to cost zero degrees**: the subtitle on one line as *Hold flat and turn slowly*, a warm reopen that
draws the compass on its first frame once eight readings agree within 3 degrees of the heading the sheet last
drew (and falls through to the full gate at 5 degrees of disagreement, measured), and no success haptic on an
instant open because nothing arrived. Suite at <SUITES_AFTER> suites and <TESTS_AFTER> tests, 100% on all four
measures, <BREAKS_CAUGHT> breaks caught.
```

### Table rows

The executor sets the `ai/plans/README.md` row 52 status to EXECUTED. The auditor applies this to
`ai/prompts/README.md` on PASS:

```
DONE 2026-10-03 (<VERSION_RANGE>), audited. The wait was measured rather than shortened: 3000ms is the shortest window whose p95 error fits the 4-degree alignment window, and the row's premise that 50Hz sets the wait is refuted by the patch's own surviving `TIME_DELTA = 50f`. THE OWNER CAUGHT A WRONG CLAIM: waving the phone does not penalise the user, because the gate latches and the fusion keeps converging, so the error at the alignment haptic is 0.70 degrees still against 0.73 waving. The wave hint is kept on NXP AN4246's own fit, which puts a flat still phone at 497.6% of the hard-iron offset unremoved against the figure of eight's 1.3%. Shipped: a one-line subtitle, an instant warm reopen verified against the remembered heading, and no haptic when nothing arrived.
```

### Docs commit

```
<VERSION> - docs: record session 52's measurements, the owner's correction and the AN4246 gesture research
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2`
after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts 0 or 2 | `uat-2` moved under the plan | NEEDS REPLAN. Section 2.2 item 1 |
| `Qibla.test.tsx` fails on a string the plan did not change | The subtitle text is asserted somewhere the plan did not list | STOP. Section 2.2 item 2 |
| A warm-reopen test passes before the change | The test asserts something today's code already does | STOP: the test is wrong, not the code. `EXECUTOR-BRIEF.md`'s general table |
| A break prints `BREAK NOT APPLIED` | The search text does not match the code written | STOP. Section 2.2 item 3 |
| The coverage gate refuses the commit at 99.x% | A new branch is unreached by any test | Add the missing test to the step's own suite; this is not a plan deviation |
| `widgetRuntimeLoads.test.ts` fails for no reason the diff explains | A nested `@expo/ui` copy returned | `rm -rf node_modules/expo-widgets/node_modules && yarn install --frozen-lockfile` |
| The device logs no heading line | Pino is off outside dev | Section 7 item 3. Record UNMEASURED; never add a log line to get it |
| `biome check` reports errors in `scripts/probes/` | The folder was not registered | Already registered in `biome.json` and `check-changed-coverage.js` by the planning commit; verify both before editing anything |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixed. Anything else is a STOP, except a
finding meeting all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, which it applies itself and
records in `LOG.md`.

1. **If the review finds a comment explaining WHAT or HOW rather than WHY**, delete the comment. Do not rewrite
   it into a better explanation.
2. **If the review finds `warmHeadingRef` cleared inside `stop()`**, remove that line. The remembered heading
   must survive the close, which is the step's whole purpose.
3. **If the review finds the confirmation buffer reachable after `settledRef.current` is true**, move the
   confirmation inside the existing `if (!settledRef.current ...)` region so the latch owns the decision alone.
4. **If the review finds the subtitle string duplicated between the component and its test**, leave both. The
   test asserting the literal is what pins the owner's wording.

### Stopping part-way

| Step | Restore |
| --- | --- |
| 1 | `git checkout -- components/sheets/screens/Qibla.tsx components/sheets/screens/__tests__/Qibla.test.tsx app.json package.json` |
| 2 | `git checkout -- hooks/useQibla.ts shared/qiblaSettle.ts shared/__tests__/qiblaSettle.test.ts components/sheets/screens/__tests__/Qibla.test.tsx app.json package.json` and delete `hooks/__tests__/useQiblaWarm.test.ts` if it exists |
| 3 | `git checkout -- components/sheets/screens/Qibla.tsx hooks/useQibla.ts components/sheets/screens/__tests__/Qibla.test.tsx app.json package.json` |

Then `git checkout uat-2` and delete the step's branch.

## 11. Subagents in this plan

None. This session does its own planning, execution, review and audit (owner, 2026-09-26). No image needs
reading: every device check in section 7 is a text reading, which is deliberate, so no `vision` call arises.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, then:

- what changed in plain sentences, and what was proven;
- the progress table in `EXECUTOR-BRIEF.md`'s format;
- the correction the owner earned, stated plainly: waving the phone does not penalise him, his own testing was
  the better instrument, and the wave hint stays on AN4246's evidence;
- whether the 3T's time constant was measured, and if it is over 6000ms, section 2.2 item 7's question;
- the four-line handoff from the `athan-next` skill, section 5.
