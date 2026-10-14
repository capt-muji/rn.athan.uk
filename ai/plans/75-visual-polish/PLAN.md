# Ticket 75: Visual polish: mosque SVG mirroring, no scrollbars anywhere, toggle outline to the card edge

| | |
| --- | --- |
| Brief | Queue row 75, `ai/plans/README.md`: the owner's test of 2026-10-13, three rulings |
| Planned at | `1b0d5229` (`uat`, 2.0.402, 2026-10-14) |
| Planned by | The lead session, 2026-10-14. The owner is not interviewable this run; her rulings in the queue row are the specification, and the run order authorises autonomous decisions |
| Needs first | nothing |
| Parent | none |
| Group | icons, scroll containers and toggle styling |
| Batch budget | 4 |
| Session budget | 6 |
| Steps count | 4 (three code, one simulator proof) |
| Device | iOS simulator via the `agent-device` MCP, dev build with Metro (mock data). The 3T is waived by the owner's run order. The owner's iPhone XS stays untouched unless the simulator cannot render a proof, and then read-only, driven by the lead |
| Owner decisions still needed | none. Her three rulings settle the visuals; the run order settles the process |

## 1. Goal

Three defects from the owner's Arabic-face test of 2026-10-13:

1. The mosque mark on the Standard and Extras schedule pages sits on the left under
   `ar` but faces the phone's edge instead of inwards. Her ruling: the entire mark
   mirrors under RTL, and the Ramadan variant stays identical in facing to the
   standard one.
2. A visual scrollbar appears when the bottom sheets scroll on the 3T. Her ruling: a
   scrollbar must never exist anywhere in the app, so every scrollable hides its
   indicator. She asked whether this predates the RTL work: it does, and section 4
   carries the proof.
3. The off-state toggle's slight purple outline is liked and stays, but its colour
   changes to match the cards' outer edge colour, the border colour the Display card,
   the countdown bar card and the prayer cards carry, on every toggle in the app. The
   off-state thumb position under `ar` she confirmed unchanged, and ticket 73's travel
   logic is untouched.

What is true when DONE: under `ar` the mosque mark mirrors on both schedule pages and
the error screen, both variants alike; no scrollable in the app draws an indicator;
every toggle's off-state outline carries the cards' edge colour. Under `en` and the
four other non-ar locales the rendering is byte-identical to 2.0.402 except the two
surfaces she ruled global: the hidden indicators and the toggle outline colour.

The owner's rules that apply, quoted from the queue row:

- "the entire SVG mirrors under RTL, and the Ramadan variant of the mark stays
  identical in facing to the standard one"
- "a scrollbar must never exist anywhere in the app, so every scrollable hides its
  indicator (verify whether this predates the RTL work and fix it regardless)"
- "the off-state toggle's slight purple outline is liked and stays, but its colour
  changes to match the cards' outer edge colour (the border colour the Display card,
  the countdown bar card and the prayer cards carry), on every toggle in the app"
- "The toggle's off-state POSITION under ar (circle right on grey) she confirmed
  correct - no change there"

Process rules from the owner's run order, 2026-10-14: one continuous run (plan, grill,
execute, audit), no merge to `uat`, no push, the queue row never set DONE this run;
versions 2.0.450 to 2.0.499 with the patch rising by one per commit; physical device
work waived, the owner is final QA; an iOS simulator session for the visual proofs is
wanted, dev/mock only.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Source |
| --- | --- | --- |
| D75.1 | The mark mirrors inside `Masjid.tsx` on the locale's own direction, `localeDirection(currentLocaleId()) === 'rtl'`, never on the platform or the bridge snapshot. One component covers both variants and every mount site: `Day` on both schedule pages and the error screen | Her ruling (a); the ground note on the queue row; the ticket 73 pattern (`components/sheets/parts/Toggle.tsx:32`) |
| D75.2 | The sheets' shared scroll view in `Sheet.tsx` gains `showsVerticalScrollIndicator: false`. The sweep (section 4) found it is the only scrollable in the app still drawing an indicator; the three modal scroll views already hide theirs and carry tests | Her ruling (b), global by her instruction |
| D75.3 | The scrollbar predates the RTL work. `1a1b4a8c` (1.5.3, 2026-08-28) hid the indicator in the `@expo/ui` sheet era; `59267ed6` the same day reverted sheets to `@gorhom/bottom-sheet` 5.2.14 restored verbatim from `9e6ba84`, which never hid it. Rows 58a and 68 never touched the indicator. The owner sees a defect six weeks older than the RTL work | Git history, quoted in section 4 |
| D75.4 | The toggle's off-state border becomes `'rgba(99, 102, 241, 0.15)'`, the literal every card carries (`Settings.tsx` `styles.card`, line 221; the same literal on the Alert, Language, Sound and Reminder cards). It lands by repointing `COLORS.interactive.inactiveBorder` in `shared/constants.ts`, whose only reader is the toggle track. The on-state border `#672bcf`, the track colours, the thumb position and ticket 73's travel are untouched | Her ruling (c); the ground note on the queue row |
| D75.5 | One branch `ticket/75` in worktree `$HOME/athan-gitree/run-75`, commits land on it directly, no step branches, no `uat` merge, no push. Every commit bumps `app.json` and `package.json` together, 2.0.450 rising by one; `android/app/build.gradle` follows only when it exists in the worktree (it does not; `android/` is gitignored and the lockstep test tolerates its absence) | The owner's run order, 2026-10-14 |
| D75.6 | `en` and the four other non-ar locales render byte-identically to 2.0.402 except the two global rulings (indicators, toggle outline). The mirror is `ar`-only because only `ar` is RTL among the shipped six | Her rulings; the run order's hard rule |

### 2.2 The executor must not decide

Each situation stops the step and returns `STOP:` to the lead:

- A scrollbar surface or any other needed change sits inside a file ticket 80 or
  ticket 76 claims (the pre-flight lists them). The lead reports it to the
  orchestrator; nobody touches the file.
- Any change would touch the toggle's travel, its on-state border, or the thumb's
  off-state position under `ar`.
- The simulator proof cannot produce the Arabic face (build fails twice on distinct
  causes, or the language sheet cannot switch). The lead owns the owner's iPhone XS
  read-only fallback.
- A red test stays red after the change, or a green test turns red.

## 3. Pre-flight

`scripts/preflight-75.sh`, saved to `$TMPDIR` and run from there. It checks the
worktree on `ticket/75` descended from `1b0d5229`, a clean tree, the version inside
2.0.402 to 2.0.499 with `app.json` and `package.json` agreeing, `node_modules`
present, every anchor counting exactly 1, and no sibling-claimed file changed since
the anchor. It ends `PREFLIGHT OK`. Anything else is a stop before work starts. If
`node_modules` is missing, the lead creates it before dispatch (never the executor,
who may not install): a symlink from the main checkout's `node_modules` into the
worktree, gitignored, so the clean-tree check still passes.

## 4. Background the executor needs

### Code map

| File | Role |
| --- | --- |
| `components/ui/Masjid.tsx` | The mosque mark: one `Image` drawing `masjid.png` or `masjid-ramadan.png`, both pre-rasterized PNGs (rsvg output). Changed in step 1 |
| `components/ui/__tests__/Masjid.test.tsx` | Variant selection, the splash gate, the caller's sizing. Extended in step 1 |
| `components/day/Day.tsx` | Mounts `MemoizedMasjid` beside the date on both schedule pages. Read-only: the mark's container flips with the layout under RTL, which is why the mark sits on the left under `ar` |
| `components/ui/Error.tsx` | The error screen, the mark's other mount site. Read-only, and claimed by ticket 80: the mirror lands inside `Masjid.tsx`, so this file never changes |
| `components/sheets/parts/Sheet.tsx` | The sheet machinery every sheet renders through. `scrollable` picks `BottomSheetScrollView` or `BottomSheetView`. Changed in step 2 |
| `components/sheets/parts/__tests__/Sheet.test.tsx` | The sheet suite, already holding a `scrollViews()` helper. Extended in step 2 |
| `components/modals/Help.tsx`, `WhatsNew.tsx`, `Update.tsx` | The three modal scroll views. Already hide their indicators (`showsVerticalScrollIndicator={false}`) with tests pinning each. Read-only, named here to close the sweep |
| `app/Navigation.tsx` | The pager (`react-native-pager-view`). Draws no scroll indicator; read-only, named to close the sweep |
| `components/prayer/List.tsx` | The prayer list: a plain `View`, no scroll. Read-only, named to close the sweep |
| `components/sheets/parts/Toggle.tsx` | The one toggle component (every toggle renders through it, `LabeledToggle` included). Read-only in this ticket: the colour it reads changes under it |
| `components/sheets/parts/__tests__/Toggle.test.tsx` | The ticket 73 travel suite. Extended in step 3 with the outline colour, never edited in its travel claims |
| `shared/constants.ts` | The palette. `interactive.inactiveBorder` at line 745, value `#3b3977`, repointed in step 3. Its only reader is the toggle track |
| `components/sheets/screens/Settings.tsx` | The cards' border evidence: `styles.card` line 221 carries `rgba(99, 102, 241, 0.15)`, and the render names the Prayer, Display and Countdown Bar cards. Read-only |
| `app.json`, `package.json` | Version bumps, every commit |

### The scrollables sweep, complete

`grep -rn "ScrollView\|FlatList\|SectionList"` over `app/` and `components/` returns:
the three modals (WhatsNew and Update hide theirs with tests pinning
`showsVerticalScrollIndicator` false; Help hides it in source at `Help.tsx:142` while
its test reads the scroller's height bound), the shared `Sheet.tsx` (the one missing
it), and test files. No `FlatList` or `SectionList` exists in app source. The pager
draws no indicator. The prayer list does not scroll. The Qibla sheet renders
`BottomSheetView` (`scrollable={false}`, `Qibla.tsx:150`), which has no indicator; its
file is claimed by ticket 76 and needs nothing, because the fix lives in the shared
machinery.

### Why the scrollbar predates the RTL work (her question, answered)

- `1a1b4a8c` (2026-08-28, 1.5.3): the `@expo/ui` sheet era hid the indicator, plain
  `ScrollView` with `showsVerticalScrollIndicator={false}`.
- `59267ed6` (same day, 1.5.3): sheets reverted to `@gorhom/bottom-sheet` 5.2.14,
  "restored verbatim from `9e6ba84`". That source carries zero occurrences of the
  prop; the hiding died in the revert. Zero occurrences verified by
  `git show 9e6ba84:components/sheets/parts/Sheet.tsx | grep -c showsVerticalScrollIndicator`.
- Rows 58a (`f8641183`, 2.0.91) and 68 converted sheet styles to logical edges and
  never touched the indicator. The library default draws it (`showsVerticalScrollIndicator = true`
  at `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetScrollable/createBottomSheetScrollableComponent.tsx:40`).

So the 3T scrollbar she saw on 2026-10-13 has been there since 1.5.3 on every
sheet whose content scrolls, six weeks before the RTL work began.

### Library behaviour, verified at the pinned version

`@gorhom/bottom-sheet` 5.2.14: `createBottomSheetScrollableComponent` destructures
`showsVerticalScrollIndicator = true` and forwards it to the wrapped animated
`ScrollView` (lines 40 and 81 of the file named above). Passing the prop on
`BottomSheetScrollView` reaches the platform scroll view. Verified from the package
source in `node_modules`, not from docs.

### Why the obvious fixes are wrong

- Mirroring the art files themselves (a second PNG set flipped at build time) doubles
  the assets and mirrors the mark under `en` too, breaking the byte-identical rule.
- Mirroring in `Day.tsx` mirrors one mount site and leaves the error screen unmirrored.
- `I18nManager.isRTL` (the bridge snapshot) keys the mirror on the launch direction;
  a starved crossing renders Arabic while the bridge still reports LTR (row 78). The
  locale's own direction is the ticket 73 precedent and stays immune.
- Hiding the indicator per sheet screen touches claimed files and misses any future
  sheet; the shared wrapper is one line and covers all five sheets.
- Inlining the card colour in `Toggle.tsx` strands a dead palette key
  (`inactiveBorder` has no other reader) and puts a styling literal where the palette
  owns colour. Repointing the palette value keeps the semantic name and one diff line.

### Existing tests and what each proves

- `Masjid.test.tsx` proves variant selection by season and decorations, the splash
  gate lift on load end, and caller sizing. Step 1 adds the mirror claims.
- `Sheet.test.tsx` proves the scroll view appears when `scrollable` is true and no
  scroll view renders when false, plus the sheet lifecycle. Step 2 adds the indicator
  claim on the rendered `RCTScrollView`.
- `Toggle.test.tsx` proves the thumb's settled first frame, the travel keying on the
  locale's own direction under `ar` with the bridge reporting LTR, haptics and the
  press contract. Step 3 adds the outline colour claims and must leave every travel
  claim green and unedited.
- `WhatsNew.test.tsx` and `Update.test.tsx` pin their modals' hidden indicators;
  `Help.test.tsx` reads its scroller's height bound while `Help.tsx:142` hides the
  indicator in source. Read-only proof the modal sweep is closed.

## 5. Design

One design sentence per piece, each checkable by a test:

- The mark mirrors on the locale's own direction, so under `ar` the `Image` style
  carries `transform: [{ scaleX: -1 }]` and under every LTR locale it carries no
  transform at all.
- The sheet scroll wrapper hides its indicator, so the `RCTScrollView` the sheet
  renders carries `showsVerticalScrollIndicator: false`.
- The toggle's off-state outline is the cards' edge colour, so the off track's
  flattened style reports `borderColor: 'rgba(99, 102, 241, 0.15)'` while the on
  track keeps `#672bcf`.

Alternatives rejected: section 4's "why the obvious fixes are wrong" covers the art
files, the per-site mirror, the bridge snapshot, the per-sheet indicator prop and the
inlined literal.

Concurrency trace: none of the three changes starts work on another thread or shares
mutable state. `Masjid` is memoized with no props in `Day`, so it recomputes the
direction only when it re-renders; every direction change crosses the RTL boundary and
triggers the D59 in-process reload (row 68), which remounts the whole tree including
the mark, so the mount-time read can never lag the drawn layout. The toggle's
`isRTL` is already per-render. The sheet prop is static.

Design review: the three changes share no file and no mechanism; each lands as its own
commit with its own red tests and break script. The simulator proof reads all three on
one face.

**Acceptance criteria:**

- [R1.1] WHEN the mosque mark renders under an RTL locale THE SYSTEM SHALL draw the mark mirrored horizontally on every surface that shows it
- [R1.2] WHILE the locale is an LTR locale THE SYSTEM SHALL draw the mosque mark with no mirror transform, byte-identical to the rendering at 2.0.402
- [R1.3] WHEN the Ramadan variant of the mark renders under an RTL locale THE SYSTEM SHALL mirror it under the same rule as the standard variant
- [R2.1] WHEN a scrollable sheet's content moves THE SYSTEM SHALL draw no vertical scroll indicator on the sheet
- [R2.2] IF a sheet renders with scrollable false THE SYSTEM SHALL render no scroll view, exactly as at 2.0.402
- [R3.1] WHEN a toggle renders in its off state THE SYSTEM SHALL border its track with rgba(99, 102, 241, 0.15), the cards' outer edge colour
- [R3.2] WHEN a toggle renders in its on state THE SYSTEM SHALL keep the on-state border at #672bcf, unchanged from 2.0.402
- [R3.3] WHILE a toggle renders under the Arabic locale THE SYSTEM SHALL keep the thumb travel and the off-state thumb position exactly as ticket 73 landed them

## 6. Steps

Checklist:

- [ ] Step 1: the mosque mark mirrors under RTL (`steps/1-masjid-mirror.md`)
- [ ] Step 2: no scrollbar on any sheet (`steps/2-sheet-indicator.md`)
- [ ] Step 3: the toggle outline takes the card edge colour (`steps/3-toggle-outline.md`)
- [x] Step 4: simulator proof under Arabic (`steps/4-simulator-proof.md`)

Steps 1 and 2 pack one batch (weight 4). Step 3 is the next batch (weight 2, the
session's sixth weight, then rotate). Step 4 dispatches alone (device class), fresh
session, always.

## 7. Device proof

Physical device work is waived by the owner's run order; she is final QA. Step 4
proves the faces on the iOS simulator, dev build with Metro serving (mock data), the
only build class the run order allows:

1. Build and run: `npx expo run:ios` from the worktree root with Metro on its default
   port; the first build prebuilds `ios/` (gitignored, like `android/`) and takes up
   to 15 minutes. Poll in cycles of 15 seconds or shorter; never one sleep above 15.
2. Drive with the `agent-device` MCP: Settings, Language, العربية. The app reloads
   itself on the RTL crossing (D59); wait for the schedule to render again.
3. Read the Standard page: the mark sits on the left, mirrored, its face turned
   inwards. Screenshot, read the image, transcribe.
4. Swipe to Extras: the same mark, the same mirroring. Screenshot, transcribe.
5. Open Settings and scroll: no scrollbar draws at the track's edge. Screenshot,
   transcribe.
6. Transcriptions and the run log land in `LOG.md`. Screenshots never enter a commit;
   they die with the session evidence under `$HOME/athan-gitree/sessions/75/`.

If the simulator cannot render a proof, stop and report; the lead drives the owner's
iPhone XS read-only for the missing read and never installs anything on it.

## 8. Records

`LOG.md` opens with `## Planning (2026-10-14)` and `## Ticket 75`. Every step entry
opens `### Step <NN> — <state>` and ends `session: <ses_id>`.

The queue cell the orchestrator applies on DONE (never applied this run; the run order
forbids it):

> DONE, audited: the mosque mark mirrors under RTL on the locale's own direction (both
> PNG variants, both schedule pages and the error screen on one rule), the sheets'
> shared scroll wrapper hides its indicator (the sweep found the three modal scrollers
> already hidden; the 3T scrollbar she saw predates the RTL work, born in the 1.5.3
> verbatim revert to the sheet library and answered from git), and every toggle's
> off-state outline carries the cards' edge colour rgba(99, 102, 241, 0.15) with
> ticket 73's travel untouched; en and the other locales byte-identical except her two
> global rulings; simulator-proven under ar

Docs commit message for the plan landing:

> 2.0.450 - docs(plans): ticket 75 planned: the mark mirrors under RTL, the sheets
> hide their indicator, the toggle outline takes the card edge

## 9. Push

None. The executor never pushes. This run also never merges `ticket/75` into `uat`
and never pushes the branch: the owner's run order, 2026-10-14. The orchestrator owns
the merge decision after the audit.

## 10. When something goes wrong

| Symptom | Action |
| --- | --- |
| An anchor counts other than 1 | The source drifted. Stop; the lead re-plans the anchor |
| A red test stays red after the change | Stop, return `STOP:` with the failing line |
| A travel test in `Toggle.test.tsx` turns red | The change touched the travel. Revert the step's diff, stop |
| The simulator build fails twice on distinct causes | Stop; the lead decides the iPhone XS read-only fallback |
| A needed surface sits in a sibling-claimed file | Stop; the lead reports to the orchestrator, nobody edits the file |
| `yarn validate` fails on unrelated suites | Record the failing suite and sha; if it fails on `uat` at the anchor too, note it pre-existing and continue only when the failure also exists at `1b0d5229` |

Anticipated review fixes, word for word:

- "The mirror comment restates the travel comment in Toggle.tsx; link the rule, not
  the words." Answer: one line naming the row 73 precedent and the starved-crossing
  cause, no copied paragraph.
- "The indicator claim belongs in a sweep test, not the sheet suite." Answer: the
  sheet suite already owns what the sheet renders; a sweep test would restate the
  modal tests that exist.
- "The colour literal belongs in the plan only; the code keeps the palette key."
  Answer: that is the design; the literal appears in the test as the observable she
  ruled.

Restore lists: each step is one commit on `ticket/75`; restore is
`git revert <sha>` on the same branch, version bumped again.

## 11. Subagents

Planning used `explore`-class facts through the code index; the grill ran
`athan-plan-griller`. Delivery: the lead dispatches `athan-executor` for steps 1 to 3
in batches, `athan-executor` again for step 4 (the simulator proof, alone), and two
`athan-reviewer` passes at audit (plan-conformance and blind). Every worker may call
`vision` for an image it cannot see. Nothing else, ever.

## 12. Report to the owner

Plain sentences: what changed (three rulings, three fixes), what was proven (the jest
suites, the simulator face under `ar`), what waits on her (her QA pass; the queue row
stays open by her run order). Then the progress table and the four-line handoff the
lead's skill defines.
