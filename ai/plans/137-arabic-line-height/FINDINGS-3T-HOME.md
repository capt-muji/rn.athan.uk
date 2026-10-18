# FINDINGS 3T HOME

Step 2b record, R2.3 (D137.11). Vehicle line first, then one line per surface.
Instrument note: the step-2 instrument held throughout, `maestro --udid
<serial> hierarchy`, rung two of PLAN.md section 10's ladder
(`uiautomator dump` stays the refused rung on Android 9; step 2 recorded its
7 refusals, and it was not re-attempted). Two independent captures per screen
(home: `3t-home-hierarchy-a.json` and `-b.json`; overlay: `3t-overlay-hierarchy-a.json`
and `-b.json`) agree byte for byte on every bound recorded here. Screencaps
`3t-home.png` and `3t-overlay.png` sit in `$HOME/athan-gitree/sessions/137/`
for the lead's vision corroboration; no measurement below comes from pixels.

Build: driven `com.example.athan` versionName=2.0.908 (the production-id
FleetTest mock, at or past the 2.0.811 Rubik era; no fresh build, no install).
Also installed, not driven: `com.example.athan.fleettest` versionName=2.0.996.
`wm size` prints `Physical size: 1080x1920`, scale 2.625. App language ar on
arrival (`الإعدادات` settings button label, `لندن، المملكة المتحدة`
location label; no switch made, none restored).

| Surface | Node label | Bounds verbatim | Height px | Nominal | Face | em @2.625 | Candidates px (hhea/typo/win/bbox) | Nearest, gap | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Day location label | لندن، المملكة المتحدة | [602,391][1038,458] | 67 | 16 | Rubik-Regular | 1.595 | 50/50/64/65 | bbox 65, +2 | no candidate within 1px |
| Day date label | جمادى الأولى 7، 1448 | [602,479][1038,554] | 75 | 18 | Rubik-Regular | 1.587 | 56/56/72/73 | bbox 73, +2 | no candidate within 1px |
| Prayer row name | الفجر | [844,644][1049,719] | 75 | 18 | Rubik-Regular | 1.587 | 56/56/72/73 | bbox 73, +2 | no candidate within 1px |
| Row time | 05 (digit node inside the ax 05:54 container [210,644][844,719]) | [453,644][512,719] | 75 | 18 | Rubik-Regular | 1.587 | 56/56/72/73 | bbox 73, +2 | no candidate within 1px |
| Countdown word | الشروق | [0,123][1080,150] | 27 | 17 | Rubik-Regular | 0.605 | 53/53/68/69 | hhea 53, -26 | no candidate within 1px |
| Overlay explanation title | الضحى | [743,762][884,839] | 77 | 18 | Rubik-Medium | 1.630 | 56/56/72/75 | bbox 75, +2 | no candidate within 1px |
| Overlay explanation body | 20 دقيقة بعد الشروق | [196,924][884,987] | 63 | 16 | Rubik-Regular | 1.500 whole-node | pin 24 = 63 unrounded, 63 rounded | pin, +0 if one line | PENDING: whole node 63px, per-line = 63 / line count, the lead's vision read fixes the count |

Pin note for the control: the body carries lineHeight
`ty.scriptLineHeight(16)` = 24, so 24 x 2.625 = 63px per line. The whole
node reads 63px, which equals exactly one pin line; the line count stays
pending until the lead's vision read of `3t-overlay.png` fixes it, per the
step contract.

Corroboration inside the same captures: the other five Standard row names
(الشروق، الظهر، العصر، المغرب، العشاء) all read 75px at the same x column;
every row-time digit node (05, 54, 07, 27, 12, 51, 15, 28, 18, 04, 19, 27)
reads 75px, while the colon glyphs read 70px (for example `:`
[520,644][533,715]); the Extras page's row names (نصف الليل، آخر ثلث،
السحور، الضحى) all read 75px. The countdown word node reported
[0,123][1080,150] in every capture, on both pages and under both words
(الشروق on Standard, الضحى on Extras), two independent captures each.

Route facts: the first pager swipe (rightward drag) reached Extras directly,
confirming the RTL page order (Extras left of Standard); the tree confirmed
the page by the Extras row labels before the tap. No Istijaba row rendered
today (its explanation is Friday-only in the catalog), so the tapped row
الضحى, the upcoming row and the countdown target, is not a passed Istijaba
per the contract. The overlay closed on the second tap of the same row
(zero explanation or catcher nodes in the closing capture) and the Standard
six-row face returned at its original bounds.

Residual pattern, recorded raw per D137.12: the five new unpinned points
read +2 above their Regular bbox (67 vs 65 at 16; 75 vs 73 at 18, four
surfaces) and the Medium point +2 above its bbox (77 vs 75 at 18), against
step 2's Regular +1 at 14 (58 vs 57) and Medium +2 at 22 and 14. The
countdown word scatters far below every set (27px against hhea/typo 53,
win 68, bbox 69), the one surface that does not sit just past bbox; both
facts go to the lead's adjudication before the verdict step runs, per
PLAN.md section 10's last symptom row.
