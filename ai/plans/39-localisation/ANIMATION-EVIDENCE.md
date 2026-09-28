# A language change does not touch the animation path

R5 warns that a locale change which REMOUNTS the prayer list would tear the cascade, because a
remount recreates every Reanimated shared value at its initial value and any derived value that
snaps on first evaluation re-snaps. `ai/AGENTS.md` Performance Design Rule 2 and Rule 3 both bear
on this, and the repo has a settled rule that animated geometry is static-in-render or
first-eval-snapped.

Traced through the real code, the risk does not arise, provided one rule is followed.

## How the width actually reaches the row

```
stores/ui.ts        englishWidthStandardAtom / englishWidthExtraAtom   (Jotai, MMKV-backed)
  -> hooks/usePrayer.ts:82     useAtomValue(...)
  -> hooks/usePrayer.ts:118    ui: { maxEnglishWidth }
  -> components/prayer/Prayer.tsx:66
       const computedStyleEnglish = { width: Prayer.ui.maxEnglishWidth + STYLES.prayer.padding.left }
```

That is a **plain JavaScript object in the render body**, applied as a static style. It is not a
`useAnimatedStyle`, not a shared value, and not a worklet.

So when the width changes, React re-renders and the new width is present in the first committed
frame. That satisfies Rule 2 (static-in-render) and Rule 3 (no post-paint initialisation of visible
state) by construction, and it is why the existing grow-only cache never produced a pop.

## What the animated styles actually carry

`components/prayer/Prayer.tsx` uses two animated styles, and neither carries text or geometry that
a locale change alters:

| Style | Carries | Affected by locale? |
| --- | --- | --- |
| `colorStyle` (`useDerivedColor`) | Colour interpolation between muted and primary | No |
| `veilStyle` (`useDerivedOpacity`) | Opacity for the overlay veil | No |

The text itself is an ordinary child of `Animated.Text`, so it re-renders like any other prop.
Reanimated shared values survive a re-render untouched.

## The one rule this creates

**A language change must never remount the prayer list.** Re-render, yes; remount, no.

Concretely, that forbids the "key on locale" pattern, which is a common way to force a tree to
refresh after a language change:

```tsx
<PrayerList key={locale} />   // FORBIDDEN
```

R5 ranks that pattern last of four for exactly this reason, and in this app it would recreate every
shared value, re-snap every derived value and restart any in-flight cascade. Since the width flows
through an atom and the strings flow through props, nothing needs a remount to update.

The plan states this as an invariant with a test rather than as advice, because it is the kind of
thing a later session adds to "fix" a stale string.

## The second rule, from R5

`t()` must never be called inside a worklet or a `useAnimatedStyle`. A worklet captures its closure
at creation time, so a string resolved inside one would freeze at the old locale and could only be
refreshed by recreating the worklet, which is the remount hazard again.

The app already complies: worklets here hold colours and opacity only. The plan records it as an
invariant so it stays true.

## Consequence for the width cache decision

`CONFLICTS.md` 2 chose per-locale width keys over one global grow-only maximum. This trace confirms
the change is safe for animation: switching which atom key is read produces a re-render with a new
static width, which is the same mechanism the existing cache already uses when a wider measurement
arrives late.

What still needs care is the ISSUES #22 race, where a measurement taken before font registration
comes back too narrow. The existing design handles it by only ever widening. Per-locale keys must
keep that property **within each locale**, so the rule becomes "widen-only per locale" rather than
"widen-only globally".

## Reproducing

```bash
grep -n "maxEnglishWidth" hooks/usePrayer.ts components/prayer/Prayer.tsx
grep -n "useAnimatedStyle\|useDerived" components/prayer/Prayer.tsx
```
