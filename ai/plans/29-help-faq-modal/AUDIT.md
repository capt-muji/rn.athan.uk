# Audit: Session 29. The Help modal

Audited 2026-09-27, in a scratch worktree at `uat-2` (`11e796ac`), `node_modules` symlinked from the main
checkout. Verdict at the end.

## What was checked

| # | Check | Evidence |
| --- | --- | --- |
| 1 | The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2` lists 12: one planning pair, four step pairs, and their merges. Nothing else |
| 2 | The whole suite, independently | `yarn validate` in the worktree: `Test Suites: 173 passed`, `Tests: 2 skipped, 4759 passed, 4761 total`, 100% on statements (4391/4391), branches (1966/1966), functions (913/913) and lines (3956/3956), `tsc` and Biome exiting 0 |
| 3 | Every break still guards | All three scripts run from the worktree root, each ending `ALL AS EXPECTED: 1`: 13 for step 1, 8 for step 2, 10 for step 3. `grep -n /Users/muji/repos/rn.athan.uk` prints nothing in any of them |
| 4 | Contracts kept | `getHelpTopics(os)` has the plan's name and signature and drops a `null` answer; `openAppSettings` returns false on failure and logs `'NOTIFICATION: Failed to open the app settings:'`; `popupHelpEnabledAtom` is a plain `atom(false)` |
| 5 | The owner's rules | `releases.json` untouched (0 commits against it), `uat` untouched, no ignore comment, no `console.`, no API key, no skipped hook |
| 6 | No purple in the modal | The only match for the app's indigo is a COMMENT saying not to use it. The palette is slate `rgba(52, 78, 92, ...)` plus the existing `COLORS.light.*` modal tokens |
| 7 | The app is never named in user copy | `grep -c 'Athan' shared/help.ts` is 0, and `names no app in any answer` pins it |
| 8 | Versions in lockstep | `app.json`, `package.json` and the gitignored `versionName` all read 1.29.13, rising 1.29.8 to 1.29.13 without a gap |
| 9 | Comments are why-only and compact | Two in `Help.tsx`, both one line, both explaining a constraint (the height share, and the no-purple rule). None on a style value |
| 10 | Nothing scratch survives | `components/modals/` holds only the four real modals. `helpVariants.tsx` is deleted, and `stores/ui.ts` is byte-identical to its pre-session state, verified with `diff` against a copy taken before the scratch edit |
| 11 | The other two modals are untouched in behaviour | `Modal`'s four new props are all optional and default off, and `stays a compact card, and rules nothing off, unless asked` pins `width: '85%'`. `Update.test.tsx` and `WhatsNew.test.tsx` pass unchanged |
| 12 | Device evidence | 25 design screenshots plus the shipped readings under `~/athan-help-designs` and `~/athan-device-sweep/session29/`. The Help modal was read on the iOS simulator through Maestro's hierarchy: the card, its first question, Close on screen, the answers scrolling to the last question, and both Android-only questions correctly absent |

## Findings

**1. Three break substitutions went stale when step 3 rewrote the copy, and two more when the markup changed.**
Found by running all three scripts after the final commit: `breaks-1.sh` printed `BREAK NOT APPLIED` three times
and `breaks-3.sh` four times. A stale break is the worst kind of failure, because it looks like a pass unless the
script counts it, which is exactly why `BREAK NOT APPLIED` is treated as not caught. FIXED: all seven retargeted
at the shipped strings and markup, and all three scripts re-run to `ALL AS EXPECTED: 1`.

**2. A break exposed a missing test, twice, in two different shapes.** In step 1, flipping `{action ? (` to
`{true ? (` rendered an action button on every answer and no test noticed, because the suite asserted WHICH
buttons existed and never HOW MANY. In step 3, defaulting `wide` and `divider` to `true` would have widened the
update prompt and What's New, and nothing looked at either card's width. Both gaps are now covered. **Adding an
option to a shared component is a change to every existing caller until a test says otherwise.**

**3. The brief's own copy was false and would have shipped a lie.** It claimed Android "still plays through the
switch in most cases since 1.28.47"; session 27's conclusion is the opposite. Corrected before the first commit.
A brief is a statement of intent, not evidence.

**4. `perl -0pi` cannot match a multi-byte literal without `-CSD`.** The bullet break silently applied nothing.
The helper now passes `-CSD`.

**5. A copy change reaches every suite that quotes the copy.** `__tests__/app/index.test.tsx` held the first
question's text and was missed on the first attempt; the pre-commit hook caught it.

**6. My own automated screenshot gate produced two false failures.** Design 14 was reported as failing twice and
was nearly discarded. It renders correctly; the gate required more than 50% white pixels and 14's darker wells
sit below that. **A measurement threshold is a claim about the thing being measured, and a false negative from it
is a defect in the harness, not in the subject.** An earlier version of the same loop also produced seven
identical screenshots that a hash check caught, because Fast Refresh remounts `stores/ui.ts` and closed the modal
between captures; the loop now relaunches the app and verifies the modal is on screen before keeping a frame.

Nothing was handed back to an executor: every finding above was fixed in this session.

## Interim status, at the owner's instruction

The owner reviewed 25 candidate layouts on the simulator and chose to ship the corrected design 1 now rather than
settle the final look today: 🐋  "let's just, whatever, ship it as is for now. We will improve it later... We can
mark it as complete, but waiting for chosen design."

So the row reads **DONE (waiting for chosen design)**. What ships is complete and tested; only the visual
treatment is open. Every candidate is kept at `~/athan-help-designs`: the 25 screenshots, a contact sheet, and
`helpVariants.source.tsx`, which is the exact component source that produced them, so a later session can render
any of them again without rebuilding the set.

## Verdict

**PASS.** The six findings above were all fixed in this session, the suite is green at 100% on all four measures,
every break guards, and the shipped behaviour matches the plan as amended by the owner's rulings of 2026-09-27.
