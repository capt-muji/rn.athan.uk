# Plan 137: Arabic line height parity, Android against iOS, same TTF

| Field | Value |
| --- | --- |
| Brief | Queue row 137, OWNER QUESTION 2026-10-18, investigation only |
| Planned at | `uat` cd171855, 2.0.1013, 2026-10-18 |
| Planned by | Lane 137 lead, agent-ruled throughout (owner hands-off) |
| Needs first | nothing |
| Parent | nothing |
| Group | none: no app code file changes; shares only the queue row and the version files, which serialize under their locks |
| Batch budget | 3 |
| Session budget | 6 |
| Steps count | 4 (docs 1, device 3, device 3, docs 1) |
| Device | OnePlus 3T (`3T_SERIAL`, Android 9) and iPhone XS (`IPHONE_UDID`, iOS 18.7.10) |
| Owner decisions still needed | Her ruling on the verdict's options, after the row lands OWNER-LED |

## 1. Goal

The owner feels the Arabic line height taller on the 3T than on the iPhone although both
platforms bundle the same Rubik TTF bytes. The question, her words: is the effective Arabic
line box the same on both platforms, and is it as it should be.

True when the row carries a measured yes or no with numbers: each platform's effective line
box in em for named surfaces, which font metric set that box matches, and a verdict on
whether the difference is platform behaviour or a repo defect. She then rules on the options.

Her rules that govern, quoted with source:

- "NO NEGATIVE PULLING and no spacing fixes of any kind: measurement and verdict only (her
  explicit word)" (queue row 137).
- "blockLineHeight and its five consumers died and the font's own box serves everywhere"
  (row 87, DONE 2026-10-15).
- "Visuals are settled. Fixes change behaviour only. Touch no pixel without the owner's
  say." (`ai/AGENTS.md`).
- The deliverable lands OWNER-LED, never DONE: "a finished investigation whose deliverable
  is a recommendation she must rule on lands HERE" (`ai/plans/README.md`, the OWNER-LED
  status).

## 2. Decisions

### 2.1 Taken, agent-ruled 2026-10-18, recorded here

- **D137.1 Measurement surfaces.** The unpinned box is measured on the settings sheet:
  title, fontSize 22 `Rubik-Medium`; subtitle, fontSize 14 `Rubik-Regular`; card title,
  fontSize 14 `Rubik-Medium`. No style of the three sets a lineHeight, so the rendered box
  is the platform's own. Controls, where a lineHeight is pinned: the Help question, 15 at a
  pinned 23 (`ty.scriptLineHeight(15)` is `Math.round(22.5)`, and JavaScript rounds half
  up), and the Help answer, 13 at a pinned 20. For: these sit on one static screen
  each, reachable without an animated screen, on both phones. Against: multi-line wrapped
  unpinned text would give line pitch directly, and none exists in the app, because every
  wrapping surface carries a pin (verified by sweep: lineHeight appears in nine non-test
  files under `components/`, every one of them a pin). Answer: single-line box heights are the measurement; the controls prove the
  instrument. Challenge: a single-line height also carries each platform's outer line
  padding, so it measures the box the owner experiences rather than a pure pitch; that is
  the quantity her question names, the effective line box. Survives the challenge.
- **D137.2 Readout instruments.** On the 3T, `uiautomator dump` node bounds, text stale on
  Android 9 (`e2e/AGENTS.md`) while bounds are the record, each corroborated by the
  screenshot read, identified by position in the sheet, plus
  one screenshot per screen read by the image-capable reader. On the XS, agent-device
  snapshot frames on the static sheet; when a snapshot wedges, a `pymobiledevice3
  developer dvt screenshot` read from pixels instead. For: bounds and frames are the
  layout engine's own numbers, not ink estimates. Against: pixels alone would need ink
  heuristics. Answer: engine numbers first, pixels as corroboration and fallback.
- **D137.3 The 3T vehicle.** The FleetTest mock build as found, per the row. Verify
  `dumpsys package com.example.athan` prints a versionName at or past 2.0.811, the Rubik
  era. When the installed build is absent or its version predates 2.0.811, build fresh
  with `$HOME/athan-gitree/bin/build-mock.zsh` under `$HOME/athan-gitree/build.lock`,
  gate the apk with `aapt2 dump badging <apk> | grep "^package"` and stop on any id other
  than `name='com.example.athan'` (BUILD.md: the mock keeps the production id), then
  install under the device lock. When the package id on the phone is not
  `com.example.athan`, STOP per section 2.2. For: the named build is what she compared.
  Against: a fresh build would carry today's uat. Answer: as found, version recorded
  either way.
- **D137.4 XS contact discipline.** Read-only: launch, navigate by the atlas routes, read,
  terminate. Her athan storage is never opened. When the app's language is not ar, one
  in-app round trip through the settings language row, ar, measure, back to the found
  language, face verified. For: the ticket requires Arabic measured on her phone, and
  "restore as found" contemplates reversible contact. Against: any write to her app state
  is contact beyond reading. Challenge taken: the language preference is app state, not
  athan data, the convergence pass re-pushes what the app itself owns, and the round trip
  restores byte-identical language; the alternative delivers half an answer. Survives.
  The system language route (atlas row, iOS Settings) is never used.
- **D137.5 XS era check.** Resolve the installed app version before measuring. Below
  2.0.811 means the XS does not carry Rubik; then the XS leg records the gap, stops, and
  the verdict carries the 3T numbers with the XS hole named. No install is ever made on
  her phone.
- **D137.6 Expectation candidates.** From the shipped TTFs at planning (script
  `scripts/tables-137.py`, run against `assets/fonts/Rubik-Regular.ttf` and
  `assets/fonts/Rubik-Medium.ttf`, upm 1000): hhea 935/-250 lineGap 0 = 1.185em, typo
  identical 1.185em, usWin 1066/466 = 1.532em, head bbox 1.554em Regular and 1.581em
  Medium. Rubik sets OS/2 fsSelection bit 7, USE_TYPO_METRICS. A measured box matches a
  candidate when the heights agree within 1 layout pixel after scale rounding. The verdict
  names the matched set per platform; a tie between usWin and bbox at one size resolves at
  the 22pt Medium surface where they differ by 2.8px.
- **D137.7 Verdict and options, no fixes.** The row's close carries: the yes or no, both
  platforms' em numbers with the matched sets, and options for her ruling: accept the
  platform boxes, or a separate code ticket pinning an ar lineHeight per surface family.
  Negative pulling appears in no option. No code changes ship from this ticket.
- **D137.8 Records.** FINDINGS.md folds into the queue row at close and the plan folder
  dies in the closing docs commit, the row 65 and 66 precedent (D82, D85). Evidence lives
  under `$HOME/athan-gitree/sessions/137/` as transcriptions and dumps, never screenshots.
- **D137.9 Audit shape.** Two reviewer passes, plan-conformance and blind, each re-deriving
  every number computationally: TTF tables by rerunning the script, candidate heights by
  arithmetic, em ratios from the recorded raw readings. `bash scripts/check-audit.sh` on
  the plan folder prints AUDIT OK before the close. The close applies R5.1's verdict cell
  text to the row and sets OWNER-LED; that write is the lead's, never the executor's.
- **D137.10 Dispatch.** The lead dispatches one `athan-executor` per batch; a device step
  dispatches alone. Steps 1 and 4 are docs weight, steps 2 and 3 device weight 3.

### 2.2 The executor must not decide

- A measurement that contradicts a locked law, the qibla lock named first: STOP, the lead
  reports it in the row, nothing is fixed.
- A phone that refuses a read, wedges, or cannot reach a surface: record the void shape
  and its corroboration (the row 120 form), continue with what stands, and name the hole
  in the step's LOG entry. Never improvise a new surface without the plan naming it.
- An installed 3T build that is neither the fleettest mock nor a Rubik-era build: STOP the
  3T leg, report the found versionName and package id.

## 3. Pre-flight

`scripts/preflight-137.sh`, saved by the executor to `$TMPDIR` and run from there. It
checks: the checkout is the lane worktree on `lane/137` off `uat`, a clean tree, the
version at or past 2.0.1013, every anchor counts exactly 1, `node_modules` present,
`python3 -c "import fontTools"` succeeds, an adb device answers `get-state`, and a
devicectl phone is connected. It ends `PREFLIGHT OK`. A device absent at pre-flight warns
and fails nothing: only the device step that needs that phone stops on it, never the docs
steps. The executor resolves `3T_SERIAL` and `IPHONE_UDID` from `adb devices` and
`xcrun devicectl list devices` at runtime; the placeholders never enter a file.

## 4. Background the executor needs

Code map, one line a file, anchors under `scripts/anchors/`:

- `shared/typography.ts`: the ARABIC record. Rubik-Regular and Rubik-Medium faces, size
  factor 1, `scriptLineHeight: (n) => Math.round(n * 1.5)`. Anchor
  `typography-arabic.txt`.
- `components/sheets/parts/Header.tsx`: sheet title 22 Medium and subtitle 14 Regular,
  no lineHeight on either; the comment names Rubik's own line box. Anchor
  `header-styles.txt`.
- `components/sheets/screens/Settings.tsx`: `cardTitle` 14 Medium, no lineHeight; the
  settings sheet carries title, subtitle, card titles, row labels. Anchor
  `settings-cardtitle.txt`.
- `components/modals/Help.tsx`: question 15 Medium with lineHeight
  `ty.scriptLineHeight(15)` = 23 (`Math.round(22.5)` rounds up), answer `ty.size(13)`
  with lineHeight 20. Both pinned:
  controls, not test surfaces. Anchor `help-question.txt`.
- `components/sheets/parts/VolumeNote.tsx`: the note at 14 with lineHeight
  `ty.scriptLineHeight(14)` = 21, row 108's measured script box. Context for the options
  text; not measured (reaching the sound sheet costs a second sheet navigation the
  controls already cover). Anchor `volumenote-style.txt`.
- `app.json`: the fonts block loads `Rubik-Regular.ttf` and `Rubik-Medium.ttf`. Anchor
  `appjson-fonts.txt`.

Pinned dependency sources, read at planning from `node_modules/react-native@0.88.0`,
re-verified by grep at step 1; node_modules is not git-tracked, so these are citations,
not anchors:

- `ReactAndroid/src/main/java/com/facebook/react/views/text/TextLayoutManager.kt`: a
  `CustomLineHeightSpan` is applied only when the text attributes carry a lineHeight,
  lines 381 and 617; measurement builds a `StaticLayout` with
  `.setIncludePad(includeFontPadding)`, line 856 to 859, or a `BoringLayout` with the same
  flag, lines 809 to 817.
- `ReactAndroid/src/main/java/com/facebook/react/views/text/ReactTextView.java` line 136:
  `setIncludeFontPadding(true)` is the platform default.
- `ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager/RCTTextLayoutManager.mm`
  lines 530 to 566: iOS measures through NSLayoutManager line fragments; lines 585 to
  588 round the result to the pixel grid.

What those citations mean for this ticket: with no lineHeight prop, Android renders the
text through StaticLayout or BoringLayout with font padding included, and the platform
text stack, not this repo, decides which font metric set fills the box. iOS renders
TextKit line fragments. Which table each platform's stack reads out of the TTF (hhea
against usWin against the head bbox) is platform behaviour this repo cannot read from
node_modules; the on-device measurement arbitrates, and the expectation table carries all
candidate sets. Any sentence in the findings that names a platform's internal table
choice beyond what the measurement shows is marked unverified.

Why the obvious fix is wrong here: there is no defect to fix. Row 87 ruled the font's own
box serves everywhere, and that ruling is what lets the platforms differ on a font whose
two metric sets diverge. Rubik diverges hard, 1.185em against 1.532em; Roboto's hhea and
usWin sit within 0.03em of each other, 1.172em against 1.200em, its typo 1.050em and bbox
1.327em sit farther out, and it sets no USE_TYPO_METRICS bit where Rubik sets one, which
is why English never showed this. That asymmetry, not a bug, is the leading explanation
the numbers must confirm or refute.

Existing tests: `shared/__tests__/typography.test.ts` pins the ARABIC record's faces and
factors; `components/__tests__/typographySweep.test.tsx` pins the surfaces' fontFamily
and fontSize under ar. Neither covers rendered line boxes, which live in the native
layout engine; that gap is why this ticket measures on devices.

## 5. Design

The approach: read the same three unpinned surfaces and two pinned controls on both
phones as rendered layout numbers, convert each height to em by dividing by the nominal
size times the device scale, and match against the candidate table. The invariant, one
sentence a check can test: for every measured surface, the em ratio on a platform equals
one candidate set's em within the rounding tolerance, and the pinned controls equal their
pin ratio on both platforms.

Alternatives rejected: measuring only pixels of ink, because ink bounds understate the
box and Arabic ink varies per string; reading RN's onTextLayout, because it needs code
changes this ticket forbids; the emulator as a witness, because the harness rules name
physical devices for measurement claims; measuring the WhatsNew or Update modals, because
their copy changes per release while the settings sheet is stable.

Concurrency: none. The work reads phones serially under each device lock and writes
nothing shared except the plan folder on the lane branch.

**Acceptance criteria:**

- [R1.1] WHEN the executor runs the plan's `scripts/tables-137.py` in the worktree THE SYSTEM SHALL print, for both Rubik TTFs, the hhea, typo, usWin and head-bbox sets in em, and the candidate single-line heights in layout pixels at sizes 13, 14, 15 and 22 for scales 2.625 and 3.
- [R2.1] WHEN the 3T settings sheet is open under ar THE SYSTEM SHALL record, into
  `$HOME/athan-gitree/sessions/137/`, the node bounds of the title, the subtitle and one
  card title, plus the installed build's package id and versionName.
- [R2.2] WHEN the 3T Help modal shows an open question under ar THE SYSTEM SHALL record
  the question node's bounds and the open answer's bounds as the pinned controls.
- [R3.1] WHEN the XS settings sheet is read under ar THE SYSTEM SHALL record the same
  surfaces' frames as on the 3T, with the installed app version, leaving the app's state
  as found.
- [R3.2] WHEN the XS app's language is not ar on arrival THE SYSTEM SHALL perform one
  in-app round trip to ar and back and record both states' faces in the LOG.
- [R4.1] WHEN both platforms' readings exist THE SYSTEM SHALL record each surface's
  measured em and the matched candidate set per platform, each within the stated
  tolerance, and flag any surface that matches none.
- [R5.1] WHEN the numbers close THE SYSTEM SHALL produce the OWNER-LED verdict cell text,
  the yes or no with both platforms' em numbers and the options, carried in FINDINGS.md
  and applied to queue row 137 by the lead at the audit close, with no app code changed
  on the branch.

## 6. Steps

Checklist:

- [ ] Step 1: expectation table from the shipped TTFs, plus source citation re-checks
- [ ] Step 2: 3T measurement, unpinned surfaces and pinned controls
- [ ] Step 3: XS measurement, read-only contact, restore as found
- [ ] Step 4: verdict, FINDINGS.md, queue row to EXECUTED

Each step's file carries its own contract: `steps/1-tables.md`, `steps/2-oneplus3t.md`,
`steps/3-iphone-xs.md`, `steps/4-verdict.md`.

## 7. Device proof

The 3T, serial `3T_SERIAL`, under `$HOME/athan-gitree/device-3T_SERIAL.lock` for the
whole contact:

```sh
adb -s 3T_SERIAL get-state                          # device
adb -s 3T_SERIAL shell dumpsys package com.example.athan | grep -E "versionName|userId" | head -3   # versionName=2.0.811-or-newer plus a userId line
adb -s 3T_SERIAL shell input keyevent KEYCODE_WAKEUP
adb -s 3T_SERIAL shell wm size                      # Physical size: 1080x1920
adb -s 3T_SERIAL shell settings get global auto_time   # 1; never changed by this ticket
```

Route, replaying `e2e/device-atlas-oneplus3t.md`: home, the Athan dock icon at (540,
1747), the settings button at (540, 1830), then rows inside the sheet. The atlases carry
no in-sheet row coordinates, and under ar every label is Arabic, so the route names the
labels and the method: the language row reads `اللغة` (`settings.language`), the Help row
reads `المساعدة` (`settings.help`) inside the card titled `أخرى` (`settings.other`), the
language sheet's Arabic option reads `العربية` (`shared/languageNames.ts`), and the
settings button's accessibility label reads `الإعدادات` (`settingsButton.label`). The
What's New row hides on a silent release, so the Help row is found by its label, never by
a fixed list position. On the 3T, where dump text is stale, a row is located by one
screenshot read before the tap; on the XS, rows are found by label-matched refs from the
snapshot. Reads:

```sh
adb -s 3T_SERIAL shell uiautomator dump /sdcard/137-dump.xml    # a line naming the dump path prints; the pulled file existing is the check
adb -s 3T_SERIAL pull /sdcard/137-dump.xml $HOME/athan-gitree/sessions/137/
adb -s 3T_SERIAL exec-out screencap -p > $HOME/athan-gitree/sessions/137/3t-sheet.png
```

The dump's bounds are the record; the screenshot is corroboration read by the
image-capable reader and transcribed, never committed. Every expected value: title node
height near one candidate from step 1's table, each within 1 layout pixel after
scale rounding. No clock change is made, so no alarm dump is required; when a fresh mock
build is ever needed, `dumpsys alarm` is read first under the same lock and
`build-mock.zsh` runs under `$HOME/athan-gitree/build.lock` alone, with the
`aapt2 dump badging <apk> | grep "^package"` gate before any install, stopping on any id
that is not the fleettest id.

The XS, `IPHONE_UDID`, under `$HOME/athan-gitree/device-IPHONE_UDID.lock` for the whole
contact:

```sh
xcrun devicectl list devices | grep IPHONE_UDID
xcrun devicectl device info apps --device IPHONE_UDID | grep -i athan   # the installed version
```

Launch and drive by the atlas routes (`e2e/device-atlas-iphone-xs.md`): the app icon,
the settings button, rows by label. Reads: agent-device snapshot frames on the static
sheet; fallback `pymobiledevice3 developer dvt screenshot --udid IPHONE_UDID` into
`sessions/137/`, read and transcribed. Leave by terminating the app through devicectl,
the atlas's documented route. Automatic lock stays untouched; the XS never auto-locks
while tethered per the atlas traps row.

Void protocol, the row 120 form: when a read yields nothing, the step records what was
attempted, what the phone answered, one corroborating line (a logcat line, a dump, a
screenshot transcription), and what measurement the hole removes. The verdict then names
its evidence and its gap; it never fills a hole with a hypothesis.

## 8. Records

LOG.md headings: `## Planning (2026-10-18)`, `## Ticket 137`, then `### Step 01 — tables`,
`### Step 02 — oneplus3t`, `### Step 03 — iphone-xs`, `### Step 04 — verdict`, each
ending `session: <ses_id>`.

The queue cell text the close applies, placeholders filled from the measurements:

> OWNER-LED 2026-10-18, investigation closed: [YES/NO], the effective Arabic line box
> [differs/matches] between the 3T and the XS on the same Rubik bytes. Measured on the
> settings sheet under ar: 3T title [n]px = [x.xxx]em matching [set], subtitle [n]px =
> [x.xxx]em matching [set]; XS title [n]px = [x.xxx]em matching [set], subtitle [n]px =
> [x.xxx]em matching [set]; controls at their pins on both. The taller Android box is
> [platform behaviour from the TTF's taller metric set / a repo defect: finding]. No code
> changed. OPTIONS for her ruling: (1) accept each platform's own box, the row 87 law
> unchanged; (2) a separate code ticket pinning an ar lineHeight per surface family, her
> dial, no negative pulling. She rules.

Docs commit message: `<VERSION> - docs(plans): ticket 137 executed, the line-box
measurements and verdict`.

## 9. Push

None. The executor never pushes. The lead merges and the orchestrator pushes after audit.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| iOS snapshot wedges on the sheet | Fall back to `pymobiledevice3 developer dvt screenshot`, read pixels, record the wedge in the LOG |
| `uiautomator dump` returns an empty or stale tree | Take a fresh dump after the sheet settles; then read bounds via `maestro hierarchy` on the 3T; then pixels |
| The settings sheet closes on a stray tap | Replay the atlas route from home; the sheet has no state to lose |
| The 3T build is absent or predates 2.0.811 | Build fresh per D137.3 under `build.lock`, gate with aapt2, install under the device lock |
| The 3T package id is not `com.example.athan` | STOP the 3T leg per section 2.2, report versionName and package id |
| The XS app predates 2.0.811 | Record the version, stop the XS leg, the verdict carries the gap; no install |
| The language round trip wedges mid-switch | Wait out the in-process relaunch, verify the face, retry once, then record the void and measure what stands |
| A measurement matches no candidate within tolerance | Record the raw number and every candidate's px; the lead adjudicates before the verdict step runs |

Anticipated review fixes, word for word: "The findings name a platform's internal table
choice as fact; mark it as measured-match language, the matched set, not the stack's
internals." And: "The row text names a surface not in the plan; strike it or name the
decision that added it."

Restore lists: step 2 leaves the 3T on the found build, found language, screen on the
home screen; step 3 leaves the XS app terminated, language as found, no system setting
touched.

## 11. Subagents

Planning: `explore` for fact questions when a fact is missing; `athan-plan-griller` on
this folder; `vision` only for an image the reader cannot see. Delivery: the lead
dispatches `athan-executor` for steps 1 to 4 in batches of at most the batch budget, a
device step always alone, and two `athan-reviewer` passes at audit, plan-conformance and
blind, per D137.9. Nothing else, ever.

## 12. Report to the owner

Plain sentences: what was measured on each phone, the em numbers, the matched sets, the
yes or no, and the options waiting for her ruling. Then the progress table and the
four-line handoff. No screenshot reaches her; numbers and words only.
