# Code audit: findings (task 19)

Session 3 of the owner-ordered four-session chain. This document is the whole deliverable:
no application code changed, no fix branch opened. Task 20 (session 4) works through these
one at a time.

**Scope.** Every tracked source file in the repository, 172 of them, plus the committed
configuration, the native module, the config plugins, the e2e harness and the assets. The
per-file coverage table at the end names who read what, so the gaps are visible rather than
implied.

**Date.** 2026-09-12, at app version 1.25.3, branch `uat-2`.

## The bar this document is ranked by

This app is an alarm clock. A prayer time two minutes wrong is a bug; a notification on the
wrong night is a serious one. Everything below is ranked by risk to the correctness of
times, and nothing else. Performance, tidiness and style sit in Tier 6 where they belong.

Tier 1 can put a wrong, missing or silent alert in front of a user on the build that ships
today. Tier 2 degrades correctness, recovery or the coverage that protects them. Tier 3 is
the measurement harness, which earns its own tier because it is what the project uses to
prove the other tiers are fixed. Tier 4 is the iOS widgets, behind a flag that is currently
off. Tier 5 is v2.0 global readiness, which costs nothing today. Tier 6 is hygiene.

## How to read a finding

Each one carries a file and line, a concrete failure scenario, the evidence, and a
confidence word:

| Word | Meaning |
| --- | --- |
| **CONFIRMED** | Reproduced by a test, a command, or an unambiguous read of the source. |
| **LIKELY** | The mechanism is proven; the trigger is inferred and named. |
| **GUESS** | Stated as a guess. Not a conclusion. |

Findings marked **[test]** are reproducible with the verification suite described in the
appendix. That suite lives outside the repository and is not committed.

---

# Summary

| # | Finding | Tier | Confidence |
| --- | --- | --- | --- |
| 1 | `releases.json` says 1.0.0: correct today, a release-checklist trap tomorrow. **Do not touch the file** | 6 | RE-RANKED |
| 2 | `forceNotificationReschedule()` cannot reopen the 12-hour gate | ~~1~~ 2 | **CORRECTED on device: latent, not live** |
| 3 | The extras preference migration lands on the wrong prayers | 1 | CONFIRMED [test] |
| 4 | The migration's writes are invisible to the reminder atoms in the same session | 1 | CONFIRMED [test] |
| 5 | Android's five daily athan channels are never created at schedule time | 1 | CONFIRMED |
| 6 | The error screen's only button deletes the prayer cache | 1 | CONFIRMED |
| 7 | No error boundary, and the display-date atom throws when nothing is in the future | 1 | CONFIRMED [test] |
| 8 | A malformed or partial API day crashes the pipeline | 1 | CONFIRMED [test] |
| 9 | `eas.json` pins no environment; the EAS dashboard supplies it, so the repo does not record its own contract | 6 | RESOLVED by owner |
| 10 | `AlertType`'s persisted integers are pinned by nothing | 1 | CONFIRMED |
| 11 | The notifications mock breaks the identifier-echo invariant the sweep depends on | 1 | CONFIRMED |
| 12 | Extras night rows get roughly 19 hours less buffer than every other row | 2 | CONFIRMED [test] |
| 13 | `setSequence`'s identity-skip drops a mid-window data correction | 2 | CONFIRMED [test] |
| 14 | The two cache keep-lists disagree on `cache_schema_version` | 2 | CONFIRMED |
| 15 | The AppState listener registers 1500 ms late, and that resume gets no resume handling | 2 | CONFIRMED |
| 16 | The warm-cache bootstrap is skipped on every version bump, not just schema changes | 2 | CONFIRMED |
| 17 | The "2-day buffer" is two calendar days, about 17.8 hours in the winter worst case | 2 | CONFIRMED |
| 18 | `compareVersions` inverts on a `v` prefix or any non-numeric segment | 2 | CONFIRMED |
| 19 | What's New shows 1.24.30's items headed 1.25.3 | 2 | CONFIRMED |
| 20 | `EXPO_PUBLIC_BG_INTERVAL_MINUTES` validates the floor but not the ceiling | 2 | CONFIRMED |
| 21 | The iOS 64-pending ceiling is one constant increment away, and nothing guards it | 2 | CONFIRMED |
| 22 | `cacheSchemaChanged`, the sole gate on wiping the cache, has zero tests | 2 | CONFIRMED |
| 23 | `atomWithStorageNumber` yields NaN for a corrupt value and 0 for an empty string | 2 | CONFIRMED |
| 24 | `scheduleNotificationAsync` is never made to reject in any test | 2 | CONFIRMED |
| 25 | Mock prayer times outlive the build that wrote them | 2 | CONFIRMED |
| 26 | Nothing guards the 99-file audio matrix, and no reminder file has an integrity test | 2 | CONFIRMED |
| 27 | `mergeAndDeduplicatePrayers` can duplicate a prayer whose time changed | 2 | LIKELY |
| 48 | The extras alert bell resolves its preference through two different index spaces | 2 | LATENT, tested |
| 49 | The sound sheet persists the athan before a reschedule that can throw | 2 | CONFIRMED |
| 50 | The alert sheet ignores the permission result and shows a selection it never saves | 2 | CONFIRMED |
| 51 | `Day.tsx` coerces a null display date to `''`, which throws | 2 | CONFIRMED |
| 52 | The only quality gate is a git-ignored hook a fresh clone does not get | 2 | CONFIRMED |
| 53 | `pino` is a devDependency but ships in the production bundle | 2 | CONFIRMED |
| 54 | Four environment variables change production behaviour with no environment guard | 2 | CONFIRMED |
| 55 | The whole suite runs with the widgets flag on, the opposite of what ships | 2 | CONFIRMED |
| 56 | The "logging is disabled in production" guarantee has no test | 2 | CONFIRMED |
| 57 | `List` renders a partial day without complaint (a candidate for ISSUES #27 that does not fit it) | 2 | REFUTED as #27 |
| 28 | `frame-audit.sh`'s SurfaceFlinger fallback can never print FAIL | 3 | CONFIRMED |
| 29 | `device-checks.sh` calls a permission present without reading the grant | 3 | CONFIRMED |
| 30 | `device_checks.py` counts a restatement line as an armed alarm | 3 | CONFIRMED |
| 31 | `device_checks.py` flags every pre-prayer reminder as a stray alert | 3 | LIKELY |
| 32 | `device_checks.py` matches the package by substring | 3 | CONFIRMED |
| 33 | `baseline-compare.sh` reports medians from a flow that failed | 3 | CONFIRMED |
| 34 | `idle-cpu.sh` reports a confident 0.0% on multi-pid output | 3 | CONFIRMED |
| 35 | `device-checks.sh` prints PASS for a check it did not perform | 3 | CONFIRMED |
| 36 | The perf ring's `ts` axis is wrong, so mark-to-mark deltas read about twice the truth | 3 | CONFIRMED |
| 37 | Beyond 24 hours the widget countdown label freezes at the segment's full length | 4 | CONFIRMED |
| 38 | Inside the horizon the widget label over-reads by up to 7m50s | 4 | CONFIRMED |
| 39 | One native throw permanently kills the widget's per-minute re-push chain | 4 | CONFIRMED |
| 40 | No widget suite can catch 37 or 38; every label assertion restates the implementation | 4 | CONFIRMED |
| 41 | `widgetSettingsSync` pins the calendar date where the contract is `belongsToDate` | 4 | CONFIRMED |
| 42 | A cache gap makes the widget present the next day's prayer all day | 4 | CONFIRMED |
| 43 | The API endpoint is London with no city parameter | 5 | CONFIRMED |
| 44 | Magrib is the one prayer with no midnight-crossing rule | 5 | CONFIRMED |
| 45 | ~~Asr is hardcoded to the Hanafi calculation~~ | 5 | **WITHDRAWN** by owner ruling |
| 46 | The London-pinned test oracles will fail as false alarms when the timezone flips | 5 | CONFIRMED |
| 47 | High latitude: no polar-day handling, and a missing Sunrise crashes | 5 | CONFIRMED |
| 59 | An Android force-stop disarms every alert and the 12-hour gate stops the next launch restoring it | 1 | CONFIRMED on device, **live in 1.5.2** |
| 58 | `device_checks.py` crashes when two alarms share a minute | 3 | CONFIRMED, found in session 4 |
| a-aa | Hygiene, docs and tidiness (27 items), plus four accessibility items | 6 | see Tier 6 |

---

# Tier 1: can produce a wrong, missing or silent alert today

## 1. RE-RANKED to Tier 6: `releases.json` is correct today. Do not touch the file.

**This was ranked first, and that was wrong.** It rested on an assumption I could not check
from the repository and did not flag clearly enough: that releases had shipped past the version
in the file. They have not. Corrected here rather than quietly edited, because the reasoning
error is worth keeping visible.

**What is actually true.** Production is 1.5.2 on both stores and nothing newer has been
released. The file says 1.0.0. `isNewerVersion('1.5.2', '1.0.0')` is false, so no prompt fires,
**and that is the correct outcome**: there is no newer production release to point a user at.
The mechanism is behaving exactly as designed.

**Owner ruling, 2026-09-12: the file must not be edited, corrected or deleted.** Live apps in
both stores fetch it. It stops being read only once the update-prompt feature is removed from
the codebase and that removal has shipped to users; the file is deleted in a separate commit
after that, never before. The replacement is ISSUES #35 and keeps its own session.

**What survives as a finding**, and it is a Tier 6 process note rather than a defect: the file
has never been edited since the feature landed, so the manual bump after a store release is a
step with no precedent and nothing enforcing it. The first production release past 1.5.2 will
need it, and the consequence of forgetting is silent. It belongs on the release checklist, not
in a code change. Finding 18 compounds it: a `v` prefix or any non-numeric segment written into
that file inverts `compareVersions` and disables the prompt with no log and no error.

The original write-up follows, kept for the record.

`releases.json` on `main`, fetched by `device/updates.ts:13`. App version is 1.25.3
(`app.json:5`).

```
$ git show origin/main:releases.json | grep -A1 '"version"'
production.android: "1.0.0"
uat.ios:            "1.0.0"
uat.android:        "1.0.0"

$ git log --oneline -1 -- releases.json
59c6958 add update popup with version check and store redirect
```

The file has never been edited since the feature landed, and its own `_comment` says it must
be set to the latest released version after every release.

`device/updates.ts:63` runs `isNewerVersion('1.25.3', '1.0.0')`, which is false, so
`checkForUpdates()` returns false and no prompt is ever shown. Only production iOS works,
because it bypasses the file and queries the iTunes lookup API instead.

**Why this is ranked first.** Every other finding in this document is a fix that has to
reach a user. On production Android and on both UAT channels, nothing tells a user a fix
exists. For an app whose fixes are alarm fixes, a dead update path multiplies the cost of
every other defect here.

CONFIRMED. The redesign of this mechanism is ISSUES #35, which is explicitly out of scope
for sessions 3 and 4. The three version strings are not: they are a data edit on `main`,
and the owner owns that file.

## 2. `forceNotificationReschedule()` cannot reopen the 12-hour gate

**CORRECTED 2026-09-12 on the device: this is NOT a live defect in a Release build.** The
finding's mechanism is real but its premise about evaluation order is wrong for the bundle that
actually ships. Kept in full below, because the reasoning error is worth seeing, and because
one config line is all that stands between it being wrong and being right.

**What the device showed.** A Release build of the **unfixed** code, upgraded with the gate
deliberately closed (verified beforehand: `needsRefresh: false`, `Skipping reschedule, last
schedule was within 12 hours`), reopened the gate correctly:

```
15:38:33.102  VERSION: Reset notification schedule timestamp to force reschedule   <- key removed
15:38:33.107  PROBE: notifications.ts module evaluated  { seeded: 0 }              <- atom created 5 ms LATER
15:38:35.254  NOTIFICATION: Never scheduled before, needs refresh                  <- gate OPEN
```

`stores/notifications.ts` is evaluated **after** the key is removed, not before, so the atom is
seeded from an already-absent key and reads 0. The finding assumed the opposite order, which is
what jest and a dev bundle do.

**Why the order differs, and why that is itself a finding.** `metro.config.js` sets
`inlineRequires: true`, under a comment reading *"THROWAWAY perf22 experiment: defer module
evaluation to first use."* Expo's default is `false`. Inlined requires defer each `require` to
first use, and `stores/version.ts` uses its `@/stores/notifications` import only for
`migrateIndexKeyedAlertPreferences()`, the **last** statement of `handleAppUpgrade` — after
`forceNotificationReschedule()`. Remove that throwaway line and the defect described below
becomes real and silent. Recorded as finding 60.

**The fix stays, and is better justified than the finding was.** `resetStoredAtom` does not
depend on evaluation order at all: it clears the key and the atom together, so the behaviour is
the same whether `inlineRequires` is on or off. What it buys is not a live bug fix but the
removal of a dependency on a bundler experiment nobody intends to keep.

**Severity: downgraded from Tier 1 to Tier 2**, as a latent defect gated by a config line.

**FIXED in 1.25.18** (`fix/audit-2-reset-stored-atom`). `stores/storage.ts` gains
`resetStoredAtom(atom, key)`, which writes `RESET` through the atom: that removes the MMKV key
exactly as before **and** puts the atom back to its initial value, so the next `store.get`
sees it. The rule is now stated at the top of that file: never write MMKV behind one of these
atoms. `forceNotificationReschedule()` uses it.

The regression test is the finding's own probe inverted, at
`stores/__tests__/version.test.ts`: set the gate atom to `Date.now()`, run `clearUpgradeCache()`,
assert the atom reads 0. Against the previous code it read the stale timestamp. The existing
assertion that the MMKV key is removed is untouched and still passes, because `RESET` routes
through the same `removeItem`. 1015 tests to 1016.

Two things worth recording from doing it. `getDefaultStore()` is called inside the helper
rather than at module scope: `stores/storage.ts` sits near the root of the import graph, and
creating the default store there would move when every other module's `getDefaultStore()`
resolves. And the old code's `Database.database.remove` was throwing unnoticed in the
integration tests, swallowed by `forceNotificationReschedule`'s own try/catch, because that
helper's mock never supplied a `database` object.

`stores/version.ts:190-197`, `stores/storage.ts:12`, `stores/notifications.ts:266` and
`:812`. Root cause in `node_modules/jotai/vanilla/utils.js:509`.

`atomWithStorage` with `{ getOnInit: true }` reads storage **at atom creation**, which is
module evaluation:

```js
var baseAtom = vanilla.atom(getOnInit ? storage.getItem(key, initialValue) : initialValue);
```

`baseAtom.onMount` re-reads, but only when React subscribes. A bare `store.get()` never
mounts an atom.

The import chain puts that snapshot before the upgrade handler:

```
app/_layout.tsx:10   import '@/stores/bootstrap'
stores/bootstrap.ts:30   import { wasAppUpgraded } from '@/stores/version'
stores/version.ts:6      import { migrateIndexKeyedAlertPreferences } from '@/stores/notifications'
stores/notifications.ts:266  lastNotificationScheduleAtom = atomWithStorageNumber(...)  <- reads MMKV here
...
app/_layout.tsx:37   setTimeout(triggerSyncLoadable, 0)  ->  sync()  ->  handleAppUpgrade()  <- writes MMKV here
```

`stores/version.ts:185-188` states the opposite: *"Jotai reads the key from MMKV lazily on
first access, so removing it before shouldRescheduleNotifications() runs is what makes that
return true."* It does not. Nothing subscribes to `lastNotificationScheduleAtom` anywhere
in the repository, so its `onMount` never fires and the module-evaluation snapshot is the
only value `shouldRescheduleNotifications()` ever sees.

Reproduced against the real module graph:

```
A6  after handleAppUpgrade(): MMKV key removed = true
A6  shouldRescheduleNotifications() = false   (the upgrade intended true)
```

**Failure scenario.** A user updates the app. `handleAppUpgrade()` takes the post-#34 branch
at `stores/version.ts:257-259`, keeps the cache and calls `forceNotificationReschedule()` to
force one reschedule. At +1500 ms `refreshNotifications()` asks the gate, which reads the
stale pre-removal timestamp, finds fewer than 12 hours elapsed, and skips. On a release that
changes *when* alerts fire, which is exactly the ISSUES #29 night-times class, the user keeps
the previous build's armed times for up to twelve hours.

CONFIRMED [test]. Found independently by two reviewers, with two separate probes.

**Fix direction.** Write through the atom: `store.set(lastNotificationScheduleAtom, 0)`.
`stores/version.ts` already imports from `stores/notifications.ts`, so there is no new cycle.
The general rule is worth stating in `stores/storage.ts`: never write MMKV behind a persisted
atom.

## 3. The extras preference migration lands on the wrong prayers

`stores/notifications.ts:227-254`.

`migrateIndexKeyedAlertPreferences()` maps `preference_alert_extra_<index>` to
`preference_alert_extra_<name>` using the **current** `EXTRAS_ENGLISH`. The index keys in the
wild were written against a different array. The history:

| Commit | Date | App version | `EXTRAS_ENGLISH` |
| --- | --- | --- | --- |
| `0d1e627` | 2025-02-22 | 1.0.x | `['Last Third', 'Suhoor', 'Duha', 'Istijaba']` |
| `a75a453` | 2026-01-17 | 1.0.27 | `['Midnight', 'Last Third', 'Suhoor', 'Duha', 'Istijaba']` |
| `ec1c298` | 2026-08-28 | 1.5.3 | name-keyed preferences and this migration land |

Midnight was inserted at position 0 seven months before the migration was written. Any
install whose last run predates 1.0.27 still holds four index keys written against the old
array. Confirmed against the historical source:

```
$ git show ec1c298^:stores/notifications.ts | grep preference_alert
  return atomWithStorageNumber(`preference_alert_${type}_${prayerIndex}`, AlertType.Off);
```

The key format matches exactly what the migration reads. Running the real migration against
pre-Midnight keys:

```
A1  old index -> what it meant -> where the migration put it
A1    extra_0  "Last Third"  ->  preference_alert_extra_midnight
A1    extra_1  "Suhoor"      ->  preference_alert_extra_last third
A1    extra_2  "Duha"        ->  preference_alert_extra_suhoor
A1    extra_3  "Istijaba"    ->  preference_alert_extra_duha
A1  resulting alert keys: {"Midnight":"2","Last Third":"0","Suhoor":"1","Duha":"0"}
A1  Last Third's 30-minute reminder landed on: preference_reminder_interval_extra_midnight = 30
A1  standard: all six land on their own name key (no shift)
```

**Failure scenario.** A user on a January 2026 build updates today. They had Sound on Last
Third. They now get an athan at Islamic Midnight, which they never asked for, no alert at
Last Third, which they did, and Istijaba loses its setting entirely because there is no
fifth index to migrate. The old keys are removed in the same pass, so nothing can recover
the original intent afterwards.

Standard prayers are unaffected: `PRAYERS_ENGLISH` has never changed order.

CONFIRMED [test]. The blast radius is narrow, limited to installs that have not run since
January 2026, and I have no telemetry to size it. That narrowness is the reason this sits
third rather than first, not a reason to leave it.

## 4. The migration's writes are invisible to the reminder atoms in the same session

Same root cause as finding 2. `stores/notifications.ts:189-215`, `:342`, `:380`.

The at-time alert atoms are rescued by accident: `components/prayer/Alert.tsx:53` does
`useAtomValue(getPrayerAlertAtom(type, index))`, so React mounts them, `onMount` re-reads
MMKV, and that happens before the +1500 ms scheduling pass. The reminder atoms are not
rescued. A grep over the whole tree finds no `useAtomValue` or `store.sub` on any reminder
alert or reminder interval atom; they are read only through `store.get` at
`stores/notifications.ts:650`, `:785` and `:907`.

```
A6  after the migration, MMKV holds preference_alert_extra_midnight = 2
A6  but getPrayerAlertType(Extra, Midnight) still reads = 0 (AlertType.Off = 0)
```

**Failure scenario.** On the launch where any migration runs, `getReminderAlertType` returns
`Off` and `getReminderInterval` returns the 5-minute default rather than the user's stored
value. `_addAllScheduleRemindersForSchedule` then actively **clears** those reminders
(`stores/notifications.ts:791-792`), and `refreshNotifications` stamps the 12-hour gate on
the way out. The headless background task is worse: there is no React at all, so nothing is
ever mounted and nothing rescues it.

This is currently latent, because `migrate()` short-circuits once the old keys are gone. The
pattern is the hazard. Any future migration written the same way disarms alarms the user
set.

CONFIRMED [test].

## 5. Android's five daily athan channels are never created at schedule time

`device/notifications.ts:81-83`, `shared/notifications.ts:192-205`, `:219-233`, `:239-257`.

The codebase states the rule twice, at `device/notifications.ts:79` and
`shared/notifications.ts:217`: *"Android drops notifications posted to nonexistent
channels."* The extras channel and the reminder channels are therefore created at schedule
time. The five daily prayers are excluded from that guard by the negation:

```ts
if (alertType === AlertType.Sound && Platform.OS === 'android' && !NotificationUtils.isDailyPrayer(englishName)) {
    await NotificationUtils.createExtrasAndroidChannel();
}
```

`athan_<N>_v2` for N greater than 1 has exactly one creator, and it is a UI dismiss handler:

```
$ grep -rn "updateAndroidChannel" --include="*.ts" --include="*.tsx" .
components/sheets/screens/Sound.tsx:143:    await Device.updateAndroidChannel(tempSoundSelection);
device/notifications.ts:10:export const updateAndroidChannel = async (sound: number) => {
```

Initialisation creates only index 0, hardcoded at `shared/notifications.ts:195-199`.

**Failure scenario.** Android Auto Backup is on, with no exclusion rules, in the generated
manifest. A backup restore onto a new device restores MMKV, including
`preference_sound = 4`, but notification channels are system state and are not restored.
Initialisation then creates only `athan_1_v2`, and scheduling posts Fajr, Dhuhr, Asr, Magrib
and Isha to `athan_5_v2`, which does not exist. All five daily athans stop firing, silently,
with no error, until the user happens to reopen the sound sheet. Extras and reminders keep
working, which makes it read as a per-prayer settings problem rather than a channel problem.

CONFIRMED for the code gap; the greps above are exhaustive. LIKELY for the restore trigger,
which was not performed.

**Fix direction.** Mirror the extras branch in `addOneScheduledNotificationForPrayer`: call
`updateAndroidChannel(soundPreference)` when `isDailyPrayer(englishName)`, with the same
session-dedup set that `createReminderAndroidChannel` already uses.

## 6. The error screen's only button deletes the prayer cache

`components/ui/Error.tsx:10-13`, reached from `app/index.tsx:176`.

```ts
const handleRefresh = async () => {
  Database.clearAllExcept(['app_installed_version', 'preference_']);
  await Updates.reloadAsync();
};
```

`clearAllExcept` deletes every key not matching those two prefixes: all `prayer_YYYY-MM-DD`
records, `fetched_years`, `scheduled_notifications_*`, `cache_schema_version`,
`whats_new_shown_version`, and the `prayer_max_english_width_*` measurements that ISSUES #22
and #16 deliberately added to both other keep-lists.

**Failure scenario.** It is 1 January and the previous year's 31 December record is missing.
`stores/sync.ts:59-72` fetches it with no local try/catch, so offline the fetch rejects and
`sync()` throws, even though this year's data is fully cached and today's times are on disk.
The user sees "Oh no! Something went wrong. Try refreshing!" and taps the only button, which
wipes that valid cache. Still offline, the reload now finds nothing, fetches, throws, and
returns to the error screen permanently, with no times at all. The app's own recovery
affordance converts a recoverable state into an unrecoverable one.

Secondary: `handleRefresh` is async with no catch, and the wipe lands before the reload is
attempted.

CONFIRMED for the destructive wipe. LIKELY for the 1 January reach path.

**Fix direction.** Retry without deleting anything. Re-read the loadable, or reload only.
Never delete prayer data in response to a network error.

## 7. No error boundary, and the display-date atom throws when nothing is in the future

`stores/schedule.ts:184`, absence at `app/_layout.tsx` and `app/index.tsx`.

```
$ grep -rn "ErrorBoundary|componentDidCatch|getDerivedStateFromError" --include="*.ts" --include="*.tsx" .
(no matches)
```

`app/index.tsx:176`'s `hasError` branch covers a rejected `sync()` promise only. It cannot
catch a throw during render. There is no expo-router `ErrorBoundary` export on any route.

`createDisplayDateAtom` ends with a non-null assertion:

```ts
return sequence.prayers.find((p) => p.datetime > now)!.belongsToDate;
```

`usePrayerSequence` reads that atom unconditionally, before its own `isReady` check.
Reproduced:

```
A2  sequence built at 2026-12-31 23:30 London: 6 prayers
A2  last prayer in it: Isha at 17:40
A2  reading standardDisplayDateAtom threw: TypeError: Cannot read properties of undefined (reading 'belongsToDate')
A2  control at 12:00 the same day: no throw
```

**Failure scenario.** It is the evening of 31 December and next year's dataset is not yet
published on the API, which is the exact case `stores/sync.ts:155-157` already catches and
logs as "not yet available". Today's record exists, so `needsDataUpdate()` is satisfied and
`stores/bootstrap.ts:34-39` hydrates the sequence. Every prayer in it has passed. The first
render of the prayer list throws, and with no boundary the app is dead until the year rolls
over or the data appears.

`createNextPrayerAtom` and `createPrevPrayerAtom` both return null safely in the same state.
`createDisplayDateAtom` is the only one that asserts.

A second `!` on the same class of assumption sits at `stores/schedule.ts:60`:
`Database.getPrayerByDateString(yesterday)!`, followed by an index into that value at `:76`.
`calculatePrayerAgo` wraps its caller in try/catch, but `makeBarProgressAtom`
(`stores/countdown.ts:130`) does not, so that one also throws during render.

CONFIRMED [test] for the throw. CONFIRMED for the absence of a boundary.

## 8. A malformed or partial API day crashes the pipeline

`api/client.ts:23-31` is the only validation in the chain:

```ts
if (Object.keys(data?.times ?? {}).length === 0) throw new Error('Incomplete data received');
```

Nothing asserts that a day carries its six times, or that a time is `HH:mm`. The values go
straight to MMKV and then into `createPrayerDatetime`, where `Date.parse` of a malformed
string yields NaN and `new Date(NaN).toISOString()` throws. Reproduced:

```
B1  dhuhr "11:5" -> createPrayerSequence threw: RangeError: Invalid time value
B1  missing "isha" -> createPrayerSequence threw: TypeError: Cannot read properties of undefined (reading 'split')
B1  magrib "x" -> getPrayerForDate('Fajr') threw: RangeError
B1  a day with NO times: transform threw = TypeError
```

Note the third line. Asking for Fajr throws because of a bad Magrib: the whole day is built
before the requested row is picked out, so one bad field takes down the notification
scheduler for every prayer that day, not only the affected one.

Combined with finding 7 there is no boundary to catch it. The failure is loud rather than
silently wrong, which is the better of the two directions, but it is still a dead app.

CONFIRMED [test].

**Fix direction.** One shape check in `validateApiResponse`, rejecting the response rather
than caching a day that cannot be read. This also closes the high-latitude case in finding
47, where providers emit `"-----"` or omit Sunrise.

## 9. RE-RANKED to Tier 6: the EAS dashboard supplies the environment

**Owner, 2026-09-12: the EAS dashboard sets `EXPO_PUBLIC_ENV` and `EXPO_PUBLIC_API_KEY`.** So
the contract is closed, and this is not a live risk. The finding survives only as the narrower
point it should have been: **the repository does not record its own build contract.** Nothing
in a checkout says where the environment comes from, so the failure mode is invisible to anyone
reading the code, and nothing fails loudly if a dashboard value is ever removed or renamed.

That is worth one `env` block in `eas.json` stating explicitly what the dashboard already
provides, plus a hard failure at config time when the environment is prod or preview and the
key is absent or still the `.env.example` placeholder. Both are cheap, and both turn a silent
class of failure into a build error.

The original write-up follows, kept because its analysis of the fail-open direction is still
the reason the guard is worth adding.

### Original write-up

`eas.json:7-18`, `shared/config.ts:2-3`, `api/client.ts:37`.

```ts
env: process.env.EXPO_PUBLIC_ENV || 'local',              // shared/config.ts:3
if (!isProd() && !isPreview()) return MOCK_DATA_SIMPLE;   // api/client.ts:37
```

No build profile declares an `env` block. A repository-wide search finds no setter at all:
no CI, no script, no `.easignore` to re-include the gitignored `.env`. The only mentions of
`EXPO_PUBLIC_ENV` are the reader, the type declaration, the README and the tests.

This fails open. The safe state, the real API, requires configuration supplied entirely out
of band. The failure state is fabricated times: `mocks/simple.ts` places today's six prayers
at launch minus 3 minutes through launch plus 3 minutes. A shipped build in that state would
display and schedule alarms on invented times for every user, with no visible error. The
same undefined-environment path also leaves `iosAppId` undefined, making the App Store link
`.../idundefined` at `device/updates.ts:15`.

LIKELY, and the boundary of what can be verified from the repository matters here. The
repository-side gap is CONFIRMED. Whether EAS dashboard environment variables close it is
not visible from a checkout, and the fact that shipped builds evidently show real times is
strong evidence that something does close it today. The finding is that nothing in the
repository records what that something is, and nothing fails loudly if it lapses.

The same gap applies to the API key. `shared/config.ts:4` types `apiKey` as
`string | undefined` and it flows unchecked into a template literal at `api/client.ts:14`, so
an absent key produces `...?format=json&key=undefined&year=2026&24hours=true`. TypeScript
accepts that and `tsc --noEmit` is clean. Nothing guards it: no check in `app.config.ts`, no
`env` block, no CI, and no test asserts the URL shape. That failure at least is loud, because
both a non-200 and an empty `times` object throw, so a fresh install gets the error screen
rather than wrong times. Existing installs coast on cache until `needsDataUpdate()` fires.

**Fix direction.** Declare `"env": { "EXPO_PUBLIC_ENV": "prod" }` on the production profile
and `"preview"` on preview, so the repository states its own contract, and throw at config
time when the environment is prod or preview and the key is absent or still the `.env.example`
placeholder.

## 10. `AlertType`'s persisted integers are pinned by nothing

`shared/types.ts:168-175`, `stores/notifications.ts:125`, `stores/storage.ts:20-33`.

The enum's numeric values are the storage format, and `shared/types.ts:166` says so:
*"Values are stored as integers (0, 1, 2) to save space."* MMKV holds the literal `"0"`,
`"1"` or `"2"`.

Every test assertion in the repository compares the symbol, never the number:

```
$ grep -rn "toBe(AlertType" --include="*.test.ts" . | grep -v node_modules
5 hits, all symbol against symbol
```

**Failure scenario.** Someone inserts `Vibrate = 1`, or reorders `Silent` and `Sound`. Every
user who chose Sound now has their stored `2` read back as something else. The athan stops
playing at Fajr. The full suite stays green, because a symbol-to-symbol comparison is
tautological against a reorder.

CONFIRMED for the gap. The reorder is the hypothetical, and it is a one-line edit away.

`ScheduleType` and `CountdownKey` are string enums whose values appear inside MMKV key names,
so reordering those is harmless and only a rename would break storage. That is the safe
design. `AlertType` is the one that is not.

**Fix direction.** One test: `expect([AlertType.Off, AlertType.Silent, AlertType.Sound]).toEqual([0, 1, 2])`,
plus a comment on the enum saying the integers are a storage contract.

## 11. The notifications mock breaks the identifier-echo invariant the sweep depends on

`shared/__mocks__/expo-notifications.ts:23`.

```ts
export const scheduleNotificationAsync = jest.fn().mockResolvedValue('mock-notification-id');
```

The real SDK echoes the identifier it was given:

```js
// node_modules/expo-notifications/build/scheduleNotificationAsync.js:69
return await NotificationScheduler.scheduleNotificationAsync(request.identifier ?? uuid.v4(), ...)
```

Production stores that return value as the record id (`device/notifications.ts:96`), and the
reconciliation sweep diffs stored ids against OS identifiers
(`stores/notifications.ts:859-877`). So "the returned id equals the supplied identifier" is
load-bearing, and the shared mock violates it.

Two consequences. Under the default mock every record for a prayer collapses onto one MMKV
key, because the key embeds `notification.id` (`stores/database.ts:198`), so tests see one
record where the device has two. And the success path records `notification.id` while the
failure path records the deterministic `identifier` (`stores/notifications.ts:470`); those
agree only because the real SDK echoes, and the mock makes them disagree, so no suite can
catch a drift between them.

**Failure scenario.** A future edit drops `identifier` from the request, so the SDK generates
a UUID. Every stored id then differs from every OS identifier,
`findStaleScheduledNotificationIds` classifies all pending notifications as orphans, and the
sweep cancels every prayer alert immediately after scheduling it. The
`records.length === 0` guard at `:870` does not fire, because records exist. Silent total
alert loss, with a fully green suite.

CONFIRMED for the divergence and the mechanism.

**Fix direction.** Make the shared mock echo, which is what
`stores/__tests__/notifications.test.ts:989-991` already does locally.

## 59. An Android force-stop disarms every alert, and the 12-hour gate stops the next launch restoring it

Found in session 4 on the live device, not present in the session-3 sweep. **This is the only
Tier 1 finding in this document that is present in production 1.5.2 and can silence an alarm.**

`stores/notifications.ts:1012-1016`, `:811-818`; `shared/notifications.ts:294-301`;
`app/index.tsx:88-102`.

**Observed, not inferred.** The OnePlus 3T holds a prod build of 1.25.0 with real London data
and exactly one alert enabled, Fajr on Sound, confirmed from the app's own screen. Before any
interaction it had one armed alarm, `2026-09-13 04:57`, which is tomorrow's Fajr. Three
`frame-audit.sh` runs force-stopped the app as their first step. Afterwards:

```
$ adb shell dumpsys alarm | grep 'Alarm{.*com.mugtaba.athan'
  Next wake from idle: Alarm{dab084c ... com.mugtaba.athan}     # a stale restatement
```

Nothing armed. The app was then cold-launched three times, each left running for 8 to 12
seconds, and the alarm never came back. Logcat from the app's own pid shows
`registerTaskAsync: NOTIFICATION_REFRESH_TASK` on each launch, which in
`initializeNotifications` runs **after** `await refreshFn()`, so the chain provably reached
`refreshNotifications()` and that call returned without scheduling anything.

**The mechanism.** Android's force-stop cancels every `AlarmManager` alarm the app holds. The
next launch calls `refreshNotifications()`, whose first statement is
`if (!shouldRescheduleNotifications()) return`. That gate is purely elapsed time against
`lastNotificationScheduleAtom` and `NOTIFICATION_REFRESH_HOURS = 12`. It has no idea whether
anything is actually armed, so it skips, and the user has no alerts for up to twelve hours.
The background task is no rescue: force-stop cancels WorkManager work too, and its interval is
six hours.

**Present in production.** `shouldRescheduleNotifications` and the early return in
`refreshNotifications` are byte-identical at `b9985ea`, the 1.5.2 tree. Every user on the
store build today is exposed. The reach is wider than deliberate force-stops: OnePlus and
other OEM battery managers force-stop background apps by policy, which is the owner's own
device.

**Finding 17 records the adjacent fact and stops one step short.** It notes that force-stop
cancels alarms and that AGENTS.md's claim of recovery "by next app open" is wrong on buffer
length. The sharper truth is that the next app open does not recover it **at all** inside the
gate window, for a reason that has nothing to do with the buffer.

### The obvious fix does not work, and here is why

Asking the OS whether anything is pending, and bypassing the gate when the answer is nothing,
looks like a two-line fix. It cannot work on Android, verified against the installed source:

- `ExpoSchedulingDelegate.getAllScheduledNotifications()` returns
  `store.allNotificationRequests`, backed by `SharedPreferencesNotificationsStore`
  (`node_modules/expo-notifications/android/.../ExpoSchedulingDelegate.kt:19,33-34`).
- Force-stop cancels AlarmManager alarms. It does **not** clear SharedPreferences.
- `setupScheduledNotifications()`, the function that re-arms AlarmManager from that store, is
  reached only from `NotificationsService:829`, whose intent filter lists `BOOT_COMPLETED`,
  `REBOOT`, `QUICKBOOT_POWERON` and `MY_PACKAGE_REPLACED`
  (`expo-notifications/android/src/main/AndroidManifest.xml:18-27`). A plain relaunch is none
  of those.

So after a force-stop `getAllScheduledNotificationsAsync()` returns a full list while zero
alarms exist. The check would report everything healthy. Recorded so the next reader does not
spend the same hour on it.

**Fix direction.** There is no cheap way to read AlarmManager state from JS, so detection is
out and unconditional repair is in: on an Android **cold launch**, reopen the gate rather than
trusting it, and let the existing schedule-first-then-cancel-stale pass re-arm everything. It
is idempotent by design, deterministic identifiers give same-identifier replace, and it already
runs 1500 ms after first content rather than on the paint path. iOS is deliberately excluded:
`UNUserNotificationCenter` keeps pending notifications across app termination, so the gate is
correct there and a bypass would be pure cost. This depends on finding 2's `resetStoredAtom`,
because reopening the gate means writing through `lastNotificationScheduleAtom`, so it lands
after that.

CONFIRMED on the device. The alarm was restored before leaving the device, by toggling Fajr
off and back on, and `yarn check:device` reports `1 future prayer alert(s) armed` at
`2026-09-13 04:57` again.

---

# Tier 2: degrades correctness, recovery, or the coverage that protects them

## 12. Extras night rows get roughly 19 hours less buffer than every other row

`shared/notifications.ts:156-160`, `shared/constants.ts:68`, `shared/prayer.ts:109-117`.

`genNextXDays(NOTIFICATION_ROLLING_DAYS)` returns `[today, tomorrow]`. A night row for day D
fires on D minus 1, so the row for today is always already past and only one is ever armed.
Measured at 09:00 on a December day with four days cached:

```
A3  now = 2026-12-10 09:00, rolling window = ["2026-12-10","2026-12-11"]
A3  Midnight   armed x1: 2026-12-10T23:02:00.000Z
A3  Last Third armed x1: 2026-12-11T01:25:00.000Z
A3  Fajr       armed x1: 2026-12-11T06:10:00.000Z
A3  Isha       armed x2: 2026-12-10T17:40:00.000Z, 2026-12-11T17:40:00.000Z
A3  furthest-out Isha leads the furthest-out Midnight by 18.6 hours
```

The effect is seasonal. Islamic Midnight is the midpoint of Magrib to Fajr, so in winter it
falls before 00:00 on the previous evening and loses a day of buffer; in summer it falls
after 00:00 and behaves like everything else. A user whose app has not been opened and whose
background task has not run loses Midnight and Last Third most of a day before they lose
Isha.

CONFIRMED [test].

## 13. `setSequence`'s identity-skip drops a mid-window data correction

`stores/schedule.ts:203-206`, `:221-242`.

The skip compares a signature of length, first instant and last instant. A correction to a
prayer in the middle of the three-day window changes none of those.

```
A5  cache now says Dhuhr 2026-12-11 = 11:57
A5  the sequence the UI renders still says Dhuhr = ["11:55"]
```

**Failure scenario.** The API corrects one day's Dhuhr by two minutes. A refetch writes the
new value to MMKV. `setSequence` compares signatures, finds them identical, and skips the
write, so the list, the countdown and every derived atom keep serving the old time until the
next boundary rebuilds the sequence for another reason. Two minutes wrong is the bug this
app cares about most.

The optimisation is worth keeping; it is the cheapness of the signature that is wrong. A
signature over all the instants costs a joined string of eighteen numbers.

CONFIRMED [test]. The probability that the API silently corrects a middle day is not
something I can measure, so treat the likelihood as unknown and the cost of the fix as
near zero.

## 14. The two cache keep-lists disagree on `cache_schema_version`

`stores/version.ts:143-155` versus `stores/sync.ts:173-178`.

```
version.ts keeps: app_installed_version, whats_new_shown_version, cache_schema_version, preference_, prayer_max_english_width_
sync.ts    keeps: app_installed_version, whats_new_shown_version,                       preference_, prayer_max_english_width_
```

`updatePrayerData`'s full-refresh path deletes the shape marker. `cacheSchemaChanged()` then
treats a missing marker as "unknown shape", which is a wipe. The marker is re-stamped on the
next launch by `handleAppUpgrade` (`stores/version.ts:270`), so the window is narrow: an
upgrade that arrives before any further launch or background run. But the two lists exist to
express the same intent, and one of them is missing the key that the whole post-#34 design
turns on.

CONFIRMED.

## 15. The AppState listener registers 1500 ms late, and that resume gets no resume handling

`app/index.tsx:88-102`, `device/listeners.ts:17`.

All notification initialisation, background-task registration and AppState listener
registration sit inside `setTimeout(..., 1500)`, cleaned up on unmount.

Two consequences. A user who opens the app, reads the countdown and backgrounds it inside
1.5 seconds gets a launch that never calls `initializeNotifications`, never registers the
background task and never registers the listener. The sharper one is what happens when the
pending timer finally fires on a later resume: `initializeListeners` captures
`previousAppState = AppState.currentState`, which is already `'active'`, and
`handleAppStateChange` only reacts to subsequent changes. That resume therefore receives
none of the resume path: no `checkOverlayBoundary()`, no `resyncCountdowns()`, no
`bumpResync()`, no `sync()`. After an overnight suspension, that resume never rebuilds the
sequence or re-reads "today".

CONFIRMED for both code paths. LIKELY for the day-stale consequence.

**Fix direction.** Register the AppState listener synchronously in the mount effect, which
costs one `addEventListener`, and keep only the notification bridge and channel work behind
the defer. When registering while the app is already active, run one foreground pass.

## 16. The warm-cache bootstrap is skipped on every version bump, not just schema changes

`stores/bootstrap.ts:49`, comment at `:19-21`.

```ts
if (wasAppUpgraded()) return false;
```

The comment still describes the pre-#34 world, in which an upgrade meant a wipe. Since #34,
`handleAppUpgrade` only wipes when `upgraded && cacheSchemaChanged()`, and
`CACHE_SCHEMA_VERSION` is still 1. So on an ordinary update the cache is deliberately kept,
and bootstrap refuses to hydrate it anyway: the first launch after every store update takes
the cold-launch spinner path despite a valid timetable sitting on disk.

Not a correctness bug, since `sync()` re-derives from the same cache within the same tick.
It defeats the first-paint work on precisely the launch that matters, and the stale comment
will mislead the next reader into believing a wipe is pending.

CONFIRMED.

## 17. The "2-day buffer" is two calendar days, about 17.8 hours in the winter worst case

`shared/constants.ts:65-68`, `:99-105`, `:117-126`; `shared/notifications.ts:156-160`.

`NOTIFICATION_ROLLING_DAYS = 2` arms `[today, tomorrow]`, so the furthest armed prayer is
tomorrow's Isha, not "now plus 48 hours".

| Quantity | Value | Attempts the docs claim | Attempts actually available |
| --- | --- | --- | --- |
| Armed horizon, refresh at 00:05 | about 45 h | | |
| Armed horizon, refresh at 23:50, winter Isha 17:41 | **about 17.8 h** | | |
| `BACKGROUND_TASK_INTERVAL_HOURS` = 6 | 6 h | 8 | 2 to 3 |
| `NOTIFICATION_REFRESH_HOURS` = 12 | 12 h | 4 | 1 |

Winter Isha comes from the repository's own fixture, 17:41 on 2026-12-31
(`shared/__tests__/nightTimes.test.ts:134`).

With either refresh layer alive the buffer still closes comfortably: six hours into an
eighteen-hour floor is fine. What does not hold is the recovery claim at `ai/AGENTS.md:811`,
that a force-quit user is *"recovered by next app open within the 2-day buffer"*. Android
force-stop cancels all scheduled alarms, which the background-task runbook already
established, and in the winter worst case the true buffer is about eighteen hours. A user who
force-quits at 23:00 in December and reopens 24 hours later has a real gap.

CONFIRMED on the arithmetic. LIKELY on the user-facing gap.

## 18. `compareVersions` inverts on a `v` prefix or any non-numeric segment

`shared/versionUtils.ts:13-19`. `.map(Number)` then `parts[i] || 0`, so NaN silently becomes 0.

| Inputs | Result | Correct | Consequence |
| --- | --- | --- | --- |
| `'1.0'`, `'1.0.0'` | 0 | yes | missing segments fine |
| `'01.25.03'`, `'1.25.3'` | 0 | yes | leading zeros fine |
| `'1.10.0'`, `'1.9.0'` | 1 | yes | segment above 9 fine |
| `'1.2.3.4'`, `'1.2.3'` | 1 | yes | four segments fine |
| **`'v1.0.1'`, `'1.0.0'`** | **-1** | **no** | inverted |
| `'1.x.0'`, `'1.0.0'` | 0 | no | junk reads as 0 |
| `'1.0.0-beta.1'`, `'1.0.0'` | 1 | no | prerelease above release |
| `undefined`, `null`, a number | TypeError | no | throws |

Three call sites, and the one fed external data is the one that matters.
`device/updates.ts:63` compares the installed version against a hand-edited string from
`releases.json` on `main`, or iTunes' `results[0].version`, verbatim with no shape check.
Writing `"v1.26.0"` into that file disables the update prompt for every Android and
TestFlight user, with no log and no error.

At `stores/version.ts:98` the hazard runs the other way: shipping a version such as
`"1.25.3-hotfix"` yields -1, which is logged as a downgrade, so `clearUpgradeCache()` and
`forceNotificationReschedule()` both never run. On a release that did change the cache shape
that leaves stale-shaped records read by new code, which is the wrong-prayer-time case the
file's own doc warns about.

Blast radius is bounded: every call site is inside a catch, so this is a wrong-answer risk
rather than a crash risk. The existing suite covers only well-formed dotted numerics.

CONFIRMED, measured.

## 19. What's New shows 1.24.30's items headed 1.25.3

`shared/whatsNew.ts:63` versus `app.json:5`.

`VISIBLE_WHATS_NEW` filters items against `WHATS_NEW.version`, a hand-maintained string, and
never against the installed version. `shouldShowWhatsNew` only checks that the item list is
non-empty. So the presenting release and the running binary are never compared, and
`app/index.tsx:184` renders `version={installedVersion}`.

Four releases have shipped past the stamp, 1.25.0 through 1.25.3. A user updating to 1.25.3
sees a modal headed 1.25.3 listing three things that shipped in 1.24.30, which they have
already seen. This contradicts the file's own doc at `:13`: *"A release with no newly
stamped items silent-ships automatically."*

The test that should have caught it is self-referential:
`expect(entry.version).toBe(WHATS_NEW?.version)` at `shared/__tests__/whatsNew.test.ts:198`
is vacuously true for any stamp.

CONFIRMED.

## 20. `EXPO_PUBLIC_BG_INTERVAL_MINUTES` validates the floor but not the ceiling

`shared/constants.ts:141-147`.

```ts
const isEnvIntervalValid = Number.isFinite(envIntervalMinutes) && envIntervalMinutes > 0;
```

Empty, zero, negative and non-numeric are all rejected and all four are tested. Nothing
rejects an absurd value. `'10800'`, the exact seconds-for-minutes mistake that **was**
ISSUES #8, passes validation and schedules the task 7.5 days out. `'0.001'` also passes.

This is not theoretical: `ai/RUNBOOK-background-tasks.md:415` instructs setting this in a
shipping profile for interval-ladder experiments and reverting afterwards. A forgotten
revert ships it, and the background layer is the primary refresh layer.

CONFIRMED for the gap. LIKELY for the ship-a-typo scenario.

## 21. The iOS 64-pending ceiling is one constant increment away, and nothing guards it

`shared/constants.ts:68`; mock at `shared/__mocks__/expo-notifications.ts:23`.

| `ROLLING_DAYS` | At-time | Reminders | Total | Against the iOS cap of 64 |
| --- | --- | --- | --- | --- |
| 2, today | up to 22 | up to 22 | **up to 44** | 20 to spare |
| 3 | up to 33 | up to 33 | **up to 66** | over |

`NOTIFICATION_ROLLING_DAYS` appears in no test file at all. The mock always resolves and
`getAllScheduledNotificationsAsync` always returns an empty array, so nothing enforces or
even observes a ceiling. Bumping the constant to 3, an inviting one-character "more buffer"
change, would pass the entire suite while iOS silently drops the furthest-out requests,
which are exactly the third day the bump was meant to protect.

CONFIRMED on the arithmetic and on the absence of any guard.

## 22. `cacheSchemaChanged`, the sole gate on wiping the cache, has zero tests

`stores/version.ts:165-179`, called at `:254`.

```
$ yarn jest stores/__tests__/version.test.ts -t "cacheSchemaChanged"
Tests:       41 skipped, 41 total      (0 matched)
```

Its own doc names the stake at `:129-131`: *"a stale-shaped record read by new code produces
a wrong prayer time, the worst bug this app can have."* Three untested branches decide a
wipe: missing marker, mismatched marker, and a read that throws. It works today only because
`setItem` stringifies the number 1 and `getItem` parses it back. Nothing pins that round
trip.

CONFIRMED for the absence of coverage.

## 23. `atomWithStorageNumber` yields NaN for a corrupt value and 0 for an empty string

`stores/storage.ts:25-28`. `undefined` is the only guarded case.

```
corrupt string "not-a-number" -> NaN
empty string ""               -> 0   (default was 42)
```

`stores/__tests__/storage.test.ts:78-108` covers only well-formed values and the missing
key. Today's blast radius is small and mostly fail-safe, but this is the factory every
future numeric preference will use, and the alert types are numeric enums where NaN matches
no branch.

Related: `soundIndex` is never validated or clamped on read, so an out-of-range value yields
`athanNaN.mp3`, a filename that resolves to nothing on either platform. Not reachable from
today's UI, since the picker only emits 0 to 31, but there is no floor under it and it lands
directly on finding 5's failure mode.

CONFIRMED.

## 24. `scheduleNotificationAsync` is never made to reject in any test

`shared/__mocks__/expo-notifications.ts:23` with `stores/notifications.ts:463-475`.

```
$ grep -rn "mockRejected" --include="*.test.ts" shared/__tests__ stores/__tests__ device/__tests__
19 hits: fetchYear, registerTaskAsync, unregisterTaskAsync, isTaskRegisteredAsync,
   sync, getAllScheduledNotificationsAsync, openURL, trigger...  zero for scheduleNotificationAsync
```

The real call rejects on a past trigger date, an invalid or absent Android channel, the iOS
pending ceiling, and `UnavailabilityError`. The catch block it guards is subtle and
correctness-critical: it re-records the deterministic identifier so that neither the
per-prayer stale-cancel nor the sweep deletes an OS notification that survived the failure.
That reasoning is right. It has simply never been run.

CONFIRMED.

## 25. Mock prayer times outlive the build that wrote them

`stores/database.ts:124-133`, `stores/version.ts:254-262`.

Mock data takes the same `saveAllPrayers` path as real data, writing one `prayer_YYYY-MM-DD`
row per day. The wipe that would clear it is doubly gated: installing a real build over a
dev build at the **same version string** means `wasAppUpgraded()` is false, so no wipe runs
and the fabricated rows persist and are served.

This is the mechanism behind the e2e README's warning that mock contamination outlives the
build that caused it. Scoped to devices that have run a dev or preview build, which is the
owner's own 3T and any sideloaded tester.

CONFIRMED.

## 26. Nothing guards the 99-file audio matrix, and no reminder file has an integrity test

The matrix itself closes perfectly today, verified across four independent surfaces:

```
expected from code : 99     EXPECTED but MISSING on disk   : []
on disk (assets/)  : 99     ON DISK but UNREFERENCED       : []
app.json sounds[]  : 99     EXPECTED but NOT in app.json   : []
android res/raw    : 99     EXPECTED but NOT in res/raw    : []
ios/Athan/*.mp3    : 99     EXPECTED but NOT in ios bundle : []
all 198 resource names + channel ids legal   (32 athan + 66 prayer x interval + 1 reminder.mp3)
```

All 198 generated `res/raw` names and channel ids match Android's `[a-z_][a-z0-9_]*` rule.
`Last Third` correctly becomes `last_third`. The picker range is 32, matching the 32 files.

What is missing is the guard. No test references `app.json`, the `sounds` array, or
`assets/audio/reminders`. The matrix closes by manual discipline across four hand-maintained
surfaces. Adding a twelfth prayer name or a seventh interval silently adds filenames the
code will build and request but which nothing will ship, and every one of those is a silent
alarm.

`shared/__tests__/athanDurations.test.ts` decodes the real mp3s and pins their durations,
which would catch truncation, a zero-length file, an added or removed athan and most format
swaps. It would not catch a file of correct length containing digital silence, and it scans
only `assets/audio/athans`, so the 67 reminder files that carry every pre-prayer reminder and
every extras at-time alert have no integrity test at all.

CONFIRMED.

## 27. `mergeAndDeduplicatePrayers` can duplicate a prayer whose time changed

`stores/schedule.ts:278-283`. Deduplication keys on `english` plus `datetime.getTime()`. If
a day's times change between the in-memory sequence and a refetch, the stale prayer and the
corrected one have different instants, so both survive the merge and the list renders the
same prayer twice for that day. The countdown targets the earlier one.

Same trigger as finding 13, and the same unknown likelihood. Recorded together because one
change should address both: trust the cache over the in-memory copy.

LIKELY.

## 48. The extras alert bell resolves its preference through two different index spaces

`components/prayer/List.tsx:80-82`, `components/prayer/Alert.tsx:53`,
`stores/notifications.ts:142-144` and `:303-306`.

`List` renders `displayOrder.map((prayerIndex) => <Prayer index={prayerIndex} .../>)`, where
`prayerIndex` indexes the **chronologically sorted** `todayPrayers`. That number reaches
`getPrayerAlertAtom(type, index)`, which indexes `extraPrayerAlertAtoms`, an array built
positionally from the **canonical** `EXTRAS_ENGLISH`. The two spaces are equal only while
`canonicalDisplayOrder` returns the identity.

**This is latent, not live, and I tested rather than assumed it.** Swept against the real
2024 London timetable in `mocks/full.ts`, the same fixture `nightTimes.test.ts` uses, across
every day of a year including both clock changes:

```
C1  cached 366 real London days: 2024-01-01 .. 2024-12-31
C1  days checked: 364
C1  days where canonicalDisplayOrder is NOT the identity: 0
```

The invariant holds because `EXTRAS_ENGLISH` happens to be in chronological order within a
day: Midnight, then Last Third, then Suhoor, then Duha, then Istijaba. That is a property of
the data, and it is recorded only in prose.

What it would cost if it ever broke, using the permutation the repository's own suite pins
as expected behaviour at `shared/__tests__/prayer.test.ts:670`:

```
C2  if canonicalDisplayOrder returned [2,0,1] for [Duha, Istijaba, Midnight]:
C2    row "Midnight" renders with index=2, bell reads extraPrayerAlertAtoms[2] = "Suhoor"
C2    row "Duha"     renders with index=0, bell reads extraPrayerAlertAtoms[0] = "Midnight"
C2    row "Istijaba" renders with index=1, bell reads extraPrayerAlertAtoms[1] = "Last Third"
```

The sheet would seed from the wrong prayer's stored values, commit them back to the wrong
prayer's atoms, and the next global sweep would re-read the slot by name and silently replace
whatever the user set.

The codebase already judged this exact assumption unsafe once: `stores/notifications.ts:217-221`
documents the move off index-keyed MMKV keys because *"the index only maps to the intended
prayer while data is canonical"*. The keys were fixed. The lookup that reaches them was not.

CONFIRMED latent, CONFIRMED not live. No test asserts that row index `i` maps to prayer
`EXTRAS_ENGLISH[i]`.

**Fix direction.** Resolve the atom by name at the call site, the way `Overlay.tsx:118` and
`ActiveBackground.tsx:29` already do for visual position, and add a test under the
non-identity permutation.

## 49. The sound sheet persists the athan before a reschedule that can throw, with no rollback

`components/sheets/screens/Sound.tsx:136-148`.

```tsx
setSoundPreference(tempSoundSelection);              // persisted to MMKV first
await Device.updateAndroidChannel(tempSoundSelection);
await rescheduleAllNotifications();                  // rethrows on failure
setTempSoundSelection(null);
```

`rescheduleAllNotifications` explicitly rethrows (`stores/notifications.ts:988-991`), and
`updateAndroidChannel` has no catch at all. If either rejects, the preference atom already
holds the new athan while every scheduled OS notification still carries the old sound and the
old channel id. Settings then shows "Athan 7" selected while "Athan 3" is what plays at Fajr,
until the periodic refresh heals it up to twelve hours later. `setTempSoundSelection(null)`
also never runs, so the next dismiss re-commits even with no change.

The rejection is silent: `Sheet`'s `onDismiss` is typed `() => void`, called un-awaited, and
`@gorhom`'s `unmount()` calls it un-awaited too. Nothing logs at this call site.

**The asymmetry is the tell.** The sibling commit path does this correctly:
`commitAlertMenuChanges` wraps the scheduling call in try/catch and rolls all three
preferences back on failure (`hooks/useNotification.ts:191-222`). The sound path has neither.

CONFIRMED.

## 50. The alert sheet ignores the permission result and shows a selection it will never save

`components/sheets/screens/Alert.tsx:129-140`.

```tsx
if (type !== AlertType.Off && atTimeAlert === AlertType.Off) {
  await ensurePermissions();     // return value discarded
}
setAtTimeAlert(type);            // runs even on denial
```

The user taps Sound, denies the OS prompt or cancels the settings dialog, and the segmented
control still moves to Sound. On dismiss, `commitAlertMenuChanges` re-checks permissions,
logs, returns false and **saves nothing**. No toast, no haptic, no visible signal. The user
believes the athan is on for that prayer, and nothing will fire.

CONFIRMED. One line: `if (!(await ensurePermissions())) return;` before `setAtTimeAlert`.

## 51. `Day.tsx` coerces a null display date to `''`, which throws rather than falls back

`components/day/Day.tsx:28` and `:43-46`.

```tsx
const date = useAtomValue(displayDateAtom) ?? '';
```

`formatDateLong('')` runs `''.split('-').map(Number)` into `new Date(0, NaN, undefined, 12)`,
an Invalid Date, and date-fns `format` then throws. Verified against the installed
date-fns 4.4.0:

```
parsed -> { year: 0, month: undefined, day: undefined }
Date -> Invalid Date
THROWS: RangeError: Invalid time value
```

The Hijri branch is no safer: `formatHijriDateLong` catches its own failure and returns
`formatDateLong(date)` from inside the catch, which throws again, uncaught.

`Day` is the only one of the four `belongsToDate` consumers with no readiness guard;
`List.tsx:75`, `usePrayer.ts:40` and `useSchedule.ts` all gate on `isReady`, and
`app/Screen.tsx:37-41` renders `Day` unconditionally. In practice finding 7 fires first,
because `createDisplayDateAtom`'s non-null assertion throws before `Day` receives anything.
Both belong to the same one-line fix.

CONFIRMED for the throw. LIKELY for the reach.

## 52. The only quality gate is a git-ignored hook that a fresh clone does not get

`.gitignore:3`, `package.json`.

`.gitignore:3` ignores `.husky`, so the hook is untracked. `package.json` has no `prepare` or
`postinstall`, so `yarn install` installs no hook; the `husky` script must be run by hand and
is chained only from `yarn reset`. There is no `.github` directory and no workflow of any
kind.

Clone, `yarn install`, commit: no lint, no typecheck, no tests, nothing. On the one machine
that does have the hook, `--no-verify` bypasses it silently. For an app shipping prayer
alarms to two stores, the pre-commit hook is the only thing between a broken change and a
release build, and it is the one artifact deliberately excluded from version control.

Compounding it, `biome check` never fails on warnings. `biome.json:45` sets
`useExhaustiveDependencies` to `warn`, and neither `validate` nor `format:check` passes
`--error-on-warnings`, which exists in 2.5.13. A missing dependency in a countdown or
prayer-sequence hook is a stale closure holding a prayer time that never refreshes, which is
precisely the correctness class this app cannot afford. The five existing suppressions each
carry a reasoned justification and are not in question.

Coverage thresholds are configured at `jest.config.js:36-43` and never collected: nothing
passes `--coverage` and there is no CI, so they gate nothing.

CONFIRMED.

## 53. `pino` is a devDependency but ships in the production bundle

`package.json:81-82`, `shared/logger.ts:1`.

`pino` and `pino-pretty` sit under `devDependencies`, but `shared/logger.ts` imports `pino`
and 21 app modules import the logger. Any install that omits devDependencies makes the Metro
bundle unresolvable. It works today only because EAS Build installs them.

Separately, the `transport: { target: 'pino-pretty', ... }` block at `shared/logger.ts:17-24`
is inert in every build that runs on a phone. Metro's `resolverMainFields` prefers
`react-native` then `browser`, pino 10.3.1 has `browser: "./browser.js"` and no `exports`
field, and `pino/browser.js` contains no `transport` handling at all. So `colorize`,
`translateTime` and `ignore` never do anything and `pino-pretty` is never bundled.

The upside is worth recording, because it answers the question directly: production logging
is a genuine no-op, not a formatted write that is discarded. `pino/browser.js:91` maps
`enabled: false` to `level: 'silent'` and `:278-288` replaces every method with `noop`.

CONFIRMED.

## 54. Four environment variables change production behaviour with no environment guard

`shared/constants.ts:141-147`, `shared/time.ts:315`, `shared/perf.ts:30`,
`device/backgroundTaskDebug.ts:28`.

| Variable | Effect in a release build |
| --- | --- |
| `EXPO_PUBLIC_BG_INTERVAL_MINUTES` | Replaces the 6-hour background interval, the mechanism keeping the rolling buffer alive |
| `EXPO_PUBLIC_FORCE_RAMADAN` | `isRamadan()` returns true unconditionally, year round |
| `EXPO_PUBLIC_PERF_MONITOR` | Enables a 600-entry MMKV ring buffer persisted to disk |
| `EXPO_PUBLIC_BG_DEBUG` | Runs a scheduled-notification snapshot on every cold launch |

None is `__DEV__` or `isProd()` gated. Only the env string is checked.

The invariant that would catch this is documented as true and is false.
`shared/flags.ts:11-13` states *"This file is the single reader: no other module may spell an
EXPO_PUBLIC flag variable."* Five other modules do. Source reads 11 `EXPO_PUBLIC_*`
variables; `.env.example` declares 5, and `flags.ts:5-6` points at `.env.example` as the
catalog while naming three variables that are not in it.

CONFIRMED.

## 55. The whole suite runs with the widgets flag on, which is the opposite of what ships

`jest.setup.js:4` sets `EXPO_PUBLIC_WIDGETS = '1'` in `setupFiles`, so it applies to all 42
suites. The shipped default is off. Only two suites exercise the shipped configuration:
`shared/__tests__/flags.test.ts` and `stores/__tests__/widgetFlagOff.test.ts`. The
widget-push early returns that real users actually hit are covered by one suite; the other 40
run a code path no user has.

CONFIRMED. Defaulting the setup to the shipped value and letting enabled-path suites opt in
would match the fail direction `flags.ts` already states for itself.

## 57. A candidate mechanism for ISSUES #27, which does not fit the recorded symptom

Recorded as a **lead for the #27 investigation, not a root cause**, because I checked it
against that issue's own details and it does not match.

`components/prayer/List.tsx:33` and `:75` render whatever the `belongsToDate` filter returns,
with no completeness guard: `isReady` is `sequence !== null`, which says nothing about
contents, so a one-row day renders silently. Two paths leave exactly one prayer carrying a
given `belongsToDate`:

1. `filterRelevantPrayers` (`stores/schedule.ts:254-263`) deliberately keeps the immediate
   previous prayer even when its `belongsToDate` no longer matches the new display date, so
   just after a roll the buffer holds exactly one prayer of the old day.
2. `calculateBelongsToDate` back-dates a post-midnight Standard Isha to the previous calendar
   day, while `createPrayerSequence` anchors the buffer at the start date, so that Isha's five
   siblings can be absent from the buffer.

**Why it does not fit.** ISSUES #27 records the observed Isha at **21:31**, and explicitly
rules out the early-morning rule for that reason. Path 2 needs a post-midnight Isha. Path 1
leaves a row of the *old* day, while #27 reports the *new* day's Isha. So the mechanism is
real but it is not this sighting.

What is worth keeping from it regardless of #27: `List` trusts a display date derived from a
single prayer and will render a partial day without complaint. A guard on
`todayPrayers.length` against the schedule's expected row count would turn a silent partial
list into something diagnosable, and would have shortened the #27 investigation.

CONFIRMED for the missing guard. REFUTED as the explanation for #27.

## 56. The "logging is disabled in production" guarantee has no test

`shared/logger.ts:6-13` evaluates `isLoggingEnabled()` once, at module load, into
`pino({ enabled })`. `shared/__tests__/logger.test.ts:21-23` replaces `pino` with a mock
whose `enabled` argument is discarded and never asserted, and `:54` requires the real logger
during the describe-collection phase, before the `beforeEach` that sets the environment
mocks, so the only test that loads the real module loads it in the enabled state.
`jest.config.js:11` maps the logger to a mock for every other suite, so this is the sole test
that touches it. 1015 passing tests say nothing about the production gate.

CONFIRMED.

---

# Tier 3: the measurement harness

These matter out of proportion to their size, because `yarn check:device` and `e2e/scripts/`
are what this project uses to prove a fix worked. AGENTS.md records the owner's rule:
confirm the installed build and the control point before calling a measurement conclusive.
Four of these tools can return a confident pass having measured nothing.

## 28. `frame-audit.sh`'s SurfaceFlinger fallback can never print FAIL

**FIXED in 1.25.14** (`fix/audit-28-sf-units`). Both thresholds are milliseconds now, matching
the values they are compared against. Verified against synthetic `--latency` data covering four
cases:

| Input | Old verdict | New verdict |
| --- | --- | --- |
| 60 frames at 60fps | PASS, measuring nothing (`anim` empty) | PASS, 59 gaps measured |
| one 50ms miss | PASS | **FAIL** |
| one 500ms freeze | PASS, freeze invisible | `gaps>100ms: ['500']` printed, cadence PASS |
| a single frame | PASS | `NO DATA — this is not a pass`, exit 1 |

**The baseline re-verification, done and recorded in 1.25.15.** The one `(SF latency)` line in
`e2e/baselines/android-3t.json` was `"overlay_close_steady": "PASS 60fps (SF latency)"`. It is
now marked UNPROVEN rather than re-stamped, and the reason is what three live runs showed.
Against the installed 1.25.0 on the 3T, the corrected script run three times on overlay-open
gave **FAIL, PASS, FAIL**: a 67ms gap at the idle-to-animation boundary in two of the three.
So the corrected tool does produce real verdicts, and a single SF run is not one. Two honest
limits on that measurement: the device holds 1.25.0 while HEAD is further ahead, and
overlay-open is not the animation the baseline line refers to, because the script drives one
tap and measuring a close needs two.

The freeze case is the one that needed a judgement rather than a units fix. A gap over 100ms is
either a real freeze or a stretch where nothing was drawn, and SF latency alone cannot tell
those apart, so it is excluded from the cadence verdict and **printed** rather than silently
dropped, and the verdict says "cadence only". Deciding a freeze from a gap needs the frames,
which is what the video path exists for. The baseline's `(SF latency)` verdicts are addressed
separately below.

`e2e/scripts/frame-audit.sh:44-51`.

```python
ms = [(t - pts[0]) / 1e6 for t in pts]          # milliseconds
anim = [g for g in gaps if 0 < g <= 0.100]      # second-scale threshold
print("30fps FLOOR:", "PASS" if all(g <= 0.034 for g in anim) else "FAIL")
```

`ms` is milliseconds. The two thresholds are seconds. A 16.7 ms gap fails `<= 0.100` and is
discarded before the verdict, so `anim` ends up empty and `all()` over an empty list is
True. The print statement multiplies by 1000 to label the values "ms", which is the same
confusion stated twice.

Run verbatim against synthetic `--latency` data of 60 frames at 60 fps containing one
deliberate 500 ms freeze:

```
frames(last-2.5s)=60 anim-cadence-gaps(ms): []
30fps FLOOR: PASS
```

The video path at `:71-76` is correct, because ffprobe `pts_time` really is seconds. The bug
is isolated to the `FRAME_AUDIT=sf` branch, which is the path the README tells you to use
when video capture is wedged. `e2e/baselines/android-3t.json` records
`"overlay_close_steady": "PASS 60fps (SF latency)"`, a verdict this code could not have
produced any other way.

CONFIRMED. Every `(SF latency)` line in the baseline needs re-verifying after the fix.

## 29. `device-checks.sh` calls a permission present without reading the grant

**FIXED in 1.25.12** (`fix/audit-29-permission-grant`). The script now reads `granted=true`.
`RECEIVE_BOOT_COMPLETED` and `WAKE_LOCK` are install-time permissions, so declared-but-not-
granted is a FAIL and absent is a FAIL. `POST_NOTIFICATIONS` is SDK-aware: granted is a PASS,
absent is a FAIL, and declared-but-denied is a FAIL from SDK 33 up, where it is a runtime
decision, against a PASS below it, where it is not one. All four branches proven against the
live 3T dump and edited copies of it; the live run's verdict is unchanged.

`e2e/scripts/device-checks.sh:61-63`. The string `granted=` appears nowhere in the script.

On the live device, `dumpsys package com.mugtaba.athan` lists requested permissions in one
block and grants in a separate block with `: granted=true`. A `grep -q "POST_NOTIFICATIONS"`
hits the requested list regardless of grant state. On Android 13 and above, a user who denied
the notification permission gets `PASS POST_NOTIFICATIONS declared` from the tool whose own
header promises it *"FAILS on the things that silently break an alarm clock"*, while nothing
can fire at all. A genuinely absent permission is reported as a note rather than a failure.

CONFIRMED.

## 30. `device_checks.py` counts a restatement line as an armed alarm

**FIXED in 1.25.8** (`fix/audit-30-restated-alarm`). An anchor counts only when it carries a
queue position, `RTC_WAKEUP #0: Alarm{...}`, which is what makes it a batch entry. Re-run
against the same live 3T dump the finding was written from, the count goes from
`PASS 1 future prayer alert(s) armed (1 already fired)` to `(0 already fired)`, the armed alert
itself unchanged. The doubling direction was reproduced by re-pointing the restatement at the
future alarm, and it turned out to be worse than inflation: the old parser raised
`TypeError: '<' not supported between instances of 'dict' and 'dict'`. That crash has its own
cause and is recorded as finding 58.

`e2e/scripts/device_checks.py:38`, `ANCHOR = re.compile(r"Alarm\{[^}]*\}")`, matched anywhere
with no notion of section.

On the attached 3T the dump holds three matching lines: one real batch entry, one 2036
FORCE_STOP_RESCHEDULE placeholder, and `Next wake from idle: Alarm{dab084c ...}`, which
restates an alarm that fired more than a day earlier and appears in no batch. Running the
repository's own parser on that dump prints
`PASS 1 future prayer alert(s) armed (1 already fired)`, and the "1 already fired" is that
restatement. Without it the count is zero.

The direction that matters is the normal one: when "Next wake from idle" points at a future
alert, the same physical alarm is counted twice, giving inflated reassurance from the check
whose entire job is proving alerts are armed.

CONFIRMED.

## 31. `device_checks.py` flags every pre-prayer reminder as a stray alert

**FIXED in 1.25.10** (`fix/audit-31-reminder-offsets`). An armed alert now passes when it lands
on an expected prayer time or one of `REMINDER_INTERVALS` ahead of one, and the PASS line says
how many were ahead of a prayer so the evidence stays honest. Verified against the live 3T
dump with its one armed alert at 04:57, under three expected-time files: a prayer at 05:17,
which makes the alarm a 20-minute reminder, goes from FAIL to PASS; a prayer at 04:57 stays
PASS; a prayer at 09:00 stays FAIL. The check still bites on a genuinely stray alarm.

`device_checks.py:97`, `:129-135`. Reminders fire at 5 to 30 minutes before a prayer and
carry the same `tag=*walarm*:expo.modules.notifications.NOTIFICATION_EVENT` as at-time
alerts, with no per-notification identifier anywhere in the dump. They therefore can never
match a prayer-time list, and `yarn check:device` with an expected-times file fails with
"N alert(s) do not fire at a prayer time" on any device that has a reminder enabled. That is
the exact cry-wolf failure the module docstring says it removed a check to avoid.

LIKELY. The offsets and the shared tag are proven; arming a reminder would have been a
device write.

## 32. `device_checks.py` matches the package by substring

**FIXED in 1.25.7** (`fix/audit-32-package-exact-match`). The anchor's last field is read out
by `OWNER` and compared whole, so a sibling install no longer counts. Verified against the live
3T dump: byte-identical output on the real dump, and a synthetic `com.mugtaba.athan.fleettest`
entry that the old parser counted as an armed prayer alert now reports FAIL.

`device_checks.py:54`, `if package in anchor.group(0)`. `app.config.ts` exists precisely to
install `com.mugtaba.athan.<suffix>` beside the store app, and
`"com.mugtaba.athan" in "Alarm{... com.mugtaba.athan.BGTest}"` is true. A side-by-side test
build's alarms count as the real app's.

CONFIRMED.

## 33. `baseline-compare.sh` reports medians from a flow that failed

**FIXED in 1.25.13** (`fix/audit-33-failed-flow`). All three defects, proven with a stubbed
`maestro` and `adb` so every branch could be driven without a perf build. A failing flow now
prints one failure line and exits 1 instead of a full comparison table at exit 0. An empty
mark capture prints what to do about it instead of aborting silently under `set -e` after
`== marks collected:`. `ROOT` uses `${0:A:h:h}`, so invoked from `/tmp` the baseline now
resolves and the delta reads `-50` where the previous script reported `n/a` for both columns.

`e2e/scripts/baseline-compare.sh:25` discards maestro's exit code with `|| true`, so a flow
that missed every tap still produces a full comparison table. At `:11` and `:30`,
`set -euo pipefail` plus a `grep` that exits 1 on no match aborts the script before the
python block, printing `== marks collected:` and nothing else. The README at `:123` states
the rule this script breaks: have scripts check every output file is non-empty.

`:16` uses a relative `${0:h:h}` where the sibling scripts use `${0:A:h:h}`, so invoked from
outside the repository root it silently reports every delta as `n/a` rather than failing.

CONFIRMED.

## 34. `idle-cpu.sh` reports a confident 0.0% on multi-pid output

`e2e/scripts/idle-cpu.sh:32` uses `tr -d '\r '`, which concatenates two pids into one bogus
number when `pidof` returns more than one. The `/proc/<bogus>/task/*/stat` read is then
empty, `idle_cpu.py:36` sums an empty generator, and the tool prints
`idle CPU over 60.0s: median 0.0%`.

Separately, `idle_cpu.py:36` sums only threads present in both samples, so any thread created
or destroyed during the interval is excluded, which is exactly the short-lived animation and
Choreographer threads the performance campaign was hunting.
`e2e/baselines/android-3t.json` records `cpu_median_pct: 24.8` plus a six-build bisection
table built on top of it.

CONFIRMED for both code paths. The magnitude of the undercount is inference.

## 35. `device-checks.sh` prints PASS for a check it did not perform

**FIXED in 1.25.16** (`fix/audit-35-unperformed-pass`), pulled forward out of step 8 because
finding 5's device verification rests on this tool telling the truth. The prayer-channel sound
check counts the channels first and fails when there are none to inspect, rather than falling
through the `||` branch. Both unguarded dumps are guarded: an empty `dumpsys package` or
`dumpsys notification` now names the transport rather than blaming the app. Live on the 3T the
verdicts are unchanged and the sound line reads `all 2 prayer channel(s) carry a sound`.

`e2e/scripts/device-checks.sh:105-107`. With zero matching channels the inner `grep -q`
fails and the `||` branch fires, printing a pass for a set that was never examined. This is
the trap `device_checks.py:125-127` explicitly documents avoiding. Bounded, because an
earlier check already fails when `extras_at_time` is missing, so the overall verdict stays
failed; the damage is a contradictory PASS line in the evidence.

Two of the script's three dumps are also unguarded against being empty, at `:60` and `:85`,
while the third is guarded at `:114`. An adb hiccup on the notification dump produces
"FAIL no notification channels, the app has never initialised notifications", blaming the app
for a transport problem.

CONFIRMED.

## 36. The perf ring's `ts` axis is wrong, so mark-to-mark deltas read about twice the truth

`shared/perf.ts:161` and `:77`.

```ts
epochOffset = Date.now() - lib.default.timeOrigin;
ts: Math.round(Date.now() - epochOffset + entry.startTime),
```

Substituting, `ts = timeOrigin + startTime + (wall elapsed since init)`. The correct
conversion is `epochOffset + entry.startTime`. Reproduced against a synthetic clock seeded
from the real iOS baseline:

```
true wall spans:   init->ifr 900   ifr->hc 676   init->hc 1576
measure duration : 1576
ring ts deltas   : init->ifr 1800  ifr->hc 1352  init->hc 3152
```

Confirmed against the only raw capture in the repository,
`ai/features/performance/baseline/2-ios-perf-lines.txt:1-3`, where
`home_content.ts - perf_monitor_init.ts = 3072` while the two log lines are 1.618 s apart, a
factor of 1.9.

**This corrects the recorded lead rather than confirming it.** The AUDIT-BRIEF records that
`js_to_content` "starts about 29 ms before `index_first_render`, not at the mark", and that
any reading of it is wrong by about 800 ms. That is not reachable from the source:
`perfMeasure` takes both endpoints from the same `now()`
(`node_modules/react-native-performance/src/performance.ts:143-190`), so the measure spans
exactly `perf_monitor_init` to the call site. What is true is that comparing a measure's `ts`
against a mark's `ts` mixes two incommensurable axes and produces a small signed number near
zero, which is a plausible origin for the recorded 29 ms.

The correction runs the opposite way to the lead. The measure was the trustworthy number; the
mark-to-mark spans were the inflated ones. If ISSUES #32's decomposition of 856 to 979 ms and
645 to 737 ms was read off `ts` deltas, the true spans are about half those, summing to
roughly 788 ms, which is where the honest `js_to_content` duration of 732 ms sits.

A second, smaller defect: observer delivery is asynchronous
(`node_modules/react-native-performance/src/performance-observer.ts:84-97` wraps the callback
in `requestAnimationFrame`), so the `Date.now()` in `toRingEntry` is the delivery time, not
the entry time, and during a cold launch rAF delay varies per entry. The in-repo fake is
synchronous, so this is untested, and `shared/__tests__/perf.test.ts:186` asserts only
`expect(tap?.ts).toBeGreaterThan(0)`.

The honest name for the measure is `monitor_init_to_content`. `js_to_content` would require
starting at the earliest JS instant, and `stores/bootstrap.ts` already runs before
`initPerfMonitor()`.

CONFIRMED. Measurement hygiene only: `PERF_ENABLED` folds the whole module out of production
builds and nothing here reaches a prayer time.

## 58. `device_checks.py` crashes when two alarms share a minute

Found in session 4 while verifying finding 30, not present in the session-3 sweep.

**FIXED in 1.25.9** (`fix/audit-58-same-instant-sort`).

`device_checks.py:100` sorted `(moment, alarm)` tuples with no key. Python compares tuples
element by element: when two alarms carry the same moment it falls through to comparing the
alarm dicts, and dicts have no ordering.

```
TypeError: '<' not supported between instances of 'dict' and 'dict'
```

Two same-minute alarms only collide when their parsed fields differ, because equal dicts
compare equal and never reach `<`. That is the normal case rather than the exotic one: an
at-time prayer alert carries an `Alarm clock:` block with a `triggerTime`, a pre-prayer
reminder does not, so a reminder landing on another prayer's exact minute is enough. Any
reminder interval that happens to line one prayer's offset up with another prayer's time
produces it.

Reproduced against the live 3T dump with one alarm duplicated at the same instant and given
an alarm-clock block: traceback, exit 1. With the fix the same input reports both alerts.
Output on the unmodified dump is byte-identical.

CONFIRMED.

---

# Tier 4: iOS widgets

The `widgets` flag is off, so none of this reaches a user today. All of it blocks the flag
flipping. The known accepted risk, that a user with Background App Refresh off goes silent
after the notification buffer while the widget keeps ticking, is not re-litigated here;
findings 37 and 42 make that risk worse and are reported on that basis.

## 37. Beyond 24 hours the widget countdown label freezes at the segment's full length

`shared/widgetTimeline.ts:61` (`STEPPED_COUNTDOWN_HOURS = 24`) and `:229`. The step gate
covers every step entry, so a segment starting after the horizon gets one entry, dated at
its boundary, whose label is the whole segment length.

```
push=18/10/2026, 12:00:00 entries=371
at 2026-10-21 05:25 -> entry dated 20/10/2026, 19:40:00 | widget "Fajr 05:30 - 9h 50m" | truth 5m left
at 2026-10-25 05:25 -> entry dated 24/10/2026, 19:40:00 | widget "Fajr 05:30 - 10h 50m"| truth 5m left
WORST BEYOND 24h horizon: +649 min at 25/10/2026, 05:29 (widget "10h 50m", truth 1m)
```

The name, the HH:mm and the day stay correct. Only the countdown lies, which is worse,
because nothing signals staleness for the twelve remaining days until the stale card at
`:264`.

CONFIRMED. Both layouts already hide an empty label and degrade to name plus absolute time,
so emitting `countdownLabel: ''` beyond the horizon is a two-line change.

## 38. Inside the horizon the widget label over-reads by up to 7m50s

`shared/widgetTimeline.ts:237-249`. The aligned grid runs forward from the segment start, so
the non-multiple remainder lands in the gap immediately before the boundary anchor.

```
STANDARD: worst in-horizon over-read 4m50s at 18/10 12:04:50 — widget "45m", truth 40m10s
EXTRAS  : worst in-horizon over-read 7m50s at 19/10 02:09:50 — widget "13m", truth 5m10s
T-300s before Magrib -> "5m" | app 5m 0s
T-5s                 -> "5m" | app 0m 5s
```

The five-minute cadence is WidgetKit-forced and settled. The placement of the odd gap is
not: anchoring the grid backwards from the boundary cutoff puts the remainder where the
remaining time is largest and the error is proportionally invisible.

CONFIRMED.

## 39. One native throw permanently kills the widget's per-minute re-push chain

`stores/widget.ts:241-247` and `:270`. `scheduleLabelFlipPush(...)` is the only re-arm site
and it sits after all ten `updateTimeline` calls inside the try whose catch is at `:278`. One
throw, or one momentarily empty cache, and the flip timer is never re-armed; the pending
timer fires once, re-enters the same early return, and the chain is dead for the process.
`stores/__tests__/widgetIo.test.ts:75-82` asserts only that the promise resolves.

CONFIRMED. Re-arm in a `finally`.

## 40. No widget suite can catch 37 or 38

`shared/__tests__/widgetTimeline.test.ts:325-341` and
`shared/__tests__/widgetSimulation.test.ts:223-226`, `:501-504` all compute the expected
label from the entry's own date, which restates `formatCountdownAt`'s rule rather than
checking it. Freshness is asserted only inside `if (instant <= horizonMs)`, so beyond the
horizon nothing is asserted at all, and `widgetTimeline.test.ts:179-189` actively pins
boundary-only entries beyond the horizon as correct.

Deleting the entire stepped-entry block leaves the whole label contract green except one
test, and that one measures entry age rather than label error.

CONFIRMED.

## 41. `widgetSettingsSync` pins the calendar date where the contract is `belongsToDate`

`stores/__tests__/widgetSettingsSync.test.ts:120-122` and `:138-140`. The two coincide only
because the fixture's Isha is 22:45. Change it to 01:05, a real London summer case that
`widgetSimulation.test.ts:65-66` already models, and the assertion fails on a correct
builder; conversely a builder that switched from `belongsToDate` to the calendar date, which
is the single most likely way the Islamic-day rule regresses, still passes.

CONFIRMED.

## 42. A cache gap makes the widget present the next day's prayer all day

`shared/prayer.ts:374-377` skips an unstored day, and `shared/widgetTimeline.ts:200-254`
spans the gap with a single segment.

```
GAP 2026-06-16 15:00 -> "Fajr 05:30 - 14h 30m" dateLabel="Wed, 17 Jun 2026"
                        rows=["Fajr","Sunrise","Dhuhr","Asr","Magrib","Isha"]
```

The app degrades identically from the same builder, so this is not an app-versus-widget
divergence. It matters because the widget cannot refetch and may hold that state for days
while the app heals on the next sync.

CONFIRMED for the behaviour. The probability of a real cache gap is a guess.

Related, and worth fixing in the same pass: `stores/widget.ts:73-76` documents
`TIMELINE_DAYS = 14` as "how long the widget stays correct without the app opening". Measured,
the stale card activates at 13.36 days, and per finding 37 the widget stops being correct
after one day.

---

# Tier 5: v2.0 global readiness

No risk today. London users get London times. Recorded because the standing constraint says
`PRAYER_TIMEZONE` is meant to be the single setting for v2.0, and it is not.

**The premise needs correcting.** `PRAYER_TIMEZONE` changes how times are *interpreted*, not
where they come from. Flipping it alone silently reinterprets London's timetable as another
city's wall clock: the UI still looks plausible and every alarm is wrong.

## 43. The API endpoint is London with no city parameter

`api/config.ts:5`, `api/client.ts:13-17`. No city, no latitude and longitude, no calculation
method.

Set `PRAYER_TIMEZONE = 'America/New_York'` and nothing else. On 21 June the app fetches
London's Fajr 02:43 and Magrib 21:21 and resolves them against EDT. The list renders 02:43
and 21:21, which looks fine, but the real New York times are 03:47 and 20:31. The Fajr alarm
fires 64 minutes early and Magrib 50 minutes late, every day, every prayer.

This also makes the API key a London-only credential and is the reason `modules/tls13` exists
at all, since `www.londonprayertimes.com` is TLS 1.3 only.

CONFIRMED.

## 44. Magrib is the one prayer with no midnight-crossing rule

`shared/prayer.ts:270-291` handles exactly two cases: Standard Isha before 06:00, and the
night Extras at or after 12:00. Magrib is not covered, because London's Magrib is never after
midnight.

Atlantic/Reykjavik on 21 June, UTC+0 with no DST so the timezone arithmetic is not even in
play: sunset is 00:04. A generic provider returns `magrib: "00:04"` on date D, meaning 00:04
on D+1.

- `createPrayersForSingleDay` builds it as D at 00:04, so the Magrib alarm fires 23 hours 56
  minutes early.
- `getNightTimesForDay` feeds that value into `getNightTimes`, making the night about 26
  hours instead of about 2.8, so Islamic Midnight and Last Third land roughly twelve hours
  out, on the wrong side of noon and on the wrong day.
- `istijaba` is `adjustTime(times.magrib, -60)`, so 23:04 on the wrong day too.

This is the highest-consequence London shape in the codebase after the endpoint, and unlike
the endpoint it is fixable now, before any endpoint work: extend
`adjustPrayerDateForMidnightCrossing` to Magrib, and guard `getNightTimesForDay` against a
night longer than about 20 hours.

A narrower case of the same shape, confirmed by test: `adjustTime` is pure clock arithmetic
that wraps within the same date string.

```
B3  adjustTime("00:10", -20) = "23:50" — same date string, 23h later on the clock
B3  adjustTime("00:30", -60) = "23:30" (Istijaba has no midnight-crossing rule)
```

Suhoor is rescued because it is in `NIGHT_PRAYER_NAMES`. Istijaba is not in that list, so a
wrapped Istijaba would not be re-dated.

CONFIRMED.

## 45. WITHDRAWN: "Asr is hardcoded to the Hanafi calculation"

**Owner ruling, 2026-09-12: the API is the source of truth and the app edits nothing it
returns. No school selection, no method selection, no offset, not now and not for v2.0.**

This finding should never have been written. It proposed exactly the correcting that the
settled principle forbids: the app interprets what the API gives and never adjusts it. The
London Unified timetable designates one value as Asr, `shared/prayer.ts:73` takes it verbatim,
and that is the correct behaviour. `asr_2` sits in the response type because the API returns
it; ignoring it is right.

Recorded as withdrawn rather than deleted so the same argument is not made again. The rule it
breaks is broader than DST, which is how AGENTS.md currently phrases it: **anything that would
change a time the API returned is out of bounds, whatever the justification.** Re-dating a time
to the correct calendar day is not the same thing, which is why finding 44 stands: that one is
about the app filing an API value under the wrong day, not about altering its value.

## 46. The London-pinned test oracles will fail as false alarms when the timezone flips

Five sites pin the literal string `'Europe/London'` rather than `PRAYER_TIMEZONE`:
`shared/__tests__/time.test.ts:31` and `:554`, `shared/__tests__/prayer.test.ts:15`,
`shared/__tests__/notifications.test.ts:26`, `shared/__tests__/widgetTimeline.test.ts:426`.
`shared/__tests__/nightTimes.test.ts:40-57` goes further and hardcodes London's DST *rule*.

On the day `PRAYER_TIMEZONE` flips, these fail. That is the correct outcome, but they fail as
false alarms, because the oracle is stale rather than the app, which is the kind of failure
that gets suppressed under deadline pressure. Parameterising the five zone-name sites is
small. `nightTimes.test.ts` needs real re-authoring and should be scheduled as v2.0 work, not
discovered during it.

This also settles the recorded `date-fns-tz` lead, and **refutes its framing**. The library
has exactly three importers, all test files, proven exhaustively. But all three use it as an
*independent second implementation* of "today's date in the prayer timezone", used to check
the app's own Intl-based helpers. Rewriting those to use the app's own helper would make the
tests assert nothing. Keep the library, and keep it used. Whether it sits in `dependencies`
or `devDependencies` is tidiness: it is unreachable from `expo-router/entry` and is already
absent from the shipped bundle.

CONFIRMED.

## 47. High latitude: no polar-day handling, and a missing Sunrise crashes

Covered mechanically by finding 8. At high latitude in polar day or night, providers commonly
emit `"-----"`, `null`, or omit Sunrise entirely. `shared/prayer.ts:324-325` calls `.split`
on it, and `transformApiData` reaches it even earlier through
`duha: adjustTime(times.sunrise, 20)`. The result is the error screen rather than a wrong
time, which is the safer direction, but it is a hard break for any city above about 60N.

CONFIRMED.

---

# Tier 6: hygiene, docs and tidiness

Collected rather than expanded, because none of these can put a wrong time in front of a
user and the brief is explicit that presenting them alongside a scheduling defect devalues
the document.

| # | Item | Where | Note |
| --- | --- | --- | --- |
| a | `formatTime`'s JSDoc contradicts the code twice | `shared/time.ts:504-535` vs `:546` | Rule 3 says seconds show only in the last 60 s; the code uses 599 s. The `formatTime(90000)` example says `"25h 0s"`; it returns `"25h"`. Verified by test. |
| b | `types.ts` documents Suhoor at 40 min and Istijaba at 59 min | `shared/types.ts:122-123` vs `shared/constants.ts:160,162` | The real values are 20 and 60. The same file gets Suhoor right at `:82-84`, which is what makes the wrong one plausible. |
| c | R8 is off, and it is a smaller lever than the lead implies | `android/app/build.gradle:69,116-119` | Confirmed off, verified against the real APK: 141.6 MB, 6 dex, 20.6 MB compressed dex. Enabling it buys 3 to 7%. `x86` plus `x86_64` are 47.0 MB, 33% of the APK, and no real phone uses either. **Do not enable `shrinkResources`**: `expo-notifications` resolves sounds by `getIdentifier(name, "raw", ...)` at runtime and nothing statically references `R.raw.athan1`, so resource shrinking would silence every athan invisibly. Also, `android/` is gitignored, so the durable place is `expo-build-properties`, not `build.gradle`. |
| d | `athan15.mp3` is 25 ms under the iOS 30-second notification-sound cliff | `assets/audio/athans` | 29.974966 s. Nothing is over; three others sit within 60 ms. iOS silently falls back to the default sound above 30 s, so any re-encode is a live hazard. A `< 30.0` assertion costs nothing. |
| e | The MMKV mock exposes four methods the real v4 API does not have | `shared/__mocks__/react-native-mmkv.ts:10,17,24,30` | `setString`, `setNumber`, `setBoolean`, `delete`. Any use passes every test and throws on device. The real `set` also throws on an empty key; the mock accepts it. react-native-mmkv 4.3.2 self-mocks under Jest with a faithful implementation, so the hand-rolled mock can simply be deleted along with its `moduleNameMapper` line. |
| f | The `expo-constants` mock can never produce a null `expoConfig` | `shared/__mocks__/expo-constants.ts:16-20` | The real value is nullable, hence the `?.` at `stores/version.ts:17`. That branch returns `''`, which makes `handleAppUpgrade` bail and never stamp the version or the schema marker. |
| g | `StoredPrayer` and `StoredPrayerSequence` document a format the app does not use | `shared/types.ts:250-271` | Confident persistence docs, including a bespoke no-`Z` datetime format, for types no runtime module references. A maintainer would reason about timezone bugs that cannot exist. |
| h | `toggleOverlay()`'s no-argument open branch would reopen a stale row index | `stores/overlay.ts:64-70` | Unreachable today; every call site passes an explicit value. Narrow the signature or delete the branch. |
| i | `eas.json` hardcodes an absolute `$HOME` path for the Play service-account key | `eas.json:26` | Change the line, do not rewrite history. Full reasoning below the table. |
| j | `preview` has no `autoIncrement` under `appVersionSource: "remote"` | `eas.json:12-14` | Two consecutive preview builds carry the same build number, and the store rejects the duplicate. Combined with finding 1, testers are never told. |
| k | Local release builds always emit `versionCode 1` | `android/app/build.gradle:95` | `app.json` declares no `android.versionCode` and `appVersionSource: remote` covers EAS only, so a local release APK cannot install over a Play build. |
| l | `plugins/removeUnusedAndroidPermissions.js` is a no-op and a loaded gun | `plugins/removeUnusedAndroidPermissions.js:3` | It targets only `SYSTEM_ALERT_WINDOW`, which is declared only in debug source sets, and `withAndroidManifest` writes only `main`. It removes nothing. It is a name-matched blacklist with no allowlist guard, sitting after `expo-notifications` in the plugin list. |
| m | `app.config.ts` documents an `eas.json` mechanism that does not exist | `app.config.ts:6-7` | It claims campaign builds set `EXPO_ANDROID_SUFFIX` in the eas.json profile env. No profile has an `env` key. |
| n | The widgets flag can half-ship, and the lockstep test cannot catch it | `app.config.ts:21`, `shared/flags.ts:36` | One is read at prebuild, the other at bundle time. `flags.test.ts` runs both in one jest process, proving they agree on a value rather than that two build steps saw the same value. The e2e README already documents the Metro env-blindness that breaks it. |
| o | Nothing enforces that the three version strings stay in step | `package.json`, `app.json`, `android/app/build.gradle` | They agree today. The app reads only `app.json`. Bumping `package.json` and forgetting `app.json` makes `wasAppUpgraded()` false, so the forced reschedule never runs. One jest assertion closes it. |
| p | `frame-audit.sh` writes evidence into the working tree, untracked and unignored | `e2e/scripts/frame-audit.sh:28` | `e2e/evidence/` with an mp4, per-frame PNGs and a contact sheet. Sibling scripts use `mktemp -d`. |
| q | `frame-audit.sh` raises IndexError in exactly the failure case it documents | `e2e/scripts/frame-audit.sh:74-85` | The documented video-capture wedge produces frames without matching pts, and `set -euo pipefail` then aborts before the vision prompt is written. |
| r | The attached device is three versions behind HEAD | 3T `3T_SERIAL` has 1.25.0 | Any `yarn check:device` or baseline comparison run today measures a stale build. Worth a pre-flight assertion in the tooling. |
| s | `jotai`'s `loadable` is deprecated with removal in v3 | `stores/sync.ts:24` | The only caller. It prints a dev-mode console warning on first use. Package upgrades are a separate programme; recorded as a pointer. |
| t | `RamadanDecorations` never cancels its infinite animations when it turns invisible | `components/ui/RamadanDecorations.tsx:282,365-381` | `grep -c cancelAnimation` returns 0. Turning decorations off during Ramadan returns null at `:399` while eleven `withRepeat(-1)` animations keep driving the UI-thread frame loop with nothing rendered. This is the exact defect the file's own comment at `:254-258` says it exists to prevent, and AGENTS.md §4 Rule 7 names this component as the pattern. A `cloudConfig` identity change also stacks a second set on the first. |
| u | `IconView` builds a component type inside render | `components/ui/Icon.tsx:29-32` | `Animated.createAnimatedComponent` during render produces a new type every render and remounts the icon subtree. Dead today: no caller passes `animatedStyle`. The first one that does inherits a per-render remount. |
| v | Two dead, byte-identical glow files | `components/ui/masjidGlow.tsx`, `masjidRamadanGlow.tsx` | 136 lines, unreferenced, not exported, identical `PATHS`, and both declare the same filter id. The Ramadan variant was never regenerated as its own header instructs. `Masjid.tsx:31` draws a PNG instead. |
| w | `testMatch` is narrower than the transform | `jest.config.js:22` | `*.test.ts` only, while `:25` transforms `tsx` and `:23` lists it. No file is affected today, and the two component tests are pure geometry. The first `*.test.tsx` anyone writes will pass review, pass `yarn validate`, and assert nothing. |
| x | Strict is on, but seven strict-adjacent flags are not | `tsconfig.json:5` | `noUncheckedIndexedAccess` is the one that matters: an out-of-range index into a prayer array types as `T`, not `T \| undefined`, so the README's "data layer always provides complete data" is a convention the compiler does not enforce on exactly the arrays holding prayer times. `"types": ["node", "jest"]` also puts `Buffer` and `__dirname` in scope for React Native code; currently unused. |
| y | Stale doc on the data-fetch gate | `stores/sync.ts:103` | Documents the trigger as `EXPO_PUBLIC_DEV_MODE=true`. That variable exists nowhere else in the repository. The real gate is `APP_CONFIG.isDev`, keyed off `EXPO_PUBLIC_ENV`. |
| z | README contradicts itself on cadence and on audio attribution | `README.md:102,230,621` and `:165-196` vs `:578-595` | Two different background intervals, and two contradictory credit lists giving different source URLs for the same numbered athans. In a public MIT repository that is an attribution problem rather than a typo. `:351` also says Expo 57.0.18 where `package.json` says ~57.0.22. |
| aa | `as ReminderInterval` on a raw MMKV number | `components/sheets/screens/Alert.tsx:112` | The `\|\| DEFAULT_REMINDER_INTERVAL` guard catches 0 and undefined but not a value outside `REMINDER_INTERVALS`. A stale value shows in the Stepper with a dead decrement and flows into the reminder offset. Only bites if the interval list ever changes. `shared/constants.ts:93` already has the validator. |

## On Tier 6 item i: is the GCP project id in `eas.json` worth worrying about?

The owner asked directly, so here is the answer with the evidence rather than a shrug.

**What is exposed.** `eas.json:26` reads
`"serviceAccountKeyPath": "$HOME/.config/athan/athan-<project>-<12 hex>.json"`. Google's
default download filename is `<project-id>-<key-id-prefix>.json`, so the line discloses the GCP
project id and the first twelve characters of the service account key's `private_key_id`, plus
one machine's home directory.

**What is not exposed, verified across all 2,182 commits:**

```
$ git log --all --oneline -- '*athan-486118*' '*service-account*' '*serviceAccount*'
(empty: the key file has never been tracked)

$ git log --all -p -S'"private_key"' --oneline
(empty: no private key material anywhere in history)

$ git log --all --oneline -S'athan-486118'
0b6a6b6 added eas preview prod to eas cli      (one commit)
```

**So: not sensitive, in the sense that matters.** Neither value is a credential. A GCP project
id is an identifier that appears in ordinary API URLs and error messages; you cannot
authenticate with it. A `private_key_id` identifies which key was used and is visible to anyone
already authorised to list keys in the project; it is useless without the private key material,
which was never committed. The realistic cost is reconnaissance: it tells someone which project
exists and confirms a Play service account exists on it. That is worth removing, but it is not
an incident.

**Rewriting history: no, and the reasoning is not laziness.** It is one commit out of 2,182 on
a public repository with clones and forks. A rewrite force-pushes every SHA, breaks every
existing clone, and invalidates the commit references this very document cites as evidence.
GitHub also keeps unreachable objects served until asked to purge them, so the old blob would
likely survive the exercise anyway. Large cost, real collateral damage, and the thing being
removed is not a credential.

**Change the current line anyway**, for reasons unrelated to secrecy. It hardcodes one home
directory, so `eas submit` cannot run from any other machine. The repository's own
`.agents/skills/eas-app-stores/references/play-store.md:68` documents the form to use instead,
which keeps the credential in EAS rather than on a path. That fixes the portability problem and
removes the disclosure from the tip of the tree in the same edit.

**And the general lever worth remembering: if a credential is ever genuinely exposed, rotate
it, do not rewrite history.** Rotating the Play service account key in GCP invalidates the old
key immediately and makes any historical key id meaningless. It takes minutes, needs no history
surgery, and is the only action that actually closes the exposure. History rewriting hides a
secret; rotation kills it. Nothing here needs rotating, because nothing was exposed.

## Accessibility

The app ships a large-overlay mode explicitly for visually impaired users, so these are
recorded together rather than scattered through the nit table. None of them can produce a
wrong time.

- **The alert bell has no accessible name, role or state.** `components/prayer/Alert.tsx:143-161`
  carries only press handlers and an SVG child. A screen reader announces nothing: not what
  it is, not which prayer it belongs to, and not whether that prayer is Off, Silent or Sound.
  The state is conveyed only by glyph shape and fill colour. This is the control that decides
  whether a prayer notification fires at all. Touch target is fine at 53 by 57 dp.
- **The overlay's press-catchers are unlabelled accessibility elements.**
  `components/overlay/Overlay.tsx:137-143` tiles up to four bare `Pressable`s over the whole
  screen with no label and no role, so a screen reader walks four anonymous buttons wrapped
  around the content. The explanation box that appears has no live region, so a screen-reader
  user gets no indication anything was revealed, on the one surface built for them.
- **Most other interactive controls have no role or state.** A sweep of the slice found
  accessibility props at four sites only. Missing on `Toggle` (no `switch` role, no checked
  state), `SegmentedControl` (no selected state, so the alert mode is unannounced), `Stepper`
  (labelled only by the glyphs, disabled state visual only), `SoundItem`, `LabeledToggle`,
  `Update`'s buttons and the colour picker. `Modal.tsx:28-41` also has no
  `accessibilityViewIsModal`, so content behind it stays reachable, and no back handler.
- **The app opts out of OS text scaling, deliberately.** `jsx-runtime-shim.ts:28` injects
  `allowFontScaling: false` into every `Text`, to protect a fixed layout whose row height,
  pill step, catcher span and info-box anchor all derive from the single `57` constant. A
  user who raises the system font size sees no change anywhere. That is a WCAG 1.4.4 failure
  and a real trade-off rather than an oversight. Recorded so it is a decision on the record.

Credit where it is due: `Prayer.tsx:85-86` correctly hides non-selected rows from the
accessibility tree, and `Bar.tsx:162-166` carries a full progressbar role, label and value.

---

# What actually reached users

**Production is 1.5.2 on both the App Store and the Play Store** (owner, 2026-09-12). `uat-2`
HEAD is 1.25.5. `git log --oneline b9985ea..uat-2` counts **233 commits** between them.

That gap matters more than anything else in this document, and it was not known when the tiers
were written. Most of the machinery Tier 1 is about postdates the shipped build, so most of
Tier 1 describes defects **no user has ever been exposed to**. Probed directly against the
1.5.2 tree at `b9985ea`:

| Finding | Symbol probed | In production 1.5.2 |
| --- | --- | --- |
| 2 | `forceNotificationReschedule` | **absent** |
| 3, 4 | `migrateIndexKeyedAlertPreferences` | **absent** |
| 5 | `createExtrasAndroidChannel`, `prayerNotificationIdentifier` | **absent** |
| 14, 22 | `cacheSchemaChanged` | **absent** |
| 7 | `createDisplayDateAtom` present, the `belongsToDate!` assertion **absent** | partly |
| 12, 44 | `getNightTimesForDay` | **absent** |
| 6 | the `clearAllExcept` call in `components/ui/Error.tsx` | **PRESENT** |
| 21 | `NOTIFICATION_ROLLING_DAYS` | **PRESENT** |
| 23 | `atomWithStorageNumber` | **PRESENT** |

**This is good news twice over.**

First, finding 3 changes character completely. The mis-mapping migration shipped in **1.5.3**,
one version *after* production. No production user has ever run it. It can be corrected before
it runs for the first time, and if it is, nobody is ever mis-mapped. What was a post-mortem is
now a prevented bug.

Second, it makes session 4 far safer than it looked. Most of these fixes touch code no user has
seen, so "breaking something" mostly means breaking something that has never worked in the
field anyway. The small set that genuinely reaches live users today is findings **6, 21 and
23**, plus whichever Tier 5 and Tier 6 items predate 1.5.2.

**Caveat, stated plainly.** These probes are symbol-presence checks against the 1.5.2 tree, not
a re-audit of that tree. A finding marked absent above means the code it describes did not
exist then; it does not mean 1.5.2 was free of some older form of the same defect. If it
matters for a given finding, re-read the 1.5.2 file rather than trusting this table.

**Nothing has been released since** (owner, 2026-09-12). Work has landed on `uat-2` and on
`main`, and UAT and iOS builds have been compiled on EAS, but no build past 1.5.2 has been
pushed to users on either store. Production releases wait for the owner's explicit go-ahead.
So the whole 233-commit gap is unreleased by intent, not by accident, and session 4's changes
land in that same unreleased window.

---

# Owner rulings, 2026-09-12

Three findings were put to the owner at the close of session 3. All three are answered, and
the answers change what session 4 does.

## Finding 45, Asr: withdrawn

*"The API that we use gives us the prayer times and we use those, that's it. It does not allow
us to provide any changes to it, a +1 or a -1, a different method or school. I do not want to
change anything. The API is the source of truth. We shouldn't be editing anything."*

Withdrawn in full, above. The generalisation worth carrying forward: **anything that would
change a value the API returned is out of bounds, whatever the justification.** AGENTS.md
currently phrases this narrowly, as a DST rule. It is broader than that.

## Finding 1, `releases.json`: do not touch the file at all

*"There is code out there that reads this file. So we shouldn't even touch this file at all.
When we remove this feature from the codebase and push it out, it will no longer read the file.
Then we make a commit later, after we release, to remove this file."*

**Do not edit it, do not correct its version strings, do not delete it.** Apps already in both
stores fetch it at runtime. The file is removed only after the feature that reads it has been
removed and that removal has reached users, in a separate commit. The replacement is ISSUES
#35 and keeps its own session.

The finding itself was re-ranked from Tier 1 to Tier 6 once the release position was known, and
the correction is written up in full at finding 1. Short version: production is 1.5.2, nothing
newer has been released, so the prompt not firing is the correct behaviour rather than a
defect. What remains is a release-checklist note about a manual step that has no precedent.

## Finding 3, the extras preference mis-map: repair it, and delete the junk

*"We can clear out the database if we're no longer using the keys in there, because we don't
want to populate the database and keep it populated with junk."*

Two corrections to how that lands, both of which session 4 needs.

**A schema bump will not do it.** `UPGRADE_KEEP_PREFIXES` at `stores/version.ts:150` keeps
`preference_`, so bumping `CACHE_SCHEMA_VERSION` wipes the prayer cache and leaves every
preference key, junk included, untouched. Clearing these needs an explicit removal, not a
schema bump. That separation is deliberate and correct: a user's alarm settings should survive
a cache wipe.

**The mis-map can be repaired exactly, not guessed at.** There is a reliable discriminator. The
old array is known precisely, `['Last Third', 'Suhoor', 'Duha', 'Istijaba']` up to and
including v1.0.26, and `app_installed_version` survives every wipe. So the correct migration
picks its name array by the stored version:

| Stored version at launch | Array the index keys were written against | Action |
| --- | --- | --- |
| Below `1.0.27` | `['Last Third', 'Suhoor', 'Duha', 'Istijaba']` | Migrate against **that** array. Restores the user's actual settings exactly. |
| `1.0.27` and above | current `EXTRAS_ENGLISH` | Migrate as today. Already correct. |
| Either | | Remove every `preference_*_extra_<digit>` key afterwards, as it does now |

No data is lost and no alarm lands on a prayer the user did not choose.

**One ordering bug blocks it.** `handleAppUpgrade` captures `storedVersion` at
`stores/version.ts:238`, overwrites it at `:265`, and only then calls the migration at `:280`.
By the time the migration runs, the discriminator it needs has already been destroyed. Pass the
captured value in as an argument; it is a one-line change and it must land in the same commit.

Note also that this repair only reaches installs that still hold index keys. Anything that has
launched since 1.5.3 already migrated, correctly or not, and the old keys are gone. For those,
nothing can be recovered and nothing should be attempted.

---

# The five recorded leads, resolved

The AUDIT-BRIEF asked for each of these to be confirmed rather than assumed. Two are
confirmed as stated, one is confirmed with a correction, one is refuted in its framing, and
one is confirmed but smaller than believed.

| Lead | Verdict |
| --- | --- |
| Four of six hook test files do not exercise their hook | **Confirmed, and slightly understated.** See below. |
| Three suites seed fake timers from the real clock | **Largely refuted.** All three already compensate. See below. |
| `js_to_content` is mislabelled, readings wrong by about 800 ms | **Confirmed with a correction.** The measure itself is honest and spans exactly what its start mark says. The perf ring's `ts` field is on a broken axis, so mark-to-mark deltas read about twice the truth, and mixing a measure `ts` with a mark `ts` produces the small negative number that was recorded. The correction runs the opposite way to the lead: the measure was the trustworthy number. Finding 36. |
| R8 is off, untested as a lever | **Confirmed, and smaller than believed.** Off, verified against the real APK. Worth 3 to 7% of APK size against a non-trivial untested risk, when dropping `x86`/`x86_64` is worth 33% for free. `shrinkResources` must stay off: it would strip the dynamically resolved athan resources. Tier 6 item c. |
| `date-fns-tz` is used only by three test files | **Confirmed, framing refuted.** Exactly three importers, all tests, proven exhaustively. But they use it as an independent oracle against the app's own Intl implementation, which is the whole value of the test. Keep it and keep it used. The real finding underneath is the five London-pinned zone strings. Finding 46. |

## Lead 1: the hook test files

Confirmed, and one file is worse than recorded. There is no React renderer in the dependency
tree, which is the reason: neither `@testing-library/react-native` nor `react-test-renderer` is
installed, and `node_modules/react-dom` is absent. `yarn.lock:2056` carries only
`@types/react-test-renderer`, which is types with no runtime.

The decisive measurement is function coverage over the hook directory while running only its
own tests:

```
$ npx jest hooks/__tests__ --coverage --collectCoverageFrom='hooks/**/*.ts'
File                    | % Stmts | % Funcs | Uncovered Line #s
 useAnimation.ts        |   14.92 |       0 | 47-70,84-97,111-124,145-169,...
 useCountdown.ts        |       0 |       0 | 42-48
 useCountdownBar.ts     |       0 |       0 | 41-48
 useNotification.ts     |   92.85 |      90 | 10,37,138-139
 usePrayerAgo.ts        |   56.52 |   16.66 | 60-88
 usePrayerSequence.ts   |       0 |       0 | 59-79
Tests: 117 passed, 117 total
```

117 tests pass while three of the six hook bodies never execute at all.

| Test file | What it actually does | Verdict |
| --- | --- | --- |
| `useCountdown.test.ts` | **Worse than recorded.** `:12` mocks `@/shared/time` and `:32` requires `getSecondsBetween` back out of its own mock, so it asserts on the mock. Running it alone leaves `shared/time.ts` at **0% coverage**. It never imports the hook either. Four tests that can never fail for any production reason; the real helper is genuinely covered at `shared/__tests__/time.test.ts:461-476` with the same three cases. | Vacuous and redundant |
| `useCountdownBar.test.ts` | Re-implements at `:46-60` under a comment saying it "mirrors the progress calculation from useCountdownBar". It mirrors a version that no longer exists: the hook now computes nothing and reads `getBarProgressAtom` at `:45`. It still mocks prev-prayer atoms the hook no longer imports. The real math is covered at `stores/__tests__/countdown.test.ts:702-708`. | Stale mirror |
| `usePrayerSequence.test.ts` | Re-implements at `:50-66`, a faithful copy of the hook's `:68-84`. **`nextPrayerIndex`, `isPassed` and `isNext` appear in no other test file in the repository.** | The only real hole |
| `useAnimation.test.ts` | Asserts `typeof === 'function'` for eight exports, with a docblock at `:3-13` stating plainly that worklets cannot run in Node. | Honestly labelled |
| `usePrayerAgo.test.ts` | Imports the extracted `calculatePrayerAgo` at `:40` and calls the real function. | **Fixed, as recorded** |
| `useNotification.test.ts` | Requires and calls the real module at six sites, 92.85% statements. Works without a renderer because the hook is a plain factory whose body uses no React API. | **Genuine** |

On the count: by function coverage, five of six never invoke the hook under test. Three of
those five are benign (the honest smoke test, and two whose production logic is genuinely
covered elsewhere), so the actionable number is smaller than the lead implies, not larger.

**The one worth doing is `usePrayerSequence`.** Its `:66-84` is pure given a sequence, a display
date and an instant, so it extracts exactly like `calculatePrayerAgo` did. `useCountdown` and
`useCountdownBar` have no pure part to extract; each is three `useAtomValue` calls and a null
check. The right move for those two is deleting the misleading files, not extracting from them.

**Risk to correctness of times: low, and worth saying so plainly.** Nothing here indicates any
prayer time is currently computed wrongly; the mirrors match the hooks today. The only finding
that could ever hide a wrong time is `usePrayerSequence`, because `isPassed` and `isNext` decide
which row the list highlights as next. Even that would not change what fires: notifications go
through a separate scheduling path. This is a "could not catch a future regression" gap, not a
correctness one.

## Lead 2: the fake-timer suites

Partly confirmed. Two of the three are refuted outright, and the third holds a real,
reproducible failure that a repeat-run loop cannot find.

| Suite | Advances | How it seeds | Verdict |
| --- | ---: | --- | --- |
| `stores/__tests__/countdown.test.ts` | 14 | All 16 `useFakeTimers()` calls are immediately followed by an absolute pin, `jest.setSystemTime(new Date('2026-01-20T...Z'))` | **Refuted.** Not seeded from the real clock at all. 27/27 pass at every hostile instant tested, including both DST boundaries and 23:59:59. This is the suite the others should look like. |
| `device/__tests__/backgroundTaskDebug.test.ts` | 3 | `jest.useFakeTimers()` with no `setSystemTime`, so the premise is true | **Risk refuted.** The three advances and their assertions are purely relative: call counts and log-message membership. Nothing reads time of day. 9/9 pass at every hostile instant. |
| `stores/__tests__/widgetSettingsSync.test.ts` | 11 | `jest.setSystemTime(Math.floor(Date.now() / 60000) * 60000 + 30_000)` | **Premise true and deliberate**, documented at `:92-97` and `:114-117` where it names the flake it was pinning. The `:30` quantisation genuinely works: all eleven advances stay inside `[:30, :32]` and never cross a minute. One residual remains, below. |

### The residual, reproduced

Two further advances, in the `label-flip pushes` describe, deliberately cross a minute boundary
(`msToFlip = 60000 - msIntoMinute + 250`). One of them fails when that boundary is also London
midnight:

```
$ FAKE_NOW_ISO=2026-09-12T22:59:41Z npx jest ... widgetSettingsSync.test.ts
● label-flip pushes › flip pushes reuse the cached sequence instead of re-reading the prayer DB
    Expected length: 1
    Received length: 0

London 23:55 pass  23:56 pass  23:57 pass  23:58 pass
London 23:59 FAIL
London 00:00 pass  00:01 pass  00:02 pass
```

Reproduced identically at `2026-12-31T23:59:41Z` and `2026-02-28T23:59:41Z`. Forty consecutive
runs at the current wall clock produce **zero** failures, which is why this is time-of-day
dependent rather than random, and why a repeat-run loop was never going to find it.

**This is a test-premise bug, not a product bug, and the distinction matters.**
`stores/widget.ts:137-144` keys the sequence cache on the London wall date, which by design
rolls over at London midnight (documented at `:114-122`). Crossing midnight forces a rebuild,
which reads the database, which this test deliberately wiped. The test's premise, that
per-minute pushes never touch the database, holds every minute except the one where the
documented invalidation fires. The real hazard is that someone "fixes" the red build by
weakening that invalidation, which **would** put a stale day on the widget.

**Honest limit on the measurement.** A uniform 1440-minute sweep was started and stopped at 60
minutes with zero failures. What was actually swept: nine prayer-adjacent minutes, 23:55 to
00:02 minute by minute, five DST and year-end instants, three controls, and sixty uniform
minutes. That only one minute of the day fails is reasoned from the mechanism, since only the
midnight-crossing minute can miss the cache key, and corroborated by the boundary sweep. It is
not exhaustively measured. Also worth recording for whoever reruns this: patching `global.Date`
does not work, because `jest.useFakeTimers()` seeds from the true host clock and ignores it. The
working approach is Jest's own `fakeTimers: { now }` in a scratchpad config whose `rootDir`
points at the repository.

**Risk to correctness of times: low.** The one-in-sixty flake named in ISSUES #33 was pinned and
no unpinned equivalent exists. The cost here is a roughly one-in-1440 red build, plus the
temptation it creates.

---

# Already settled, re-verified in passing

Confirmed while reading, recorded so the next session does not re-derive them.

- **Every Android permission the alarm path needs survives the stripping plugin.**
  `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`,
  `WAKE_LOCK`, `FOREGROUND_SERVICE`, `ACCESS_NOTIFICATION_POLICY`, `INTERNET` and `VIBRATE`
  are all present in the merged release manifest, with `expo-notifications`'
  `BOOT_COMPLETED`/`REBOOT`/`MY_PACKAGE_REPLACED` receiver intact. `USE_EXACT_ALARM` is
  declared alongside `SCHEDULE_EXACT_ALARM`, so exact alarms need no user grant on Android 12
  and above. Re-arming after a reboot or an app update is correctly wired.
- **The background task's always-unregister-then-register is deliberate and documented.**
  It resets the WorkManager window on every app launch, which `ai/RUNBOOK-background-tasks.md`
  already records at `:402` and `:521`. Not re-reported.
- **The overlay row index is consistent end to end.** `components/prayer/List.tsx:80` passes
  the sequence index from `canonicalDisplayOrder`, `usePrayer` indexes the same chronological
  array, and `getOverlayTarget` filters the store's sequence the same way. The canonical
  display reordering does not leak into the overlay target.
- **The timezone model holds, and it is more general than London.** `shared/time.ts:51-94`
  reads the real offset from Intl at the instant, caches per UTC day with a first-minute and
  last-minute equality check, and falls back to per-quarter-hour reads on change days. That
  correctly handles a 30-minute shift, four transitions a year, and no DST at all. This part
  of the codebase is already global.
- **Two alerts can land on the same instant, and the app handles it correctly.** The owner
  asked directly during session 4 whether a reminder and an at-time alert can coincide, and
  what breaks if they do. They can, every day, and the coincidence is structural rather than a
  user picking odd times: `TIME_ADJUSTMENTS` puts Suhoor at Fajr minus 20 and Duha at Sunrise
  plus 20, and 20 is one of `REMINDER_INTERVALS`. Enumerated with the repository's own
  `transformApiData` and `createPrayer` against a real London day (13 Sep 2026, Fajr 04:57,
  Sunrise 06:28), there are six same-instant groups:

  | Instant | The two alerts | Why |
  | --- | --- | --- |
  | 04:37 | Fajr reminder −20m, **Suhoor at-time** | `suhoor = fajr − 20` |
  | 06:28 | Sunrise **at-time**, Duha reminder −20m | `duha = sunrise + 20` |
  | 04:27, 04:32 | Fajr reminder −30m/−25m, Suhoor reminder −10m/−5m | same 20-minute offset |
  | 06:18, 06:23 | Sunrise reminder −10m/−5m, Duha reminder −30m/−25m | same 20-minute offset |

  **Nothing in the app breaks, and the reason is the identifier scheme.** Every colliding pair
  carries a distinct deterministic identifier, verified in the same run:
  `athan_<schedule>_<name>_<date>` for at-time and
  `reminder_<schedule>_<name>_<date>_<interval>` for reminders
  (`device/notifications.ts:33` and `:41`). Distinct identifiers mean distinct MMKV record keys
  at `stores/database.ts:198`, no same-identifier replace, and a reconciliation sweep that sees
  both as intended rather than either as an orphan. Both are scheduled and both are delivered.
  On Android they also sit on different channels, so neither can be dropped by the other's
  channel state.

  What the user hears is two sounds at once, which is a consequence of switching both on and
  is the owner's call, not a defect. **Not tested on the device**: doing so needs a prod build
  and a wait until 04:37, so the audible result is reasoned from the scheduling path rather
  than heard.

  One thing did break, and it was the tooling rather than the app: `device_checks.py` crashed
  on exactly this input. That is finding 58, fixed.

- **Nothing runs twice at launch.** `startCountdowns()` is called from both bootstrap and
  sync, but `startWallClockTicker` clears first and the loop re-arms only while it still owns
  the handle, so the two-timers invariant holds. `handleAppUpgrade` has its own once-per-launch
  guard.
- **The What's New modal cannot loop and cannot fire on a fresh install.** The shown-version
  is stamped on display rather than dismiss, and `handleAppUpgrade()` is `sync()`'s first
  synchronous statement before any `await`, so the fresh-install seed provably lands before
  the mount effect reads the key. That ordering is correct but implicit, and no test pins it.

---

# What is genuinely sound

Worth stating plainly, because a findings document that lists only defects misrepresents the
codebase.

**The night-times work is the strongest thing in the repository.**
`shared/__tests__/nightTimes.test.ts` derives expected instants from an independent UTC
reference and London's clock-change rule rather than from the app's own helpers, pins them
against real published data across both 2026 transitions, then sweeps all 366 days of a real
year asserting Midnight and Last Third, their wall-clock readings, their `belongsToDate`,
their ordering within the night, and that `getPrayerForDate` returns byte-identical rows to
the list. `time.test.ts` matches Intl minute by minute across both clock changes and pins the
skipped and duplicated hours explicitly. These would catch a two-minute error.

**The scheduling design is careful in the ways that count.** Deterministic identifiers give
idempotent replace on both platforms, so a lost MMKV record cannot produce a duplicate alert.
Schedule-first-then-cancel-stale means process death mid-batch can never leave zero armed
notifications. The failure path at `stores/notifications.ts:467-473` re-records the
deterministic identifier precisely so a surviving OS notification is not swept away by its own
bookkeeping, which is the kind of detail most codebases get wrong. The sweep's
`records.length === 0 && osIdentifiers.length > 0` guard correctly distinguishes "we do not
know" from "nothing should exist", with the Android `MY_PACKAGE_REPLACED` reasoning written
down.

**The audio matrix closes exactly, across four independent surfaces, with zero orphans in
either direction.** `prayerNameSlug` is the right two-character fix for Android's `res/raw`
constraints and `Last Third` is the case that proves it. Every one of the 99 files is a valid
MPEG with a real payload, and md5 over both the raw bytes and the decoded audio streams
confirms all 99 are distinct recordings. The `_v2` channel-suffix reasoning and
`deleteLegacyAndroidAudioChannels` show someone had already thought carefully about Android's
immutable-channel-sound rule.

**The version and cache split is the best piece of reasoning in the files I read.** Separating
"the app version changed, so force one reschedule" from "the cached data's shape changed, so
wipe it", with `CACHE_SCHEMA_VERSION` as the explicit marker and a doc that spells out why
wiping on every release is pure cost, is exactly right for this app. The whitelist rather than
blacklist approach, the deliberate placement of the schema stamp outside `clearUpgradeCache`
so its error handling cannot swallow it, and the encoding-preserving migration that copies
the raw MMKV string rather than re-encoding it are all correct. The irony is that the gate
function at the centre of it has no test and the forcing function does not work.

**Feature flags fail in the safe direction, deliberately and provably.** Only the exact string
`1` enables, so absence, `0` and every typo disable. An unknown flag id in a What's New item
yields `undefined`, which excludes the item, so a dark feature cannot be advertised and
neither can a typo'd one.

**The widget chain's timezone discipline is clean.** A grep for device-local date getters
across the whole widget chain returns only four `new Date(ms)` constructions from absolute
epochs. Every calendar decision goes through the prayer-timezone helpers, the swap moment uses
the same strict comparison as the app, the day roll anchors on the same `belongsToDate`, and
the extras ordering matches rank for rank. A traveller's phone cannot desynchronise the widget
from the app.

**`modules/tls13` is tight**: SDK-gated to Android 9 and below, exception-swallowing with a
documented best-effort fallback, not exported, and with an `${applicationId}`-scoped authority
so the deliberate side-by-side install cannot collide. **`device/updates.ts` fails closed in
every direction**: unreachable, malformed, null and lower-than-installed all return false, the
outer catch returns false, the throttle is set in `finally`, and the prompt is dismissible and
blocks nothing.

**`e2e/README.md` is an unusually honest artefact.** It documents Metro's env-blindness, the
mock contamination that outlives the build that caused it, and the dumpsys and accessibility
staleness traps. Several findings in Tier 3 are cases of the tooling not yet obeying rules
the README already states.

---

# Coverage: who read what

Every tracked source file has an owner. This table exists so the gaps are visible rather than
implied. "Orchestrator" means read in full in the main session; the rest were read in full by
a specialist sweep whose findings are merged above.

| Area | Files | Reader | Read in full |
| --- | ---: | --- | --- |
| `shared/time.ts`, `shared/prayer.ts`, `shared/notifications.ts` | 3 | Orchestrator | yes |
| `stores/notifications.ts`, `database.ts`, `sync.ts`, `version.ts`, `schedule.ts`, `countdown.ts`, `overlay.ts` | 7 | Orchestrator | yes |
| `device/notifications.ts`, `tasks.ts`, `listeners.ts` | 3 | Orchestrator | yes |
| `hooks/usePrayer.ts`, `usePrayerSequence.ts`, `useSchedule.ts`, `useCountdown.ts`, `useCountdownBar.ts`, `usePrayerAgo.ts`, `useNotification.ts` | 7 | Orchestrator | yes |
| `api/client.ts`, `api/config.ts` | 2 | Orchestrator + config sweep | yes |
| `components/` (all subdirectories) | 50 | Components sweep | 50/50 |
| `app/`, `stores/ui.ts`, `overlay.ts`, `atoms/`, `storage.ts`, `bootstrap.ts`, 6 animation hooks | 19 | App-entry sweep | yes |
| `widgets/`, `stores/widget.ts`, `shared/widgetTimeline.ts`, `widgetTypes.ts`, 7 widget suites | 14 | Widget sweep | yes |
| `device/updates.ts`, `backgroundTaskDebug.ts`, `tls13.ts`, `modules/tls13/`, `plugins/`, `app.json`, `app.config.ts`, `eas.json`, `releases.json`, `e2e/` | 24 | Native and release sweep | 24/24 |
| Root config, `shared/logger.ts`, `flags.ts`, `config.ts` and their suites | 24 | Config and security sweep | yes |
| `shared/constants.ts`, `types.ts`, `text.ts`, `versionUtils.ts`, `whatsNew.ts`, all 8 `__mocks__`, 10 `__tests__` | 26 | Shared and coverage sweep | yes |
| `assets/` (163 files), `mocks/` | 166 | Assets sweep | yes |
| `hooks/__tests__` (6), the three fake-timer suites | 9 | Test-suite sweep | see leads 1 and 2 |

Baseline for the whole repository, taken before any of this: `yarn jest` reports **42 suites,
1015 tests, all passing**. `jest --listTests` discovers 42 files and `git ls-files` finds 42
test-named tracked files; the two sets are identical in both directions, so no tracked test is
undiscovered and no discovered test is untracked. `npx biome check .` clears 194 files with no
diagnostics, and `tsc --noEmit` exits 0.

---

# Evidence appendix

## The verification suite

Nineteen tests across three files back the findings marked **[test]**. They live outside the
repository, deliberately, because this session changes no application code:

```
/private/tmp/.../scratchpad/__tests__/auditA.test.ts   9 tests   findings 2, 3, 4, 7, 12, 13
/private/tmp/.../scratchpad/__tests__/auditB.test.ts   8 tests   findings 8, 44, Tier 6 item a
/private/tmp/.../scratchpad/__tests__/auditC.test.ts   2 tests   finding 48
```

They run against the real module graph, the real mocks and the real jest config, by adding the
scratchpad as a second jest root while keeping `rootDir` on the repository so `@/` and the
`moduleNameMapper` entries still resolve:

```bash
npx jest \
  --roots $HOME/repos/rn.athan.uk \
  --roots <scratchpad> \
  --modulePaths $HOME/repos/rn.athan.uk/node_modules \
  --testPathPatterns auditA
```

Every one of the nineteen passes, which is the point: each asserts the defective behaviour, so
a green run is the proof. When session 4 fixes one, the corresponding assertion is what should
be inverted and moved into the repository as a regression test.

## Tools used, and which path

Per the owner's global tool rules, `tinyfish` and `docs-mcp-server` are opencode-only, so this
session used the Claude Code equivalents where a lookup was needed. In practice almost nothing
external was required: every finding here is grounded in the repository, its `node_modules`, its
git history, or a live read of the attached device. No web search and no documentation MCP call
contributed to any finding. Library behaviour was verified by reading the installed source
directly, which is the `opensrc` role: `node_modules/jotai/vanilla/utils.js` for finding 2,
`node_modules/expo-notifications/build/scheduleNotificationAsync.js` for finding 11,
`node_modules/pino/browser.js` for finding 53, and
`node_modules/react-native-performance/src/` for finding 36.

## What was deliberately not done

- **No device build.** Nothing here required one, and a build would have meant a version bump,
  which triggers `handleAppUpgrade()` and wipes the device's prayer cache. The two findings that
  would benefit from device confirmation are 5 (the Android channel gap, which needs a
  backup-and-restore cycle) and 31 (the reminder stray-alert check, which needs a reminder
  armed). Both are labelled accordingly.
- **No `.env` read.** The untracked `.env` may hold the real API key. It was not opened, not
  echoed, and does not appear anywhere in this document.
- **No re-derivation of the settled list.** Night times, the timezone model, the API as source
  of truth on DST, the TLS provider and the launch-time split were taken as given. Where reading
  them was unavoidable they are recorded under "already settled, re-verified in passing", not as
  findings.
