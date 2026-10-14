# 86 Visual polish batch: the sheets' volume note, the list-to-ago gap, the countdown tip, the language-switch loader

## Header table

| Field | Value |
| --- | --- |
| Brief | `ai/plans/README.md`, order 86 (no separate brief file) |
| Planned at | `uat` 024c689b, 2.0.715, 2026-10-14 |
| Planned by | planning session, 2026-10-14 |
| Needs first | nothing |
| Parent | none |
| Group | none |
| Batch budget | 6 (three code steps) |
| Session budget | 6 |
| Steps | 5, every one code (`Weight: 2`) |
| Device | None. The owner's read of the XS dev build is the acceptance bar (her ruling, 2026-10-14) |
| Owner decisions still needed | none, after the interview recorded in section 2 |

## 1. Goal

Six visual defects from the owner's 2026-10-14 test of the XS dev build, plus two items she
closed as already correct. Today: the platform volume note reads badly where it sits on the
alert sheet (at the foot) and the sound sheet (under the notification-sound line); the
Standard schedule's time-ago badge sits too tight under the prayer list; the countdown bar's
tip renders apart from the filled run under Arabic; the language pick shows an in-sheet
"Applying" row while the screens behind visibly refresh; the sheet header's title-to-subtitle
gap runs about 110 device pixels under Arabic against English's 65; and the date block above
the prayer list sits about 24 device pixels lower under Arabic than English.

When DONE the note sits under each sheet's header as a quiet footnote; the Standard badge has
25 percent more room above it; the tip rides the fill's leading edge in each layout
direction; a language pick goes straight to a full-screen purple loader naming the target;
and the two Arabic blocks measure exactly what their English twins measure.

How the owner notices: she opens both sheets, the Standard schedule, the countdown under
Arabic, and the language picker on the XS dev build, and reads them.

Her rules that apply, quoted from the queue row (`ai/plans/README.md`, order 86):

- Item 1: "she wants it RELOCATED on both sheets with the placement and the styling
  rethought, not removed", and "the copy itself is not what this row changes (row 64's
  platform-keyed wording stands: Android the alarm volume, iOS the Ringer and Alerts path
  with the Silent switch and Focus muting it)".
- Item 2: "add about 25 percent more space between the end of the list and the badge".
- Item 3: "the fix lands on the bar's own ground (rows 72/79/84's tip geometry and the fill
  fraction) without touching the countdown numerals".
- Item 4: "she rules it must change to an INSTANT full-screen purple loading state on the
  tap - the same face as the first launch after the splash: whole screen purple, centred
  spinner, one line of text naming the target ... and the user must see nothing of the
  convergence behind it, then the forced relaunch and splash, then the app. This supersedes
  the D51 in-sheet progress face for the language pick".
- Item 7: "the title/subtitle block is measured per locale (the ar line box is record data
  from row 84) and the gap made to match English's compactness".
- Item 8: "tighten the block-to-list gap on both schedules, Arabic the worse case, keeping
  the English block compact".
- Items 5 and 6 are RESOLVED, no change: the toggle outline and the sheet scrollbar are
  correct on the current build.

## 2. Decisions

### 2.1 Taken

| # | Decision | Who | When | Where recorded |
| --- | --- | --- | --- | --- |
| D86.1 | The volume note moves to directly under each sheet's header, above the first card, on both sheets. One place on every sheet. | owner | 2026-10-14, interview | this plan, step 2 |
| D86.2 | The note's treatment: a plain quiet footnote - smallest text, muted ink, no glyph, a hairline divider above it. | owner | 2026-10-14, interview | this plan, step 2 |
| D86.3 | The 25 percent lands on the Standard schedule's list margin only, 22.5 to 28. The Extras margin stays at 34. | owner | 2026-10-14, interview | this plan, step 3 |
| D86.4 | The countdown bar mirrors with the layout: under Arabic the fill grows from the track's right edge and the tip rides the fill's leading (left) edge; English keeps today's left-to-right fill and returns the pre-change tip value for every progress. | owner | 2026-10-14, interview | this plan, step 4 |
| D86.5 | The loader's line is a new catalog key `language.changing`, reading "Setting {language} language" in English and translated in all six catalogs, with the lock re-taken. | owner | 2026-10-14, interview | this plan, step 5 |
| D86.6 | The line is written in the target language, and `{language}` takes the picker list's native name. | owner | 2026-10-14, interview | this plan, step 5 |
| D86.7 | The line carries a maximum width, so a long sentence breaks onto two centred lines rather than one screen-wide line. | owner | 2026-10-14, interview | this plan, step 5 |
| D86.8 | The in-sheet "Applying" row and the `language.applying` key both go. | owner | 2026-10-14, interview | this plan, step 5 |
| D86.9 | The loader covers every pick, a same-direction pick included, and stays until the convergence settles. | owner | 2026-10-14, interview | this plan, step 5 |
| D86.10 | The loader mounts in the same tick as the tap, with the sheet's close playing behind it; nothing of the convergence shows. | owner | 2026-10-14, interview | this plan, step 5 |
| D86.11 | Items 7 and 8: the Arabic block geometry is pinned to the Latin default, so it renders what English renders at the same tokens. The English styles keep their font's own line box, so no English pixel moves. | owner | 2026-10-14, interview | this plan, step 1 |
| D86.12 | No executor device step; her XS read is the acceptance bar. | owner | 2026-10-14, interview | this plan, section 7 |
| D86.13 | The copy deletes of `language.applying` and the addition of `language.changing` take the catalog lock with them. | planning | 2026-10-14 | this plan, step 5, `shared/__tests__/catalogLock.test.ts` |
| D86.14 | Step 1 lands before step 2, because the note's own line box takes the same locale rule. | planning | 2026-10-14 | this plan, section 6 |

### 2.2 The executor must not decide

None. Every placement, value, wording and test the steps need is given verbatim. A command
that prints something the plan does not predict, or a file that does not hold its anchor
exactly once, is `STOP:` or `NEEDS_CONTEXT: NEEDS REPLAN` per the executor's own rules.

## 3. Pre-flight

`scripts/preflight-86.sh` in this folder. The executor copies it to `$TMPDIR` and runs it
from the repository root with `bash`. It checks the checkout on `uat`, a clean tree,
`origin/uat` merged in, the version not below 2.0.715, and every anchor counting exactly 1 in
its source file, each 3 to 15 lines. It ends `PREFLIGHT OK`.

## 4. Background the executor needs

The code map. Every file the plan reads or changes, one line each. Anchors are under
`scripts/anchors/` and were verified at `uat` 024c689b.

| File | Role |
| --- | --- |
| `components/sheets/parts/Header.tsx` | Every sheet's title and subtitle. Both take their family and size from the locale record, and neither sets a line height, so the font's own box decides the gap. Anchor `header-type-styles.txt`. |
| `components/day/Day.tsx` | The date and location block above the list. Both lines take `ty.scriptLineHeight?.(n)`, which is 1.5x for ar and absent for Latin. Anchor `day-type-styles.txt`. |
| `shared/typography.ts` | The locale record: family, size, line height, letter spacing, `wordFace` and `scriptLineHeight`. Anchor `typography-script-line.txt`. |
| `components/prayer/Explanation.tsx` | The one other `scriptLineHeight` consumer. It keeps the 1.5x box: its Arabic strings carry diacritics, which is why the taller box exists. Step 1 does not touch it. |
| `components/sheets/screens/Alert.tsx` | The alert sheet body: the Athan card, two reminder cards, then the volume note as a trailing `Text`. Anchor `alert-note-foot.txt`. |
| `components/sheets/screens/Sound.tsx` | The athan sound sheet: one card holding the notification-sound line, the same volume note, and the 32-row list. Anchor `sound-note-in-card.txt`. |
| `components/sheets/parts/Sheet.tsx` | The shared sheet wrapper. It renders `Header` then `children`, so a note placed as the first child sits under the header on every sheet. |
| `components/sheets/parts/index.ts` | The parts barrel the screens import from. |
| `components/prayer/List.tsx` | The prayer list. Its container carries `marginBottom: SPACING.xxxl * 0.75` (22.5) for Standard and 34 for Extras. Anchor `list-container.txt`. |
| `app/Screen.tsx` | Renders `Countdown`, `Day`, `List`, then `PrayerAgo` when the time-passed preference is on. The list-to-badge gap is the list's bottom margin plus the badge's own `marginTop: -SPACING.xs`. |
| `components/prayer/Ago.tsx` | The time-ago badge. Its `marginTop` stays as it is. |
| `components/countdown/tipGeometry.ts` | `tipLeftForProgress`, the pure tip geometry, clamped to the track. It has no notion of direction today. Anchor `tip-geometry.txt`. |
| `components/countdown/Bar.tsx` | The bar. The fill is an absolute child with no insets; the tip's `left` is the physical value the pure function returns. Anchors `bar-tip-style.txt`, `bar-fill-style.txt`. |
| `shared/i18n/locale.ts` | `localeDirection`, `currentLocaleId`, `localeVersionAtom`, `setActiveLocale`. `directionGlyph` is the proven pattern for a render-time direction read. |
| `components/sheets/screens/Language.tsx` | The language sheet. It reads `languageCommitBusyAtom` and draws the in-sheet "Applying" row on the active row. Anchor `language-applying-row.txt`. |
| `components/sheets/screens/languageSheet.ts` | `pickLanguage`, the pure pick flow: commit, then dismiss. Anchor `pick-language.txt`. |
| `stores/language.ts` | `languageCommitBusyAtom` brackets the commit; `commitLanguagePreference` persists, switches, converges, then relaunches on a direction crossing. Anchor `language-busy-atom.txt`. |
| `app/_layout.tsx` | The root: the direction style, `InitialWidthMeasurement`, `BottomSheetModalProvider` holding `Slot` and `SheetHost`. Anchor `layout-sheet-host.txt`. |
| `app/index.tsx` | The launch face: a full-screen `View` with a centred `ActivityIndicator` while `waitingForData`. The loader's face matches it. |
| `shared/languageNames.ts` | `LANGUAGE_NAMES`: each language in its own name, the picker's rows and the loader's `{language}` source. |
| `shared/i18n/index.ts` | The read surface. `ParamsOf` types every `{token}` a key takes, so a new tokened key needs a branch there or tsc refuses the call. |
| `shared/i18n/en.ts` and its five siblings | The six catalogs. `language.applying` sits beside `settings.language` in each. Anchor `catalog-applying-key.txt`. |
| `shared/i18n/catalog-lock.json` | The six catalogs' hash, re-taken by `yarn i18n:lock` and asserted by `shared/__tests__/catalogLock.test.ts`. |
| `scripts/check-directional-styles.js` and `scripts/directional-styles-allowlist.json` | The gate that bans physical `left:` and `right:` style keys across `components/`, with one allowlist entry per deliberate site. |
| `shared/__tests__/i18nBridge.test.ts` | The bridge suite that pins the sorted list of tokened en keys and each key's tokens. |
| `components/ui/index.ts` | The UI barrel the root imports from. |

The existing tests and what each proves:

| Test | Proves |
| --- | --- |
| `components/__tests__/typographySweep.test.tsx` | Every inventory file resolves its text styles through `typographyFor`, no raw `TEXT.family` survives, and the probed surfaces render the pinned families and sizes under ar and en. Its `isolateModules` probe shape is the template for the new style probes. |
| `components/countdown/__tests__/tipGeometry.test.ts` | The tip stays inside the track at both ends and across the range, the unclamped formula overhangs, ordinary positions are untouched, and the left value never moves backwards as progress grows. |
| `components/countdown/__tests__/Bar.test.tsx` | The bar's accessibility and its preview geometry. |
| `components/prayer/__tests__/List.test.tsx` | The list renders its rows in display order and measures itself on the Standard schedule. |
| `components/sheets/__tests__/Language.test.tsx` | The language sheet lists the six names, marks the active row, and shows the applying row while the commit runs. |
| `components/sheets/screens/__tests__/Alert.test.tsx` | The alert sheet's cards, its permission path and its deferred commit. |
| `components/sheets/screens/__tests__/Sound.test.tsx` | The sound sheet's list, its preview player and its draft commit. |
| `__tests__/app/_layout.test.tsx` | The root renders the provider, the slot and the sheet host. |
| `shared/__tests__/catalogLock.test.ts` | The six catalogs' hash matches `catalog-lock.json`. |
| `shared/__tests__/i18nBridge.test.ts` | The sorted list of tokened en keys and each key's tokens. |

Why the obvious fix is wrong:

- Item 7 and 8, "just delete the ar line height". `Day.tsx`'s `scriptLineHeight` and the
  Header's absent line height are two different causes. `Day.tsx` sets a tall 1.5x box for
  ar; the Header sets none, so the Arabic font's own metrics decide. Deleting the `Day.tsx`
  value gives ar the font's own box, which is taller than the Latin default, and leaves the
  Header untouched. Both surfaces must take one pinned box instead.
- Item 3, "move the tip with a transform". A transform mirrors about the element's own
  centre, so it moves the tip without moving the fill, and the fill is laid out by Yoga, not
  by a transform. The fill's anchor and the tip's left must be computed from the same
  direction.
- Item 4, "keep the sheet open and cover it with a view". The sheets do render in the app's
  own tree, through the provider's portal and hosting container, so a view mounted after the
  provider paints above them. The point is the tick, not the stacking: the pick dismisses the
  sheet and mounts the loader together, so nothing of the convergence shows behind either.

## 5. Design

Approach and its invariant, as one sentence a test can check: **every locale-dependent
measurement is taken from the locale record or the app locale, never from the font's own
metrics or the system direction, so two locales at the same tokens render the same block and
one locale's fill and tip always agree.**

- The locale line box: a new record field `blockLineHeight`, answering the pinned ratio on
  the Arabic record and `undefined` on the Latin records. Its ratio is Roboto's own ascent
  plus descent (2400/2048 = 1.171875), rounded to the whole point, so the Arabic box measures
  what the Latin default measures and no Latin value is written. Consumers are the sheet
  header's title and subtitle, the day block's location and date, the new note, and the
  loader's own line.
- The direction: read at render time from the app locale, exactly as `directionGlyph` does.
  The bar passes it into the pure tip geometry as an argument, because a worklet cannot call
  the locale module.

Alternatives rejected:

- A shared `note` prop on `Sheet`: the note is content, not chrome, and only two sheets carry
  it, so the sheet wrapper would gain a prop every other sheet passes `null` to.
- Reusing `scriptLineHeight` for the header and the day block: its 1.5x ratio is what makes
  the Arabic blocks taller than English's in the first place.
- Rendering the loader through React Native's `Modal`: the sheet layer already lives in the
  app's own tree, so a plain sibling mounted after the provider paints above it. A second
  native modal adds a presentation race and buys nothing.
- Splitting the header title and the day block into two steps: one rule, two consumers, one
  invariant.

Concurrency trace:

- A pick runs `dismiss()` then `commit(id)` in one tick. `commitLanguagePreference` sets
  `languageCommitBusyAtom` and `pendingLanguageAtom`, persists the preference, calls
  `setActiveLocale`, and then awaits convergence. The loader renders once with the target
  locale already active, so its line is in the target language.
- A crossing pick then calls `forceRTL` and `Updates.reloadAsync`. The reload starts a fresh
  JS context, where both atoms hold their initial values, so the loader unmounts and the
  splash takes over.
- A same-direction pick settles, the `finally` clears both atoms, and the loader unmounts.

Design review: the two atoms the loader reads are cleared in a `finally`, so no path can
strand the loader on screen. The bar's direction is read at render, and a crossing pick
relaunches the context, so no stale direction can survive a switch.

**Acceptance criteria:**

- [R1.1] WHEN the sheet header renders under any shipped locale THE SYSTEM SHALL give the title and the subtitle the same line box heights in points under ar as under en.
- [R1.2] WHEN the day block renders under any shipped locale THE SYSTEM SHALL give the location and the date the same line box heights in points under ar as under en.
- [R1.3] WHEN the active locale is Latin THE SYSTEM SHALL leave the header's and the day block's line heights unset, so the font's own box serves as it does today.
- [R1.4] WHEN the line boxes are pinned THE SYSTEM SHALL keep the header title's family and size and the day block's families and sizes unchanged.
- [R2.1] WHEN the alert sheet opens THE SYSTEM SHALL show the platform volume note between the header and the Athan card.
- [R2.2] WHEN the athan sound sheet opens THE SYSTEM SHALL show the same note between the header and the sound card.
- [R2.3] WHEN the note renders THE SYSTEM SHALL draw it exactly once per sheet, with a hairline divider above it and no card background.
- [R2.4] IF the platform is Android THE SYSTEM SHALL show the alarm-volume wording, and IF the platform is iOS THE SYSTEM SHALL show the Ringer and Alerts wording.
- [R3.1] WHEN the Standard schedule renders THE SYSTEM SHALL give the list container a 28-point bottom margin.
- [R3.2] WHEN the Extras schedule renders THE SYSTEM SHALL leave its list container's bottom margin at 34 points.
- [R4.1] WHILE the layout direction is left to right THE SYSTEM SHALL place the tip's centre 0.9 points to the left of the fill's leading edge, clamped inside the track.
- [R4.2] WHILE the layout direction is right to left THE SYSTEM SHALL anchor the fill to the track's right edge and place the tip's centre 0.9 points to the right of the fill's leading (left) edge, clamped inside the track.
- [R4.3] WHEN the layout direction is right to left THE SYSTEM SHALL keep the tip's left within the track's half-oval bounds at both ends of the range.
- [R4.4] WHILE the colour picker previews a bar THE SYSTEM SHALL apply the same direction rule.
- [R4.5] WHEN the layout direction is left to right THE SYSTEM SHALL return the pre-change left value for every progress.
- [R5.1] WHEN a language row other than the active one is tapped THE SYSTEM SHALL dismiss the sheet and show the full-screen loader in the same tick.
- [R5.2] WHILE the loader shows THE SYSTEM SHALL fill the screen with the root purple and centre the spinner and one line of text.
- [R5.3] WHEN the loader's line renders THE SYSTEM SHALL write it in the target locale and name the pick with the language list's native name.
- [R5.4] WHEN the loader's line is wider than its maximum width THE SYSTEM SHALL wrap it onto two centred lines without clipping it.
- [R5.5] WHEN a pick does not cross the direction boundary THE SYSTEM SHALL keep the loader up until the convergence settles, then reveal the app.
- [R5.6] WHEN the sheet's active-language row is tapped THE SYSTEM SHALL dismiss the sheet and show no loader.
- [R5.7] WHEN the loader shows THE SYSTEM SHALL render no in-sheet applying row.
- [R5.8] WHEN the catalogs are locked THE SYSTEM SHALL carry `language.changing` in all six locales and SHALL carry no `language.applying` key.

## 6. Steps

Checklist:

- [x] 1. The locale line box for the sheet header and the day block — `steps/1-locale-line-box.md`
- [x] 2. The volume note moves under each sheet's header — `steps/2-volume-note.md`
- [x] 3. The Standard list-to-ago gap — `steps/3-list-gap.md`
- [ ] 4. The countdown tip mirrors with the layout — `steps/4-tip-mirror.md`
- [ ] 5. The language-switch loader — `steps/5-language-loader.md`

Versions: 2.0.717, 2.0.718, 2.0.719, 2.0.720, 2.0.721 in step order, one patch per step,
each taken under the version lock from `uat`'s `package.json` at the moment of the commit.
The ladder is indicative: the version that matters is always the next patch after `uat`'s,
because concurrent lanes take numbers too.

## 7. Device proof

None. The owner ruled on 2026-10-14 that no executor device step runs and her read of the XS
dev build (Metro serving, the build the owner tests) is the acceptance bar for all five
steps. The executor proves the behaviour at unit level, and the plan's report to the owner
names which criteria only glass can settle: the note's rendering (R2.1 to R2.4), the bar's
tip under Arabic (R4.1, R4.2, R4.4), the loader's face and wrapping (R5.1, R5.2, R5.4), and
both Arabic block gaps (R1.1, R1.2).

## 8. Records

`LOG.md` findings text, under the heading `## Ticket 86`, written by the executor at
Finishing:

```
Five steps landed. 1: the locale line box pinned on the Arabic record (blockLineHeight,
1.172x) and consumed by the sheet header and the day block. 2: the platform volume note moved
under each sheet's header as a quiet footnote. 3: the Standard list's bottom margin 22.5 to
28. 4: the countdown tip mirrored with the layout, the fill anchored per direction. 5: the
full-screen language loader, the in-sheet applying row and its catalog key deleted.
```

Queue cell text the lead applies on DONE (the fifth column of order 86):

```
DONE 2026-10-<dd>, audited: <the audit's own summary>. Steps 2.0.717 to 2.0.721
```

Docs commit message at Finishing:

```
<VERSION> - docs(plans): ticket 86 executed: the visual polish batch
```

## 9. Push

None. The executor worker never pushes; the lead pushes after the reviews pass.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| A step's anchor counts 0 or 2 in its source | The anchored code moved since 2.0.715 | `NEEDS_CONTEXT: NEEDS REPLAN, <anchor and count>`. Never repair an anchor by hand. |
| `yarn i18n:lock` writes a hash different from the committed one after only the step-5 catalog edits | A catalog key other than the step's two edits changed | `STOP:` with the lock diff. |
| `catalogLock.test.ts` fails after step 5 | The lock was not re-taken, or `dist` was not regenerated | Run `yarn i18n:lock` then `yarn i18n:export`, and commit `shared/i18n/catalog-lock.json`. `dist/` is gitignored. |
| A step in `steps/1` prints a `lineHeight` number on the en style | The Latin record's `blockLineHeight` returned a number instead of `undefined` | Make `LATIN`'s entry `blockLineHeight: () => undefined`; only `ARABIC` carries the ratio. |
| `tipLeftForProgress` is called with one argument anywhere | A call site missed in step 4 | The function takes two required arguments; every call passes a boolean. |
| `node scripts/check-directional-styles.js` lists a new `left:` or `right:` line | The allowlist entry the step adds does not match the line the step writes | Run the command, copy the printed line's exact text into the entry's `snippet`, and rerun. |

Anticipated review fixes, word for word:

- "`shared/i18n/en.ts` uses a curly apostrophe; the phrase has none, so the copy is fine."
- "`pendingLanguageAtom` is cleared in the same `finally` as the busy atom, so no path
  strands the loader."
- "The `dist` folder is gitignored, so no `dist` file is committed."
- "`components/prayer/Ago.tsx` is untouched; the gap is the list's margin."

Per-step restore lists:

- Step 1: `shared/typography.ts`, `components/sheets/parts/Header.tsx`,
  `components/day/Day.tsx`, `components/__tests__/typographySweep.test.tsx`,
  `components/day/__tests__/DayLines.test.tsx`.
- Step 2: `components/sheets/parts/Note.tsx` (new, delete it),
  `components/sheets/parts/index.ts`, `components/sheets/screens/Alert.tsx`,
  `components/sheets/screens/Sound.tsx`, `components/sheets/parts/__tests__/Note.test.tsx`
  (new, delete it), `components/sheets/screens/__tests__/Alert.test.tsx`,
  `components/sheets/screens/__tests__/Sound.test.tsx`,
  `components/__tests__/typographySweep.test.tsx`.
- Step 3: `components/prayer/List.tsx`, `components/prayer/__tests__/List.test.tsx`.
- Step 4: `components/countdown/tipGeometry.ts`, `components/countdown/Bar.tsx`,
  `components/countdown/__tests__/tipGeometry.test.ts`,
  `components/countdown/__tests__/Bar.test.tsx`,
  `scripts/directional-styles-allowlist.json`.
- Step 5: `components/ui/LanguageLoader.tsx` (new, delete it),
  `components/ui/index.ts`, `components/ui/__tests__/LanguageLoader.test.tsx` (new, delete
  it), `app/_layout.tsx`, `stores/language.ts`, `shared/languageNames.ts`,
  `shared/i18n/index.ts`, `components/sheets/screens/Language.tsx`,
  `components/sheets/screens/languageSheet.ts`, `components/sheets/__tests__/Language.test.tsx`,
  `shared/__tests__/i18n.test.ts`, `shared/__tests__/i18nBridge.test.ts`,
  `components/__tests__/typographySweep.test.tsx`, the six catalog files,
  `shared/i18n/catalog-lock.json`.

Every step restores `app.json`, `package.json` and `android/app/build.gradle` with
`git checkout --`, and deletes any file the step created.

## 11. Subagents

Planning: `explore` workers answer fact questions, `athan-plan-griller` grills the draft,
`vision` reads an image the planner cannot. Delivery: the lead dispatches the
`athan-executor` and `athan-reviewer` workers. Every worker may call `vision` for an image it
cannot see. Nothing else, ever.

## 12. Report to the owner

Five steps, all code. The executor lands one branch, one commit and one version per step,
merges each into `uat` and never pushes. What is proven at unit level: the Arabic line boxes
equal the Latin ones (R1.1 to R1.4), the note renders once on each sheet with its platform
wording (R2.1 to R2.4), the Standard list carries 28 (R3.1, R3.2), the tip mirrors and the
English values are byte-identical to the pre-change ones (R4.1 to R4.5), and the loader's
mount, copy, wrapping and clearing (R5.1 to R5.8). What waits for her read: the four glass
criteria section 7 names. Decisions waiting on the owner: none.
