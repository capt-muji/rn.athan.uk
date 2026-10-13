# Ticket 77: Help modal entrance, the white box around Close

| Field | Value |
| --- | --- |
| Brief | Queue row 77, ai/plans/README.md: owner report 2026-10-13, opening Help shows a solid white container behind and around the close button while the modal opens, gone once the card settles; her recording at `$HOME/Downloads/Screen_Recording_20261013_040636_Athan.mp4` |
| Planned at | uat `ad6a1c89`, version 2.0.203, 2026-10-13 (anchors extracted at `cfb9b837`, held counting 1 at `eb4582b1` by diff and re-verified counting 1 on uat `ad6a1c89`; `git diff cfb9b837..eb4582b1` touched only plan docs and the two version files) |
| Planned by | Planning session, owner away; her recorded rulings are the brief |
| Needs first | nothing |
| Parent | none |
| Group | modal entrance animations, rows 60 and 62 ground; `components/modals/Help.tsx` overlaps row 74's typography pass (its question styles), row 74 is NOT PLANNED so no serialization applies |
| Batch budget | 2 |
| Session budget | 2 |
| Steps count | 1 |
| Device | iOS simulator (frame capture through agent-device record); no 3T work; the defect baseline is her Android recording, read in planning, never committed |
| Owner decisions still needed | none at plan time; the green-capture branch rules sit in section 2.2 |

## 1. Goal

Opening the Help modal flashes a solid white, square-cornered box behind the Close button
while the rest of the card fades in around it. She reported it on 2026-10-13 and refined
the reading herself: the close button's own container paints opaque white before the
card's fade completes, so the rest fading in makes the box look like it fades out. Her
recording proves it. The file is 2.42 seconds at 120 fps, 1080x2340, an Android phone
(the brief said 22 seconds; the file is not). Frame measurements planning took from it:

- t=0.708 (frame h_019): the card is a ghost, the schedule shows through it, the strip
  behind Close is already near-solid white.
- t=0.833 (frame h_034): card surface at alpha 0.78, strip at alpha 0.96 (sampled
  against the settled card white and the settled backdrop; method in section 4).
- t=0.9 and on (h_100): both at 1.0, the box gone.

When DONE: the Close row enters on the same fade as the card, its alpha tracks the
card's at every frame of the entrance, and no box shape shows around the button at any
point of the open. She notices the modal simply fading up as one piece.

Owner's rules that apply (ai/AGENTS.md):

- "Animated components first-frame in their settled state. Only value changes animate."
  (line 94). The entrance is the sanctioned entrance-animation system (the container
  already runs FadeIn, the card SlideInDown); the row must be settled into that system,
  first frame at the fade's initial opacity, not opaque while the card is not.
- "Visuals are settled. Fixes change behaviour only. Touch no pixel without the owner's
  say." (line 93). The settled modal is hers and stays byte-identical: the change adds an
  entrance behaviour and removes the flash she filed; no settled style value moves.

## 2. Decisions

### 2.1 Taken

- D1: The Close row joins the container's entrance fade by carrying the same bare
  `FadeIn` builder on its `entering` prop (no chained duration, easing, delay or
  springify). Recorded here, 2026-10-13. Grounds: the container already runs bare
  `FadeIn` (components/modals/Modal.tsx:81), so the same builder with library defaults
  is the same curve by construction; the library default is 300 ms
  (node_modules/react-native-reanimated/lib/module/layoutReanimation/animationBuilder/BaseAnimationBuilder.js:84,
  `this.durationV ?? 300`), matching the fade her recording shows (~200-250 ms to
  settle). Help-local, one prop: Modal.tsx stays untouched (Update and WhatsNew share
  it and show no defect; rows 60 and 62 own that ground).
- D2: The row keeps its opaque background and its `layout={GROW}`. Her brief names the
  entrance flash only. The opaque background is load-bearing (components/modals/Help.tsx:272-274:
  it covers content sliding beneath the row on accordion moves), and `GROW` keeps the
  row following the list (Help.tsx:150). The fix must not touch either.
- D3: The proof vehicle is the iOS simulator plus jest; no 3T work. Recorded here,
  2026-10-13 (the dispatch bounds the row to jest and the simulator). Her Android
  recording is the defect baseline; the executor never commits it, only the
  transcription already in this plan and the simulator's own captures.
- D4: Versions are taken by rule, never frozen: the step commits the next patch after
  uat's `package.json` at execution, `git fetch origin` first, because concurrent lanes
  commit ahead of the working copy. Planning measured 2.0.203 taken by uat `ad6a1c89`
  (ticket 72's step merge) while this plan was written, so the step's floor is 2.0.204;
  the executor re-runs the version command and takes what the rule then yields.

### 2.2 The executor must not decide

- IF the post-fix simulator capture shows the Close row LAGGING the card (a dim box:
  row alpha below card alpha by more than 0.05 at any sampled pair), THEN STOP, keep
  the capture under `$HOME/athan-gitree/sessions/77/`, set the ticket NEEDS REPLAN with
  the capture path and the sampled alphas in LOG.md. That reading means parent fade and
  row fade are compounding, and the one-prop fix is wrong in that world. Do not tune
  durations to hide it.
- IF the pre-fix simulator capture shows no flash on iOS (row tracks card before the
  change), THEN proceed anyway: the defect baseline is her recording, the jest contract
  gates the change, and the capture result is recorded in LOG.md as an observed outcome.
  Do not skip the change for lack of an iOS red.
- IF any existing Help or Modal test fails after the change, THEN treat it as a finding
  about the change, never edit the test to pass; stop and report if the cause is not
  obvious within the step.

## 3. Pre-flight

Committed at `scripts/preflight-77.sh` in this folder. The executor runs it in place
from the uat checkout root, where the merge has put the plan folder:
`bash ai/plans/77-help-modal-flash/scripts/preflight-77.sh`. It checks the checkout is
on uat with a clean tree, origin/uat merged in, package.json at 2.0.203 or higher, and
every anchor in `scripts/anchors/` counting exactly 1 in its source file (node_modules
anchors included). Expected output, last line: `PREFLIGHT OK`. Any `PREFLIGHT FAIL`
line stops the step; the named condition is repaired before work starts.

## 4. Background the executor needs

### Code map

- `components/modals/Modal.tsx`: the shared modal card. Lines 20-31: `MODAL_ENTERING`
  is `SlideInDown` per platform (Android 200 ms cubic-out, iOS the 220/0.9 spring),
  `MODAL_RESIZE` a LinearTransition. Line 81: the full-screen container is
  `<Animated.View style={styles.container} entering={FadeIn} exiting={FadeOut}>`; the
  backdrop and the card sit inside it. Line 90: the card carries
  `entering={MODAL_ENTERING}`.
- `components/modals/Help.tsx`: the Help modal. Lines 150-159: the Close row, an
  `Animated.View layout={GROW}` holding the Close Pressable. Lines 269-276: the row's
  style, `backgroundColor: COLORS.light.background`, opaque through the button's air on
  purpose (comment at 272-273). The row has NO `entering` prop today.
- `components/modals/__tests__/Help.test.tsx`: the Help suite (behaviour, platform
  answers, chevron). Reads styles twice already where the app keeps a rule (lines
  147-154, 163-171), the precedent the new test follows.
- `components/modals/__tests__/Modal.test.tsx`: the shared card's suite; untouched by
  this ticket, run as a guard.
- `node_modules/react-native-reanimated/lib/module/layoutReanimation/defaultAnimations/Slide.js:216-229`:
  `SlideInDown` animates `originY` only, no opacity. The card's translucency during the
  entrance therefore comes from the container's FadeIn, not from the card's own
  entering.
- `node_modules/react-native-reanimated/lib/module/layoutReanimation/defaultAnimations/Fade.js:29-40`:
  `FadeIn` runs opacity 0 to 1.
- `node_modules/react-native-reanimated/src/mock.ts:528-541`: the jest mock maps
  `Animated.View` to the plain RN `View`, so an `entering` prop flows through to the
  rendered element's props and a test can read it; `FadeIn` under the mock is a shared
  `BaseAnimationMock` singleton, so identity (`toBe`) is a stable assertion.

### How the pieces interact, and the root cause

On mount the container runs bare `FadeIn` (opacity 0 to 1, default 300 ms) while the
card runs `SlideInDown` (200 ms, transform only). Everything under the container is
supposed to inherit that fade. Her recording shows the inheritance holding for the
backdrop, the card surface and the question rows, and failing for the Close row: the
strip paints at or near full opacity from its first frame and stays ahead of the card
through the entrance (0.96 against 0.78 at t=0.833). The row is the one fading-era
surface whose whiteness differs from the card's, because its background is opaque by
design (D2), so the gap renders as her solid white box. The exact compositor reason the
row escapes the container's fade is not pinned from the JavaScript sources; the plan
treats the recording as the fact and the fix makes the row's fade explicit instead of
inherited, which removes the reliance on the broken path either way.

Sampling rule, capture-relative (section 7 reuses it on its own captures): on the
scanline through the button's vertical midpoint, sample the row surface at 10 percent
and the card surface at 3 percent of the card width in from the card's left edge; score
each as `(pixel - settled backdrop) / (settled card white - settled backdrop)` per
channel sum; settled references from the last frame of the capture. Planning ran this
on her recording with PIL (1080x2340): 110 px and 24 px are that capture's 10 and 3
percent readings of the same rule.

### Existing tests and what they prove

- Help.test.tsx proves the modal's behaviour surface: visibility, platform question
  lists, accordion, Close, back press. None of it touches `entering`; all of it must
  stay green.
- Modal.test.tsx proves the shared card's visibility, width and back handling. It is a
  guard that Modal.tsx stayed untouched.
- No test today reads any `entering` prop. The flash class (an entrance member left out
  of the entrance fade) is unguarded; that is the hole this ticket closes.

### Why the obvious fixes are wrong

- Delete the opaque background: removes the deliberate cover the style comment records;
  the accordion slide would flash content through the gaps around the button.
- Fade the whole card or move the container's fade: shared ground (Update, WhatsNew,
  rows 60 and 62), wider blast radius for a defect only Help shows.
- Drive the row's fade with a `useSharedValue` in JS: under the jest mock the style
  never reaches 1 without a re-render the real component does not do, so the existing
  suite breaks or the test lies; the `entering` prop is the same idiom the container
  already uses.

## 5. Design

The approach in one sentence: the Close row joins the container's entrance fade by
carrying the same bare `FadeIn` on its own `entering` prop, so its first entrance frame
is the fade's initial opacity and its settled frame is unchanged. Invariant a test can
check: the nearest `entering`-carrying ancestor of the Close button carries the `FadeIn`
singleton and the `LinearTransition` singleton.

Alternatives rejected: background removal and shared-machinery changes (section 4);
JS-driven fade (section 4); matching durations by chaining `.duration(300)` on the row,
because a second literal drifts from the container's bare builder the day either side
changes, and the bare builder shares the default by construction (D1).

Concurrency trace: single component, mount-time prop, no store, no timer, no async. The
prop is read once by Reanimated's entering machinery at mount. No re-render path reads
it again. No conflict with the BackHandler effect (Modal.tsx:68-76), which gates on
`visible` only.

Design review: the change adds one prop to one Animated.View in Help.tsx and one
describe to Help.test.tsx. Settled bytes: none move (styles untouched). Exit bytes:
none move (exiting stays container-owned, FadeOut). Accordion: GROW untouched (R1.4).
Reduced motion: FadeIn honours the system setting through Reanimated's default
`getReduceMotion`, as the container's own FadeIn already does; the row now matches the
container in that path too.

### Acceptance criteria

- [R1.1] WHEN the Help modal mounts visible, THE SYSTEM SHALL carry the container's own entrance fade builder on the Close row's `entering` prop, the bare `FadeIn` singleton with no chained overrides.
- [R1.2] WHILE the entrance fade runs, THE SYSTEM SHALL keep the Close row's sampled alpha within 0.05 of the card surface's sampled alpha at every matched frame pair of the capture.
- [R1.3] WHEN the entrance fade completes, THE SYSTEM SHALL render the Close row at full opacity with its settled style unchanged: opaque `COLORS.light.background`, width and paddings as today.
- [R1.4] WHEN a Help topic row expands or collapses, THE SYSTEM SHALL keep the Close row moving with the list through its `LinearTransition` layout animation.
- [R1.5] IF the Help modal is not visible, THE SYSTEM SHALL render no Close row, as today.

## 6. Steps

- [ ] Step 1: the Close row joins the entrance fade (`steps/1-entrance-fade.md`, weight 2)

## 7. Device proof

No phone. The proof vehicle is the iOS simulator, driven through the agent-device CLI
and the repo's own build path. Every capture goes to the absolute evidence location
`$HOME/athan-gitree/sessions/77/` (ai/AGENTS.md pins evidence there; never inside the
checkout, never in git). No dumpsys or clock work: nothing here touches alarms or time.

1. Build and boot. The native folders are gitignored, so generate first:
   `test -d ios || npx expo prebuild --platform ios` (expected: `ios/` created), then
   through xcodebuildmcp: `session_use_defaults_profile` profile `ios`, then
   `build_run_sim`. Expected: the app foreground on the simulator. If the session has
   no defaults profile, discover the project with `discover_projs`, set scheme and
   simulator with `session_set_defaults`, and record which simulator was used in
   LOG.md.
2. Drive to Help: `open {app: "com.mugtaba.athan", foreground: true}` (app.json:18),
   press the settings gear, scroll the sheet to the Help row,
   `record start $HOME/athan-gitree/sessions/77/red.mov`, press Help,
   `wait {kind: "text", text: "Why don't I get any notifications?"}`, `record stop`.
   Expected: a recording of one modal open, 1-3 s.
3. Extract and measure: `mkdir -p $HOME/athan-gitree/sessions/77/red $HOME/athan-gitree/sessions/77/green`,
   then `ffmpeg -i $HOME/athan-gitree/sessions/77/red.mov -vf fps=120 $HOME/athan-gitree/sessions/77/red/h_%03d.png`
   (expected: 120-360 pngs for the 1-3 s capture), then the section 4 sampling rule on
   the frames from the first card pixel to settle. Expected RED reading: the row's
   alpha ahead of the card's by more than 0.05 at early frames, matching her
   recording's shape. If the reading shows no gap, record that outcome in LOG.md
   (section 2.2) and continue; the jest contract still gates.
4. The same drive and measurement after the change, saved as `green.mov` and
   `green/h_%03d.png` in the same place. Expected GREEN reading: matched pairs within
   0.05 (R1.2), no box shape at any frame; append both alpha tables to LOG.md.

## 8. Records

- LOG.md in this folder carries the ledger. Planning sections are written; the executor
  appends one entry per work block. Every step entry opens with the heading in the
  ledger's exact machine-parsed shape, `### Step 01 — <state>`, and ends with a line
  `session: <ses_id>` (the ledger contract, ticket 56).
- The findings text for the DONE merge: the Close row carried no entrance fade, so it
  painted opaque from its first frame while the container's FadeIn raised the card
  around it (her recording: strip alpha 0.96 against card alpha 0.78 at t=0.833); the
  row now carries the container's own bare FadeIn, the simulator capture shows the row
  tracking the card within 0.05 at every sampled pair, and jest pins the builder.
- Queue cell the lead applies on DONE: `DONE 2026-10-13, audited: the Help Close row
  joins the card's entrance fade (its own bare FadeIn, D1); the open shows no white box
  around Close, strip and card alphas track within 0.05 on the proof capture; settled
  modal byte-identical, opaque row and GROW kept (D2)`.
- Docs commit message: `<next free patch> - docs(plans): ticket 77: audit merge`, the
  number taken by the D4 rule at audit time.

## 9. Push

None. The executor never pushes; the lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| Green capture: row alpha below card alpha by more than 0.05 | parent fade and row fade compound | STOP, NEEDS REPLAN, capture and alphas in LOG.md (section 2.2) |
| Pre-fix capture shows no flash on iOS | defect is Android-side compositing | proceed, record the outcome in LOG.md (section 2.2) |
| New test fails with `Received: undefined` on `entering` | the ancestor walk found no entering node | fix the test's walk, never the app code, and re-run |
| New test fails at the `toBe(FadeIn)` line, `BaseAnimationMock {}` printed on both sides | the change did not land on the row: the walk found the card | re-check the prop is on Help.tsx:151's Animated.View (mock builders carry no printable name, so the red is the failing test name plus that line) |
| An existing Help or Modal test fails | the change touched behaviour it must not | STOP, treat as a finding (section 2.2) |
| Coverage gate below 100 on Help.tsx | the prop landed on a branch no render reaches | re-check the prop sits on the row inside the `visible` render |
| `yarn validate` fails on format | style of the edit | `yarn format`, re-run |

Anticipated review fixes, word for word:

- "Name the rule owner and date in the test's comment" -> the comment cites ai/AGENTS.md
  line 94 and the 2026-10-13 report, as the plan's test drafts do.
- "Assert layout on the same node" -> the test asserts `LinearTransition` identity on
  the same node it asserts `FadeIn` on.
- "Record the simulator name" -> LOG.md carries it (section 7 step 1).

Per-step restore lists: revert Help.tsx to one hunk (the entering prop) and
Help.test.tsx to one describe; `git checkout -- components/modals/` restores both;
delete `$HOME/athan-gitree/sessions/77/` only on a full restart of the step, never on
merge.

## 11. Subagents

Planning: the planning session read the code, the mock and her recording itself (frames
extracted with ffmpeg and read directly); no explore worker was needed. One
athan-plan-griller pass ran on this folder before READY; its must and should findings
are applied in this text, its one nice finding too. Delivery: the lead dispatches
the athan-executor and athan-reviewer workers. Every worker may call vision for an
image it cannot see. Nothing else, ever.

## 12. Report to the owner

The Help modal's Close row now joins the card's entrance fade: no solid white box
around Close on open, the settled modal unchanged. Proven by jest (the row carries the
container's own FadeIn builder and keeps its GROW layout) and by a simulator frame
capture whose row and card alphas track within 0.05 at every sampled pair. Her
recording stays out of the repository; its measurements live in this plan and in
LOG.md. Decisions waiting on the owner: none.
