# Ticket 77 ledger

## Planning (2026-10-13)

## Ticket 77

- Brief read from queue row 77; owner away, her recorded rulings taken as the brief.
- Her recording read in planning: 2.42 s, 120 fps, 1080x2340. Frames extracted to
  `$TMPDIR` and read directly; never committed. Measured: card alpha 0.78 against row
  alpha 0.96 at t=0.833 (frame h_034), both 1.0 settled (h_100), the row near-solid
  from its first frame.
- Root cause: the Close row (components/modals/Help.tsx:151) carries no `entering`,
  so it paints opaque from frame 1 while the container's FadeIn
  (components/modals/Modal.tsx:81) raises the card around it; the row's opaque
  background (Help.tsx:274) makes the gap visible as the white box. SlideInDown moves
  `originY` only, so the card's translucency is the container's fade, not its own.
- Decisions D1 to D4 taken and recorded in PLAN.md section 2.1.
- Anchors extracted at cfb9b837; verified counting 1 at eb4582b1 by diff and on uat
  ad6a1c89 by the griller's own runs. Planned at set to uat ad6a1c89 (2.0.203).
- Griller pass ran (one round, ten findings: six must, four should, plus one nice);
  all applied. The load-bearing one: uat took 2.0.203 (ad6a1c89, ticket 72's merge)
  while planning wrote, so versions run by rule from uat's package.json at execution
  (D4), the planning docs commit rides 2.0.204.
- Resume from: run the gate once more, set row 77 READY in the queue, bump the two
  version files to 2.0.204, commit on lane/77.

### Step 01 — executed (lane/77, unmerged)

- Lane preflight: the script ran in place from the lane worktree root. It printed
  one `PREFLIGHT FAIL: checkout is on lane/77, not uat` and exited 1; every other
  check passed silently inside it (clean tree, `origin/uat` merged, package.json
  2.0.204 >= floor 2.0.203) and all 8 anchors were re-counted individually: each
  counts exactly 1. The branch-name check is the lane-flow artifact the dispatch
  dictates (dedicated lane worktree on `lane/77`, the lead merges); the plan's
  uat-checkout assumption does not apply in the lane.
- Version by D4: `git fetch origin` run; the main checkout (`feat/72-render`,
  another lane) holds 2.0.207 uncommitted in its working tree over commit 2.0.206,
  so the next free patch is 2.0.208. Set in package.json and app.json; no
  `android/` exists on disk in this worktree, so no gradle `versionName` applies.
- Red: the step's describe added to Help.test.tsx after the chevron describe.
  `npx jest components/modals/__tests__/Help.test.tsx --watchman=false
  --selectProjects=components`: the new test failed at the `toBe(FadeIn)`
  assertion (line 267), the walk having found the card's slide, both sides
  printing the anonymous `BaseAnimationMock` shape ("serializes to the same
  string"); the other 23 tests passed.
- Red capture (pre-fix app, section 2.2 outcome): built via xcodebuildmcp
  (`build_run_sim`, scheme `Athan`, workspace `ios/Athan.xcworkspace`), simulator
  `Athan-77` (iPhone 16, iOS 18.5, created for this session because the host had
  zero simulator devices), Metro served from the lane worktree on port 8081.
  Recording `$HOME/athan-gitree/sessions/77/red.mov` (3.17 s, 30 fps, 220x480),
  frames `red/h_001..095.png`, sampled by the section 4 rule (scanline through
  the button's vertical midpoint, row at 10% and card at 3% of card width from
  the card's solid left edge; settled references from the last frame). Observed
  outcome: NO iOS flash pre-fix. Entrance pairs (row, card):
  h_023 0.121/0.071 (+0.051, sheet-dismiss boundary), h_030 0.322/0.319,
  h_031 0.387/0.380, h_032 0.523/0.520, h_033 0.774/0.770, h_034 0.888/0.888,
  h_035 0.963/0.963, h_036 0.996/1.000, h_037..040 1.000/1.000. Max gap after
  the card's first visible frame: 0.007. The plan's section 2.2 rules this
  outcome: proceed, the jest contract gates the change.
- Change: one hunk, Help.tsx line 151 `layout={GROW}` gains bare `entering={FadeIn}`.
- Green: both suites 31/31. Green capture `green.mov` (3.24 s), frames
  `green/h_001..097.png`, same drive and sampler. Pairs: h_023 0.069/0.071,
  h_024 0.100/0.071 (+0.030, sheet-dismiss boundary), h_030 0.306/0.306,
  h_032 0.644/0.641, h_033 0.730/0.722, h_034 0.730/0.722, h_035 0.903/0.903,
  h_036 0.969/0.969, h_037..041 1.000/1.000. Max entrance-pair gap 0.008; R1.2
  satisfied (within 0.05 at every matched pair); no box shape at any frame (mid
  -entrance frames read as one translucent piece).
- Break script (three mutants against green): deleting the row's `entering`,
  moving it onto the Close Pressable, and deleting `layout={GROW}` each turned
  the new test red (1 failed, 23 skipped); restored after each; the file's diff
  vs HEAD is the one hunk again.
- `yarn validate` exit 0: tsc clean, Biome clean (432 files), 208 suites, 5500
  passed + 1 pre-existing skip, coverage 100% on statements, branches, functions
  and lines.
- Two test-wiring fixes the plan's draft could not name (its import target does
  not exist in this dependency set): the type import resolved to
  `import type { TestInstance } from 'test-renderer'` (the node type
  `@testing-library/react-native` itself uses; neither
  `@testing-library/react-native` nor `react-test-renderer` exports
  `ReactTestInstance` here). The walk helper's name, signature shape and
  behaviour are the step's.
- Evidence under `$HOME/athan-gitree/sessions/77/` (red.mov, green.mov, red/,
  green/); nothing under it is committed. Queue row untouched: the board is the
  lead's in the lane flow.

session: ses_ecacc4fedffeuoFKRF0I2ZUPoo
