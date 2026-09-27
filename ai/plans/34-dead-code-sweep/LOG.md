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
