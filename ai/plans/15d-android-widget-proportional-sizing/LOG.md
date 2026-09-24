# Execution log: Session 15d

## Step 1: the snapshot carries the granted width, and the medium computes its columns from it

Branch `fix/15d-proportional-medium`, version 1.27.340.

**Plan defect found and repaired while executing.** The plan ordered step 2 (the props field) after step 1 (the
layout), claiming the layout could read the field "through an optional access that type-checks before the field
exists". That is false. `tsc` rejected it:

```
widgets/PrayerWidget.tsx(387,32): error TS2339: Property 'grantedWidthDp' does not exist on type 'PrayerWidgetAndroidProps'
```

A contract must exist before the code reading it, so step 2 is folded into step 1 and both land together. The plan's
section 6 records the correction.

**Two test gaps found by the break script, both closed.** The first break run caught 5 of 7:

- `the name box ignores the scale` was NOT CAUGHT, because the tests read only the two widest boxes (hero and list)
  and never asserted the name box itself. That box is the one that clipped on the X8, so this was a real blind spot.
  Added `sizes the row name and time boxes from the granted width`, pinning both boxes at three grants.
- `the row text ignores its ceiling and grows on a wide grant` was NOT CAUGHT, because every grant the tests used is
  at or below the 347dp reference, where `scale <= 1` and the ceiling never binds. A wider grant (a tablet, or a wide
  home grid) does bind it. Extended `keeps the row text at 13sp when the grant is generous` to 420dp and 560dp.

Second break run: `caught 7 of 7`, `ALL AS EXPECTED: 1`.

**Self-review of the diff** (no subagent, per the owner's standing rule of 2026-09-24) found one misplaced comment:
the remainder rationale sat above `stampedWidth` rather than above `LIST_WIDTH`, which it explains. Moved. Comments
were also cut back to why-only and compact, on the owner's instruction given during this session.

### Self-review round 2: a same-model subagent, three more gaps

The owner unlocked subagents during this session, on one condition: a subagent runs the SAME model as the session
that spawns it. Recorded in `ai/prompts/README.md`. A subagent was given the commit and the context and asked to
attack it. It found three things the break script had missed, and each was verified by experiment before being
fixed:

1. **The 10sp floor was never exercised.** Every font test used a grant of 309dp or wider, where the scaled size is
   already 10 and `Math.max` is a no-op. The floor only binds at 286dp and below. Proven by deleting the floor
   entirely: all 39 tests still passed. Added `never shrinks the row text below its legible floor`, at 286 and 258.
2. **The fallback guard was only tested with `undefined`.** Rewriting it as `stampedWidth ?? ANDROID_MEDIUM_MIN_WIDTH`
   left the suite green, yet a native tick stamping 0 would then subtract 33dp of padding from nothing and drive
   every column negative. Proven by the same method. Added `falls back to the declared minimum when the stamped
   width is not usable`, passing 0.
3. **The card padding lived in two places.** `CARD_PAD_START`/`CARD_PAD_END` fed the arithmetic while the modifier
   still passed bare literals, so changing one silently mis-sized every column. The modifier now uses the constants.

It also found an inverted comment in the test helper, which claimed the hero was the widest box when the list is.
Fixed.

Both experiments above now ship as breaks: the script covers 10 substitutions and ends `ALL AS EXPECTED: 1`. It is
saved at `scripts/breaks-step1.sh` with the pre-flight at `scripts/preflight.sh`, so the audit can re-run both.

The subagent also noted two unreachable-today risks, recorded here rather than fixed: the guard checks the grant
rather than the inner width, so a grant below 33dp would still produce negative columns, and the row's own content
exceeds the list column below a 231dp grant. Both sit far under the provider's declared 310dp floor, which is the
narrowest a launcher may offer. They are noted for the audit rather than guarded, because a guard for an
unreachable state is untestable and would not be covered.
