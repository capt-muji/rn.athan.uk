# Plan: Session 53. Gate the qibla compass on the phone's own uncertainty, not on a stopwatch

| Field | Value |
| --- | --- |
| Brief | in git history: `ai/plans/NEXT-SESSION-QIBLA-ACCURACY-GATE.md` (blob at `57d30a86`) |
| Planned at | `380a2a41` (1.29.246), 2026-10-03, by the same session that executed it |
| Device | iPhone XS `IPHONE_UDID` mock first; OnePlus 3T `3T_SERIAL` in the Android loop |
| Outcome | DONE: prototype P1, then steps 2 to 5; accepted and locked 2026-10-07 (`AUDIT.md`) |

The row is closed. What follows is the plan's decisions and design, which the steps built on. The execution
narrative is `LOG.md`; the locked behaviour is specified in `steps/5-vouched-or-nothing.md`.

## 1. Goal

The compass made the user wait ~2.7 seconds on a **stopwatch rather than a measurement**: `hasSettled`'s span check
held an already-correct heading until the window spanned 2700ms (the owner measured no difference across 20 trials,
cold and warm, both phones). The replacement asks the phone how sure it is.

**The owner's rules, quoted:**

🐋 "it should be replaced that the whole purpose. We want to make it as quick as possible. We want to replace it,
not beside it..."

🐋 "we want accuracy, 1000% accuracy, always, always, always accuracy." / 🐋 "Always accuracy, never trade it for
speed"

🐋 "instead of inferring, convergence from drift every time, ask the phone how sure it is if iOS is 5 degrees, draw
immediately if it says 25 weight, and say why."

On the session's shape: 🐋 "No unit test, no coverage because this is just a prototype. No need to commit... we'll
do the iPhone prototype first... If the iPhone prototype goes well, then we save and we commit... we get 100%
coverage... Then after that, we'll do the same loop, but on Android."

And the standing rule this gate must satisfy, from `ai/AGENTS.md`: anything gating this screen **fails OPEN**.
🐋 "we don't want to lock it... what if the magnetometer doesn't actually work the first time".

## 2. Decisions

1. **The accuracy gate REPLACES the span check; it does not sit beside it.** Owner. Running both, opening on
   whichever fires first, could only ever be faster and would teach nothing.
2. **The prototype shows the numbers on the sheet** (a readout, removed again in step 3): every accuracy reading on
   record was taken over a cable, and a gate set from cable readings could behave differently untethered.
3. **A certain phone draws instantly, with no animation.** The owner questioned then self-corrected; `MEASURED.md`
   section 6 answers it from the code (`showsCompass` requires a bearing).
4. **The 3T stays on mock data.**
5. **iOS prototyped and judged FIRST; Android its own loop after.**
6. **Nothing committed in the prototype phase**, which is what makes decision 7 possible.
7. **The gate lives in `shared/qiblaSettle.ts`, NOT `modules/qiblaheading/`.** The brief recommended `modules/`
   only to dodge the coverage gate on an untested prototype; with no commit there is no gate to dodge, and
   `MEASURED.md` section 1 measures that route at 58 failing tests. `qiblaSettle.ts` is pure arithmetic with no
   imports and the home of every gate constant this feature has.
8a. **ONE number, no tiers, and the compass itself is NOT touched.** 🐋 "I don't want any levels. I don't want any
    tiers. I want an acceptable range to then show, I want 1 number, an accuracy... I do not want to change the
    compass at all. Don't touch the compass because it's perfect now." One constant,
    `CERTAINTY_THRESHOLD_DEGREES`; no warning state, no cone, no visual change to the dial.
8b. **The threshold starts at `ALIGNMENT_ENTER_DEGREES`, 4** (the window the haptic already announces), with the
    readout revealing whether that was right; the ceiling keeps the worst case at today's behaviour.
9. **The ceiling is 3000ms from the first heading reading** (both ceilings deleted by step 5 on the owner's ruling;
    fail-open consciously traded away, see `steps/5-vouched-or-nothing.md`): up to 2727ms faster in the measured regimes, at worst
    273ms slower, never trading accuracy for speed, never breaking fail-open.
10. **A negative accuracy is NO READING, never a number.** Apple documents a negative `headingAccuracy` as an
    invalid heading; a bare comparison opens on it (`-1 <= 4` is true).
11. **An ABSENT accuracy is no reading too**, falling to the ceiling: Android's FOP cone is optional per sample,
    and absence must never read as zero, the most certain value there is.
12. **The accuracy watch arms unconditionally**; only the readout stays behind the flag. The gate cannot read an
    accuracy that is never watched.
13. **The warm-reopen path STAYS, untouched**: row 52's shipped work at the owner's named revert point.
14. **The prototype flag is turned on in the gitignored `.env`, not `.env.example`** (no commit); `MEASURED.md`
    section 3 is where the catalogue route is proven for the commit phase.

**Stop-and-ask conditions (2.2):** any anchor count other than 1; an iOS build failure other than the known
transient; the XS not attached; the compass never appearing on the prototype; anything touching visuals beyond the
approved readout, prayer times, release files, `uat` or EAS.

## 3. Design

**Invariant:** the compass is drawn on the first heading reading for which the phone reports a non-negative
accuracy no worse than `CERTAINTY_THRESHOLD_DEGREES`, or on the first reading after `CERTAINTY_CEILING_MS` from the
first reading, whichever comes first, never before either.

`isCertain(accuracy)` answers usable-certainty (absent false, negative false); the gate opens on `isCertain` or
the ceiling; `openedBy` recorded which, for the readout.

Two **independent** watches feed one gate evaluated only on the heading stream: an accuracy reading merely updates
what the next heading reading will read; a heading with no accuracy yet falls to the ceiling (decision 11). A lost
fix clears the first-reading timestamp so the ceiling restarts. The obvious `accuracy <= 4` is wrong twice: it
opens on Apple's negative sentinel (decision 10, measured) and treating absence as 0 opens on Android's optional
cone (decision 11): both fail in the direction that draws a compass the phone has disowned.

**Rejected alternatives:** run beside `hasSettled` (decision 1); keep `hasSettled` as the ceiling (it is the
stopwatch being replaced, and its 2700ms span is not a clean time bound (`MEASURED.md` section 4)); no ceiling
(breaks fail-open); a ceiling under 2700ms (trades accuracy for speed); `modules/` (58 failing tests); deleting
warm-reopen (deletes the owner's accepted work and the no-accuracy cover).

**Design-review attacks, answered:** the ceiling is not "`hasSettled` with extra steps" (it measures nothing, so
motion cannot game it; a first-reading draw is deliberate (the fusion is already converged; row 52 measured that);
a stale accuracy is pessimistic and safe; iOS accuracy and Android cone are the same quantity in degrees (whether
one threshold fits both is what the prototype measures); dropping the drift test loses nothing (row 52 measured
that no stream-only gate separates the user's motion from convergence, and every shape tried refused a hand-held
phone 100% of the time.

## 4. Steps and where they ended

| Step | File | Version | Note |
| --- | --- | --- | --- |
| Prototype P1 | this file, section 5 below | 1.29.248 (`f7eeb1c5`) | one-time `--no-verify` |
| Step 2: iOS covered, stopwatch deleted | `steps/2-ios-coverage.md` | 1.29.249 (`f6624843`) | audited in `AUDIT.md` |
| Step 3: readout removed | `steps/3-readout-removed.md` | 1.29.252 (`1bf2d8fc`) | |
| Step 4: Android on Google's sensor alone, behind a wave | `steps/4-android-fused-wave.md` | 1.29.253/254 (`e1d3feba`) | owner waved the 3T: 🐋 "It's very, very smooth" |
| Step 5: vouched-or-nothing | `steps/5-vouched-or-nothing.md` | 1.29.255/256 (`7b45fda0`) | ACCEPTED on three phones 2026-10-07; both platforms locked |

## 5. Prototype P1 (retained for the record)

Files: `shared/qiblaSettle.ts`, `hooks/useQibla.ts`, `components/sheets/screens/Qibla.tsx`, gitignored `.env`.
No tests (decision 6); `npx tsc --noEmit` and `npx biome check . --error-on-warnings` were the gate; the suite's
inherited red state was RECORDED in `LOG.md`, not gated on.

In `qiblaSettle.ts`: `CERTAINTY_THRESHOLD_DEGREES = 4` (must never exceed `ALIGNMENT_ENTER_DEGREES`),
`CERTAINTY_CEILING_MS = 3000` (must never drop below the 2700ms the span check took), `isCertain` (must never
return true for `undefined` or a negative). In the hook: an accuracy ref written only by samples that CARRY a
reading (a coneless FOP sample must leave the last one standing: the defect that would have broken Android,
`LOG.md` prototype section), a first-reading timestamp cleared on a lost fix, the watch armed unconditionally, the
gate replacing `hasSettled`, `openedBy` for the readout, and the trailing sample window deleted as dead. In the
sheet: the flagged readout gained accuracy, why it drew, and how long it waited; no other pixel changed.

Done when: tsc and Biome exit 0, the build reports 0 errors, the XS reports the new version, the owner has the
phone. **He then reported: threshold 4 then 5 then 15, `drew on certainty` at 12.5; the full account is `LOG.md`.**
