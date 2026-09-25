# Session 23: Lock Screen widgets — a countdown layout, the colour hierarchy, and readable sizes

iOS only. The Lock Screen accessory faces are an iPhone surface; Android has no lock-screen widget API
(session 18 proved that and shipped nothing).

## 1. Goal

The Lock Screen faces were too small to read and their secondary text was see-through, so the owner
could not use them at a glance. This session sets a legible type scale, replaces the blanket opacity
with a deliberate three-tier hierarchy, and adds a third composition that pairs the prayer name with
the live countdown, for the owner who wants the countdown without the absolute time.

The Lock Screen ends the session with three compositions, each in both schedules, so six kinds:

| Layout | Composition | Kinds |
| --- | --- | --- |
| 1 | Name + absolute time, live countdown beneath (three elements) | `PrayerLockWidget`, `ExtrasLockWidget` |
| 2 | Name + absolute time, one centred line | `PrayerLockWidget2`, `ExtrasLockWidget2` |
| 3 | **New.** Name + live countdown, one centred line | `PrayerLockWidget3`, `ExtrasLockWidget3` |

## 2. Owner decisions (2026-09-25)

Every one taken in this session, on device, on the iPhone XS.

1. **Type scale.** The shipped sizes were tried at +50%, judged too big, then cut by 20% and approved:
   🐋  "worked. reduce font by 20%. too big right bnut now i can see everything fine". Final scale is
   name 17, secondary 14, eyebrow 11.
2. **The hierarchy is three tiers, not one opacity.** 🐋  "the prayer name is in full white... and then
   the absolute time should be in, you know, like that 40%, say, sorry, 60% uh, faded colour."
   The absolute time is the only muted element. Everything else is solid: the owner's standing
   complaint was 🐋  "You like to make the text faint... we want solid colours."
3. **The countdown is solid white**, the owner's call after asking for a recommendation:
   🐋  "The countdown timer. What do you think? What do you suggest? Let's try and keep it 100% as well."
   It is the element a glance is for, so it is not the tier that recedes.
4. **Only the prayer name is bold.** 🐋  "I want the countdown timer. Not to be bold. Only the prayer
   name should be bold for all 3 widgets, well, 6 widgets." Weight now carries the hierarchy that
   opacity used to, which is what lets tier 1 and tier 3 both be solid white without flattening.
5. **Layout 3 is layout 2 with the countdown in place of the absolute time.** 🐋  "Instead of the
   absolute time, we're going to replace it with the countdown timer. So we're going to have the
   prayer name, then the space as normal."
6. **Nothing merges to `uat-2` this session.** 🐋  "push it to your brunch, do not merge it to you, AT
   until I've tested it myself." The plan, the code and the records all land on the session branch.

## 3. The contract

`WHITE` is solid `#ffffff`; `WHITE_MUTED` is `rgba(255, 255, 255, 0.6)`.

| Element | Size | Weight | Colour |
| --- | --- | --- | --- |
| Prayer name | 17 layout 1, 14 layouts 2 and 3 | **bold** | `WHITE` |
| Absolute time | 14 | medium | `WHITE_MUTED` |
| Ticking countdown | 14 | medium | `WHITE` |
| "Out of date", "Open to load times" | 17 | bold | `WHITE` |
| "Open app to refresh" | 14 | medium | `WHITE` |
| "ATHAN" eyebrow | 11 | semibold | `WHITE` |
| Inline face | 14 | medium | `WHITE` |

`WHITE_MUTED` names its role, so the one muted tier cannot spread by being the variable that happens
to be in scope. The old name said which tier it was, not why, and it had leaked onto five elements
the owner never wanted faded.

Layout 3's countdown carries `multilineTextAlignment('center')` and `monospacedDigit()`, both
load-bearing: a `Text(timerInterval:)` reserves a worst-case width and parks its glyphs against the
leading edge of it, and per-second redraws with proportional digits shuffle sideways.

## 4. Design

Layout 3 is a third `'widget'`-directive function, not a branch inside an existing one. The directive
serializes a function body alone and the extension evaluates it in its own runtime, so nothing can be
shared across layouts by reference. Three near-identical functions is what this file's architecture
costs, and the two that already exist established the pattern.

A layout has no way to know its own kind, so the schedule pair differs only in which timeline is
pushed to it: `createWidget` registers one function under two names.

**Rejected:** branching one function on `environment.widgetFamily` or a props flag. Both layouts
render the same families, so there is no signal to branch on, and a props flag would have to survive
the JSON boundary for no gain.

## 5. Steps

1. **Colour hierarchy and sizes** in `widgets/LockPrayerWidget.tsx`: rename `WHITE_SECONDARY` to
   `WHITE_MUTED` in both existing layouts, point every element except the absolute time at `WHITE`,
   drop the countdown to medium weight.
2. **Layout 3**: a new `AthanLockWidgetCountdown` function plus its two `createWidget` exports.
3. **Registration**: two kinds in `app.json`, two `updateTimeline` calls in `stores/widget.ts`.
4. **Tests**: extend `widgetLockRenderer.test.ts` for layout 3 and the hierarchy; update the
   directive count in `widgetContract.test.ts` from 2 to 3.

## 6. Acceptance

- `npx tsc --noEmit` exits 0.
- `npx biome check` exits 0 on every changed file.
- `npx jest shared/__tests__/widgetLockRenderer.test.ts shared/__tests__/widgetContract.test.ts
  --watchman=false --selectProjects=unit` passes, with new tests covering layout 3's live, stale,
  placeholder and error paths, and a test that fails if any element except the absolute time is muted.
- `yarn validate` passes at 100% coverage.
- The version bump is a **minor**: `1.27.400` to `1.28.0`. Two new widget kinds and a new composition
  is a feature, and the owner's 2026-09-25 ruling is that a chunky change stops taking a patch.

## 7. Device proof (iPhone XS, `00008020-0015585C22D2002E`)

A Release build, because the widget extension needs one. Bump the version, then prebuild, then build,
in that order: `expo run:ios` never re-syncs an existing native folder.

The owner performs the taps and reads the screen. Three things to confirm, the third being the only
real risk in the session:

1. Layout 3 appears in the Lock Screen gallery as "Next Prayer (Layout 3)" and "Extra Times (Layout 3)".
2. The name reads bold and solid, the absolute time visibly fainter, the countdown solid and not bold.
3. **Layout 3's countdown actually ticks.** SwiftUI stops updating a timer `Text` once it is
   concatenated. An `HStack` sibling is not concatenation, so it should tick, but this file has never
   put a timer beside another element before and only the device can settle it.

## 8. Records

`ai/AGENTS.md` gains the hierarchy rule and the layout-3 registration chain. `ai/plans/README.md`
gains the row. `LOG.md` holds what execution observed; `AUDIT.md` holds the verdict.
