# 108: the Rubik cascade - the sheets' pulls, the label gap, the footer clip

| Field | Value |
| --- | --- |
| Brief | The Rubik cascade: the sheets' pulls, the label gap, the footer clip |
| Planned at | `1f534a97` (2.0.824), 2026-10-16 |
| Planned by | The planning phase, this session (the interview waived by the owner's order 2026-10-16: work autonomously, ask nothing; her rulings read from the ticket text) |
| Needs first | nothing |
| Parent | nothing |
| Group | none: `Header.tsx`, `Qibla.tsx`, `Sound.tsx`, `Day.tsx`, `VolumeNote.tsx` and their tests are shared with no open ticket |
| Batch budget | 2 |
| Session budget | 8 |
| Steps | 3 (all code, weight 2 each) |
| Device | none in-plan: JS styling only; the owner's XS read under ar is the visual acceptance, batched at delivery |
| Owner decisions still needed | none: D108.1 to D108.5 taken, section 2.1; the rides from row 104's audit stay pending her call, out of scope by the ticket's own words |

## 1. Goal

Rubik replaced Noto as the Arabic face at 2.0.811 (row 106). The owner's pass-two read on that
build found four cascades the Noto-tuned surfaces carry, plus row 106's own follow-up. (1) The
sheets' -10 subtitle pull-ups (row 87's pattern, tuned against Noto's 2.112em box) now MERGE the
subtitle into the title on the settings, alert and sound sheets under Rubik's 1.185em box. (2)
The qibla sheet carries the same pull-up copy and joins the sweep. (3) The sound sheet's
notification-sound label sits too close to the first list row under ar. (4) The volume footnote
clips Arabic descenders at its bottom under Rubik. (5) The location-date gap under Rubik is
nearly perfect and wants a small dialled gap.

When DONE: under ar every sheet subtitle sits a small positive gap under its title with the -10
pulls gone; the qibla sheet matches; the sound list sits clear of its label; the location-date
gap reads one step wider; the footnote's descenders render whole. Under en and the other four
locales every touched surface renders byte-identically to 2.0.824. The owner notices on her
read.

Owner rules that apply, quoted from their source:

- Her ruling, ticket 108 item 1: "REVERT the negative pulls to the normal line height and give
  a small gap instead, the same treatment as the location-date dial."
- Her ruling, ticket 108 item 3: "push the list down for a gap" (the sound label).
- Her ruling, ticket 108 item 4: "planning measures why the shorter box clips there" (the
  footnote).
- `ai/AGENTS.md`: "Visuals are settled. Fixes change behaviour only. Touch no pixel without
  the owner's say." Every change here is her say, item by item; nothing else moves.
- Row 106's warning, hers: no line-height pin that clips. The footnote's script line box ADDS
  room; it never cuts.
- Row 102 item 6, her scalability law: no per-language spacing values where one value serves.
  The sound label gap joins en at one value; the values her 87/106 pattern already keys per
  locale (the subtitle gap, the date gap) keep the compactArabic key.

## 2. Decisions

### 2.1 Taken

- D108.1 (owner, ticket 108 item 1, 2026-10-16): the subtitle pull-ups die. `Header.tsx`
  subtitle `marginTop: compactArabic ? -10 : SPACING.xs` becomes `compactArabic ? SPACING.py :
  SPACING.xs` (ar +6, en 4 unchanged); the title's `marginBottom: compactArabic ? 0 :
  SPACING.xxs` keeps its ar 0, the small gap riding the subtitle's own margin exactly as the
  location-date dial rides the first line's. 6 is a recorded default; her read dials.
- D108.2 (owner, ticket 108 item 2): the qibla sheet joins through its own subtitle style
  (`Qibla.tsx` `marginTop: compactArabic ? -10 : SPACING.xs` to `compactArabic ? SPACING.py :
  SPACING.xs`), one value, matching the shared header.
- D108.3 (owner, ticket 108 item 3): the sound sheet's list gap: `Sound.tsx`
  `marginTop: compactArabic ? 6 : SPACING.md` becomes `SPACING.md` plain - the compactArabic
  branch dies at the site, ar joins en at 12, and the D94 Noto tightening is dead ground.
- D108.4 (owner, ticket 108 preamble plus row 106's follow-up): the location-date dial:
  `Day.tsx` location `marginBottom: compactArabic ? SPACING.py : SPACING.quart` becomes
  `compactArabic ? SPACING.sm : SPACING.quart` (ar 6 to 8, en 5 unchanged).
- D108.5 (owner, ticket 108 item 4; the measurement is the planner's): the footnote's
  descender room. Measured from the bundled TTFs' own tables: Rubik-Regular carries hhea ascent
  935, descent -250, lineGap 0 (a 1.185em line box with 0.250em of descent) against OS/2
  usWinDescent 466 (0.466em of ink below the baseline): at the note's 14 points the ink
  descends 6.5px while the box reserves 3.5px, 3.0px of ink outside the box, which the shorter
  box cuts where Noto's 2.112em box buried it in leading. Roboto-Regular's own excess at the
  same size is 0.08px, which is why the en note never clipped. The fix is the record's script
  line box, the treatment that already carries the Help questions (23 at 15) and the overlay
  explanation (24 at 16), both owner-confirmed whole: the note's text takes `lineHeight:
  ty.scriptLineHeight?.(TEXT.sizeDetail)` - ar 21, en undefined (no key, byte-identical).

The interview was waived by the owner's order 2026-10-16 ("don't talk to me, don't ask me any
questions... work autonomously"). Every ruling above is her ticket text; every value she did
not pin is a recorded default under her read, the row-106 pattern.

### 2.2 The executor must not decide

- Any value not named above. A read that wants a different number is a STOP: the question is
  "D108.<n> pins <value>; the read wants <observed>; dial it or keep it?", asked by the lead at
  the owner's next moment, never by the executor.
- Any surface not named above. A cascade the executor finds on another sheet is a STOP with
  the file, the line and the reading.
- The rides from row 104's audit (the backgrounding park window, the second-dismiss race, the
  shared-deferral refactor) stay out: the ticket carries them as "her call pending" and no call
  has come.
