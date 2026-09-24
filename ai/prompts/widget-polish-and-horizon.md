# Session brief: widget polish, the horizon, and the iOS flag

Four jobs, all found by the owner testing on the iPhone XS and an Android phone on 2026-09-24,
after session 17 pushed. They are one session because the first two share a file and a device
proof, and the last two are each a single decision already taken.

Everything here was measured by the session that wrote this brief. Where a number appears, it is
a measurement, not an estimate.

## 1. Android dark colours must match iOS exactly

**Owner ruling, 2026-09-24:** 🐋  "the iOS has like a dark, really, really dark purple, close to
black, and I really love the colour of it. So I want Android background colour to match. I want
Android to match exactly like iPhone actually."

- iOS dark card: `rgba(2, 13, 38, 0.95)` (`widgets/PrayerWidget.tsx`, the `DARK` palette).
- Android dark card: `CARD_DARK = css("#252387")` in `scripts/generate-widget-assets.py`, a
  bright purple. It was never reconciled with iOS and is the colour the owner is objecting to.
- **The Android card is a generated PNG, not a screenshot and not a live colour.** Glance cannot
  draw rounded corners, strokes or shadows, so `scripts/generate-widget-assets.py` draws solid
  rounded rectangles into `assets/widgets/`. Changing the colour is a literal change plus
  `python3 scripts/generate-widget-assets.py`. The owner asked directly about this: no screenshot
  is involved anywhere.
- iOS's colour carries 0.95 alpha over a wallpaper; Android's bitmap is opaque by ruling
  (2026-09-01, in the script's own comments). Composite the iOS colour over black to get the
  opaque equivalent, and say in the plan what that resolves to rather than leaving it to the
  executor.
- `shared/__tests__/widgetAssets.test.ts` pins that the script's literals stay a subset of the
  layout's palette. Check what it requires before changing either side.
- The owner said "exactly like iPhone", so audit the whole dark palette for drift, not the card
  alone. Any colour that differs is either matched or listed in the plan with a reason it cannot
  be.

## 2. The Android active pill overhangs the times

**Owner report, 2026-09-24:** the active-row background is 🐋  "perfectly aligned on the left, but
on the right side, it's extended even further out."

Measured cause, by the session that wrote this brief. In the medium composition
(`widgets/PrayerWidget.tsx`):

- the pill is `<AImageEl ... modifiers={[fillMaxWidth(), height(A_ROW_HEIGHT)]} />` inside a Box
  of `width(LIST_WIDTH)`, so it spans the WHOLE list column;
- the rows sit in a sibling `<Column modifiers={[APad(12, 0, 12, 0)]}>`, so the text is inset
  12dp each side;
- the name and time columns do not fill what is left, so the pill hangs past the times:

| Granted width | LIST_WIDTH | name+time | Pill overhang past the times |
| --- | --- | --- | --- |
| 310dp | 141 | 108 | **21dp** |
| 360dp | 167 | 128 | **27dp** |
| 400dp | 187 | 144 | **31dp** |

It grows with screen width, which is why it looks worst on a wide phone. The left edge looks
right because 12dp reads as a deliberate inset; the right edge does not because the slack lands
there.

The owner gave two options and chose the second: 🐋  "we can shift the whole list to the right and
then make the active background smaller on the left side, you know, shorter on the left side too."
In other words **bound the pill to the text, not to the column**, keeping equal breathing room
each side. The planning session decides the exact geometry and states it as numbers.

Constraints: `A_ROW_HEIGHT`, `PILL_VPAD`, `FOOTER_BOTTOM_PAD`, `HERO_WIDTH` and `LIST_WIDTH` are
owner-tuned (`ai/prompts/android-widget-tap-open.md`), and session 15d's proportional sizing must
keep holding at every width in its test table. `shared/__tests__/widgetRenderer.test.ts` already
has `bounds the active pill to the list column, not the card remainder` from a related 2026-09-19
finding: that test bounded the pill to the COLUMN and this bug is the pill inside that column, so
the new test tightens it rather than replacing it.

## 3. The horizon drops from 30 days to 7

**Owner decision, 2026-09-24**, taken after the session showed that the black
"containerBackground" flash is NOT caused by the horizon (see job 4's note and ISSUES G.2), and
that the horizon is the widget's survival time when background refreshes do not happen.

- `TIMELINE_DAYS` is `30` in `shared/widgetTimeline.ts` (session 17 moved it there so tests can
  read it). It becomes `7`.
- Both platforms use it through `buildSequence` in `stores/widget.ts`.
- Session 17's guards must move with it: `carries a 30-day horizon` asserts the number, the two
  fixture spans read `TIMELINE_DAYS + 1`, and the absolute entry bound of 250 was sized for 30
  days. Re-measure at 7 and re-size the bound; do not leave a bound so loose it guards nothing.
- Re-measure and update the horizon table in `ai/AGENTS.md`, which session 17 wrote.
- **Record the accepted risk plainly**, because it is the reason the number was 14 before: a user
  whose Background App Refresh is off, or who force-quits, has a widget that goes stale after 7
  days. `ai/AGENTS.md` already carries the 2026-09-09 note about such users going silent after the
  2-day notification buffer; this shortens the widget's own grace period to a week.

## 4. Turn the iOS widgets flag on

**Owner ruling, 2026-09-24:** 🐋  "the iOS widgets, you said, can probably be turned on. Yes, we do
want to turn it on. It should be on anyway."

The flip condition in `shared/flags.ts` is met, verified by the session that wrote this brief:

- `expo-widgets` 58.0.1 shipped "Preserve SwiftUI view identity across widget and Live Activity
  updates" (expo/expo#49810), which is the reimplementation of the closed #49244 that the JSDoc
  names;
- the installed 58.0.3's `ios/Widgets/DynamicView.swift` renders
  `AnyView(view).id(child.childIdentity)` and contains no `UUID()` anywhere, so the
  random-per-render identity hack the flag exists to avoid is gone.

The JSDoc's condition also requires verification on the iPhone XS per the G.1 acceptance protocol
(`ai/ISSUES.md` G.1), which no session has run. **That protocol is part of this job**, not a
formality: the flag's whole history is a fix that looked right and was not. The plan reads G.1 and
turns its acceptance protocol into steps with expected readings.

When the flag flips, `shared/flags.ts`'s JSDoc changes from "why this is off" to whatever the
lifecycle rule in `ai/AGENTS.md` says a live flag carries, and `.env.example` is updated.

### What the owner saw, and what it is not

The owner reported a black screen reading "please adopt containerBackground API" for about five
seconds when adding a widget, and asked whether session 17's horizon rise caused it. **It did
not**, and the plan should not try to fix it by tuning the horizon:

- the XS is running **1.27.337**, built on the morning of 2026-09-24, whose `TIMELINE_DAYS` is
  **14**. Session 17's 30-day build (1.27.353) has never been installed on it;
- this is **ISSUES G.2**, an open release blocker recorded on 2026-09-02: a freshly placed widget
  shows the blank placeholder for up to ~60s before its first render, and the entry says the
  delay is DELIVERY, not data, because the stored timeline already exists at placement. Five
  seconds is far better than the ~60s recorded then;
- G.2's leading candidate fix is consolidating the ten per-kind reloads into one
  `reloadAllTimelines` per flip, which is also G.1's candidate fix.

G.2 is NOT in this session's scope. It is its own row, and flipping the flag on (job 4) makes it
user-visible, so the planning session must decide whether the flag flip should wait for G.2 and
say so to the owner rather than deciding silently.

## Order and proof

1 and 2 are one device proof on the Android phone: the same build shows both the matched colour
and the corrected pill. 3 is a constant and its guards. 4 is a flag and a device protocol on the
XS, and the owner must hold the phone for the taps.

The Oppo Find X8 went back to its user on 2026-09-24, so the only Android phone is the OnePlus 3T
(`8f7ada76`) on Android 9, and the pill overhang must be reasoned about at the widths in job 2's
table rather than only at the 3T's own grant.
