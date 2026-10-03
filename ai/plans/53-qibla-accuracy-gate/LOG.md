# Execution log: Session 53

## Prototype P1: the accuracy gate, iOS first (2026-10-03)

**Nothing was committed.** The owner's instruction: 🐋 "No unit test, no coverage because this is just a prototype.
No need to commit... I will test on the phones once you do the prototype."

### Pre-flight

```
branch uat-2
unpushed 0
version 1.29.246
anchor 1-1 -> shared/qiblaSettle.ts : 1
anchor 1-2 -> hooks/useQibla.ts : 1
anchor 1-3 -> components/sheets/screens/Qibla.tsx : 1
iPhone XS reachable
PREFLIGHT OK
```

### What changed

| File | Change |
| --- | --- |
| `shared/qiblaSettle.ts` | Added `CERTAINTY_THRESHOLD_DEGREES = 4`, `CERTAINTY_CEILING_MS = 3000`, `isCertain`. `hasSettled` and its constants are LEFT IN PLACE, unused by the hook, because the coverage phase decides whether they are deleted or kept for a fallback |
| `hooks/useQibla.ts` | The gate asks the phone instead of timing it. Two refs added (`accuracyRef`, `firstReadingAtRef`), `samplesRef` and the trailing window removed as dead, the diagnostic watch armed unconditionally, `openedBy` reported |
| `components/sheets/screens/Qibla.tsx` | Readout gained `drew on <path>` and `bar 4 / ceiling 3000ms` |
| `.env` (gitignored) | `EXPO_PUBLIC_QIBLA_DIAGNOSTIC=1`, so the readout renders. Not a commit: `git check-ignore .env` confirms it is ignored |

### Green

```
npx tsc --noEmit                      -> exit 0
npx biome check . --error-on-warnings -> Checked 384 files, no fixes applied
```

### The suite's state, RECORDED rather than gated on

The owner deferred tests, so the suite was run only to record what the coverage phase inherits:

```
npx jest components/sheets/screens/__tests__/Qibla.test.tsx \
         components/sheets/screens/__tests__/QiblaDiagnostic.test.tsx \
         shared/__tests__/qiblaSettle.test.ts --watchman=false

Test Suites: 1 failed, 2 passed, 3 total
Tests:       21 failed, 97 passed, 118 total
```

**All 21 failures are the replaced behaviour, and none is a crash:** `grep -c "TypeError\|is not a function"`
returns **0**. Every failure is `Unable to find an element with testID: qibla-dial` or the equivalent, because the
suites drive a heading stream that reports NO accuracy, so the gate now correctly waits for the 3000ms ceiling
where those tests expected the old span check to open at 2700ms.

**That is the gate working, not a defect.** The coverage phase rewrites those 21 to drive an accuracy alongside the
heading. `shared/__tests__/qiblaSettle.test.ts` passes untouched (26 tests), because `hasSettled` still exists.

### The three defects this session's own review caught

Found by reading the diff back cold, before the build:

1. **The entire sample window became dead code.** `hasSettled` was the only reader of `samplesRef` and
   `trailingWindow`, so replacing the gate left a window being built and filtered on every single reading and never
   read. Deleted, with its import and its two resets.
2. **A fallback that could never fire.** `nowMs - (firstReadingAtRef.current ?? nowMs)` sat one line below
   `firstReadingAtRef.current ??= nowMs`, so the `??` branch was unreachable. `tsc` narrows the type correctly
   without it, which proves the branch was dead rather than defensive.
3. **THE ONE THAT WOULD HAVE BROKEN ANDROID.** `accuracyRef.current = accuracyDegrees ?? fusedErrorDegrees` runs on
   every diagnostic sample, and FOP attaches its cone to SOME samples only
   (`hasConservativeHeadingErrorDegrees()`, `QiblaHeadingModule.kt:85`). A coneless sample would therefore have
   written `undefined` over a good reading and stranded the gate on the ceiling forever. Now a silent sample leaves
   the last reading standing. **iOS would never have shown this**, because `CLHeading` carries an accuracy on every
   sample, so the Android loop would have met it as a mystery.

### Device

```
npx expo prebuild -p ios --no-install   -> exit 0
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
```

The plist was found STALE at **1.29.241** against `app.json`'s 1.29.246, which is session 52's recorded trap, and
prebuild corrected it to 1.29.246 before the build ran.

### Two stale comments caught on the second read

Both described the gate that was removed, and a comment that lies is worse than none:

- `components/sheets/screens/Qibla.tsx` claimed "a cold open waits for the heading to stop drifting across its own
  3000ms window", which is exactly what no longer happens.
- The wave hint's own note ended "a user who ignores the invitation simply gets what the settling gate alone can
  give them", naming a gate that no longer decides anything.

### What the owner reports back

Two readings off the sheet's readout, which is why the readout exists:

| Line | What it answers |
| --- | --- |
| `accuracy <n>` | What the iPhone actually reports untethered. Every prior reading of this number was taken over a cable, which his own rule says measures the desk rather than the room |
| `drew on <warm\|certainty\|ceiling>` | Whether the phone's own certainty opened the gate, or whether it fell through to the ceiling every time |

If it reads `certainty`, the threshold of 4 is right and the compass is as fast as the phone allows. If it reads
`ceiling` every time while the accuracy shows a number well above 4, the threshold needs raising to that number and
the gate is still correct, just never faster than today.

### Device proof: the iPhone XS carries the prototype

```
npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E

› Build Succeeded
› 0 error(s), and 5 warning(s)
› Installing .../Release-iphoneos/Athan.app
✔ Complete 100%
BUILD EXIT=0
```

Confirmed on the device itself:

```
xcrun devicectl device info apps --device 00008020-0015585C22D2002E | grep "com.mugtaba.athan "
Athan   com.mugtaba.athan   1.29.246   1
```

It was on 1.29.241 before this, so the XS also receives row 52's subtitle truncation fix for the first time: it
previously showed `Hold flat and...` and now reads `Hold flat and turn slowly`.

The 5 warnings are the pre-existing Xcode ones (an unstrippable signed widget binary and the dev-launcher script's
ambiguous dependencies), not this change's.

### Where this leaves the repository

Nothing is committed, by instruction. `uat-2` is still at `380a2a41` with 0 unpushed commits, and the prototype
lives in the working tree:

```
components/sheets/screens/Qibla.tsx | 20 ++++++---
hooks/useQibla.ts                   | 71 +++++++++++++++++++++++-----------
shared/qiblaSettle.ts               | 31 ++++++++++++++
ai/plans/README.md                  |  2 +-
biome.json                          |  3 +-
scripts/check-changed-coverage.js   |  4 +++
```

`biome.json` and `scripts/check-changed-coverage.js` register this plan's probe folder, which the pre-commit hook
would otherwise refuse for `lint/suspicious/noConsole` (session 52 lost a commit to exactly that).

**To revert to the owner's named revert point if the prototype misbehaves:**

```bash
git checkout -- shared/qiblaSettle.ts hooks/useQibla.ts components/sheets/screens/Qibla.tsx
sed -i '' 's/^EXPO_PUBLIC_QIBLA_DIAGNOSTIC=.*/EXPO_PUBLIC_QIBLA_DIAGNOSTIC=0/' .env
```

## The first untethered accuracy reading this programme has ever taken (2026-10-03)

The owner ran the prototype on the iPhone XS and read the sheet:

| Readout line | Value | What it means |
| --- | --- | --- |
| `accuracy` | **about 12** | iOS's own `CLHeading.headingAccuracy`, in degrees, untethered |
| `wants calibration` | `false` | iOS considers itself calibrated AND is still 12 degrees uncertain |
| `fused heading` | `-` | Correct: Android-only (FOP). Absent on iOS by design |
| `fused error` | `-` | Correct, same reason |
| `drew on` | **`ceiling`** | The accuracy gate NEVER fired. Every open came from the 3000ms ceiling |

**This is the measurement the prototype existed to produce.** Every prior accuracy reading in this programme was
taken over a cable beside a laptop, which the owner's own rule says measures the desk rather than the room. Session
49 read 25.4, 24.8 and 24.8 that way. **Untethered, in his house, it is about 12.**

### Three things it settles

1. **`expo-location` could never have shown this.** `normalizeAccuracy` (`ios/LocationUtils.swift:9-20`) maps
   everything from 0 to 20 degrees into the same bucket 3, so 12 degrees and a perfect 1 degree are
   indistinguishable through the library. The native module is the only route to the number, which is why row 49
   built it.
2. **`wantsCalibration false` at 12 degrees of uncertainty confirms session 49's finding on new evidence.** iOS
   believes it is calibrated and is still uncertain, which points at a field fixed in the ROOM rather than at a
   hard-iron offset moving with the device. Apple states in writing that calibration removes only fields that move
   WITH the device, so the wave gesture addresses a condition the OS says is not present on his phone.
3. **The owner's measured speed-up was real but came from the CEILING, not from the gate.** He felt 0.5 to 1.5
   seconds and never a full 2. With the bar at 4 and the phone reporting 12, `isCertain` was false on every single
   reading, so every open fell through to the 3000ms ceiling. The ceiling counts from the FIRST HEADING READING
   rather than from the tap, so the sheet's open animation and the watch's startup consume part of it before the
   user can perceive any wait, which is why 3000ms feels like under 2 seconds.

### The decision this forced, and the owner's own question that resolved the units

He asked directly: is the threshold 5 degrees total, or 5 either side? **Apple's header answers it**, read from
iPhoneOS27.0.sdk on this machine:

> "Represents the maximum deviation of where the magnetic heading may differ from the actual geomagnetic heading
> in degrees. A negative value indicates an invalid heading."

A MAXIMUM DEVIATION is a half-angle, so `accuracy 12` means 12 degrees either way, a 24 degree cone. His instinct
matched: 🐋 "5 degrees left and 5 degrees, right? Which I guess equals 10 degrees total... as long as it's within
10 degrees accuracy, then we can show the compass."

**`CERTAINTY_THRESHOLD_DEGREES` raised from 4 to 5**, which is a 10 degree cone. The ceiling is explicitly NOT
touched: 🐋 "don't touch the ceiling yet. It's something I want to address later."

### The open tension, recorded rather than resolved

The owner stated the requirement that the ceiling currently violates: 🐋 "very important, we don't want to show an
incorrect reading to the user." A ceiling that draws after 3000ms REGARDLESS of accuracy does exactly that, on a
phone reporting 12 degrees. The fail-open rule in `ai/AGENTS.md` is what put it there, and the two requirements
genuinely conflict:

| Requirement | Source | What it demands |
| --- | --- | --- |
| Never show an incorrect reading | Owner, 2026-10-03 | Refuse to draw when the phone is uncertain |
| This screen must fail OPEN | Owner, via `ai/AGENTS.md` | Always draw something eventually |

Both cannot hold at once while his phone reports 12 degrees. The honest resolutions are to draw with a visible
uncertainty (a cone, as Apple Maps does), or to draw with a warning, or to accept one rule over the other. **He has
deferred this deliberately**, and it is the single most important open question for the session after the owner's
next test.

## THE GATE FIRED: the owner's device result at 15 degrees (2026-10-03)

After the threshold was raised from 5 to 15, the owner read the sheet on the iPhone XS:

| Readout line | Value |
| --- | --- |
| `accuracy` | **12.5** |
| `wants calibration` | `false` |
| `fused heading` / `fused error` | `-` / `-` (correct: Android-only) |
| `drew on` | **`certainty`** |
| `bar / ceiling` | `15` / `3000ms` |

**`drew on certainty` is the first time the accuracy gate has ever opened the compass.** At 5 it never
fired once: every open in the owner's earlier testing fell through to the 3000ms ceiling, which made the
gate decoration and left the stopwatch doing all the work. The row's goal is met.

**His measured speed**, in his own words: 🐋 "on cold launch, it maybe opens in like less than 500
milliseconds. But then on a warm launch, it opens in literally a 100 milliseconds roughly... It's really
quick... It does work perfectly fine."

Against the 2 to 3 seconds he measured across 20 trials before this row began.

### The animation now flashes, and he has deferred it

🐋 "It does flash the animation, but I think it's okay... We just need to address the different animation
perhaps." The wave hint is mounted while the compass is absent, so at 100ms it appears and vanishes. That
is the sub-second case the row 52 handoff predicted and left open, and it is now real rather than
hypothetical. **Deferred to a session of its own, by the owner.**

### Why 15, in one line each

| Candidate | Why it was rejected |
| --- | --- |
| 0.0002 degrees (the Kaaba's true angular size from London) | physically impossible; nobody outside Makkah has ever faced the building |
| 3 degrees (Malaysia National Fatwa Committee) | unreachable: no phone in any report reaches it indoors |
| 4 degrees (`ALIGNMENT_ENTER_DEGREES`) | never fires |
| **5 degrees** | **measured: fired zero times on the owner's phone** |
| 10 degrees | NO AUTHENTIC SOURCE FOUND, in three rounds of research |
| **15 degrees** | **CHOSEN** |
| 20 degrees | looser than the hardware needs; it is `expo-location`'s own bucket edge |
| 22.5 degrees | one unverifiable Dar al-Ifta English variant, contradicting their own 45 |
| 30 degrees | a validity ruling about an existing mosque, not a target |
| 45 degrees | the validity FLOOR, and it has no classical citation at all |
| ~90 degrees | the classical outer boundary only |

### Is 15 right for every country? Yes, and it was checked

`headingAccuracy` is an angular uncertainty, so 15 degrees means the same thing everywhere; what changes
with distance is the ground error it implies (about 290km from Bahrain, 1250km from London, 2690km from
New York). That argues for a tighter bar far from Makkah only if the fiqh agreed, and **it says the
opposite**: Ibn Uthaymeen, verified, holds that "the further away a person is from Makkah, the more
flexible the direction is for him, because the larger a circle grows, the more leeway there is". The
constraint is the magnetometer, which does not improve with proximity. **One number, worldwide.**

**The one real exception is Makkah itself**, where the same text inverts: at the Kaaba's wall "the
direction is only your body's width". Recorded for a future session; not built.

### The Android expectation, recorded before it is measured

The owner's instinct: 🐋 "on old phones like Android, the OnePlus 3T, I expect it to be more than 3000ms
because it's a slow phone." **Two reasons to expect the Android loop to differ**, both already in evidence:

1. Session 49 measured the XS at **25.4, 24.8, 24.8** degrees tethered. If the 3T sits in that band, a
   15-degree bar will not fire and the ceiling will again do all the work.
2. **Android's FOP reports 180 degrees until the phone has rotated enough** in a uniform field, which iOS
   never does. A stationary 3T may report nothing usable at all until it is moved.

So the Android loop measures the 3T's real band and its real ceiling rather than inheriting the iOS ones.
