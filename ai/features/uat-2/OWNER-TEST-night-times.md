# 5-minute phone test — Extras night times (ISSUES #29)

Two checks. The first takes two minutes tonight. The second takes three minutes and does
not need you to wait until 23 October: you set the phone's date forward and put it back.

Every value below is the app's own, not a hand calculation: the ordinary nights and both
October nights are pinned in `shared/__tests__/nightTimes.test.ts` against real
londonprayertimes.com data for 2026, and the 13 September row is computed with that same
verified reference.

**What the fix changed.** A night belongs to the day that follows it, so the Extras list
for a day opens with the night from the **previous** day's Maghrib to **that** day's Fajr.
The old build used the day's own Maghrib and the next day's Fajr, so it showed the *next*
night's values. On ordinary nights that is 0–2 minutes out. Around a clock change it is
about half an hour out.

---

## Check 1 — tonight (2 minutes)

Tonight is **Saturday 12 September 2026**. Maghrib 19:25, Isha 20:39.

Open the app, swipe to **Extras**, and read the top two rows.

**After Isha (20:39)** the page shows **Sunday 13 September**:

| Row | Expected |
| --- | --- |
| Midnight | **00:11** |
| Last Third | **01:46** |
| Suhoor | 04:37 |
| Duha | 06:49 |

That night runs from tonight's Maghrib 19:25 to tomorrow's Fajr 04:57 — 9 h 32 m.

**If you look before Maghrib (19:25)** the page still shows Saturday 12 September, and the
values are Midnight **00:12**, Last Third **01:46**, Suhoor 04:36, Duha 06:48. Both are
correct; they are different nights.

Standard page for reference — 12 Sep: Fajr 04:56, Sunrise 06:28, Dhuhr 13:02, Asr 16:27,
Maghrib 19:25, Isha 20:39. 13 Sep: Fajr 04:57, Sunrise 06:29, Dhuhr 13:02, Asr 16:26,
Maghrib 19:23, Isha 20:37.

Istijaba does not appear on either day — it is Friday-only, and yesterday was the Friday.

---

## Check 2 — the clock-change night, without waiting for October (3 minutes)

The clocks go back at 02:00 on **Sunday 25 October 2026**, which makes that night an hour
longer in real time. This is the case the old build got most wrong.

1. Settings → System → Date & time → turn **off** automatic date & time.
2. Set the date to **Saturday 24 October 2026**. Open the app and give it a moment to sync.
3. Swipe to **Extras** and read the top two rows.
4. Set the date to **Sunday 25 October 2026**. Reopen the app and read them again.
5. Turn automatic date & time back **on**, then open the app once more so it re-syncs.

| Extras page showing | Midnight | Last Third | the night it uses |
| --- | --- | --- | --- |
| Sat 24 Oct | **23:58** | **01:59** | Fri 17:54 → Sat 06:02 (12 h 08 m) |
| Sun 25 Oct | **23:58** | **01:00** | Sat 17:52 → Sun 05:04 (**12 h 12 m** — the clocks go back inside it) |
| Mon 26 Oct | **22:57** | **01:00** | Sun 16:50 → Mon 05:05 (12 h 15 m) |

The one that matters is **Sunday 25 October: Last Third 01:00**. The night is measured in
real elapsed time, so the extra hour is counted. A build doing naive clock arithmetic lands
around 01:20, and the old build showed 23:28 / 01:20 — which is the *24 October* row's
values appearing a day late. If you see 01:00, the fix is working.

Suhoor and Duha for those days, if you want them: 24 Oct 05:42 / 07:57, 25 Oct 04:44 /
06:59, 26 Oct 04:45 / 07:01.

### Care with the date change

- Put automatic date & time back on as soon as you are done, and open the app once
  afterwards so notifications are rescheduled from the real date.
- While the phone's date is in the future, notification times on screen refer to that
  future date. Nothing needs fixing — restoring the date and reopening the app settles it.
- The app needs the neighbouring day stored to know the previous day's Maghrib. It keeps a
  year, so after a sync both October days are already there.

---

## What a failure looks like

- Both night rows out by roughly half an hour on 25 October (for example 01:20 instead of
  01:00) — the night is being measured on the clock instead of in real elapsed time.
- The 24 October values appearing on the 25 October page — the night is still being taken
  from the wrong end (the original ISSUES #29 bug).
- A notification firing on a different night from the row that produced it — alerts and
  rows now come from one function (`getPrayerForDate`), so they cannot disagree.
