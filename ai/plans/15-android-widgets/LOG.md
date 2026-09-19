# Execution log: Session 15

## Step 1: androidWidgets flag + config plumbing — DONE (aa82bd96, merged 2dce7c26)

- Red: 11 new/updated failing tests in `flags.test.ts` (parse + 4 resolution cases).
- Green: 23/23 in the suite; tsc 0; biome 0. Two pre-existing config-loader suites
  (`nativeConfig.test.ts`, `plugins/replacePreviousNotification.test.ts`) broke on the
  function export and were updated to invoke it with an ios context (plan section 4
  "existing tests that change").
- Breaks: all three caught (`ALL AS EXPECTED: 1`) — enableAndroid, env-var name,
  targetCellWidth.
- Preflight A1 anchor refreshed post-biome-format (single-line supportedFamilies);
  the preflight script change rode this commit.
- Self-review: iOS flag-off strip and flag-on passthrough verified by the four
  resolution tests; argv scan cannot fire on ios evals (guarded by the ios branch
  first and the `!includes('ios')` term).
- First commit attempt hit a watchman recrawl flake plus the two genuinely-broken
  suites; fixed suites, retried clean. Hook green on retry.

Resume from: Step 2 (pure Android snapshot builder), red suite first.

## Step 2: pure Android snapshot builder — DONE (1ed08b0b)

- Red: 8 tests in the new `widgetSnapshot.test.ts`.
- Green: 8/8; full suite 4554/4554 in all four tz zones (one Kiritimati
  worker flake rerun clean); tsc/biome 0.
- Coverage hook caught an unreachable defensive branch (`if (!day) continue;`)
  in my first builder draft: removed per the no-fallbacks rule, restructured
  day lookup. Validate green at 100/100/100/100.
- Breaks: (a) null-horizon guard and (b) day-anchor both caught. The plan's
  original break (a) (first-prayer horizon) proved unrepresentable in a
  London-shaped fixture (list order equals chronological order, so last-read
  equals max); replaced with the null-guard break on the same decision line,
  recorded here.
- Two test-side lookup bugs found during red (duplicate name+time across
  days; day found by any-Asr) fixed in the suite before implementation.
- Process slip logged: the step branch was created late (first commit
  attempt ran on uat-2 and hit the hook); recovered with no history damage.
- Self-review: builder is pure (imports read), unreadable rows never carry
  epochs, horizon is chronological max not sequence-last.

Resume from: Step 3 (dual-platform layout), contract-suite red first.

## Steps 3+4: dual-platform layout + renderer suites — DONE (d7d4563e)

- Folded into one commit: the changed-file coverage gate requires the
  renderer suite to cover the changed layout; committing them apart fails
  the pre-commit gate (the gate message says so explicitly).
- Implementation deviation from the plan, recorded: no shared shim
  components; the iOS JSX tree stays byte-identical (props->entry rename
  only) and a native jetpack composition joins the function body. The
  plan's invariant (same rendered content per platform, both trees pinned
  by tests) holds; the mechanism is simpler and drift-free.
- Contract suite: jetpack imports allowed; platform detector line pinned;
  closure walk now ignores type-alias declaration sites (a type alias was
  flagged as an unresolvable identifier, wrongly).
- Renderer suite: 7 tests, both platforms; hardened two fixtures so the
  planned breaks are detectable (half-minute freeze for ceil; exact
  boundary instant for the segment rule).
- Breaks: 3(a) platform-detector swap caught by the contract suite
  (monospacedDigit break intentionally uncaught, as the plan allows);
  4(a) ceil->floor and 4(b) boundary scan both caught.
- Medium split uses fillMaxWidth(0.48/0.52) hero/list fractions: Glance
  has no weight modifier, and a fixed-width list beside a fill hero
  starves under Compose's sequential Row measurement. Vision will judge
  the visual result on device.
- Full validate green: 4562/4562, coverage 100/100/100/100.
- Two hook retries along the way: watchman recrawl flake, then the
  coverage gate (correctly) rejecting the split commit.

Resume from: Step 5 (push layer), red suite first.

## Step 5: Android push layer + flip timers — DONE (f1888a11, merged ccf08f87)

- Red: 4 tests in `widgetAndroid.test.ts`; final suite carries 8 (stamps,
  contract fields, minute-flip reload, rollover re-push, empty cache,
  all-past window, native-throw tolerance, settings-sync re-push) plus the
  dedicated `widgetAndroidFlagOff.test.ts` (the widgetFlagOff pattern).
- The plan's in-file flag-gate variant proved order-dependent: jest's
  isolateModules does not isolate the store's LAZY widget require (it
  resolves after the isolate closes, against the outer registry). Probed
  empirically; the dedicated-file form is immune and matches repo
  precedent. Break (a) verified caught against it.
- Coverage loop: three uncovered decisions closed with tests (empty
  snapshot, null next row, native catch) and one dead gate line removed
  (neither-ios-nor-android return). Validate green: 4571/4571, 100/100/
  100/100. Breaks both caught.
- Git slip: a stray checkout landed the commit straight on uat-2; recovered
  by re-pointing the branch at the commit sha and merging --no-ff. History
  verified clean (ccf08f87).
- Timing diagnosis recorded for the future: widgetSettingsSync.test.ts
  passes in 0.5s but jest hangs at EXIT solo (the flip chains' always-rearm
  timers hold handles; workers are force-exited in full runs). Solo runs of
  widget suites use --forceExit; the timeout budget stays small.

Resume from: Step 6 (PNG assets + drawable plugin), asset tests red first.

## Step 6: widget PNG assets + config plugin — DONE (merged 899ee392)

- Generator: Pillow, palette as the layout's exact CSS strings via a css()
  parser (test pins subset relation); per-orb gaussian blurs; pill shadow
  margins; committed outputs (builds never need Pillow).
- 10 PNGs at 3x; pill images carry shadow margin (464x110 / 482x128) —
  the layout draws them into the 140x22dp row box, the margin bleeds the
  shadow. Moon mark is a crescent + four-point spark standing in for
  moon.stars.fill.
- Plugin test drives the real mod with a temp project root: byte-equal,
  idempotent. Done-when verified: flagged prebuild lands all ten drawables
  in res/drawable-nodpi.
- Breaks both caught (removed PNG; palette drift). Validate 4574/4574 at
  100/100/100/100.
- Test-side iterations logged: layout builds drawable names via constants
  and a template literal, so the existence test enumerates the plan's ten
  names and cross-checks the layout's literals/prefixes; the palette regex
  needed a strict-numeric form to ignore the css() docstring example.

Resume from: Step 7 (records + docs), then the device proof on the 3T.

## Step 7: docs + queue records — DONE (merged 34f37cf5)

- AGENTS.md flag catalog gains androidWidgets with its refresh model and
  the generator regeneration note; SDK58-PROGRAMME §17 carries the owner's
  widened goal (30 days is the floor, not the ceiling); the four session-15
  owner rulings recorded in ai/prompts/README.md; row 9 EXECUTED.
- One more stray-commit-on-uat-2 slip recovered by re-pointing the branch
  and merging --no-ff (34f37cf5). Version-lockstep caught the gradle
  versionName lag twice this session; noted for future steps to bump all
  three in one go.

Resume from: the device proof (build running via
session15/bin/build-prod-widgets.zsh — the session-3 script strips
EXPO_PUBLIC_* env, so the variant appends the flag to the build worktree's
.env, the build-mock-ramadan precedent).

## Step 8: Glance through minification — DONE (f8afcac0, merged 21111e47)

- Device: the first placed widget stayed on its loading layout forever;
  logcat showed `WM-InputMerger: NoSuchMethodException <init> []` for
  androidx.work.OverwritingInputMerger — R8 stripped the constructor in
  the minified release build, killing the WorkManager worker that composes
  every Glance update at birth.
- Fix: expo-build-properties android.extraProguardRules keeps
  androidx.work.** and androidx.glance.** (verified picked up by the v2
  build; debug and iOS unaffected).

## Step 9: canonical jetpack names + widgets in coverage — DONE (merged b5e20806)

- Device (v2): composition now ran but the widget rendered "Property
  'AndroidText' doesn't exist" — the runtime injects jetpack globals under
  their canonical names and my aliased imports (Text as AndroidText...)
  resolved to nothing in the widget runtime. Aliases removed; the Android
  composition spells Text/Image/Spacer like iOS and each runtime's globals
  answer their platform; local typed casts carry the jetpack prop shapes
  app-side. Dead defensive branches introduced with the aliases removed
  (scan-tracked day label, empty-day seed, required orb corner, plain else
  for the footer token split).
- widgets/ enters jest coverage (jest.config.js collectCoverageFrom) with
  the renderer suites carrying it: iOS home path at full branch depth
  (medium list, dark + oversized medium orbs, extras rose pill, stale per
  family, legacy entries, neutral, rendering-error catch, label-less hero,
  footer token arms), a new lock-widget suite (rectangular, inline, stale
  per family, placeholder, error catch), and the Android path's
  render-time tests plus dark/medium/one-line-stale/empty-label arms.
  Closure walker: type-alias declarations and function-type parameters are
  not value references. Validate: 4601/4601 at 100/100/100/100.

Resume from: v3 device build (proguard + canonical names); then placement
of all 8, the 16 screenshots, the frame audit, iOS simulator proof, audit.
