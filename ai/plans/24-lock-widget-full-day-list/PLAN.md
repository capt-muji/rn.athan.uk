# Session 24: Lock Screen widgets showing the whole day's list, in two styles

**LOCK SCREEN. Not the home screen.** On 2026-09-25 a session built this as a `systemLarge` HOME widget by
misreading the brief, and it was reverted in full. The owner, re-queueing it: 🐋  "I said, create a lock
screen widget, not a home screen widget." Every widget in this plan is an `accessoryRectangular` Lock Screen
face.

## 1. Goal

Two new Lock Screen compositions, each carrying the whole day's list as absolute times. One stacks every row
in a single column; the other splits the day into two columns side by side, the first half left and the
second half right.

Both styles, both schedules, so **four new kinds**:

| Kind | Style | Schedule | Gallery name |
| --- | --- | --- | --- |
| `PrayerLockWidget4` | one column, all rows | standard | Next Prayer (Layout 4) |
| `ExtrasLockWidget4` | one column, all rows | extras | Extra Times (Layout 4) |
| `PrayerLockWidget5` | two columns, split | standard | Next Prayer (Layout 5) |
| `ExtrasLockWidget5` | two columns, split | extras | Extra Times (Layout 5) |

That takes the Lock Screen from six kinds to ten.

## 2. Owner decisions (2026-09-25)

1. **Two styles, not one.** 🐋  "We can look at doing 6 rows versus 3 rows plus 3 rows side by side. The
   first 3 and then the last 3... I think we'll do 2 styles."
2. **Four new widgets.** 🐋  "it'll be another 4 extra widgets. So, because we're doing both schedules...
   if we're doing 2 styles for each schedule, that's 4."
3. **Absolute times only, `HH:mm`, static.** 🐋  "we will use absolute times everywhere. HH:MM. That's it.
   Static." No countdown on either style, and nothing that ticks.
4. **The list rolls over when the last prayer passes.** 🐋  "as soon as the last prayer has come, when it's
   passed, the whole list updates to the new one, updates to the next one" — the same behaviour as the app,
   the home widgets and the existing lock faces.

## 3. The rollover is already solved, and must not be reimplemented

`buildPrayerWidgetTimeline` writes one entry per prayer boundary, and each entry's `prayers` array is the
list day resolved by `resolveDisplayDate` (`shared/sequence.ts`), the same function the app's own screens
use. When the day's last prayer passes, the next entry already carries the next day's rows with its own
`activeIndex`.

So this session renders `props.prayers` and `props.activeIndex` and nothing more. **No builder change, no
date arithmetic in the layout.** Any rollover logic written inside a layout would be a second source of
truth and is a defect. `shared/widgetTimeline.ts` and `shared/sequence.ts` are not touched.

The reverted home-screen attempt confirmed this empirically: it rendered a day list from these two props
with no builder change at all.

## 4. The constraint, and how each style answers it

An `accessoryRectangular` face is roughly **160x72pt**. That is the whole budget, and iOS sets it.

Row counts: standard is 6 (`PRAYERS_ENGLISH`), extras is 4, or 5 on Fridays when Istijaba appears
(`EXTRAS_ENGLISH`).

| Style | Rows per column | Height per row | Width per column |
| --- | --- | --- | --- |
| Layout 4, one column | 6 standard, 4 or 5 extras | ~72/6 = 12pt | full ~160pt |
| Layout 5, two columns | 3 standard; extras 2 and 2, or 3 and 2 on Fridays | ~72/3 = 24pt | ~78pt each |

**Layout 4 will be tight.** 12pt per row is below the 14pt the owner settled on for the other lock faces
after rejecting 12pt as 🐋  "really really small". It is included because the owner asked to compare the two
styles, and the comparison is the point. Its text size is the thing to tune on device.

**Layout 5 trades width for height.** Three rows in 72pt gives ~24pt each, comfortably above 14pt, but each
column has only ~78pt for a name and a time together. "Last Third" beside "02:41" in 78pt is the worst case,
and `minimumScaleFactor` plus `lineLimit(1)` is what keeps it on one line.

**The split is by halves, first rows left.** Standard divides 3 and 3. Extras divides 2 and 2, and on Fridays
3 and 2, so the left column takes the extra row: `Math.ceil(rows.length / 2)`.

**Alignment.** Each column is a name at its leading edge and a time at its trailing edge, which is the app's
own row anatomy and what the existing medium home widget does. Layout 5's two columns split the face into
halves, each half laid out independently.

## 5. Registration: five edits per style, not four

Learned in session 23 and confirmed by the reverted attempt:

1. the layout function in `widgets/LockPrayerWidget.tsx`;
2. its two `createWidget` exports;
3. two `app.json` entries per style, **`accessoryRectangular` only**. Inline is a single system-rendered line
   and cannot hold a list; circular renders blank in this project;
4. two `updateTimeline` calls per style in `stores/widget.ts`;
5. **the kinds in `shared/__mocks__/widgets/LockPrayerWidget.ts`**, or three store suites fail with
   `undefined` where a kind should be.

## 6. What each layout must handle

Every state the existing three lock layouts handle, because the same entries drive all of them:

| State | Renders |
| --- | --- |
| `props == null` | the neutral card (the gallery placeholder: expo-widgets stores no initial props) |
| `stale === true`, or a non-numeric epoch | the "Out of date" card |
| `prayers` absent, empty, or not an array | the neutral card: no list to draw |
| `activeIndex` missing or out of range | the neutral card |
| `accessoryInline` | the name and absolute time, since a line cannot hold a list |
| otherwise | the list, in that style |

Helpers live inside each function: the `'widget'` directive serializes a body alone, so nothing is shared by
reference across the five layouts the file will hold.

## 7. Tests and coverage

**100% statements, branches, functions and lines**, on the owner's explicit instruction for this work and the
repo's standing gate. The reverted attempt is the worked example of the cost: its happy-path tests left three
branches uncovered, and each needed a test of its own.

New suite `shared/__tests__/widgetLockListRenderer.test.ts`, following `widgetLockRenderer.test.ts`'s pattern
(evaluate the real module with the swift-ui globals mocked, expand function components as the runtime does).
Per style:

| Test | Proves |
| --- | --- |
| every row's name and time renders | the list is the whole face |
| the active row is marked, and only it | `activeIndex` drives the highlight |
| passed, active and upcoming rows differ in colour | the three-state rule |
| extras renders at 4 rows, and 5 on a Friday | both lengths |
| no element carries a `timerInterval` | absolute times only, the owner's ruling |
| one text size throughout, names AND times | no drift. **Read both**: the reverted attempt's version read only names, so a break that inflated every time passed |
| each degradation above reaches its card | five separate rows |
| the inline face falls back to name and time | a line cannot hold a list |

Layout 5 only:

| Test | Proves |
| --- | --- |
| 6 standard rows split 3 and 3, in order | the first half is left |
| 5 Friday extras split 3 and 2 | `ceil` puts the odd row left |
| 4 extras split 2 and 2 | the even case |

Breaks, each naming the test it must fail: flatten the three row colours to one; let an out-of-range
`activeIndex` reach the list; change one row's font size; stop honouring `stale`; change layout 5's split
from `ceil` to `floor`.

## 8. Acceptance

- `npx tsc --noEmit` exits 0.
- `npx biome check` exits 0 on every changed file.
- `yarn validate` passes at **100% on all four measures**.
- Each new test fails before its code exists, by writing the suite first.
- Every break fails the test named for it. **A break that passes is a broken test**, so widen the test and
  rerun rather than recording the break as caught.

## 9. Device proof (iPhone XS, `00008020-0015585C22D2002E`)

Bump the version, then prebuild, then build: `expo run:ios` never re-syncs an existing native folder, so the
other order ships the old version's stamp.

Release build with the real API key: `DEVELOPMENT_TEAM=9V3WAU9Z54 npx eas-cli env:exec preview 'npx expo
run:ios --configuration Release --device 00008020-0015585C22D2002E'`. The mock payload seeds days relative to
each download, which makes a day list meaningless.

**Detect the build by polling the installed version on the device every 15 seconds**, never by grepping the
log for a completion line: `expo run:ios` keeps streaming device logs after installing and looks hung. Kill
it once `xcrun devicectl device info apps` reports the new version.

The owner places all four widgets and rules on:

1. whether Layout 4's ~12pt rows are readable, or need a smaller row count;
2. whether Layout 5's ~78pt columns hold "Last Third 02:41" without shrinking to nothing;
3. which style they prefer, since one may not survive the comparison.

A widget's verdict is visual and no test here can give it, so the row stays EXECUTED until they have looked.
