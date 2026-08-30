# Widget Design Session — Handoff

> **STATUS: COMPLETE (2026-08-30).** Winner: "Flat royal" (D5). The countdown policy evolved past this brief during the session — see ADR-011 for the final minute-ceil display & update rules. Kept for history; do not restart from here.

**Start with:** `Read ai/prompts/widget-design.md and begin.`

## Mission

The widget architecture is complete and shipped; the **visual design is rejected as ugly**. Generate **3–5 completely different design variants** for the systemSmall home-screen widget, screenshot each onto the simulator home screen, present the evidence folder to the owner, and let them pick a direction — then iterate details inside the winner.

## Fixed contracts — DO NOT touch these (architecture is done)

- `shared/widgetTimeline.ts`, `shared/widgetTypes.ts`, `stores/widget.ts`, all widget tests — the data layer is final
- Elements shown: **next prayer name, absolute HH:mm, countdown, date, location** — all five, no more, no less
- Countdown label arrives **precomputed** in `props.countdownLabel` (exact app `formatTime` parity: `2h 54m` / `9m 45s` / `2h 54m 30s`) — never reformat inside the layout
- Date arrives precomputed in `props.dateLabel` (app format; Hijri replaces Gregorian when the pref is on)
- Owner-confirmed product decisions: **systemSmall only; NO icons; NO countdown bar; NO Arabic names** — only revisit if the owner explicitly asks
- Widget runtime invariants (enforced by `widgetContract.test.ts`): no module-scope references inside the widget function; helpers inside the body; guard `props == null` (gallery placeholder); keep the `timerInterval` fallback when `countdownLabel` is missing; colors must match the palette test anchors or be added to its `widgetSpecific` list

## Files you edit

| File | When |
| --- | --- |
| `widgets/PrayerWidget.tsx` | The design canvas — everything happens here |
| `shared/__tests__/widgetContract.test.ts` | Only if you introduce new colors (update both anchor lists) |
| `app.json` | **Never during design work** — families/name changes force a full native rebuild |

Style reference (app source of truth): `components/countdown/Countdown.tsx`, `components/day/Day.tsx`, `shared/constants.ts` (COLORS, TEXT sizes 16/26).

## The fast iteration loop (verified — ~30s per cycle, NO native rebuild)

Widget layouts ship in the **JS bundle**: the app re-registers them on every launch. Design changes need only a JS reload:

1. Edit `widgets/PrayerWidget.tsx`
2. `xcrun simctl terminate booted com.mugtaba.athan; sleep 1; xcrun simctl launch booted com.mugtaba.athan`
3. Wait ~20s (JS loads → sync → timeline re-push → WidgetKit re-render)
4. Verify (see methodology below), screenshot, loop
5. `yarn validate` before finishing (runs the contract test)

Only `app.json` changes require `npx expo prebuild --clean -p ios && yarn ios` (~6 min).

## Verification methodology — you are blind to images

**You cannot see screenshots** (no image input in this environment). Never claim a design "looks good":

- **Text/presence checks**: `mobile_list_elements_on_screen` exposes every widget label ("London, UK", date string, prayer name, countdown label, HH:mm) — assert content and hierarchy position via element coordinates
- **Aesthetics**: `save_screenshot` to `evidence/variant-A.png` … and ask the **owner** to judge. The owner picks the winner — always

## Simulator mechanics (verified on iOS 26.5)

- Check device: `xcrun simctl list devices booted`; mobile-mcp device id = the UDID
- **mobile-mcp click/press coordinates are in POINTS (~393×852), not pixels** — take them from `list_elements_on_screen`
- WDA may time out on first call — retry once, it recovers
- Add a widget: long-press empty home space (try (63, 583), 1600ms) → jiggle → **Edit** → **Add Widget** → search "Athan" → tap result row (~ (100, 245)) → **Add Widget**
- Swipes: always pass explicit `x` well away from the screen edge (the tool breaks on negative coordinates)
- The Athan widget sits top-left of home page 1; app bundle id `com.mugtaba.athan`

## Design directions to seed (invent your own too)

- **A. Hero timer** — countdown enormous (~40pt) as the whole card; name tiny above it; `location · date · HH:mm` as one small meta line at the bottom
- **B. Left stack** — everything left-aligned: location/date header, name, countdown, time, tight leading rhythm like a type specimen
- **C. Big time** — absolute HH:mm as the hero (huge, monospaced), countdown secondary directly beneath
- **D. Minimal mono** — single size/weight, muted palette, extreme whitespace, hairline hierarchy
- **E. Depth** — keep the current arrangement but add the `shadow` modifier to texts, mimicking the app's `textShadowColor` depth (see Countdown.tsx styles)

Font options: system weights only (`Roboto` is not in the widget extension); `font({ size, weight, design })` supports `design: 'rounded' | 'serif' | ...`; `minimumScaleFactor(0.6)` prevents long-date truncation.

## Pending at session start

- Version is **1.8.1** (patch policy — every commit patches until the design plan completes)
- Working tree is uncommitted (owner commits manually): 16 modified files, `ai/adr/010/`, `ai/prompts/widget-design.md`, `evidence/*.png`
- Architecture background: `ai/adr/010/ADR.md` + widget invariants in `ai/AGENTS.md` §11
