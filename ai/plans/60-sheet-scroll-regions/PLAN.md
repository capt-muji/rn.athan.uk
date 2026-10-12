# Ticket 60: Modals bounded: every growing region scrolls inside a capped height

| Field | Value |
| --- | --- |
| Brief | Queue row 60, owner ask 2026-10-12, interview taken 2026-10-12 |
| Planned at | uat `c88f50f5`, version 2.0.98, 2026-10-12 |
| Planned by | Planning session 2026-10-12 |
| Needs first | 39 (DONE) |
| Parent | none |
| Group | `components/modals/` alone: no open ticket touches these files (rows 62 and 64 touch catalog keys, not components) |
| Batch budget | 2 (one code step per dispatch) |
| Session budget | 4 (both steps in one executor session) |
| Steps count | 2 |
| Device | none (section 7) |
| Owner decisions still needed | none: D70 to D72 close every question |

## 1. Goal

Owner ask, 2026-10-12: modals can grow taller than the screen in longer
languages. Her rule after the inventory: every modal must be capped, and a
capped modal scrolls its growing region rather than clipping it. Help already
does this and stays untouched. WhatsNew and Update carry no bound at all today:
`Modal.tsx` `styles.modal` has no `maxHeight`, so a long list or message grows
the card past the screen edges, where the centred card clips top and bottom.

What is true when DONE: WhatsNew's item list and Update's message each render
inside a ScrollView bounded to 0.62 of the window height (the Help modal's own
share), the card's fixed parts (heading, version line, Close, both choice
buttons) sit outside the bound, and no pixel changes at today's content lengths
because neither bound engages there.

How the owner notices: she does not, at today's copy. The bound engages the
first time a stamped release list or a longer translation outgrows the share,
and then the region scrolls instead of pushing the card off screen.

The owner's rules that apply:

- "Don't touch the bottom sheets... this is only for all the modals." (D70,
  2026-10-12). No file under `components/sheets/` changes in this ticket.
- "Are they capped? I don't know. I just want them to be if they are not
  already." (D71, 2026-10-12).
- Visuals are settled (`ai/AGENTS.md`): the wrappers render no visible
  difference at today's content lengths, and nothing else moves.

## 2. Decisions

### 2.1 Taken

| ID | What | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D70 | Scope is the modal family only. No bottom sheet changes at all: Alert, Settings, Sound, Language and Qibla keep today's behaviour, including their scrolling headers. | owner | 2026-10-12 | interview, this section |
| D71 | Every modal must be capped. Help is already capped (card `maxHeight` 96%, list share 0.62) and stays untouched. WhatsNew gets the Help pattern. Update's message also gets a bound: the option she picked read "Update stays untouched", but her typed rule covers every modal, so planning rules Update capped with a bound that never engages at today's copy lengths (37 to 60 characters in all six languages, measured 2026-10-12). The report names this so she can strike it. | owner + planning | 2026-10-12 | interview, this section |
| D72 | Font scale needs no owner ruling: both bounds are shares of the window height, so they hold at every text size. The owner declined the question ("I have absolutely no idea what this part means"), and the design removes the dependence. | planning | 2026-10-12 | this section |
| D73 | The share is 0.62 for both regions, Help's own `ANSWERS_HEIGHT_SHARE`, so all three modals carry one number the owner has already seen rendered. | planning | 2026-10-12 | this section |

### 2.2 The executor must not decide

- Any visual change beyond the two wrappers. The wrappers add no visible pixel
  at today's content lengths. Anything else that shifts layout is a `STOP:`
  with the diff.
- Dropping step 2. If the owner strikes the Update bound (D71's open edge), the
  lead amends the queue and the plan; the executor never skips a step on its
  own reading.
- A different share, a card-level `maxHeight` in `Modal.tsx`, or a switch to
  the `wide` card. Section 5 rejects each with the reason.

## 3. Pre-flight

`scripts/preflight-60.sh` in this folder. The executor saves a copy to
`$TMPDIR` and runs it from there. It checks: checkout on `uat`, a clean tree,
`origin/uat` merged in, the version at or above 2.0.98, needs-first row 39
DONE, and the two reference anchors (Help's scroller, Modal's compact card)
each counting exactly 1. The edit-site anchors are checked by their own steps,
because step 1 changes the WhatsNew anchors' source. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

### Code map

| File | Role in this ticket |
| --- | --- |
| `components/modals/Modal.tsx` | The shared card. Read only. `styles.modal` (anchor `modal-compact-card`) has no `maxHeight`; `styles.modalWide` carries `maxHeight: '96%'`. Untouched: a card cap with no inner scroll region would clip the buttons off screen instead of scrolling. |
| `components/modals/Help.tsx` | The pattern to copy. Its list ScrollView (anchor `help-scroller`) carries `maxHeight: height * ANSWERS_HEIGHT_SHARE` with `showsVerticalScrollIndicator={false}`, title and Close outside. Untouched. |
| `components/modals/WhatsNew.tsx` | Step 1 changes it. The item list is a plain `View` (`styles.list`, anchor `wn-styles-list`) between the version line and the Close button (anchors `wn-list-open`, `wn-list-close`). |
| `components/modals/Update.tsx` | Step 2 changes it. The message is a bare `Text` (anchors `update-message`, `update-styles-message`) above the two choice buttons. |
| `components/modals/__tests__/WhatsNew.test.tsx` | Step 1 adds one test beside the existing ten (six `it` singles plus two `it.each` pairs). |
| `components/modals/__tests__/Update.test.tsx` | Step 2 adds one test beside the existing seven. |
| `hooks/useWindowDimensions.ts` | Re-exports React Native's live hook. Help imports it from here; both steps do the same. |

### How the pieces interact

`app/index.tsx` renders all three modals. Each modal is a `Modal` card whose
children the card lays out in a centred column. The card follows its content's
height (`layout={MODAL_RESIZE}`), so an unbounded child grows the card without
limit. Bounding the growing child to a window share bounds the card by
construction: the fixed parts total under 230 dp and the fleet's shortest
window is 731 dp (3T, portrait; a planning-computed value: the panel is
1920 px at density 2.625), so 0.62 plus the fixed parts fits with room to
spare. `app.json` locks `orientation: "portrait"`, so the window height is
always the tall dimension.

### Existing tests and what each proves

- `WhatsNew.test.tsx`: the version heading, every item by title and body,
  platform notes and badges, Close, Android back. The new test proves the
  bound; the existing ones prove the wrapper moved nothing.
- `Update.test.tsx`: the ask, Later and Update, screen-reader roles, Android
  back. Same split of labour.
- `Help.test.tsx:154-162` is the source of the scroller test pattern: the
  scroller has no role, label or text, so the test reaches it by host type
  `RCTScrollView` from `screen.root` and reads the flattened `maxHeight`. The
  style-value read is legal because a rule the app keeps sits beside it.

### Why the obvious fixes are wrong

- A `maxHeight` on `Modal.tsx`'s compact card: it bounds the card but clips
  its content, because the card has no inner scroll region. Bounded and
  unreachable is worse than unbounded.
- Switching WhatsNew to the `wide` card: a visual change to a settled face,
  and the owner approved the scroll pattern, not a card change.
- Leaving Update unbounded because its copy measures short today: copy changes
  with every release and every language, and D71's rule is structural, not
  measured.

### Proven in a scratch worktree 2026-10-12 (planning proof, uat `c88f50f5`)

- Both new tests red on pristine code: `TypeError: Cannot read properties of
  undefined (reading 'maxHeight')` at the flatten line, `1 failed, 10 skipped`
  and `1 failed, 7 skipped`.
- Both suites green after the exact contracts below: `2 passed, 19 passed`.
- `npx tsc --noEmit` exit 0. Biome clean after placing
  `@/hooks/useWindowDimensions` before `@/shared/constants` in `Update.tsx`
  and after `@/components/ui` in `WhatsNew.tsx` (Biome's order, recorded in
  the contracts).
- Break (bound removed from the merged source): the named test fails
  `1 failed, 10 skipped` with `toBeGreaterThan` in the code frame.

## 5. Design

Every growing region inside a modal card is a ScrollView whose style carries
`maxHeight: height * 0.62`, with `showsVerticalScrollIndicator={false}`, and
every fixed part of the card sits outside that ScrollView. A test can check
that: the scroller is reachable by host type and its flattened `maxHeight` is
greater than zero.

Alternatives rejected: section 4's three, plus a shared constant exported from
`Modal.tsx` (rejected: it would couple all three modals to one number through
the shared card, while Help already defines its own local share; three local
constants of equal value carry the owner-approved pattern without touching a
settled surface).

Concurrency trace: none. Both changes are synchronous render-tree changes: no
timers, no subscriptions, no stores. `useWindowDimensions` re-renders on
dimension changes, which portrait locking makes a non-event on phones.

**Acceptance criteria:**

- [R1.1] WHEN the What's New modal is visible THE SYSTEM SHALL bound its item list inside a scroll view whose flattened style carries a maxHeight greater than zero
- [R1.2] WHILE the What's New item list fits inside its bound THE SYSTEM SHALL draw no vertical scroll indicator in the list
- [R2.1] WHEN the update prompt is visible THE SYSTEM SHALL bound its message inside a scroll view whose flattened style carries a maxHeight greater than zero
- [R2.2] WHILE the update message fits inside its bound THE SYSTEM SHALL draw no vertical scroll indicator around the message

## 6. Steps

Checklist:

- [ ] Step 1: WhatsNew's list scrolls inside a bounded share (`steps/1-whatsnew-bounded-list.md`)
- [ ] Step 2: Update's message scrolls inside a bounded share (`steps/2-update-bounded-message.md`)

## 7. Device proof

None. The change alters no pixel at shipped content: WhatsNew renders the
2.0.54 items and Update's message runs 37 to 60 characters in all six
languages, so both bounds sit unengaged, and the suites assert the structure a
device would show. The face the owner approved is the Help modal's scrolling
list, which ships device-proven. The confidence build from row 39's deferred
tail (D41) carries the visual pass across all six languages when it runs.

## 8. Records

The findings text the executor appends to `LOG.md` under
`### Step 01 — done` and `### Step 02 — done` (the ledger contract from
ticket 56: every step entry opens `### Step <NN> — <state>` and ends
`session: <ses_id>`):

- Step 1: branch, commit sha, version, the hook's `Tests:` line and the four
  coverage lines, the red failure line recorded verbatim, the break script's
  last line, the review verdict, the merge sha.
- Step 2: the same fields as step 1.

Queue cell text the lead applies on DONE:

`DONE <date>, audited: both growing modal regions bounded - WhatsNew's release list and Update's message scroll inside 0.62 of the window (Help's own share), fixed parts pinned outside, no pixel moves at today's content; Help untouched, no bottom sheet touched (D70); Update's bound never engages at today's copy (D71)`

Docs commit message for the executed commit:
`<VERSION> - docs(plans): ticket 60 executed: 2 steps, both modal regions bounded`

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews
pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| A named red test passes on pristine code | The test guards nothing | `STOP:` with the test output; planning error |
| `scroller` is undefined after the change | The ScrollView did not render, or the import was dropped | Check the import list against the contract, then `STOP:` if the contract was followed |
| An existing WhatsNew or Update test fails after the wrap | The wrapper changed rendering (the gap move, the margin move) | `STOP:` with the failing assertion; do not edit the failing test |
| Biome flags import order | The contract's order was not followed exactly | Place the import as the contract shows |
| The break prints `BREAK NOT APPLIED` | The substitution did not match the code | `NEEDS_CONTEXT: NEEDS REPLAN, <the break and its output>` |
| The hook `useWindowDimensions` is reported unused | The constant or JSX line was dropped | Re-read the contract; `STOP:` if all lines are present |

Anticipated review fixes, word for word:

- "The `gap` belongs on `styles.list`" — rejected: a ScrollView lays out its
  children in the content container, where the outer style's `gap` never acts.
- "Drop the Update wrapper, the message is short" — rejected: D71 rules every
  modal capped, and copy changes with every release and language.
- "Extract the 0.62 into a shared constant" — rejected: section 5 names the
  reason (no coupling through the settled card).

Restore lists: each step's files are restored with
`git checkout -- <file>` for changed files and deletion of the test additions
by the same route, per the executor's "Stopping part-way" procedure.

## 11. Subagents

Planning used `explore`-class codegraph reads and a scratch worktree; the
`athan-plan-griller` grills this draft. Delivery: the lead dispatches
`athan-executor` for steps 1 and 2 (batch budget 2, one step per dispatch,
both steps in one session, session budget 4) and `athan-reviewer` blind and
plan-conformance for the audit. Every worker may call `vision` for an image it
cannot see. Nothing else.

## 12. Report to the owner

Plain sentences: both growing modal regions are bounded and scroll (WhatsNew's
list, Update's message), Help and every bottom sheet untouched, no pixel moves
at today's content. Update's bound never engages at today's copy; strike it if
you want Update untouched (D71). The progress table, then the four-line
handoff.
