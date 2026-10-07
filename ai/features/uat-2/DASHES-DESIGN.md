# Unreadable times show `--:--`: the design in force

Code and tests cite sections 4, 7, 8 and 9 of this file by number, and the rules R1 to R15 by name.
Both numberings are fixed, so some section numbers are unused.

## 0. The rules

A time is unreadable when the provider's value is not a zero-padded 24-hour `HH:MM`. "Dashed" means
drawn as `--:--`.

| Rule | In force |
| --- | --- |
| R1 | A day with unreadable times is still shown. It is never dropped and never skipped |
| R2 | An unreadable time renders `--:--` |
| R3 | Breakage is per prayer, not per day |
| R4 | A whole-day failure dashes every row of that day, Standard and Extras |
| R5 | No alert can be set against a dashed prayer, and none fires for one. The saved setting is never changed |
| R6 | Notifications, the buffer and rescheduling skip dashed rows. The setting resumes on the next readable day |
| R7 | A day missing from the payload is a whole day of dashed rows |
| R8 | A fully dashed day is never skipped. It comes on screen at 00:00 London at its own start and leaves at 00:00 at its end |
| R9 | A dashed row is never next. The highlight and the countdown pass over it |
| R10 | A dashed row is dim while a readable row above it is still to come, and bright once those have passed |
| R11 | A list with no readable row left has no highlight, and its countdown shows `--:--` under `...` |
| R12 | A tap on a dashed row behaves as on any row. A passed one opens its next occurrence. The overlay shows `--:--` when the occurrence it shows is unreadable |
| R13 | On 1 January without 31 December, fetch 31 December alone. If that fails, only 1 January's Midnight and Last Third dash |
| R14 | A bar that cannot be worked out is hidden and keeps its space. The bar and the "ago" badge measure only from the row just above next |
| R15 | Screens for the owner's approval stay outside the repository |

## 1. Representation

- Stored times are `string | null`. `null` means unreadable. `--:--` is only ever drawn, never stored.
- `Prayer` is `ReadablePrayer | UnreadablePrayer`, and `isReadable(prayer)` narrows it, so the compiler
  finds every consumer that does arithmetic.
- No cache schema bump: every record already stored is valid in the new shape.

## 2. Validation (`api/client.ts`)

- `validateApiTimes` marks each malformed field `null`. It never drops the day.
- It throws only when no field of any day from today onwards is readable, so a format change cannot
  replace a good cache with a year of dashes. A readable yesterday does not rescue such a payload.

## 3. Which rows dash together (`shared/prayer.ts`)

| Row | Unreadable when |
| --- | --- |
| Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha | its own field is `null`, or the day is not stored |
| Suhoor | Fajr is |
| Duha | Sunrise is |
| Istijaba (Fridays) | Magrib is |
| Midnight, Last Third of list D | D's Fajr is, or D−1's Magrib is, or D−1 is not stored. A Magrib is never borrowed |

Sequences are built in list order: list day, then canonical position. For readable data that equals
time order. No time logic may rely on array position; it asks for instants.

## 4. Sequence rules (`shared/sequence.ts`)

The module is pure, with no React Native or MMKV import, because `shared/widgetTimeline.ts` uses the
same rules.

| Question | Rule |
| --- | --- |
| **Next** (highlight, countdown, alarm boundary) | The readable row with the smallest instant after now. An unreadable row is never next (R9). |
| **Passed**, readable row | `datetime < now`. |
| **Passed**, unreadable row | By position (R10): passed when every readable row before it on its own list has passed. A list with no readable row left counts all its unreadable rows as passed. |
| **Display date** | The earliest list day that has a readable row still to come, even after its own 00:00. Or, until 00:00 London at its end, a list day with no readable row at all, or the day before such a day (R8). A fully unreadable day comes on screen only at 00:00 at its own start. The day before keeps its place after its last readable row until then, unless it has a readable row after that 00:00, in which case it hands over at that row. A following day the sequence does not hold is not waited for (`waitsForItsEnd`). |
| **Hold end** | 00:00 London at the end of the list on screen, when that list has no readable row or waits for such a day. The countdown ticker, the foreground resync and the overlay's close boundary treat it as a boundary, exactly like a prayer. |
| **Held** (countdown, bar, "ago" badge) | The list on screen is not the next readable prayer's own list day. The countdown shows `--:--` under `...` (`COUNTDOWN_WAITING_NAME`) on both schedules, and the bar and the badge hide. With no readable prayer left at all it shows the same. |
| **Previous** (bar, "ago" badge) | Only the row just above next on its list, or for a first row the last row of the list before (`findPreviousRow`). When that row is `--:--` there is no previous row, so the bar and the badge hide. When the list before is not in the sequence, the store builds it from MMKV (`createPrayersForDate`). A row still to come is never used. |
| **Next occurrence** (overlay on a passed row) | The same prayer on the earliest later list day in the sequence, readable or not (R12), else the row itself. |
| `prayerIdentity` | `english_belongsToDate`. |
| `sequenceSignature` | Identity plus instant or `-`, so a row turning unreadable is a change and a stable unreadable row is not. |
| **Boundary caching** | The next boundary is a derived atom over the cached next-prayer and display-date atoms: the earlier of next's instant and the hold end. The ticker, the resume path and the overlay read it, and every sequence write settles it at once (`settleBoundary`). Worked out afresh from the clock it would always lie after now, and no crossing could be seen. |
| **What `refreshSequence` keeps** | Readable rows still to come. Every row of the display date and of later list days, kept or dropped whole. The row the bar measures from, when it has a time, with its whole list day. |
| **No readable row ahead** | The sequence grows a day at a time, to `MAX_SEQUENCE_DAYS` at most, so a lost week does not leave the countdown without a target. |

What this produces:

- One unreadable Asr: the highlight and the countdown go from Dhuhr straight to Magrib. The bar and
  the badge hide until Magrib passes, since the row above Magrib has no time.
- An unreadable last row: the list moves on after its last readable row, as every list does.
- A fully unreadable day D: D−1 stays on screen after its last readable row, with no highlight and
  `--:--`, until 00:00. D then stays until 00:00 at its end, every row bright.

## 5. Countdown and bar (`stores/countdown.ts`)

- The ticker transitions at the next boundary: the next readable instant or the hold end.
- `timeLeft` is `number | null`, and `null` renders `--:--`. It is `null` when the overlay targets an
  unreadable occurrence (R12), and when no overlay row is selected and the list is held (R11).
- A held countdown is named `...`. The overlay still names the prayer it shows.
- Held is a cached atom per schedule (`getDisplayHeldAtom`), built from the same atoms as the boundary,
  so it flips on the tick the list moves on. No timer is added.
- The countdown stays mounted whenever a list is on screen, so `--:--` keeps its place.
- The bar hides by opacity, keeping its space, when previous or next is missing or while held (R14).

## 6. Rows (`components/prayer/*`, hooks)

- `Time.tsx` renders `--:--` for a `null` time.
- `Alert.tsx`: on an unreadable occurrence the bell draws the Off glyph (`getShownAlert`) at the row's
  own colour, whatever is saved. A tap buzzes and opens the alert sheet. Under its usual header the
  sheet shows only a short message, and it commits nothing on close (R5).
- `ActiveBackground.tsx` fades out when the list on screen has no next row (R11).
- The date-roll cascade runs when next is the list's first readable row.
- `usePrayerSequence` takes `isPassed`, `isNext` and the next index from `shared/sequence.ts`, so the
  hooks and the stores cannot disagree.

## 7. Alarms (`stores/notifications.ts`)

- An unreadable occurrence is skipped like a day with no data. Nothing is armed, and an alarm armed
  for it before the data changed is cancelled by the stale-cancel. The preference is untouched, so it
  resumes on the next readable day (R5, R6).
- A night row needs the previous day's own Magrib, so an unreadable Magrib also disarms the next
  list's Midnight and Last Third.
- The empty-cache guard in `_rescheduleAllNotifications` bails only when no day the windows reach is
  stored. A day missing from the payload (R7) does not stop the readable days being armed.

## 8. Widgets (`shared/widgetTimeline.ts`)

- Segments run between readable instants and hold ends. An unreadable row is never a boundary and is
  never counted down to.
- Each entry's day list is the display date at that entry (`resolveDisplayDate`). Rows show `--:--`
  for unreadable times, and `activeIndex` is -1 when next is not on that list. The layout then shows
  its single-prayer composition, so the date label stays the next prayer's own day.
- A list day with no readable row, and the day before one, stays on screen until 00:00 London.
- Entries stay at least five minutes apart (`MIN_ENTRY_SPACING_MS`).
- The stale card anchors on the last readable row. A sequence with no readable row yields no entries.

## 9. 1 January and a failed refresh (`stores/sync.ts`, `api/client.ts`)

- `fetchDay(date)` asks the endpoint for one day with `date=YYYY-MM-DD&24hours=true` and runs it
  through the same filter, validation and transform.
- On 1 January with no 31 December stored, `initializeAppState` fetches 31 December alone, stores the
  day and does not mark the year fetched. The fetch is not awaited, and a new one is not sent while
  one under 30 seconds old is pending.
- A refusal and a failed fetch are the same (R13): it logs, carries on, and the next sync tries
  again. 1 January shows, and only its Midnight and Last Third dash.
- A later sync that stores 31 December reopens the notification gate.
- A body whose `date` is not the requested date is a failure, so another day's times are never filed
  under 31 December.
- A failed refresh with a usable day from today to today+2 stored sets the lists up instead of
  rejecting. Only a launch with nothing usable stored reaches the error screen, whose Refresh wipes.

## 13. What follows from the rules

- The unavailable bell locks that prayer's setting while it shows, because settings are per prayer and
  not per day. The Off glyph also hides the saved setting until then.
- Extras waits longer before a dashed day. Its last row is Duha, or Istijaba on a Friday, so it shows
  `--:--` from about 07:00 until 00:00, while Standard waits only from Isha. The two pages can show
  different dates that evening.
- On a held day the widget shows the next readable prayer on its own day and counts down to it, while
  the app shows `--:--`.
- A build older than 1.27.0 reads a stored `null` and fails its sync. Refresh recovers it.
- Known limit: after a cache wipe between 00:00 and about 01:40 on 1 January with 31 December missing,
  that night's Last Third alarm is not set. A 31 December answer that lands late is armed by the next
  reschedule, not at once.
- Known limit: a sync that stores days and then fails before it finishes skips the re-arm that a
  successful one gets.

## 14. Choices the owner has not ruled on

Each was put to the owner on the approval page of 2026-09-14 and has no answer yet. The build does the
option marked built. A different answer changes the rule named in sections 4 to 6.

| Choice | Question | Built | The other options |
| --- | --- | --- | --- |
| C2 | The highlight when the last readable prayer passes before a dashed day | It fades out on its row. Nothing moves | Stay lit on that row until 00:00. Or slide to the last row, then fade |
| C5 | A dashed first prayer of tomorrow, shown from the evening before | Bright, counted as passed | Dim until 00:00 of its own day. Or dim until the prayer below it passes |
| C6 | A day whose last readable prayer is early | The list moves on to tomorrow after it | Stay on today until 00:00 with `--:--` |
| C7 | 00:00 into a fully dashed day | The date and the times change at once, with no cascade | Run the cascade |
| C8 | 00:00 out of a dashed day | The highlight fades in while sliding from the row it faded on. A freshly opened app fades in on the next prayer | Always fade in on the next prayer, with no slide |
| C9 | A tap on a passed prayer during the evening wait | It opens tomorrow's occurrence, even though that is dashed | Open the next day that has a time |
| C13 | The alert sheet's subtitle when the bell only explains | It stays "Close to save" | Change it to "Nothing to set" |

C10, the countdown's name while a list waits, is settled: the name is `...` on both schedules.

Defaults from the first round that the owner has also not ruled on:

| Question | Built | The other way |
| --- | --- | --- |
| Rows of a fully dashed day | Bright, counted as passed | Dim |
| 1 January, 31 December refused or failed | Treated the same: the night rows stay `--:--` and the next sync asks again | Handle a refusal differently |
| A field the provider renames | Stored: that prayer shows `--:--` all year and no alert fires | Refuse the download and keep the old times |
| 31 December evening, next year not published | 31 December stays until 00:00, then 1 January shows as `--:--` | An empty list |
| The widget on a dashed day | The next readable prayer on its own day, with a countdown | `--:--`, like the app |
