# HANDOFF — Device regression fixes (sessions 2026-09-02)

Read this top to bottom before doing anything. Counterpart ledger:
`ai/ISSUES.md` section G (G.1–G.8) — G.1 now carries the complete evidence
dossier + the exact bisection resume procedure. Repo rules: `ai/AGENTS.md`.

## 1. Situation

Owner TestFlight-tested 1.17.4 on an iPhone XS (A12, 4GB, iOS 18.7.10) —
factory reset, only this app installed. Device-only regressions found (G.1–
G.8). On 2026-09-02 we ran TWO EAS dev-build rounds on the XS (baseline
v1.17.5 then fix v1.17.6) with Metro + USB syslog + crash-report capture,
and reproduced the widget failure on a local iOS 18.5 simulator.

**Verdicts**: G.3/G.4/G.5/G.7 FIXED (G.3/G.4/G.5 device-verified; G.7 test
fix on branch). G.8 fixed through 30s+ device spam (watch for recurrence).
G.6 deferred by owner (evidence recorded). **G.1 root cause PROVEN, fix
bisection IN PROGRESS — this is the remaining work.**

## 2. Git state (authoritative, end of session 2 — 2026-09-02)

- `uat` @ `3caed85` = **v1.17.8**, pushed to origin. **Currently checked
  out.** Carries the whole G-round: G.3/G.4/G.5/G.7/G.8 device fixes
  (1.17.6), the G.1 dossier (1.17.7), and the widget push-path rework
  (1.17.8: per-schedule flip timers + prayer-sequence cache, 895 tests).
- `fix/g-device-regressions` was fast-forward-merged into `uat` and then
  DELETED (local + origin) by owner instruction — uat is the single source
  of truth for this effort. Cut a FRESH branch from uat for the 57.0.16
  update round.
- `main` untouched. No git writes without explicit owner instruction.
- Working tree CLEAN.

## 3. G.1 in one paragraph (full dossier in ISSUES.md §G.1)

The widget extension gets CPU-saturated by an in-widget SwiftUI render
oscillation (recursive AttributeGraph churn; 66% avg CPU; four
cpu_resource reports) → `getTimelines` misses its ~30s watchdog
(CHSErrorDomain 1001) → chronod backs off **+1 hour** per failure while
the app's per-minute pushes keep spawning doomed attempts → losing kinds
stay permanently blank. Memory-kill theory dead (only JetsamEvent is from
March). Storage/entitlements verified sound. Reproduced on an iOS 18.5 sim
as sustained ~100% extension CPU whenever the home screen (with widgets)
is visible — while all widgets still RENDER fine on the fast host.
Bisection so far: light smalls CALM (0%); light mediums LOOP; dark smalls
LOOP (orbs); dark medium LOOP. Next: code-level construct bisect via
Debug+Metro on the sim (exact procedure in ISSUES.md §G.1 "NEXT SESSION").

## 4. Session learnings that are NOT in the ledger yet

- EAS `development` profile builds are ad-hoc signed, `get-task-allow=
  false` — Instruments cannot attach to the extension on device. Device
  observability = USB syslog (idevicesyslog, installed via brew this
  session) + crash reports (idevicecrashreport -e).
- EAS non-interactive builds work now (credentials stored from the
  interactive first run): `npx eas-cli build --profile development
  --platform ios --non-interactive --no-wait`.
- iOS 18.5 sim runtime installed (Xcode 26 refuses 18.7); sim device
  `iPhone-185` = 15DD2E5A-47DE-4934-A3CF-E36A34E34251 (iPhone 15 type,
  Rosetta x86_64). Debug + Release app builds ready in /tmp/dd18d, /tmp/dd18.
- mobile-mcp widget-placement UX on iOS 18.5 sim: long-press EMPTY
  wallpaper (e.g. (330,690), 1500ms) → Edit (60,30) → Add Widget (120,84)
  → search field (196,161) → type "athan" submit → tap the Athan row
  (196,236) → swipe the preview carousel LEFT per kind → Add Widget
  (196,803). GOTCHAS: tapping a placed widget opens the app (use empty
  spots for long-press); the carousel swipes sometimes bounce — verify the
  kind name + size in the element tree before adding; removal = jiggle →
  DeleteButton (top-left of the widget) → confirm Remove (260,486).
- Baseline-build Metro evidence (the 89 s JS freeze) is preserved at
  /tmp/metro-athan-baseline.log; fix-build log at /tmp/metro-athan-fix.log.
- XS Developer Mode was enabled this session; the dev build + all 8 home
  widgets are placed on its home screen (only the first-added light small
  renders; the rest red/blank). Lock widgets work.

## 5. RESUME HERE (next session)

1. Read `ai/AGENTS.md`, this file, then `ai/ISSUES.md` §G.1 end-to-end.
2. **FIRST ACTION — check the MR** (owner: "our bread and butter"):
   `curl -s https://api.github.com/repos/expo/expo/pulls/49244 | jq
   '.state, .merged_at, .updated_at'` and the expo-widgets changelog for a
   57.0.16 release. Full watch/upgrade/fallback procedure is in ISSUES.md
   §G.1 "UPSTREAM FIX TRACKING".
3. If 57.0.16 is out: bump `expo-widgets` + `@expo/ui`, sim ignite-protocol
   burst check (expect ms), EAS dev build non-interactive, owner
   device-verifies on the XS (all 8 kinds render + stay ≥10 min, no
   cpu_resource reports, no watchdog lines), ship as 1.17.10 → TestFlight.
4. If not out yet: report status to owner; optional fallback = patch-package
   backport of the MERGED code (see ISSUES.md §G.1 for the hunk-conflict
   note). Do NOT backport while it's still an unapproved PR without asking.
5. 1.17.8 (committed `3caed85`, merged to uat) = Phase 1
   our-side prep in `stores/widget.ts`: per-schedule flip timers + sequence
   cache, 895 tests green. Widgets code is READY for the MR landing —
   no further prep needed.
6. Next: the TestFlight release round for the whole G-series
   (G.3/G.4/G.5/G.7/G.8 fixes + this work) once G.1's upstream fix lands.
   Cut the update branch from `uat` (the old fix branch is deleted — uat
   is the source of truth).

## 6. Hard-won environment facts (do not rediscover)

- EAS builds this session: baseline 9d5576f4 (v1.17.5, uat), fix
  f1f82bc2 (v1.17.6, b262075). Apple team 9V3WAU9Z54, XS UDID
  00008020-0015585C22D2002E. `eas` is NOT global — always `npx eas-cli`.
- Metro for dev builds: `nohup npx expo start --port 8081 >
  /tmp/metro-athan-fix.log` from the repo root (on `uat` now — the fix
  branch was merged and deleted); the sim
  app auto-connects to localhost:8081; the XS connects via
  exp://192.168.0.10:8081 (same Wi-Fi).
- Device capture: `idevicesyslog > file` (pairing validated; replug+trust
  if needed), `idevicecrashreport -e /tmp/xs-crashlogs` (note: it MOVES
  reports off the device).
- iPhone 16 sim (iOS 26.5) = 8FB33B9F-A3D4-4776-A4E6-4BE17228E9DC
  (shutdown at session end to save memory). Local release-sim recipe in
  ai/AGENTS.md §"Release sim build" still valid.
- Evidence files in /tmp (survive until reboot): see ISSUES.md §G.1
  "Evidence files".
- expo-widgets internals (57.0.15): EntryView reads
  `__expo_widgets_<Kind>_layout` from the app group PER RENDER; missing →
  red box "No layout found"; unknown node type → red box in DEBUG /
  EmptyView in release; `WidgetsJSRuntime` caches the evaluated layout per
  process (pkill -x ExpoWidgetsTarget to force cold eval); extension's
  bundled runtime JS is ALWAYS production Metro.
- WidgetKit behavior learned today: reload failures = 30 s watchdog
  (getTimelines) → next retry +1 h; visible home-screen widgets are
  live-rendered by SpringBoard (render cost recurs while visible);
  per-minute per-kind reloads from the label-flip scheduler keep the
  retry queue saturated on-device.

## 7. Owner vetoes & rules (NEVER violate)

- Widget label cadence stays every-minute. Do NOT lengthen.
- `TIMELINE_DAYS` stays 14. Do NOT shrink.
- Timeline payload stays as-is (owner rejects "too much data" framing —
  the watchdog evidence has NOT been re-presented to him; ask, don't
  assume the veto softened).
- No visual settling on mount — components first-frame settled.
- Never depend on production logs; no console.log (pino only).
- No git writes without explicit owner instruction.
- Version bump BOTH app.json + package.json on EVERY commit; releases.json
  untouchable; commit messages prefixed with version.
- AGENTS.md hard rules: never edit node_modules, never sleep >15s (poll in
  short cycles), 2 failed attempts → stop and ask.
