# Audit: session 49

Audited from a scratch worktree at `uat-2`, `node_modules` symlinked from the main checkout.
**Verdict: FIX IT, then PASS.** One real defect found and repaired in this session. Compressed
2026-10-07 after the row closed DONE; the defect, its fix and the audit's own limits stay.

---

## 1. The range

`git log --oneline origin/uat-2..uat-2` listed six commits, all this session's, nothing foreign:
`4b2f490e` 1.29.210 (step 1: the module and its consumer), `42bb6742` 1.29.211 (the iOS run-loop
fix), `0fcb5fdc` 1.29.212 (the executed docs commit) — each with its `--no-ff` merge — plus the
planning commit `015f23a0` (1.29.209).

## 2. What was checked

`yarn validate` in the scratch worktree: exit 0, **186 suites, 5000 tests**, 100% statements,
branches, functions and lines. Versions in sequence with no gap across `package.json` and
`app.json`; the lockstep guard passes; no new unreachable export (5, pre-existing); no API key,
release file, EAS build or ignore comment; no visual change outside the flag-gated block; both
phones verified on 1.29.211, `fleettest` absent, `auto_time` 1.

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
`requireOptionalNativeModule` resolved to nothing under Jest, and the call silently no-opped. **A
suite that cannot see the call cannot tell a gated feature from an ungated one**, so the diagnostic
could have armed on every production build with the suite fully green.

**This is session 48's own audit finding in a new place**, where deleting the settling gate passed
all 47 tests. Recorded in both because it is the same shape twice: **a guard that every test is
indifferent to is not a guard.**

### The fix, 1.29.213

`Qibla.test.tsx` now mocks the module and carries two tests for the shipped configuration: the sheet
calls `watchQiblaDiagnostic` zero times, and renders no readout. `QiblaDiagnostic.test.tsx` is the
opposite half with the flag mocked on. **Neither alone proves the gate; both together do.**

The mock factory builds its own `jest.fn` rather than closing over a file-scope variable, because
babel hoists `jest.mock` above every declaration — the trap `ai/AGENTS.md` records.

| | Before | After |
| --- | --- | --- |
| The break | SURVIVED | **fails 1 of 65** |
| The break script | caught 5 of 6 | **caught 6 of 6** |
| `Qibla.test.tsx` | 63 tests | 65 tests |

## 4. The other five breaks, all caught before the fix

The flag losing its `EXPO_PUBLIC_ENV !== 'prod'` guard and accepting any truthy value were caught by
`flags.test.ts`; the readout waiting for a reading (which resizes the sheet), a negative accuracy
clamped away (hiding Apple's "invalid" signal), and a never-torn-down diagnostic watch were caught by
`QiblaDiagnostic.test.tsx`.

## 5. Code read, not just counted

Both native modules carry the exact name `ExpoQiblaHeading` with the planned functions and events.
The optional cone is read behind its guard and OMITTED rather than sent as `null`, keeping a null
off the KLDI bridge `ai/AGENTS.md` records rejecting one. A negative `accuracyDegrees` reaches JS
unclamped. No permission is requested anywhere in the module. No `Platform` branch in app code.
`processReading` is untouched, so the settling gate still sits above the haptic. Every comment
explains why rather than what.

## 6. The records are accurate, including about their own limits

The `LOG.md` and the `ai/AGENTS.md` entry both state plainly that the 25.4 / 24.8 / 24.8 readings
were taken on a TETHERED phone beside a laptop, that they therefore measure that desk rather than
the owner's house, and `LOG.md` states that the accuracy was never checked against a known true
bearing. That is the
correct treatment of the session's own headline number, and it is the owner's own observation. The
claim that FOP "buys nothing on the 3T" is backed by the sensor-client dump and three measured
frames, and is correctly bounded to that handset indoors.

## 7. What this audit did NOT verify, stated so nothing is overclaimed

- **No outdoor reading.** Every device measurement was taken indoors on a tethered phone. The
  owner's protocol — disconnect and record outdoors — had not yet run, so nothing here says what
  either phone does in the open.
- **FOP on the S23 is unmeasured.** It is the handset where `watchHeadingAsync` is known good, so it
  is where FOP could still differ, and this session never had it.
- **Row 50's experiments A, B, C and D are untouched**, which the owner asked about directly. All
  four patches from 1.29.205 remain in and remain untested apart.

## 8. Verdict

**PASS**, after the fix in 1.29.213. Row 49 is DONE.
