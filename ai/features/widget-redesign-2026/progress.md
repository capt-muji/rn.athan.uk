# Handoff — Widget Redesign "Cotton Candy" (session of 2026-08-31, v1.13.1)

## What happened

Owner rejected the purple "Flat royal" widget design (solid background + eyebrow pill).
This session ran a live-simulator evidence loop on the iOS widget (small + medium) and
iterated ~50 designs across 10 exploratory themes, 5 Apple-aesthetic themes, 5
gradient/blob themes, 5 fully-translucent themes, 5 chaotic color themes, and 5
mono-tint themes. Owner converged on the "Cotton Candy" family and picked a final
composite. The evidence folder was deleted at the end (per owner request).

## FINAL design (what ships in `widgets/PrayerWidget.tsx` at 1.13.1)

Small + medium home-screen widget, same recipe (positions untouched from 1.9.0):

| Element | Value |
| --- | --- |
| Card | `containerBackground('rgba(255, 250, 253, 0.55)', 'widget')` — translucent, wallpaper shows through |
| Glow | 3 blurred pastel Circles behind content: pink `rgba(249,168,212,0.5)` 170pt @(-55,-75), blue `rgba(147,197,253,0.42)` 160pt @(65,85), lilac `rgba(196,181,253,0.4)` 130pt @(-70,60), blur 40–45 (`BLOB_A/B/C`) |
| Prayer name | bare text (NO pill), rose `#db2777`, 12pt semibold, kerning 0.5 |
| Countdown hero | ink `#1e1b2e`, 26pt bold, monospacedDigit |
| Absolute time | `rgba(42, 68, 130, 0.42)` (blue tint — owner request) |
| Footer (day · London) | `rgba(42, 68, 130, 0.34)` |
| Medium active row | solid indigo pill `#4f46e5` (matches app sound-picker selection), text `#fce7f3`, stroke `rgba(79,70,229,0.35)`, depth shadow `rgba(30,27,75,0.45)` (owner: "elevated" look, indigo hint, NOT rose) |
| Passed rows | soft blackish-blue `#2f3d5c` (hard black rejected) |
| Upcoming rows | `rgba(42, 68, 130, 0.32)` |
| Stale card icon | `#db2777` |

## Owner's standing design rules (do not violate)

1. NO solid opaque card backgrounds — translucent rgba only ("solid = Android, not iOS").
2. NO gradient on text (shapes/pills/blobs only).
3. NO white background with black borders; no retro/90s/neon — modern 2026 clean only.
4. NO hard black text for rows — soft blackish-blue `#2f3d5c`.
5. Brown is banned; all other colors allowed. Red-tinted shadows rejected (indigo hint instead).
6. Active pill: FULL solid fill (faded/tinted pill + strong border was rejected), pale
   near-white text, and the elevated shadow is loved — keep the depth.
7. Footer (day · location) must stay visible — see lesson 3 below.

## Hard-won technical lessons (expensive to relearn)

1. **Widget render pipeline (stale renders)**: the widget extension caches the layout
   function per process. After editing `widgets/PrayerWidget.tsx`:
   `simctl terminate app` → `simctl launch app` (wait ~10s) → `pkill -f ExpoWidgetsTarget`
   → terminate app → cold `simctl launch` again ×2 → terminate → screenshot. If the
   screenshot shows the previous theme, it is a stale render — re-run the last
   launch/terminate cycle once. `EntryView.swift:28` re-reads
   `__expo_widgets_<name>_layout` from the app group per render, but WidgetKit reload
   delivery after an extension respawn is flaky (pushes from a live app are budget-free).
2. **`glassEffect` is unsupported in the widget runtime** — it silently blanks the host
   view's children (trio vanished, only card+footer rendered). Fake glass with
   `background('rgba(255,255,255,α)', { shape: 'roundedRectangle', cornerRadius: N })`.
3. **Fixed-size orbs inflate the widget's layout height**: a 210pt Circle inside the
   card ZStack grows the widget's reported height past the system slot → iOS clips top
   and bottom → the FOOTER disappears. If blobs come back with sizes >~170pt, pin the
   blob layer to a fixed card-size frame + `clipped()`. The 1.13.1 blobs are ≤170pt,
   which only clips a few safe points.
4. **`containerBackground` accepts rgba() colors** — real translucency over the
   wallpaper works (this is the core of the final design).
5. **`foregroundStyle` accepts gradient objects** (`{ type: 'linearGradient', colors,
   startPoint, endPoint }`) on shapes; also works on Text but text gradients are banned
   by the owner.
6. **A render that throws shows the neutral card** ("Athan — Open the app to refresh"):
   caused by a broken import/undefined constant in the layout (biome `--unsafe` once
   stripped `background`/`blur` imports mid-session). Run `npx tsc --noEmit` after edits.
7. **`simctl launch` on a running app is a no-op foreground** — it does NOT reload JS or
   re-push. Always `terminate` first for a cold launch.

## Design-cycle workflow (for future evidence sessions)

```bash
# per design: edit widgets/PrayerWidget.tsx constants → then:
xcrun simctl terminate booted com.mugtaba.athan 2>/dev/null
xcrun simctl launch booted com.mugtaba.athan && sleep 10 && pkill -f ExpoWidgetsTarget; sleep 2
xcrun simctl terminate booted com.mugtaba.athan
xcrun simctl launch booted com.mugtaba.athan && sleep 10
xcrun simctl terminate booted com.mugtaba.athan && xcrun simctl launch booted com.mugtaba.athan && sleep 10
xcrun simctl terminate booted com.mugtaba.athan; sleep 8
xcrun simctl io booted screenshot evidence/NN-name.png
# then READ the png (opencode) to verify the render; if stale, re-run the last 3 lines.
```

Screenshot verification is mandatory — WidgetKit regularly shows the previous render.

## Test / validation status at commit time

- `npx tsc --noEmit` clean.
- `shared/__tests__/widgetContract.test.ts` updated: anchors now pin the Cotton Candy
  palette (all literals widget-specific; the old `COLORS.*` anchors were removed since
  the widget deliberately mirrors the wallpaper, not the app theme). 8/8 pass.
- Full `yarn validate` not run before push (owner asked for immediate commit/push);
  contract + typecheck green; biome clean on touched files.

## Files touched in the 1.13.1 commit

- `widgets/PrayerWidget.tsx` — the final Cotton Candy design (constants block + bare
  name JSX + Blobs layer; list/pill/stale structure otherwise unchanged).
- `shared/__tests__/widgetContract.test.ts` — palette anchors updated to the final set.
- `app.json` + `package.json` — version 1.13.0 → 1.13.1.
- `ai/AGENTS.md` — memory entry (2026-08-31) with the design + lessons.
- `ai/features/widget-redesign-2026/progress.md` — this handoff.
- `evidence/` — deleted (was untracked; held ~45 design screenshots).

## Not done / open threads

- `releases.json` untouched (owner-only, per policy).
- Lock screen widget untouched (still the 1.12 design; its literals remain allowed in
  the contract test).
- Android widget does not exist; this session was iOS-only per owner instruction.
- If the owner wants pill variants again, the 42/44-style solid pill + matched name is
  the proven pattern: change `EYEBROW_TEXT`, `ACTIVE_BACKGROUND`, `ACTIVE_ROW_TEXT`,
  `STROKE_COLOR`, `ACTIVE_SHADOW` together as one hue set.
