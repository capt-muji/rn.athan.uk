# Ticket 136 - Android chevrons do not mirror under Arabic (settings sheet)

| Field | Value |
| --- | --- |
| Brief | Owner report 2026-10-18, in `ai/plans/README.md` row 136 |
| Planned at | `cd171855`, 2.0.1013, 2026-10-18 |
| Planned by | lane 136 |
| Needs first | nothing |
| Parent | none |
| Group | none (the chevron render sites; lane 135 owns widget files, lane 137 changes no code) |
| Batch budget | 3 (a device step dispatches alone) |
| Session budget | 5 |
| Steps count | 3 plus Finishing |
| Device | OnePlus 3T (`3T_SERIAL`), FleetTest mock builds, package `com.example.athan.fleettest` |
| Owner decisions still needed | none. Acceptance is her read of the delivered 3T build |

## 1. Goal

What is wrong today: with the app language Arabic on the OnePlus 3T, every
chevron in the Settings bottom sheet points RIGHT (the English direction); on
the iPhone XS the same switch points them LEFT every time. The owner read this
on the 3T at 2.0.908; no chevron or settings-sheet code changed since, so HEAD
is affected.

What is true when DONE: the chevron glyph Android draws is the codepoint
`chevronFor()` authored, LEFT under Arabic and RIGHT under English, on both
platforms, with English rendering byte-identical to today. The mechanism is
unit-pinned by a sweep suite that fails if any chevron render site loses its
paragraph pin.

How the owner notices: she opens Settings on the 3T FleetTest build with
Arabic active and reads every chevron pointing left.

Owner rules that apply (ai/AGENTS.md): visuals are settled, fixes change
behaviour only, no pixel moves; full unit coverage of every touched line,
red before green, mutation pass on guarded logic; `yarn validate` before
DONE; version bump on every commit, `app.json` first; builds locally on the
3T hardware class only, never two at once; never commit a screenshot or name
a serial.

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D136.1 | The mechanism, measured, not the row's hypothesis: `chevronFor()` consumes the APP LOCALE (`currentLocaleId()`, pure JS, no `I18nManager` anywhere in the path); the wrong chevron is Android's text stack mirroring the authored glyph. `U+2039`/`U+203A` are bidi class ON with Bidi_Mirrored=1 (python3 `unicodedata`, measured 2026-10-18). Fabric sets every view's `layoutDirection` from the Yoga-resolved direction (`SurfaceMountingManager.kt:811` at RN 0.88.0), so under the Arabic root (`app/_layout.tsx:90`) the `ReactTextView` resolves RTL and Android's TextView falls back to the first-strong-RTL text heuristic; a lone ON glyph has no strong character, resolves to an odd bidi level, and draws mirrored (points RIGHT). iOS sets no paragraph `baseDirection` (`RCTAttributedTextUtils.mm:221-226` builds the paragraph style from alignment only), so CoreText resolves natural first-strong, falls back LTR, never mirrors, and the authored glyph points LEFT. The row's I18nManager-bridge-snapshot theory does not apply to this surface: no control in this path branches on `I18nManager` | agent-ruled, measured | 2026-10-18 | PLAN.md 2.1 |
| D136.2 | The fix pins the chevron Text's own paragraph direction to `direction: 'ltr'` at every `chevronFor()` render site, keeping `chevronFor()`'s locale-keyed codepoint choice untouched. The authored codepoint then draws as authored on both platforms. Rejected: keying the pin to the locale (rtl under ar) re-arms the mirror and is wrong; embedding bidi isolate characters in the string (`\u2066\u2039\uu2069`) plants invisible control bytes in strings with no repo precedent and Android 9 ICU isolate handling unverified; authoring the mirrored codepoint under ar relies on the mirror and breaks iOS, which does not mirror. The pin is row 100's proven idiom (the ago badge's digit run fixed by the countdown row's own `direction: 'ltr'` pin) applied to a standalone glyph | agent-ruled | 2026-10-18 | PLAN.md 2.1, step 2 |
| D136.3 | Scope is every `chevronFor()` consumer: `Settings.tsx` (five rows through `styles.chevron`), `ColorPicker.tsx` (one row through `styles.chevron`, rendered inside the Settings sheet), `Help.tsx` (the action row chevron through a new `styles.actionChevron` joined to `styles.actionText`). The owner's report names the Settings sheet; Help's chevron is the same defect in the same mechanism one surface away and costs one entry. Help's step-mark guillemets (`\u00AB`/`\u00BB`, `Help.tsx:86`, the same mirrored class) stay untouched: unreported, a different glyph, named as a residual in the DONE cell. Argued twice: for including Help, the ticket's subject is the chevron mechanism and a next-week report is otherwise certain; against, the reported surface is the Settings sheet and minimal diffs audit cleaner. The recommendation survives | agent-ruled | 2026-10-18 | PLAN.md 2.1, row 136 DONE cell |
| D136.4 | One sweep suite `components/__tests__/chevronDirection.test.tsx` on the `typographySweep` idiom pins the contract: under en and ar, every chevron glyph Text on the rendered Settings sheet (What's New row forced visible) and the opened Android Help action row carries `direction: 'ltr'` in its flattened style, with exact chevron counts (6 and 1). The `__tests__/README.md` ban on style assertions carries the named exception: a rule the app must keep, stated in a comment beside the assertion. Red today: no pin exists anywhere | agent-ruled | 2026-10-18 | PLAN.md step 2 |
| D136.5 | Device proof: reproduce first on the existing 2.0.996 FleetTest APK (no build); prove the fix on a fresh FleetTest mock build of the merged uat, hand-built per the row-134 recipe (the suffix exported inside its own prebuild and build, `build-mock.zsh` hard-unsets it and cannot produce a FleetTest id). Reads are screenshots read by the reader itself: the chevron's direction is a drawn glyph, and the accessibility tree carries the authored codepoint, never the mirror, so no dump can see this defect. En-LTR identity is proven by mechanism (the pin is inert when the resolved direction is already ltr) plus the before/after en reads transcribed identical | agent-ruled | 2026-10-18 | PLAN.md steps 1 and 3 |
| D136.6 | The AVD is not a witness: the planning mechanism probe used `athan-smoke-28` as a disposable check, and no acceptance criterion cites it. All device criteria name the 3T | agent-ruled | 2026-10-18 | PLAN.md 5 |
| D136.7 | `yarn test:tz` not run: the change touches no date or time path | agent-ruled | 2026-10-18 | PLAN.md 2.1 |

D136.2 argued twice: for - the pin removes exactly the native mirror while the
JS keeps choosing the glyph by app locale, which is the rows 80/103 signal
discipline; against - a string-level isolate would heal every consumer
including any future one without a render-site edit. The isolate was rejected
on control bytes and Android 9 risk, and the sweep suite (D136.4) closes the
future-consumer gap by failing when a chevron site lacks the pin. The
recommendation survives.

### 2.2 The executor must not decide

- Any deviation from the named contracts, test names, file list or commands:
  STOP.
- If the red tests pass before the change, or any unnamed test fails: STOP.
- If the break script's substitutions do not match the code: STOP.
- If the 3T read under ar shows chevrons pointing LEFT after the fix, or
  RIGHT before it, on either build: STOP and transcribe what was read.
- If `aapt2 dump badging` on any APK about to be installed to the 3T prints
  anything but `package: name='com.example.athan.fleettest'` with the planned
  versionName: STOP, install nothing.
- Anything about the phones beyond the named commands: STOP.

## 3. Pre-flight

`scripts/preflight-136.sh` (committed in this folder). The executor saves a
copy to `$TMPDIR` and runs it with the lane worktree
(`$HOME/athan-gitree/worktrees/lane-136`) as cwd before creating any step
branch. It checks the worktree is the lane's, the branch is `lane/136` or the
step's `fix/*`, the tree clean, nothing on `origin/uat` missing from the
branch, the version not lower than Planned at, the ticket row present, and
every anchor counting exactly 1. "Rerun after checkout" means the anchor
counts only, same cwd, on the step branch. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map (anchors under `scripts/anchors/`, verified at `cd171855`):

- `shared/i18n/locale.ts` - `directionGlyph` and `chevronFor`: the glyph pair
  `\u203A`/`\u2039` keyed to `localeDirection(currentLocaleId())`. The pure
  app-locale read. Anchor `locale-chevronfor.txt`.
- `app/_layout.tsx` - the root sets `direction` from the app locale (row 80).
  This is the RTL layout the Android TextView resolves against. Anchor
  `layout-direction-root.txt`.
- `components/sheets/screens/Settings.tsx` - five chevron rows render
  `<Text style={styles.chevron}>{chevronFor()}</Text>`; the style block carries
  color, fontSize, fontWeight, lineHeight and no direction. Anchors
  `settings-chevron-render.txt`, `settings-chevron-style.txt`.
- `components/sheets/screens/ColorPicker.tsx` - one chevron row, same shape,
  inside the Settings sheet's countdown-bar card. Anchors
  `colorpicker-chevron-render.txt`, `colorpicker-chevron-style.txt`.
- `components/modals/Help.tsx` - the action row renders the label and the
  chevron in two Texts sharing `styles.actionText`; the chevron needs its own
  entry. The file already carries an unrelated `styles.chevron` (the U+2304
  topic-row arrowhead), so the new entry is named `actionChevron`. Anchor
  `help-action-chevron.txt`.
- `components/countdown/Countdown.tsx` - `timerRow` carries the repo's
  precedent `direction: 'ltr'` pin (row 100's ago-badge fix). Anchor
  `countdown-timerrow-pin.txt`.
- `components/__tests__/typographySweep.test.tsx` - the sweep idiom:
  `isolateModulesAsync`, locale set before the component is required, style
  read with `StyleSheet.flatten`. Anchor `typography-sweep-idiom.txt`.
- `components/modals/__tests__/Help.test.tsx` - the Android-platform action
  idiom: `onPlatform('android')`, open the Do Not Disturb question. Anchor
  `help-android-action.txt`.
- `components/sheets/screens/__tests__/Settings.test.tsx` - the What's New
  visibility mock. Anchor `settings-whatsnew-mock.txt`.

How the pieces interact: the root lays the tree out under the app locale's
direction; every Text node under it resolves its paragraph against that
direction on Android; the chevron is a lone neutral glyph whose codepoint
already encodes the intended direction; the mirror inverts it under RTL.
Pinning the chevron Text's own direction to ltr severs exactly that coupling.

Existing tests and what each proves: `shared/__tests__/locale.test.ts:126`
pins `chevronFor()` returning `\u203A` under en and `\u2039` under ar (the JS
half of the contract, already green, untouched). `Settings.test.tsx` covers
the sheet's rows; `Help.test.tsx` covers the modal; none reads a direction.

Why the obvious fix is wrong: changing the glyph pair to unmirrored codepoints
(`\u276F` class) moves pixels under every locale, against the settled-visuals
rule; keying direction to the locale re-arms the Android mirror; a transform
(`scaleX: -1`) flips the glyph box, not the paragraph, and RN 0.88 applies
transforms physically (row 73's ground), so it breaks on one platform or the
other.

Planning probe, measured 2026-10-18 (disposable, AVD `athan-smoke-28`, never
a witness): the unpatched 2.0.996 FleetTest APK under ar drew every Settings
chevron pointing RIGHT; the probe branch `probe/136-pin` (the three pin
edits, committed in a scratch worktree, hook-green) under ar drew every
chevron pointing LEFT; under en both builds drew RIGHT with the sheet layout
identical. The mechanism, the fix and the en no-op are all observed facts,
recorded in `LOG.md`.

## 5. Design

Invariant, one sentence a test can check: every `chevronFor()` render site's
Text carries `direction: 'ltr'`, so the authored codepoint draws unmirrored
under every locale.

Alternatives rejected: D136.2 (locale-keyed pin, isolate strings, mirrored
codepoint, transform flip) and D136.3 (leaving Help out).

Concurrency trace: none. The chevron string is computed at render on the JS
thread from a synchronous MMKV-backed read; a language switch relaunches the
JS context before the sheet re-renders, and the pin is static data with no
ordering.

Design review: the pin is inert under every LTR locale (the resolved
direction is already ltr), so English bytes cannot move; under ar it changes
one thing, the chevron paragraph's base direction, which nothing else reads
(the chevron Text is a standalone leaf whose position comes from its parent's
flex row).

Acceptance criteria:

- [R1.1] WHEN the app renders a chevron glyph under an LTR locale THE SYSTEM SHALL draw it from a Text whose flattened style carries `direction: 'ltr'`.
- [R1.2] WHEN the app renders a chevron glyph under ar THE SYSTEM SHALL author the left-pointing codepoint and draw it unmirrored.
- [R2.1] WHEN any one of the three chevron style pins changes to a non-ltr value THE SYSTEM SHALL fail `chevronDirection.test.tsx`.
- [R3.1] WHEN the 2.0.996 FleetTest build runs on the 3T with the app language ar THE SYSTEM SHALL draw every Settings sheet chevron pointing right.
- [R3.2] WHEN the fixed FleetTest build runs on the 3T with the app language ar THE SYSTEM SHALL draw every visible Settings sheet chevron pointing left.
- [R3.3] WHEN the fixed FleetTest build runs on the 3T with the app language en THE SYSTEM SHALL draw every visible Settings sheet chevron pointing right with the sheet layout identical to the 2.0.996 en rendering.

## 6. Steps

Checklist:

- [ ] Step 1: reproduce on the 3T, before-evidence both directions
- [ ] Step 2: the paragraph pin, sweep suite red-first with mutation pass
- [ ] Step 3: the fixed FleetTest build, 3T proof both directions, build left
  for her read

Steps live in `steps/1-reproduce.md`, `steps/2-chevron-pin.md`,
`steps/3-device-proof.md`. After step 3 merges, the executor's Finishing
(athan-executor agent file) applies section 8's records text and makes the
executed docs commit; no separate records step exists.

## 7. Device proof

Step 1 reproduces on the existing
`$HOME/athan-gitree/builds/fleettest-65981367/athan-fleettest-2.0.996.apk`
(badging already read by planning: `package: name='com.example.athan.fleettest'
versionCode='1000000' versionName='2.0.996'`; step 1 re-reads it before
installing). Step 3 builds the fixed FleetTest mock in the main tree under
`build.lock` and installs it on the 3T. Every read is a screenshot saved
under `$HOME/athan-gitree/sessions/136/`, read by the reader itself,
transcribed into `LOG.md`, never committed. The atlas is read before any tap;
`e2e/flows/language-switch-x1.yaml` carries the drive shape and the 3T
settings-button coordinate. No clock changes and no `dumpsys alarm` reads:
nothing here arms, fires or moves time. The phone ends with the fixed build
installed and automatic time on.

## 8. Records

LOG.md findings text, appended by each step under its heading, is given in
each step file's "LOG.md" block.

Queue cell text the lead applies on DONE (status column only changes; the
brief keeps the report):

```
DONE 2026-10-18, audited: the chevron paragraph is pinned ltr at every
chevronFor() render site (the settings sheet's rows, the colour-picker row
inside it, the Help action row), so Android draws the authored glyph under
ar: the signal was never stale (chevronFor reads the app locale, the root
follows it since row 80) - Android resolves a lone neutral glyph against the
RTL layout direction and bidi-mirrors U+2039 (Bidi_Mirrored=1) while iOS's
natural resolution does not, the whole platform split; en and every LTR
locale byte-identical (the pin is inert under ltr), proven on the 3T both
directions (left under ar, right under en, layout unchanged); the sweep suite
kills a stripped pin at each of the three sites; Help's step-mark guillemets
stay untouched (same mirrored class, unreported); her read on the 3T is the
acceptance - the fleettest build at <version> is installed for it
```

Docs commit messages: step commits per their step files; the executed commit
`<VERSION> - docs(plans): ticket 136 executed: <one line>`; the DONE merge
`<VERSION> - docs(plans): ticket 136 done, plan folder and evidence dead`.

## 9. Push

None. The executor worker and the lane never push. The orchestrator pushes
`uat` when every unpushed commit is audited.

## 10. When something goes wrong

| Symptom | Meaning | Action |
| --- | --- | --- |
| The 3T under ar reads chevrons LEFT on the 2.0.996 build | the defect is absent on the mock | STOP, transcribe the read, replan: the mechanism claim is wrong for this build |
| The fixed build still reads RIGHT under ar on the 3T | the pin does not reach the draw path at the 3T's Android 9 stack | STOP, record, NEEDS REPLAN to the isolate-string fallback: `chevronFor()` returns `\u2066` + glyph + `\u2069` under ar only, en bytes untouched, suite pins the isolate bytes |
| `getAllByText` finds zero chevrons under ar in the sweep | the query shape misses nested children | switch to the `screen.root.queryAll` children predicate from `Help.test.tsx:208`, keeping the same assertions |
| Jest finds 5 chevrons where 6 are expected in the Settings render | the What's New mock is inert inside the fresh registry | move the `mockVisibleWhatsNew` assignment inside the `isolateModulesAsync` callback before `render` |
| `aapt2 dump badging` prints `com.example.athan` (no suffix) on the step-3 build | the suffix never reached the prebuild (it must be exported in the environment of BOTH prebuild and gradle, never passed as an argument) | rebuild with the suffix exported; install nothing |
| The fleettest build fails `INSTALL_FAILED_VERSION_DOWNGRADE` | versionCode below the installed 1000000 | STOP, record the badging output; the prebuild's versionCode write is broken, a replan item |
| A merge conflict on `ai/plans/README.md` or the three version files | lane weather | abort, rebase the lane branch onto `uat`, keep both lanes' rows and the higher version, retry once, STOP if it still conflicts |
| The emulator or phone video pipeline wedges | known 3T failure class | reboot the device only with the owner named in LOG; the reads here are single screenshots, never recordings |

Anticipated review fixes, word for word: none expected beyond records wording;
if a reviewer finds the comment lines on the three pins diverging in wording,
unify them to the step-2 text verbatim.

## 11. Subagents

Planning: `explore` for fact questions, `athan-plan-griller` for the grill,
`vision` where an image cannot be read by the reader. Delivery: the lead
dispatches `athan-executor` for steps 1 to 3 in the lane worktree
`$HOME/athan-gitree/worktrees/lane-136` under the lane's lock family, and
`athan-reviewer` twice (plan-conformance and blind) over the lane's commit
range. Every worker reads images itself or calls `vision`. Nothing else, ever.

## 12. Report to the owner

What changed: the chevron paragraph pin at three files, one sweep suite. What
was proven: the mechanism on both platforms from the pinned RN sources and
Unicode data, the defect and the fix on glass under both languages, English
bytes identical. Decisions waiting on her: none; her read of the delivered
build is the acceptance. Progress table and the four-line handoff close the
run's reply.
