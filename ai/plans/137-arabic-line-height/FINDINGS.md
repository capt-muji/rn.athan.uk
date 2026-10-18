# FINDINGS 137

NO: the effective Arabic line box is not the same on both platforms, it DIFFERS.
The XS's readable unpinned surfaces sit on the hhea/typo set (1.185em) exactly,
measured 1.185 to 1.188em. The 3T's sit nearest the head bbox set, Regular
1.554em and Medium 1.581em, measured 1.578 to 1.633em carrying the D137.12
systematic residual (+2 above bbox on seven of eight readable surfaces, +1 on
the 14pt Regular subtitle). The sets sit 0.369em apart (Regular, 1.554 - 1.185)
and 0.396em apart (Medium, 1.581 - 1.185). And YES, it is as it should be: row
87 ruled the font's own box serves everywhere, the measured surfaces pin no
lineHeight, so each platform's own text stack fills the box. The taller Android
box is platform behaviour on a font whose metric sets diverge, not a repo
defect. No code changed on this branch.

Every number below traces to EXPECTATIONS.md, FINDINGS-3T.md, FINDINGS-XS.md,
FINDINGS-3T-HOME.md, FINDINGS-XS-HOME.md or VISION-137.md; derived gaps show
their subtraction. Vehicles: the 3T drove `com.example.athan` 2.0.908, the XS
read `com.example.athan` 2.0.939, both at or past the 2.0.811 Rubik era
(D137.3, D137.5). The two app versions differ; every measured surface exists in
both builds.

## The expectation candidates, one line each

- Rubik-Regular: hhea 1.1850em, typo 1.1850em, usWin 1.5320em, head bbox
  1.5540em.
- Rubik-Medium: hhea 1.1850em, typo 1.1850em, usWin 1.5320em, head bbox
  1.5810em.
- The match rule (D137.6): a measured box matches a candidate when the heights
  agree within 1 layout pixel after scale rounding. Rubik sets the
  USE_TYPO_METRICS selection bit in OS/2 (PLAN.md D137.6).
- Roboto-Regular, the contrast that kept English quiet (PLAN.md section 4): its
  hhea 1.1719em and usWin 1.2002em sit nearly tied where Rubik's diverge, its
  typo 1.0498em and bbox 1.3271em sit farther out, and it sets no
  USE_TYPO_METRICS bit where Rubik sets one.

## The same-surface pairs of D137.11, 3T against XS side by side

Candidate pixel values per surface and scale sit in the four findings files;
"nearest" below names the set and its gap exactly as recorded there.

| Surface (size, face, pin) | 3T height | 3T em @2.625 | 3T nearest, gap | XS height | XS em @3 | XS nearest, gap |
| --- | --- | --- | --- | --- | --- | --- |
| Day location label (16 Rubik-Regular, unpinned) | 67px | 1.595 | bbox 65, +2 | 57px | 1.188 | hhea/typo 57, +0 |
| Day date label (18 Rubik-Regular, unpinned) | 75px | 1.587 | bbox 73, +2 | 64px | 1.185 | hhea/typo 64, +0 |
| Prayer row name (18 Rubik-Regular, unpinned) | 75px | 1.587 | bbox 73, +2 | VOID | not computable | AX-merged void, step 3b |
| Row time (18 Rubik-Regular, unpinned) | 75px | 1.587 | bbox 73, +2 | VOID | not computable | AX-merged void, step 3b |
| Countdown word (17 Rubik-Regular, unpinned) | 27px | 0.605 | excluded, band artefact | 61px | 1.196 | excluded, band artefact |
| Overlay explanation title (18 Rubik-Medium, unpinned) | 77px | 1.630 | bbox 75, +2 | 64px | 1.185 | hhea/typo 64, +0 |
| Overlay explanation body (16 Rubik-Regular, pinned 24) | 63px | 1.500 | pin 63, exact, one line | 73px | 1.521 | pin 72, +1, one line |

Every pair both phones answered reads the 3T nearest the bbox set and the XS on
hhea/typo: no pair matches the same candidate set, so under the step-4 rule the
boxes DIFFER. The measured em distance per pair: 0.407em on location
(1.595 - 1.188), 0.402em on date (1.587 - 1.185), 0.445em on overlay title
(1.630 - 1.185). The countdown word row is excluded on both phones, an
instrument void, not a platform difference (its section below).

## The 3T settings sheet surfaces, no XS pair

The XS sheet published zero accessibility content nodes (step 3's void, below),
so these three carry no same-surface pair. They stand as 3T readings and pair by
face and metric set through the home and overlay surfaces, the D137.11 ruling.

| Surface (size, face) | Height | em @2.625 | Candidates hhea/typo/win/bbox | Nearest, gap | Verdict |
| --- | --- | --- | --- | --- | --- |
| Sheet title (22 Rubik-Medium) | 93px | 1.610 | 68/68/88/91 | bbox 91, +2 | no candidate within 1px, D137.12 residual |
| Sheet subtitle (14 Rubik-Regular) | 58px | 1.578 | 44/44/56/57 | bbox 57, +1 | matches Regular bbox within tolerance |
| Card title (14 Rubik-Medium) | 60px | 1.633 | 44/44/56/58 | bbox 58, +2 | no candidate within 1px, D137.12 residual |

Corroboration inside the same captures (FINDINGS-3T.md): the second and third
card titles read 60px like the first, and the Help answer's other two lines read
53px like the first.

## The controls and their pin ratios

| Control (size, face, pin) | Pin ratio | 3T reading | XS reading |
| --- | --- | --- | --- |
| Help question (15 Rubik-Medium, pinned 23) | 23/15 = 1.533em | 61px at pin 60.375 unrounded, +1 after rounding; measured 1.549em | VOID, modal never reached (sheet void) |
| Help answer (13 Rubik-Regular, pinned 20) | 20/13 = 1.538em | 53px at pin 52.5 unrounded, +0.5; measured 1.554em | VOID, modal never reached (sheet void) |
| Overlay body (16 Rubik-Regular, pinned 24) | 24 x scale per line | 63px against the 63px pin line, exact, one line | 73px against the 72px pin line, +1, one line |

VISION-137.md is the line-count authority: both overlay bodies render ONE line,
so the two PENDING body pins close at 63/63 exact on the 3T and 73/72, +1, on
the XS. Every control read sits within the 1px tolerance of its pin on its
platform, so the instrument holds on both phones: the 3T through the Help pair
and the overlay body, the XS through the overlay body. Pixel corroboration
(VISION-137.md): the 3T sheet and help ink heights (45, 34, 28 and 52, 35px) all
sit below their node bounds (93, 58, 60 and 61, 53px), the expected
ink-under-box relation.

## The countdown word: an instrument void on both phones

VISION-137.md records the word's full-width node as a band artefact on BOTH
phones: the pixels show a centered body-scale word, ink at roughly 39 to 40px on
each, distinct from the digits, while the node reports a full-width band (the 3T
node [0,123][1080,150] at 27px, the XS node full-width 375pt at 61px). The
surface is excluded from the node-bounds set symmetrically on both phones, as an
instrument void, not a platform difference. The node numbers stay recorded raw
in the two home findings files; no engine number for the word enters the
verdict. The XS word had also sat within tolerance before exclusion, +1 over
hhea/typo (61 against 60).

## The measured-set summary

- The 3T: every readable unpinned surface sits +2 above its Regular or Medium
  bbox (the D137.12 systematic view-bound residual), except the 14pt Regular
  subtitle at +1. Eight readable unpinned surfaces, seven at +2 and one at +1;
  nearest set the head bbox everywhere, measured 1.578 to 1.633em. D137.12's
  consistency test holds: the residual never scatters, and no surface flips to
  another set.
- The XS: every readable unpinned surface sits on hhea/typo exactly (+0 on
  location, date and overlay title), measured 1.185 to 1.188em; no candidate
  tolerance is exceeded on any XS reading.
- Nearest sets named per platform, in measured-match language ("nearest
  candidate, gap"): the 3T's box tracks the head bbox set, Regular 1.554em and
  Medium 1.581em; the XS's box tracks hhea/typo, 1.185em. The sets sit 0.369em
  apart (Regular) and 0.396em apart (Medium); measured across the same-surface
  pairs, 0.402 to 0.445em.
- Which table each platform's stack reads internally is not shown by these
  numbers and stays unverified. The row's starting hypothesis named usWin for
  Android; the 3T's readings land nearer the bbox set than usWin (at 22 Medium,
  93px sits +2 above bbox 91 and +5 above win 88), so the usWin attribution in
  particular is not what the measurement shows. The Paint and TextKit
  attribution is unverified wherever it appears.

## The judgement: is it as it should be

Yes, by the repo's own rulings and the pinned dependency citations of PLAN.md
section 4:

- Row 87 (DONE 2026-10-15) ruled "blockLineHeight and its five consumers died
  and the font's own box serves everywhere". The plan's sweep found every
  lineHeight under `components/` a pin, and none of the measured surfaces
  carries one, so the rendered box is each platform's own, which is the state
  row 87 chose.
- The RN 0.88.0 citations (re-verified by grep at step 1): with no lineHeight
  prop, Android measures through StaticLayout or BoringLayout with font padding
  included (`TextLayoutManager.kt` setIncludePad, `ReactTextView.java`
  defaulting it true), and iOS through TextKit line fragments
  (`RCTTextLayoutManager.mm`). The platform text stack, not this repo, decides
  which font metric set fills the box.
- The same TTF bytes legitimately produce two boxes because Rubik carries two
  divergent metric sets in one file (hhea/typo 1.185em against usWin 1.532em,
  bbox 1.554 to 1.581em). Roboto's sets sit nearly tied and it sets no
  USE_TYPO_METRICS bit, which is why English never showed this asymmetry.
- So the taller Android box is platform behaviour from the TTF's taller metric
  set as each stack renders it, not a repo defect: no code of this repo computes
  or pads the box, and the divergence follows from row 87's deliberate unpinned
  state.
- Unverified, named as such: any claim that Android's Paint reads the bbox or
  usWin table internally, or that iOS's TextKit reads hhea, goes beyond the
  measurement, which shows matched sets only. The pixel layer corroborates the
  engine numbers and the void shapes and contradicts nothing.
- "Visuals are settled. Fixes change behaviour only. Touch no pixel without the
  owner's say." (`ai/AGENTS.md`): any change to the boxes is hers to rule on,
  through the options below. Nothing was changed.

## Voids, the row 120 form

- The XS settings-sheet void (step 3). Attempted: snapshot frames at default
  depth, interactiveOnly, and raw depth 40, twice across two presentations, an
  8s wait for the language row's label, a scroll to refresh the tree, and the
  pixel fallback screenshot. The phone answered: the sheet's tree ends at its
  chrome (`Bottom sheet backdrop`, `Bottom sheet handle` 375x24, `Bottom Sheet`
  375x651.2), zero content nodes, and `pymobiledevice3 developer accessibility
  list-items` agrees with 12 items, the 9 home elements behind the backdrop plus
  the same 3 chrome elements. Corroboration: the two tree JSONs, the wait
  timeout, and VISION-137.md's read of `xs-02-settings.png`, whose pixels show
  the sheet content the tree never published. Removes: every XS settings-sheet
  surface (title, subtitle, card title) and the XS Help controls, since rows
  could not be located by label-matched refs and blind taps were forbidden.
  Stands: the sheet surfaces as 3T-only readings, and the same faces and sizes
  paired through the home and overlay surfaces on both phones (D137.11).
- The XS row-name and row-time void (step 3b). Attempted: raw depth-40
  snapshots with force-full on both schedule pages plus the default interactive
  snapshot; the runner answered healthy every time. The phone answered: every
  prayer row is one Other container carrying the composite label `الفجر, 04:03,
  إشعار الفجر: إيقاف` with no StaticText children at any depth; iOS merges each
  row's name, time and bell state into one accessibility element.
  Corroboration: the three tree JSONs, and VISION-137.md's read of
  `xs-home.png` showing the row name and time ink at 56px each, pixel
  corroboration only. Removes: the XS frame for the 18 Rubik-Regular row-name
  and row-time surfaces, whose 3T pair reads 75px each. Stands: the 18
  Rubik-Regular face and size still read on the XS through the day date label
  (64px, exact hhea/typo), and the adjacent countdown digits container, not a
  surface, publishes its own 86px against the 24 Medium candidates 85/85/110/114
  (+1 over hhea), showing unmerged text does publish.
- The countdown-word band artefact (steps 2b and 3b, both phones), as its
  section above: full-width node bounds on both phones, pixels showing a
  centered body-scale word. Removes: the word's node-bounds reading on both
  phones, symmetrically. Stands: the pixel corroboration that the rendered word
  itself is normal on both.
- The pixel-read history: the step executors had no image input and the in-step
  vision dispatch refused at nesting depth, so the screenshots sat unread until
  the lead's dispatched vision read covered all nine (VISION-137.md). No
  measurement in any findings file comes from pixels; the engine numbers stay
  the measurement throughout.

## The options of D137.7, verbatim

(1) accept each platform's own box, the row 87 law unchanged; (2) a separate
code ticket pinning an ar lineHeight per surface family, her dial, no negative
pulling. No code before her ruling; no code changed in this ticket.

## The R5.1 verdict cell, for the lead to apply at the audit close

This step never writes the OWNER-LED state itself; the text below follows
PLAN.md section 8's template shape with the measured numbers, the D137.11
surface set and the voids folded in.

```text
OWNER-LED 2026-10-18, investigation closed: NO, the effective Arabic line box
DIFFERS between the 3T and the XS on the same Rubik bytes. Same-surface pairs
under ar: day location 3T 67px = 1.595em nearest Regular bbox (+2, the
systematic residual) against XS 57px = 1.188em exact hhea/typo; day date 3T
75px = 1.587em nearest bbox (+2) against XS 64px = 1.185em exact hhea/typo;
overlay title 3T 77px = 1.630em nearest Medium bbox (+2) against XS 64px =
1.185em exact hhea/typo. Every XS readable unpinned surface matches hhea/typo
(1.185em) exactly; every 3T readable unpinned surface sits nearest the head
bbox set (Regular 1.554em, Medium 1.581em, measured 1.578 to 1.633em with the
+2 residual, +1 at 14); the sets sit 0.369 to 0.396em apart. 3T-only sheet
readings, the XS sheet having published zero accessibility content nodes: title
93px = 1.610em, subtitle 58px = 1.578em, card title 60px = 1.633em, all
nearest bbox. Voids: the XS settings sheet (no AX content, pixels corroborate
the content), the XS row name and row time (AX-merged composite labels), the
countdown word (a full-node band artefact on both phones, excluded
symmetrically). Controls at their pins on both: 3T Help question 61px at pin
60.375 (+1 after rounding) and answer 53px at 52.5 (+0.5); overlay body one
line on both, 3T 63px against its 63px pin line exact, XS 73px against 72 (+1).
The taller Android box is platform behaviour from the TTF's taller metric set
(each stack's internal table choice unverified), not a repo defect: row 87
ruled the font's own box serves everywhere, these surfaces set no lineHeight,
and the divergence lives in Rubik's two metric sets (hhea/typo 1.185em against
usWin 1.532em, bbox 1.554 to 1.581em). No code changed. OPTIONS for her
ruling: (1) accept each platform's own box, the row 87 law unchanged; (2) a
separate code ticket pinning an ar lineHeight per surface family, her dial, no
negative pulling. She rules.
```
