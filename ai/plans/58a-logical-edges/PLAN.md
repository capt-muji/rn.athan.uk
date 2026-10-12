# Ticket 58a: Right-to-left layout mirroring, stage one - physical props to logical edges

| Field | Value |
| --- | --- |
| Brief | Queue row 58, `ai/plans/README.md`; rulings D59 and D60 taken 2026-10-11 stand |
| Planned at | `1c39b04c` (2.0.85, 2026-10-12; code files identical to `5f017d84` where the census ran) |
| Planned by | Planning session, 2026-10-12 |
| Needs first | 39 (DONE 2026-10-12, merged before this planning started) |
| Parent | 58 |
| Group | app layout styles (`components/**`, `app/**`); overlaps open rows 60, 61, 63 - same-group rows serialize |
| Batch budget | 6 (three weight-2 steps per dispatch) |
| Session budget | 8 (a fresh executor session after step 3) |
| Steps count | 6, all weight 2, no device step |
| Device | none. D66: this stage is proven by tests; 58b and the D41 confidence build carry device verification |
| Owner decisions still needed | none open. Section 2.2 lists the stops that route to her |

## 1. Goal

What is wrong today: Arabic text renders RTL inside an English-coded LTR shell. Every
directional style in the app is physical (`left`, `right`, `marginLeft`, `textAlign:
'left'`), `supportsRTL` is false and `I18nManager` appears nowhere, so switching the app
to an RTL locale cannot mirror anything. The owner's governing goal (queue row 58):
completely native to the language - layout, digits, letters, symbols.

What is true when DONE (58a, this plan): every parent-relative directional style in app
source uses logical keys (`start`, `end`, `marginStart`, `marginEnd`, `paddingStart`,
`paddingEnd`, the logical border keys if the pinned RN accepts them, `textAlign:
'start' | 'end'`). Sites with no correct logical form stay physical and are enumerated
in the gate test's allowlist, each with its reason: window-coordinate geometry
(`measureInWindow` pageX values never mirror) and translateX worklet math (no logical
form; 58b flips signs per surface). LTR rendering is unchanged, byte for byte. A
permanent gate test fails any commit that reintroduces a physical directional prop
outside the allowlist.

How the owner notices: nothing, in LTR - that is the point. The codebase stops encoding
a direction, so 58b (supportsRTL flip, forceRTL-at-switch, relaunch, widget
`layoutDirection`) becomes a small concentrated change instead of a 60-file sweep.

The owner's rules that apply, quoted with their source:
- Queue row 58, D60 (2026-10-11): "job 58a converts all 67 physical props, 35 absolutes
  and 22 measure sites to logical edges with LTR byte-identical rendering proven by
  tests (mechanical, riskless, big: 40-60 files), then job 58b flips supportsRTL, adds
  forceRTL-at-switch plus the relaunch, and passes layoutDirection to the widgets (small,
  concentrated, the risky half)." The measure-site map below narrows "all": sites whose
  physical key is the correct RTL answer (window coordinates) and sites with no logical
  form (translateX) stay physical, allowlisted with reasons.
- `ai/AGENTS.md`: "Visuals are settled. Fixes change behaviour only. Touch no pixel
  without the owner's say." 58a changes zero pixels: every conversion is verified
  byte-identical in LTR by test.
- `__tests__/README.md`: no snapshots, no style-value assertions. The one exception
  shape applies: "a rule the app must keep, named in a comment beside the assertion."
  The gate test is exactly that rule.

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D59 | Restart the app on RTL switch (to or from an RTL locale); Fabric treats direction as launch-time | Owner | 2026-10-11 | Queue row 58; 58b scope, not this plan |
| D60 | Two-stage split: 58a mechanical logical-edge conversion proven by tests, 58b the flip | Owner | 2026-10-11 | Queue row 58; this plan is 58a |
| D66 | 58a is proven by tests only: no device build, no simulator smoke in this stage. Device verification lives in 58b and the D41 confidence build | Owner | 2026-10-12 | This section; interview this session |
| D67 | The sweep is enforced by a permanent structural gate test: physical directional style props fail the suite outside a named allowlist (widgets excluded; physical-correct and 58b-pending sites listed with reasons) | Owner | 2026-10-12 | This section; interview this session |
| D68 | The D60 split gets its own queue rows now: row 58 becomes 58a's row, a new row (68, "58b: the supportsRTL flip") queues NOT PLANNED with needs-first 58. Row 66's 58b reference updates to name row 68 | Owner | 2026-10-12 | This section; interview this session; queue change lands with this plan |
| D69 | Step 3's raw-key conflict resolves by amending the plan, not by keeping the site physical: the two assertions in `overlayPlacement.test.ts:153,205` change `left` to `start` with the site they pin, as a named exception to R2.1's zero-test-edits rule. Rendered LTR is unchanged; the census had misfiled the suite as geometry-only | Owner | 2026-10-12 | This section; LOG.md step 3 stop record; repair commit between step 2 and step 3 |

### 2.2 The executor must not decide

Each situation stops work and asks the owner through the lead:

- A file the plan's steps do not list carries a physical directional prop the gate test
  fails on. Question: "Step <k> found <file:line> with <prop>, which the plan does not
  cover. Convert it, or allowlist it with which reason?"
- Converting a site changes any rendered output in LTR (a test beyond the plan's named
  suites fails, or a screenshot step shows drift). Question: "Conversion of <site>
  is not byte-identical in LTR. Revert this site to physical and allowlist, or proceed?"
  The default is revert; proceeding is the owner's call because it breaks D60's premise.
- The pinned RN rejects a logical key the plan names (tsc error on `start`, `end`,
  `marginStart`, `paddingStart`, `textAlign: 'start'`, or a border key). Question: "RN
  <version> rejects <key> at <file>. Which fallback: keep the physical pair, or
  restructure the style?"


## 3. Pre-flight

Committed at `scripts/preflight-58a.sh` in this folder. The executor saves a copy to
`$TMPDIR` and runs it from there against the repository root. It checks: the checkout
sits on `uat`, the tree is clean except this plan's files and the queue, `origin/uat`
is merged in, `package.json` version is at least 2.0.85, queue row 39 reads DONE, all
29 anchors count exactly 1, the three handover files exist, and the allowlist parses
with 59 entries. It ends `PREFLIGHT OK`. On any failure it stops the session before a
branch is created.

## 4. Background the executor needs

### 4.1 The census (verified at `5f017d84`, 2026-10-12)

Source scope: `app/`, `components/`, `hooks/`, `shared/`, `stores/`, `device/`, `modules/`,
`api/` (the gate scans the same eight directories; `hooks/` holds zero hits at the
planned-at commit).
Widgets excluded: the census found zero physical directional keys under `widgets/` (both
widget modules already use logical `padding({ leading/trailing })` and
`textAlign: 'end'`, `widgets/PrayerWidget.tsx:116`); widget modules are not React and D60
rules their direction work (`layoutDirection`) into 58b.

| Pattern | Count now | 2026-10-11 pack | Note |
| --- | --- | --- | --- |
| Style-edge `left:` / `right:` lines | 44 in 12 files | 67 in 24 files | Pack counted margin/padding inside its directional total and two prose hits plus one type declaration; `git diff e9d29eb6^..HEAD` over these dirs matches zero changed lines for every pattern, so no code drift explains any delta |
| `marginLeft`/`marginRight`/`paddingLeft`/`paddingRight` | 20 in 10 files | (inside the 67) | Mechanical conversion |
| `borderLeft*` / `borderRight*` | 0 | - | Nothing to convert; the gate still bans them |
| `textAlign: 'left'` / `'right'` | 0 (all 12 uses are `'center'`) | 13 | Nothing to convert; the gate still bans them |
| `hitSlop` with left/right keys | 0 (all 11 uses pass numeric constants) | - | Nothing to convert; the gate still bans them |
| translateX with direction-bearing sign | 5 sites, 4 files, plus `SIZE.toggle.translateX` at `shared/constants.ts:562` | - | No logical form exists; allowlisted, 58b flips per surface |
| `flexDirection: 'row'` | 32 in 20 files | 32 | Not converted in 58a: Yoga lays `row` from the start edge, so 58b's direction flip mirrors these with no code change |
| `position: 'absolute'` | 35 in 16 files | 35 | The key itself is direction-free; only its edge keys matter |
| `writingDirection` / `I18nManager` in app source | 0, confirmed | 0 | Stays zero in 58a |

### 4.2 The conversion classes

Every physical site falls into exactly one class. The class decides the action.

**Class A - convert (20 files, 46 source lines).**
Parent-relative static styles, in `StyleSheet.create` objects, inline style objects, and
constant fields feeding them. Conversion map, byte-identical in LTR:
`left: X` -> `start: X`; `right: X` -> `end: X`; `marginLeft: X` -> `marginStart: X`;
`marginRight: X` -> `marginEnd: X`; `paddingLeft: X` -> `paddingStart: X`;
`paddingRight: X` -> `paddingEnd: X`. Both-edge anchors (`left: 0, right: 0`) become
`start: 0, end: 0`. The shared constant fields `STYLES.prayer.padding.left/.right`
(`shared/constants.ts:994,996`) rename to `.start/.end`, and every reader follows:
the style usage in `components/prayer/Prayer.tsx:109` and
`components/prayer/Alert.tsx:208`, and the width arithmetic in
`components/prayer/Prayer.tsx:69` (a direction-free gap sum; the rename is naming only).

Class A files by surface group (steps follow these groups):
- Navigation and countdown: `app/Navigation.tsx:124,125`; `components/countdown/Bar.tsx:214,215`
- Modals and day: `components/modals/Modal.tsx:116,117,126,127`; `components/modals/Help.tsx:204,205,225,227`; `components/day/Day.tsx:65,66`
- Prayer rows: `components/prayer/Prayer.tsx:109`; `components/prayer/Alert.tsx:209`; `components/prayer/Time.tsx:71`; `shared/constants.ts:994,996`
- Sheets parts: `components/sheets/parts/Sheet.tsx:225`; `SoundItem.tsx:149,162`; `Stepper.tsx:142`; `SegmentedControl.tsx:194,220`
- Sheets screens: `components/sheets/screens/Qibla.tsx:197,199`; `Sound.tsx:233,234`; `Language.tsx:84,85`; `Settings.tsx:241,250,264,281`
- Overlay: `components/overlay/Overlay.tsx:122,123`; `OverlayInfoBox.tsx:68,69,94,95`; `VeilBackdrop.tsx:62,63,69,70`

**Class B - keep physical, permanent allowlist (window-coordinate geometry).**
`components/overlay/catcherGeometry.ts:39,49-52` build region objects consumed as inline
style at `components/overlay/Overlay.tsx:111`; `components/overlay/VeilBackdrop.tsx:40`
anchors the glow at `left: window.width / 2 - columnWidth`. `measureInWindow` and window
dimensions are physical window space that never mirrors; under RTL the rows and the
column still sit at physical window positions, so `left` is the correct key and a
`start` swap would detach the box from its measured target. The VeilBackdrop glow's
mirror behaviour is a 58b per-surface decision. Reason string in the allowlist:
`window-space geometry, physical by construction`.

**Class C - keep physical, permanent allowlist (no logical form exists).**
Transform math and sprite placement whose sign encodes direction:
`components/countdown/Bar.tsx:149` with `components/countdown/tipGeometry.ts:31-37`
(worklet; worklets cannot read I18nManager, so 58b mirrors inside the math);
`components/sheets/parts/SegmentedControl.tsx:141,154` (pill slide, needs index or sign
flip in 58b); `components/sheets/parts/Toggle.tsx:36,37,46` plus
`shared/constants.ts:562` (dot travel); `components/sheets/screens/QiblaWave.tsx:80`
(figure rides a wave path); `components/ui/RamadanDecorations.tsx` ten `left:` sprite
lines (525, 578, 588, 601, 657, 678, 695, 711, 758, 898) and `translateX` at `:753`
(decorative canvas math; the sign convention already encodes both directions
explicitly, so RTL does not change it). Reason string: `translateX/sprite math has no
logical key; 58b mirrors per surface` (RamadanDecorations: `decorative canvas math,
direction-sign explicit, mirrors nothing`). The transform-only sites carry no
allowlist entry at all: no banned pattern matches a `translateX` line, so the gate
never sees them. They are 58b's inventory, documented here and in PLAN.md section 4.2
only.

### 4.3 How the pieces interact

The gate test is the spine. It lands first carrying every Class B and C site as
permanent allowlist entries and every Class A file as a pending entry. Each conversion
step deletes its files' pending entries (the gate goes red naming exactly those files),
converts them (the gate goes green), and relies on the existing behavioural suites to
prove LTR rendering unchanged. The allowlist is therefore also the step tracker: 58a is
DONE when the pending list is empty and the permanent list holds exactly the Class B and
C sites with their reasons.

The per-locale width layer (`stores/ui.ts:126,134-143,261-275`, read at render time by
`hooks/usePrayer.ts:90` and `components/prayer/Prayer.tsx:69,91`) measures direction-free
widths and is untouched by 58a except the `.start/.end` constant rename inside the
`Prayer.tsx:69` gap sum. Row 61's width defect lives in that layer and stays row 61's.

### 4.4 The existing tests and what each proves

- `components/countdown/__tests__/tipGeometry.test.ts` - pins the tip clamp math (Class
  C, unchanged by 58a).
- `components/overlay/__tests__/catcherGeometry.test.ts`, `overlayPlacement.test.ts` -
  pin the window-space region geometry (Class B, unchanged).
- `components/sheets/parts/__tests__/SegmentedControl.test.tsx`, `Sheet.test.tsx`,
  `Toggle.test.tsx` - behavioural suites over three Class A/C files; they must stay
  green through the conversions, which is the LTR-unchanged proof for those surfaces.
- The remaining Class A files are covered by their behavioural suites (Help, Modal,
  Settings, Language, Qibla, Sound, Day, Prayer, Alert, Time, Navigation, Bar,
  OverlayInfoBox, VeilBackdrop, RamadanDecorations); each step runs the touched files'
  suites plus `npx tsc --noEmit` and Biome.
- 15 test-file lines match the banned patterns (8 files). Test files are outside the
  gate's scan scope: they assert geometry and behaviour, not shipping styles, and
  Class B/C tests must keep naming physical keys. One census correction, D69: two
  assertions in `overlayPlacement.test.ts` (`:153` in the toMatchObject, `:205` the
  `style.left` read) pin the raw key of the Class A infobox inline style, so they
  move with the site (`left` to `start`) inside step 3; every other test line that
  matches a banned pattern pins Class B geometry or Class C math and stays physical.

### 4.5 Why the obvious fix is wrong

The obvious fix is a single sed across all 64 lines, or flipping `supportsRTL` today.
The sed breaks Class B immediately (window-space catchers detach from their measured
rows under RTL) and silently breaks Class C in 58b (no sign flip ever happens because
the site looks converted). Flipping `supportsRTL` before the conversion activates RN's
left/right swap semantics on every physical site at once with zero anchors, which is
why D60 split the work. The gate-with-pending-allowlist shape is what makes the sweep
observable: without it, a 60-file mechanical diff has no red-green proof and a missed
file is invisible.

## 5. Design

The approach and its invariant, one sentence a test can check: every parent-relative
directional style in app source uses a logical key, and
`shared/__tests__/directionalStyleGate.test.ts` fails naming any physical key outside
`scripts/directional-styles-allowlist.json` and any allowlist entry whose line is gone.

The gate lands first with every site allowlisted: 38 pending entries (one per file and
snippet a later step converts) and 21 permanent entries (window-space geometry, canvas
math, prose). Each conversion step deletes its pending entries first, which turns the
gate red naming exactly that step's lines, then converts those lines to logical keys,
which turns it green. The allowlist is the step tracker: step 6 ends with the 21
permanent entries and zero pending ones. The conversions are byte-identical in LTR
because the pinned React Native resolves `start` to left and `end` to right under an
LTR layout direction (`node_modules/react-native/ReactCommon/yoga/yoga/style/Style.h`,
`computeLeftEdge` and `computeRightEdge`), and the testing stack rewrites no style key
(`@testing-library/react-native` 14.0.1 and jest-expo 58.0.8, verified by grep over
their dist trees).

Alternatives rejected:
- One sed pass over all 64 lines. It converts the seven window-space lines and the
  eleven canvas-math lines wrongly: `measureInWindow` pageX values never mirror, so a
  `start` key there detaches the overlay catchers from the rows they exempt, and
  translateX math has no logical form to receive the swap.
- Flipping `supportsRTL` first. D60 rejected it: it activates the native left/right
  swap on every physical site at once with zero anchors.
- Converting `flexDirection: 'row'`. Yoga lays `row` from the start edge, so the 58b
  direction flip mirrors all 32 rows with no code change; converting nothing is the
  smaller true statement.
- Converting the five translateX families. No logical key exists for a transform; 58b
  mirrors each inside its own math (tip clamp, pill index, toggle travel, wave path,
  decorative sprites), which needs per-surface decisions this stage cannot take.

Concurrency trace: none new. The sweep adds no runtime behaviour, no timers, no
subscriptions and no storage keys. The only shared mutable artefact is the allowlist
fixture, edited by one step at a time under the one-branch-per-step rule and the
version lock.

The design review: the gate is a rule the app must keep, asserted structurally because
no behavioural test can see a style key, which `__tests__/README.md` names as the one
allowed shape of style assertion. Its two failure directions are proven in the plan's
scratch-worktree record (LOG.md, 2026-10-12): dropping entries fails naming the lines,
converting lines without dropping entries fails naming the stale entries. The
handover files were run live against a real tree in both states before this plan was
written.

**Acceptance criteria:**

- [R1.1] WHEN the gate suite runs against a tree holding a physical directional style prop outside the allowlist THE SYSTEM SHALL fail naming that file and line.
- [R1.2] WHEN the gate suite runs against a tree where an allowlist entry matches no source line THE SYSTEM SHALL fail naming that stale entry.
- [R2.1] WHEN a conversion step's named suites and `npx tsc --noEmit` and `npx biome check . --error-on-warnings` run after that step's change THE SYSTEM SHALL pass all of them with zero edits to any test file, except the two raw-key assertions in `overlayPlacement.test.ts:153,205` which change `left` to `start` with the site they pin (D69).
- [R3.1] WHEN step 6 merges THE SYSTEM SHALL leave `scripts/directional-styles-allowlist.json` holding exactly the 21 permanent entries and no entry whose reason starts with `pending`.
- [R4.1] WHEN `node scripts/check-directional-styles.js` runs at any step's green state THE SYSTEM SHALL print `DIRECTIONAL STYLES OK` and exit 0.
- [R5.1] WHEN the gate suite runs against the tree a step commits THE SYSTEM SHALL pass both its tests with an empty remainder and an empty stale list.

## 6. Steps

Checklist (every step weight 2, one branch, one commit, one version):

- [x] 1. The gate suite and its allowlist land (`steps/1-gate.md`)
- [x] 2. Prayer rows and the shared constants (`steps/2-prayer-constants.md`)
- [x] 3. The overlay family (`steps/3-overlay.md`)
- [ ] 4. Sheet parts (`steps/4-sheet-parts.md`)
- [ ] 5. Sheet screens (`steps/5-sheet-screens.md`)
- [ ] 6. Modals, day, navigation, countdown gloss (`steps/6-modals-day-nav-bar.md`)

The conversion map every step applies, stated once here and cited by each step:

| Physical | Logical |
| --- | --- |
| `left: X` | `start: X` |
| `right: X` | `end: X` |
| `marginLeft: X` | `marginStart: X` |
| `marginRight: X` | `marginEnd: X` |
| `paddingLeft: X` | `paddingStart: X` |
| `paddingRight: X` | `paddingEnd: X` |

Values change by nothing. Where a doc comment names the converted side (`Left padding`
in `shared/constants.ts`), the comment word follows the key. No other edit rides along.

## 7. Device proof

None. D66 (2026-10-12): this stage is proven by tests. It changes zero pixels in LTR,
touches no notification, schedule or data path, and the device verification for RTL
mirroring belongs to 58b and the D41 confidence build.

## 8. Records

The findings text written into `LOG.md` under each step's heading, filled with the
measured values:

```
### Step <NN> — merged
Branch <branch>, commit <sha>, version <VERSION>.
Gate red before conversion: <N> lines named (first: <file>:<line>).
Converted <files> per the map; allowlist now <M> entries (<P> pending).
Suites: <commands and pass lines>. tsc 0, Biome 0.
Break <k>: <script last line>. Review: <verdict>.
session: <ses_id>
```

The queue cell text the lead applies on DONE:

```
DONE <date>, audited: stage 58a landed - every parent-relative directional style in
app source uses logical keys (start/end, margin and padding start/end, constants
renamed), LTR rendering unchanged, proven by the behavioural suites plus the permanent
directional-style gate (remainder and stale both enforced, window-space geometry and
canvas math allowlisted with reasons). No device step (D66). 58b (row 68) can plan on
top. Group: app layout styles, serialized with rows 60, 61, 63.
```

The docs commit message the executor makes when it sets EXECUTED:

```
<VERSION> - docs(plans): ticket 58a executed: 6 steps, gate plus 5 conversion sweeps
```

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Meaning | Action |
| --- | --- | --- |
| `tsc` rejects `start`, `end`, `marginStart`, `marginEnd`, `paddingStart` or `paddingEnd` in a converted file | The pinned RN differs from the verified types | Revert that file's conversion, restore its allowlist entries, return `STOP:` per section 2.2 |
| The gate names a physical prop in a file the step does not list | A site the census missed | Return `STOP:` per section 2.2 with the file and line; never convert it silently |
| A behavioural suite the step names fails after the conversion | The conversion is not byte-identical in LTR | Revert that file's conversion, restore its allowlist entries, return `STOP:` per section 2.2 |
| The gate names a stale entry in a file the step did not convert | Another change moved a permanent or pending line | Return `STOP:` with the entry and the file's current text |
| An anchor counts other than 1 | The anchored code moved | Return `NEEDS_CONTEXT: NEEDS REPLAN` per the executor contract |
| `node scripts/check-directional-styles.js` exits 1 at a green checkpoint with both lists empty in Jest | The CLI and the suite read different roots | Compare `scripts/check-directional-styles.js` `ROOT` against the checkout; return `STOP:` if both live in the same tree |

Anticipated review fixes, word for word:
- Reviewer finds a doc comment still saying `Left padding` beside a `start` key in
  `shared/constants.ts`: apply the comment-word fix from section 6's closing rule, amend.
- Reviewer finds an unused import or a reordered line introduced by an edit tool in a
  converted file: restore the file to the step's contract shape (conversion map only),
  amend.
- Reviewer finds the allowlist still holding a pending entry whose file step <k>
  converted: the gate would have failed the commit, so this is a stale-worktree read;
  re-run the suite on `uat` and report the result in `LOG.md`.

Per-step restore lists sit in each step file. The scratch worktree
`$HOME/athan-gitree/worktrees/plan-58a` and its branch are planning scaffolding and are
removed by the planning session, not the executor.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the draft.
Delivery: the lead dispatches the `athan-executor` and `athan-reviewer` workers. Every
worker may call `vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Plain sentences: stage 58a converted the app's directional styles to logical keys with
zero LTR change, enforced by a permanent gate; 58b (row 68) flips the direction with a
small concentrated diff. Then the progress table, decisions waiting on the owner (none,
or the stops from section 2.2), and the four-line handoff block the lead's skill
defines.


