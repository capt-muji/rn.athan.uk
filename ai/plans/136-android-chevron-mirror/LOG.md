# LOG - ticket 136

## Ticket 136

## Planning (2026-10-18)

Frontier (all agent-ruled, argued twice, PLAN.md 2.1):

- D136.1 mechanism, measured: `chevronFor()` reads the pure app locale; the
  defect is Android's text stack mirroring the authored neutral glyph under
  the RTL-resolved paragraph (Unicode Bidi_Mirrored=1 for U+2039/U+203A;
  Fabric sets every view's layoutDirection from Yoga at
  `SurfaceMountingManager.kt:811`; iOS sets no paragraph baseDirection, so
  CoreText resolves natural and never mirrors). The row's I18nManager-snapshot
  theory does not apply: no branch in this path reads I18nManager.
- D136.2 fix: `direction: 'ltr'` pinned on the chevron Texts; codepoint choice
  untouched. Alternatives rejected in PLAN.md 2.1.
- D136.3 scope: every chevronFor consumer (Settings, ColorPicker, Help action
  row); Help's step-mark guillemets left as a named residual.
- D136.4 sweep suite `components/__tests__/chevronDirection.test.tsx`, red
  today, counts six and one.
- D136.5 device proof: 2.0.996 repro first, fixed fleettest build after
  merge; screenshot reads (a11y carries the authored codepoint, never the
  mirror).
- D136.6 the AVD is never a witness; D136.7 no `yarn test:tz` (no date path).

Planning mechanism probe (2026-10-18, AVD athan-smoke-28, disposable; shots
under sessions/136/avd-*, never committed):

- Probe branch `probe/136-pin` at `70bf8654` in a scratch worktree: the three
  pin edits (Settings.chevron, ColorPicker.chevron, Help actionChevron joined
  to actionText), committed with the full hook green (Tests: 2 skipped, 5743
  passed, 5745 total; coverage 100% on statements, branches, functions,
  lines). tsc and Biome clean on the probe tree before the commit.
- Baseline install of the owner's 2.0.996 fleettest APK on the AVD: under ar
  every Settings chevron apex points RIGHT (vision reads: 2 of 2 in the top
  card, 3 of 3 scrolled: Qibla partial, colour-picker row, Language row) with
  the layout mirrored (chevrons at the rows' left ends). The defect
  reproduced off the 3T.
- Probe build `probe-136-pin.apk` (build-mock.zsh, package
  com.example.athan, versionName 2.0.1013, badging read before install):
  under ar every chevron apex points LEFT (2 of 2 top, 4 of 4 scrolled
  including What's new and Help), layout mirrored as before; under en the
  chevrons point RIGHT at the rows' right ends, layout LTR.
- Harness notes for the device steps: the AVD's on-screen nav bar covers
  y 1794-1920 (dumpsys mContentFrame Rect(0, 1794 - 1080, 1920)), hiding the
  bottom row; `settings put global policy_control
  immersive.full=com.example.athan.fleettest,com.example.athan` freed it for
  the drive. The 3T has capacitive keys and no such bar, so the atlas point
  stands there. The Settings sheet needs one scroll before the Language row
  is visible on this panel class; the committed language-switch flow taps
  Language without scrolling, so the step-1 flow carries the scroll.
- Probe scratch worktree, branch and APK removed; the AVD killed. Evidence
  shots kept under sessions/136/ until DONE.

Anchor counts verified 1 of 1 each at cd171855 (eleven anchors).

Planned at cd171855 (2.0.1013); lane branch fast-forwarded to 65a88291
(2.0.1016, the owner's orders commit) before the planning commit; next free
version 2.0.1017.

### Step 01 — done
Reproduced on the 3T, 2.0.996 fleettest build (badging re-read before
install: package: name='com.example.athan.fleettest' versionCode='1000000'
versionName='2.0.996'). The executor dispatch ran every device action and
captured the shots; its image read was depth-blocked (subagent-of-subagent),
so the lane lead read the three shots through the vision worker - the step's
named read, not a substitute.

Arabic (default snap): Change athan and Qibla chevrons both apex RIGHT,
sheet mirrored (chevrons at the rows' left ends). Arabic (scrolled one
screen): colour-picker, Language, What's new, Help chevrons all apex RIGHT.
Six of six chevrons point RIGHT under ar: the defect, R3.1 met.

English: Change athan and Qibla chevrons apex RIGHT at the rows' right ends,
LTR layout: the R3.3 before-image.

Shots: sessions/136/2.0.996-ar-settings.png,
2.0.996-ar-settings-scrolled.png, 2.0.996-en-settings.png (never committed).
The executor's independent pixel-geometry corroboration (sessions/136/
136-chevron-px.py, calibrated on the AVD shots) agreed on every count and
direction. A first commit attempt (6c35b413, discarded, never merged) rode a
stale parent without its version bump; this commit is its clean redo at
2.0.1023.
session: ses_eb3b3e642ffePbPMLCU3q6SEOJ (lead-read closure ses_eb36e5493ffeUzU30BcLjhvnd5)

### Plan repair mid-execution (2026-10-18, agent-ruled by the lane)

The step-2 suite's it.each tables were two-column while the grill's unused-
parameter fix left one-column callbacks; tsc rejected the mismatch
(TS2345, two errors, plan-given code). Ruled: single-column tables
(`it.each(['en', 'ar'] as const)`), the repo's own idiom (locale.test.ts:149,
help.test.ts:48); the locale-to-glyph mapping already lives inside the probes
and is pinned by locale.test.ts. Argued twice: for - the repo idiom and no
unused binding; against - the table documented the glyph per locale, but that
mapping is redundant at the callback level and stays in the probes. The
repaired block was re-verified in the worktree: tsc clean, biome clean, red
4/4 against the unpinned tree (all direction assertions, Received:
undefined). The executor's STOP is recorded; its unfinished patch was
restored away per its own recovery.

### Plan repair two (2026-10-18, agent-ruled by the lane)

The single-column it.each repair left the calls two-line; at 120 columns
biome's formatter demands them joined, and a verbatim test is never edited.
Ruled: join both calls to one line each - pure whitespace, every token,
name and assertion unchanged. The lane verified the exact final form against
every gate before this commit: biome check clean AND biome --write output
byte-identical to the plan block, tsc 0 errors, red 4/4 against the unpinned
tree. The executor's second STOP is recorded; its evidence sits in
sessions/136/step2-biome.log.

### Lane weather and a build-bay repair (2026-10-18, the lane)

The formatting-repair merge conflicted on the two version files: lane 137
merged its 2.0.1025 into uat mid-flight (its 3T readings). Protocol applied:
abort, recreate the branch, retry once, resolve the version files by taking
the branch side wholesale (the higher version, 2.0.1026). The first
resolution attempt left duplicate version keys (biome caught it) and exposed
a second defect: the lane's one-line gradle versionName sync had truncated
the main tree's gitignored android/app/build.gradle to zero bytes
(write-handle opened before the read, the classic truncate-then-read).
Restored the file the sanctioned way: `CI=1 npx expo prebuild -p android
--no-install` in the main tree under build.lock regenerated it with
versionName 2.0.1026 and applicationId 'com.example.athan' (both verified).
The merge then landed hook-green (Tests: 5745 passed, 5745 total). The
lesson is folded into every later gradle sync this lane runs: read first,
substitute, then open for write.

### Step 02 — the paragraph pin (2026-10-18)

Resumed cold after the provider switches: the sweep suite was present but
unrun, so the red was re-established before any edit. Four tests, four
failures, every one `Expected: "ltr"` / `Received: undefined` at the
assertion (the count assertions six and one pass), recorded in
sessions/136/step2-red-resume.log.

The three pins then applied verbatim from the step file: `direction: 'ltr'`
last in `styles.chevron` (Settings and ColorPicker) and a new
`styles.actionChevron` joined to the action Text's style array (Help).
Green: suite 4 of 4; `npx tsc --noEmit` 0 errors; `npx biome check .
--error-on-warnings` clean over 453 files.

Version 2.0.1030 (1028 and 1029 were taken on live sibling lanes mid-run);
uniqueness clean (17 commits across 11 refs, no shared version).

Commit `196b8b63` (2.0.1030), hook-green: Tests: 2 skipped, 5747 passed,
5749 total; coverage Statements 100% (5401/5401), Branches 100%
(2326/2326), Functions 100% (1130/1130), Lines 100% (4838/4838). [Sha
corrected 2026-10-18: `196b8b63` was amended to `62bf9f37` before any
merge, then rebuilt twice by lane weather into `81aa6694` (2.0.1030) and
`be3850d2` (2.0.1032), which merged as `9d6964a7`; each rebuild re-ran
the full hook green, Tests: 2 skipped, 5751 passed, 5753 total, coverage
100% on all four measures. The step-03 entry carries the record.]
Killing-mutant pass on the committed pins:
`bash ai/plans/136-android-chevron-mirror/scripts/break-136.sh` ->
killed: settings-chevrons, killed: colorpicker-chevron, killed:
help-chevron, ALL AS EXPECTED: 3.

### Step 03 — done (2026-10-18, lane-run)

Ran lane-run, agent-ruled and argued twice: the plan allocates the drive
to an executor, but a cold executor re-reads the atlas to drive ten
minutes of taps while its image reads were depth-blocked in step 1, so
the read-verify loop split anyway; the lane running build, drive and
reads as one hand keeps the phone work accountable and the evidence
chain short. This session reads no images, so every screenshot read went
through the vision worker, one question each (step 1's precedent).

Build (main tree under build.lock, scratch worktree at the merged
`9d6964a7`, node_modules symlinked after a yarn.lock byte-match):
prebuild clean with the suffix exported in its own shell, applicationId
'com.example.athan.fleettest'; `gradlew assembleRelease --no-daemon
-PreactNativeArchitectures=arm64-v8a` BUILD SUCCESSFUL; aapt2 badging
read before install: `package: name='com.example.athan.fleettest'
versionCode='1000000' versionName='2.0.1032'`. APK kept at
builds/fleettest-136/athan-fleettest-2.0.1032.apk; scratch worktree and
TMPDIR removed, build.lock released.

3T (OnePlus A3003, Android 9): `install -r` Success; `dumpsys package`
versionName=2.0.1032; throwaway launch showed the home screen with no
What's New modal (the stamp held across the upgrade); HOME, `am kill`,
relaunch before the reads.

Reads, shots under sessions/136/ (never committed), each through the
vision worker:

- `2.0.1032-en-settings.png`: Change athan and Qibla chevrons point
  RIGHT at the rows' right ends, icons left, sheet LTR with the Display
  and Countdown Bar toggles below - the same visible structure step 1's
  `2.0.996-en-settings.png` read carried (R3.3 before-image match).
- `2.0.1032-ar-settings.png`: Change athan and Qibla chevrons point
  LEFT at the rows' left ends (vision measured the `<` glyphs at
  x~80-210 on the 1080 panel), icons right, sheet mirrored RTL (R3.2).
- `2.0.1032-ar-settings-scrolled.png`: the colour-picker row, Language,
  What's new and Help chevrons all point LEFT at left ends, none cut,
  the toggle rows between them chevron-free (R3.2).
- `2.0.1032-en-return-settings.png`: after the full ar round trip
  (switch, reads, switch back through the language sheet), chevrons
  point RIGHT at right ends on an LTR sheet again (R3.3; the flip is
  repeatable in both directions, matching her XS observation).

Six of six chevron sites point LEFT under ar on the fixed build; every
en read points RIGHT with the step-1 layout. R3.1 (step 1), R3.2 and
R3.3 are met.

The 3T is left in Arabic on the installed 2.0.1032 fleettest build,
automatic time on (never touched), `am kill`ed after HOME. Ruled
agent-ruled: her acceptance is the ar read, so the fleettest app's
language stays Arabic for her; her daily production package is separate
and untouched. The return flow needed two repairs mid-drive (an invalid
literal wait string, then an English-only location wait): both were flow
text defects, not app behaviour, and the completed run switched through
the language sheet exactly as step 1's shape prescribes.

Merge weather record (2026-10-18, the lane): uat moved twice under the
step-2 commit (lane 137's adjudication at 2.0.1029, then lane 135's step
1 taking 2.0.1031 while the first rebuild was in flight), so the fix
branch was rebuilt on each new uat under version.lock with the
uniqueness gate re-run each time before its commit and again before the
merge; the parked bare `uat.lock` (no holder file, no live merge,
verified in the main tree) was reaped and retaken for the merge, and
lane 135's live `commit.lock` was waited out, never reaped. The gradle
versionName sync refused one stale edit (the file had already moved to
2.0.1031 under lane 135's merge) and re-ran against the true value:
read, substitute, write.

session: ses_eb295b710ffeOaqvPwr7WsJ6KM
