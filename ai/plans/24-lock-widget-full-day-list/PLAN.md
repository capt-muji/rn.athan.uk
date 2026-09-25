# Session 24: A Lock Screen widget showing the whole day's list

iOS only. Lock Screen, NOT the home screen.

**Read this first, because the last attempt got it wrong.** On 2026-09-25 a session built this as a
`systemLarge` HOME screen widget and it was reverted in full. The owner's words, on queueing the retry:
🐋  "I said, create a lock screen widget, not a home screen widget." Everything below is the Lock Screen.

## 1. Goal

A fourth Lock Screen composition: instead of one prayer, the whole day's list, names down the left and
times down the right, absolute times only. Two kinds, one per schedule, as Layouts 1 to 3 have.

| Kind | Schedule | Gallery position |
| --- | --- | --- |
| `PrayerLockWidget4` | standard | Next Prayer (Layout 4) |
| `ExtrasLockWidget4` | extras | Extra Times (Layout 4) |

## 2. The constraint the owner must rule on BEFORE any code

This is the whole risk of the session, and it is why step 1 is a measurement and not an implementation.

**A Lock Screen accessory widget is small and iOS decides its size, not us.** `accessoryRectangular` is
roughly 160x72pt on an XS-class screen: about the size of two lines of text. The home screen's
`systemLarge` card that the last attempt built is roughly 364x382pt, which is **about twenty times the
area**. The standard schedule has 6 rows and extras has 4 or 5.

Six rows in 72pt is 12pt per row including its leading. That is readable only at a very small size, and
the owner has spent this whole programme making the lock faces BIGGER, ruling 14pt after rejecting 12pt as
🐋  "really really small". Six rows cannot be 14pt in that slot: 6 x 14 with any leading overflows it.

So the honest options, and none of them is free:

| Option | What it costs |
| --- | --- |
| All 6 rows at ~11pt | Fits, but smaller than the 12pt the owner already rejected as too small |
| Fewer rows, the next 3 or 4 | Readable at 14pt, but it is not "the whole day" |
| Two columns, 3 rows each | Readable-ish, but a 160pt width split in two leaves ~78pt per column for a name and a time |
| `accessoryCircular` | Not viable: it is a tiny circle, and this project already found it renders blank |

**Step 1 is therefore: build ONE throwaway kind, put all 6 rows in it at 11pt, and have the owner look at
it.** Their verdict picks the option. Nothing else is planned until they have.

Do NOT write the other steps before that answer. A plan that guesses here wastes the session the way the
home-screen misread did.

## 3. What already exists

No builder change is needed, exactly as the reverted attempt confirmed: `PrayerWidgetProps` already carries
`prayers` (the day's rows) and `activeIndex`, because the medium home widget renders a day list from them.
`shared/widgetTimeline.ts` is not touched.

The lock module `widgets/LockPrayerWidget.tsx` holds three `'widget'`-directive functions today. This adds
a fourth. The directive serializes each body alone, so nothing is shared by reference and the palette and
row anatomy get their own copy, as they do three times already.

## 4. Registration: five edits, not four

Learned in session 23 and confirmed by the reverted attempt:

1. the layout function in `widgets/LockPrayerWidget.tsx`;
2. its two `createWidget` exports;
3. two `app.json` entries, `accessoryRectangular` only (inline cannot hold a list, and circular renders blank);
4. two `updateTimeline` calls in `stores/widget.ts`;
5. **two kinds in `shared/__mocks__/widgets/LockPrayerWidget.ts`**, or three store suites fail on the
   missing mock.

## 5. What the layout must handle

Every state the other three lock layouts handle, because the same entries drive it: `props == null` (the
gallery placeholder, since expo-widgets stores no initial props), `stale === true` or a non-numeric epoch
(the refresh card), and a throwing entry (the catch path). Plus the one this composition adds: `prayers`
absent, empty, non-array, or an `activeIndex` out of range, all of which mean there is no list to draw.

`accessoryInline` must still render something, and it cannot render a list: it falls back to the name and
absolute time, as Layouts 1 to 3 do.

## 6. Tests and coverage

100% statements, branches, functions and lines, on the owner's explicit instruction and the repo's standing
gate. The reverted attempt is the worked example of what that costs: its happy-path tests left three
branches uncovered (the dark palette, a non-array `prayers`, a missing `activeIndex`) and each needed its
own test.

New suite `shared/__tests__/widgetLockListRenderer.test.ts`, following `widgetLockRenderer.test.ts`'s
pattern. Rows to cover: every row rendered; the active row marked and only it; the three row colours;
extras at 4 and 5 rows; every degradation above; the inline fallback; no countdown anywhere; one text size
throughout.

Breaks to run, each naming the test it must fail: drop the active row's colour distinction; let an
out-of-range `activeIndex` reach the list; change one row's font size; stop honouring `stale`.

## 7. Device proof (iPhone XS)

Release build with the real API key via `eas env:exec preview`, because the mock payload seeds days relative
to each download and a day list built from it is meaningless. Poll the installed version on the device to
detect the build finishing, never a log line: `expo run:ios` keeps streaming logs after installing and looks
hung.

The owner places the widget and reads it. Their verdict on step 1 decides the rest of the session.
