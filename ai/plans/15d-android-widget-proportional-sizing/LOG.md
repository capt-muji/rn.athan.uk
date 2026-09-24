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

## Step 3: the native tick stamps the granted width

Branch `feat/15d-stamp-granted-width`, version 1.27.341, commit 22e0f333.

`patchCompositionSize` now writes both stamps in its single existing `commit()`, and its early return compares both,
so a re-grant that keeps the same composition still reaches the layout. That is the case the session added for: a
home-grid change from 4 to 5 columns, or a display-size change, hands the widget a different width without being a
resize at all, and the widgets are declared `resizeMode="none"`.

No Jest suite covers this file: the unit project compiles TypeScript only, and the module's own test covers the JS
binding, which is unchanged and still passes. The proof is step 4's device run. No break script for the same reason:
every substitution would report NOT CAUGHT regardless of correctness, which would be false evidence.

**Self-review by a same-model subagent.** All eight checks passed. Two findings worth keeping:

- **`OPTION_APPWIDGET_MIN_WIDTH` is the correct read, and the choice is load-bearing.** The launcher reports a range
  because one instance is laid out at two widths: MIN is the PORTRAIT bound, MAX the landscape one. Reading MAX
  would let the columns sum past the real portrait width and reintroduce exactly the clipping this session fixes.
  The reasoning now sits in the function's KDoc, because the next reader will otherwise wonder why the smaller of
  the two is used.
- **A pre-existing read-modify-write race was identified, not introduced here.** The tick reads the stored props,
  parses, then commits; a JS push landing between those points is overwritten by the tick writing back the stale
  snapshot with fresh stamps. It has been that way since the `size` stamp shipped in 15b, this commit adds a field
  to the same block without widening the window, and the Android snapshot carries a multi-day window so a single
  lost push usually renders identically. Recorded for the audit, not fixed here.

One comment was tightened: it explained the same point the file header already made, six lines above.

## Step 4: device proof

**The mock build was the wrong build, and the plan said so wrongly.** Section 7 specified
`build-mock-widgets.zsh`, which installs under the `com.mugtaba.athan.fleettest` package. That build installed and
ran (`BUILD-MOCK OK`, versionName 1.27.341, snapshots pushed for Standard and Extras), but `dumpsys appwidget`
showed every PLACED widget on the 3T belongs to `com.mugtaba.athan`, the owner's production package, with
`host.callbacks=null` on the fleettest providers. A widget that is not placed is never measured, so the native tick
has no `OPTION_APPWIDGET_MIN_WIDTH` to read and the proof cannot run.

The proof therefore uses `~/athan-device-sweep/session15/bin/build-prod-widgets.zsh`, which builds the real package
with `EXPO_PUBLIC_ANDROID_WIDGETS=1`, so `adb install -r` upgrades in place and the owner's existing widget
placements carry over. Both phones already run production 1.27.338, so one APK serves both.

The plan's section 7 is corrected to name the production script.

### The readings

Production build 1.27.342 (`BUILD-PROD OK`), installed with `adb install -r` on both phones, placements kept.

**Oppo Find X8, the phone that showed the bug.** Its two medium widgets render at 972px, 90% of the screen width.

| Density | Widget dp | Inner | Hero | List | Name box | Row text | Names read |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 480 (the owner's override) | 324 | 291 | 143 | 148 | 69 | 11sp | all 11 complete |
| 560 (native, the narrowest case) | 278 | 245 | 120 | 125 | 58 | 10sp | all 11 complete |

At 480: every name starts at x 559-560, one clean origin, times right-aligned at x 897-899, pills spanning the full
list block, a 38px gutter. At 560: every name starts at x 555-556, times right-aligned at x 893-895, 28px gutter,
113px minimum name-to-time gap, no ellipsis and no wrapping. `Sunrise` reads `Sunrise`, not `se`; `Dhuhr` reads
`Dhuhr`, not `ar`; `Magrib` reads `Magrib`, not `ib`; `Midnight` reads `Midnight`, not `ight`; `Suhoor` reads
`Suhoor`, not `or`. Both schedules, both themes.

The 560 reading is the one that matters most: it is the narrowest configuration either phone can produce, and it is
where the old fixed 332dp of columns overflowed hardest.

**OnePlus 3T: no medium is on a visible page.** All eight kinds are registered and bound to the launcher, and the
four medium ids render (`views=RemoteViews@...`), but every widget the owner has placed on a visible page is a SMALL
kind, which is hero-only and has no list to clip. The 3T therefore cannot demonstrate the medium either way. What it
does prove is the absence of a regression: the small kinds render correctly on 1.27.342, and the native refresh
chain fires and re-arms on the minute (10:42:00.500 then 10:43:00.500), with the countdown ticking live across
captures (2h 14m then 2h 12m).

Automatic time is ON on both phones, the X8's 480 display-size override is restored, and its mobile data is still
off: every device command ran over USB, and the one network fetch used Wi-Fi (`monkey` reported `0ms mobile`).
