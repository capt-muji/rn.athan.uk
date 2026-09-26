# D3: the rolling window, measured against a real year

Written while planning D3, after the second reminder's arithmetic forced the window down to one list day and
the owner asked whether the worst case could be made good rather than merely affordable.

Every number here is measured against `mocks/full.ts`, the real London 2024 timetable, 366 days. The script
walks every day of the year at 15 to 60 minute resolution and asks one question: at this instant, how far
ahead does the furthest armed alarm sit?

## 1. What the window actually is

`genScheduleDatesForPrayer` returns LIST DAYS, not hours:

```
genNextXDays(rollingDaysForPrayer(...), firstStillDueListDayForPrayer(...))
```

At `NOTIFICATION_ROLLING_DAYS = 1` that is `[today]`. Rows of today already past are skipped by
`scheduleNotificationForDate`, and tomorrow's rows are out of range. So the horizon is not a span at all: it
shrinks through the day and hits zero after the day's last row.

Measured directly from the production function on 20 June, every reading identical at every hour:

| Clock (BST) | `ROLLING_DAYS = 1` | `= 2` |
| --- | --- | --- |
| 12:00, 18:00, 20:00, 22:00, 23:30 | `["2026-06-20"]` | `["2026-06-20", "2026-06-21"]` |

## 2. The cost of one list day, across the year

| Measure, 1 list day | Value |
| --- | --- |
| Share of all clock-minutes with NOTHING armed | **15.7%** |
| Share with under 6h armed | 40.7% |
| Worst case | **0h** |
| December, share of day with nothing armed | **26.4%** |
| **Minutes of the year where the next Fajr is not armed** | **79.9%** |

That last row is the finding that stops the one-day window. Fajr is the first row of a list day, so from the
moment it passes until 00:00 it is neither today's future nor in range, and for four fifths of the year it is
unarmed. Fajr is the prayer an alarm exists for.

Two list days, for contrast: worst case **18.0h**, and the next Fajr is armed at every minute of the year.

## 3. The inefficiency: days are the wrong unit

A day boundary is arbitrary against a prayer schedule. Counting days makes the app arm 11 rows it may not need
while refusing the one row it does need, purely because that row sits after midnight. The requests are spent in
the wrong place.

Counting ROWS instead spends every request on the nearest unarmed moment, so the horizon can never collapse.
Measured over the same year, all 11 rows, at-time plus both reminders:

| Armed rows | Worst horizon | Pending requests (3 alerts each) | Fits 64 |
| --- | --- | --- | --- |
| 13 | 24.3h | 39 | yes |
| 16 | 28.1h | 48 | yes |
| 19 | 32.0h | 57 | yes |
| **21** | **40.0h** | **63** | **yes, 1 spare** |
| 24 | 49.0h | 72 | no |

## 4. The better model still: cap by REQUEST, not by row

iOS keeps the 64 soonest-firing requests and drops the rest. A reminder fires before its row, so the app's
natural unit is the request, not the row. Filling the 64 slots with the soonest requests and letting the tail
fall where it lands:

| Reminders per row | Worst horizon over the year |
| --- | --- |
| 1 | **71.5h** |
| 2 | **47.1h** |

**47.1 hours with both reminders on every one of the 11 prayers**, against 44.0h for what ships today with one
reminder. The second reminder costs nothing and the worst case IMPROVES, because the request budget stops being
spent on a day boundary.

Both figures assume the worst possible user: every prayer armed, every reminder on. A typical user arms far
fewer and gets a proportionally longer horizon.

## 5. Recommendation

Replace the list-day window with a request budget:

1. Build every candidate request from the next several days of rows, at-time and reminders together.
2. Sort by fire time, keep the soonest `NOTIFICATION_REQUEST_BUDGET` (64 on iOS), arm those.
3. Android keeps the day-count path, having no cap; or takes the same path with a larger budget, which is
   simpler and keeps one code path.

This makes `NOTIFICATION_ROLLING_DAYS` a source of candidates rather than the limit itself, and it makes the
iOS ceiling explicit in the code instead of something the arithmetic has to be kept under by hand.

The property to pin in a test is not a request count but the invariant the count exists to protect: **the next
Fajr is always armed**, and **the worst-case horizon across the year never falls below 24 hours**.

## 6. What this reopens

The 2026-09-26 ruling paired the second reminder with the drop to one day, because 2 days x 3 alerts = 72 > 64.
That arithmetic is correct and is not in dispute. What it did not know is that the drop costs Fajr for 80% of
the year. Under a request budget the pairing is unnecessary: both reminders fit with a 47h worst case, and no
prayer is traded away.
