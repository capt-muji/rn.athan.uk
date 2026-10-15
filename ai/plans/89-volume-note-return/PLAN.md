# Ticket 89: the volume note returns to both sheets at the foot

| Field | Value |
| --- | --- |
| Brief | Queue row 89, `ai/plans/README.md` (owner ruling 2026-10-15, full text in the row) |
| Planned at | `5a3fba84` (uat, 2.0.733), 2026-10-15, lane `lane/89` |
| Planned by | The lead, planning phase, owner interview waived (the row is the interview record) |
| Needs first | nothing |
| Parent | none |
| Group | sheet parts and the six i18n catalogs; row 83's catalog work overlaps at merge time, ruled parallel by the owner's suspension order |
| Batch budget | 2 |
| Session budget | 2 |
| Steps | 1 (weight 2, code) |
| Device | none: the owner reads the sheets herself; no device work runs this stretch |
| Owner decisions still needed | none |

## 1. Goal

The volume note left both sheets at 2.0.729 (`31fb09a4`) and lives only in the Help modal.
Row 64 shipped it (`7c01e5c6`), row 86 moved it under the headers (`5389e92a`), row 87
restyled it (`05eabe6a`, `507256c2`), and her 2.0.729 ruling removed it from the sheets.

Her 2026-10-15 ruling brings it home: an identical note on the alert sheet AND the athan
sound sheet, at the very bottom, below the second reminder, below all content, text
centred horizontally (every line of a wrapped note centred, never left or right), a good
amount of padding lifting it off the body, an information icon beside it, copy
platform-keyed (Android: the alarm volume controls it; iOS: its own documented path,
row 64's wording the base). Styling beyond that is free at planning. The Help question
and its answers stay exactly as they are.

The owner notices by opening either sheet: the note sits at the foot, centred, with its
information glyph. Opening Help shows the volume question unchanged.

Owner rules that apply, quoted from the row and `ai/AGENTS.md`:

- "an identical note lands on the alert sheet AND the athan sound sheet, at the very
  bottom - below the second reminder, below all content - text centred horizontally
  (every line of a wrapped note sits centred, never left or right), a good amount of
  padding lifting it off the body, an information icon beside it, the copy platform-keyed"
- "Supersedes the 2.0.729 removal (the note left the sheets for the Help modal alone; the
  Help question stays)"
- "Visuals are settled. Fixes change behaviour only. Touch no pixel without the owner's
  say." The row's ruling is the owner's say for these pixels; nothing outside the note
  changes.

## 2. Decisions

### 2.1 Taken

| ID | Decision | Who, when | Recorded |
| --- | --- | --- | --- |
| D89.1 | The note is an unconditional last child of both sheets' `Sheet` content, after the alert sheet's body block and after the sound sheet's card block. It also draws under the alert sheet's unavailable message: "below all content" is literal, and the pre-removal note was unconditional too. | Owner ruling (placement), 2026-10-15 | Queue row 89 |
| D89.2 | One zero-prop part, `SheetVolumeNote` in `components/sheets/parts/VolumeNote.tsx`, resolves `t(Platform.OS === 'android' ? 'volume.note.android' : 'volume.note.ios')` inside its render. The identical-note ruling becomes structural: both call sites render `<SheetVolumeNote />`. | Lead, 2026-10-15, from the pre-removal call sites (`31fb09a4` showed the same expression at both) | This section |
| D89.3 | Styling, from the accepted 64/86/87 vocabulary: a centred row (icon beside text, `gap: SPACING.sm`), `marginTop: SPACING.xxl` lifting it off the body, `paddingHorizontal: SPACING.lg`; the text in the sheet-subtitle ink at the detail size in the locale's regular face with `textAlign: 'center'` and `flexShrink: 1`; `Icon.INFO` at size 12 in the same subtitle ink. No divider rule: her 2.0.729 ruling removed "the note and its divider", and the return ruling names icon, centre and padding only. | Lead, 2026-10-15, from `COLORS.text.sheetSubtitle`, `TEXT.sizeDetail`, the `typographyFor` house pattern, `Settings.tsx:190`'s Icon.INFO precedent | This section |
| D89.4 | Copy: the two keys return byte-identical to their last live state (2.0.728, `507256c2`): en `'Plays at alarm volume, not ring volume.'` and `'Follows your Ringer & Alerts volume. Silent and Focus modes mute it.'`, plus the five translations as last translated. That state IS row 64's wording with her row 87 reword of the iOS line; rolling the reword back would undo a ruling she took after row 64. | Lead, 2026-10-15, from `git show 31fb09a4` (the removal preserves the exact bytes) | This section |
| D89.5 | The catalog lock is re-taken with `yarn i18n:lock` (a deliberate English change whose translations ride unchanged from their last live state), the two `PINNED_LITERALS` entries return to `shared/__tests__/i18n.test.ts`, and `sheets/parts/VolumeNote.tsx` joins the typography sweep inventory. | Lead, 2026-10-15, from the removal's own diff | This section |
| D89.6 | No device proof, no visual beyond the note: this stretch bans device work, and the row pins every pixel it cares about. | Lead, 2026-10-15, from the lane order | This section |

### 2.2 The executor must not decide

- Any styling byte beyond section 5 and the step's contracts: colour, size, spacing,
  alignment, icon size. If the rendered note cannot satisfy a criterion without a style
  this plan does not give, `STOP:` with the question.
- Any copy byte. The catalog values are given verbatim; a wording change is the owner's.
- Whether the Help modal changes. It does not.

## 3. Pre-flight

`scripts/preflight-89.sh` in this folder, run per its header. It checks the lane
checkout at `$HOME/athan-gitree/lanes/89` on `lane/89`, a clean tree, HEAD descending
from `5a3fba84`, a version above 2.0.733, row 89 READY in the queue, and every anchor
counting exactly 1. It prints `PREFLIGHT OK`.

## 4. Background the executor needs

The lane worktree is the only working tree: `$HOME/athan-gitree/lanes/89`, branch
`lane/89`. `node_modules` is a symlink; never install. Husky hooks run natively in the
lane (`.husky/_/pre-commit` generated there); every commit passes
`check-identifiers`, `lint-staged`, `yarn validate` and `check-changed-coverage`.
Branches for the step go off `lane/89` and merge `--no-ff` back into `lane/89`.

Code map (anchors under `scripts/anchors/`, each verified to count 1 at `5a3fba84`):

| File | Role |
| --- | --- |
| `components/sheets/screens/Alert.tsx` | The alert sheet. `Sheet`'s children: the unavailable block, then the `AlertSheetBody` block (two `ReminderCard`s). The note lands after the body block. Anchor `alert-sheet-children.txt`. |
| `components/sheets/screens/Sound.tsx` | The athan sound sheet. `Sheet`'s children: the `soundListReady` card block holding the 32 rows. The note lands after it. Anchor `sound-sheet-card.txt`. |
| `components/sheets/parts/index.ts` | The parts barrel; gains the `VolumeNote` export. Anchor `parts-index.txt`. |
| `components/sheets/parts/Sheet.tsx` | Read only. Children render under `Header` inside the column; the content padding already adds `SPACING.xxxl + 50` below the last child, so the note needs no bottom margin. |
| `components/ui/Icon.tsx` | `IconView` renders the svg map; `Icon.INFO` is `info.svg`, findable in tests as `svg:info`. |
| `shared/i18n/en.ts` and `ar.ts`, `hi.ts`, `ms.ts`, `so.ts`, `th.ts` | The six catalogs. Both keys re-enter between `help.step.dndAccess` and `help.q.volume` in each, their 2.0.728 positions. Anchors `<locale>-volume-keys.txt`. |
| `shared/i18n/catalog-lock.json` | The en-catalog hash per translated locale; the key restore changes it, so `yarn i18n:lock` re-takes it. |
| `shared/__tests__/i18n.test.ts` | The en byte pins; the two entries return between the `help.step.dndAccess` and `help.q.volume` pins. Anchor `i18n-pins.txt`. |
| `components/__tests__/typographySweep.test.tsx` | The per-locale sweep inventory; every file with text styles must resolve through `typographyFor`, so the new part joins the inventory. Anchor `sweep-inventory.txt`. |
| `components/sheets/screens/__tests__/Alert.test.tsx` | The alert sheet suite; the note tests re-enter after the first render test of the Standard describe. Anchor `alert-test-anchor.txt`. |
| `components/sheets/screens/__tests__/Sound.test.tsx` | The sound sheet suite; the note tests re-enter after the rows-warm test. Anchor `sound-test-anchor.txt`. |

Existing tests and what they prove: the suites cover both sheets' full behaviour today
with no note; `catalogLock.test.ts` fails until the lock matches the restored en;
`i18n.test.ts` pins en bytes; the sweep guards per-locale typography. The removal
commit's test hunks (in `31fb09a4`) are the vocabulary this plan restores, adapted to
the foot placement.

Why the obvious fix is wrong: resurrecting `SheetNote` verbatim would rebuild the header
footnote (negative `marginTop`, hairline rule, left-aligned inset text) that her 86-87
iteration produced and her 2.0.729 ruling removed together with the note. The return
ruling describes a different object: a footer, centred, with an icon. Copying the Help
answers instead is also wrong: they are modal prose, and the ruling names row 64's
wording.

## 5. Design

One new zero-prop part owns the note end to end: copy resolution, platform keying,
icon, centring, padding. Both sheets render it as their unconditional last child. The
invariant a test checks: both sheets' serialised render order ends with the note, the
note's text style centres every line, the en bytes pinned by the i18n suite hold, the
five translations carried by the step's verbatim lines and the review's byte-for-byte
read, and the lock matches the restored en catalog.

Alternatives rejected:

- The call-site platform expression of 2.0.719 (`<Note text={t(Platform.OS === ...)} />`):
  duplicates the keying at two call sites; a zero-prop part makes "identical on both
  sheets" structural. Rejected.
- Keeping the divider rule from row 87's styling: her removal ruling named "the note and
  its divider" as what left; the return ruling does not bring the divider back. Rejected.
- New wording or new translations: the ruling sets row 64's wording as the base, and the
  2.0.728 bytes are that base plus her own row 87 reword. New translations would need her
  verification (row 64's copy veto is still open with her). Rejected.
- A styled footnote inside each screen's own styles: two copies of the same styling; a
  shared part already exists as the house pattern (`Sheet`, `Header`, `SegmentedControl`).
  Rejected.

Concurrency: none. The part is pure render, no state, no effects, no subscriptions, no
threads.

Design review: the change touches render only; the alert sheet's deferred-commit and
dismiss paths never read the note; the sound sheet's player machinery is untouched. The
coverage gate sees one new source file, covered by its own suite plus both screen suites.

**Acceptance criteria:**

- [R1.1] WHEN the alert sheet renders for an available prayer THE SYSTEM SHALL draw
  exactly one volume note after the second reminder card, before the sheet's own bottom
  padding.
- [R1.2] WHEN `Platform.OS` is `android` THE SYSTEM SHALL draw the note with the text
  `t('volume.note.android')` on both sheets, and WHEN `Platform.OS` is `ios` THE SYSTEM
  SHALL draw the note with the text `t('volume.note.ios')` on both sheets.
- [R2.1] WHEN the athan sound sheet renders with its list ready THE SYSTEM SHALL draw
  exactly one volume note after the last athan row.
- [R3.1] WHILE the note's text is set to any string THE SYSTEM SHALL centre every line
  of it horizontally (`textAlign: 'center'` on the note's text style).
- [R3.2] WHEN either sheet renders THE SYSTEM SHALL draw an `Icon.INFO` glyph beside the
  note text, in the note's own ink.
- [R4.1] WHEN the six catalogs load THE SYSTEM SHALL hold `volume.note.android` and
  `volume.note.ios` in each, byte-identical to the 2.0.728 values listed in the step,
  with `catalog-lock.json` matching the restored en catalog.
- [R4.2] WHEN the en catalog is read THE SYSTEM SHALL answer
  `t('volume.note.android')` = `Plays at alarm volume, not ring volume.` and
  `t('volume.note.ios')` = `Follows your Ringer & Alerts volume. Silent and Focus modes
  mute it.`.

## 6. Steps

- [ ] Step 1 (weight 2, `steps/1-volume-note-foot.md`): the catalogs, the lock, the
  part, both sheets, the tests, one commit. Requirements R1.1 to R4.2.

Batch and session budgets: one step of weight 2 fills one batch and one executor
session. No device step exists.

## 7. Device proof

None. The lane order bans device work for this ticket, and the row's acceptance is the
owner's own read of the sheets on her next build.

## 8. Records

The executor appends to `LOG.md` under `## Ticket 89` (heading exactly that) the step's
measured values: branch, commit sha, version, the hook's `Tests:` line, the four
coverage lines, the break script's last line, the review verdict, the merge sha.

The queue cell the lead applies on DONE:

> DONE 2026-10-15, audited: the platform-keyed volume note returns to both sheets at
> the foot, centred with its information glyph, the 2.0.728 copy bytes restored in all
> six catalogs with the lock re-taken; the Help question untouched.

The executed docs commit message: `<VERSION> - docs(plans): ticket 89 executed: the
volume note returns to both sheets`.

**LOG.md ledger contract:** every step entry in `LOG.md` opens with the heading
`### Step <NN> — <state>` and ends with a line `session: <ses_id>`. Planning sections
use `## Planning (<date>)` and `## Ticket <N>`.

## 9. Push

None. The executor worker never pushes. The lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Meaning | Action |
| --- | --- | --- |
| `catalogLock.test.ts` fails after the key restore | The lock was not re-taken, or en changed beyond the two keys | Run `yarn i18n:lock` from the lane root; if it still fails, en drifted: `STOP:` |
| The VolumeNote suite fails on `svg:info` not found | The icon map entry moved | `STOP:` with the finding; do not swap icons |
| An anchor counts other than 1 | The anchored code changed under the lane | `NEEDS CONTEXT: NEEDS REPLAN, <anchor and count>` |
| `tsc` fails on `t('volume.note.android')` in the new part | The en key restore did not land before the part, or the key spelling drifted | Fix the ordering or spelling to the step's exact lines; anything else is `STOP:` |
| The hook's coverage gate names `VolumeNote.tsx` under 100 | A branch of the platform expression is untested | Add the missing platform side to the part's own suite, never an ignore |
| `git merge` into `lane/89` conflicts | Another commit moved the same lines on the lane | `git merge --abort`, then `STOP:` |

Anticipated review fixes, word for word:

- If the blind reviewer proposes lifting the icon size above 12 or changing the gap:
  reject with D89.3; the ruling leaves styling to this plan and the plan has decided.
- If a reviewer asks for the divider's return: reject with D89.3's second half; the
  removal ruling took the divider with the note and the return names no divider.
- If the plan-conformance reviewer finds the note also drawn under the unavailable
  message and calls it unintended: confirm with D89.1; it is intended.

Per-step restore lists: step 1's are inside the step file.

## 11. Subagents

Planning used the repo's own reading plus git history; the grill ran as one
`athan-plan-griller` dispatch against this folder and the lane worktree. Delivery: the
lead dispatches one `athan-executor` for step 1, then `athan-reviewer` twice (blind, and
plan-conformance with this folder). No other workers.

## 12. Report to the owner

Plain sentences: the volume note is back on both sheets at the foot, centred beside its
information glyph, with the copy and translations she last ruled on; the Help modal is
untouched; tests cover the part, both sheets, the catalog pins and the lock. Then the
progress table and the four-line handoff.
