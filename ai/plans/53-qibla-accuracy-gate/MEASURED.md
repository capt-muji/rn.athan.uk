# What this planning session measured, and the four corrections it makes to the brief

`ai/plans/NEXT-SESSION-QIBLA-ACCURACY-GATE.md` is the row's brief and it is accurate about the goal, the owner's
decisions and the traps. Four of its statements are wrong in detail, and each one was measured here rather than
reasoned about. Three of them would have cost the execution session real time; one would have shipped the owner a
build in which nothing changed.

Every measurement below was taken in a scratch worktree at `uat-2` `380a2a41`, removed before this plan was
committed.

---

## 1. THE BRIEF'S RECOMMENDED ROUTE BREAKS 58 EXISTING TESTS, and the brief calls it untested

Trap 5.1 recommends putting the prototype's decision logic inside `modules/qiblaheading/`, because that path is
exempt from the coverage gate. The brief is honest that this is unproven: 🐋 "That `modules/qiblaheading` is a
viable home for untested prototype logic is reasoned, not tested."

**It is viable, and it has a trap the brief does not carry.** Two suites replace the whole module with a factory:

```typescript
// components/sheets/screens/__tests__/Qibla.test.tsx:32
jest.mock('@/modules/qiblaheading', () => ({ watchQiblaDiagnostic: jest.fn(() => jest.fn()) }));
```

A factory like that does not inherit the module's other exports. So the moment `hooks/useQibla.ts` imports a new
function from `modules/qiblaheading`, every test in those two suites throws. Measured by adding one exported
function and calling it from the hook's gate:

```
TypeError: (0 , _qiblaheading.spikeGateOpens) is not a function
Test Suites: 1 failed, 1 passed, 2 total
Tests:       58 failed, 34 passed, 92 total
```

**The fix, and the plan specifies it rather than leaving the executor to find it:** both factories spread the real
module first, so every export the hook reaches exists and the REAL gate logic runs inside the suite.

```typescript
jest.mock('@/modules/qiblaheading', () => ({
  ...jest.requireActual('@/modules/qiblaheading'),
  watchQiblaDiagnostic: jest.fn(() => jest.fn()),
}));
```

Measured after that change, with the new logic in `modules/` and no test written for it:

| Gate | Result |
| --- | --- |
| The two qibla suites | `Tests: 92 passed, 92 total` |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | `Checked 383 files`, no fixes |
| Full suite with coverage | `Test Suites: 187 passed`, `Statements 100%`, `Branches 100%`, `Functions 100%`, `Lines 100%` |
| `hooks/useQibla.ts` alone | 100% on all four measures, with the module's logic mocked away |
| `scripts/check-changed-coverage.js --staged` | exit 0, with `modules/qiblaheading/index.ts` and `hooks/useQibla.ts` both staged |

**Spreading the real module is strictly better than stubbing the new function**, and the difference matters for
row 53's own follow-up session: a stub would make the suite blind to the gate, which is exactly the trap row 52
recorded as THE BIGGEST ONE (deleting the entire warm path passed all 221 qibla tests). With `requireActual` the
suite executes the real decision, so the later coverage session starts from tests that can see it.

### The exemption is real, proven by making the gate refuse

An exit 0 from a gate proves nothing on its own: a missing path and a real pass look identical. So the same gate
was given a genuinely uncovered function in a MEASURED path, and it refused:

```
Coverage gate: every changed source file needs 100% coverage.
  shared/qiblaSettle.ts: changed after coverage was measured. Run `yarn validate` again
EXIT=1
```

So the pass above is a real exemption rather than a silent no-op. `modules/` is outside the measure at BOTH gates,
which is why the route works:

| Gate | Where `modules/` sits |
| --- | --- |
| Global thresholds (`jest.config.js:110-122`) | absent from `collectCoverageFrom`, which lists `api app components device hooks stores widgets shared` only |
| Staged gate (`scripts/check-changed-coverage.js:40`) | listed in `UNMEASURED`, reason `native Kotlin module; its JavaScript surface is device/tls13.ts, which is measured` |

**`--no-verify` is therefore never needed, which is the point.** It is banned by `ai/AGENTS.md`.

---

## 2. THE FIELD NAMES IN THE BRIEF DO NOT EXIST

Trap 5.3 and section 3 of the brief name the module's Android field `headingErrorDegrees`. **The module does not
export that name.** Read from `modules/qiblaheading/index.ts:15-24`, the real shape is:

| Brief says | The module actually exports | Platform |
| --- | --- | --- |
| `accuracyDegrees` | `accuracyDegrees` ✅ | iOS, `CLHeading.headingAccuracy`, real degrees |
| `wantsCalibration` | `wantsCalibration` ✅ | iOS |
| **`headingErrorDegrees`** | **`fusedErrorDegrees`** ❌ | Android, FOP's cone |
| (not named) | `fusedHeadingDegrees` | Android, FOP's own heading |

`headingErrorDegrees` is the name of the NATIVE payload key inside the Kotlin
(`QiblaHeadingModule.kt:86`) and of the Android payload type, and `watchQiblaDiagnostic` renames it to
`fusedErrorDegrees` when it crosses into `QiblaDiagnostic`. An executor coding against the brief's name would
write a gate reading `undefined` on every Android sample, which **fails CLOSED on a field that is already
optional**, and the Android half would silently never open.

---

## 3. THE DIAGNOSTIC FLAG IS OFF IN THE COMMITTED CATALOGUE, so a mock build shows nothing

Trap 5.2 says the flag cannot reach a mock build because `build-mock.zsh` unsets every `EXPO_PUBLIC_*` variable.
**The unset is real and the conclusion is wrong: the script writes its own `.env` from the committed
`.env.example`, so the catalogue IS the way in.** Lines 113 to 118 of `build-mock.zsh`:

```bash
if [[ -s $WT/.env.example ]]; then
  grep -vE '^EXPO_PUBLIC_(ENV|API_KEY)=' $WT/.env.example > $WT/.env || fail "cannot write $WT/.env"
```

So every variable in `.env.example` except `ENV` and `API_KEY` reaches prebuild, Metro and Gradle. The reason the
owner's installed build shows no readout is simpler than the brief's: the catalogue pins the flag OFF.

```
.env.example:23:EXPO_PUBLIC_QIBLA_DIAGNOSTIC=0
```

**Proven, rather than argued, from the owner's own installed APK.** `EXPO_PUBLIC_ANDROID_WIDGETS=1` lives in the
same catalogue, and the widgets it gates are present in the mock build on his phone:

```
package: name='com.mugtaba.athan' versionName='1.29.244'
widget providers in the manifest: 8
```

A build whose `androidWidgets` flag was off would declare zero providers (`ai/AGENTS.md`, 2026-09-25: the prebuild
strips the plugin entirely). Eight providers is the catalogue reaching the build, measured on the artefact the
owner is running.

**And the flag has a second clause that matters more than the unset:**

```typescript
qiblaDiagnostic: process.env.EXPO_PUBLIC_QIBLA_DIAGNOSTIC === '1' && process.env.EXPO_PUBLIC_ENV !== 'prod',
```

`build-mock.zsh` exports `EXPO_PUBLIC_ENV=local`, so the second clause passes on a mock build and fails on a
production one. A mock build is therefore the only build that can show the readout at all, which is exactly the
build the owner asked for.

---

## 4. THE 2700ms THE GATE IS BLAMED FOR IS NOT THE WHOLE WAIT

The brief's section 2 table says the span check IS the entire wait, and that is right about which condition binds.
It understates the arithmetic by one step, and the plan's ceiling depends on the difference.

`hasSettled` opens only when the window SPANS `SETTLE_WINDOW_MS * 0.9`, measured from the window's OLDEST sample
(`shared/qiblaSettle.ts:98`). The window is trailing, so the oldest sample is itself at most `SETTLE_WINDOW_MS`
old. The wait is therefore 2700ms **after the first reading the sheet ever receives**, and the readings start
only once `watchHeading` has armed. The brief's own measured figure for the owner's phones, 2 to 3 seconds of
animation, matches that and not a bare 2700ms.

So the replacement gate must open on an ACCURACY reading, not on a clock, and anything it waits for has to be
bounded by a ceiling that cannot depend on a reading arriving at all. Section 5 of `PLAN.md` specifies that
ceiling, and `ai/AGENTS.md`'s fail-open rule is why it exists.

---

## 5. What is on the phones right now, confirmed rather than quoted

Both were attached while this plan was written, so these are readings rather than recollections:

| Phone | Reading | Command |
| --- | --- | --- |
| OnePlus 3T `8f7ada76` | `versionName=1.29.244`, mock data | `adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan` |
| iPhone XS `00008020-...2E` | `Athan com.mugtaba.athan 1.29.241`, production | `xcrun devicectl device info apps --device 00008020-0015585C22D2002E` |

They are not on matching builds, and the XS predates row 52's truncation fix, so it still shows
`Hold flat and...`. The device proof puts both on the same mock build of this row's code, which is also the first
time the owner sees that fix on the iPhone.

---

## 6. The owner's instant-draw worry, answered from the code

He accepted drawing instantly with no animation and then questioned his own answer: 🐋 "what if the compass is not
ready to render? What if we're still building the compass?" He then self-corrected, and the code says he was right
to.

**An instant draw cannot paint a compass that has no bearing.** `components/sheets/screens/Qibla.tsx:118`:

```typescript
const showsCompass = bearing !== null && hasHeading;
```

Both terms are required, so the compass mounts only when the bearing exists. Two further facts close it:

- **The instant path already ships and he has accepted it on both phones.** Row 52's warm reopen draws with no
  animation at all, at 1.29.239, the build he named as his revert point.
- **The dial is memoised on its size and bearing** (`QiblaCompass.tsx`: `Dial`, `Kaaba` and `Needle` are each
  `memo`), which is what session 37 measured at a 16.7ms median frame gap. There is no build cost to wait through.

So nothing is specified to handle a half-built compass, because the condition cannot arise.
