# Session: an unreadable time shows `--:--`, and nothing else breaks

**Status: DONE 2026-09-13 in 1.27.0 (`feat/audit-71-unreadable-dashes`). Every question this brief says to
ask was answered with a default taken from the owner's recorded words, listed in
`ai/features/uat-2/DASHES-DESIGN.md` §12 and §13 and in finding 71's closure. Round 2, 2026-09-14 (1.27.1 to
1.27.3 on `feat/audit-71-dashes`, not merged), built the owner's rulings on the screenshots:
- R8: a dashed day comes on only at its own 00:00
- R11: the countdown shows `--:--` while waiting
- R14: the bar stays hidden
- R5: the bell stays at the row's colour and opens an explanation sheet
Choices C2, C5 to C10 and C13 on the approval page still wait for the owner.** Specified by the owner on 2026-09-13, and extended by the owner the
same day during session 2 (see "Owner additions", after the testing section).
Explicitly *not* for the session it was raised in: *"this is definitely something to write very
detailed, heavy, for another session to fix. Not in this session."*

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
lost 31 December while last year's fetch fails, which R1 does not remove (traced, not run; R13 below
now covers it). Whatever the cause, show `--:--` and arm nothing, and replace
`shared/__tests__/nightTimes.test.ts:194` and `:212`, which assert the borrowed values, with item 1
of `ai/features/uat-2/UNIT-TEST-GAPS-2026-09-13.md`.

The owner's reading, 2026-09-13: *"And if the API doesn't provide data, then we will show dash, for
example, in order to calculate midnights, the API must return Fajr and Magrib."* (Dictated; prayer
names normalised.) The owner also raised the countdown and its bar (`Countdown.tsx` and `Bar.tsx`,
listed below), which R9 and R14 now answer, apart from R14's open choice and what the countdown
shows on a fully dashed day (R11): *"I guess it's going to be dash dash dash maybe? I don't know.
Um, And then for the countdown bar, what are we going to show? Because we can't calculate from dash
dash dash dash."*

### Every consumer that assumes a row has an instant

Each of these needs a decision and a test, and the list is the starting point, not the whole of
it — grep for `.datetime` and `.time` and work through what turns up:

- `components/prayer/Time.tsx` — renders `Prayer.time`; the `--:--` lands here.
- `components/prayer/Alert.tsx` and `components/sheets/screens/Alert.tsx` — R5. What the bell
  looks like when disabled is a **visual decision the owner must approve**, and the owner reviews
  it on the device.
- `components/countdown/Countdown.tsx` and `Bar.tsx` — what does the countdown count to when the
  next row is dashed? The owner answered in session 2: the next readable one (R9), apart from a fully
  dashed day, which R11 still asks about. A bar that cannot be worked out is hidden or shown disabled
  at 10%, never dashed (R14).
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

The screenshot half was withdrawn on 2026-09-13 as evidence, then asked for again the same day to
approve the new visuals: see R15 in "Owner additions" below.

- **Unit and integration**, table-driven, spanning the range. Per the standing fixture rule: a
  single-field fixture cannot tell "dashed that one prayer" from "dashed the day", which is the
  exact mistake that let finding 8 ship broken. Cover: one field, several fields, every field,
  a broken Magrib and its knock-on into the next day's night rows, and a broken day at each
  position in the rolling window.
- **The owner's additions need their own cases:** a day missing from the payload, with its knock-on
  into the next day's Midnight and Last Third (R7); a fully dashed day that the display date never
  skips, from the handover R8 asks about to 00:00 London, with no highlight (R8, R11); a day whose
  last row is dashed, once the owner has answered the open question below; the highlight and the
  countdown passing a dashed row on both lists (R9); a dashed row going from dim to bright once
  passed (R10); what a tap opens on a passed and on an upcoming dashed row (R12); both branches of
  R13; and the bar that cannot be worked out (R14), once the owner has chosen.
- **Break each new test deliberately** and confirm it fails. A test that passes against the
  unfixed code is decorative.
- **Mutation sweep** afterwards with `ai/features/uat-2/mutate.py`. Any survivor in this area is
  a branch nothing is watching.
- **Screenshots only for the owner's approval (R15), never as evidence.** The `evidence/` folder
  stays deleted. Prove device claims from Maestro's live `hierarchy`: a dashed single prayer, a fully
  dashed day, the Extras list on a day whose night rows are dashed by the previous day's Magrib, and
  the alert control in its disabled state. Not `uiautomator dump`, which serves stale trees on the
  3T (ai/AGENTS.md, Performance Design Rules, rule 10).
- **Device verification on the 3T.** Drive it with mock data — this cannot be provoked from the
  real endpoint. Confirm no notification fires for a dashed prayer and that the readable ones on
  the same day still fire correctly.

---

## Owner additions, 2026-09-13, raised during session 2

Dictated while session 2 was running, in answer to what the app should do on a day it cannot
read, and on 1 January. Prayer names normalised. These extend R1 to R6, and where they differ
from anything else in this brief, these win. The owner refined the styling twice in the same
conversation; the rules below are the latest word, and the quotes keep every version so the changes
are visible. Where the owner has not decided, a rule says **ask**.

| Rule | |
| --- | --- |
| **R7** | A day **missing from the payload altogether** (364 days returned, or a week lost) is a whole-day failure: every Standard and Extras row that day shows `--:--`. |
| **R8** | A fully dashed day is **never skipped**. Today the display date is the day of the next prayer to come (`stores/schedule.ts`), and dashed rows can never be next, so without a rule the list would jump straight past the day. It stays on screen **until 00:00 London**, and the list then moves to the next day. **Ask** whether it comes on screen when the day before hands over, or only at 00:00; the owner's "for 24 hours" points to 00:00. |
| **R9** | A dashed row is **never next**, on either list. The active highlight slides past it, with the usual transition, to the next readable prayer: with Magrib dashed, Asr hands straight over to Isha. |
| **R10** | A dashed row otherwise keeps the styling its position gives any row: **dim while upcoming**, and **brightly lit once passed**, going from dim to bright with the usual transition when the highlight moves beyond it. |
| **R11** | A **fully dashed day shows no active highlight** on any row until 00:00 London, because there is no prayer to put it on. The owner's first styling message counted every row of such a day as passed and brightly lit, and the later one did not revisit it. **Ask**, on screenshot (1), whether those rows are bright or dim, what the countdown shows, and which occurrence a tap opens. |
| **R12** | Tapping a dashed row behaves as tapping any row does. The owner first put it as a dashed row being past, so its overlay shows the next occurrence, tomorrow's; with R10 that holds for a passed dashed row, while an upcoming one behaves as upcoming. Whichever occurrence the overlay shows, it shows `--:--` if that occurrence is unreadable. **Confirm on the screenshots below.** |
| **R13** | **1 January with 31 December not cached** (fresh install, Refresh, or an old version first opened that day): fetch **31 December alone** with the endpoint's `date=YYYY-MM-DD` parameter, instead of the whole previous year. If the endpoint refuses it, 1 January still shows normally, and only 1 January's Midnight and Last Third show `--:--`. The countdown bars that need 31 December follow R14: the Standard bar until Fajr and the Extras bar until Suhoor. The owner did not separate a refusal from a failed fetch: **ask**. Today that case shows the error screen all day, and Refresh cannot fix it (traced from the code, not run on a device). |
| **R14** | A countdown bar that cannot be worked out is **not dashed**. Either hide it, or show it disabled at 10% (the owner said "empty the bar and make it 10% capacity": **ask** whether that means fill or opacity), until a prayer it can use comes round. The owner has not chosen between the two, so show both as screenshots. |
| **R15** | **Screenshots for the owner to approve or reject**, an explicit exception to the no-screenshots rule. Each one **without the overlay and with it**: (1) a fully dashed day; (2) a single dashed prayer; (3) Fajr and Magrib dashed, with Sunrise next; (4) tapping the dashed Fajr, which has passed; (5) tapping the dashed Magrib in that scene, which is still upcoming; (6) both countdown-bar options from R14, added because the owner has not chosen. Keep them out of the repo and out of `/tmp`. |

> *"When it's not matching that, we will put dash dash colon dash dash, for the full day, for all
> five prayers, and all extra times as well, because we can't calculate anything. If it's only one
> out of those five, we put dash dash for only that one, and the rest are shown from the source."*

> *"If it's completely missing a day ... we continue on and essentially refresh at midnight, English
> midnight ... for 24 hours it will just show dash, dash, dash, dash ... until 12 o'clock AM, then it
> will go to the next day and start calculating from the next day."*

> *"Every prayer on the extras and the standard schedule should be treated as passed if it's dash,
> dash, dash, dash ... if I tap on it, it should show me the overlay for the next occurrence, which
> should be the next day. If the next day is also broken, it should also show dash dash."*

> *"I think we should just keep it as brightly lit dash dash in all cases, regardless of whether it's
> upcoming, it's past or it's next."* (Superseded by the next quote.)

> *"If it's the full day, then the active background will not be on any of them ... we won't show the
> active background, it will disappear. If the dashed prayer is just one prayer and it's not next and
> it's not passed, it's an upcoming prayer, then we will give it the same styling. Just keep the same
> styling ... If Magrib is dashed and Asr is not dashed, and the active next prayer is Asr, Asr will
> have the active background. But after the countdown finishes, it will skip over Magrib and go
> straight to Isha, in the same smoothness, same transition speed ... when Asr is still next, Magrib
> will be dim. But after it passes Magrib, it will go to Isha, and now Isha is next. So Magrib will
> now be brightly lit, and it will follow the same transition going from dim to bright. And same when
> Magrib is dim and you tap on it, it will become bright. So it will keep the exact same behaviour."*

> *"Please take some screenshots of this for me so I can see what it looks like, so I can improve or
> disapprove ... at least three: the overlay of dash dash, a full day of dash dash, and a single
> prayer dash dash."* And later: *"Show me Fajr being dashed and Sunrise being the next prayer ... and
> tapping the Fajr dashed and tapping the Magrib dashed, Fajr is passed, but Magrib is upcoming. I want
> you also to take screenshots before, without the overlay, and with the overlay."*

> *"On January 1, if someone downloads on January 1, we can use this exact one to get yesterday's
> one ... I'm pretty sure one day, yesterday, will exist. So let's go ahead with that logic. And if
> it doesn't exist, we will simply show the dash dash dash for the things that we cannot calculate.
> If it's the countdown bar, for example, we just won't show it, there's no need to show a dash. Or
> maybe we will empty the bar and make it 10% capacity, just to show that it's disabled ... then it
> will get enabled for the next prayer when it becomes available."*

**Dependencies, restated by the owner:** anything worked out from a dashed time is dashed too.
Midnight and Last Third need Magrib and Fajr, Suhoor needs Fajr, and Duha needs Sunrise. The graph
above adds Istijaba, which needs Magrib.

### What the endpoint serves, measured 2026-09-13 with the production key

| Request | Answer |
| --- | --- |
| `year=2026` | HTTP 200, 365 days |
| `year=2024`, `year=2025`, `year=2027` | HTTP 200, `times` empty |
| `date=2026-09-12` | HTTP 200, one day as a flat object (`date`, `fajr`, `fajr_jamat`, `sunrise`, ...) |
| `date=2025-12-31`, `date=2025-09-13`, `date=2027-01-01` | HTTP 404, with an `error` field |

In September only the current year is served, by either parameter. The owner expects last year's
31 December still to be there on 1 January, when the provider has only just rolled over. That
cannot be checked before 1 January 2027, and the provider's TLS certificate runs only from 7 May to
20 November 2026, so the 3T cannot reach the live endpoint with its clock on 1 January. Prove the
request shape with a live call from the Mac, sending `24hours=true` as the year request does
(`api/client.ts:14`), and both branches with unit tests.

**Measured again on 2026-09-13, after session 2.** With `24hours=true`, `date=2026-09-12`,
`date=2026-01-01` and `date=2026-12-31` each return HTTP 200, and all six times match the same
day in the `year=2026` download. Without `24hours=true` the same requests return afternoon times
in 12-hour form, such as Dhuhr `01:02` for `13:02`, which still pass the `HH:MM` check
(`TIME_PATTERN` in `api/client.ts`), so the single-day request must send it. `date=2025-12-31`
still returns HTTP 404 with `No data found`, and `year=2025` returns no days. So the single-day
request agrees with the year download at both ends of the current year and in the middle. Whether
the provider still serves 31 December once 1 January has come can only be seen on 1 January 2027,
which is why R13 keeps its fallback.

### Open: ask the owner before building R8 and R9

When a day's **last** row is dashed (Isha, say), does the list move on after its last readable row,
or at 00:00 London? R9 with today's display rule would move it on at Magrib, while session 7 keeps a
day current until its last prayer has passed. Session 7 must follow the answer. Put session 7's case
in the same question, and in R8's: where a readable row falls after 00:00, as the 00:40 Magrib does
on session 7's mock, a move at 00:00 drops it while it is still due.

What the owner said about a single dashed row after 00:00 settles which rows dash, not when the list
moves on: *"if only Isha is missing, then only Isha will be dash dash, and everything else will have
a number."*

---

## Constraints

- **The dashes are a visual change, and the owner has authorised exactly these.** `--:--` in place
  of a time, an alert control that cannot be set, and the styling in R9 to R11 and R14. Each is
  subject to the owner's verdict on the R15 screenshots, which is also where R11 and R14 put their
  open questions. Anything beyond that, such as a banner, an explanation, a colour or an icon, is a
  **new** visual decision and needs asking first.
- Never touch `uat`. One concern per commit, version-bumped, merged `--no-ff` into `uat-2`.
- Comments explain why, never what.
- Independent deep review before merge. This is the data path; it has already been broken once
  this month by a change that looked obviously correct.
