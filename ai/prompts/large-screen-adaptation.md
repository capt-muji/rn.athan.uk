# Next Session: Large-Screen Adaptation (iPad / tablet / desktop-web) — phone view, scaled not redesigned

Repo state at session start (post SDK-57 patch sweep): `uat` @ **1.22.14** (the sweep: expo ~57.0.21 + 13 more SDK-57 patches; jest 30 / @types/jest 30 / TypeScript 7 majors are DELIBERATE — never let `expo install --fix` touch them, it tries to downgrade them, restore on sight). FIRST ACTION: create the feature branch from `uat` (e.g. `feat/large-screen-adaptation`) before any change — owner instruction. Previously (2026-09-08): `uat` == `perf/chaos` == `d58478f` @ **1.22.11** (four commits: 1.22.8 docs+dead-code, 1.22.9 feature flags + What's New versioned archive, 1.22.10 tls13 module, 1.22.11 modal speed). Read `ai/AGENTS.md` first, act as Orchestrator. The owner now installs test builds via **EAS preview builds** (`eas build --platform android --profile preview --non-interactive --no-wait`; the cloud env vars for prod data are already configured — never inject or commit them). Use the **globally installed `eas`** CLI; `npx eas-cli` inside the repo crashes on a minimatch conflict. The three bench phones (3T/8T/Find X8) are wiped and owner-managed; do not locally install on them without instruction. The iPhone XS is the owner's daily phone (passive checks only). `android/`+`ios/` are gitignored and kept warm in-repo; run the prebuild-sync ritual (AGENTS.md) before any local build.

## RESUME HERE (session 2, after the 2026-09-09 session-1 checkpoint)

Branch `feat/large-screen-adaptation` @ 1.23.0 committed and pushed (checkpoint; NOT merged to uat).
**THE ONE BLOCKER: iPad bottom sheets (settings/sound/alert) still render LEFT-ALIGNED; they must be CENTERED at `SIZE.contentMaxWidth` (500).** Page content, dots, overlay, glow, modals (What's New + Update), and phone rendering are all DONE and owner-approved.

What was tried and failed for the sheet: (1) `alignSelf: 'center'` on the sheet `style` — ignored, (2) `marginLeft/Right: 'auto'` — ignored too; Yoga does not do CSS auto-margin centering on absolutely positioned views, and the lib pins the sheet body via `BottomSheetBody` styles.container `position:absolute; top:0; left:0; right:0` (node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheetBody.tsx + styles.ts). Our card style lives in `components/sheets/parts/Shared.tsx` (`bottomSheetStyles.modal`). Promising untried directions: constrain INSIDE the body (our `renderSheetBackground` + the `ContentWrapper` styles in `components/sheets/parts/Sheet.tsx` are ours and are normal flex children of the body — width/maxWidth/alignSelf center should work there; the background component is wrapped by `BottomSheetBackgroundContainer` which applies `StyleSheet.absoluteFill` to our component's style array — read `bottomSheetBackground/BottomSheetBackgroundContainer.tsx` first). The handle indicator is already body-centered (screen center == column center, fine). Do NOT fork/patch the library (no new deps).

**Owner workflow from now on (explicit directive 2026-09-09): make a change, build onto ONE simulator (iPad Pro 11 = the biggest), launch the app, and the OWNER clicks around and gives feedback. No screenshot/video loops, no vision subagent (too slow). Evidence folder: the owner reviews files directly.**

Evidence lives in `ai/features/large-screen/evidence/` (gitignored via its own `.gitignore` `*`; NEVER commit it). `baseline/` and `after/` sets exist for ipad-pro-11, ipad-mini, iphone-17-pro, pixel-10, plus `videos/`, `build-logs/` (contains ready-to-install `Athan-1.23.0-final.app`, `Athan-0.9.9-real.app` — the 0.9.9 build is the UPDATE-MODAL TRIGGER: fresh-install it, then install 1.23.0 over → update path → Update modal shows; uat.ios in releases.json reads 1.0.0 > 0.9.9).

Owner review verdicts so far (2026-09-09): iPad Pro 01-04 + 08 (update modal) good; mini 00-04 good; iPhone 00-05 good (06 captured the settings sheet, not sound — owner says fine); Pixel 01/02/05 good. Sheets left-aligned everywhere on iPad (the blocker). Pixel overlay header dim + missing "London, UK" = PRE-EXISTING (baseline pixel-identical) → ISSUES #26. Known capture gaps to redo after the fix: iPad alert sheet, iPhone sound sheet, Pixel extras/overlay-extras/sound, all with assert-before-shoot flows (`evidence/flows/`).

Remaining after the fix: owner's manual pass on the sim → re-capture the gap surfaces → per-device tour videos + marketing screenshots (owner wants them like the existing iOS marketing set, tablet variant) → What's New WORDING pass (owner will reword "iPad & tablet support") → phone regression re-check → final commit, then merge to uat on owner order. Then the alarmClock backport session (ai/prompts/alarmclock-backport.md) becomes eligible.

Session-1 landed (all in the 1.23.0 commit): `SIZE.contentMaxWidth 500` (owner-tuned: 700 too wide, 440 too narrow) capping Screen pages; pager stays full-width so the whole screen swipes (owner requirement; verified incl. gutters — slow synthetic drags from the left half are a WDA artifact, baseline build fails them identically); sheets/modal cards capped (modal 400 + all modal buttons 160 fixed/centered, +50% gap above buttons = 36); live `useWindowDimensions` re-export fixing the frozen-dims resize bug (owner's Mac "Designed for iPad" window resize broke the overlay — root cause was the mount-time memo hook + one-shot list measure; List now re-measures on window change; phones never fire these); glow + veil glow anchored to the column; `ios.requireFullScreen: true` + `plugins/portraitOnlyIpad.js` locking iPad portrait (owner: portrait-only on every device; plist verified); What's New item "iPad & tablet support" stamped 1.23.0 (wording pending); ISSUES #25 (sound preview dead first tap after natural finish — follow-up session) and #26; AGENTS.md hard comment rule (WHY-only, compact, never styling, no history logs). Mac global-at-2.0: "Designed for iPad" needs no extra key; the resize work IS the Mac readiness. Web: owner killed (no react-native-web ever). Watch: not supported, out of scope.

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
| S0a iPad sim baseline (P+L, all surfaces) | DONE 2026-09-09 (P only — owner then banned landscape: portrait-only on every device) |
| S0b Desktop-web surface exists? | NO — owner killed web entirely (no react-native-web, no EAS web, distribution is App Store + Play Store only) |
| S0c Approach decided | DONE 2026-09-09 — content column 500 (Screen self-cap, pager full-width) + live dims + portrait lock; evidence/approach.md |
| S1 Implementation | MOSTLY DONE @1.23.0 — sole blocker: iPad sheet cards still LEFT-ALIGNED (see resume block) |
| S2a Phone regression pass | DONE 2026-09-09 — vision-measured identical (iPhone home, Pixel home, Pixel settings; iPhone settings re-capture pending the sheet fix) |
| S2b iPad verification | BLOCKED on the sheet fix; 01-04 + 08 owner-approved |
| S2c Web verification | CANCELLED (owner) |
| S3 Committed / version / merged | CHECKPOINT: 1.23.0 committed+pushed to feat/large-screen-adaptation 2026-09-09; merge to uat pending completion + owner order |
| Standing: patch sweep done | DONE 2026-09-08 (chore/sdk57-patch-sweep: 14 SDK-57 patch bumps, jest/ts majors untouched, 951 tests green) |
| Standing: #49244 merged? | open 2026-09-08 |
| Standing: owner installed EAS 1.22.11 on 3T/8T/F8 | DONE 2026-09-08 (owner) |
| Standing: SDK 58 announced? | no 2026-09-08 |
| Standing: alarmClock backport (#49687) | SCHEDULED AFTER THIS FEATURE merges to uat — owner order: last item on the list; full procedure + tracker in `ai/prompts/alarmclock-backport.md` |

Session log:
- 2026-09-09 (session 1): branch created; baselines captured (iPad Pro 11, iPad mini, iPhone 17 Pro, Pixel 10 emulator); approach decided and implemented (column 500 + live dims + portrait lock + modal/button rework); phone zero-regression vision-verified; What's New + Update modals captured and owner-approved; sheet centering UNRESOLVED after two attempts (alignSelf, auto margins — Yoga won't center the lib's absolutely-positioned sheet body); owner switched the workflow to manual-sim review; ISSUES #25 + #26 filed; AGENTS.md comment hard-rule added; 1.23.0 checkpoint committed + pushed. 3T incident: one accidental `expo run:android` install attempt targeted the 3T (first-connected device) — it FAILED on signature mismatch, device untouched (verified: versionName 1.22.11, lastUpdate 01:25 pre-session). ALWAYS pass `--device emulator-5554` or use gradle directly.
- 2026-09-08: brief written.

Append a dated line under the tracker after each session summarizing deltas; keep this file the single resume point.
