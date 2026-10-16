# LOG

## Planning (2026-10-16)

## Ticket 108

Frontier taken from the ticket text; the interview waived by the owner's order 2026-10-16
("don't talk to me, don't ask me any questions... work autonomously"). Her rulings are the
ticket's own words:

- D108.1 the sheets' subtitle pull-ups revert to a small positive gap (SPACING.py, 6) under
  ar, the title's own box serving both lines; the gap rides the subtitle's margin, the
  location-date dial's shape. En byte-identical.
- D108.2 the qibla sheet's own subtitle style mirrors the shared header's change.
- D108.3 the sound sheet's list joins en at SPACING.md (12); the compactArabic branch and D94's
  Noto tightening die at the site.
- D108.4 the location-date dial opens one step: SPACING.py (6) to SPACING.sm (8) under ar.
- D108.5 the footnote takes the record's script line box (21 at the note's 14) so the measured
  win-descent ink renders; en keeps the font's own box.

Planner measurements (from the bundled TTFs' own tables, 2026-10-16):

- Rubik-Regular: upm 1000; hhea ascent 935, descent -250, lineGap 0 (1.185em box, 0.250em
  descent); OS/2 usWinDescent 466 (0.466em ink). At 14px: box descent 3.5px, ink descent
  6.5px, 3.0px outside the box. That outside ink is the clip her read saw: Noto's 2.112em box
  buried it in leading, Rubik's tight box cuts it.
- Roboto-Regular: upm 2048; hhea ascent 1900, descent -500 (1.172em box, 0.244em descent);
  usWinDescent 512 (0.250em ink). At 14px the excess is 0.08px: no clip under en, ever.
- scriptLineHeight at 14 is 21 (round(14 * 1.5)), the same treatment as Help's 23 at 15 and
  the explanation's 24 at 16, both owner-confirmed whole on the same read family.

Facts verified by the planner against `1f534a97`:

- All sheets except qibla render the shared Header through `Sheet.tsx:235`; the language sheet
  passes `subtitle={null}` (`Language.tsx:63`) and needs nothing.
- The sweep's note-gap pair (32/24) is D94's and untouched by this plan.
- The tests pin every value this plan moves: the sweep (qibla -10/4, sound 6/12, header boxes),
  DayLines (6/5), and the VolumeNote suite pins the en face.
