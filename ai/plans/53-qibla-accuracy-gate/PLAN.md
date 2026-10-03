# Plan: Session 53. Gate the qibla compass on the phone's own uncertainty, not on a stopwatch

| Field | Value |
| --- | --- |
| Brief | `ai/plans/NEXT-SESSION-QIBLA-ACCURACY-GATE.md` |
| Planned at | `380a2a41` (version 1.29.246), 2026-10-03 |
| Planned by | Planning session on 2026-10-03 |
| Needs first | nothing |
| Steps | 1 prototype phase (iOS), then a later phase per the owner's loop. **No commits in this session** |
| Device | iPhone XS `00008020-0015585C22D2002E`, mock build, FIRST. OnePlus 3T `8f7ada76` in the Android loop afterwards |
| Owner decisions still needed | None (see section 2) |

> **Resume from:** the iOS prototype is specified in section 6 and executed in this same session. Nothing is
> committed. The owner tests the iPhone, reports back, and the coverage-and-commit phase follows in a new session.

---

## 1. Goal

The qibla compass makes the user wait about 2.7 seconds every time they open it, and that wait is a **stopwatch
rather than a measurement**. `hasSettled` has three conditions and on the owner's phones two are already satisfied
before the third can be: 8 readings arrive in about 570ms, the drift test passes on the first reading because the
fusion is already converged, and then the gate sits holding a **correct heading** waiting for the window to span
2700ms before it is allowed to believe itself. He measured this himself across 20 trials on both phones, cold and
warm, and found no difference between any of them.

When this is DONE the compass asks the phone how sure it is instead of timing it. A phone that reports a tight
accuracy draws **at once**; a phone that reports a poor one waits, and says so by still showing the hint; a phone
that never reports a good accuracy still draws, at a ceiling, because this screen must never lock. The owner would
notice the compass appearing immediately in the ordinary case, where today it always takes 2 to 3 seconds.

**The owner's rules that apply, quoted:**

🐋 "it should be replaced that the whole purpose. We want to make it as quick as possible. We want to replace it,
not beside it. So if it takes a long time to to settle, then it's going to take a long time to load. If it takes a
shorter time to settle, then it's going to load faster. Let's replace."

🐋 "we want accuracy, 1000% accuracy, always, always, always accuracy." and 🐋 "Always accuracy, never trade it for
speed"

🐋 "instead of inferring, convergence from drift every time, ask the phone how sure it is if iOS is 5 degrees, draw
immediately if it says 25 weight, and say why."

On this session's shape, given 2026-10-03 after the plan was begun:

🐋 "No unit test, no coverage because this is just a prototype. No need to commit... I will test on the phones once
you do the prototype. So we'll do the iPhone prototype first, and you don't commit anything. If the iPhone
prototype goes well, then we save and we commit... we get 100% coverage, and then you can commit, and you can do
the audits and the review and the code review and everything... Then after that, we'll do the same loop, but on
Android."

And the standing rule this gate must satisfy, from `ai/AGENTS.md`: anything gating this screen **fails OPEN**.
🐋 "we don't want to lock it... what if the magnetometer doesn't actually work the first time".

---

## 2. Decisions

### 2.1 Taken

1. **The accuracy gate REPLACES the 2700ms span check. It does not sit beside it.** Owner, 2026-10-03. Rejected:
   running both and opening on whichever fires first, because a gate that can only ever be faster would show no
   change if accuracy always lost, and would teach nothing.
2. **The prototype shows the numbers on the sheet.** Owner, 2026-10-03, choosing from three options. Rejected:
   shipping a guessed threshold with no readout, because every accuracy reading this programme holds was taken over
   a cable and a gate set to 4 degrees would behave very differently if his phones report 25 untethered. The
   readout is plain numbers, not a technical explanation (decision 7 of the brief), and it comes off again in the
   commit phase.
3. **A phone that is already certain draws instantly, with no animation.** Owner, 2026-10-03. He then questioned
   his own answer (🐋 "what if the compass is not ready to render?") and self-corrected. `MEASURED.md` section 6
   answers it from the code: `showsCompass` requires `bearing !== null` as well as a heading, so an instant draw
   cannot paint a bearing-less compass, and the warm-reopen path already draws instantly on the build he accepted.
   Nothing is specified for a half-built compass because the condition cannot arise.
4. **The 3T stays on mock data this session.** Owner, 2026-10-03. Rejected: spending 30 minutes on a production APK,
   because row 53 is purely the qibla gate and mock data does not affect it.
5. **iOS is prototyped, installed and judged FIRST; Android follows as its own loop.** Owner, 2026-10-03.
6. **Nothing is committed in this session.** Owner, 2026-10-03, and it is the reason decision 7 is possible.
7. **The gate lives in `shared/qiblaSettle.ts`, NOT in `modules/qiblaheading/`.** Planner, because decision 6
   removes the only argument for `modules/`. The brief's trap 5.1 recommends `modules/` solely to dodge the 100%
   coverage gate on an untested prototype; with no commit there is no gate to dodge, and `MEASURED.md` section 1
   measures what that route would have cost: **58 existing tests fail**, because two suites replace the module with
   a `jest.mock` factory that does not carry its other exports. `shared/qiblaSettle.ts` is pure arithmetic with no
   imports, it is already the home of every gate constant this feature has, and the later coverage session can test
   it directly. Rejected: `modules/qiblaheading/`, for the 58 failures and because hiding a shipped decision in a
   folder named for native code would mislead every later reader.
8a. **ONE number, no tiers, and the compass itself is NOT touched.** Owner, 2026-10-03, ruling out the three-tier
   design this session proposed: 🐋 "I don't want any levels. I don't want any tiers. I want an acceptable range
   to then show, I want 1 number, an accuracy... I do not want to change the compass at all. Don't touch the
   compass because it's perfect now." So the ONLY question row 53 answers is: **what reported accuracy must the
   phone give before the animation ends and the compass is drawn.** One constant,
   `CERTAINTY_THRESHOLD_DEGREES`. No warning state, no cone, no second threshold, no visual change to the dial.
   Rejected: the draw/warn/refuse ladder, because it changes what the user sees and the owner has accepted the
   compass as it is.

8b. **The threshold starts at `ALIGNMENT_ENTER_DEGREES`, 4 degrees, and the readout reveals whether that was right.**
   Planner. It is the window the haptic already announces, so a compass drawn inside it cannot tell the user they
   are aligned when they are not. It is safe to start there **because of the ceiling**: a phone that never reports
   4 degrees falls through to the ceiling rather than refusing, so the worst case is today's behaviour, not a dead
   screen. The owner reports the readout's numbers and a later session sets the final value from them.
9. **The ceiling is 3000ms, measured from the first heading reading.** Planner, from
   `scripts/probes/probe-ceiling.mjs`. At that value the gate is **up to 2727ms faster** in the regimes his phones
   are measured to be in, and at worst **273ms slower** than today for a phone that never reports a good accuracy.
   Rejected: a ceiling under 2700ms, which would make a poor-accuracy phone draw sooner than today and trade
   accuracy for speed against decision rule "never trade it for speed"; and no ceiling at all, which breaks the
   fail-open rule.
10. **A negative accuracy is treated as NO READING, never as a number.** Planner. Apple documents a negative
    `headingAccuracy` as an invalid heading and gates on it unconditionally in its own sample code.
    `probe-ceiling.mjs` measures what a bare comparison would do: `-1 <= 4` is **true**, so a gate written the
    obvious way opens on exactly the reading Apple says to discard. This is the one case the app cannot see at all
    today, because `expo-location` buckets it together with a merely poor reading.
11. **An ABSENT accuracy is treated as no reading too, and falls to the ceiling.** Planner. Android's FOP cone is
    optional per sample (`hasConservativeHeadingErrorDegrees()`), so an unguarded read publishes a default dressed
    as an accuracy. Absence must never read as zero, which is the most certain value there is.
12. **The diagnostic watch stops being gated by `qiblaDiagnostic`.** Planner. The flag gates the watch today
    (`hooks/useQibla.ts:177`), and the gate cannot read an accuracy that is never watched. The READOUT stays behind
    the flag; the watch becomes unconditional, because it is now load-bearing rather than diagnostic.
13. **The warm-reopen path STAYS, untouched.** Planner. It is row 52's shipped work at the owner's named revert
    point, it is already an instant path, and it covers the case where no accuracy is available at all. The readout
    records which path opened the gate, so the two instant paths are never confused.
14. **The prototype flag is turned on in the gitignored `.env`, not in `.env.example`.** Planner. `.env` is
    gitignored (verified with `git check-ignore`), so turning the readout on costs no commit, which decision 6
    requires. `MEASURED.md` section 3 proves `.env.example` is what reaches a mock build, so the commit phase is
    where that file would change if the readout ever shipped, and it will not.

### 2.2 The executor must not decide

This session is planned and executed by the same session, so these are the conditions under which it stops and asks
the owner:

1. Any anchor count other than 1. Question: "The plan's anchor `<name>` counts `<n>` in `<file>` rather than 1.
   The file has changed since `380a2a41`. Should I replan against today's code?"
2. The iOS build fails with anything other than the known transient. Question: "The iOS build failed with
   `<the exact line>`. Do you want me to retry it, or stop and investigate?"
3. The iPhone is not attached when the install runs. Question: "The iPhone XS is not showing up over USB. Can you
   plug it in and unlock it?"
4. The compass does not appear at all on the prototype. Question: "The prototype draws no compass on your phone.
   That means the gate is refusing every reading. Do you want me to raise the threshold and rebuild, or revert to
   1.29.239?"
5. Anything touching visuals beyond the readout the owner approved, prayer times, a hand-edited release file, `uat`
   or EAS.

---

## 3. Pre-flight

Saved to `$TMPDIR/preflight-53.sh` and run with `bash $TMPDIR/preflight-53.sh`. It does NOT check for a clean tree
the way an executing plan does, because this session deliberately leaves the tree dirty: nothing is committed.

```bash
#!/usr/bin/env bash
set -u
cd /Users/muji/repos/rn.athan.uk || { echo "FAIL: wrong checkout"; exit 1; }

branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "uat-2" ] || { echo "FAIL: on $branch, not uat-2"; exit 1; }
echo "branch uat-2"

git fetch -q origin uat-2
unpushed=$(git log --oneline origin/uat-2..uat-2 | wc -l | tr -d ' ')
[ "$unpushed" = "0" ] || { echo "FAIL: $unpushed unpushed commits; an audit is owed"; exit 1; }
echo "unpushed 0"

echo "version $(node -p "require('./package.json').version")"

for a in 1-1 1-2 1-3; do
  f="ai/plans/53-qibla-accuracy-gate/scripts/anchors/$a.txt"
  case $a in
    1-1) src=shared/qiblaSettle.ts ;;
    1-2) src=hooks/useQibla.ts ;;
    1-3) src=components/sheets/screens/Qibla.tsx ;;
  esac
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$f" "$src")
  echo "anchor $a -> $src : $n"
  [ "$n" = "1" ] || { echo "FAIL: anchor $a counts $n"; exit 1; }
done

xcrun devicectl list devices 2>/dev/null | grep -q "00008020-0015585C22D2002E" \
  && echo "iPhone XS reachable" || { echo "FAIL: iPhone XS not reachable"; exit 1; }

echo "PREFLIGHT OK"
```

---

## 4. Background

### Code map

| File | What it does | Changed |
| --- | --- | --- |
| `shared/qiblaSettle.ts` | Pure arithmetic, no imports. Holds `SETTLE_WINDOW_MS`, `SETTLE_MIN_READINGS`, `SETTLE_DRIFT_DEGREES`, `hasSettled`, and row 52's `WARM_*` constants and `isWarmStream` | **Yes.** The new gate joins it |
| `hooks/useQibla.ts` | The whole sheet behaviour. `processReading` is where the gate latches, at line 140 to 148 | **Yes.** The gate's call site and the accuracy ref |
| `components/sheets/screens/Qibla.tsx` | The sheet. Holds the flagged readout at lines 162 to 169 | **Yes.** Readout gains two lines |
| `modules/qiblaheading/index.ts` | `watchQiblaDiagnostic`, and the `QiblaDiagnostic` shape the gate reads | No |
| `shared/qiblaAlignment.ts` | `ALIGNMENT_ENTER_DEGREES = 4`, the threshold's source | No |
| `.env` (gitignored) | Turns the prototype readout on | Yes, uncommitted by design |

### How the pieces interact

Two **independent** watches feed one gate, which is the concurrency that matters:

| Order | What happens | Consequence for the gate |
| --- | --- | --- |
| 1 | `start()` arms `watchHeading` and the diagnostic watch together | Neither waits on the other |
| 2 | A heading reading arrives, calls `processReading` | The gate is evaluated HERE, on the heading stream |
| 3 | An accuracy reading arrives, writes state | It does NOT evaluate the gate; it only updates what the next heading reading will read |
| 4 | A heading reading arrives with no accuracy yet seen | The accuracy is absent, so the gate falls to the ceiling (decision 11) |

So the gate is always evaluated on a heading reading, and the accuracy is whatever last arrived. That ordering is
what makes a ceiling measured from the first heading reading correct: if no heading ever arrives there is nothing
to draw, so no ceiling is needed for that case.

### Existing tests over this code

`components/sheets/screens/__tests__/Qibla.test.tsx` (85 tests), `QiblaDiagnostic.test.tsx` (its readout), and
`shared/__tests__/qiblaSettle.test.ts` (26 tests). **None is written or changed in this session**, per decision 6.
`MEASURED.md` section 1 records the trap the coverage phase must handle when it does write them.

### Why the obvious simple fix is wrong

Reading the accuracy and comparing it to a threshold is three lines, and two of them would be wrong:
`accuracy <= 4` opens on Apple's negative invalid sentinel (decision 10, measured), and treating an absent reading
as 0 opens on Android's optional cone (decision 11). Both fail in the direction that draws a compass the phone has
disowned.

---

## 5. Design

**The invariant, as one sentence a test can check:** the compass is drawn on the first heading reading for which
the phone reports a non-negative accuracy no worse than `CERTAINTY_THRESHOLD_DEGREES`, or on the first reading
after `CERTAINTY_CEILING_MS` has passed since the first reading, whichever comes first, and never before either.

**The approach.** `hasSettled`'s span-and-drift test stops deciding when the compass draws. In its place:

1. `isCertain(accuracyDegrees)` answers whether the phone has reported a usable certainty. Absent is false,
   negative is false.
2. The gate opens when `isCertain` is true, or when the ceiling has elapsed.
3. Which of the two opened it is recorded, so the readout can say why and the owner can report real numbers back.

**Alternatives rejected:**

| Rejected | Why |
| --- | --- |
| Run the accuracy gate beside `hasSettled`, opening on whichever fires first | The owner's decision 1. It can only ever be faster, so if accuracy always lost nothing would change and nothing would be learned |
| Keep `hasSettled` as the ceiling instead of a timer | It is the stopwatch being replaced, and its 2700ms span is measured from the window's oldest sample, so it is not a clean time bound (`MEASURED.md` section 4) |
| No ceiling | Breaks `ai/AGENTS.md`'s fail-open rule. A phone reporting 25 degrees forever would never draw |
| A ceiling under 2700ms | Would make a poor-accuracy phone draw sooner than today, trading accuracy for speed |
| Put the gate in `modules/qiblaheading/` | Decision 7. Measured at 58 failing tests, and it hides a shipped decision in a folder named for native code |
| Delete the warm-reopen path as redundant | Decision 13. It is the owner's accepted work at his revert point, and it covers the no-accuracy case |

**The concurrency trace.** `processReading` is the only caller of the gate, and it runs on the heading stream.
Before the change it called `hasSettled(window, nowMs)`; after it, it reads the latest accuracy and the first
reading's timestamp, neither of which can be mutated mid-call because JavaScript runs one callback at a time. The
diagnostic callback only writes; it never opens the gate. A lost fix clears the first-reading timestamp along with
the samples, so the ceiling restarts rather than firing instantly on the stream's return.

**The design review, run against this design before anything was written.** What a hostile reviewer would say,
and what changed:

| Attack | Answer |
| --- | --- |
| "The ceiling makes this `hasSettled` with extra steps" | No: `hasSettled` measures the STREAM and the ceiling measures nothing. A term that reads no readings cannot be gamed by motion or by noise, which is row 52's own finding about the 13-second floor. The ceiling is a bound, not a test |
| "A phone reporting a tight accuracy on its FIRST reading draws on one sample" | Deliberate and correct: the phone has already fused, and row 52 measured that his phones hand the app an already-converged fusion. The thing being removed is exactly the wait that re-proved it |
| "The accuracy might lag the heading, so the gate reads a stale number" | Yes, and the direction is safe: a stale accuracy is from EARLIER in the convergence, so it is pessimistic, and a pessimistic reading falls to the ceiling rather than opening early |
| "Android reports a cone, iOS reports an accuracy; one threshold cannot fit both" | They are the same quantity in the same unit (degrees of heading uncertainty), which is why `modules/qiblaheading` normalises them. Whether 4 fits both is exactly what the prototype's readout measures, and the Android loop judges it separately |
| "Removing the drift test loses protection against a moving phone" | Row 52 measured that no stream-only gate separates the user's motion from the fusion's convergence, and that every shape tried refused a hand-held phone 100% of the time. The drift test was never providing that protection |

---

## 6. Steps

- [ ] Prototype P1: the accuracy gate, built and installed on the iPhone XS (specified, **no tests, no commit**)

### Prototype P1: gate the compass on the reported accuracy, iOS first

0. **Anchor check:** run section 3's pre-flight. Every anchor counts 1.
1. **Goal:** the compass draws as soon as the iPhone says it is certain, falls back to a ceiling when it never
   does, and shows the owner what it read.
2. **Branch:** none. Decision 6: nothing is committed, so the work stays in the working tree on `uat-2`.
3. **Files:** `shared/qiblaSettle.ts`, `hooks/useQibla.ts`, `components/sheets/screens/Qibla.tsx`, and the
   gitignored `.env`.
4. **Tests first (red):** **none.** Decision 6, the owner's instruction. The coverage phase writes them, and
   `MEASURED.md` section 1 records the `jest.mock` trap it must handle.
5. **Change.** This is a `(specified)` step.

   **In `shared/qiblaSettle.ts`,** three additions:

   | Name | Signature | Answers | Must never |
   | --- | --- | --- | --- |
   | `CERTAINTY_THRESHOLD_DEGREES` | `number`, value `4` | The worst reported uncertainty the compass will draw on | Exceed `ALIGNMENT_ENTER_DEGREES`, or the haptic could announce alignment from outside the window it announces |
   | `CERTAINTY_CEILING_MS` | `number`, value `3000` | How long the gate waits for a certainty it may never get | Drop below the 2700ms the old span check took, which would trade accuracy for speed |
   | `isCertain` | `(accuracyDegrees: number \| undefined) => boolean` | Whether the phone has reported a usable certainty | Return true for `undefined` (Android's optional cone) or for a negative value (Apple's invalid-heading sentinel) |

   **In `hooks/useQibla.ts`:**
   - A ref holding the latest reported accuracy, written by the diagnostic callback. **A sample carrying no reading
     must leave the previous one standing**, because FOP's cone is per-sample optional and overwriting with
     `undefined` would strand the gate on the ceiling. iOS cannot reveal this, since `CLHeading` carries an accuracy
     every time, so it is specified here rather than left to the Android loop to discover.
   - A ref holding the first heading reading's timestamp, cleared when the fix is lost so the ceiling restarts
     rather than firing the instant the stream returns.
   - The diagnostic watch is armed unconditionally (decision 12), not behind `FEATURE_FLAGS.qiblaDiagnostic`.
   - The gate replaces `hasSettled(window, nowMs)` in the latch. It opens on `isCertain`, else on the ceiling.
   - `QiblaState` gains one field recording why the gate opened, for the readout.
   - **The trailing sample window goes with it.** `hasSettled` was its only reader, so `samplesRef` and
     `trailingWindow` become dead the moment the gate changes, and dead code is deleted rather than left. `hasSettled`
     and its own constants STAY in `shared/qiblaSettle.ts`: the coverage phase decides whether they are deleted or
     kept as a fallback, and that is a decision for a session the owner has judged the prototype in.

   **In `components/sheets/screens/Qibla.tsx`:** the existing flagged readout gains the reported accuracy, why the
   gate opened and how long it waited. No other pixel changes: the dial, the Kaaba, the needle, the palettes, the
   wave drawing and every spacing constant are untouched (`ai/AGENTS.md`, visuals are settled).

   Comments explain why only, and are extremely compact.

6. **Green:** `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0. **The full suite is NOT
   required to pass**, because the gate's replacement changes behaviour the existing tests assert and decision 6
   defers those tests. The suite's state is RECORDED in `LOG.md` rather than gated on, so the coverage phase knows
   exactly what it inherits.
7. **Breaks:** none. A break script proves tests are worth something, and this phase writes no tests.
8. **Version and commit:** **none.** Decision 6.
9. **Review:** read the whole diff back cold against decisions 7 to 13, the invariant in section 5, and the owner's
   visual rule. Record the verdict in `LOG.md`.
10. **Merge:** none.
11. **Done when:** `tsc` and Biome exit 0, the iOS build reports `0 error(s)`, `xcrun devicectl device info apps`
    reports the new version on the XS, and the owner has the phone in his hand.

---

## 7. Device proof

**iOS, in this order, because `expo run:ios` never re-syncs an existing native directory:**

```bash
cd /Users/muji/repos/rn.athan.uk
npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist   # must show app.json's version
npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
```

The version is NOT bumped this session (no commit), so the plist must show `1.29.246`. Session 52 found it stale at
1.29.233 while `app.json` said 1.29.241, which is why the plist is read before the build runs.

**The data this build serves.** `.env` carries `EXPO_PUBLIC_ENV=local`, and `api/client.ts:124` returns
`MOCK_DATA_SIMPLE` whenever the env is neither `prod` nor `preview`. So this is a mock build by construction, which
is what the owner asked for and what makes the readout reachable: `qiblaDiagnostic` requires
`EXPO_PUBLIC_ENV !== 'prod'`.

**Verify after installing:**

```bash
xcrun devicectl device info apps --device 00008020-0015585C22D2002E | grep "com.mugtaba.athan "
```

**Safety.** No clock is changed, so no `dumpsys alarm` reading is owed and no armed alarm can be fired. The 3T is
not touched in this phase. The owner receives no screenshots.

**The phone is left on** this prototype build, carrying mock prayer times and the accuracy gate. It also carries
row 52's truncation fix for the first time, since the XS has been on 1.29.241.

---

## 8. Records

**None in this session.** Decision 6: nothing is committed, so `ai/features/uat-2/AUDIT-FINDINGS.md` and the
`ai/plans/README.md` row are not touched. The row stays PLANNING with this plan recorded against it, and `LOG.md`
carries what the prototype did and what the suite's state is, which is what the coverage phase reads.

---

## 9. Push

None. Nothing is committed, so there is nothing to push.

---

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| The compass never appears | The threshold refuses every reading AND the ceiling is not firing | The ceiling cannot refuse, so this means the gate is not reached at all: check the diagnostic watch is armed unconditionally (decision 12) |
| The compass appears instantly every time, even moving | `isCertain` is returning true for an absent reading | Decision 11: absence must be false, not zero |
| The readout shows `-` for accuracy on the iPhone | No accuracy reading has arrived | The watch is gated or the module is not linked. Check `prebuild` ran and the pod installed |
| The readout shows a negative accuracy and the compass drew | Decision 10's guard is missing | A bare `<=` opens on Apple's invalid sentinel |
| A Gradle TLS handshake failure (Android loop only) | Transient network | `curl` the URL first; a plain retry succeeded in session 52 |
| `expo run:ios` builds a stale version | `prebuild` did not run first | The plist read is the check; rerun prebuild |

**Anticipated review fixes:** none needed in a phase that commits nothing; findings are applied directly and
recorded in `LOG.md`.

**Stopping part-way:** `git checkout -- shared/qiblaSettle.ts hooks/useQibla.ts components/sheets/screens/Qibla.tsx`
and restore `.env`'s flag line. The tree returns to `380a2a41` exactly.

---

## 11. Subagents in this plan

None. The session does its own planning, execution and review (owner, 2026-09-26). No image needs reading: every
device check in section 7 is a text reading.

---

## 12. Report to the owner

Delivered at the end of the prototype, covering what the gate now does, what the readout will show him, which
phone carries it, and the two numbers to report back: the accuracy his phone reports and whether the compass drew
on accuracy or on the ceiling.
