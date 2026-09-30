# Audit: Session 41. The qibla against a street the user can see

Audited 2026-09-30, in a scratch worktree at `~/athan-device-sweep/worktrees/audit-41`, against `uat-2` at
`be0bf5c9`.

**Verdict: PASS, after one fix this audit made itself.**

## What was checked

| Check | How | Result |
| --- | --- | --- |
| The range holds only this session's work | `git log --oneline origin/uat-2..uat-2` | 3 entries: the feature commit, the executed docs commit, and their merge |
| Every break still guards | All four scripts, from the audit worktree's root | **47 of 47 caught**, and each ended `ALL AS EXPECTED: 1` |
| The scripts carry no absolute path | `grep -c '/Users/muji/repos/rn.athan.uk'` on each | 0 in all four |
| Each break restores its file | `git status --porcelain` after the runs | clean |
| The whole suite | `yarn validate` in the audit worktree | **192 suites, 5006 tests, 100% on all four measures** |
| The red check, on the riskiest module | Reverted the street filter to "any named feature" in the worktree | **5 tests failed**, and the file restored clean |
| The invariant | `grep -rn 'useAnimatedSensor\|MAGNETIC_FIELD\|SensorType\|IOSReferenceFrame' components/ shared/ device/ hooks/ app/ stores/` | nothing outside tests |
| Versions in sequence | `git log` | 1.29.149, 1.29.150, then this audit's 1.29.151 |
| The owner's rules | Read the diff | No visual change beyond the screen the owner ordered rewritten, no prayer time touched, no release file, no `uat`, no EAS, no API key, no ignore comment, no skipped hook |
| `LOG.md` records a review | Read it | Yes, with three findings the executor applied under `EXECUTOR-BRIEF.md` section 4 item 8, each recorded |

## Finding 1: the sheet could name a road the user cannot see. FIXED.

**What was wrong.** `tilesAround` returns a 3 by 3 grid and each tile is searched on its own, so
`nearbyStreets` ranked WITHIN a tile and the hook then concatenated the per-tile lists and took
`streets[0]`. The first tile holding any usable street won outright, whatever the others held.

**Measured, on a probe in the audit worktree:**

```
per-tile concat order: Far Road@100m, Near Road@5m
first would be: Far Road
```

So a user standing 5 m from one road could be told to stand along a different road 100 m away. The
direction would still have been geometrically correct, because the turn is recomputed for whichever street
is named, which is the self-correcting property this row rests on. **The damage is to findability, which is
the whole reason the sentence names a street at all.**

**Why the tests missed it.** Every hook test passed a single tile. The plan's own test rows specified one
tile too, so this is a defect in the plan rather than in the execution, and `steps/4-the-drawn-map.md` now
carries the missing row.

**The fix**, in `1.29.151`. The ranking became an exported `rankStreets`, applied once to the combined list.
`nearbyStreets` uses it for its own results, so a single tile behaves exactly as before, and the hook
re-applies it across the grid. A test fails without it: two tiles, one road at 100 m and one at 5 m, and the
answer must name the near one. A nineteenth break, "ranking disabled", was added to `breaks-1.sh`, which now
catches 19 of 19.

## What was checked and found correct

- **The three deletions the owner ordered.** `Dial.tsx`, `dialGeometry.ts` and their suites are gone, with
  `headingFromYaw`, `unwrapAngle`, `dialAngleFromYaw`, `isFieldTrustworthy`, `FIELD_MIN`, `FIELD_MAX`,
  `readDeclination` and `NO_HEADING`. Nothing else imports any of them.
- **`shortestDelta` survived for a reason, not by accident.** Its last caller died with `readDeclination`,
  and rather than delete a helper with a real invariant test, the executor made `qiblaFromStreet` use it.
  Checked: the resulting code is shorter than what it replaced and the 2,704-case brute-force check in the
  planning session still describes it.
- **The sentence strings** match the plan exactly, including the under-5-degree form.
- **No tile is read at mount.** `useQiblaMap` does nothing until `start`, and the sheet calls it from
  `onPresent`. A test pins it.
- **The 25 MB cap** is enforced inside `writeTile`, and the tile keys are deliberately absent from
  `clearAllExcept`'s keep list, so an upgrade drops them.
- **`fflate@0.8.3`** is the only dependency added, with zero transitive dependencies, and
  `widgetRuntimeLoads.test.ts` passes after the nested-copy trap fired and was cleared.

## Device evidence

**There is none, and the records say so rather than implying otherwise.** No phone was connected during this
session: the owner disconnected both Android devices on 2026-09-29 and local tooling drives no taps on a
physical iPhone. `AUDIT-FINDINGS.md` carries a `NOT PROVEN ON DEVICE` paragraph naming the three unproven
things (the tile fetch over a real network, the decode cost on the SD820 and the A12, and the drawn map
itself), and step 6 carries the protocol for when a phone is available.

**This is why the row goes to DONE on the code and not on the feature.** The plan's step 6 is unticked and
stays that way.

## What the next session should know

1. **Step 6 is the only step left** and it needs the owner to hold a phone. It is a device proof, not code.
2. **The 6.2-degree alignment figure is still an estimate**, as `STREET-SENTENCE.md` says. Nothing in this
   session measured whether a user can READ the map, only that it can be drawn correctly.
3. **Row 40's Android heading proof is still outstanding** and is not superseded by this row, because the
   heading path it was about has been deleted rather than fixed.
