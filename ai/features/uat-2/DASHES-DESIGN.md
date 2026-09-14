# Session 3 design: unreadable times show `--:--`

Brief: `ai/prompts/unavailable-times-dashes.md` (R1 to R15). This is the design, written before any
code so that review happens on paper. Where the brief says **ask**, the owner told this session to run
autonomously, so each such point below carries a default taken from the owner's recorded words, and
all of them go to the owner with the R15 screenshots.

## 1. Representation

- `ISingleApiResponseTransformed`: all nine time fields become `string | null`. `null` means the
  provider's value was not a zero-padded 24-hour `HH:MM`. Suhoor, Duha and Istijaba are `null` when
  their source (Fajr, Sunrise, Magrib) is. `--:--` is never stored.
- `Prayer` becomes a union: `ReadablePrayer` (`datetime: Date`, `time: string`) or `UnreadablePrayer`
  (`datetime: null`, `time: null`). `isReadable(prayer)` narrows it. Every consumer that does
  arithmetic is forced by the compiler to narrow first.
- A day **missing from the store** inside a requested range is built as a whole day of unreadable
  rows (R7). Nothing is written for it, so the 1.26.35 anchor-day trust rules in `stores/sync.ts` are
  untouched: a download without today is still added without a wipe.
- No cache schema bump: every record already stored is a valid record of the new shape.

## 2. Validation (`api/client.ts`)

- `validateApiTimes` marks each malformed field `null` instead of dropping the day (R3).
- It throws only when **no field of any day from today onwards is readable** (a format change), so a
  provider fault cannot replace a good cache with a year of dashes. Yesterday, which the filter keeps,
  does not count: a still-readable yesterday must not rescue a payload that changed format today.
- The `today is unreadable` throw goes (R1).
- The four UTC fixture dates in `api/__tests__/client.test.ts` move to London dates (gap map item 7),
  since this session rewrites those tests and they fail from 00:00 to 00:59 BST.

## 3. Building rows (`shared/prayer.ts`)

| Row | Unreadable when |
| --- | --- |
| Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha | its own field is `null`, or the day is not stored |
| Suhoor | Fajr is |
| Duha | Sunrise is |
| Istijaba (Fridays) | Magrib is |
| Midnight, Last Third of list D | D's Fajr is, **or** D−1's Magrib is, **or** D−1 is not stored (finding 72: no borrowed Magrib) |

- An unreadable row keeps its name, its Arabic name and `belongsToDate`. It never reaches
  `createPrayerDatetime`, `adjustPrayerDateForMidnightCrossing` or `calculateBelongsToDate`.
- **Sequence order becomes list order**: list day, then canonical position (`PRAYERS_ENGLISH`,
  `EXTRAS_ENGLISH`). For readable data this is identical to chronological order: within a list
  the canonical order is chronological, and a list's last row always precedes the next list's first
  (Isha before the next Fajr; Istijaba, being Magrib − 60, before the next night's Midnight). No time
  logic may rely on array position any more; it asks for instants.
- `createPrayersForDate(type, date)` is exported for the previous-day lookup (§4).

## 4. Sequence rules (new pure module `shared/sequence.ts`, no React Native or MMKV imports)

It has to be pure because `shared/widgetTimeline.ts` needs the same rules.

| Question | Rule |
| --- | --- |
| **Next** (highlight, countdown, alarms' boundary) | The readable row with the smallest instant after now. An unreadable row is never next (R9). |
| **Passed**, readable row | `datetime < now` (unchanged). |
| **Passed**, unreadable row | By position (R10): passed when every readable row before it on its own list has passed, i.e. its canonical position is before the first readable row on its list that has not passed. A list with no readable row left counts all its unreadable rows as passed. |
| **Display date** | The earliest list day in the sequence that has a readable row still to come (even after its own 00:00, as a post-midnight Isha does), or that, before 00:00 London at its end, has **no readable row at all** or is **the day before a list day with no readable row** (R8). **Owner ruling 2026-09-14:** such a day comes on screen only at 00:00 at its own start. The day before keeps its place after its last readable row until then. The exception is a readable row of its own after that 00:00 (a post-midnight Magrib or Isha), which hands over at that row. A following day the sequence does not hold is not waited for (`waitsForItsEnd`, shared by both rules). |
| **Hold end** | 00:00 London at the end of the list on screen when that list has no readable row, or waits for such a day. The countdown ticker, the foreground resync and the overlay's close boundary treat it as a boundary, exactly like a prayer, so the list moves on at 00:00 with nothing else due. |
| **Held** (countdown, bar, "ago" badge) | The list on screen is not the next readable prayer's own list day, which is exactly when it has no readable row left to come. The countdown then shows `--:--` under `...` (`COUNTDOWN_WAITING_NAME`, owner ruling 2026-09-14), on both schedules. The bar and the "ago" badge are hidden. With no readable prayer left at all it shows the same, instead of freezing at 1s. |
| **Previous** (bar, "ago" badge) | **Owner ruling 2026-09-14:** only the row just above next on its list, or, for a first row, the list before's last row (`findPreviousRow`). When that row is `--:--` there is no previous row, so the bar and the "ago" badge hide rather than measure from a prayer further up. 1.27.0 used the latest readable row before next. When the list before is not in the sequence, the store builds it from MMKV (`createPrayersForDate`), which also gives yesterday's post-midnight Isha its real instant (gap map L3). If neither list has one, there is no previous row and the bar cannot be worked out (R14). A row still to come is never used: after a launch past 00:00, yesterday's post-midnight Isha (or, on Extras, a Friday Istijaba past 00:00) rebuilt from storage can fall between now and next, and no previous row is found until the sequence is next written, at the next boundary. |
| **Next occurrence** (overlay on a passed row) | The same prayer on the earliest later list day in the sequence, readable or not (R12), else the row itself as today. |
| `prayerIdentity` | Unchanged, `english_belongsToDate`. |
| `sequenceSignature` | Identity plus instant or `-`, so a row turning unreadable is a change and a stable unreadable row is not. |
| **Boundary caching** | The next boundary is a derived atom built from the cached next-prayer and display-date atoms (the earlier of next's instant and the display date's hold end), which the screen normally subscribes together, and the ticker reads it once as it starts so both are settled even when nothing is subscribed yet. The ticker, the resume path and the overlay all read it. Worked out afresh from the clock it would always lie after now, and no crossing could ever be seen. Every sequence write also reads it at once (`settleBoundary`). A screen with the bar switched off leaves the next prayer unsubscribed, and a write in the second before a prayer would otherwise leave the list on the wrong day with `--:--` for hours. |
| **What `refreshSequence` keeps** | Readable rows still to come; every row of the display date and of later list days (a list day's unreadable rows are kept or dropped whole, never left as remnants); the row the bar measures from (`findPreviousRow`), only when it has a time, **with its whole list day**. Alone, that row would come on screen as a list of one if the day after it were rebuilt with no readable time. When the row above next is dashed there is none to keep, so the list before goes at the next refresh. |
| **No readable row ahead** | When a built or refreshed sequence has none, it grows a day at a time, to 14 days at most, so a lost week does not leave the countdown without a target. |

Behaviour this produces:

- One unreadable Asr: Asr shows `--:--`, dim until Dhuhr passes, then bright; the highlight and the
  countdown go from Dhuhr straight to Magrib; the bar and the badge hide until Magrib passes, since
  the row above Magrib has no time; the list moves on after Isha as today.
- Unreadable Fajr: bright (passed) from the moment its list is on screen, Sunrise next; the bar and
  the badge hide until Sunrise passes, since the row above Sunrise has no time.
- **Unreadable last row (Isha), the open question**: the list moves on after Magrib, the last readable
  row, exactly as it moves on after the last row today. Chosen because it is the same rule for
  every list (an Extras list ending in an unreadable Duha would otherwise hold past the next list's
  Midnight, which falls before 00:00), it is R9's rule, and it agrees with session 7: a day stays
  current until its last readable row has passed, so a readable 00:40 Magrib after an unreadable Isha
  keeps its day on screen until 00:40. The next list's Fajr then gets no bar or badge, since the row
  before it, this list's Isha, has no time.
- **Fully unreadable day D (R8, R11)**: D−1 stays on screen after its last readable row, with no active
  row, `--:--` and no bar, until 00:00 London at D's start. D then comes on screen and stays until 00:00 at
  its end, then D+1 (owner ruling 2026-09-14; 1.27.0 brought D on at D−1's last row). No highlight on D. Every row bright (the owner's
  first ruling, "treated as passed"). The countdown shows `--:--` under `...` until the list
  moves on (owner rulings 2026-09-14, section 5). A tap opens
  the next occurrence, `--:--` if that is unreadable too. The bar is hidden: its previous row would
  have to come from D or D−1's handover, and D has none.

## 5. Countdown and bar (`stores/countdown.ts`, `hooks/useCountdownBar.ts`, `components/countdown/Bar.tsx`)

- The ticker transitions at the next boundary (next readable instant or hold end).
- `CountdownStore.timeLeft` becomes `number | null`, which the display atom renders `--:--`. It is
  `null` when the overlay targets an unreadable occurrence (R12: whichever occurrence the overlay
  shows, it shows `--:--` when unreadable), and, **by the owner's ruling of 2026-09-14 (R11)**, when
  no overlay row is selected and the list on screen has no readable time left to come. Its
  name is then `...` rather than the next prayer's (owner ruling 2026-09-14, both schedules), while
  the overlay still names the prayer it shows, dashed or not. That "held" state is a cached atom per schedule
  (`getDisplayHeldAtom`): the display day is not the next readable prayer's own list day. It is
  built from the same next-prayer and display-date atoms as the boundary, so it flips on the same
  tick the list moves on at 00:00. No timer is added. A real overlay tap still counts to the
  occurrence it shows.
- The countdown stays on screen whenever a list is (`useCountdown` is ready from the display date,
  not the next prayer). After the last readable prayer in storage it shows `--:--` in place. In
  1.27.1 the component rendered nothing there, which pulled the date and the whole list up the
  page. The owner saw this live on the 3T, 2026-09-14, and it was fixed in 1.27.5.
- A new bar-availability selector is false when previous or next is missing, or while the list is
  held. **R14, chosen by the owner (option A) on 2026-09-14: the bar is hidden** by opacity,
  keeping its space so nothing reflows. It comes back when a usable pair does. The two other
  readings of "empty the bar and make it 10% capacity" (an empty track at 10% opacity, and a 10%
  fill) were built only for the owner's screenshots.

## 6. Rows (`components/prayer/*`, hooks)

- `Time.tsx` renders `--:--` for a `null` time.
- `Alert.tsx`: when the occurrence on screen is unreadable, the bell draws the Off glyph
  (`getShownAlert`) whatever is saved. It keeps the row's own colour, bright when the row is passed or
  selected and dim when upcoming, exactly like any other bell. A tap still buzzes and opens the alert
  sheet. Under its usual header, the sheet shows only a short message in the subtitle's colour, centred
  well inside the title's edges: the time isn't available, no alert will go off, and the setting is kept
  and comes back on its own. There is no action to take and no Refresh button, since nothing the user does
  can supply a time the timetable did not give. The sheet commits nothing on close. **Owner rulings
  2026-09-14**, replacing the 25% opacity and the unpressable bell first built. The saved preference is
  never changed (R5).
- `ActiveBackground.tsx` fades out when the list on screen has no next row (R11), using the overlay
  veil's existing opacity animation.
- The date-roll cascade condition `nextPrayerIndex === 0` becomes "next is the list's first readable
  row", identical for readable data.
- `usePrayerSequence` takes `isPassed`, `isNext` and the next index from `shared/sequence.ts`, so the
  hooks and the stores cannot disagree.

## 7. Alarms (`stores/notifications.ts`)

- An unreadable occurrence is skipped like a day with no data: nothing armed, and an alarm armed for
  it before the data changed is cancelled by the existing stale-cancel. The preference is untouched,
  so it resumes on the next readable day (R5, R6).
- The window stays the same list days; skipping one day does not move or shorten the others.
- The empty-cache guard in `_rescheduleAllNotifications` bails only when **no day in the window is
  stored** (it was "today is not stored"). Otherwise a day missing from the payload (R7) would stop
  tomorrow's readable alarms being armed. An upgrade wipe still leaves every day unstored, so the
  guard still holds there.

## 8. Widgets (`shared/widgetTimeline.ts`)

- Segments run between readable instants and hold ends. Each entry's day list is the display date at
  that entry (`resolveDisplayDate`), rows show `--:--` for unreadable times, and `activeIndex` is -1
  when next is not on that list. The medium layout then shows its single-prayer composition, so the
  date label stays the next prayer's own day: a held day's date is never printed beside the next
  day's time.
- Entries stay at least five minutes apart even where a hold end and the next list's first readable
  row fall within minutes of each other.
- The stale card anchors on the last readable row. A sequence with no readable row still yields no
  entries. The widgets flag stays off; this keeps them correct for when it is on.

## 9. 1 January (`stores/sync.ts`, `api/client.ts`): R13

- `fetchDay(date)` asks the endpoint for one day with `date=YYYY-MM-DD&24hours=true` and runs it
  through the same filter, validation and transform. The mock path serves that day from
  `MOCK_DATA_SIMPLE`.
- On 1 January with no 31 December stored, `initializeAppState` fetches **31 December alone**, keeps
  its place-in-line ordering, stores the day, and **does not mark the year fetched** (one day is not
  a year).
- **R13 default: a refusal and a failed fetch are the same**: it logs, carries on, and the next sync
  tries again. That branch no longer rejects `sync()` (gap map L6), 1 January shows, and only its
  Midnight and Last Third show `--:--`, with the bars following R14 until Fajr (Standard) and Suhoor
  (Extras). A failed year download on a launch with no usable cache still rejects, as today.
- A later sync that does store 31 December reopens the 12-hour notification gate, so the next
  reschedule arms that night's rows.
- Only one response is ever stored: a body whose `date` is not the requested date is a failure, so
  another day's times can never be filed under 31 December.

## 9a. A day missing from the payload (R7) at launch

- `stores/bootstrap.ts` hydrates when any day from today to today+2 is stored.
- `needsDataUpdate` does not re-download for a missing today once the current year is marked fetched
  and at least one of its days is stored: the provider's newest answer lacked the day, and asking
  again on every launch changes nothing while an offline launch would show the error screen instead of
  the day. With nothing of the year stored, or the year unmarked, it still downloads.

## 10. Who can interleave with what

| Caller | Touches | Interaction with this change |
| --- | --- | --- |
| Bootstrap hydrate (module load) | reads today, builds sequences | Today stored with `null`s still hydrates. A missing today still shows the spinner and waits for sync, as now. |
| Launch sync, foreground sync, background task sync | download, swap, `initializeAppState` | Unchanged apart from the per-field validation. An unreadable today is stored, so `needsDataUpdate()` stays false and nothing re-fetches (finding 67's loop). The 1 January day fetch is not awaited, and a new one is not sent while one under 30 seconds old is pending (so a stalled one gives way); start order decides if two answers land, and a failure no longer throws. A failed refresh with a usable day from today to today+2 stored sets the lists up instead of rejecting, so the error screen never covers them. |
| Post-sync and post-paint notification refresh, sheet commit | `getPrayerForDate` per day | An unreadable occurrence is skipped, and the id armed for it earlier is stale-cancelled. The new window guard still bails on an empty cache. |
| Countdown ticker | `refreshSequence` at a boundary | New boundary at hold end (00:00). Synchronous atom writes only. |
| Resume listener | `checkOverlayBoundary`, `resyncCountdowns` | Both use the same boundary, so a hold end crossed while suspended is caught up. |
| Overlay open and close | boundary | `canOpenOverlay` and the 2 s close use the boundary, so the list cannot change day under an open overlay at 00:00. |
| Midnight | nothing reschedules at 00:00 | Unchanged for alarms. Only the list moves, by the ticker. |
| December and 1 January | sync branches | Unchanged except §9. |

## 11. Deliberately not changed

- Finding 70's plausibility question (six `00:00`s) stays out.
- Session 7's rebuild-from-calendar-day and alarm-window defects (L1, L2) stay out. L3 is fixed only
  because the previous-row lookup now builds the day with the shared builder.
- The Standard and Extras visuals beyond the rules above.

## 12. Owner decisions taken by default (all shown on the R15 screenshots)

| Question in the brief | Default |
| --- | --- |
| R8: when a fully unreadable day comes on screen | **Owner ruling 2026-09-14:** at 00:00 London at its own start, the day before waiting after its last readable row; leaves at 00:00 at its end (1.27.0 brought it on when the day before handed over) |
| Open: a day whose last row is unreadable | Moves on after its last readable row |
| R11: rows of a fully unreadable day | Bright; tap opens the next occurrence (the countdown is ruled below) |
| R13: refusal against a failed fetch | Treated the same; retried on the next sync |
| R14: a bar that cannot be worked out | Hidden, space kept. **Owner chose this (option A) on 2026-09-14**, over both 10% readings |
| R11: the countdown on a fully unreadable day | **Owner ruling 2026-09-14:** `--:--` under `...` (not the next prayer's name, ruled the same day) while that day is on screen; at its 00:00 the next day's real countdown, through the 00:00 boundary that already exists, so no new timer |
| R5: the unavailable bell | **Owner rulings 2026-09-14:** the Off glyph at the row's normal colour. A tap buzzes and opens the sheet with a short message instead of options (the 25% opacity and the unpressable bell first built were rejected) |

## 13. Consequences the owner should see with the screenshots

Found by the design review, 2026-09-13. None is built around; each follows from the defaults above.

- **The unavailable bell locks the whole prayer's setting while it shows.** Alert preferences are per
  prayer, not per day, so on a fully unreadable day the user cannot change tomorrow's alert for that
  prayer for its 24 hours. The Off glyph also hides the saved setting until then.
- **The wait before a dashed day is longer on Extras.** The Extras list's last row is Duha (Istijaba on a
  Friday), so the readable Extras day before a fully unreadable one waits with no active row and `--:--`
  from about 07:00 until 00:00. Standard waits only from Isha.
- **The two pages can show different dates in the evening.** When only the Extras list of the next day
  is fully unreadable, Standard moves on at Isha while Extras keeps today's list until 00:00.
- **A day ending in a post-midnight row hands over at that row** (for example an Isha at 01:30), not at
  its own 00:00.
- **"Isha now" does not show** after the last row of a day before a fully unreadable one: there is no
  previous row to measure from, as with the bar.
- **After the last readable prayer in storage** (31 December before the next year is published), the
  countdown shows `--:--` under `...` rather than freezing at 1s. A cold
  launch at that point still shows the error screen, as before.
- **A partial Extras failure.** With Fajr and Sunrise unreadable on a non-Friday, that Extras list is
  fully unreadable while the next list's Midnight is readable at about 23:00. That Midnight fires on
  time but is never highlighted, because the dashed day is still on screen until 00:00.
- **A passed unreadable Istijaba cannot be tapped**, exactly as a passed readable one cannot today.
- **Unreadable Extras night rows show bright early.** R10 read literally lights them once the rows
  above them have passed, which for a leading Midnight is as soon as its list is on screen.
- **The iOS widget on a held day** shows the next readable prayer on its own day, not the held day's
  `--:--` list, because the medium layout draws its list only around an active row. Its
  `prevEpochMs` still falls back to the entry's own date when no previous row exists, as it does
  today. It also still counts down to that prayer, and draws a bar, while the app shows `--:--`: the
  widget names that prayer's own day and time, so its count reads as that day's. Left as a known gap
  because widgets are flagged off.
- **Downgrading** to a build older than this change reads a stored `null` and fails its sync; Refresh
  recovers it.
- **Known limits left in place, found by the last reviews.**
  - A 31 December answer that lands after the launch or resume refresh is armed by the next reschedule, not at
    once. After a first install, a reinstall, a Refresh or an upgrade that wipes the cache between 00:00 and about
    01:40 on 1 January, with 31 December missing, that night's Last Third alarm is not set (Midnight has already
    passed by then).
  - A sync that stores days and then fails before it finishes (chiefly if setting up the lists or starting the
    countdowns throws) skips the re-arm that a successful one gets.
  - A download landing just before the resume's first refresh reads the days can lead to two identical
    reschedules. This is harmless: identifiers are fixed, so the second overwrites the first.
  - After the clock is set back and then forward, an older 31 December request can clear a newer one's
    in-flight mark, which costs one extra request.
