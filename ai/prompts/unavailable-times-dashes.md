# Session: an unreadable time shows `--:--`, and nothing else breaks

**Status: NOT STARTED. Specified by the owner on 2026-09-13. Queued as session 3.** Explicitly
*not* for the session it was raised in: *"this is definitely something to write very detailed,
heavy, for another session to fix. Not in this session."*

**Likelihood is low and the owner said so** — *"it's most likely not going to happen because we
trust the API"* — so this is insurance, not a fire. That changes the priority, not the depth.
The whole point of insurance is that it works the one time it is needed.

---

## The specification, in the owner's words

> "If an entire day is incorrect, we still want to show that day, but every single prayer will
> show `--:--`. All the extras and the standard for the whole day. And of course we can't put
> alerts against that. If it's just one prayer that's broken, then it should only be that one
> prayer that's broken. And this doesn't mean we need a guard for the notifications and the
> rolling window and the rescheduling — this all takes that into play."

Restated as rules:

| Rule | |
| --- | --- |
| **R1** | A day with unreadable times is **still shown**. It is never dropped and never skipped. |
| **R2** | An unreadable time renders as `--:--`. |
| **R3** | Breakage is **per prayer, not per day**. One bad Asr dashes Asr and leaves the other five alone. |
| **R4** | A whole-day failure dashes **every row, Standard and Extras**, for that day. |
| **R5** | **No alert can be set against a dashed prayer**, and none can fire for one. |
| **R6** | Notifications, the rolling window and rescheduling must all account for dashed rows rather than assuming every row has an instant. |

### What counts as broken

The owner's definition is **format only**: *"anything that's not in the format that we expect…
if they provide letters instead, that's going to break it."* The London Prayer Times endpoint
returns a zero-padded 24-hour `HH:MM` string, verified against a live pull of the 2026 year —
365 days, 2,190 values, every one exactly five characters, always zero-padded, separator always
`:` (finding 69).

So: **broken means the value is not a `HH:MM` string of that exact shape.** Wrong type, letters,
`"-----"`, empty, missing key, unpadded hour, seconds appended, out-of-range hour or minute.

**Explicitly out of scope: implausible-but-well-formed values.** A day of six `00:00`s is valid
under this definition and will render as six midnight prayers. That is a separate question,
recorded in finding 70, and it must not be smuggled into this session — a plausibility check is
a different feature with a different risk profile, and its only permitted output would be to
fail honestly, never to substitute (see the standing rule below).

### The standing rule this session must not violate

**Never copy, average, interpolate or synthesise a prayer time.** Owner ruling, 2026-09-13,
absolute, recorded as finding 70. A dashed row is the honest answer. A guessed one is not, no
matter how close it lands — it is indistinguishable from a real time on screen and someone prays
to it.

---

## Why this is worth doing even though it "won't happen"

It is not only insurance. **The spec also fixes two live defects**, both measured:

1. **Today: one bad field drops all six prayers for that day.** `validateApiTimes` works per day,
   so any single failing field removes the whole record. R3 fixes that directly.
2. **Today: the app then shows tomorrow as today.** With the record gone, the 3-day sequence
   returns 12 rows instead of 18, the display date resolves from the next future prayer — which
   is tomorrow's Fajr — and the user is shown **tomorrow's date and tomorrow's times, rendered
   completely normally, with no warning** (finding 70). A confident wrong answer, which is worse
   than a gap. R1 removes it: the day is present, so nothing falls through to tomorrow.
3. **And it dissolves finding 67's wipe loop at the source.** That loop exists because a dropped
   day leaves a *hole*: `getPrayerByDate(today)` returns null, `needsDataUpdate()` goes true, the
   cache is wiped, the year is re-downloaded, the same day is dropped again — every launch, all
   day. Under R1 the day is stored, so there is no hole, so no wipe. **Check this explicitly:
   after the change, a day with every field unreadable must not trigger a single re-fetch.**

---

## The hard part: representation, and the dependency graph

### Representation

`ISingleApiResponseTransformed` currently declares nine non-optional `string` fields
(`shared/types.ts`). `Prayer` declares `datetime: Date` and `time: string`. Both assume every
value exists.

The choice of how to say "unavailable" ripples through every consumer, so make it deliberately
and write the reasoning down:

- `null` in the transformed record and a nullable `datetime` on `Prayer` — honest, and the
  compiler then forces every consumer to handle it. That last part is the argument for it: this
  session's real risk is a consumer nobody remembered, and `strictNullChecks` finding them is
  worth more than any test.
- A sentinel string (`"--:--"`) — smallest diff, and by far the worst option. It type-checks
  everywhere and silently reaches arithmetic. Reject it.

Do not store the dashes. **`--:--` is a rendering of absence, not a value.**

### The derived-prayer dependency graph — write this out before touching code

Several rows are computed from others, so one broken field dashes more than one row. This graph
is the part most likely to be got wrong:

| Row | Derived from | Dashes when |
| --- | --- | --- |
| Suhoor | Fajr − 20 min | Fajr is broken |
| Duha | Sunrise + offset | Sunrise is broken |
| Istijaba | Magrib − 60 min (instant) | Magrib is broken |
| **Midnight** | previous day's Magrib → this day's Fajr | **either** is broken |
| **Last Third** | same pair | **either** is broken |

Note the last two cross a day boundary: **a broken Magrib on Tuesday dashes Tuesday's Istijaba
*and* Wednesday's Midnight and Last Third.** A test matrix that only breaks fields within one day
will not see that.

**The same two rows also dash when the day before is not stored at all (finding 72).** Today the app
borrows the day's own Magrib in its place (`shared/prayer.ts:150`), which the standing rule above
forbids, so an alarm built that way fires at the wrong instant: 21 minutes late on 29 March, proven
on the 3T, and by the same arithmetic about 21 minutes early on 25 October (computed, not run). In
real use it follows a dropped day, which R1 removes. It can also follow a 1 January whose cache has
lost 31 December while last year's fetch fails, which R1 does not remove (traced, not run). Whatever
the cause, show `--:--` and arm nothing, and replace `shared/__tests__/nightTimes.test.ts:194` and
`:212`, which assert the borrowed values, with item 1 of
`ai/features/uat-2/UNIT-TEST-GAPS-2026-09-13.md`.

The owner's reading, 2026-09-13: *"And if the API doesn't provide data, then we will show dash, for
example, in order to calculate midnights, the API must return Fajr and Magrib."* (Dictated; prayer
names normalised.) The owner also raised the countdown and its bar, which stay open visual decisions
(`Countdown.tsx` and `Bar.tsx`, listed below): *"I guess it's going to be dash dash dash maybe? I
don't know. Um, And then for the countdown bar, what are we going to show? Because we can't
calculate from dash dash dash dash."*

### Every consumer that assumes a row has an instant

Each of these needs a decision and a test, and the list is the starting point, not the whole of
it — grep for `.datetime` and `.time` and work through what turns up:

- `components/prayer/Time.tsx` — renders `Prayer.time`; the `--:--` lands here.
- `components/prayer/Alert.tsx` and `components/sheets/screens/Alert.tsx` — R5. What the bell
  looks like when disabled is a **visual decision the owner must approve**, and the owner reviews
  it on the device.
- `components/countdown/Countdown.tsx` and `Bar.tsx` — what does the countdown count to when the
  next row is dashed? Skip to the next readable one, or show nothing? The progress bar needs a
  previous *and* a next.
- `stores/schedule.ts` — `createNextPrayerAtom`, `createPrevPrayerAtom`, `createDisplayDateAtom`,
  `refreshSequence`, `filterRelevantPrayers`, `shouldFetchMorePrayers`, and `prayerIdentity` /
  `sequenceSignature`, which must stay stable for a dashed row or the reschedule thrashes.
- `shared/notifications.ts` — `rollingDaysForPrayer`, `genScheduleDatesForPrayer`: skip dashed
  days without shortening the rolling window for the readable ones.
- `stores/notifications.ts` — scheduling and rescheduling. **A saved alert preference must
  survive** a dashed day and resume when the data comes back; do not delete the user's setting.
- `shared/widgetTimeline.ts` and `widgets/` — the iOS widget builds its own timeline and will hit
  the same absence.
- `shared/prayer.ts` — `adjustPrayerDateForMidnightCrossing` and `calculateBelongsToDate`. A row
  with no instant has no midnight crossing; make sure the pair short-circuits rather than
  computing a date from nothing.
- `api/client.ts` — `validateApiTimes` moves from **drop the day** to **mark the field**. Keep
  the loud throw only for the case where nothing at all is readable.

---

## Testing — the owner asked for this heavily, and it is the point of the session

> *"We heavily, heavily, heavily want to write tests for this to cover everything. And we should
> have screenshots for it as well."*

The screenshot half of that was withdrawn on 2026-09-13; see the "No screenshots" bullet below.

- **Unit and integration**, table-driven, spanning the range. Per the standing fixture rule: a
  single-field fixture cannot tell "dashed that one prayer" from "dashed the day", which is the
  exact mistake that let finding 8 ship broken. Cover: one field, several fields, every field,
  a broken Magrib and its knock-on into the next day's night rows, and a broken day at each
  position in the rolling window.
- **Break each new test deliberately** and confirm it fails. A test that passes against the
  unfixed code is decorative.
- **Mutation sweep** afterwards with `ai/features/uat-2/mutate.py`. Any survivor in this area is
  a branch nothing is watching.
- **No screenshots.** The owner dropped them on 2026-09-13 and had the `evidence/` folder deleted.
  Read these rendered rows from Maestro's live `hierarchy` instead: a dashed single prayer, a fully
  dashed day, the Extras list on a day whose night rows are dashed by the previous day's Magrib, and
  the alert control in its disabled state. Not `uiautomator dump`, which serves stale trees on the
  3T (ai/AGENTS.md, Performance Design Rules, rule 10).
- **Device verification on the 3T.** Drive it with mock data — this cannot be provoked from the
  real endpoint. Confirm no notification fires for a dashed prayer and that the readable ones on
  the same day still fire correctly.

---

## Constraints

- **The dashes are a visual change, and the owner has authorised exactly this one.** `--:--` in
  place of a time, and an alert control that cannot be set. Anything beyond that — a banner, an
  explanation, a colour, an icon — is a **new** visual decision and needs asking first.
- Never touch `uat`. One concern per commit, version-bumped, merged `--no-ff` into `uat-2`.
- Comments explain why, never what.
- Independent deep review before merge. This is the data path; it has already been broken once
  this month by a change that looked obviously correct.
