# Session: fetch first, then swap — never clear a usable cache for a fetch that might fail

**Status: NOT STARTED. Raised by the owner on 2026-09-13, queued as session 2** (after the device
verification sweep). Recorded as finding 67 in `ai/features/uat-2/AUDIT-FINDINGS.md`.

## Paste this to start the session

```
Read ai/prompts/data-resilience-swap-not-wipe.md and follow it. It is session 2 of the queue in ai/prompts/README.md: read that first for the standing rules. Work in parallel as much as you can.
```

## The owner's argument, which is correct

> "Shouldn't we fetch first? Let that be successful, then filter it, then clear the cache, then
> save the data. We need to have the data first, sanitise the data, make sure we have the data
> before we even consider clearing the cache. Because if we clear the cache, then I have 27 days
> of nothing."

`stores/sync.ts` → `updatePrayerData` currently does: **clear → await fetch → save.** Every
millisecond of that `await` is a window in which the user has no prayer times and recovery
depends entirely on the network coming back.

## First, the good news: the scenario as described is already safe

Walked through the code, 3 December, twelve months of use, data through 31 December:

- `needsDataUpdate()` → today's record exists, but `shouldFetchNextYear()` is true (December, and
  `fetched_years[2027]` is unset) → sync runs.
- `updatePrayerData()` → **scenario 3a** fires first: `shouldFetchNextYear() && isCurrentYearCached()`.
  It fetches next year only, saves on success, logs a warning and returns on failure, and
  **never reaches the wipe.**

So those 27 days survive a failed new-year fetch today. The December path the owner was worried
about is the one path that was already thought about.

## The holes are elsewhere, and one of them we created

**The wipe is reached whenever `needsDataUpdate()` is true and scenario 3a does not apply** —
which in practice means *today's record is missing*, whatever the month.

And since finding 8, today's record can be missing for a reason that has nothing to do with the
cache being stale. `validateApiTimes` now **drops** unreadable days instead of rejecting the
year. That was the right fix — it stopped one bad day in December bricking the app in June — but
it means a dropped future day sits in the cache as a *hole*, and the morning that day arrives:

1. `getPrayerByDate(now)` → null → `needsDataUpdate()` → true.
2. Not December, so scenario 3a is skipped. **`clearAllExcept` wipes the whole year.**
3. `Api.fetchYear` runs. If the network is down, it throws and the user has **nothing** — not
   the one unreadable day, the entire year.
4. If the network is up, the fetch succeeds and the guard drops the same day again. Today's
   record is still missing, `initializeAppState` still fails, and **the next launch repeats the
   whole cycle: wipe, re-download a year, fail.** All day, every launch.

Before finding 8 the same bad day was saved to the cache and threw at render time — an error
screen with the cache intact and the Refresh button available. **The failure mode changed from
"one broken day, data intact" to "wipe and re-download the year, repeatedly."** Neither is
acceptable, but the current one is worse and it is ours.

Second, smaller hole: `fetched_years` is **not** in the `clearAllExcept` preserve list, so a
failed fetch also erases the record that anything was ever fetched. Nothing local can help the
app recover; only the network can.

Third, found in session 1 (finding 76): a phone whose clock is wrong may fail every fetch. The API's
TLS certificate was valid only from 7 May to 20 November 2026 when read, so with the clock outside
that window a fetch should fail, and the wipe would then leave the app without today's times.
Session 1 did not try this on a device.

## Why the fix is cheap, and this is the key fact

`Database.clearAllExcept` and `Database.saveAllPrayers` are both **synchronous** MMKV calls —
no `async`, no `await`, checked in `stores/database.ts:110` and `:140`. The only reason a window
exists at all is the `await Api.fetchYear(...)` sitting between them.

**Move the wipe to after the await and clear+save become one uninterrupted synchronous block.**
No partial state is even representable — there is no point at which the app is running with an
empty cache. This is not a rewrite; it is moving one call past an `await`.

## The work

1. Reorder `updatePrayerData`: fetch → validate → *then* `clearAllExcept` immediately followed by
   `saveAllPrayers`, with nothing awaited between them. Both December branches and the standard
   branch. Scenario 3a already fetches without wiping and should stay as it is.
2. Decide what happens when a fetch fails and the old cache is still good: currently the throw
   propagates to the error screen. With the cache intact the app can keep serving the days it
   has, which is a **behaviour change the owner must approve** — do not ship it silently.
3. Add `fetched_years` to the preserve list, or write it back with the save. Losing it buys
   nothing and costs a full re-download.
4. **Never substitute a prayer time — owner ruling, 2026-09-13, absolute.** No copying from
   yesterday or tomorrow, no averaging, no interpolation, no synthesised value of any kind. A
   substituted time is indistinguishable from a real one on screen and someone prays to it; the
   app's value is that it shows the provider's figure, not our best guess at it. Finding 69's
   repair proposal is withdrawn; finding 70 carries the ruling.

   **The defect to fix instead is that the app shows tomorrow as today.** Measured: with today's
   record dropped, the 3-day sequence returns 12 rows instead of 18, the display date resolves to
   tomorrow, and the user gets tomorrow's times rendered completely normally — no warning, no gap.
   That is not a degraded screen, it is a confident wrong answer. The honest options are to fail
   visibly for that day (the error screen and its Refresh already exist) or to show the
   unavailable rows blank — the second is a visual change and needs separate approval.

   Also record the dropped dates so `needsDataUpdate` can tell "a hole we already know about"
   from "the cache is stale". **Re-fetching is never the answer**: the endpoint returns the same
   unreadable day every time.

   A plausibility check is worth considering separately — a shape check cannot see a time that is
   well-formed and wrong, and a day of six `00:00`s renders and schedules today without complaint.
   **Its only permitted output is to fail honestly. Never to invent a replacement.**

5. Tests must span the range, per the standing fixture rule: multi-day payloads, a fetch that
   fails after the wipe point, a dropped day arriving as today, and the December branches. A
   single-day fixture cannot tell "cleared then failed" from "never cleared" — that is exactly
   how finding 8 shipped broken.
6. Device verification on the 3T: airplane mode across a forced sync, then confirm the list
   still renders from cache.

## Constraints

The usual ones apply — never touch `uat`, one finding per commit with a version bump, merge
`--no-ff` into `uat-2`, visuals unchanged, comments say why. This is the data path that has
already been broken once this month by a fix that looked obviously correct, so: independent
deep review before merge, and no change to failure *behaviour* without asking the owner first.
