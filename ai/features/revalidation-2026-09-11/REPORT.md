# Revalidation and re-plan — 2026-09-11

The owner found that the 2026-09-10 sessions had run on Sonnet 5, lost confidence
in the work and in the plan, and ordered a full re-audit and re-plan on Opus 5.
This is the result. Branches: `fix/revalidation-2026-09-11` (1.24.7, correctness
and docs) and `perf/bar-visible-steps` (1.24.7 + 1.24.8 bar + 1.24.9 night times).
Nothing is merged to uat.

## Method

- Three independent Opus code reviewers, one per commit group, told to trust
  nothing in commit messages or docs.
- One Opus architect given only the owner's goals and constraints — none of the
  earlier conclusions — for an unanchored re-plan.
- Direct checks against installed `node_modules`, git history, and GitHub
  (issue text, PR diffs, release notes).
- On-device runs on the OnePlus 3T (Android 9, 1080×1920): scripted resume tests,
  Extras overlays, screen recordings of the next-prayer advance and the day roll,
  per-thread idle CPU from `/proc`, overlay and sheet marks. Screenshots were read
  by Opus vision agents; timings came from scripts, not impressions.

## Verdict on the 2026-09-10 work

| Change | Claim | Verdict |
| --- | --- | --- |
| 1.24.3 Reanimated 4.5.1 → 4.6.0 | Fixes the Android stale-after-resume family | **Upgrade justified, mechanism wrong.** Upstream #9574 (third-party report, Reanimated 4.4.0 / RN 0.85.3) is the settled-props sync committing a stale snapshot after resume; PR #9527 fixed it in the C++ `AnimatedPropsRegistry`. Present in 4.6.0, absent in 4.5.1. `NodesManager.kt`, which the docs blamed, is byte-identical in both. |
| 1.24.1 / 1.24.3 `[resync]` arrays | Re-apply animated values on resume | **Did nothing.** Reanimated 4.6 ignores that argument on native (web only). Removed in 1.24.7. |
| 1.24.3 alert-bounce resume guard | Stops a stranded bounce | **Defect.** Cancelling mid-dip skips the glyph swap, so the bell could keep the old icon; Reanimated finishes the bounce on resume by itself. Reverted in 1.24.7. |
| 1.24.3 Ago derived colours | Same behaviour, resume-safe | **Lost the snap on first ready data** (possible green flash). Fixed in 1.24.7. |
| 1.24.3 Navigation dots | Derived, resume-safe | OK. Re-renders Navigation on each page settle; no measured cost (pager 16–17ms). |
| 1.24.4 Extras index | Fixes wrong popup and pill | **Only ever happened on mock data** — a full-year sweep of real London data found canonical and chronological order always equal (65,797 lists). Harmless; positions now come from the list's own display order (1.24.7). |
| 1.24.5 cascade duration | Restores pre-ADR-015 timing "exactly" | Cascade yes; **the next-prayer advance was still 150ms** instead of 1000ms. Fixed in 1.24.7. |
| 1.24.6 Dec 31 correction | Fixes ~1–2 min error | Code correct; effect ≈ 0 on real London data (Fajr flat around new year). **Its tests could not catch the bug** — strengthened in 1.24.7 and proven against three mutations. |
| Docs (AGENTS, spec, ADR-015, ISSUES) | Root cause, lessons | Corrected in 1.24.7. |
| `experiment/alarmclock-backport` | uat + its own delta only | Clean: uat has none of it, and it has every uat commit. |

Errors from earlier in *this* session, also corrected: a draft "BACK exits the
app" issue, never committed (the test flow was wrong — "Change athan" closes
Settings in the same tick; the flow is fixed); a "conclusive" bisection whose builds had
silently failed to install (redone properly below); and an "overlay_open 3×
regression" that is a stale baseline (the mark's instrument changed in s9).

## What changed

**1.24.7 (correctness):** dead `[resync]` arrays removed; bounce guard reverted;
`useDerivedProgress` latches its timing when the target changes, so a re-render
mid-transition can't restart it; row colours back to pre-ADR-015 timings
(selection 150ms, next-prayer advance and cascade 1000ms); countdown-bar overlay
fade linear again; Ago badge mounts only once ready; overlay and pill positions
from `canonicalDisplayOrder`; stronger sync tests; countdown test mock leak fixed;
sounds flow fixed; docs corrected.

**1.24.8 (performance):** the countdown bar still writes its width every second,
but sets sub-pixel steps directly instead of re-running a 1s animation; visible
steps, the refill and the warning flip still animate. Idle-CPU harness added
(`e2e/scripts/idle-cpu.sh`).

**1.24.9 (prayer-time correctness, ISSUES #28):** Midnight and Last Third are
computed from the Maghrib/Fajr strings alone. The old code depended on the fetch
day's DST context (a fetch on the Saturday before a clock change shifted the whole
year by 20–40 minutes) and on the second the fetch ran at (up to one minute late). The new
code is bit-identical to the old code on ordinary days across all 201,600
Maghrib 15:00–22:59 × Fajr 01:00–07:59 pairs.

Validation: tsc, Biome and 981/981 tests green on the final branch.

## Device verification (OnePlus 3T — Android only)

- **Resume across a boundary passed while suspended** (overlay open → home →
  screen off → Asr passes → return): overlay closed, pill on the new next prayer,
  every row correct, everything that should not change pixel-identical
  (1.24.6 and 1.24.7).
- **Extras overlays:** each tapped row shows its own explanation at exactly its
  normal position, with the box above or below as designed; after five open/close
  cycles every row band is pixel-identical to before (1.24.6 and 1.24.7). A passed
  Istijaba does not open — by design (`Prayer.tsx`: a Friday-only prayer has no
  next occurrence to show).
- **Next-prayer advance (1.24.7):** the new next row brightens with a 536ms
  10–90% rise (a 1000ms eased fade) alongside the pill's slide (620ms).
- **Day roll, daytime (1.24.7):** five rows dim bottom-to-top, 500–550ms each,
  staggered 120–150ms; pill Isha → Fajr in 768ms. All six rows are present at the
  roll, 50 seconds later and 2 minutes later, dimmed exactly to the normal level —
  ISSUES #27 did not reproduce.
- **Frame cadence:** ~17ms (60fps) through both transitions; no gap over 33ms
  inside an animation.
- **Clock sync:** every per-second update lands 0–70ms after the phone's clock
  second (median ~25ms), with no drift — the ticker re-aims at each :000. At the
  prayer boundary itself the switch lands ~236ms after the clock flips, because
  that tick refreshes the schedule and re-renders the list in one commit.
- **Bar glide (1.24.8):** visible steps still glide. A/B against 1.24.7 in the
  identical scenario: 2.20 vs 2.18 px/s, 0.443 vs 0.436px deviation from a
  straight line, 0.032 vs 0.035px median move per frame — the same motion.

## Performance

Idle CPU, 60s after the mock window, % of one core:

| Build | Idle (median) | Main thread | Note |
| --- | --- | --- | --- |
| 1.23.13 | 19.1% | 15.4% | before the bar change — matches the campaign's 19.3% |
| 1.23.15 | 75.3% | 68.4% | after 1.23.14's per-second bar animation |
| 1.24.0 | 85.2% | 65.2% | ADR-015 |
| 1.24.6 (uat) | 76.0% | 68.6% | |
| 1.24.7 | 77.3% | 69.2% | fixes only |
| 1.24.8 | 24.8% | 16.4% | bar change (JS thread 7.4%) |

`overlay_open` medians are 222–244ms on every build from 1.23.13 to 1.24.7 — the band the
campaign already documented after s9 changed the instrument (JS works ~44–78ms,
then waits on a synchronous UI-thread mount). Sheets are unchanged across builds
(alert 407–416ms, settings 370–387ms). Startup on the dev build (includes the mock
refresh): native launch ~60ms, JS bundle ~130ms, first content ~1.15s.

## Decisions for the owner

1. **What to merge into uat:** `fix/revalidation-2026-09-11` alone (1.24.7), or
   `perf/bar-visible-steps` (1.24.7 + 1.24.8 + 1.24.9). Then merge uat into
   `experiment/alarmclock-backport` as usual.
2. **ISSUES #29:** which night the Extras Midnight/Last Third values belong to
   (they are computed from the following night's Maghrib/Fajr pair; 0–3 minutes).
3. **Reanimated pairing:** 4.6.0 + worklets 0.12.2 (current) sits outside Expo SDK
   57's tested versions and expo-modules-core's worklets peer range; 4.5.3 +
   0.10.1 contains the same fix and stays in range. Android builds and runs; the
   iOS build is unverified either way.
4. **DST nights (optional):** the two real DST nights use the plain wall-clock
   midpoint, as they always have; the true elapsed midpoint differs by ~30 min.
5. **Eyeball the bar (1.24.8) on real data** — it should look identical.
6. **iOS:** nothing in this revalidation ran on an iPhone (no iOS device was
   connected). Check 1.24.7–1.24.9 on the XS before merging: resume from
   background and lock, the Extras overlays, the next-prayer advance and the day
   roll.
7. **What's New at release:** the notes are filtered by their own stamp (1.23.15),
   not the installed version, so every version bump re-shows them to users who
   already saw them. Re-stamp or clear them for the next store release.

## Re-plan

Principles, from the owner: pixel and behaviour parity; the UI is never stale
(resume, lock, minimise and cold start all show current state immediately);
60fps target with a 30fps floor on the 3T; no optimisation that removes a periodic
write or re-render the UI depends on; the codebase gets simpler over time; measure
before, change one thing, verify on the device with frames and pixels.

1. **Owner decisions above**, then merge.
2. **Resume and boundary regression harness** in `e2e/`: resume across a
   boundary, lock/unlock, day roll (daytime), Extras overlay matrix, clock-sync
   check. The scripts from this session are the starting point. Run it before
   every release.
3. **ISSUES #27** (single row after a day roll) — triage with the harness; the
   1.24.7 daytime day roll showed all six rows at +0, +50s and +2 min, so it is
   still unreproduced outside the original S23 sighting.
4. **Boundary switch latency** (~236ms on the 3T): switch the countdown first and
   refresh the list a frame later; verify with the clock-sync recording.
5. **Startup time** (own session): measure first content on a production build,
   profile the JS path, change nothing visible, verify the launch frame by frame.
6. **Simplification, only once the harness exists:** fold Ago's own 1s interval
   into the wall-clock tick; key the overlay selection by name instead of index;
   rename `resyncAtom` to what it does (snap values caught up on foreground).
7. **Keep `e2e/baselines` current.** Re-based in this branch (overlay marks on the
   post-s9 band, idle 24.8% on 1.24.8); update them with every measured change.

**Do not:** add re-assert machinery (`.modify()`, keyed remounts); pursue
background ticking; flip Reanimated's static flags; cut periodic writes or
re-renders that keep the UI current; do performance work without a before/after
on the 3T; trust perf marks over frame evidence; spend sessions on the phantom
Choreographer loop or on polling upstream PRs.

## Evidence and tooling

- `e2e/scripts/idle-cpu.sh` + `idle_cpu.py`: per-thread idle CPU.
- `e2e/README.md` gotchas added: `expo run:android --device` takes a name; What's
  New priming after upgrades; the night-time mock; the overlay_open instrument;
  zsh word splitting; stale accessibility trees.
- Raw measurements and screenshots lived in the session scratch space, which is
  wiped nightly; the numbers that matter are recorded here.
