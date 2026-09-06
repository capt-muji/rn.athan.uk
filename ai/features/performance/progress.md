# Performance Campaign — Progress Tracker

> AI-generated task tracker. Updated every iteration. Resume here after any interruption.

## State

- **Branch**: `perf/testing` (from `fix/background-scheduling` @ 1.18.9)
- **Phase**: campaign CLOSED through 1.20.0; sessions 12-13 add-on (Android shadow/glow parity)
  SHIPPED + owner-confirmed (1.20.1). The Galaxy S23 (Android 16/API 36) was a TEMPORARY LOAN for
  the shadow work — returned + test app uninstalled; it did NOT join the fleet (the 3T remains
  THE Android verification device; a modern-Android device can be borrowed again if needed — the
  shadow lessons per API tier are in the session-13 entry). RESUME: the next-session queue in the
  session-13 log entry (extras pill-slot canonical fix w/ owner approval, swipe-perf pass, 3T
  final-shadow pass, iOS rebuild + eyeball, parked backlog).
- **Builds**: repo @ 1.20.2. 3T runs the resting 1.20.0 build (s10.1 code; the shadow/glow work
  is NOT yet installed there — queued as the 3T pass). iOS NOT rebuilt since the s10.4 build
  (shadow work is Platform-gated Android-only, but the next iOS pass should still eyeball
  Day/Prayer surfaces).
- **Device state (end of s13)**: 3T healthy, app foreground-settled. S23 returned to the owner
  (test app removed; Play app untouched).
- **Evidence**: s10/s11 in /var/folders/.../T/opencode/perf21/{s101,s102,s103}; the shadow/glow
  arc in perf21/s23/{shadow-tune,glow-evidence(01-10 + glow-tour.mp4),perf(atrace+swipe pts)}.
- **Standing owner directives**: 3T is THE Android verification device (borrowed modern devices
  are temporary; never uninstall the owner's personal apps — use the suffixed test id); iOS =
  owner eyeball; FPS-first evidence; 30fps FLOOR for big animations (per-second countdown text
  exempt); quality over speed; physical devices only; Release builds; no store deployments;
  never sleep >15s in one command; commits only on explicit owner instruction (version bump per
  commit); iOS widgets + notification semantics measure-only; iterate the vision subagent when
  delegation friction appears; iOS visuals are the pixel bar — challenge owner proposals
  explicitly; minimal animated-element count; perf-test EVERY change.

### HANDOFF RULE (read first)

**This file is the single source of truth for resuming.** Update it at EVERY milestone — any
session must be able to resume from it cold. The owner resumes with: *"Resume the performance
campaign: read ai/features/performance/ and execute the resume protocol."*

## Tooling (installed 2026-09-05)

| Tool | Version | Path / notes |
| --- | --- | --- |
| Maestro | 2.10.0 | `~/.maestro/bin/maestro` (add to PATH per shell) |
| Flashlight | latest | `~/.flashlight/bin/flashlight` (Android-only measurement) |
| xctrace | Xcode | iOS profiles on the physical XS |
| adb | — | Android 3T (`3T_SERIAL`), keep-awake: `svc power stayon usb` (set) |
| opensrc | — | package source reads |
| docs-mcp | — | `react-native@0.86.3` (exact), `react@19.2.8`, `expo`, `react-native-reanimated`, `react-native-worklets`, `react-native-pager-view` indexed |

## Phase checklist

### Phase 0 — Setup
- [x] Branch `perf/testing` created
- [x] Maestro + Flashlight installed
- [x] Android keep-awake (`svc power stayon usb`, timeout 30 min confirmed)
- [x] `app.config.ts`: env-driven name suffix (defaults byte-identical)
- [x] iOS Auto-Lock → Never (owner confirmed done)
- [x] iOS signing set up (owner in Xcode; Team `TEAM_ID`; dev cert created)
- [x] Devices PURGED of all Athan-related apps (owner instruction 2026-09-05):
      Android removed `com.mugtaba.athan` (Play), `com.mugtaba.athan.bgtest` (campaign soak),
      `com.muji.bareexpo`, `com.muji.barealarm`, `com.muji.barealarm36`;
      iOS removed `com.mugtaba.athan` (TestFlight 1.18.1). Both fully clean.
- [x] opencode.json: Maestro MCP + XcodeBuildMCP added (active after opencode restart)
- [x] Android Release build + install on 3T (build #4: v1.18.9, original id, verified via pm list)
- [x] iOS Release build + install on XS (BUILD SUCCEEDED; devicectl install OK)
- [x] Smoke-launch both: Android UI verified via Maestro AX tree (countdown live, London data
      synced, no dialogs). iOS launched via devicectl; first-launch notif prompt auto-granted
      via Maestro `launchApp.permissions` — NOTE see iOS automation caveat in Log.
- [x] Maestro sees both physical devices (MCP `list_devices`: `3T_SERIAL` + `IPHONE_UDID` both
      connected; CLI `list-devices` only prints simulators — use MCP or `--device <udid>`)

### Phase 1 — Baseline capture (BEFORE any change)
- [x] 1.1 Cold/warm/bg-relaunch starts ×10 per device (baseline/1.1-launch-timings.md:
      Android cold 3668/warm 83/bg 91; iOS cold 2693/warm 1217/bg 1206 ms medians)
- [x] 1.2 Interaction suite (baseline/1.2-interactions-android.md + -ios.md:
      Android jank% sheets 43/toggles 24/overlay 70/swipes 38/sounds 66;
      iOS sheet-open 2110ms / overlay 2119ms / swipe 1005ms medians)
- [x] 1.3 Spam suites + blocked-time measurement (1.3-spam-blocked.md: 0 ANRs both
      platforms; Android sound-spam jank 89.3%; iOS toggle/sound spam doubles AX latency)
- [x] 1.4 Thread profiles (1.4-profiles.md: iOS launch = 623-796ms system floor +
      ~1.1-1.6s JS gap; iOS spam = Hermes + shadow-tree slicing + Yoga; **Android idle
      CPU 49-90% — headline finding**)
- [x] 1.5 Behavior snapshot (1.5-behavior.md: jest **918**/918 green — suite grew from
      876; live assertion flows green; quirks recorded incl. back-closes-both-sheets)
- [x] Baseline report written to `baseline/baseline.md` (+ per-phase md files)

### Phase 2 — Instrumentation
- [x] `react-native-performance@6` dep (owner approved deps) — 6.0.0 exact-pinned
- [x] `shared/perf.ts` ring buffer → MMKV + pino, `EXPO_PUBLIC_PERF_MONITOR` gate
      (600-entry ring → `perf-monitor` MMKV instance + single-line `PERF_MEASURE`/`PERF_MARK`
      pino stream; separate MMKV id — app schema untouched)
- [x] Marks on every action path; validated against Phase 1 external numbers
      (baseline/2-instrumentation-validation.md — all marks fire, durations sane and
      cross-validated; two baseline-harness false-positives found and documented)
- [x] Zero-cost gate OFF: statically folded (`void 0==="1"` in bytecode), 0 PERF lines on
      device, cold-start parity with baseline (3555/3612 vs 3668 median)
- [x] jest 918 baseline preserved: 925/925 green (7 new perf.ts tests), tsc + biome clean

### Phase 3 — Iterative optimization (open-ended; one change per iteration)
Ordered backlog (from code dive; re-prioritize by measured impact):

| # | Target | Status | Measured before | Measured after |
| --- | --- | --- | --- | --- |
| 1 | Startup/splash: defer non-critical init post-first-frame | **done (s1: widget push off critical path)** | iOS js_to_content 1361-1451; Android 978-1077 / ThisTime 3668 | iOS **134 median** (−90%); Android 996-1020 / ThisTime 3512-3642 (unchanged, expected — widget call is iOS-only no-op) |
| 2 | Sheet-dismiss burst: defer reschedule+pushes past animation | **done (s4)** | iOS dismiss awaited widget push: ~1.1-1.4s burst on the home reveal; sound_commit 117 (d) | iOS: close 654 → commit **56ms** → widget push 1383ms starts ~530ms LATER (post-paint); Android commit 157ms, close 254ms, widget_push 0 (no-op) |
| 3 | Unmount closed-Overlay subtree (SVG glow + ticking Countdown) | **done (s4) — REGRESSED OPEN ANIMATION (owner-reported, see #11)** | closed overlay burned 1 Countdown render/s + subtree; overlay_open 180/34 (d/i) | Android idle **16.1%** process (from ~20-24); overlay_open 155/52 (d/i, mount included — FASTER than pre-mount commit); close fade intact |
| 11 | **FIX #3 REGRESSION: overlay open animation jank** — countdown scale-up snaps/jitters on open (both platforms; Android 3T very bad), close scales down smoothly. Fresh subtree mount (glow SVG + gradient + Countdown) commits in the same frames the scale/fade animations play. Must restore 1:1 smooth open WHILE keeping #3's idle win. Candidates: pre-mount inert-hidden subtree, cheapen the mount, sequence animation start after mount settles | **fix VERIFIED (s6)**: pre-mounted subtree + display:none visibility latch. ALL FOUR conditions PASS: first-open (11 frames 16-17ms, vision-confirmed monotonic 0.76→1.0 scale+fade, no snap/ghost; the ~116ms tap→commit stall moved BEFORE visible animation = invisible), first-close (10 frames 60fps vision-confirmed), steady-open (18 frames 16-17ms vision-confirmed), steady-close (SF-latency 60fps cadence, zero >33ms gaps) | owner report 2026-09-06 (s4 end): open = frame-snap jitter, close = smooth | steady opens 162-230 / closes 155-237ms marks across 10+ cycles; js_to_content 1058/1084/1170 (996-family preserved) |
| 12 | **NEW (s5, owner-reported): Alert-sheet selection pill squash** — the purple segmented-control indicator first-frames ~2px wide on the LEFT edge (x≈104) during the sheet entrance for ~50-80ms, then pops to full width. Root cause (vision-confirmed on 3T): width lived INSIDE the Reanimated worklet (async-applied) so the view first-frames at intrinsic 0+2×1px borders; init translateX snap ran in a post-paint useEffect. | **fix VERIFIED PIXEL+VISION (s7 CLOSED)**: static render-time width + useDerivedValue first-eval snap. Post-reboot video capture restored (6-frame swipe test OK); 5s recording of the entrance: pill bbox **w=289 full-width from its FIRST visible frame** (f_0011, mid-slide), stays 289×97-99 through the slide and settled; vision confirms full rounded capsule (row-taper profile, ~96% fill) in every frame, no sliver ever. | 3T screenrecord (s5, pre-fix): pill w≈4px for 3-5 frames (t=1.984-2.018), full w=288 from t=2.05 | post-fix (s7): w=289 from first visible frame, 0 sliver frames; evidence perf12/frames+pill |
| 13 | **NEW (s5 finding): Alert-sheet entrance ~12fps effective on 3T** — 235ms + 202ms frame gaps during the slide-up (7 frames over 570ms). Owner's 30fps floor applies to sheet entrances. Re-assess after #12 lands; if still <30fps, its own iteration (likely mount-churn during entrance — same class as #11) | **FIXED + PASSES FLOOR (s6, resolved by #12+#10)**: post-#10 build atrace: entrance = PERFECT 16.2-17.8ms cadence throughout, every doFrame ≤4.6ms, ZERO >33ms misses (pre-fix: 235/202ms gaps; intermediate post-#12: 28+11ms worst) | atrace_sheet2.txt (35.0ms worst) → atrace_sheet3.txt (zero misses) | 06:19 mark sheet_alert_open 461ms |
| 4 | Tick consolidation (3 store + 3 hook + 2 interval timers) | **done (s4)** | 6 timer chains + 6 TICK logs/s; 3 hook setStates + 6 Countdown renders/s | **2** timer chains (std+extra store only; overlay on-demand), 0 log lines/s, 3 renders/s |
| 5 | RamadanDecorations: gate infinite animations behind visibility | **done (s4, with Bar phantom fix)** | Android idle main-thread 93.1% / process 80.6% (top) | main **16.6%** / process **43.7%**; iOS idle ≈0% (time-sample) |
| 6 | Sound sheet: memoize rows against status ticks | **done (s4)** | session-3: sound open 834 (Android); status ticks re-rendered all 32 rows | warm open **298** (Android); iOS playback CPU ≈0 (1/1789 Running samples); only playing row re-renders, on integer-second changes |
| 7 | Hot-path pino call-site gating (TICK ×5/s, database ops) | **done (s4 — TICK lines; MMKV lines deferred)** | 6 TICK debug lines/s (pino-pretty + logcat) | 0 (call sites deleted; 'TICK: transition' kept — rare) |
| 8 | MMKV pre-computation audit (cache derived work, expiry policy) | **done (s6) — no action warranted**: pino is FULLY DISABLED in prod/preview (shared/logger.ts isLoggingEnabled) so the MMKV info lines have zero production cost — they only pollute dev-env campaign builds (the documented shared confound); derived-work audit found no hot-path recompute (widget timeline cache landed pre-campaign-Phase-3; prayer/notification reads are boundary/user-action cadence, N+M getAllWithPrefix bounded ~30 keys) | dev-env: ~100-400 MMKV lines per launch (mock refresh flood) | n/a — production-clean by construction |
| 9 | Toggle write path (only if Android numbers demand) | **done (s6) — closed, numbers never demanded**: toggle marks healthy across the campaign (it2: toggle jank 24.4% baseline → no complaints post-it5/it6 builds; toggle_tap marks fire; no Android write-path signal) | | |
| 10 | NEW: render-granularity gate — Countdown re-renders per second even when displaying minutes (showSeconds off) | pending | | |
| 14 | NEW (s6, owner directive): visibility-gated rendering audit — (a) underlay beneath the OPEN overlay (invisible → still fully rendered?), (b) static always-mounted components (should they render/update at all), (c) off-screen sheet content, (d) BOTH pager page countdowns tick while one page visible (owner example: warm-but-idle-cheap — subscriptions stay live so reveal needs no compute, but no renders while unseen; same principle as #11's pre-mounted overlay), (e) the phantom 60fps Choreographer loop found in s6 atrace (239 doFrames/4s at idle, ~1.1ms each ≈ 6-7% CPU) + per-second 6.7+12.4ms layout bumps (Bar width update family). CONSTRAINT (owner): the overlay fade must composite over LIVE underlay — no instant teardown during fade-in (would jitter); everything must be precomputed BEFORE an animation begins (never compute during it). CPU + RAM holistic. | **CLOSED (s7) — phantom is UPSTREAM; audit items done/subsumed**: BISECT (7 Release builds, fresh-process atrace each): A sheets unmounted → loop persists; B + overlay subtree unmounted → persists; C + Countdown/Ago animated styles made static → persists; D + sequence tickers disabled → persists; E entire app content blanked (bare View after loading) → persists; F + all providers/SystemBars removed → persists; G literally `<View>` as the whole layout → **persists (303 doFrames/5s, input+animation phases every frame, "doframeadd" tag — not in RN core source, not in any .so/.dex string)**. Conclusion: the loop lives at the RN-0.86.3/Expo-57/Reanimated-4.5.1 runtime level on Android 9/SD820, BELOW all app code; isolated cost on the blank build = 22.5% CPU (top). Revisit on framework upgrades or file upstream with the bisect table. Audit items: (a) SUBSUMED by #20 (in-place overlay = no underlay duplication; the live-underlay constraint is in the brief §2.5); (b) static components render zero at idle (s6: zero traversals 5s, re-verified post-restore: 1/5s); (c) closed sheets fully unmount (@gorhom modal dismiss) — the sound sheet's re-mount cost is the known 600ms; (d) both pages' countdowns subscribe to render-granular derived atoms (#10) — they tick in the STORE (boundary correctness) but render only on displayed-string change. INCIDENT + RECOVERY (transparent): mid-bisect a `git checkout --` on 6 files reverted UNCOMMITTED campaign changes (no commits exist on perf/testing by directive); recovered by reconstruction from session context + intact consumers + campaign tests (index/_layout/Overlay rewritten verbatim from reads; Countdown/Ago re-derived; stores/countdown.ts #4/#7/#10 fully reconstructed against the 928-test suite) — **all 928 tests green + on-device re-verification: js_to_content 1076, overlay_open 74-89ms, idle traversals ~0 — campaign numbers reproduced**. Synology APFS snapshots exist (mount requires owner sudo) — not needed in the end | s6: 239 doFrames/4s ≈ 6-7% | s7: persists at bare-View level (upstream); 22.5% isolated cost |
| 15 | NEW (s7, owner report post-reboot): LAUNCH SLOW — first launch ~9s, second ~5s (owner expects <1s). NOTE: campaign builds are dev-env (mock API + pino enabled) and post-reboot launches are dexopt/cold-cache inflated; campaign-measured ThisTime was 3481-4462 cold / 76-100 warm with js_to_content 1058-1170. A 5s SECOND launch is above the campaign band — re-measure cold/warm ×N post-reboot with marks + ThisTime and determine real vs environmental; root-cause if a regression (suspects: nothing obvious from #10/#11 — derived atoms are lazy, overlay subtree display:none) | **MEASURED + EXPLAINED (s7, no regression)**: post-reboot 3T, build 07:41:44 (#16 fix build): cold ×5 ThisTime 3537-3622 / js_to_content 1047-1056 — squarely IN the campaign band. warm ×5 (process alive, HOME→am start) ThisTime **68-93ms** — the 76-100 band, NOT regressed. The owner's ~9s first = post-reboot dexopt (documented); the ~5s "second launch" = the process had been KILLED between launches (Android 9 RAM pressure kills backgrounded apps; verified ProcessRecord alive right after HOME, but overnight/sitting = killed) → another COLD launch: 3.5s ThisTime + ~0.5-1s to fully-interactive JS ≈ the felt 4.5-5s. Cold decomposition (logcat wall + marks): ~1.8s pre-JS (fork+activity+bundle read) + 0.41s module-eval + 0.3s dev-env mock fetch + ~1.0s first content commit (js_to_content). LEVERS (known, now unblocked): chrome defer (BottomSheet×3 + Overlay mount at root inflates first commit) + module-eval trim; dev-env confound = ~0.3-0.5s of every cold launch (mock refresh + pino flood) that production never pays. Owner's <1s goal needs those levers + production build; queued as future work after this session's queue | owner eyeball 2026-09-06 post-reboot | s7: cold 3537-3622/1047-1056, warm 68-93 |
| 16 | NEW (s7, owner report — REGRESSION): prayer-list text width JITTER on app open — the English prayer-time text visibly jumps/settles on launch ("width not cached like we previously had"). NOT present pre-campaign. Regression hunt: frame-capture the launch (video capture should be restored post-reboot), bisect the cause (suspects: row layout re-settling when sequence/date hydrates, font load, countdown display string arriving late via #10's derived atom, InitialWidthMeasurement) | **FIXED + VERIFIED (s7)**: ROOT CAUSE (instrumented build + logcat + vision): `clearAllExcept` (mock-refresh wipe, EVERY dev-env launch; also year-boundary refresh + upgrade path in prod) DELETED the `prayer_max_english_width_*` MMKV keys — the write-once width cache (owner: names+font are constants, never recompute) was being wiped, so the atom initialized 0 → rows first-painted with English column clipped to padding (width-0: English gone, Arabic −80px, time −40px for 1+ frames) → InitialWidthMeasurement re-measured ~380ms later → visible reflow/settle. Which launch ate the jitter was a race (atom-first-read vs wipe). FIX: `'prayer_max_english_width_'` added to BOTH keep-prefix whitelists (stores/sync.ts:162 + stores/version.ts UPGRADE_KEEP_PREFIXES) + both jest whitelist assertions updated (928/928). VERIFIED (3T, build 07:41:44): `MMKV KEPT: [...prayer_max_english_width_standard, ...extra...]`, zero DELETE lines; 52-frame launch capture = monotonic fade, zero reflow bumps; VISION: all 6 rows × 4 elements at pixel-identical positions through the whole entrance (cross-correlation shift=0 vs settled, alpha-unblended) | owner eyeball 2026-09-06; pre-fix evidence perf12/launch (one-frame reflow: English gone, arabic −80, time −40) | post-fix perf12/launch2: 0.00 diff-to-settled by frame 41, no transient |
| 17 | NEW (s7, owner report): TAP→ACTION LATENCY — haptic fires immediately on prayer-item tap but the overlay takes ~500-700ms to visibly start; same ~500ms for the alert sheet after its icon tap. Campaign marks measured overlay_open 170-230ms (tap→effect) + ~116ms pre-animation stall; owner-perceived gap is larger post-reboot. Measure tap→first-visible-frame precisely (video + marks aligned), decompose (input→JS→commit→first animation frame), close the gap | **PARTIAL FIX LANDED (s7) — overlay path ~2.3x faster commit**: DECOMPOSITION (true-fidelity taps via raw kernel sendevent on the synaptics s3320 touchscreen, one-shell date-bracketed): tap-up→JS handler ≈ **130ms** (RN input dispatch + Pressable responder on SD820 — device floor, not app code); JS commit+effect (overlay_open mark) was **168-203ms**; +1 vsync to fade start ≈ ~325ms tap→animation + ~60-100ms fade-perceptibility ≈ the felt ~400ms+ (owner's 500-700 includes post-reboot system load). ROOT CAUSE of the fat commit: EVERY prayer row component (Prayer+Time+Alert ×12 rows + overlay copy ≈ 37 components) subscribed to the whole `overlayAtom` object — one tap re-rendered all of them. FIX: `stores/atoms/overlay.ts` gains `overlayIsOnAtom` (derived boolean — Countdown/Bar/Ago) + `getOverlaySelectedAtom(type,index)` (module-cached derived per-row selection atom — Prayer/Time/Alert); a toggle now re-renders only the rows whose selection flipped + overlay + isOn consumers. MEASURED (3T, build 08:03:14): overlay_open **61-89ms** across 5 cycles (was 168-203; baseline 162-230) → tap→animation ≈ 210ms, perceived ≈ 270-310ms. Alert-sheet path = #18's durations work. Input→JS 130ms floor documented. jest 928/928, biome+tsc green. Frame-quality re-audit folded into #18's video pass | owner eyeball 2026-09-06 | overlay_open 168-203ms → **61-89ms** |
| 18 | NEW (s7, owner report): SHEET SPEED + CHOREOGRAPHY — (a) sheets close slowly with a slow-down at the very end (spring settle tail) — want faster closes AND haptic feedback earlier on close (notify completion); (b) settings → "Change athan" CLOSES settings THEN OPENS sound serially — want concurrent close+open; (c) sheet OPEN entrances feel slow (~500ms springs) — consider tightening durations across BottomSheetModal configs. Behavior stays 1:1 in effect (faster ≠ different); springs/durations are the levers | **DONE + VERIFIED (s7)**: (1) ROOT CAUSE of the tail: @gorhom default Android config = 250ms `Easing.out(Easing.exp)` — exponential tail drags the settle. FIX: Sheet.tsx passes `SHEET_ANIMATION_CONFIGS` = Android `{200ms, Easing.out(Easing.cubic)}` / iOS tightened spring `{damping 42, stiffness 500, mass 1}`. MEASURED: open_anim marks 152-200ms; close visual cluster ~115-150ms; alert-OPEN/CLOSE + settings-OPEN cadence ALL 16-17ms (60fps, floor PASS with headroom); plain close no longer settles slowly (cubic-out has no asymptote). (2) Close haptic EARLIER: new Sheet prop `closeHaptic` fires in onAnimate when the close STARTS (back/backdrop/swipe/programmatic — all paths); the three screens' onDismiss handlers no longer fire it at completion (Settings Medium, Sound Medium, Alert Light — same styles as before). (3) Change-athan CONCURRENCY: root-caused TWO serializers — the 150ms setTimeout (removed: hideSettingsSheet() + showSheet() same tick) and the lib's default `stackBehavior='switch'` (unmounts-then-presents; Sound sheet now `stackBehavior='push'`). Marks confirm sound_present + settings_close_start fire the SAME ms. RESIDUAL (owner-accepted s7): the sound sheet's animation still starts ~600ms after present because @gorhom unmounts modal content on every dismiss and re-mounting the 32 SoundItems is JS-thread work; owner directive: keep rendering ALL 32 rows (static, fixed, minimal — NO virtualization/lazy-load/FlashList). Net UX: tap → settings drops immediately → sound rises after its mount. (4) open durations tightened via the same config (d subsumed). jest 928/928, biome+tsc green; builds 08:10:12 + 08:20:53. HARNESS: settings "Change athan" row center = (540,1138) on the 3T; pull screenrecord files only after the recording's time limit elapses (moov atom otherwise missing) | owner eyeball 2026-09-06 | open_anim 152-200ms; cadence 16-17ms everywhere; sound animate-start still +600ms (mount-bound, accepted) |
| 19 | NEW (s7, owner report — PRE-EXISTING DEFECT): overlay prayer-row DOUBLE-EXPOSURE jitter — the overlay duplicates the selected prayer row on top of the original; during the overlay's 0→100% fade-in the underlying original row (English name, Arabic name, time, alert icon, active background — BOTH pages) shimmers/jitters because the overlay copy renders a different shade of white → a visible crossfade. Capture frame evidence from every piece (open, held, close), then fix (may be subsumed by #20's re-architecture — sequence: evidence first, then decide) | **EVIDENCE CAPTURED (s7, vision-audited; fix = #20)**: recording perf12/x19 (open on ACTIVE row → close → open on DIM row). PIXELS: Dhuhr band mean 74.2 → **55.7 dip** → 72.1 settled; text max 255 → 190 → 254 (settled ≠ pre-tap: the "different shade"). VISION: at every instant exactly ONE aligned render (no visible double image) — the crossover is TEMPORAL: whole row dims to ~75% at ~100ms (semi-transparent dark overlay layers over the still-bright original while the copy is also ~80%-alpha — a bluish veil, soft halos, zero full-white pixels), then settles as the overlay's own re-render — Latin text pixel-identical but Arabic re-rasterizes ~1.5px shifted + bell 1px wider (the "crawl"). Close = symmetric dip then pixel-perfect original return (XOR 3-19px — underlay never unmounted, Rule-5 compliant). DIM-row open (Asr): smooth monotonic 87→254, NO dip — the in-place AnimColor path is already correct. Owner context folded in: crossover hits text+active-bg+icons alike on both pages; exists ONLY because the overlay duplicates content on top. Root fix = #20 in-place re-architecture (single fade opacity animating the whole stack is structurally incapable of not dimming the underlay mid-fade) | owner eyeball 2026-09-06 | evidence perf12/x19 (74 frames + 6 vision-audited crops) |
| 20 | NEW (s7, owner directive): OVERLAY RE-ARCHITECTURE — attempt a completely different approach: instead of a full-screen absolutely-positioned overlay that DUPLICATES the prayer row/countdown/date (with measureInWindow positioning), dim everything else and highlight the selected prayer + date + countdown IN PLACE using the existing components (top-left glow + fully dark background stay). **OWNER PROCESS DIRECTIVE (s7): split into a PLANNING session first — deep-dive, brainstorm, self-questioning, architectural research, bigger context window — then a BUILD session that implements it, both resuming from this file. THIS session only: capture #19 evidence + write the planning brief (ai/features/performance/overlay-rearchitecture-brief.md) so the planning session starts fully armed.** CRITICAL parity requirements (owner): 1:1 behavior before/after incl. performance testing; tapping an UPCOMING prayer (dim text) must still animate it to bright white (the overlay currently handles this); the overlay countdown (selected prayer, scale 1.5) must survive; overlay z-order/hit-testing 1:1; the underlay must stay live during the fade (no teardown jitter). **REMOVE THE 2s PRE-BOUNDARY LOCK (owner-sanctioned behavior change — the ONE deliberate deviation from 1:1)**: today the overlay auto-closes ~2-3s before the prayer (stores/countdown.ts `overlayMsLeft <= 3000` auto-close) AND refuses to open in that window — the lock exists ONLY because animating the active-background move to the next prayer inside the duplicated overlay tree is hard. With in-place components the cascade/next-prayer transition is just the normal list animation the app already does — the lock becomes unnecessary. GOAL (owner): UI stays fully consistent with the overlay open through countdown-finish/cascade/next-prayer transitions; no auto-close, no open-refusal. Owner s7 context (verbatim intent): the crossover exists ONLY because the overlay sits on top duplicating content — a 100%-white row must STAY 100% through open (no dim-to-50% crossover); a dimmed row animates smoothly from its dim value to 100% (already feels right — the in-place AnimColor path); the SAME crossover hits the active background, alert icons, full text — everything duplicated. Reusing the original mainscreen components in place should eliminate the crossover by construction. | **CLOSED (s10-s11) — SHIPPED as the PER-ELEMENT variant + pixel parity + countdown merge** (ADR-014 Implemented; bands-with-holes superseded after the owner rejected any cutout): per-row schedule-gated hidden atoms + pill/chrome/Masjid fades + VeilBackdrop + box-none catcher + scrollEnabled gate; 2s lock GONE (selection-follows-next-prayer, boundary-verified incl. open-tween collision + Isha→Fajr roll); countdown merged into the page atom (2 timers ever); parity vs original = XOR 0.19% modulo the three sanctioned deltas; owner-confirmed smooth on the 3T; iOS rebuilt for the owner eyeball (row-shadow pre-answered in code). See ADR-014 Implementation Outcome + session 10/11 log entries | owner directive 2026-09-06 | design complete (ADR-014) |

Iteration protocol: profile → root-cause → fix → rebuild Release → re-measure BOTH devices
→ jest green → log delta here. Device is never the excuse.

### Phase 4 — Regression harness
- [x] Maestro flows under `e2e/flows/` (smoke, overlay-x10, sheets-x10, swipes-x15, toggles-x10,
      sounds-x5 — absolute 3T pixels; smoke/overlay/sounds device-validated end-to-end)
- [x] `e2e/scripts/baseline-compare.sh` (marks streaming + median diff vs `e2e/baselines/android-3t.json`)
- [x] `e2e/scripts/frame-audit.sh` (screenrecord → pts → contact sheet → vision prompt; FRAME_AUDIT=sf
      SF-latency fallback for wedged video pipeline)
- [x] `e2e/README.md` (build protocol + every campaign gotcha)

### Phase 5 — Documentation
- [x] `ai/RUNBOOK-performance-testing.md`
- [x] ADR-013: env-gated instrumentation + pre-mounted/display:none overlay + first-frame-settled rules
- [x] AGENTS.md §Performance Design Rules (8 rules)
- [x] ISSUES.md G.6 measurement update
- [x] AGENTS.md Recent Decisions entry

## Constraints (standing)

- Never commit/push (owner's job); version bump per commit is the owner's ritual
- Never sleep >15s in one command — poll builds in ≤15s cycles
- Never reboot devices; keep both plugged in; keep the app alive between measurements
- iOS widgets (`stores/widget.ts`) and notification scheduling semantics: measure +
  document only
- Behavior 1:1: jest suite green after EVERY iteration + final owner smoke test
- No `console.log`; pino via `shared/logger.ts`; Biome clean

## Log

- 2026-09-06 (session 13 END — ANDROID SHADOW/GLOW SHIPPED; committed as 1.20.1, docs corrected
  in 1.20.2): the owner's post-campaign ask — make Android match iOS's (a) active-pill depth
  shadow, (b) masjid golden glow (silhouette-shaped). DEVICE: the Galaxy S23 base (SM-S911B,
  Android 16 / API 36, serial S23_SERIAL) was a TEMPORARY LOAN for this work — returned at
  session end with the test app (`com.mugtaba.athan.shadowtest`, via a throwaway build.gradle
  applicationId override — android/ is gitignored) uninstalled; the owner's Play Store app was
  never touched. The S23 did NOT join the fleet (the 3T stays THE Android device); borrow a
  modern device again if the API-31+ tier matters. ANDROID SHADOW
  LADDER (researched): API 21 elevation (grey), API 28 colored+RN boxShadow (3T's ceiling),
  API 31 RenderEffect (silhouette-class, Pixel 6/S22 era+), S23 = 36. FINDINGS: (1) any transform
  in the ancestry clips RN's boxShadow drawable to view bounds on API 28 (the pill's slide) — but
  NOT on API 36; (2) borderRadius + boxShadow on the same view KILLED the shadow outright on the
  3T but renders rounded correctly on the S23; (3) SVGR (svg-transformer) silently DROPS <filter>
  elements ("not supported by react-native-svg") — while react-native-svg 15.15.4 fully supports
  Filter/FeDropShadow when used as DIRECT TSX components; (4) FeDropShadow re-rasterizes on every
  parent redraw — 2.3s page-swipe freezes on the S23 — fixed with renderToHardwareTextureAndroid
  (rasterize once; verified: worst gap 42ms @120Hz). FINAL ARCHITECTURE (Android-only, Platform-
  gated; iOS byte-identical): pill shadow lives on the ACTIVE PRAYER ROW (static view, same rect
  as the pill, RADIUS.md rounded, fades with the row under the veil) — works on BOTH the 3T and
  S23; masjid glow = direct-TSX glow components (masjidGlow/masjidRamadanGlow.tsx, AUTO-GENERATED
  from the icon SVGs — regenerate when the icons change) with exact-unit viewBox alignment +
  hardware texture. OWNER-TUNED (3 iterations): pill standard rgba(28,22,145,0.4) — dark indigo
  nudged violet, NEVER bright (rgba(64,42,165) read "white" — reverted); extras rgba(110,0,107,
  0.32); glow stdDeviation 165u / floodOpacity 0.22 / group 0.6 (wide faint halo). Ramadan
  decorations' own glows = SVG radial gradients — cross-platform already, nothing ported; forced
  via a throwaway isRamadan() for the owner's live review + evidence (glow-evidence/01-10 +
  glow-tour.mp4). PERF NOTES: decorations idle ≈48 doFrames/s continuous + ~80ms swipe hitches
  measured WITH DECORATIONS OFF TOO (pre-existing pager behavior, not decoration-caused) —
  candidate future pass. KNOWN PRE-EXISTING BUG (fix written in session 12, REVERTED with the
  owner's "revert everything" and NOT re-applied — needs their explicit approval; changes iOS
  too): ActiveBackground maps the next prayer's SEQUENCE index straight to a display slot,
  ignoring canonicalDisplayOrder — the extras pill parks on the wrong row whenever extras
  canonical ≠ chronological (2+ future extras prayers); without the fix, the row-shadow (correct,
  isNext-based) can visibly divorce from the misparked pill. NEXT SESSION QUEUE: (1) extras
  pill-slot canonical fix re-application (owner approval + iOS note); (2) swipe-perf pass (~80ms
  pager hitches, both decoration states); (3) 3T pass over the FINAL tuned shadows (row-shadow
  verified pre-tuning; colors re-check); (4) iOS rebuild + owner eyeball incl. shadow-session
  parity; (5) parked backlog: #15 cold-start levers, phantom Choreographer loop on next RN/Expo
  upgrade, expo-widgets PR #49244 tracking. Battery at commit: jest 931/931, tsc + biome clean.
- 2026-09-06 (session 12 — ANDROID SHADOW/GLOW PARITY, owner-requested post-campaign add-on;
  UNCOMMITTED for owner review): owner directive: iOS is pixel-perfect — make Android match the
  iOS (a) active-background depth shadow (both pages) and (b) the masjid's golden glow. ROOT
  CAUSES: both were iOS-only legacy shadow* props (Android no-ops); the modern RN 0.86
  `boxShadow` prop renders on Android API 28+ via a background drawable (OutsetBoxShadowDrawable
  — offset/blur/color, NO elevation → no z-reorder). FIXES (4 files, Platform-gated, iOS styles
  byte-identical): (1) SHADOW_ANDROID presets in shared/constants.ts mirroring the iOS presets;
  (2) masjid glow = boxShadow on the Masjid container View — WORKS DIRECTLY (vision-verified:
  golden rgba(239,156,41,~0.2), offset +5/+5, soft 25-28px falloff outside the silhouette);
  (3) pill shadow: CANNOT live on the pill — empirical ladder (5 debug builds): any transform in
  the ancestry (the pill's slide translateY, static OR Reanimated, own OR ancestor) CLIPS the
  boxShadow drawable's out-of-bounds painting (Android render behavior; wrapper+margins does NOT
  escape it) — so the shadow lives on the ACTIVE PRAYER ROW (static view, same rect as the pill,
  interior clipOutRect makes paint order irrelevant, and it fades WITH the row under the overlay
  veil ≡ the iOS pill-shadow lifecycle). KNOWN VISUAL DELTA vs iOS: during the 0.87s boundary
  slide the shadow sits on the destination row while the fill slides in (transform-clip makes
  a riding shadow impossible on Android). PRE-EXISTING BUG FOUND + FIXED (both platforms):
  ActiveBackground mapped the next prayer's SEQUENCE index straight to a display slot — extras'
  canonical order is a permutation → the pill sat on the WRONG ROW whenever 2+ future extras
  prayers existed (3T evidence: pill on Midnight row 0 while bright/active row = Suhoor row 2);
  fix = map through canonicalDisplayOrder (List.tsx's own permutation) — this CHANGES iOS
  BEHAVIOR TOO (bug fix — flagged for the owner's iOS eyeball). VERIFIED (3T, build 17:54:31,
  vision): std shadow α≈0.5 spec-exact soft 50px falloff; extras shadow magenta tint
  α≈0.24-0.30 decaying (spec 0.35); masjid glow pass; pill==bright row==shadow all pages;
  no regressions (fill exact, text crisp, inactive rows clean). jest 931/931 + tsc + biome
  green. API<28 Android: no shadow (graceful no-op). HARNESS LESSONS: (1) RN Android boxShadow
  + transform = clipped shadow — shadows must live on non-transformed views; (2) screenshots
  right after a fresh install catch the LOADING frame — always re-shoot after content settles;
  (3) `expo run:android` sometimes silently skips the install (lastUpdateTime vs behavior —
  verify by behavior, not timestamp). STATUS: 4 files modified, NOT committed (owner review
  first — their explicit instruction); suggest 1.20.1 patch on approval. NEXT: owner review →
  commit ritual → iOS rebuild + eyeball (extras pill now correct there too).
- 2026-09-06 (session 11 END — s10.4 + s10.5 WRAP): iOS rebuilt (Release, gate-ON, xcodebuild
  BUILD SUCCEEDED 16:32, devicectl install + launch OK on the XS) — the owner's eyeball pass is
  the final acceptance gate; row-shadow question PRE-ANSWERED in code: ActiveBackground.tsx:65-70
  carries SHADOW.prayer/SHADOW.prayerExtras + COLORS.shadow.* natively (the old copy's constants —
  iOS renders the real pill's shadow; verify visually at the pass). WRAP: ADR-014 → **Implemented**
  (status rewritten + Implementation Outcome section appended: the pivot history, what shipped,
  the countdown merge, the full §7 checklist results incl. the two supersedes — bands seams n/a,
  iOS owner pass pending); AGENTS.md §Performance Design Rules extended 8 → 12 (mark-semantics
  drift + settled-frame diffs; capture-artifact vetting incl. recorder-t0 drift, encoder drops,
  stale AX dumps, recorder-death-with-shell, device-clock skew; box-none fall-through + pager
  scrollEnabled hit-testing; state-merging over parallel state) + ONE campaign-closure Recent
  Decisions entry; #20 table row → CLOSED; State block rewritten for handoff. Mock restored
  byte-identical (verified vs HEAD). Final battery re-run on the resting tree: jest 931/931,
  tsc clean, biome clean. Working tree (uncommitted, owner's ritual): stores/countdown.ts,
  stores/overlay.ts, components/countdown/Countdown.tsx, shared/types.ts, both test files,
  AGENTS.md, ai/adr/014/ADR.md, progress.md. CAMPAIGN RESUME POINT: owner iOS eyeball → any fix
  queue it produces → owner commit ritual (suggest 1.20.0, minor — completed feature per §6).
- 2026-09-06 (session 11 — s10.2 BOUNDARY RECORDING + s10.3 IDLE GATE: ALL PASS): builds 19-21
  (gate-ON, mock-churned per case, RESTORED byte-identical + final resting build 16:27:39).
  s10.2a (overlay OPEN ~2min, rides Dhuhr→Asr; perf21/s102/rec-a + vision): countdown-finish =
  6s→…→1s hold (never 0s); hero swap ATOMIC at frame granularity (fa_068 "Dhuhr/1s" → fa_069
  "Asr/2h 58m"); store transition 16ms (TICK log); pill slide = the dense 60fps run (70 frames,
  single connected blob, exactly one row-pitch 150px, monotonic, 0.87s, never two/zero pills);
  no veil drop/blink; overlay STILL OPEN after (AX: hero Asr 2h57m31s, highlight advanced,
  catcher frames the Asr row). The coarse "2h 58m" for ~1s = display contract (ceil landed on
  2h58m00s; 0s never renders). s10.2b (NO-OPEN-REFUSAL ≤2s + open-tween/cascade COLLISION;
  rec-b5 + vision over ALL 121 frames): tap at ~1.3s-to-boundary → overlay_open 187ms — the
  old ≤3s lock would have REFUSED; boundary 0.33s later hit WHILE the 500ms scale tween ran;
  all 121 frames exactly one pill + one coherent hero string (three atomic text states 1s →
  2h 58m → 2h 57m 59s), no blink/close; ONE caveat (pre-existing, by design): 2-frame (33ms)
  row-label crossfade dip mid-pill-slide (the s9 150ms row-brighten pace; pill stays opaque —
  the selection indicator never disappears). s10.2c (Isha→Fajr DATE-ROLL; rec-c + vision over
  all 131 frames): 1s hold; hero+DATE swap ATOMIC in the SAME frame (Rabiʻ I 24→25, band
  pixel-identical position); pill flight row 6→row 1 (full 5-row jump) = one rigid 148px band,
  0.82s, decelerating, exactly 1 pill in 131/131 frames; no auto-close (0 overlay_close marks
  all three cases); post-roll AX: hero Dhuhr 20h52m42s, date rolled, highlight on new day's
  Dhuhr row. NOTE: the mock's "next" after Isha is day1 Dhuhr 13:06 (morning prayers precede
  its launch-relative evening Fajr — documented mock shape); mechanics identical. HARNESS
  LESSONS (durable): (1) the 3T clock runs ~3.3s BEHIND the mac — time taps by DEVICE clock
  (adb shell date), never shell arithmetic; (2) a headless BG-task/ALARM respawn can own a
  dev launch (pre-spawned process evaluates the mock's `now` up to ~20s before am start) —
  verify perf_monitor_init lands within ~2s of am start, else force-stop and re-launch; (3)
  mocks/simple addMinutes returns CLOCK STRINGS (seconds truncated) → launch-relative
  boundaries land on clean wall :00 — boundary_dev = (init_mark − ~1.5s + 2m) truncated to the
  minute; tap at boundary−1.2s via tight device-clock compare loop; (4) a bash tool call must
  COMPLETE within its own timeout — background the recorder in one short call, never let a
  wait-loop eat the call (the recorder dies with the killed shell). s10.3 IDLE GATE (final
  resting build, 5s atrace each state): overlay CLOSED = 0 performMeasure / 0 performLayout /
  12 traversals (the per-second countdown TEXT commits — showSeconds is ON on this install,
  the owner-exempt family; s6 measured 0 with seconds off) → ZERO overlay-driven renders while
  closed; overlay OPEN = 7 traversals / 0 / 0, doFrame 301≈305 (the documented upstream phantom
  Choreographer loop) — OPEN ≡ CLOSED cadence, the merge adds NO timer/render cost (process
  ~31% in the established band). NEXT: s10.4 iOS rebuild + owner eyeball (row-shadow question),
  then s10.5 campaign wrap.
- 2026-09-06 (session 11 — s10.1 COUNTDOWN MERGE SHIPPED + VERIFIED): executed queue item 1 on
  baseline ab3ab7c (build 18, 15:12:06, gate-ON). CHANGE: the sequence ticker now writes
  `overlay-open ? selectedTarget : next` directly into the PAGE countdown atom
  (`writeDisplayCountdown` in stores/countdown.ts — per-second from the tick + instantly from
  stores/overlay.ts on open/selection/close; the boundary-restart initial write covers the
  advance); hold-at-1s for a passed display target comes FREE from getSecondsRemaining's
  ≥1 clamp (Math.max(1, ceil)); boundary detection unchanged (always the true next via
  getNextPrayer); overlayCountdownAtom + Name/Display derived atoms + CountdownKey.Overlay +
  Countdown.tsx's dual subscription ALL DELETED — 2 timers ever, enforced by the CountdownKey
  enum type. Zero visual change mandate held: the 1↔1.5 scale/translate tween is
  overlayIsOnAtom-driven, untouched. BONUS FIX (found in review): the baseline's
  startCountdowns() reset the overlay countdown on every foreground-return sync — an open
  overlay's countdown would freeze/0s on foreground return; the merged design is structurally
  immune (no separate overlay countdown exists). Documented edge semantics change (dead edge):
  null overlay target (stale index mid-roll) now falls back to the true next prayer instead of
  the old "Prayer/0s" placeholder — writing 0s into a page atom would violate the display
  contract. VERIFICATION: jest 931/931 (+1 net: merged-target suite — instant-write-while-open,
  true-next-when-closed, hold-at-1s w/ both chains armed, boundary advance now asserted on the
  PAGE atom {2698, Magrib}, other-schedule page atom unhijacked), tsc + biome clean. 3T frames
  (perf21/s101, one 15s take: open-on-PASSED-Fajr → close → reopen-on-NEXT-Dhuhr): all three
  transitions 60fps (open 17f @15-18ms + one 35ms; close 18f consecutive @15-18ms; open2 17f
  @15-18ms + one 34ms) — 30fps floor PASS. VISION (settled + first-anim frames): instant swap
  PASS (first animation frame already reads the selected target at 1.00x — swap precedes all
  animation), ticking-while-open PASS (29h9m10s→7s→4s monotonic; AX live-read 1h34m34s on the
  seamless reopen), close-restore PASS (Dhuhr 1h36m3s, ledger continuous), scale EXACTLY 1.500x
  (78/52px), name never scales, no 0s/blank/ghost/clipping. The vision flag "29h 9m ≠ ~9h" =
  mock by design (day1.fajr addMinutes(310) → tomorrow 20:26; the s4-verified 29h tomorrow-Fajr
  precedent) and "bar missing" = pre-existing Bar.tsx hides-under-overlay — both closed, zero
  defects. Marks: overlay_open 183-215 / close 254 — the post-s9 semantics band (commit-time
  instrument; FRAME EVIDENCE IS THE ARBITER, JS CPU unaffected). Harness note: video-t0↔shell-t
  drift ~0.3-1s; align bursts to logcat mark timestamps, not shell sleep arithmetic (open2's
  burst initially mis-windowed, corrected via the 15:17:02.156 mark). NEXT: s10.2 boundary
  recording (mock edits + rebuilds per case, RESTORE mock after), s10.3 idle atrace, s10.4 iOS
  rebuild + owner eyeball, s10.5 wrap.
- 2026-09-06 (session 10 — #20 PER-ELEMENT SHIPPED + PARITY ACHIEVED): executed the pivot the owner
  approved ("continue as you were" after the cutout objection): bands/veilGeometry hole logic
  DELETED (catcher-only geometry kept, renamed catcherGeometry.ts + tests); Overlay is now a thin
  input layer (box-none container, ADR-013 latch, extras explanation, 4-region catcher); the hiding
  moved per-element — Prayer rows fade via schedule-gated `getOverlayHiddenAtom(type,index)`
  (module-cached; off-screen page stays cold; the selected row's hidden state never flips so it
  re-renders only via its selected-atom path), ActiveBackground pill fades when its row ≠ selected,
  Navigation dots+settings+RamadanDecorations fade via one chrome opacity, Day's Masjid fades
  (location/date logic untouched); VeilBackdrop unchanged. Owner mid-session directives: date stays
  WHITE on the overlay like the normal component (recolor REMOVED — dim location + white date,
  exactly the non-overlay visual); the sanctioned-delta list is exactly THREE (location added, date
  white, date position unchanged) and the owner asked to verify WITHOUT reverting them — done via
  the settled-pair side-by-side. VERIFICATION (all on build 16, 3T): side-by-side vs the ORIGINAL's
  SETTLED frame (x19/x_0022 — NOTE: the earlier "hero 5% larger" finding was a mid-animation
  reference frame; withTiming default is 500ms — always diff settled frames!): PARITY ACHIEVED,
  fix queue empty (hero XOR 0.19% post-1px-align, pill fill (8,71,229)=true #0847e5 + corner radius
  equal, veil shape identical at 6 stations, glow footprint identical, 0 structural diff outside
  sanctioned zones; residual +1-3 RGB = capture-level, present on opaque pixels too). Pixel
  spot-checks: date max (255,255,255), location dim (98,108,160), rows veiled (max 31), dots gone
  (max 2), glow bump +44. Functional smoke: open ✓, row-body close ✓, bell→sheet-over-overlay ✓,
  BACK dismisses sheet ✓, swipe blocked (0.22 diff) ✓. Open animation 60fps (15-18ms; tap→first
  frame ~335ms — the established latency band). jest 930/930 (catcher suite replaced the band
  suite), tsc + biome clean. REMAINING s10 QUEUE: (1) countdown merge — owner-approved design:
  sequence tick writes `overlay-open ? selectedTarget : next` into the PAGE countdown atom
  (immediate write on open/selection/advance; hold-at-1s check for the display target in the merged
  tick; kills overlayCountdownAtom family + Countdown.tsx's dual subscription; 2 timers ever);
  (2) boundary recording + lock-gone on-device (mock ~2min pre-boundary; record THROUGH
  countdown-finish → advance → pill cascade → countdown retarget; Isha→Fajr date-roll case);
  (3) idle-gate atrace (overlay closed = zero overlay-driven renders; per-element must not tick);
  (4) iOS rebuild + owner eyeball (row-shadow question: the copy carried SHADOW.prayer — iOS-only
  effect; the real pill carries the same shadow constants so likely moot — check at eyeball);
  (5) campaign wrap: ADR-014 status → Implemented (per-element variant, superseding the bands
  design), AGENTS.md §Performance lessons (box-none fall-through, pager scrollEnabled gate,
  overlay_open mark semantics = frame evidence is the arbiter, always diff SETTLED frames,
  capture-artifact vetting), #20 row closure.
- 2026-09-06 (session 9 END — HANDOFF): #20 BUILT + DEVICE-VERIFIED on the 3T across 14 builds,
  but the owner's final EYEBALL VERDICT: NOT yet pixel-perfect ("still uses a cutout approach";
  "a lot of inconsistencies"). The device runs build 14 (12:54:31) = bands-with-holes +
  VeilBackdrop — cutout boundaries invisible per pixel audits, but the MECHANISM is a cutout and
  the owner has now twice stated they don't want holes. OPEN ARCHITECTURE DECISION (owner's, make
  it FIRST in s10): **pivot to per-element (recommended by the agent)** — no layer over content;
  non-selected rows + Ago(existing) + Bar(existing) + dots + Masjid fade out; VeilBackdrop STAYS
  (it is what puts surviving content on the veil gradient — load-bearing in BOTH designs); catcher
  (box-none) + scrollEnabled gate STAY (verified); bands/veilGeometry hole logic GOES (keep
  buildCatcherRegions — the catcher still needs the row-exempt rect). The per-element variant was
  fully implemented once this session (git history has it in the session transcript; the diff:
  getOverlayHiddenAtom(type,index) schedule-gated derived atom + AnimatedPressable opacity in
  Prayer + pill fade in ActiveBackground (only when pill's row ≠ selected) + dots wrapper fade in
  Navigation + Masjid wrapper in Day — Day location/date logic unchanged) — re-apply it, ~30 min.
  KNOWN REMAINING DELTAS vs original (fix in s10 regardless of architecture): owner saw
  inconsistencies beyond the audited regions — s10 MUST start with an owner-guided side-by-side
  (reference: /var/folders/.../T/opencode/perf12/x19/x_0015.png = ORIGINAL settled overlay on
  Dhuhr; compare crops hero/day/row/veil vs new screenshots; enumerate every diff and fix with
  owner confirmation). Confirmed-noted deltas so far: location visible on overlay (SANCTIONED —
  owner v2.0 directive), row drop shadow missing on iOS only (copy had SHADOW.prayer; Android
  no-op — check at iOS eyeball), date/row recolor pacing tuned (200/150ms). ALL VERIFIED THIS
  SESSION (carries over to either architecture): stores (lock gone + advance + race-safe tick),
  jest 939/939, hit-test matrix, swipe-block, floor 14-33ms, #19 dip absent, marks-semantics
  lesson (useLayoutEffect instrument in Overlay; frame evidence is the arbiter — overlay_open mark
  window now brackets a sync UI-thread mount wait, JS CPU is only ~44ms). S10 QUEUE after the
  pivot + pixel-parity pass: countdown merge (design settled: sequence tick writes
  overlay-open ? selectedTarget : next into the PAGE atom, immediate write on open/selection/
  advance, hold-at-1s for the display target in the merged tick; kills overlayCountdownAtom
  family + Countdown.tsx dual subscription; 2 timers ever), boundary recording + lock-gone
  on-device (mock ~2min pre-boundary; Isha→Fajr roll case), idle-gate atrace, iOS rebuild, owner
  eyeball = acceptance gate.

- 2026-09-06 (session 9 DETAIL — the build arc through 14 builds): implemented per ADR-014 then
  iterated through owner checkpoints. ARCHITECTURE SHIPPED IN BUILD 14 (bands variant — being
  replaced by the per-element pivot above in s10):
  (1) `components/overlay/Overlay.tsx` = the veil LAYER: opaque gradient BANDS (veilGeometry.ts,
  pure + unit-tested: coverage/disjointness/seam-color contracts) with holes over hero / day-column /
  selected row + the extras explanation + a 4-region press-catcher (row-exempt); ONE animated
  opacity (the original's single-fade mechanism); ADR-013 pre-mount/display:none latch retained.
  (2) `components/overlay/VeilBackdrop.tsx` = the veil's BACKDROP inside the underlay (Navigation,
  above BackgroundGradients, below pager): fullscreen overlay-gradient + the relocated Glow BEHIND
  the hero text (crisp white, not tinted), opacity crossfaded with overlayIsOn — this is what makes
  hole interiors pixel-correct (veil ramp, NOT navy). GOTCHA: Glow's own zIndex -1 sorts it BELOW a
  zIndex-less gradient — the gradient needs zIndex -1 too (tie → document order → glow on top).
  (3) In-place content: hero swaps+1.5x scales (existing), Day shows location (STAYS VISIBLE — owner
  directive, the one sanctioned visual delta) + date content-swap (next-occurrence) + 200ms recolor
  (memoized: hijri formatting is ~expensive on the 3T), Time shows tomorrow's time for passed
  selections (dual usePrayer), rows brighten 150ms (x19 pace). (4) Hit-test parity: container
  `box-none` (RN LESSON: a plain auto View SWALLOWS taps — the row hole needs fall-through to the
  z-lower sibling; empirically matrix-verified) + `scrollEnabled={!overlayIsOn}` on the pager (swipes
  starting IN the row hole otherwise drag the pager — RN lesson: native ViewPager2 intercepts drags
  regardless of JS responders). (5) Lock removed: canShowOverlay + auto-close deleted;
  selection-follows-next-prayer advance in the sequence tick (stores/countdown.ts) + the overlay
  countdown tick now RE-DERIVES its target per tick (a stale closure firing after a boundary
  retarget would otherwise freeze the fresh chain — race found on paper). VERIFIED ON 3T: pixel
  audits (backdrop #0D001A-family inside holes, no detectable hole edges, hero max #FFFFFF @1.50x,
  row pixel-identical, no seams/ghosts/strips, Masjid/dots veiled, status bar veiled, glow +44 blue
  bump after z-fix); frames+vision (open-active: row 255 EVERY frame — #19 dip ABSENT, veil
  monotonic, 15-18ms cadence; open-dim: monotonic rise, hole correct from first frame; close: no
  dip, clean 1.5→1 descale); hit-test matrix (row body closes, bell opens sheet over overlay, BACK
  dismisses sheet leaving overlay, dim-row area closes, swipe blocked + page unchanged, settings
  area closes); jest 939/939 (7 new veilGeometry + rewritten overlay/countdown suites w/ advance
  specs), tsc+biome clean. MID-SESSION DESIGN ARC (owner checkpoints): pixel-perfect directive →
  VeilBackdrop + glow relocation + timing alignment; owner's per-element (no-layer) proposal →
  pivoted, then owner's minimal-animation-count directive → REVERTED to bands (3 animated elements
  vs ~9; band code restored verbatim); owner's hole objection answered with pixel evidence (the
  backdrop makes hole interiors the veil ramp — no navy, no visible rectangle); lazy-page proposal
  SHELVED (off-screen page already ~0 cost post-#10; only cold-start prize; parked in #15's
  chrome-defer pass). **MARKS REGRESSION INVESTIGATION (durable lesson)**: overlay_open
  92.5→~196-200ms after the pixel-parity work; bisected through 5 single-variable builds
  (scrollEnabled, VeilBackdrop, box-none, Day hijri/memos, timing constants) — ALL ELIMINATED;
  atrace proved the JS thread runs only ~44-78ms CPU (max burst 44ms) and SLEEPS the rest — the
  mark's window now brackets a SYNCHRONOUS UI-thread mount wait (JS sleeps, commit waits); frame
  evidence shows USER-VISIBLE PARITY (first anim frame 846ms vs 861ms morning-verified; cadence
  14-33ms, floor held). The overlay_open mark's semantics changed (useLayoutEffect instrument
  added to Overlay for commit-time truth) — CROSS-BUILD COMPARISONS MUST USE FRAME EVIDENCE, not
  this mark. HARNESS NOTES: Maestro stalled once (killed; raw sendevent taps + logcat grep as
  fallback — equally valid for marks); expo run:android sometimes doesn't install post-build
  (watch lastUpdateTime; manual adb install -r). REMAINING (s10): countdown merge (owner-approved:
  sequence tick writes overlay-open ? selectedTarget : next into the PAGE atom; immediate write on
  open/selection/advance; hold-at-1s check for the display target in the merged tick — kills the
  overlay countdown atom family + Countdown.tsx's dual subscription; 2 timers ever), boundary
  recording + lock-gone on-device (mock ~2min pre-boundary), idle-gate atrace re-run, full jest,
  iOS rebuild + owner eyeball.
- 2026-09-06 (session 8 — #20 PLANNING COMPLETE, HANDOFF TO BUILD): **ADR-014 written**
  (`ai/adr/014/ADR.md`) — the overlay re-architecture design. Research: full code dive (Overlay,
  stores/overlay + atoms/overlay + countdown, Prayer/Time/Alert, Countdown/Bar/Ago, List/Day
  measureInWindow, Sheet z-order, both test files); platform verification via TinyFish (RN
  zIndex/elevation = siblings-only → cross-parent row-lifting above a root scrim impossible
  without portals; scrim-cutout precedent space = rect composition vs MaskedView vs native
  hole-view lib → **rect composition, zero new deps**). No device interaction needed this session
  (all behavioral facts code-verified: row-copy tap toggles close, bell opens the alert sheet over
  the overlay, swipe blocked, BACK unhandled, gradient OPAQUE #110022→#000000; frame claims are
  build-session work). DECISIONS: (1) **veil-with-holes** — the root layer keeps ONLY the banded
  opaque gradient (static holes at hero/date/row, reusing today's copy-positioning math +
  one-shot measurements), Glow, extras Explanation, and a 4-region press-catcher; ALL content
  in-place (existing selection atoms, hero swap+scale, Bar/Ago fades untouched; new
  overlay-awareness only in Day date + Time passed-row time). The #19 crossover becomes
  structurally impossible — holes never veil the row, on open AND close. (2) Boundary with the
  2s-lock removed = **selection-follows-next-prayer** (owner delegated the final call: "easiest
  and cleanest"); stick-and-count-tomorrow rejected. (3) Per-element dimming rejected (diffuse,
  approximate). The ADR carries the hit-test/z-order 1:1 matrix, the file-by-file diff plan
  (9 files), and the build parity checklist (jest/marks/frames+vision incl. the
  boundary-crossing recording/idle gate/lock-gone). NEXT SESSION (build): "Resume the campaign:
  read progress.md + ADR-014 and build the overlay re-architecture per the ADR, perf-testing as
  you go." iOS rebuild still pending before the owner's next iOS eyeball pass (s7 note stands).

- 2026-09-06 (session 7 END — HANDOFF): Vision gate passed (subagent correctly read the s6 squashed-pill
  frame). VIDEO CAPTURE RESTORED post-reboot (verified + used all session). #12 CLOSED with pixels+vision
  (pill full-width 289px capsule from first visible frame). #16 FIXED: clearAllExcept wiped the
  prayer_max_english_width_* cache every dev launch (and every year-boundary refresh + upgrade in prod) →
  width-0 first paint → re-measure reflow; fixed in BOTH keep-prefix whitelists (sync.ts + version.ts);
  vision-verified zero reflow. #15: cold 3537-3622/1047-1056 (in-band), warm 68-93ms (in-band) — owner's
  ~5s second launch = process-killed cold restart path, documented. #17: tap decomposition via raw-kernel
  sendevent taps (input→JS ≈130ms device floor; JS commit+effect was 168-203ms) — derived overlay atoms
  (overlayIsOnAtom + getOverlaySelectedAtom) cut the commit to 61-89ms; every-row re-render eliminated.
  #18: @gorhom default Android Easing.out(Easing.exp) tail replaced with 200ms cubic-out (iOS: tightened
  spring) — all sheet animations 16-17ms cadence; close haptics moved to close START (Sheet closeHaptic
  prop); Change-athan now same-tick + stackBehavior='push' (lib's 'switch' unmount-then-present removed);
  residual = sound sheet's 32-row mount ~600ms (owner: keep all 32 rows, NO virtualization). #19: crossover
  fully characterized (row dips to ~75% + bluish 80%-alpha veil + Arabic/bell re-rasterization crawl; dim-row
  path clean) — evidence feeds #20. #20 brief written (see overlay-rearchitecture-brief.md). #14 CLOSED:
  7-build bisect proved the phantom 60fps Choreographer loop UPSTREAM (persists with literally a bare View
  as the whole app; 22.5% isolated cost). INCIDENT: a git checkout during the bisect reverted uncommitted
  campaign changes in 6 files; fully reconstructed + re-verified (928/928 + on-device numbers reproduced:
  js_to_content 1076, overlay_open 74-89ms, idle traversals ~0). LESSON (durable): the campaign NEVER
  commits by directive — bisect work MUST use throwaway file edits that are diffed/reverted individually,
  never `git checkout --` on paths with uncommitted work; consider asking the owner for a WIP-stash ritual
  before risky operations. NEXT SESSION: the #20 PLANNING session (read the brief; design + ADR; no
  implementation), then the BUILD session (perf testing continues during the build). iOS rebuild pending
  before the owner's next iOS eyeball pass (s7 changed shared components: Countdown/Ago/Prayer/Time/Alert/
  sheets/Overlay/countdown-store).

- 2026-09-06 (session 6, continued — #10 IMPLEMENTED + VERIFIED): render-granularity gate landed:
  stores/countdown.ts gains primitive-valued DERIVED selectors — per-type countdown name/display-string
  atoms (display re-renders only when the formatted string changes: 1/min with showSeconds off, 1/s in
  the final-10-minutes seconds window or with the preference on — the owner's per-second-text exemption),
  + bar progress quantized to 1px steps (BAR_STEP_PCT = 100/COUNTDOWN_BAR.WIDTH) with an EXACT warning-
  flip boolean (threshold crossing keeps second accuracy); useCountdown returns the display STRING;
  useCountdownBar returns {progress(quantized), isReady, isWarning}; Bar.tsx color assignments driven by
  the derived boolean. The raw atoms still tick 1/s (boundary correctness); derived atoms recompute per
  tick (pure math) but emit only on visible change. 3 new tests (925→928). VERIFIED on 3T (build 06:03:53,
  gate-ON): idle atrace = ZERO traversal/measure/layout sections in 5s (pre-#10: 6.7+12.4ms bumps every
  second); countdown text flips exactly at the minute boundary (10×7px digit-region pixel diff at the
  flip, otherwise static); overlay marks 170/155, sheet_alert 593 healthy; js_to_content 1170 (family).
  Idle top median 19.3% (band unchanged — dominated by the phantom loop below). REANIMATED RESEARCH
  (owner-directed): 4.6.0 is out (bugfix-only, no OperationsLoop perf fixes — not worth mid-campaign
  churn, revisit later); OperationsLoop.cpp/NodesManager.kt read — the Choreographer re-arms while any
  LoopOperation (CSS-only here) OR classic animation/callback is active + a timestamp-cache invalidation
  cycle; PHANTOM 60fps LOOP confirmed on a FRESH process with ZERO interactions (239 doFrames/4s, 1.4ms
  animation-phase each, no layout, no display damage ≈ 6-7% CPU) — NOT Ramadan (gated), NOT @gorhom's
  keyboard/frame callbacks (passive, verified in source), NOT the per-second renders (survives #10).
  Suspects left: an eternally-active classic animation (withTiming-inside-useAnimatedStyle patterns in
  Countdown/Ago re-arm on evaluation — but those complete) or a Reanimated-internal cycle; NEXT: bisect
  build (sheets unmounted env-gated) — parked for Phase 4 companion work. NEW DEVICE GOTCHA: a stale
  Android Studio SCREEN-SHARING agent (app_process com.android.tools.screensharing) was burning 103%
  CPU on the 3T for 140+ CPU-minutes — heating the device (explains much of the screenrecord encoder
  throttling) and skewing CPU medians; killed 06:10, temp 60+→52.5°C falling. iOS: rebuilt+installed
  (05:52, gate-ON verified in bundle strings, widget pushes logged); owner directive mid-session: 3T-ONLY
  testing from here (iOS smoothness owner-eyeballs — same pre-mounted code path).

- 2026-09-06 (session 6, in progress — VISION GATE PASSED): vision subagent (GLM 5.3 Flash) verified
  working end-to-end (correctly identified the squashed-pill frame from perf11/crops). #11/#12 AFTER
  evidence (3T, build 04:49:35): js_to_content **1058** (996-family ✓ — subtree back in startup commit);
  overlay marks open 184-230 / close 173-237 across 9 cycles. FRAME EVIDENCE: **first-open-in-process =
  PASS** (11 frames @16-17ms cadence, monotonic 0.76→1.0 scale + fade, vision-confirmed NO snap/ghosting;
  the ~116ms tap→commit stall now lands BEFORE any visible animation = invisible); **first-close = PASS**
  (10 frames, mirrored, 60fps); **steady-state open = PASS** (18 frames @16-17ms, smooth fade, vision-
  confirmed). Steady-state CLOSE capture pending — device HEAT-SOAKED after ~1h of recording load:
  screenrecord encoder began dropping all animation frames (37→21→5→8→3 frames per recording despite
  16M→8M bitrate and 540x960 downscale) and gfxinfo read 88% janky (device state, not app — 05:10
  evidence was clean). Cooling the 3T (screen off ~5min) before re-capture. NEW HARNESS GOTCHAS: (1)
  ffmpeg frame extraction MUST use `-fps_mode passthrough` (output option, after -i) or VFR screenrecord
  output gets CFR-duplicated (314 PNGs for 37 frames); (2) pace scripted transitions ≥1.2s apart — the
  SD820 encoder drops frames when animations arrive back-to-back (rapid-fire 6-tap batches capture only
  the last animation); (3) Android screen brightness alone can't classify app states — home AND overlay
  are both dark navy; use vision frame classification instead. Owner directive (standing): iterate the
  vision subagent description/prompt in ~/.config/opencode/opencode.json as a clean one-shot spec (no
  changelog) whenever delegation friction appears — first refinement applied (measure-don't-estimate,
  bias inoculation, scale reporting; 205 words).

- 2026-09-06 (session 5, in progress): #11 + #12 implemented, mid-verification. Owner directives this session:
  (a) **3T is THE verification device** — oldest/worst; if smooth there, smooth everywhere; FPS-first evidence.
  (b) **30fps FLOOR for big animations** (overlay, sheets, cascade, segmented selection, prayer-transition UI changes);
  60fps = bonus, not required; per-second countdown text updates exempt (tiny). Prioritize which animations get the budget.
  (c) Full authority + unlimited time granted: re-validate anything from the whole campaign; quality over speed.
  (d) Model switched mid-session to GLM 5.3 Flash (vision capable) — all frame analyses now VISION-VALIDATED, not just
  pixel-script-inferred. A `vision` SUBAGENT (GLM 5.3 Flash, subagent mode, max effort, edit-denied) was added to
  ~/.config/opencode/opencode.json agent{} so future GLM 5.3 sessions can delegate image inspection — active after
  opencode restart. Division of labor: scripts MEASURE (bboxes, pts gaps), vision INTERPRETS (what it looks like).
  EVIDENCE HARNESS (3T, in /var/folders/.../T/opencode/perf11/): screenrecord 6s@16Mbps → ffprobe per-frame pts_time
  (screenrecord only emits frames on DISPLAY CHANGES = real compositor updates; each written frame IS a display update)
  → PIL region analysis + vision on crops. ffmpeg needed a dylib fix: ln -s Cellar/x265/4.1/lib/libx265.215.dylib into
  /opt/homebrew/opt/x265/lib/. BEFORE evidence (build it6, both vision-validated): overlay open = pop + 113ms freeze +
  ghosted double-exposure catch-up (close = clean 60fps 17 frames); alert pill = w≈4px left-edge sliver t=1.984-2.018
  then pop to w=288; alert sheet entrance ~12fps effective (NEW issue #13). FIXES: Overlay.tsx pre-mounted subtree +
  display:none visibility latch (hide deferred past close fade via setTimeout ANIMATION.duration; keeps #3's idle win —
  GONE/hidden skips draw+layout both platforms; overlay ticker stays on-demand); SegmentedControl.tsx width → static
  render-time style + useDerivedValue first-eval snap (Toggle pattern; snap not consumed while optionWidth=0).
  jest 925/925, biome + tsc clean. Android Release gate-ON rebuilt + installed 04:49:35 (first launch discarded 4629ms
  dexopt). AFTER capture #1 (overlay) = SUSPICIOUS/CONFOUNDED — 200/132ms gaps in open window, close caught only 2
  frames, overlay_open mark 218 (was 160): recording started ~5s after cold launch (JS still settling + widget re-push
  ~2.5s) AND first-open-in-process now pays the subtree's FIRST layout+draw (display none→flex). NEXT: redo AFTER
  properly (settle ≥10s, then 3 opens in one recording to separate first-open cost from steady-state); pill AFTER
  capture; idle top medians (expect ~19% band until #10 kills the hidden Countdown's per-second render — accepted,
  sequenced); js_to_content check (subtree back in startup commit — expect ~996/134 family per it1/it3 numbers);
  iOS rebuild + marks; then #13 assessment, #10, #8. opencode.json (project) unchanged this session.

- 2026-09-06 (session 4 end, owner feedback): **REGRESSION from iteration 5 (#3)** — the overlay
  OPEN animation is janky on both platforms (3T very bad, XS noticeable): the hero countdown's
  scale-up to 1.5 snaps/jumps frames instead of animating smoothly; the CLOSE still scales down
  smoothly. Root-cause hypothesis: with the latched unmount, opening mounts the whole subtree
  (Glow SVG + LinearGradient + Prayer row + Countdown) in the SAME frames the scale/fade
  animations play — the mount commit (JS render + shadow tree + native view creation) starves
  the animation frames. Close is smooth because the tree is already mounted. This violates the
  behavior-1:1 rule → backlog #11 is the FIRST item of the next session. The fix must restore
  the pre-#3 smooth open while keeping the idle win (candidates: pre-mount an inert hidden
  subtree with no per-second subscriptions; cheapen/lighten the mount; or start animations only
  after the mount commit settles). overlay_open marks alone won't catch this — it measures
  store.set→effect, not animation frame quality; verify with screencap frame stepping or
  owner's eyes (owner confirmed they can see it on both devices).

- 2026-09-06 (session 4, iteration 6): sheet-dismiss burst (#2).
  ROOT CAUSE: `_rescheduleAllNotifications` AWAITED `refreshPrayerWidgets()` — on iOS the two
  timeline builds+pushes cost ~1.1-1.4s and ran inline in every foreground reschedule path,
  landing exactly on the sheet-dismiss home reveal (the "burst"). The dismiss handlers
  themselves already run post-animation (BottomSheetModal.onDismiss) — the awaited push was
  the burst.
  CHANGE: stores/notifications.ts — `_rescheduleAllNotifications({deferWidgetRefresh})`:
  foreground paths (`rescheduleAllNotifications` — sheet commits; `refreshNotifications` —
  foreground gate) fire the widget push via rAF + setTimeout(0) past the next paint with an
  explicit `.catch` (same pattern as stores/sync.ts iteration 1); the background task
  (`rescheduleAllNotificationsFromBackground`) still awaits (process stay-alive).
  perfMark/perfMeasure 'widget_push' moved inside the deferred task (marks preserved).
  Test infra: `global.requestAnimationFrame` polyfill added to shared/__mocks__/react-native.ts
  (node test env lacks it; RN provides it as a global).
  MEASURED (iOS, marks): sheet_sound_close 654ms → sound_commit **56ms** → widget_push_start
  ~530ms after commit (post-paint) → widget_push total 1383ms completes off the interaction
  path. Android: close 254ms, sound_commit 157ms, widget_push 0ms (Platform no-op, deferred).
  Idle unchanged (9.6% Android reading post-iteration-5 build family). jest 925/925, biome +
  tsc clean. Both devices rebuilt gate-ON (Android 04:20:27).
  HARNESS: iOS sound-sheet swipe dismiss needs a FAST flick from the handle (140ms drag to
  780) — slow swipes get eaten by the scrollable content (documented session-3, confirmed);
  pymobiledevice3 syslog live sometimes attaches late — verify Athan{React} lines exist before
  driving the interaction.

- 2026-09-06 (session 4, iteration 5): unmount closed-Overlay subtree (#3).
  CHANGE: components/overlay/Overlay.tsx — latched mount: `mounted` state starts false (closed),
  the open transition sets it true immediately, the close transition holds the subtree through
  the fade-out (setTimeout(ANIMATION.duration) = 200ms) then unmounts; `if (!mounted) return
  null`. Open/close animations stay 1:1 (fade-out completes before unmount); the closed overlay
  no longer keeps SVG glow + LinearGradient + a per-second Countdown render alive.
  MEASURED: Android idle process **16.1%** steady (main 10%, JS <1%) vs ~20-24% pre-#3;
  cumulative idle: 80.6% → 16.1%. overlay_open 155ms Android / 52ms iOS — includes the fresh
  mount and is FASTER than the always-mounted builds (180/34 JS-commit — less commit
  contention). overlay_close 186/66ms (fade + unmount). Overlay content verified on-screen
  (89% gradient coverage pixel check); countdown granularity correct (minute display static in
  2s window). js_to_content unchanged (934 Android / 126 iOS). jest 925/925, biome + tsc clean.
  Both devices rebuilt gate-ON (Android 04:11:59).

- 2026-09-06 (session 4, iteration 4): sound-sheet row re-renders (#6).
  ROOT CAUSE: BottomSheetSound passed the whole `useAudioPlayerStatus` object to every
  SoundItem (`status={status}`); the status object changes identity many times per second
  during preview playback → all 32 rows re-rendered per tick (session-3's render-side finding).
  CHANGES: SoundItem now takes PRIMITIVE props (`remainingSeconds` whole-seconds + `isAudible`
  boolean), computed at sheet level (Math.floor(duration − currentTime)); component wrapped in
  React.memo. A status tick now re-renders only the playing row, and only when its displayed
  countdown second changes. showCountdown semantics preserved (isPlaying && isAudible &&
  remaining > 0 ≡ old isPlaying && status.playing && remaining > 0).
  MEASURED: Android warm sheet_sound_open 298ms (session-3: 834 mixed); iOS cold open 873ms
  (first present builds 32 rows — mount-bound, one-time per session); iOS CPU DURING playback:
  1 Running sample / 1789 in an 8s Time Profiler trace ≈ 0% (was the 32-row re-render storm).
  BEHAVIOR VERIFIED (Android, marks + pixels + owner-audible on iOS): select taps fire
  (sound_select_tap ×N), play tap fires (sound_play_tap), playing row's m:ss countdown ticks
  during playback (pixel diffs at the row's text line), clip-finished clears the playing row,
  pause icon state flips. NOTE: play tap restart after a finished clip once failed to restart
  audio (2nd tap of same row) — PRE-EXISTING single-player quirk, untouched code path, logged
  for a future pass. jest 925/925, biome + tsc clean. Both devices rebuilt gate-ON.
  HARNESS: Android sound-sheet first row sits at y≈48% of screen height (sheet 80% + header +
  card + hint), play icon x≈90%; strays during blind tap-hunting changed temp selection +
  scrolled settings — force-stop before each scripted interaction to reset sheet/scroll state.

- 2026-09-06 (session 4, iteration 3): tick consolidation (#4) + hot-path pino gating (#7 TICK half).
  CHANGES: (a) hooks/useCountdown.ts — rewritten to SUBSCRIBE to the store countdown atoms
  (getCountdownAtom) instead of running its own wall-clock timer chain per mounted Countdown;
  the store sequence tickers already update those atoms with identical ceil values on the same
  :000-aligned cadence. 3 hook tickers eliminated (std page, extra page, overlay instance);
  isReady stays derived from nextPrayerAtom; getSecondsRemaining clamps ≥1 so the transition
  hold-at-1s behavior is identical via the atom. (b) stores/countdown.ts — overlay store ticker
  is now ON-DEMAND: startCountdowns() calls resetOverlayCountdown() (placeholder atom, no timer);
  toggleOverlay starts it on open / resets on close; the sequence-ticker auto-close path also
  resets it (was a would-be leak). (c) stores/overlay.ts — toggleOverlay wires the start/reset.
  (d) hooks/usePrayerAgo.ts — per-second setState now bails out (returns prev) when the ago
  text/minutes/isReady are unchanged → page re-renders drop from 1/s to 1/min per page.
  (e) #7: deleted the per-second debug call sites logger.debug('TICK') ×2 (countdown.ts) and
  'TICK: hook' (useCountdown.ts); kept 'TICK: transition' (fires ~11×/day). MMKV read/write
  debug lines NOT idle-path — folded into #8. Test: stores/__tests__/overlay.test.ts mock
  extended with resetOverlayCountdown.
  MEASURED (3T idle, foreground, settled): process 43.7% → **19.3%** (baseline 80.6%); main
  thread ~20-24%; JS 3.4% (baseline 24.1%); TICK log lines 6/s → **0**; timer chains at idle
  6 → **2**. js_to_content unchanged (956-999 — not a startup change). iOS: js_to_content 200ms
  (134-200 band, no regression), 0 TICK lines, widget pushes still post-content.
  BEHAVIOR VERIFIED: hero countdown ticks per second (screencap pixel-diff 490 diffs/3s in hero
  region — with showSeconds toggled ON for visibility); overlay on-demand ticker ticks while
  open (947 diffs/3s) and leaves NO residual burn after close (process 19.3% post-close);
  overlay close + prayer-row fallback countdown (29h tomorrow-Fajr on iOS WDA) correct; toggle
  preferences work; jest 925/925, biome + tsc clean.
  HARNESS GOTCHAS (new): (1) Android 9 uiautomator dump serves STALE accessibility trees —
  live-text assertions MUST use screencap pixel-diffs (PNG unfilter + region compare), not AX
  dumps; (2) `am start -W` ThisTime right after an install is inflated by dexopt (~4.9s) —
  always discard the first post-install launch; (3) dumpsys cpuinfo percentages are
  lifetime-cumulative after many relaunches — use `top -n N -d 5` medians; (4) multiple
  aborted+retried Maestro toggle flows silently double-flip boolean prefs — verify final state
  from the app surface (pixels), never assume toggle history.
  REMAINING idle burn (~19%): 2 store tickers + 3 Countdown renders/s + bar per-second update +
  surfaceflinger — next lever is #10 (render only when displayed string changes when showSeconds
  off → per-minute renders).

- 2026-09-06 (session 4, iteration 2): Android idle CPU — invisible-animation gating (#5 promoted
  over #4/#7 by measurement: main thread 93.1% >> JS thread 24.1%).
  CHANGES: (a) components/ui/RamadanDecorations.tsx — the animation-arming useEffect now early-
  returns when `!visible` (isRamadan && decorationsEnabled): it previously armed ~13 infinite
  withRepeat(-1) loops (3 bobs, 3 glows, lantern flicker, 3 cloud drifts, moon bob, moon glow
  pulse) that ticked Reanimated at 60fps while the component rendered null for ~10 months/year.
  (b) components/countdown/Bar.tsx — deleted `tipPulse` (dead infinite withRepeat consumed by NO
  animated style — a phantom 60fps Choreographer loop) and stopped animating width per second:
  the per-second withTiming(1000ms linear) animated `width`% + tip `left` (Yoga LAYOUT props →
  relayout every frame) for a SUB-PIXEL change (a 1s step of a multi-hour countdown moves the
  bar <0.1px). Small steps now direct-set widthValue; the visible >50% transition refill keeps
  TIMING_CONFIG_FAST; boundary color transitions keep withTiming. Bar verified rendering
  post-change via screenshot pixel check (646 bar-yellow pixels) + toggle pref restored ON.
  MEASURED (3T, app foreground idle, screen on): main thread 93.1% → 76.6% (after a) →
  **16.6%** (after b); process 80.6% → **43.7%** (top) / 20% (dumpsys window). JS thread
  24.1% → 3.3% (was inflated by animation-frame bridge traffic). gfxinfo: 3 frames/6s before
  AND after (UI static — burn was Choreographer/animation, not rendering). Residual 16.6% main
  + ~24% spread = per-second tick render churn (6 tick sources/s) + native view updates →
  iteration 3 (#4/#7). iOS: rebuilt + reinstalled; 10s Time Profiler attach shows effectively
  zero Running samples (≤~1% core) — iOS was never the idle headline (A12 absorbs it).
  METHOD NOTES: atrace text trace was the key profiler (359 Choreographer#doFrame+animation
  sections in 6s on main = 60fps loop); uiautomator does NOT expose the custom progressbar or
  LabeledToggle state on Android — verify bar via screencap pixel count; Maestro driver died
  mid-session (stale connection) — relaunch flow or use uiautomator dump. Jest 925/925 green,
  biome + tsc clean. Builds rebuilt gate-ON both devices (Android 03:15:28, iOS reinstalled).

- 2026-09-06 (session 4): Phase 3 iteration 1 COMPLETE — iOS startup widget-push defer.
  CHANGE (stores/sync.ts only): `sync(options)` takes `deferWidgetRefresh`; the startup atom
  passes true; `initializeAppState` then fires `refreshPrayerWidgets()` via rAF + setTimeout(0)
  (past first paint) with an explicit `.catch` — BG-task + foreground-listener callers still
  await (process-stay-alive + non-gated paths unchanged).
  ROOT CAUSE (from marks + pino timeline): iOS cold start's ~1.2s gap between sync-data-done and
  home_content was the WIDGET TIMELINE BUILD+PUSH running at sync completion and saturating the
  JS thread (~570ms Standard + ~530ms Extras, serial). First attempt (plain fire-and-forget,
  no rAF) measured NO improvement (1361 median ×5) — proof the await was never the blocker,
  the WORK PLACEMENT was: the build competes with React's first content commit either way;
  rAF+setTimeout lands it after the paint. js_to_content 1361→134ms median (×5: 133-177).
  MEASURED AFTER: Android 996-1020 / ThisTime 3512-3642 (no change — Platform-guard no-op;
  rebuilt anyway per protocol). iOS behavior verified via WDA AX (home rows render) + widget
  pushes still complete post-content (Standard 347-348 entries, Extras 326).
  FINDINGS (documented, no action): (1) iOS pushes widget timelines TWICE per cold start —
  sync's push + `initWidgetSettingsSync`'s debounced initial re-push ~2.5s later (≈2.2s of
  redundant A12 JS burn; widget.ts is measure-only this campaign — candidate for owner action
  or a future campaign). (2) BUILD CONFOUND: campaign Release builds are dev-env
  (`EXPO_PUBLIC_ENV` unset → isDev → mock API): every launch runs the full mock data-refresh
  pipeline (clearAllExcept + ~12-day rewrite, ~175ms Android / 14ms iOS) that production never
  does. Baseline + all campaign builds share the env → iteration deltas stay valid; do NOT
  compare absolute startup numbers to production expectations. Home screen confirmed showing
  mock cascade (Fajr 00:30 etc.). (3) Startup decomposition Android (cold): 60ms native + 780ms
  bundle + ~395ms module-eval (Running main → perf_monitor_init; SD820 Hermes) + 175ms mock
  refresh + ~70ms sequences + ~320-690ms first content commit + ~260ms notification/BG init
  (post-content). Android startup levers left: module-eval trim + chrome defer (sheets/Overlay/
  modals) — queued behind #4/#7 which burn CPU 24/7.
  Jest 925/925 green; biome + tsc clean. Builds rebuilt gate-ON on BOTH devices (Android
  installed 02:55:06; iOS reinstalled after rAF refinement).

- 2026-09-06 (session 3): Phase 2 COMPLETE — instrumentation built, validated on both physical
  devices, zero-cost verified. Evidence: baseline/2-instrumentation-validation.md.
  WHAT SHIPPED (code): react-native-performance@6.0.0 dep; shared/perf.ts (gate/ring/MMKV/pino);
  marks in: app/_layout (init), app/index (js_to_content), Sheet.tsx (perfName prop; open/close
  measures; screens pass sheet_settings/sound/alert), stores/ui.ts (present marks),
  stores/overlay.ts + Overlay.tsx (open/close), Navigation.tsx (pager drag/settle),
  LabeledToggle (toggle_tap + label detail), SoundItem (select/play taps), Sound.tsx
  (sound_commit), notifications.ts withSchedulingLock (enqueue/queue_wait/duration + widget_push
  at the caller). Tests: shared/__tests__/perf.test.ts (7) + react-native-performance jest mock +
  AppState added to react-native mock.
  KEY VALIDATION NUMBERS (in-app vs external): iOS js_to_content 1451ms (= baseline 1.1-1.6s gap),
  sheet open 729-770 (bias-corrected ext ✓), pager 204, overlay JS-commit 34ms(!); Android
  js_to_content 1077 (cold 3563≈3668 baseline), sheet open 416 median ×20, overlay open 180 ×10,
  sound sheet open 834, sound_commit 117 (reschedule 74, queue_wait 1, widget_push 0).
  NEW INSIGHTS: (1) iOS baseline "sheet open ×20" was iteration-1 + 19 toggle-tap false
  positives (harness close_sheets swipe eaten by scrollable content — marks caught it); true
  sheet open ≈730-770ms. (2) Overlay/sound-sheet pain is RENDER-side, not JS-commit (34ms/180ms
  commits) — backlog #3/#6 confirmed as render work. (3) Android pager gesture pipeline is 16ms;
  38% swipe jank = page render.
  LIBRARY GOTCHAS (react-native-performance@6.0.0, all handled in perf.ts): iOS native marks are
  on a skewed timeline (never mix native↔JS in one measure — only launch_native/launch_js_bundle
  native↔native are derived); ring `ts` = recording wall-clock ± observer batch lag (durations
  exact); measure() throws on missing marks (guarded); default export via require().default.
  **METRO CACHE IS ENV-BLIND: toggling EXPO_PUBLIC_PERF_MONITOR requires
  `rm -rf node_modules/.cache/metro` + delete the generated bundle or the stale transform ships
  (cost us a false OFF build; ON-restored after). Also gradle marks the bundle task UP-TO-DATE
  when only env changes — delete android/app/build/generated/assets/react/release/index.android.bundle
  to force.**
  HARNESS FIXES NEEDED (Phase 4): iOS close_sheets swipe (eaten by scrollable sheets); Android
  logcat must STREAM (-v threadtime > file) during flows — post-hoc -d dumps lose entries to the
  TICK debug flood; overlay-suite taps at fixed y can land between rows (verify via mark
  presence).
  NEXT (Phase 3): iterate backlog with marks as primary measurement — startup (#1), Android
  idle CPU (#4/#7), sound-sheet render (#6), overlay subtree (#3), sheet-dismiss burst (#2).
  Re-measure BOTH devices per iteration; jest green per iteration.

- 2026-09-05 (session 2): Phase 1 COMPLETE — full baseline captured, no code changes.
  Key results (details in baseline/baseline.md):
  - Android idle CPU 49% (dumpsys) / 90% (top) — headline.
  - Cold start: Android 3668ms / iOS 2693ms-to-content (system floor only 623-796ms).
  - Android jank per suite: overlay 69.9% > sounds 66.4% (spam 89.3%!) > sheets 43.1% >
    swipes 37.6% > toggles 24.4%. Zero ANRs/input loss anywhere.
  - iOS sheet/overlay open ~2110ms WDA-median (≈1.3-1.6s after harness-bias correction);
    pager 1005ms; toggle/sound spam doubles /source AX latency (2s vs 1s idle).
  - Profiles: iOS burn = Hermes interpret > RN shadow-tree slicing > Yoga; Android cold
    start = pre-render stall (19 frames in 3.5s).
  - jest 918/918 green (count updated from 876).
  HARNESS LESSONS: Maestro MCP driver dies on long flows + stale-handle — use Maestro CLI
  (`--device <udid>`, flow needs `---` header separator); raw adb input for true spam
  (Maestro paces). WDA tap POST RTT ≈550ms, /source ≈1.0s idle (2.0s under load) — iOS
  absolute latencies carry this bias, deltas valid. iOS sheet content AX-invisible in
  Release — assert on chrome (`Bottom sheet handle`); Android-layout coords scale to iOS
  proportionally (sheet top 30% both). xctrace App Launch terminates the app on completion
  (relaunch before attach-profiling). App Launch template works on physical device via
  `--launch -- <bundle-id>`.
  TOOLS STATE: WDA held by detached `xcodebuild test` (survives restarts) + usbmux
  forward 8100 — check `curl localhost:8100/status` after any restart. Baseline harnesses
  in /var/folders/.../T/opencode/ (ios-launch-timing.py, ios-interactions.py, ios-spam.py,
  *.yaml suites) — NOT in repo (scratch); replicate into e2e/ during Phase 4.
  NEXT (Phase 2): react-native-performance@6 dep + shared/perf.ts ring buffer +
  EXPO_PUBLIC_PERF_MONITOR gate; validate marks against these external numbers.

- 2026-09-05 (session 1): Plan approved (5 questions answered: branch exception granted; permanent
  env-gated instrumentation; Release-first; iOS widgets out of scope; install everything).
  Branch created. CLIs installed (Maestro 2.10.0, Flashlight, xcodebuildmcp@2.7.0 via npx,
  pymobiledevice3@11.3.1 at `~/.venvs/pymobiledevice3/bin/pymobiledevice3`). Android keep-awake
  set (`svc power stayon usb`). `app.config.ts`: env-driven name suffix added (defaults
  byte-identical). `opencode.json`: Maestro MCP + XcodeBuildMCP added (active after opencode
  restart). AGENTS.md §6 AI Tooling: Maestro + Flashlight documented. iOS signing set up by
  owner in Xcode (Team `TEAM_ID`, cert "Apple Development: the maintainer (CERT_TEAM_ID)");
  built-in Xcode MCP enabled by owner (Intelligence → Allow external agents) but no port found
  yet — optional, XcodeBuildMCP covers it.
  **Build in flight at session end (both detached, survive restart):**
  - Android: `EXPO_ANDROID_SUFFIX=perf EXPO_NAME_SUFFIX=perf npx expo run:android --variant release`
    → log `/tmp/athan-android-release.log`. First attempt failed: `android/` was STALE (1.15.0-era
    prebuild — `expo run` does not re-prebuild; repo gotcha). Fixed: explicit
    `npx expo prebuild -p android --no-install` with suffix env → applicationId
    `com.mugtaba.athan.perf`, versionName 1.18.9 verified. Rebuild running.
    APK path: `android/app/build/outputs/apk/release/app-release.apk`. Install clash context:
    device has Play `com.mugtaba.athan` + campaign `com.mugtaba.athan.bgtest` (do not touch).
  - iOS: `xcodebuild -workspace ios/Athan.xcworkspace -scheme Athan -configuration Release
    -destination 'platform=iOS,id=IPHONE_UDID' -allowProvisioningUpdates
    -derivedDataPath ios/build` → log `/tmp/athan-ios-release.log`. After build: install via
    `xcrun devicectl device install app --device IPHONE_UDID
    ios/build/Build/Products/Release-iphoneos/Athan.app` (replaces the TestFlight install,
    same bundle id `com.mugtaba.athan` — owner approved).
  **Resume protocol (post-restart, execute IN ORDER):**
  1. Check build logs `/tmp/athan-android-release.log` (Android: `npx expo run:android --variant
     release` was relaunched after purge, ORIGINAL id `com.mugtaba.athan` v1.18.9, prebuild
     re-run clean) and `/tmp/athan-ios-release.log` (xcodebuild Release, original id, Team
     `TEAM_ID`, `-derivedDataPath ios/build`). If a build died mid-flight, relaunch it
     detached with nohup + same command, keep polling ≤15s cycles.
  2. Install: Android should auto-install via expo run (verify
     `adb -s 3T_SERIAL shell pm list packages | grep mugtaba`). iOS:
     `xcrun devicectl device install app --device IPHONE_UDID
     ios/build/Build/Products/Release-iphoneos/Athan.app`.
  3. Re-assert Android keep-awake: `adb -s 3T_SERIAL shell svc power stayon usb`.
  4. Smoke-launch both apps (Android `com.mugtaba.athan`, iOS `com.mugtaba.athan`); grant any
     permission prompts (Maestro/mobile-mcp can tap system dialogs). Verify Maestro MCP sees
     both devices (`maestro devices` or MCP `list_devices`).
  5. Proceed to **Phase 1 baseline** (see checklist above; method in the plan section below).
     iPhone XS Auto-Lock → Never: DONE (owner confirmed). Never reboot devices. iOS widgets /
     notification semantics untouched. Owner commits manually; version bump is owner's ritual.

- 2026-09-05 (session 2): Resume protocol executed. iOS build SUCCEEDED (+codesign keychain
  prompts: owner clicked "Always Allow" — fixed repeating prompts). Installed on XS via
  devicectl (com.mugtaba.athan). Android build #3 had FAILED at
  `:app:configureCMakeRelWithDebInfo[armeabi-v7a]` — orphaned ninja/clang PIDs from killed
  build #2 held `.cxx` open (lsof found them; kill -9 + `rm -rf android/app/.cxx/RelWithDebInfo`).
  Build #4 SUCCEEDED, auto-installed on 3T (versionName 1.18.9 verified). Keep-awake
  re-asserted. **iOS AUTOMATION CAVEAT: Maestro does NOT support physical iOS devices** (docs
  confirmed; "Apple account team ID" error is a dead end — driver is simulator-only). Android
  drives fine via Maestro (MCP `inspect_screen` works on 3T_SERIAL). iOS interaction stack =
  **pymobiledevice3 `developer wda`** (tap/swipe/list-items/launch/screenshot via WebDriverAgent)
  + `xctrace` for profiling + `pymobiledevice3 syslog` for logs. WDA cloned to
  /tmp/opencode/WebDriverAgent and building onto the XS (Team TEAM_ID, log /tmp/wda-build.log)
  at time of this entry. NOTE: opencode's model cannot view screenshots/images — verify UI via
  AX trees / text assertions; save screenshots for the owner to review. Owner constraint
  reaffirmed: NO store/TestFlight/EAS production deploys — Release builds stay local.
  **WDA OUTCOME (same session): facebook/WebDriverAgent master is DEAD on Xcode 26** (stale
  -Werror breakage + `XCTAutomationSupport` now a restricted framework → linker fail).
  **appium/WebDriverAgent fork builds and runs fine** — THAT is the one to use. Setup (one-time,
  already done): clone appium/WebDriverAgent → /var/folders/.../T/opencode/WebDriverAgent
  (NOTE: /tmp/opencode in earlier notes = this dir), `brew install carthage` (only needed by
  facebook fork — appium fork needs NO bootstrap), then:
  `nohup xcodebuild -project WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner
   -destination 'platform=iOS,id=IPHONE_UDID' -derivedDataPath wda-build
   DEVELOPMENT_TEAM=TEAM_ID -allowProvisioningUpdates test > /tmp/wda-build.log 2>&1 &`
  WAIT for `ServerURLHere->` in the log, then:
  `nohup ~/.venvs/pymobiledevice3/bin/pymobiledevice3 usbmux forward 8100 8100 &`
  Drive via HTTP on localhost:8100: POST /session (appium:bundleId com.mugtaba.athan),
  POST /session/$SID/wda/apps/launch, GET /source (AX XML tree — parse labels),
  POST /session/$SID/actions (W3C pointer tap by coordinates — find-element fails on system
  alerts; parse frame from /source and tap center). Verified end-to-end: granted the notif
  permission alert and read the home screen tree. WDA session lives as long as the xcodebuild
  test process runs (nohup-detached, survives restarts). Harness note: WDA's own device CPU
  cost is constant across baseline + iterations, so deltas stay valid.


- 2026-09-05 (session 1 end): Owner purged ALL Athan apps from both devices (list in Phase 0
  checklist) and chose the ORIGINAL app id for both platforms (the earlier `.perf` suffix plan
  was killed mid-build and superseded). Android re-prebuilt clean (`com.mugtaba.athan`
  v1.18.9) + Release build relaunched detached; iOS Release build still running (started before
  purge — it now installs onto a clean device). iOS Auto-Lock → Never: DONE. Handoff rule added
  at top of file. Owner restarting opencode to activate Maestro MCP + XcodeBuildMCP. Resume via
  the protocol above.
  ANDROID BUILD HISTORY (know this): post-purge build #2 FAILED at
  `:app:createBundleReleaseJsAndAssets` — hermesc exit 6, 1m58s in (JS bundle compile step;
  suspected stale Metro daemon from a pkill'd earlier run). Build #3 relaunched after killing
  all metro/expo processes — CHECK ITS OUTCOME FIRST in `/tmp/athan-android-release.log`.
  If it fails again at the same task: (1) `pkill -f metro; rm -rf /tmp/metro-*`
  `android/app/build`, (2) retry `nohup npx expo run:android --variant release`; (3) if STILL
  failing, run the task verbose (`cd android && ./gradlew :app:createBundleReleaseJsAndAssets
  --info`) and capture the real hermesc stderr before touching anything else. The same JS
  bundled successfully earlier this session (2605 modules) — the code is fine; suspect
  environment/caching.
