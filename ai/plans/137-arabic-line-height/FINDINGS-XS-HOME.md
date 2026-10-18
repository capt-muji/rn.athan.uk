# FINDINGS XS HOME 137

Step 3b record, R3.3 (D137.11). Vehicle line first, then one line per surface.
Instrument note: the step-3 instrument, agent-device snapshot frames on the
static screen (the runner prepared per the atlas route; the dispatch reused the
team-signed cached runner, nothing new installed on the phone). Frames arrive
in points on this 375 x 812 pt panel; Height px below is pt x 3, the panel's
scale. Two independent captures per screen (the in-session read and the CLI
tree file saved beside each screenshot; the restore capture re-reads home a
third time) agree byte for byte on every frame recorded here. Screenshots
`xs-home.png` and `xs-overlay.png` (1125 x 2436) sit in
`$HOME/athan-gitree/sessions/137/` for the lead's vision corroboration; no
measurement below comes from pixels.

Build: `com.example.athan` 2.0.939 on iOS 18.7.10, the era check passed (at or
past 2.0.811, the Rubik era; D137.5; matches step 3). Read-only contact: no
install, no system setting, her athan storage never opened. App language ar on
arrival, read from the home face (`الإعدادات` settings button, `لندن،
المملكة المتحدة` location label, Arabic row labels); no switch made, none
restored (D137.4's already-ar branch). No launch popup presented this launch,
so no backdrop tap was needed (step 3 saw one; this launch did not).

| Surface | Node label | Frame verbatim (pt) | Height px | Nominal | Face | em @3 | Candidates px (hhea/typo/win/bbox) | Nearest, gap | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Day location label | لندن، المملكة المتحدة | [193.3333282470703, 169, 165.6666717529297, 19] | 57 | 16 | Rubik-Regular | 1.188 | 57/57/74/75 | hhea 57 and typo 57, +0 | matches hhea and typo exactly |
| Day date label | جمادى الأولى 8، 1448 | [193.3333282470703, 196, 165.6666717529297, 21.333328247070312] | 64 | 18 | Rubik-Regular | 1.185 | 64/64/83/84 | hhea 64 and typo 64, +0 | matches hhea and typo exactly |
| Prayer row name | الفجر | VOID, AX-merged (see below) | VOID | 18 | Rubik-Regular | not computable | 64/64/83/84 | not computable | void on the AX rung, pending the vision pixel read |
| Row time | 04:03 (inside the merged row label) | VOID, AX-merged (see below) | VOID | 18 | Rubik-Regular | not computable | 64/64/83/84 | not computable | void on the AX rung, pending the vision pixel read |
| Countdown word | الفجر | [0, 58, 375, 20.333335876464844] | 61 | 17 | Rubik-Regular | 1.196 | 60/60/78/79 | hhea 60 and typo 60, +1 | within 1px of hhea/typo (61.000007px against the unrounded 60.44) |
| Overlay explanation title | الضحى | [265.6666660308838, 303.99998474121094, 53, 21.33331298828125] | 64 | 18 | Rubik-Medium | 1.185 | 64/64/83/85 | hhea 64 and typo 64, +0 | matches hhea and typo exactly |
| Overlay explanation body | 20 دقيقة بعد الشروق | [56.6666660308838, 357.6666488647461, 262, 24.33331298828125] | 73 whole-node | 16 | Rubik-Regular | 1.521 whole-node | pin 24 = 72px per line | pin 72, +1 if one line | closed by VISION-137.md: one line, per-line 73px against the 72px pin, +1 |

Unrounded px before scale rounding: location 57.000, date 63.999985, word
61.000007, title 63.999939, body 72.999939. Every recorded StaticText appears
twice in the tree (parent and child, identical frames); one of each pair is
recorded.

Pin note for the control: the body carries lineHeight
`ty.scriptLineHeight(16)` = 24, so 24 x 3 = 72px per line. The whole node
reads 73px (72.999939), one pixel over a single pin line; VISION-137.md's read
of `xs-overlay.png` fixed the count at one line, closing the pin at 73/72, +1. The 3T read the same body at 63px against its 63 pin
(24 x 2.625 = 63.0), exact.

Void, the row 120 form, the two row surfaces:

- Attempted: raw depth-40 snapshots with force-full on the Standard page at
  arrival and after the restore, and on the Extras page, plus the default
  interactive snapshot; the runner answered healthy every time (47 to 65
  nodes).
- The phone answered: the prayer rows never publish their texts. Each row is
  one Other container carrying the composite label `الفجر, 04:03, إشعار
  الفجر: إيقاف` at [12, 237.3333282470703, 351, 57.00001525878906] pt, with
  no StaticText children at any depth, on either schedule page. iOS merges
  each row's name, time and bell state into one accessibility element; the
  name and the Latin-digit time (visible inside the composite label) have no
  frames of their own.
- Corroboration: `xs3b-home-tree.json`, `xs3b-overlay-tree.json` and
  `xs3b-restore-standard-tree.json` (the merged containers and their composite
  labels), the screenshots `xs-home.png` and `xs-overlay.png` kept unread for
  the lead's vision dispatch (D137.11; this executor has no image input), and
  the countdown digits container beside the word publishing its own 28.667pt
  (86px) height, showing adjacent text does publish when not merged.
- What the hole removes: the XS frame for the 18 Regular row-name and row-time
  surfaces, whose 3T pair reads 75px each. The other five XS surfaces stand,
  same-surface paired against the 3T.

Corroboration inside the same captures: the day date label read 21.333328pt
under `جمادى الأولى 8، 1448` on the arrival and restore faces and under
`جمادى الأولى 7، 1448` on the mid-contact Extras face, identical frames under
both labels; the countdown word read 20.333336pt under `الفجر` (Standard,
twice) and `الضحى` (Extras), full-width 375pt node both times, mirroring the
3T's full-width word node; the countdown digits container (not a surface)
read 28.667pt = 86px against the 24 Medium candidates 85/85/110/114, +1 over
hhea, the same +1 shape as the word at 17.

Face observation, recorded raw, no adjudication: the home face at arrival and
restore showed the cached-day schedule (الفجر 04:03 through العشاء 21:31,
date `جمادى الأولى 8، 1448`, countdown 21h 21m to tomorrow's الفجر), while
the Extras read minutes later showed the live morning face (نصف الليل 01:24,
آخر ثلث 03:06, السحور 06:12, الضحى 06:53, date `جمادى الأولى 7، 1448`,
countdown 9m 10s to الضحى), and the restore capture showed the arrival face
again, every recorded frame identical under both. The app's own display state
flapped once mid-contact; nothing was tapped but the الضحى row and its
reverse. The row values are the app's own; no value was substituted.

Route facts: the first pager swipe (rightward, 120 to 330 at y 400) reached
Extras directly, confirming the RTL page order (Extras left of Standard), the
3T leg's direction; the tree confirmed the page by the Extras row labels
before the tap. No Istijaba row rendered today (Sunday; its explanation is
Friday-only in the catalog), so the tapped row الضحى, the upcoming row and
the countdown target, is not a passed Istijaba per the contract. The overlay
closed on the second tap of the same row (zero explanation and zero `إغلاق
تفاصيل الصلاة` catcher nodes in the closing capture) and the Standard
six-row face returned at its original frames.

Residual pattern, recorded raw per D137.12: where the 3T's five unpinned
points sit +2 above their bbox (and its word scatters to 27px), the XS's four
readable unpinned points sit ON hhea/typo exactly (three) and +1 over hhea on
the word, and the pinned body reads +1 over its pin line. No candidate
tolerance is exceeded on the XS; both facts go to the lead's adjudication
before the verdict step runs, per PLAN.md section 10's last symptom row.

No UDID, serial or team identifier is recorded in this file; the placeholder
`IPHONE_UDID` stands for the device everywhere.
