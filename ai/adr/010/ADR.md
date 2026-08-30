# ADR-010: Widget Redesign — Next-Prayer-Only with Exact App Countdown Format

**Status:** Accepted — display policy superseded by [ADR-011](../011/ADR.md) (architecture unchanged)
**Date:** 2026-08-29
**Decision Makers:** muji

---

## Context

The original iOS widgets (1.7.0–1.8.0) showed a "NEXT PRAYER" header, the next prayer with its time, a live `Text(timerInterval:)` countdown in the system's `1:02:33` colon style, and — on the Medium home screen widget — a six-row list of all the day's prayer times that rolled over at London midnight.

The product direction changed: the widget should show **only the next prayer** — its name, its `HH:mm` time, the countdown, the date, and the location — and the countdown must be **indistinguishable from the app's**, which renders `formatTime` (`1h 2m`, `45s`, `1h 2m 33s`), honors the *show seconds* preference, and reveals seconds only in the final 10 minutes when that preference is off.

A hard platform constraint governs this space: **WidgetKit only re-renders ticking text in its built-in styles** (`timerInterval` → `1:02:33`; `date` + `.relative` → `1 hr, 2 min`). Verified against `@expo/ui/ios/TextView.swift` (57.0.14): no custom-format ticking text, no `showsHours/showsMinutes/showsSeconds` overload — and no `TimelineView` in widgets, so even hand-written native SwiftUI cannot do it. Timeline entries closer than ~5 minutes may be coalesced by the system.

## Decision

1. **Home screen widget becomes systemSmall-only** (Medium family and the day list removed from app.json and the layout). Two groups, mirroring the app's own composition: a header row — location (`London, UK`) on the left, the next prayer's date on the right — and the countdown block copied from the app's `Countdown` component: name above the timer, absolute `HH:mm` time below it. **No icons, no Arabic names, no countdown bar anywhere in the widgets.**
2. **The countdown is a precomputed string** (`countdownLabel`) produced by the pure timeline builder using the app's own `formatTime` with the app's ceil rounding (`getSecondsRemaining` model), so at the instant an entry activates the widget shows exactly what the app shows.
3. **Stepped entries keep it fresh:** the builder emits an entry every 5 minutes (WidgetKit's minimum spacing) for the 24 hours after each push; beyond that horizon entries flip only at prayer boundaries, bounding payload size (~380 entries / ~100KB for the 14-day timeline).
4. **Date label = the next prayer's `belongsToDate`** (Hijri via `formatHijriDateLong` when the preference is on — Hijri *replaces* Gregorian, never shown alongside). It rolls at the Isha boundary — before midnight — removing the need for midnight rollover entries entirely.
5. **Lock Screen widgets** render the same `countdownLabel` (circular shows just the label) without the "NEXT PRAYER" header; all placeholder/stale states are text-only. All countdown surfaces degrade to the live system ticking style when a v1 entry (no label) is still in the store.
6. `PrayerWidgetSettings` shrinks to `showSeconds` + `hijriDate` — the Arabic, bar-visibility, and accent-color mirrors are removed (the widget never renders those elements at all). `initWidgetSettingsSync` re-pushes on their change.

## Consequences

### Positive

- Character-exact countdown parity with the app across every preference combination, verified by Jest (the label is deterministic and testable, unlike system formats).
- Simpler builder: no day-list states, no midnight math, no DST midnight edge cases.
- Smaller per-entry props (no six-row day list) offset the ~4× entry count.

### Negative

- The countdown label can be up to 5 minutes stale and steps in 5-minute jumps (the price of exact format; accepted explicitly).
- ~380 entries per push (was ~100) — closer to the payload comfort ceiling, watched by a test.
- Occasional WidgetKit coalescing may hold a step slightly longer than 5 minutes.

### Neutral

- The seconds display in the final 10 minutes also steps in 5-minute increments; sub-minute precision is unavailable by design.

## Alternatives Considered

### Alternative 1: Live system ticking styles

**Description:** `timerInterval` when seconds are on, `.relative` when off.
**Pros:** Ticks every second; no stepping; fewer entries.
**Cons:** Format differs from the app (colons / "1 hr, 2 min"); `.relative` shows seconds for the whole sub-hour window.
**Why Rejected:** The owner required exact format parity and accepted 5-minute stepping.

### Alternative 2: Custom native module exposing `showsHours/showsMinutes/showsSeconds`

**Description:** Patch/extend the widget runtime with the flagged SwiftUI `Text(timerInterval:...)` overload.
**Pros:** Live tick without seconds.
**Cons:** Still colon format (`1:02`), not app format; deep native work inside the widget extension's JS runtime; fragile across library upgrades.
**Why Rejected:** Does not even achieve parity; high complexity for negative value.

### Alternative 3: Keep Medium widget, redesign around next prayer

**Description:** Retain systemMedium with a bigger next-prayer layout.
**Pros:** No app.json family change.
**Cons:** Owner wants exactly one small widget; Medium without the day list adds little.
**Why Rejected:** Explicit product decision.

## Implementation Notes

- `WIDGET_PROPS_VERSION` bumped to 2; layouts treat a missing `countdownLabel` as a v1 entry and fall back to live ticking text (epochs still valid), so an app update never blanks an existing widget before the first re-push.
- Steps must never land on a boundary instant: the builder stops them one `MIN_ENTRY_SPACING_MS` short (`lastStepMs = min(boundary - 5min, horizon)`).
- The first-entry backdating rule now only concerns boundary proximity (midnight cases are gone).
- Entry-count and payload guards live in `widgetTimeline.test.ts` (< 500 entries, < 120KB over a 16-day span).

## Related Decisions

- Widget foundation and stale guard: see "iOS Widgets" entries in `ai/AGENTS.md` §11.
- Islamic day boundary semantics (`belongsToDate`): [ADR-004](../004-prayer-based-day-boundary.md)

---

## Revision History

| Date         | Author | Change        |
| ------------ | ------ | ------------- |
| 2026-08-29   | muji   | Initial draft |
| 2026-08-29   | muji   | Removed bar/Arabic/icons; header row with date top-right; settings shrunk to seconds + Hijri |
