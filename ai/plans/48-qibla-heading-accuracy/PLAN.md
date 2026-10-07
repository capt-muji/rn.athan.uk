# Plan: Session 48. Where the heading comes from: research the alternatives, because the platform's own is not accurate enough

| Field | Value |
| --- | --- |
| Planned at | `ad131a51` (1.29.198), 2026-10-02; shipped in `1c947980` (1.29.201) and `e2de7ba5` (1.29.202) |
| Needs first | 47 |
| Status | DONE 2026-10-02, audit PASS (`AUDIT.md`), accepted by the owner on 1.29.205 |

**The finding: the symptom has two halves, a cold sensor fusion the app can fix, and iron in the room that
no software can.** The fix shipped is `shared/qiblaSettle.ts`: a settling gate that refuses to draw until the
stream converges, taking first-reading error from about 30 degrees to 0.71. The research records are
`MEASURED.md`, `FINDINGS.md`, `DECISION.md` and `agent-reports/`.

The owner's rulings that govern this row, quoted:

🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy. No. I don't care about smoothness
anymore. Accuracy is number 1 importance." (2026-10-01)

🐋  "sometimes it's 20 degrees off, sometimes 30 degrees off. Sometimes 5 degrees, sometimes 10 degrees.
There's a lot of inconsistencies... I'm not happy settling with this yet." (2026-10-02)

🐋  "I want it to work, same as Android, Android phones, Android Google Maps... it should work in the whole
world." (2026-10-01) Hence: no invented constant, no tuned offset, no per-location calibration.

🐋  "the comments should be extremely compact, and they should only explain the why, and they should never
explain the how or the what." (2026-09-26)

## Decisions taken (planning, 2026-10-02)

1. The row ships code, not research only.
2. The gate tests DRIFT, never spread: a converging stream is quiet between consecutive readings and passes
   a spread gate at 27.22 degrees wrong (`MEASURED.md` 1).
3. The window is counted in TIME and must be SPANNED: a reading-counted window needs 120s on a still phone
   (`MEASURED.md` 5); without the span check the gate opens at 29.18 rather than 9.70 degrees (`MEASURED.md` 6).
4. Constants are 3000ms, 8 readings, 1.5 degrees; swept, not tuned by eye; thresholds on a measured residual,
   which the no-constants rule permits.
5. The field-magnitude and dip physics check is REJECTED: misses 30.8 degrees at a 10 uT offset, worst at
   London's latitude (`MEASURED.md` 4). Retires the lever session 40 specified and row 46 listed as untried.
6. Session 40's `event.values` by-reference item is CLOSED as refuted (`agent-reports/R2-android.md`).
7. No new dependency, no native module, no permission change. The native diagnostic is a separate owner
   decision (`DECISION.md`).
8. The alignment haptic stays downstream of the gate: a blind user must never feel a tap on a refused reading.

The gate itself: `hasSettled` requires a trailing 3000ms window holding at least 8 readings spanning nine
tenths of the window whose two halves agree within 1.5 degrees. `processReading` is its only caller; samples
clear on `NO_HEADING` and on `stop()`; the earliest pre-bearing reading is no longer held and replayed
(`heldRef` deleted; readings fill the window during the position read instead).

## The execution correction: the two steps were ONE commit

The plan split the work into `steps/1-settle-arithmetic.md` and `steps/2-gate-the-compass.md` (deleted after
execution; recover from history at `2d66d547` and `48df5ca4`). Step 1 alone was refused by the pre-commit hook:

```
FAIL unit shared/__tests__/unusedExports.test.ts
+   "hasSettled",
+   "trailingWindow",
```

`unusedExports.test.ts` fails the moment a module exports a symbol no production file imports. Measured:
7 unreachable exports after step 1 alone, the pre-existing 5 once step 2 lands. The steps became one commit
(`1c947980`), message as committed. This is a defect in the plan, not the executor, and the third session
running to meet it (44 and 45 both measured the same about their own work). A plan adding an exported symbol
should name that guard in its background.

## Records

- Device proof: none, deliberately. The symptom lives in the owner's room; he judged it on his own phones
  (verdict and aftermath in `LOG.md` and `WHAT-FIXED-IT.md`).
- The native diagnostic that would settle the residual question (`headingAccuracy` in degrees, ten restarts,
  then outdoors) is specified in `DECISION.md`; it cannot be taken through `expo-location`.
- Findings text: added to `ai/features/uat-2/AUDIT-FINDINGS.md` under the exact heading
  `## Session 48: the heading settles before it is drawn` in the docs commit (`e2de7ba5`, 1.29.202).
  Recover with `git show <rev>:ai/features/uat-2/AUDIT-FINDINGS.md` if a later pass removes it.
- Subagents: none. The three `agent-reports/` were commissioned by the planning session under the owner's
  explicit authorisation of 2026-10-02, checked against this repository, and are incorporated with every
  correction recorded.
