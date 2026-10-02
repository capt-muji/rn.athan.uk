# Audit: session 49

Audited from a scratch worktree at `uat-2`, `~/athan-device-sweep/worktrees/audit-49`, with
`node_modules` symlinked from the main checkout.

**Verdict: FIX IT, then PASS.** One real defect found and repaired in this session.

---

## 1. The range

`git log --oneline origin/uat-2..uat-2` listed six commits, all this session's, with nothing foreign:

| Sha | Version | What |
| --- | --- | --- |
| `e7c3b01f` | 1.29.210 | Step 1: the module and its consumer |
| `fec1bf72` | | its merge |
| `3d177c55` | 1.29.211 | The iOS run-loop fix |
| `75e1e17b` | | its merge |
| `1276d938` | 1.29.212 | The executed docs commit |
| `dfc031dc` | | its merge |

Plus the planning commit `e1188793` (1.29.209), already pushed at `3eceeebf`.

## 2. What was checked, with the command that proves it

| Check | Command | Result |
| --- | --- | --- |
| The whole suite, independently | `yarn validate` in the scratch worktree | exit 0, **186 suites, 5000 tests**, 100% statements, branches, functions and lines |
| Versions in sequence | `git show <sha>:package.json` for each | 1.29.210, 1.29.211, 1.29.212, no gap |
| `app.json` and `package.json` agree | the same, both files | identical at all three |
| The lockstep guard itself | `npx jest shared/__tests__/versionLockstep.test.ts` | 3 passed |
| No unreachable export | `python3 scripts/find-unused-exports.py` | 5, the pre-existing entries only |
| No API key, no release file, no EAS build | the diff | none present |
| No visual change | `git show e7c3b01f -- components/sheets/screens/Qibla.tsx` filtered for colour, size, spacing, font | no hit outside the flag-gated block |
| No ignore comment | the diff | none |
| Both phones | `dumpsys package`, `devicectl device info apps` | both on 1.29.211, `fleettest` absent, `auto_time` 1 |

## 3. THE FINDING: the plan's own invariant was guarded by nothing

`PLAN.md` section 3 states the invariant: with the flag off, nothing arms and nothing renders. **A
six-break script written for this audit found that deleting the flag check entirely passed the whole
suite.**

```
run "diagnostic arms with the flag off" hooks/useQibla.ts \
  "if (FEATURE_FLAGS.qiblaDiagnostic) {" "if (true) {" \
  components/sheets/screens/__tests__/Qibla.test.tsx components
-> SURVIVED (bad)
```

**The cause:** `Qibla.test.tsx` never mocked `@/modules/qiblaheading`, so the real binding loaded,
`requireOptionalNativeModule` resolved to nothing under Jest, and the call silently no-opped. **A suite
that cannot see the call cannot tell a gated feature from an ungated one**, so the diagnostic could have
armed on every production build with the suite fully green.

**This is session 48's own audit finding in a new place**, where deleting the settling gate passed all 47
tests because the shared helper had been taught to report a settled window. Recorded in both because it is
the same shape twice: **a guard that every test is indifferent to is not a guard.**

### The fix, 1.29.213

`Qibla.test.tsx` now mocks the module and carries two tests for the shipped configuration: the sheet calls
`watchQiblaDiagnostic` zero times, and renders no readout. `QiblaDiagnostic.test.tsx` is the opposite half
with the flag mocked on. **Neither alone proves the gate; both together do.**

The mock factory builds its own `jest.fn` rather than closing over a file-scope variable, because babel
hoists `jest.mock` above every declaration: the first draft failed with
`Cannot access 'mockWatchDiagnostic' before initialization`, which is the trap `ai/AGENTS.md` records.

Measured after the fix:

| | Before | After |
| --- | --- | --- |
| The break | SURVIVED | **fails 1 of 65** |
| The break script | caught 5 of 6, `ALL AS EXPECTED: 0` | **caught 6 of 6, `ALL AS EXPECTED: 1`** |
| `Qibla.test.tsx` | 63 tests | 65 tests |

## 4. The other five breaks, all caught before the fix

| Break | Caught by |
| --- | --- |
| The flag loses its `EXPO_PUBLIC_ENV !== 'prod'` guard | `flags.test.ts` |
| The flag accepts any truthy value rather than exactly `'1'` | `flags.test.ts` |
| The readout waits for a reading, which resizes the sheet | `QiblaDiagnostic.test.tsx` |
| A negative accuracy is clamped away, hiding Apple's "invalid" signal | `QiblaDiagnostic.test.tsx` |
| The diagnostic watch is never torn down | `QiblaDiagnostic.test.tsx` |

## 5. Code read, not just counted

- **The contracts match the plan.** Both native modules carry the exact name `ExpoQiblaHeading`; the
  Kotlin exposes `isFusedOrientationAvailable`, `startFusedOrientation`, `stopFusedOrientation` and the
  `onFusedOrientation` event; the Swift exposes the three `HeadingAccuracy` functions and
  `onHeadingAccuracy`.
- **The optional cone is read behind its guard**, as `MEASURED.md` section 2 required, and the key is
  OMITTED rather than sent as `null`, which keeps a null off the KLDI bridge that `ai/AGENTS.md` records
  rejecting one.
- **A negative `accuracyDegrees` reaches JS unclamped**, verified by the break above.
- **No permission is requested anywhere in the module**, verified by grep across all six module files.
- **No `Platform` branch in app code**; the only mention is a comment explaining why there is none.
- **`processReading` is untouched**, so the settling gate still sits above the haptic.
- Every comment explains why rather than what, and none is a paragraph.

## 6. The records are accurate, including about their own limits

The `LOG.md` and the `ai/AGENTS.md` entry both state plainly that the 25.4 / 24.8 / 24.8 readings were
taken on a TETHERED phone beside a laptop, that they therefore measure that desk rather than the owner's
house, and that the accuracy was never checked against a known true bearing. **That is the correct
treatment of the session's own headline number**, and it is the owner's own observation rather than one
the session arrived at unaided.

The claim that FOP "buys nothing on the 3T" is backed by the sensor-client dump and three measured
frames, and is correctly bounded to that handset indoors.

## 7. What this audit did NOT verify, stated so nothing is overclaimed

- **No outdoor reading.** Every device measurement in this session was taken indoors on a tethered
  phone. The owner's protocol, disconnect and record outdoors, has not yet run, and until it does
  nothing here says what either phone does in the open.
- **FOP on the S23 is unmeasured.** It is the handset where `watchHeadingAsync` is known good, so it is
  where FOP could still differ, and this session never had it.
- **Row 50's experiments A, B, C and D are untouched**, which the owner asked about directly. All four
  patches from 1.29.205 remain in and remain untested apart.

## 8. Verdict

**PASS**, after the fix in 1.29.213. Row 49 is DONE.
