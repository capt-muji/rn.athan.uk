# Execution log: Session 34

## Execution notes

**Order.** Step 7 (the clock pin) ran FIRST, before steps 1 to 6, as `PLAN.md` section 10 permits.
ISSUES #44 makes a commit fail at random inside the last minute before any seeded prayer row, and
this session makes seven commits whose hooks each run for 3 to 4 minutes, so fixing it first removes
that risk from every later commit rather than leaving six of them exposed to it.

**A chevron fix landed before the sweep, at the owner's ruling.** The owner reported the Help
modal's chevron swinging sideways rather than turning in place. It was NOT caused by this session:
`components/modals/Help.tsx` was byte-identical to its state at 1.29.46, verified by hashing the
chevron style block at that commit against the working tree (both `27b96f24`). Three causes, all in
one style block: `textAlign: 'right'` parked the glyph off the box centre that rotation pivots
about, `lineHeight: 12` under `fontSize: 20` dropped its ink below the vertical centre, and the
static `transform: [{ scaleY: 0.6 }]` was dead because `useAnimatedStyle` supplies its own
`transform` array and a later transform REPLACES an earlier one rather than merging. Fixed at
1.29.50 with three tests and eight break mutations, all caught, and confirmed on device by the owner.

**DURABLE LESSON: `$TMPDIR` and the approved scratch directory are NOT the same path, and a stale
commit message is silent.** `$TMPDIR` is `/var/folders/.../T/`, while this harness writes to
`/var/folders/.../T/opencode/`. Step 1's message was written to the `opencode/` subdirectory and
committed with the bare `$TMPDIR/msg-1.txt`, which still held session 33's message from 18:24 the
previous day. `git commit -F` succeeded, the hook passed, and the commit carried a message
describing entirely different work at a version four patches behind. Nothing catches this: the
content was correct and every gate was green. Caught only by reading the commit subject back. The
message was amended and every stale `msg-*.txt` in the bare `$TMPDIR` was deleted so no later step
can pick one up. Write and read a message file by the SAME absolute path, and read the subject back
after every commit.

**Step 2's predicted sweep count was one too high, and steps 3 to 5 with it.** The plan's inventory
lists FIVE symbols for step 2 (`ISTIJABA_INDEX`, `PLATFORM`, `getSecondsBetween`, `perfFlush`,
`getPerfRing`) plus the private `perfStorage`, so 27 - 5 = 22, where the step file predicted 23. The
deletions themselves matched the inventory exactly; only the arithmetic in the "Done when" lines was
wrong. Corrected in place: step 2 now expects 22, step 3 expects 19, step 4 expects 12 and step 5
expects 7. Step 6's 5 is unaffected, because the allow-list is five however the count reaches it.
Measured after each step: 22, 19, and the sweep's own diff confirmed exactly the planned symbols
left each time.

**Step 4's anchor 4-4 covers less than the plan's step text describes.** The anchor holds the doc
comment and signature of `unregisterBackgroundTask` only, so applying it alone left both function
BODIES behind and `tsc` failed with `TS1128: Declaration or statement expected`. The plan's step
text is right about the intent ("the doc comment through the end of getBackgroundTaskStatus, both
functions whole"); the anchor file just cannot express a 65-line span. Restored with
`git checkout --`, then removed by line range after asserting the three boundary lines by content
(`/**` at the doc comment, `};` at the close, and the blank line before). No guesswork: every
boundary was checked before the cut, and `tsc` was clean immediately after.

## Device and bundle proof

**The strongest evidence is the production bundle diff, taken before any deletion and again after
all of them.** `npx expo export:embed --dev false` was run for both platforms at `b990e26f` and at
`29d261a6`, and the exported symbol names were compared:

| Reading | iOS | Android |
| --- | --- | --- |
| Exported names before | 2503 | 2503 |
| Exported names after | 2485 | 2485 |
| Removed | 18 | 18 |
| Added | 0 | 0 |
| Bundle size | 3,912,303 to 3,906,453 (-5,850) | 3,909,226 to 3,903,429 (-5,797) |

The 18 removed are exactly the planned list. Nothing else left either bundle and nothing was added,
which is the measured form of "no functionality changed". The four `clearAllScheduled*` wrappers do
not appear in either count because Metro had already tree-shaken them, so they cost users nothing
even before this session; every other symbol was genuinely shipping. Every live look-alike was
checked by name and is still present: `clearPrefix`, both `removeOneScheduled*`,
`getMeasurementsList`, `setMeasurementsList`, `showAlertSheet`, `hideSettingsSheet`,
`useAnimationScale`, `standardDisplayDateAtom` and `alertSheetStateAtom`.

**iPhone XS replica simulator, iOS 18.5, end to end on the swept code.** Standard page with the
countdown ticking and the active pill; Extras page with Midnight, Last Third, Suhoor and Duha in
canonical order and the magenta pill; the alert sheet opening with the right prayer name, which is
the `getAlertSheetState` repoint proving itself live; an alert changed to Sound and committed, with
`alert_extra_duha` and `scheduled_notifications_extra_` confirmed written into MMKV afterwards; the
overlay opening with its veil, hero row and Arabic explanation; and a day roll observed in flight,
the list advancing Asr to Magrib with passed rows kept and the countdown reading 23h 58m for the
next day, which is `getDisplayDate`'s replacement under exactly the condition ISSUES #27 describes.

**Widgets** were left to the owner to test (owner, 2026-09-28). `widgetRuntimeLoads.test.ts` still
builds and evaluates the real widget bundle for both platforms and passes, so the runtime is proven
to load; only the on-device placement is unverified by this session.

## Step record

| Step | Version | Sweep count after | Breaks | Suite |
| --- | --- | --- | --- | --- |
| 7 (run first) | 1.29.51 | 27 | 3 of 3 | 100%, 4788 |
| 1 | 1.29.52 | 27 | 3 of 3 | 100%, 4788 |
| 2 | 1.29.53 | 22 | 4 of 4 | 100%, 4782 |
| 3 | 1.29.54 | 19 | 6 of 6 | 100%, 4779 |
| 4 | 1.29.55 | 12 | 3 of 3 | 100%, 4764 |
| 5 | 1.29.56 | 7 | 4 of 4 | 100%, 4760 |
| 6 | 1.29.57 | 5 | 4 of 4 | 100%, 4753 |

Step 7 ran first, as `PLAN.md` section 10 permits, so no later commit could be caught by the
clock-dependent failure it fixes. Two commits outside the plan bracket the run: 1.29.50, the Help
chevron the owner reported and approved, and 1.29.58, the device check the audit found failing on a
healthy phone.

Final: 176 suites, 4753 tests, 100% statements, branches, functions and lines. The sweep reports 5
symbols and all five are allow-listed. 1,571 lines deleted against 410 added.
