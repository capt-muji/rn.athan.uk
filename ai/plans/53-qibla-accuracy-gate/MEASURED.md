# What the planning session measured, and the four corrections it made to the brief

The row's brief (in git history under `ai/plans/NEXT-SESSION-QIBLA-ACCURACY-GATE.md`, verifiably at commit `57d30a86`) was right about the goal and the traps and wrong
in four details, each measured (in a scratch worktree at `uat-2` `380a2a41`, since removed) rather than reasoned.

## 1. The brief's recommended route (the gate inside `modules/qiblaheading/`) breaks 58 existing tests

Two suites replace the module with a `jest.mock` factory that does not carry its other exports, so the moment the
hook imports a new function from the module, every test in those suites throws (`58 failed, 34 passed`). The fix,
which the coverage step specifies: both factories spread the real module first
(`...jest.requireActual('@/modules/qiblaheading')`), so the REAL gate logic runs inside the suite. A stub would make
the suite blind to the gate, which is the trap row 52 recorded as THE BIGGEST ONE.

The `modules/` exemption from the coverage gate was proven real by making the gate refuse on an uncovered file,
and `--no-verify` is never needed for this route.

## 2. The field names in the brief do not exist

The module exports `accuracyDegrees` (iOS, from `CLHeading.headingAccuracy`) and `wantsCalibration`; on Android it
is `fusedErrorDegrees` (FOP's cone) and `fusedHeadingDegrees`, NOT `headingErrorDegrees`, which is only the native
payload key inside the Kotlin (`QiblaHeadingModule.kt:86`). A gate coded against the brief's name would read
`undefined` on every Android sample and fail closed on an optional field: the Android half would silently never open.

## 3. The diagnostic flag is pinned OFF in `.env.example:23`, so a mock build shows the readout only if the catalogue says so

`build-mock.zsh` writes its own `.env` from the committed `.env.example` (every `EXPO_PUBLIC_*` except `ENV` and
`API_KEY`), so the catalogue IS the way in; the brief's claim that the unset blocks the flag was wrong. The flag
also has a second clause, `process.env.EXPO_PUBLIC_ENV !== 'prod'`, so only a mock build can show the readout at
all. Proven on the owner's installed APK: `EXPO_PUBLIC_ANDROID_WIDGETS=1` from the same catalogue yields 8 widget
providers in `versionName=1.29.244`.

## 4. The 2700ms the stopwatch is blamed for is not the whole wait

`hasSettled`'s span check is measured from the window's OLDEST sample, and the window is trailing, so the wait is
2700ms AFTER the first reading the sheet ever receives, which is why the owner's measured 2 to 3 seconds exceeds
a bare 2700ms. Consequence: the replacement gate opens on an ACCURACY reading, and anything it waits for must be
bounded by a ceiling that cannot depend on a reading arriving.

## 5. Phones at planning time, confirmed not quoted

OnePlus 3T `3T_SERIAL` on 1.29.244 mock; iPhone XS `IPHONE_UDID` on 1.29.241 production (predating row 52's
truncation fix). Not on matching builds; the device proof put both on this row's mock build.

## 6. The owner's instant-draw worry, answered from the code

He asked whether an instant draw could paint a half-built compass and self-corrected. The code agrees:
`Qibla.tsx:118` (`const showsCompass = bearing !== null && hasHeading;`) cannot mount a compass without a
bearing, the warm-reopen instant path already ships at his accepted build, and the dial is memoised on size and
bearing (`QiblaCompass.tsx`), which session 37 measured at a 16.7ms median frame gap. The condition cannot arise;
nothing is specified for it.
