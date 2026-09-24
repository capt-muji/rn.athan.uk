# Android/iOS widget parity: attempted, reverted, and why it cannot be a value-for-value copy

**VERDICT, 2026-09-24: the whole parity pass was reverted to `checkpoint-1-android-good` at the owner's instruction,
and the copy-the-values approach should not be retried.** The owner saw the result on the 3T and preferred the state
before it: the medium's left content sat too far left and its day list rendered "really tiny".

The reason is in the first table below and it is structural, not a matter of picking better numbers. iOS's metrics are
tuned for a **329 x 155pt** card. The Android medium is **380 x 110dp**: wider and 45dp shorter. A row height, a
padding or a gutter that reads correctly inside one of those reads wrong inside the other, because what the eye judges
is the value's relationship to the space around it, not the value itself. The platform-specific tuning that looked
like drift was the two cards being different shapes.

What parity DID achieve and what was kept: the colour match (finding 39) and the pill geometry (finding 40), both
verified by pixel measurement on the device. Colour is shape-independent, which is exactly why it transferred and the
metrics did not.

Two attempts, both reverted, both documented below: the metric copy (1.27.364, reverted in 1.27.367) and the declared
box sizes (1.27.365, reverted in 1.27.366).

---

# The original analysis

Raised by the owner mid-execution, 2026-09-24:

🐋  "with Android, we just try to make them match the same size as the iPhone widgets. The same sizing, same
portions, same everything, same colour, same font, same absolute, same styling entirely from top down, same padding
around the edges, same everything, except the shadows, because I think the shadows cannot be done on the OnePlus 3T...
But of course the time format on Android is different, so keep that. But everything else should be absolutely
identical. From the letter spacing to the letter height to everything."

This file is the measurement behind the answer, taken from the source and from the 3T itself
(`adb shell dumpsys appwidget`, density 420, 1080x1920). It is not a plan. Session 19's plan covers four other jobs;
the queue decides when the parity work runs.

## The finding that governs everything: the two cards are different shapes

| | iOS systemMedium | Android medium |
| --- | --- | --- |
| Card | 329 x 155 pt | 380 x 110 dp (declared 310 x 110; the 3T grants ~380 wide) |
| Padding | 13 / 20 / 13 / 13 | 13 / 20 / 13 / 16 |
| Inner | 296 x 129 | 347 x 81 |
| Aspect | 2.12 | 3.45 |

Android's medium is **wider and 48dp shorter inside**. That is not a styling choice, it is what the launcher grants a
`minHeight` 110dp provider on a 420dpi phone.

Consequences, measured:

- a 6-row standard list at iOS's 23pt rows needs 138dp. Android has 81dp of inner height. It does not fit, and no
  padding change makes it fit;
- Android's own 24dp rows also overrun (144dp), which is survivable only because nothing clips vertically here;
- fitting 6 rows honestly inside 81dp means 13dp rows, whose text would be about 7sp: unreadable.

So **vertical parity is impossible while the Android card is 110dp tall.** Height parity would mean raising the
provider's `minHeight`, and session 15b measured what that costs: the 3T's launcher computes spans as
`ceil((minWidth + 30) / 70)` and HIDES a provider too large for its grid rather than clamping it. A 400dp width made
the widget vanish from the picker entirely. Raising height risks the same disappearance, on the owner's only Android
phone.

## What IS free, and exact

Each is a literal, with no arithmetic depending on it:

| Value | iOS | Android | Change |
| --- | --- | --- | --- |
| Pill corner radius | 6 | 5 | `PILL_RADIUS_PT` in `scripts/generate-widget-assets.py`, then regenerate |
| Footer weight | medium | normal | one `AText` weight argument |
| Hero countdown size | 22 | 26 | one `AText` size argument |
| Trio spacing | uniform 6 | 2 then 6 | two `Spacer` heights |
| Card bottom padding | 13 | 16 | `FOOTER_BOTTOM_PAD`, owner-tuned on 2026-09-19 |
| Row height | 23 | 24 | `A_ROW_HEIGHT`, owner-tuned on 2026-09-20 |
| Row gutter | 10 (+4 on the list ZStack = 14 from the column edge) | 12 | `ROW_GUTTER`, set to 12 by THIS session on the owner's ruling |

Two of those, the row height and the bottom padding, were tuned by the owner on device in earlier sessions, and the
gutter was ruled on this session. Changing them to iOS's numbers means overriding three previous owner rulings with
this one, which is the owner's call and is why none of it was applied mid-execution.

## What is blocked outright

| Want | Why it cannot happen |
| --- | --- |
| `kerning` on the eyebrow (0.5) and footer (0.4) | The native tree converter keeps only colour, size, weight, style and decoration from a text style: `letterSpacing` dies at the Kotlin boundary. The hair-space (U+200A) hack in `tracked()` is already the workaround for the eyebrow. |
| The pill's drop shadow | The owner ruled it out on 2026-09-19 because the 3T renders it badly. Glance draws no shadows, which is why the pill is a baked PNG at all. |
| Identical vertical rhythm | The shape problem above. |

## What is already identical

Card padding leading, trailing and top (13 / 20 / 13); row text size (13); eyebrow size and weight (14 bold);
absolute time size (13); footer size (12); the whole palette after this session's dark-card fix; the pill's
proportions relative to its column (iOS 0.466 of the inner width, Android 0.461 at the 3T's grant).

## Applied 2026-09-24, on the owner's instruction

🐋  "Let's try to make it identical right now, so I apply everything. And then I will tell you if we need to roll
back."

Landed in 1.27.364 (`fc49b38c`): row height 24 to 23, pill corner radius 5 to 6, card bottom padding 16 to 13, row
gutter 12 to 14, hero countdown 26 to 22, trio spacing 2/6 to a uniform 6, footer weight normal to 600. The pill PNG
regenerated at 23dp tall with the 6pt radius.

Three of those override earlier device-tuned rulings (row height 2026-09-20, bottom padding 2026-09-19, gutter
2026-09-24 this morning). The owner asked for the override explicitly and asked to judge the result on glass.

Checkpoint 1 is the tag `checkpoint-1-android-good` at `068d85d7`, the state the owner called perfect BEFORE this
parity pass, with its APK and screenshot saved beside this file in `~/athan-device-sweep/session19/`. That is the
revert target.

A side benefit worth recording: the shorter rows cut the 6-row vertical overrun by 9dp, from 70 to 61 against an inner
height of 77dp, so the change moves the list toward fitting rather than away from it.

## The box-size change was WRONG and was reverted. Read this before touching a declaration again

Tried in 1.27.365, reverted in 1.27.366 on the owner's device evidence. Keeping the whole story because the reasoning
error is the valuable part.

**What I believed:** a home-screen grid cell is roughly square, so declaring equal `minWidth` and `minHeight` asks for
an equal number of cells each way and therefore yields a square widget.

**What is true:** a cell is TALLER than it is wide. So `110 x 110` asked for 2 x 2 cells and produced a PORTRAIT
rectangle, and `250 x 150` asked for 4 x 3 and produced a card both narrower and taller than the 5 x 2 it replaced,
squeezed enough that the prayer times stopped rendering at all. The owner, on the 3T: the smalls were "a rectangle
standing up tall, really really ugly" and the medium fell from full width to about 80% and "double the size and tall".

**Why the original values were right all along:** `160 x 110` and `310 x 110` are LANDSCAPE declarations, and that is
what makes the granted box look square-ish and full-width respectively. They were counteracting the cell's aspect
ratio. Nothing in the repository recorded that, which is why it read as an arbitrary 1.45:1 oddity worth "fixing".

**Why no amount of arithmetic caught it:** the proportional table in this file verifies the INNER layout across
180 to 560dp of granted width, and it is still correct. The declared box is a different question entirely: the
launcher rounds it into cells, and cell geometry varies per launcher and per device. Only a device can answer it. The
owner was right to call the change "not dynamic".

**Two facts to keep:**

1. An appwidget cell is not square, so never infer a widget's on-screen shape from its dp declaration. Read the
   granted size back with `adb shell dumpsys appwidget` and convert: the packed `min=(WxH)` values are `dp << 8`.
2. **Android keeps each widget's box from the moment it was placed.** A declaration change is invisible on widgets
   already on the home screen; they must be removed and re-added. This is why the emulator still measured a 172 x 98dp
   small after the new APK was installed, and it is a trap for any future session trying to verify a size change.

## The original analysis, kept for its measurements (the CONCLUSION was wrong)

Found 2026-09-24 after the owner reported the smalls looking "a pretty big square with a lot of empty padding" on the
3T and "very thin and tall" on the Android 15 emulator.

The widgets never had a say in it. `app.json` declared the smalls **160 x 110dp**, which is a 1.45:1 landscape box,
and the launcher rounds a declaration up to whole grid cells (`ceil((min + 30) / 70)` on the 3T, measured in 15b).
160 x 110 is 3 x 2 cells: never square, whatever the layout does inside it.

| | Was | Now | Why |
| --- | --- | --- | --- |
| Small | 160 x 110 | 110 x 110 | 2 x 2 cells: square by declaration, on any launcher |
| Medium | 310 x 110 | 250 x 150 | 4 cells spans a phone's full width, with LESS declared width than before; the 40dp of height is what lets the six-row list stop fighting the card |

The height rise is the change that unblocks vertical parity: the medium's inner height was 77dp against a 138dp
six-row list. It is also the lever session 15b used to make the widget vanish from the 3T picker at 400dp, so it is
tested on the emulator before it reaches the owner's phone, and the rule followed throughout is the smallest
declaration that still spans, never the largest that might.

## Both cards are opaque, which is what finally made the platforms share one literal

🐋  "we don't want to see through the colour at all."

iOS carried `rgba(252, 252, 254, 0.92)` and `rgba(17, 27, 64, 0.95)`; Android baked their composites over black. Two
spellings of one colour is exactly the drift that opened findings 39 and 40. At full opacity both platforms spell
`#fcfcfe` and `#101a3d` byte for byte, and `widgetAssets.test.ts` now covers the cards with the same subset rule as
every other colour instead of exempting them by name.

The dark card also moved from `#020c24` to `#101a3d`, lifted toward indigo on the owner's request for something
"a little bit brighter, just a bit softer on the eyes".

## The eyebrow letter-spacing question, measured and answered

The owner thought the small light and small dark cards had different letter spacing on the prayer name above the
countdown. They do not. Measured on `checkpoint-1-3t-widgets.png`, both eyebrows render 4 glyph runs spanning exactly
95px with identical inter-glyph gaps of 6, 5 and 9px. There is one `tracked()` helper, one call site, and no theme
branch anywhere near it.

It is an optical illusion: the dark card's eyebrow is `#ff69b4` on near-black, which blooms, and the light card's is
the deeper `#db2777` on near-white, which does not. Same geometry, different apparent weight.

## The honest summary

Colour parity is done. Typographic parity is close and the remaining gaps are single literals. Geometric parity is
partly free and partly governed by a card that is a different shape, and the one change that would fix the shape
(a taller provider) risks the widget disappearing from the 3T's picker, which is how the 15b session lost it at
400dp width.

A parity session should therefore: apply the free literals, decide with the owner on the three values that override
earlier device-tuned rulings, and treat the card height as an experiment with a known failure mode, tested on the 3T
before anything depends on it.
