# Next Session: Large-Screen Adaptation (iPad / tablet / desktop-web) — phone view, scaled not redesigned

Repo state at session start (post SDK-57 patch sweep): `uat` @ **1.22.13** (the sweep: expo ~57.0.21 + 13 more SDK-57 patches; jest 30 / @types/jest 30 / TypeScript 7 majors are DELIBERATE — never let `expo install --fix` touch them, it tries to downgrade them, restore on sight). FIRST ACTION: create the feature branch from `uat` (e.g. `feat/large-screen-adaptation`) before any change — owner instruction. Previously (2026-09-08): `uat` == `perf/chaos` == `d58478f` @ **1.22.11** (four commits: 1.22.8 docs+dead-code, 1.22.9 feature flags + What's New versioned archive, 1.22.10 tls13 module, 1.22.11 modal speed). Read `ai/AGENTS.md` first, act as Orchestrator. The owner now installs test builds via **EAS preview builds** (`eas build --platform android --profile preview --non-interactive --no-wait`; the cloud env vars for prod data are already configured — never inject or commit them). Use the **globally installed `eas`** CLI; `npx eas-cli` inside the repo crashes on a minimatch conflict. The three bench phones (3T/8T/Find X8) are wiped and owner-managed; do not locally install on them without instruction. The iPhone XS is the owner's daily phone (passive checks only). `android/`+`ios/` are gitignored and kept warm in-repo; run the prebuild-sync ritual (AGENTS.md) before any local build.

## 1. THE FEATURE

**Problem (owner):** the app is phone-first and looks stretched/disoriented on larger screens — iPad/tablet, and laptop/desktop (macOS via whatever large-screen surface actually ships today — investigate: the repo has `index.html` + `CNAME`, so an Expo web build likely exists; iPad is the native iOS app on tablet).

**Owner decision, already made — do not re-litigate:** ADAPT, do not redesign. Keep the existing mobile composition exactly as designed; on large screens the app must present as a compact phone-like view (centered/constrained/scaled), not a stretched full-bleed layout. Two options were weighed (design-for-tablet vs shrink-to-phone-view); shrink won. **Hard constraint: zero regression on phones** — iPhone + Android phone rendering must stay byte-identical in behavior; verify this explicitly.

**Phase 0 — baseline evidence (do this first, before any design talk):**
- Boot iPad simulators (e.g. iPad Pro + iPad mini, portrait AND landscape), build and run the app (`xcodebuildmcp` tools; `xcrun simctl` directly if needed), capture screenshots of every surface: home, extras page, overlay, every sheet, What's New modal, settings.
- Desktop-web baseline IF a web surface ships today: run the web build and screenshot in a desktop browser (agent-browser CLI at 1440p + smaller widths). If web is not actually a shipped surface, record that and scope the feature to iPad/tablet only — tell the owner before building.
- Store evidence in-repo under `ai/features/large-screen/evidence/` (create the folder; keep it tidy — it may be cleared at session end per owner preference; ask).
- macOS note: this machine IS macOS, so if Catalyst or web-on-mac is a target, it is testable here. No iPad hardware exists — everything simulator-based.

**Phase 1 — approach decision (present to owner with side-by-side screenshots before implementing):** candidates to evaluate with the evidence in hand: max-width centered column wrapper (phone-width content, centered, restaged background); scale-factor approach (useWindowDimensions-driven uniform scale of the existing tree); platform-conditional layout. Prefer RN/Expo-native primitives (`useWindowDimensions`, `PixelRatio`, maxWidth wrappers) — **no new dependencies**. Ponytail ladder: the simplest mechanism that makes the app look like a well-behaved phone app on a tablet wins.

**Phase 2 — implement + verify:** `yarn validate` green; phone-regression pass (iPhone sim + one Android phone sim, screenshots compared against baseline); iPad P/L pass; web pass if in scope; 30fps spot-check on any newly animated surface per AGENTS Performance Design Rules. Commit/version/push/merge only on explicit owner order.

**Owner grants autonomous authority for:** installing simulators, building/running the app on this Mac, screenshot/video loops, iterating inside the loop without check-ins. Keep ALL artifacts inside the repository (evidence under the folder above, build state in the gitignored `android/`+`ios/`); nothing loose outside the repo.

## 2. Standing items (check the delta, don't redo)

- **expo/expo#49244** (widget identity fix): still OPEN as of 2026-09-08; `expo-widgets` 57.0.16–57.0.18 explicitly contain nothing. When it merges: bump expo-widgets, flip `widgets` in `shared/flags.ts` per the documented flip procedure (AGENTS.md Feature Flags), stamp the parked What's New item, XS acceptance protocol (G.1), minor version bump.
- **SDK-57 patch sweep** (unblocked now): `npx expo install --check` — 14 patch updates pending (expo→57.0.21, expo-notifications→57.0.17, etc.). NEVER let it touch jest/@types/jest/TypeScript (deliberate majors). Bump version, validate, one commit (owner order for git, as always).
- **SDK 58 watch:** `npm dist-tag ls expo` gaining `sdk-58` or any `58.0.0-beta.*` publish. On release: ISSUES #17 alarmClock adoption (`delivery: 'alarmClock'`), the #49072 foreground-presentation breaking-change audit, and the widgets question resolves naturally if 57.0.16+ never shipped the fix.
- **Release day (when the owner says so):** EAS cloud env vars already set (preview + production). Android: production profile, alpha track, bench verify, promote; then `releases.json` production.android.version on main — OWNER ONLY FILE. iOS after soak + one TestFlight round. Listings advertise no widgets until the flag flips.

## 3. Constraints carried forward

- Version bump on EVERY commit (all four locations in sync: app.json + package.json + What's New version; build.gradle/plist ride the prebuild ritual). No speculative SDK 58 upgrade. No new dependencies. `releases.json` untouched, always.
- Widgets stay flag-OFF until 57.0.16-with-fix or SDK 58. The tls13 module's 5 files are permanent (ISSUES #21; the no-TLS control build failed on the 3T exactly as predicted — verdict settled 2026-09-08).
- Maestro device-server dies across Mac reboots — reinstall before flowing. The doubled `am start` ritual on the 3T stands. On the 8T: Auto-launch must be re-enabled for Athan after any reinstall (ISSUES #19).

## 4. TRACKER — update at every session end

| Step | Status |
| --- | --- |
| S0a iPad sim baseline (P+L, all surfaces) | not started |
| S0b Desktop-web surface exists? (yes/no + baseline if yes) | not started |
| S0c Approach decided with owner (which mechanism, evidence link) | not started |
| S1 Implementation (flag/wrapper/what changed) | not started |
| S2a Phone regression pass (screens vs baseline) | not started |
| S2b iPad verification (P+L) | not started |
| S2c Web verification (if in scope) | not started |
| S3 Committed / version / merged (owner order) | not started |
| Standing: patch sweep done | DONE 2026-09-08 (chore/sdk57-patch-sweep: 14 SDK-57 patch bumps, jest/ts majors untouched, 951 tests green) |
| Standing: #49244 merged? | open 2026-09-08 |
| Standing: owner installed EAS 1.22.11 on 3T/8T/F8 | DONE 2026-09-08 (owner) |
| Standing: SDK 58 announced? | no 2026-09-08 |
| Standing: alarmClock backport (#49687 merge `257006e` onto expo-notifications 57.0.17, patch-package, throwaway branch + EAS preview) | SCHEDULED AFTER THIS FEATURE — owner order: at the very end (see ISSUES #17) |

Append a dated line under the tracker after each session summarizing deltas; keep this file the single resume point.
