# Step 5: Spread-mock rollover proof on the simulator (device, throwaway build)

0. **Anchor check:** anchor `5-1-today-block.txt` counts 1 in `mocks/simple.ts`.
1. **Goal:** Prove the countdown flips to the next prayer instantly when boundaries sit 5 or more minutes apart, killing the last `0:00` fear (LOG §27.2 and §30).
2. **Branch:** `git checkout -b throwaway/16a-spread-mock uat-2`. This branch is NEVER merged and NEVER pushed; it exists to hold a buildable mock swap.
3. **Files:** `mocks/simple.ts` only, on the throwaway branch.
4. **Tests first (red):** None. The throwaway branch commits nothing and runs no hook; the standing mock's own suite deliberately fails against the spread (the 5-minute-spacing test of LOG §15 was removed when the ladder landed), which is exactly why this shape lives on a throwaway branch.
5. **Change.** Replace the `[today]` block's six time lines (anchor `5-1`) with the part-1 spread, verbatim shape preserved:
   ```ts
   fajr: addMinutes(asrAt, -4),
   sunrise: addMinutes(asrAt, 0),
   dhuhr: addMinutes(asrAt, 5),
   asr: addMinutes(asrAt, 49),
   magrib: addMinutes(asrAt, 59),
   isha: addMinutes(asrAt, 419),
   ```
   (the `fajr_jamat` and friends lines stay exactly as they are). The docstring's mock description sentence above `buildTimes` is updated to say: spread rig, five-plus-minute gaps, for widget rollover proofs. Nothing else changes.
   Then NO build at all: the simulator's Debug app reads its JS from Metro, so checking out the throwaway branch IS the build. Ensure Metro runs against this tree, boot the sim, terminate and relaunch the app (`xcrun simctl terminate <udid> com.mugtaba.athan || true` then `xcrun simctl launch <udid> com.mugtaba.athan`) so it downloads fresh mock data and pushes; the dev-launcher auto-loads the last Metro bundle.
6. **Green (the observation).** With the owner watching the sim's home screen:
   - Note the wall time at launch. Sunrise sits about 1 to 2 minutes out; Dhuhr about 6 to 7 minutes out.
   - The countdown ticks to Sunrise; at the boundary the widget flips to Dhuhr. The owner answers: "Did it flip the instant the timer hit zero, or sit at 0:00?" Expected: instant flip.
   - The second flip (Dhuhr to Asr, about 50 minutes later) is NOT worth the wait; the first flip at the 5-minute floor is the whole proof (LOG §13g.3). If the owner wants to watch the second anyway, it is their time.
   - If the flip sits at `0:00` for more than about 10 seconds: confirm the mock block matches the spread verbatim (a 1-minute gap means the edit did not take; relaunch and re-verify the countdown target times first), then STOP with section 2.2's stall question.
   - Record the owner's answer and the wall-clock times in `LOG.md`.
7. **Breaks:** None.
8. **Version and commit:** none on the throwaway branch.
9. **Review:** none.
10. **Cleanup (the merge for this step is a deletion):** `git checkout uat-2 && git branch -D throwaway/16a-spread-mock`. `git status --porcelain` back to the plan files only. The sim returns to whatever the owner wants on screen; note the state in `LOG.md`.
11. **Done when:** the owner's answer is recorded; the throwaway branch is gone; the tree is clean.
