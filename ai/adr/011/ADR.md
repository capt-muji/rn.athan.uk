# ADR-011: Widget Countdown Display & Update Policy

**Status:** Accepted
**Date:** 2026-08-30
**Decision Makers:** muji

---

## Context

ADR-010 shipped the widget architecture (pure timeline builder, 5-minute stepped entries, precomputed `countdownLabel`, terminal stale guard) with the countdown rendered "exactly like the app": `formatTime` parity including seconds in the final 10 minutes, a `Text(timerInterval:)` live ticking fallback, and a `showSeconds` preference mirror.

Through the design session (2026-08-29/30) the owner rejected a series of countdown behaviors and settled on a simpler, more deterministic policy. Three platform facts (re-verified against Apple's documentation, the WidgetKit source-level behavior, and `@expo/ui` 57.0.14's `TextView.swift`) constrain the space:

1. **WidgetKit only auto-ticks its own text formats.** `Text(timerInterval:pauseTime:countsDown:showsHours:)` has exactly four parameters and renders the colon clock style (`9:05`, `1:05:09`). `@expo/ui` passes our `timerInterval` prop straight into that initializer. There is no custom-format ticking — `9m 5s` can never tick.
2. **Timeline entries closer than ~5 minutes may be coalesced** (Apple: "create timeline entries that are at least about 5 minutes apart"), and reloads are budgeted (40–70/day for a frequently viewed widget) — except reloads made while the containing app is foreground, which are free.
3. **A static label is only as fresh as its last render.** Between renders it ages; renders happen at entry dates (system-driven, free) or after app pushes (reloads).

The owner's observations that drove the change: seconds in a static label look wrong when the label only refreshes per-minute ("8m 57s" frozen); the system colon format (`0:45`) is not the app's format and its perceived clock alignment felt off; a phantom "5m" appeared when a push landed inside the final 5 minutes (the backdated first entry labeled its backdated date, not the push).

## Decision

1. **Minute-ceil labels, no seconds, ever.** `countdownLabel` is produced by `formatCountdownMinutes` (new in `shared/time.ts`): total minutes = ceil(remaining seconds / 60), rendered `Xh Ym` / `Xh` / `Xm`, with `Math.max(1, …)` so the final minute holds "1m" until the next-prayer flip. Examples: `1h 59m 01s` → `2h`; `59s` → `1m`; `0s` → `1m`. Rounding up means a label never overstates the remaining time and only changes at true minute boundaries.
2. **No `timerInterval` anywhere.** Both layouts render only the precomputed label. The system's ticking colon format is retired (format mismatch + perceived desync). Lock Screen v1-entry fallback degrades to the absolute `HH:mm`, never a system timer.
3. **Backdated first entry labels the push instant.** When a push lands inside the final 5 minutes of a segment, the builder still backdates the first entry to boundary−5:00 (spacing invariant) but computes the label at the push — no phantom larger countdowns.
4. **Label-flip scheduler** (`stores/widget.ts`): after every push, schedule the next push at the next countdown minute flip + 250 ms. While the app runs, the widget re-renders within a quarter second of every true minute change, at any distance — no blind polling, no drift, foreground reloads are budget-free (Apple). Backgrounded timers coalesce into one fire on foreground return, doubling as a refresh. Replaced: the blind 60 s interval and the 10-minute-line one-shot.
5. **`PrayerWidgetSettings` is `hijriDate` only.** The `showSeconds` mirror is dead (labels ignore it); the settings sync subscribes to `hijriDateEnabledAtom` alone.
6. **Design**: "Flat royal" — solid `COLORS.navigation.rootBackground` card, hero `#e6f0ff` (success-white brightened) bold 26 pt (= `TEXT.sizeLarge`, so worst-case `24h` clears the edges), secondary `COLORS.text.secondary`, footer `COLORS.text.muted` `Sat · London` (day derived from `dateLabel.split(',')[0].slice(0,3)`; Hijri yields the 3-letter month).

## Consequences

### Positive

- One deterministic, fully testable label format across home + Lock Screen at every distance.
- Wall-clock-accurate labels: the value changes exactly when the remaining time crosses a whole minute; the scheduler pushes moments after each flip while the app runs.
- Simpler widget store (one scheduler instead of two mechanisms), no preference coupling to the countdown.

### Negative

- With the app closed, the label ages up to 5 minutes between stepped entries (WidgetKit floor) — inherent to the platform; the flip scheduler masks it whenever the app has run recently.
- The final minute shows a static "1m" rather than ticking seconds — an explicit trade for format consistency.

### Verification

- `shared/__tests__/widgetTimeline.test.ts` — ceil semantics, push-anchored backdate labels, minute-ceil parity across every entry.
- `shared/__tests__/widgetSimulation.test.ts` — ~4,000-instant virtual week asserting the active label at every instant.
- `stores/__tests__/widgetIo.test.ts` — flip-scheduler cadence (one push per minute flip, at any distance).
- On-simulator evidence: `24h` and `2h` states screenshot-verified (`evidence/final-24h.png`, `evidence/final-2h.png`); owner manually verified the `2m → 1m → next prayer (23h 56m)` descent live.

## See Also

- [ADR-010](../010/ADR.md) — widget architecture (timeline builder, spacing, stale guard) — unchanged.
- Apple: [Keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date), [Displaying dynamic dates](https://developer.apple.com/documentation/widgetkit/displaying-dynamic-dates).
