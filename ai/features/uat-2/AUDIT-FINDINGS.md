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
| 61 | The pre-commit hook cannot commit a change to `metro.config.js` or `jest.config.js` | 2 | CONFIRMED, found in session 4 |
| 60 | `metro.config.js` calls a load-bearing transform a "THROWAWAY experiment" | 2 | CONFIRMED, found in session 4 |
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

**FIXED in 1.25.25** (`fix/audit-3-extras-mismap`), to the owner's ruling exactly.

`migrateIndexKeyedAlertPreferences` now takes the captured `storedVersion` and picks the name
array from it: below `1.0.27` the index keys are read against
`['Last Third', 'Suhoor', 'Duha', 'Istijaba']`, from `1.0.27` on against today's
`EXTRAS_ENGLISH`. The index says what a key **meant**; the destination atom is resolved by
**name**, so the two index spaces can never be confused again. `handleAppUpgrade` passes the
value it captured at the top of the function, before `setStoredVersion` overwrites it, which
is the ordering trap the ruling named.

Both traps from the ruling are handled. The leftover sweep is explicit rather than relying on a
`CACHE_SCHEMA_VERSION` bump, because `UPGRADE_KEEP_PREFIXES` keeps `preference_` on purpose so
alarm settings survive a cache wipe; every remaining
`preference_(alert|reminder_alert|reminder_interval)_(standard|extra)_<digit>` is removed,
including `extra_4`, which has no counterpart in the four-element legacy array and which the
loop therefore cannot reach.

A fresh install (`storedVersion` null) and an unreadable version both migrate as today, since
neither is evidence of a pre-1.0.27 install.

### How narrow the legacy branch really is, asked by the owner and re-researched

The owner pushed back: what does the pre-1.0.27 array buy, and why not just fix forward? Three
things came out of checking rather than defending.

**"Fix forward" is not an available option.** Fixing forward means migrating with today's array,
and that *is* the defect. There is no third interpretation: either the code knows which array a
key was written against, or it must delete the key. Forcing an upgrade does not help either,
because the values are already in MMKV and the upgrade is the moment they get read.

**The shift is older than the migration, and it is live in production right now.** Production
1.5.2 still keys preferences by index (`preference_alert_${type}_${prayerIndex}`,
`b9985ea:stores/notifications.ts:91`) and already carries the modern five-name
`EXTRAS_ENGLISH`. So the moment 1.0.27 inserted Midnight at position 0, every existing user's
extras preferences shifted by one — no migration involved. That is the defect name-keying was
introduced to stop, and `stores/notifications.ts:217-221` already says so. For anyone who has
opened the app since January 2026 it cannot be undone, and should not be: they have been shown
the shifted state for months and may have adjusted it.

**The population, corrected twice.** An earlier draft of this section claimed the branch was
narrower still, because users would pass through 1.5.2 and be stamped by it. That was wrong,
and the error is worth keeping visible because it is easy to repeat.

`app_installed_version` moves only when the app is **opened**: `setStoredVersion` runs inside
`handleAppUpgrade`, which `sync()` calls on launch (`b9985ea:stores/version.ts:156` for the
production tree). An auto-update swaps the binary silently and never runs it. So a user who set
extras alerts in 2025 and has not opened the app since still holds `app_installed_version` of
1.0.x today, however many times the store has updated their binary in the background.

The branch therefore fires for **anyone who has not opened the app since 2026-01-17 and whose
next open lands on a build carrying the migration**. The app has been on the store since
November 2024, so that is a real population rather than a rounding error.

What stays true from the earlier draft: for anyone who *has* opened 1.5.2, the branch is dead
code. 1.5.2 already showed them the shifted extras and stamped 1.5.2, so the modern array is
the right answer for them — not because it matches original authorship, but because it matches
what the app last showed them. Dead code for active users, load-bearing for dormant ones.

That is the honest framing of what the discriminator does: it preserves **the last
interpretation the user was shown**, not the original intent. Which is the correct goal.

**Kept.** The branch is a dozen lines of code behind thirty of comment, costs one version
comparison for everyone else, and is inert unless the stored version is below 1.0.27. What it
prevents is an athan firing at Islamic Midnight for a user who asked for one at Last Third,
which is the failure class this app can least afford. The alternative that is genuinely
simpler is deleting the old extras keys instead of mapping them, three lines, which trades that
for an alarm the user did choose silently switching off. For an alarm clock neither of those is
free.

**The larger prize in this commit is not the legacy array.** It is resolving the destination
atom by name rather than by index, which makes the migration correct under *any* future
reordering rather than this one specific insertion. That part earns its place regardless.

Four new tests, 114 to 118. Two deliberate breaks confirm they bite: restoring the mis-map
fails the pre-1.0.27 mapping test, and removing the sweep fails the leftover test.

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

**FIXED in 1.25.23** (`fix/audit-4-migration-through-atoms`). The migration now writes through
the atom that fronts each destination key, so the migrated value is visible for the rest of the
launch instead of only on disk. A value that is not a finite number is still copied verbatim
rather than re-encoded into `NaN`, which keeps the encoding-preserving property the original
had.

**This one survives the finding 2 correction, and the reason is worth stating.** Finding 2 was
wrong because its two actors live in different modules, so `inlineRequires` could reorder them.
Here the atoms and `migrateIndexKeyedAlertPreferences` are in the **same module**: evaluating
`stores/notifications.ts` in order to call the function necessarily creates every atom first.
No bundler setting can change that, so the defect is real in Release as well as in jest.

Two regression tests in `stores/__tests__/notifications.test.ts`, 112 to 114. The first asserts
the value is readable through the atom, not just present in MMKV; reverting the fix makes it
fail with `Expected: 2, Received: 0`, which is the finding's own symptom. The second pins the
verbatim copy of a non-numeric value.

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

### CLOSED in session 5, 1.25.35, `fix/audit-5-athan-channels-at-schedule`

The restore trigger is no longer LIKELY, it is **CONFIRMED**, and the symptom above is wrong
in a way that matters. Performed on the 3T with a real Android Auto Backup cycle — `adb backup
-noapk`, `pm clear`, `adb restore` — which is exactly the finding's scenario: MMKV comes back
(`preference_sound = 4`, the Magrib Sound alert still armed and still drawn with the speaker
icon), notification channels do not. The pre-fix build then created only `athan_1_v2` and
`extras_at_time`, leaving every daily prayer scheduled to the absent `athan_5_v2`.

**Android does not drop the notification. expo-notifications 57 substitutes its own channel.**
Driven through a real 19:25 Magrib firing on each build, same restored data, bundles identical
either side of the one-line guard (`fa78c7b7` fixed, `795f07cb` pre-fix):

| | pre-fix | fixed |
| --- | --- | --- |
| posted channel | `expo_notifications_fallback_notification_channel` | `athan_5_v2` |
| importance | 4 | `pri=2` (MAX) |
| vibration | `[0, 100, 150, 100]` (Android default) | `[0, 250, 250, 250]` (the app's) |
| audio | `AudioTrack 44100 Hz stereo` = the device's default tone | `AudioTrack 44100 Hz mono` = `athan5.mp3` |

The sample-rate/channel-count pair is a usable fingerprint for *which file played*, because the
assets differ: `athan1.mp3` and `athan5.mp3` are 44100 Hz mono, `reminder_magrib_10.mp3` is
22050 Hz stereo, and the system tone is 44100 Hz stereo. So the real user-visible defect is not
silence — the alarm rings, which is why it would never be reported as "no notification". It
rings the phone's generic notification ding in place of the athan, one importance step down.
That is worse than a drop for an alarm clock: nothing looks broken.

The fallback channel is created by expo on first use and persists, so a device that has hit
this once keeps the channel in its notification settings afterwards.

Also driven end to end on the device, all green: the sound sheet writing `athan_5_v2` with
`raw/athan5` on close (and nothing on selection — "Close to save" is literal); a 10-minute
Magrib reminder firing at 19:15 on `reminder_magrib_10` at 44100 Hz stereo, matching
`reminder_magrib_10.mp3` (mis-recorded: that reminder plays at 22050 Hz stereo, as "Session 1 of
the queue" below shows); the reminder interval moving 15 → 20 and taking both its channel
(`reminder_fajr_20`) and its alarm (04:42 → 04:37) with it; and the owner's own configuration,
Athan 1 with Fajr alone, firing on `athan_1_v2`. Channel dumps before and after the upgrade are
byte-for-byte identical, so the 1:1 requirement holds.

Two notes for later. Superseded reminder channels are never deleted — `reminder_fajr_15`
survived the move to 20 with nothing scheduled against it, which is cosmetic but visible in
Android's notification settings; not filed as a finding, and the same is true of every athan
channel the user has ever selected. And `pm uninstall -k` is **not** a substitute for the
backup cycle: it takes MMKV with it, so the preference is gone and the scenario cannot form.

## 6. The error screen's only button deletes the prayer cache

**OWNER RULING, 2026-09-12: the wipe stays. This finding is WITHDRAWN as a defect.**

*"IT WAS FINE BEFORE. ONE BUTTON. REFRESH. DOES THE RESET. DONT CARE IF ITS DESTRUCTIVE. IT
DOESNT DELETE PREFERENCES."*

1.25.29 removed the wipe and 1.25.33 puts it back, with the screen's markup and styles
byte-identical to where the session found them. The owner's reasoning stands on inspection:
what the button deletes is the downloaded timetable, the fetched-year markers and the
notification bookkeeping, all of which the app rebuilds — `forceNotificationReschedule()` runs
inside the same call, and the sweep's `records.length === 0 && osIdentifiers.length > 0` guard
means dropping the records cannot mass-cancel anything. Every `preference_` key survives: each
prayer's alert type, every reminder and interval, the athan choice, and the display toggles.

**The owner's second point closes the objection rather than trading against it.** *"When that
breaking happens, we expect the user to have a connection, otherwise it can't break through."*
That is correct for the reach path that existed before this session. `sync()` rejecting is
almost always a failed fetch, and recovering from it needs the network whether or not the cache
was wiped: on the next launch the same fetch is attempted and fails the same way. The cached
timetable is not being displayed while the user sits on this screen, so losing it costs nothing
they currently have.

The residual is narrow and worth naming precisely: a **non-network** throw reached **offline**,
where reloading alone would have recovered and a wipe makes it permanent. That path only exists
from this session onwards, because finding 7 added an `ErrorBoundary` that routes render throws
here. Finding 8 is what shrinks it, by validating the response so unreadable data is never
cached in the first place. Worth re-checking once finding 8 lands; not worth a second button.

**What survives from the finding**, and it is small: the call now goes through
`clearUpgradeCache` rather than the inline `clearAllExcept(['app_installed_version',
'preference_'])`. Same three things deleted, but the inline list also dropped
`cache_schema_version` and `prayer_max_english_width_`, and losing the widths reflows the
prayer list on the next launch — a visible regression the screen has no reason to cause
(ISSUES #22, #16). The reload also gained a try/catch, since `handleRefresh` was async with
none.

**Superseded text from 1.25.29 follows, kept because the trace is still the reason the
`clearUpgradeCache` routing matters.**

This is one of the three findings in this document that is **live in production 1.5.2**, and
it is the one whose failure mode is worst: the screen is reached from a failed fetch, so the
common case is an offline user whose timetable is fine on disk being offered a single button
that destroys it. After that every reload finds nothing, fetches, throws, and returns here.

The regression test is a call-site guard in `stores/__tests__/database.test.ts` rather than a
component test, since there is no renderer. It asserts `clearAllExcept` is called from exactly
`stores/sync.ts` and `stores/version.ts` across every source directory, with comments stripped
first so prose naming the function does not count. Restoring the wipe fails it.

Finding 7's boundary landed immediately before this, which is the order the session brief
required: the boundary routes more traffic to this screen, so the screen had to stop being
destructive in the same session.

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

**FIXED in 1.25.27** (`fix/audit-7-display-date-guard`). All three parts:

- `createDisplayDateAtom` returns `null` when no prayer is in the future, matching its own
  no-sequence branch and the sibling next/prev atoms that consumers already handle.
- `getYesterdayFinalPrayer` returns `Prayer | null` and guards the cache read, with a warning
  naming the missing date. Its caller `createPrevPrayerAtom` already returned `Prayer | null`,
  so nothing downstream changed shape.
- `app/_layout.tsx` exports an `ErrorBoundary` that logs the error and renders `ErrorScreen`.
  Expo Router renders it in place of the route when the subtree throws, which is what
  `app/index.tsx`'s `hasError` branch could never do since it only covers a rejected promise.

Two regression tests, 35 to 37 in that suite: the 31 December evening with every prayer passed,
and a 1 January launch with no record for the previous day. Restoring both assertions fails
exactly those two.

ADR-004's "trust the data layer" still holds as a design rule. What changed is the failure
mode: these two reads happen during render, so a gap became a dead screen rather than a missing
row.

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

### CLOSED in session 5, 1.25.37, `fix/audit-8-47-api-shape-guard`

`validateApiTimes` in `api/client.ts` asserts all six of `fajr`, `sunrise`, `dhuhr`, `asr`,
`magrib` and `isha` against `^([01]\d|2[0-3]):[0-5]\d$` and throws
`Malformed prayer time: <date> <name> is <value>`, which names the offending day and field in
one log line instead of a `RangeError` from three layers down.

**Placed after `filterApiData`, not inside `validateApiResponse`.** The fix direction said the
latter, and that would have been a regression: `filterApiData` already discards everything
before yesterday, so validating the raw payload would let one malformed January row reject a
whole year in December and kill a working app. A day the app never reads cannot crash it. The
guard therefore runs on exactly the days that get cached, and a pinned test asserts a malformed
past day is still silently discarded.

All four cases the sweep reproduced are now regression tests, plus the polar-day `"-----"` of
finding 47, an out-of-range `25:61`, and a day whose value is `null`. Six of the seven were
shown to fail with the guard lifted out of the pipeline; the seventh is the no-over-rejection
test, which correctly passes either way. Suite 1041 → 1048, green in all four of `yarn test:tz`.

### CORRECTED in 1.25.59, `fix/audit-8-per-day-validation`, after independent review

**The guard as first written was worse than the defect.** It rejected the whole response, and
`filterApiData` keeps yesterday plus *every future date in the payload* — about 365 days on a
January fetch. So one unreadable day 200 days away rejected the year. Reproduced:

```
valid today + one day 200 days out with sunrise "-----"
  -> REJECTED: Malformed prayer time: 2027-03-31 sunrise is "-----"
```

Follow it into `stores/sync.ts` and it is a **permanent brick**: `clearAllExcept` wipes the
prayer cache *before* `fetchYear` runs, so the sequence is wipe, fetch, throw, error screen,
with nothing cached. `needsDataUpdate()` is still true next launch, so it wipes and throws
again, and the Refresh button does the same. It self-heals only if the provider fixes that one
day.

Worse, it defeated the very finding it was meant to close. High-latitude `"-----"` is
**seasonal**, not a one-day glitch: a Tromsø payload carries a 60-day polar-summer window of
them, so a user fetching in January would be rejected outright and the app would never work at
any time of year, instead of working for ten months.

The write-up reasoned about exactly this hazard in the *past* direction and closed only that
half. The future direction is identical in kind and strictly worse, because the bad day is
ahead of the user rather than behind.

**Now per-day.** Unreadable days are dropped with a warning naming the day, the field and the
value; the response is rejected only when **today** is unreadable — the day an alarm clock
actually needs — or when nothing readable remains at all. The today check is conditional on
today being present, so the next-year fetch, which never contains today, is unaffected.

**The fixture choice is what hid it, and it is the same shape as finding 44's Istijaba bug.**
All six original rejection cases used a single-day payload, and with one day in the payload
"drop the day" and "reject the year" are indistinguishable — the blast radius is structurally
unobservable. The one blast-radius test probed only the past direction, which the placement
already handled. Four new cases probe forward: one bad day 200 days out, an unreadable day
between two readable ones, a 60-day polar window, and an all-unreadable payload that must still
fail. Restoring the all-or-nothing guard fails nine of the fifteen.

**Recorded, not fixed:** the regex is shape-only. `"5:30"`, `"05:30:00"`, `"05:30 (BST)"` and
`"24:00"` are all rejected, and none occur on the current London endpoint with `24hours=true`,
but each is plausible the moment a second provider is added — now a dropped day rather than an
outage. It also cannot catch six `"00:00"` values, a 12-hour time without a meridiem, or a
day whose prayers are out of order. A monotonicity assertion on
`fajr < sunrise < dhuhr < asr < magrib` would close a class the regex cannot, and belongs with
the worldwide endpoint work.

**Finding 47 is closed by this too** for the crash half. The polar-day *modelling* question —
what a correct Fajr and Isha are above ~60N when the sun never sets — is untouched and stays
Tier 5 scope for v2.0, as the endpoint is London-only today (finding 43).

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

### CLOSED in session 5, 1.25.39, `fix/audit-10-alerttype-storage-contract`

New suite `shared/__tests__/types.test.ts` (44th suite): the three integers pinned by value,
`Off` pinned at zero separately because the falsy checks and the default both lean on it, and
`Object.values` pinned at exactly `[0, 1, 2]` so an appended member has to be declared here
first. `ScheduleType`'s strings are pinned in the same file, since they appear inside MMKV key
names. The enum's JSDoc now states the contract and says why a symbol-to-symbol assertion
cannot enforce it.

**Correction to the finding.** "The full suite stays green" is wrong. Swapping `Silent` and
`Sound` and running the whole suite fails **four** tests in two files: the new pin, and three in
`stores/__tests__/notifications.test.ts` that happen to assert the literal `'2'` in a storage
key. So the gap was narrower than recorded. It was still worth closing, for two reasons: those
three are incidental, and would be "fixed" by editing the expected literal rather than read as
a contract violation; and they only catch a swap of these two members, not an insertion or a
renumbering that leaves `Sound` at 2.

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

### CLOSED in session 5, 1.25.40, `fix/audit-11-mock-identifier-echo`

The shared mock is now `jest.fn(async (request) => request?.identifier ?? 'mock-notification-id')`,
matching the SDK's `request.identifier ?? uuid.v4()`. The constant survives only as the stand-in
for the SDK's generated uuid, which production never triggers because it always supplies an
identifier. The `afterAll` in `stores/__tests__/notifications.test.ts` that restored the old
constant now restores the echo, so the file's own default matches the module's.

Changing the mock broke nothing: the suite stayed at 1052. That is worth stating plainly — the
finding is about what the mock *could not catch*, not about a live failure, so an unchanged
suite is the expected result rather than a weak one.

Three new cases in `device/__tests__/notifications.test.ts` pin the invariant in production
terms rather than mock terms: the at-time record id equals `prayerNotificationIdentifier`, the
reminder record id equals `reminderNotificationIdentifier` with its interval, and two prayers on
one day get two distinct ids so their MMKV records cannot collapse onto one key. All three fail
with the mock reverted to the constant.

## 62. OBSERVED ONCE, NOT REPRODUCED: the app sat with an armed alert and no alarm

Found in session 5 on 2026-09-12 by routine device checking, not by reading code. **Recorded
rather than fixed, because three deliberate reproduction attempts all failed.** It is written up
because the symptom is the worst this app has — the UI says an alarm is set and nothing will
fire — and because the next session should know it has been seen once.

**What was observed.** After installing 1.25.45 on the 3T, `yarn check:device` reported
`no alarms armed for com.mugtaba.athan`. Fajr was on Sound and drawn with the speaker icon, the
cache held real London times, the process was alive (pid 10879), and there was no crash in
logcat. The state persisted for roughly ten minutes across repeated checks, including after the
What's New modal was dismissed. Toggling Fajr off and back to Sound re-armed it immediately, so
scheduling itself was healthy.

**What was ruled out.** No runtime code changed between the last passing check at 1.25.40 and
the failing one at 1.25.45: `git diff` over that range, excluding docs, tests and mocks, is a
single eight-line JSDoc comment in `shared/constants.ts`. So it is not a regression from the
session's fixes.

**What would not reproduce**, each tried deliberately afterwards:

| Attempt | Result |
| --- | --- |
| force-stop, cold launch, wait 25s | re-armed correctly |
| install a version bump over the running app | alarms **survived** the install |
| force-stop with the What's New modal pending, cold launch | re-armed within 20s |

So finding 59's cold-launch re-arm works, the upgrade path works, and the modal does not block
it. The one path not isolated is the exact original ordering: install a bump over a *running*
app, then force-stop, then launch — which is what `devcheck.sh` does and what happened at 1.25.45.

**Why it could not be diagnosed further.** Logging is disabled in production builds (finding 56),
and a prod build is required for real data, so there is no app-side trace of whether the
reschedule ran and returned nothing or never ran at all.

**What the next session should do.** Reproduce under a preview build with logging on, or add a
temporary breadcrumb that survives to MMKV, and drive the exact ordering above in a loop until it
recurs. The two mechanisms worth suspecting first are the 12-hour gate in
`shouldRescheduleNotifications` and a race between the cold-launch re-arm and the upgrade's own
`forceNotificationReschedule`, since both ran on that launch and only that launch.

### MECHANISM FOUND in session 5, fixed in 1.25.91, `fix/audit-62-reschedule-retry`

An independent review of the scheduling core traced a path that fits every observed fact.

`_rescheduleAllNotifications` correctly refuses to reschedule against an empty prayer cache and
correctly does **not** stamp the 12-hour gate on that bail, logging that "the next foreground
will retry". But there are only two callers of `refreshNotifications`: `app/index.tsx` at mount
plus 1500 ms, and `device/listeners.ts` on a `background → active` transition. **Within one
foreground session there was exactly one attempt.** `sync()` completing did not trigger another
— it calls `handleAppUpgrade`, `updatePrayerData` and `initializeAppState`, and never touches
the notification refresh.

The upgrade launch is where that bites, and it is the launch the sighting happened on:

1. A package replace cancels every AlarmManager alarm.
2. `bootstrapFromCache` sees `wasAppUpgraded()` and skips synchronous hydration.
3. `sync()` starts a real network fetch.
4. At mount + 1500 ms the post-paint refresh runs, finds no prayer data for today, bails, and
   leaves the gate unstamped.
5. Nothing re-runs it. The app sits foregrounded with the preference atoms — hence the UI —
   showing Sound, and no alarms armed.
6. Toggling the alert calls `updatePrayerNotifications`, which bypasses both the gate and the
   empty-cache guard and arms immediately. **That is exactly the reported recovery.**

It also explains the three failed reproductions: none of them was an *upgrade* launch, so the
cache was warm, `getPrayerByDate` succeeded, and the reschedule ran.

Ruled out by the same review, and worth recording so it is not re-suspected: there is no race
between `forceNotificationReschedule` and `reopenRefreshGateOnColdLaunch` — both write 0 through
the same atom, `withSchedulingLock` is a FIFO queue rather than a skip-lock so nothing is
dropped, and the gate stamp is inside the lock callback so a queued-then-bailed operation cannot
stamp a false success. **The gate was not the culprit; the missing retry behind it was.**

**The fix** is one effect in `app/index.tsx` that re-runs `refreshNotifications()` when
`syncLoadable` reaches `hasData`. It cannot live in `stores/sync.ts` — `stores/notifications.ts`
already imports `sync`, so that direction would be a cycle. The gate makes it a no-op whenever
the first attempt succeeded, so the cost on a normal launch is one atom read.

**Honesty about the evidence:** the original failure was never reproduced, so this is a fix for
a mechanism that fits, not a fix confirmed against a reproduction. What *is* verified on the 3T
at 1.25.91: the exact untested ordering from the write-up — a version bump installed over a
running app, then a force-stop, then a launch — arms correctly, and three further
force-stop-and-relaunch cycles each disarmed and re-armed. The finding stays open in the sense
that a recurrence would disprove this; `device-checks.sh` failing loudly on zero alarms is what
would catch it.

Superseded: UNRESOLVED. Observed once, on a real device, with evidence; not reproduced, not
explained, not fixed.

## 61. The pre-commit hook cannot commit a change to `metro.config.js` or `jest.config.js`

Found in session 4 by hitting it: the hook rejected the finding 60 comment fix.

**FIXED in 1.25.21** (`fix/audit-61-lintstaged-unmatched`).

`biome.json:9` excludes two files by name:

```json
"includes": ["**", "!**/.agents", "!**/metro.config.js", "!**/jest.config.js"]
```

`package.json`'s lint-staged glob is `**/*.{js,jsx,ts,tsx,mjs}`, which matches both of them.
Staging either one hands it to `biome check --write`, and Biome exits non-zero when every path
it was given is ignored:

```
× No files were processed in the specified paths.
husky - pre-commit hook exited with code 1 (error)
```

So a change to either file cannot be committed through the hook at all. The only way past it
is `--no-verify`, which skips the **entire** gate: Biome on every other staged file, and the
related-test run with it. A config change is exactly the kind of edit that most deserves the
tests, and it is the one edit the hook forces you to skip them for.

This compounds finding 52. That finding says the only quality gate is a hook a fresh clone does
not get; this one says the hook also trains you to bypass itself.

**Fix.** `--no-errors-on-unmatched` on the Biome call, which exists for this exact case. Biome
still checks everything it is meant to check; it just stops treating "all these paths are
deliberately ignored" as an error.

CONFIRMED, reproduced, fixed.

## 60. `metro.config.js` calls a load-bearing transform a "THROWAWAY experiment"

Found in session 4 while correcting finding 2. The danger here is the comment, not the code.

**FIXED in 1.25.22** (`fix/audit-60-metro-comment`). The comment now says what the transform
does, cites `8630f75` for the measurement, and states that evaluation order is load-bearing and
not reproduced by jest. The transform itself is untouched.

**The history settles it.** `git show 8630f75` shows the word THROWAWAY was written **in the
same commit that shipped the change**, as one of *"six coordinated launch-path changes,
verified on the 3T (Android 9) and iPhone XS"*. It is a drafting label that was never updated
when the change was kept, and the commit body is the real record:

> `metro.config.js: inlineRequires true (Expo defaults it OFF) — bundle exec 764ms -> 86ms;`
> `module eval defers to first touch, so toggled-off features never evaluate`
>
> `inlineRequires relocates eval (~650ms from pre-entry into the content window, net cold`
> `total unchanged ~3.17s on the 3T) rather than deleting it`

So the transform stays. It is a measured first-paint win, not an experiment awaiting a verdict.

```js
// THROWAWAY perf22 experiment: defer module evaluation to first use.
getTransformOptions: async () => ({
  transform: { experimentalImportSupport: true, inlineRequires: true },
}),
```

Expo's default is `inlineRequires: false` (`@expo/metro-config/build/ExpoMetroConfig.js:346`).
This project turns it on, and it is anything but throwaway:

- It shipped in `8630f75`, *"1.22.0 - perf: first-paint surgery (perf22 campaign) — launch
  render work -20%, eval relocation"*. It is a measured performance win, not an experiment.
- It has already caused one visible defect. `ai/prompts/alert-sheet-first-frame.md:11` records
  that it *"stretched the first-open snapshot latency until the flash became visible in normal
  use"*, and tells the reader not to chase the diff.
- It is the only reason finding 2 is not a live bug. With requires inlined,
  `stores/version.ts` pulls `@/stores/notifications` at its first use, which is the migration
  call at the end of `handleAppUpgrade`, so the gate atom is created after the key is removed.
  Measured on the device, 5 ms after. Turn the line off and the defect is real and silent.

So a maintainer doing exactly what the comment invites, deleting a throwaway experiment, would
reintroduce an alarm defect with no test to catch it: the jest module graph is eager, so the
suite behaves as though the line were already off. That is the same dev-versus-release
divergence that made finding 2 wrong in the first place.

Nothing in `ai/` records the experiment's outcome. The performance campaign's own progress file
does not mention `inlineRequires` at all.

CONFIRMED, and closed by a comment rewrite with no behaviour change.

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

**FIXED in 1.25.30** (`fix/audit-59-cold-launch-rearm`), and **device-verified**.

`reopenRefreshGateOnColdLaunch()` clears the gate through `resetStoredAtom` on an Android cold
launch, called once from `app/index.tsx`'s mount effect inside the existing 1500 ms post-paint
defer. iOS returns immediately, since `UNUserNotificationCenter` keeps pending notifications
across termination and the gate is already correct there.

Verified on the OnePlus 3T with a prod build of 1.25.30, the same protocol that exposed the
defect:

```
baseline after upgrade launch   Alarm{410343a ... when 1789271820000}   (13 Sep 04:57, Fajr)
force-stop                      no prayer alarm armed
cold launch, t+6s               Alarm{53847c5 ... when 1789271820000}   re-armed
```

Before the fix, three consecutive cold launches after a force-stop never restored it. Three
regression tests in `stores/__tests__/coldLaunchRearm.test.ts` pin the Android clear, the iOS
no-op, and that the MMKV key is removed as well as the atom; disabling the platform check fails
the first.

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

### CLOSED in session 5, 1.25.54, `fix/audit-13-sequence-signature`

The signature is now every instant joined, rather than length plus the two endpoints. Length is
implied by the join, so a Friday gaining Istijaba still differs, and joining ~18 numbers stays
far cheaper than the row re-render pass the skip exists to avoid.

Two tests, because the fix has two ways to be wrong: a sequence whose only change is a middle
prayer must reach the store, and an identical sequence must still be skipped — asserted by
object identity, so a fix that simply deleted the optimisation would fail. Restoring the old
signature fails the first and not the second, which is the right shape.

Worth noting why this mattered more than it looks: the fallback repair path is not reliable.
`refreshSequence` only refetches when under 24 hours of buffer remains, so a stale mid-window
time could persist well past the correction arriving in MMKV.

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

### CLOSED in session 5, 1.25.52, `fix/audit-14-keep-list-schema-marker`

`cache_schema_version` added to the full-refresh keep-list in `stores/sync.ts`, with a comment
saying why losing it is expensive rather than merely untidy: a missing marker reads as "cache of
unknown shape", so the very next upgrade buys a wipe — the opposite of what the full refresh had
just achieved.

The window is real and was re-confirmed: `sync()` calls `handleAppUpgrade()` first, which stamps
the marker, and `updatePrayerData` then deletes it later in the same tick. So from any full
refresh until the next launch, an arriving upgrade wipes needlessly.

`stores/__tests__/sync.test.ts` asserted the exact four-element array and so **pinned the
defect**; it is inverted, not deleted. A second guard in `stores/__tests__/database.test.ts`
extracts both lists from source text and asserts they are equal, so they cannot drift again —
text extraction because that file already reads `version.ts` that way, and because
`stores/version.ts` is mocked inside the sync suite, which makes importing the constant there
impossible without re-stating it.

The two lists are now identical, which raises the obvious question of why there are two. Merging
them into one shared constant is the durable answer and is deliberately **not** done here: it
moves a constant between modules for a one-key defect. The equality guard buys the same
protection at a fraction of the risk, and records the intent for whoever does merge them.

Removing the key again fails both tests.


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

### CLOSED in session 5, 1.25.95, `fix/audit-17-buffer-horizon-docs`

**Documentation only, because there is no code fix available.** Raising
`NOTIFICATION_ROLLING_DAYS` breaches the iOS 64-request ceiling, which
`shared/__tests__/constants.test.ts` now pins, and finding 12's night-row extra day is the only
real horizon improvement obtainable.

Three claims corrected. `shared/constants.ts` said the foreground gate "needs just 1 successful
run per 48h — 12 hours gives 4 attempts" and the background interval "needs 1 successful run per
48h; 6 hours gives 8 attempts". `ai/AGENTS.md` said a force-quit is "recovered by next app open
within the 2-day buffer". All three sized a cadence against a horizon that does not exist: the
window is two **list days**, so it reaches "tomorrow's last prayer" — roughly 45h after an
early-morning refresh, but about **18h** in the winter worst case, a 23:50 refresh against the
repo's own 31 December fixture of Isha 17:41.

The cadences themselves are unchanged; only the reasoning behind them is now true. At the real
floor, 6 hours gives **two** full attempts rather than eight.

Three arithmetic cases pin the horizon from the constants and the winter fixture, so the numbers
in the comments cannot drift from the numbers the code produces. Asserting the old 48-hour claim
instead fails one of them.

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

### CLOSED in session 5, 1.25.55, `fix/audit-18-version-parsing`

`toVersionParts` strips a leading `v`, coerces `undefined`/`null` to an empty string and uses
`Number.parseInt(segment, 10) || 0`, so every well-formed comparison is unchanged while the
malformed shapes stop inverting.

**Not fixed, and deliberately:** prerelease ordering. `'1.0.0-beta.1'` still parses as `1.0.0`
and therefore compares equal rather than lower. Proper semver ordering is a larger change than
this finding, and the dangerous half lives elsewhere — at `stores/version.ts:99` a shipped
`"1.25.3-hotfix"` reads as equal, so neither `clearUpgradeCache()` nor
`forceNotificationReschedule()` runs. That is closed by a version-string shape guard in the
release ritual, not by the comparator, and is recorded here rather than half-solved.

Four new cases; reverting the parse fails three of them. The fourth — the non-numeric segment
reading as zero — passes either way, since `NaN || 0` and `parseInt('x') || 0` agree; it is kept
because it states the intended reading rather than leaving it to coincidence.

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

### CLOSED in session 5, 1.25.51, `fix/audit-20-bg-interval-ceiling`

`isEnvIntervalValid` now requires `>= MIN_BG_INTERVAL_MINUTES (15)` and
`<= MAX_BG_INTERVAL_MINUTES (1440)`, both named constants rather than inline numbers so the
reason each bound exists is readable at the bound. 15 is Android WorkManager's own floor, below
which the OS silently clamps and an interval-ladder experiment measures something other than
what it set; 1440 is a day, beyond which an override is the seconds-for-minutes mistake rather
than a choice.

The bounds were chosen to break no documented workflow: 15 is the lowest rung the background-task
runbook uses, and no profile in `eas.json` sets the variable at all. A rejected value still falls
back to the safe 360 rather than failing, so the fail direction is unchanged.

Four new cases: `10800` (the literal ISSUES #8 value) and `0.001` both fall back to 360, while
`15` and `1440` are honoured. Reverting to the old `> 0` check fails exactly the two rejection
cases; the two acceptance cases pass either way, which is correct — they exist to prove the
guard did not narrow the useful range.


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

### CLOSED in session 5, 1.25.41, `fix/audit-21-ios-pending-ceiling`

Three cases in `shared/__tests__/constants.test.ts` compute the worst case from the live
constants — `(PRAYERS_ENGLISH + EXTRAS_ENGLISH) × 2 alerts × NOTIFICATION_ROLLING_DAYS` — and
assert it stays at or under 64, pin the arithmetic at `11 × 2 × 2 = 44` so a change to any input
has to be made deliberately here, and assert that three days would breach it. The constant's
JSDoc now carries the warning and the numbers at the place someone would edit it.

The 64 is re-verified rather than taken on trust: iOS keeps only the **64 soonest-firing**
pending requests per app and silently discards the remainder, which is what makes a raise
self-defeating — the dropped requests are the furthest out, exactly the extra day the raise was
meant to buy.

Confirms the finding as written: with `NOTIFICATION_ROLLING_DAYS` bumped to 3, only this new
suite fails. The other 1,055 tests pass, so the one-character "more buffer" edit really would
have shipped green.

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

### CLOSED in session 5, 1.25.42, `fix/audit-22-cache-schema-tests`

Seven cases in `stores/__tests__/version.test.ts` cover all three wipe-deciding branches directly —
missing marker, `undefined` marker, older marker, matching marker, and a read that throws — plus
the key it reads from, plus one that pins the comparison's type strictness by feeding it the
*stringified* marker and asserting it still counts as changed.

**Correction, from review:** the commit said "none of them had a test". That overstates it. The
pre-existing `handleAppUpgrade` suite already drove the matching, older and missing branches
*indirectly*. What genuinely had no coverage was the **catch** branch, the `undefined` case and
the type strictness — which is still worth closing, but is a narrower claim than the one made.

Two more in `stores/__tests__/database.test.ts` pin the round trip the finding identified as the
unstated dependency: `setItem('cache_schema_version', 1)` must read back as the **number** 1,
because `cacheSchemaChanged` compares with `!==` against a number. If that ever returned a
string the comparison would be true on every launch and the prayer cache would be wiped on every
upgrade, which is the failure the wipe exists to prevent inverted into a permanent cost. Zero is
pinned too, since `getItem`'s `value ? … : null` makes falsy round trips worth stating.

Both directions verified by breaking the function: making the missing-marker branch return
`false` fails four tests, and making the catch branch return `false` fails one.

## 23. `atomWithStorageNumber` yields NaN for a corrupt value and 0 for an empty string

**FIXED in 1.25.24** (`fix/audit-23-number-parsing`). `getItem` falls back to the initial value
for anything that is not a finite number, and logs a warning naming the key. A legitimate `0`
still reads as `0`, which is the case the fix must not break: `AlertType.Off` is zero.

Five new cases in `stores/__tests__/storage.test.ts` (22 to 27), covering a corrupt string, an
empty string, whitespace, `Infinity` and the literal `NaN`, plus one pinning the legitimate
zero. Reverting the fix fails exactly those five.

This also closes the `athanNaN.mp3` half of the finding for corrupt values, since
`preference_sound` now falls back to 0 rather than NaN. An out-of-range but well-formed index,
say 99, still yields `athan99.mp3`; that is a clamp on read rather than a parse, it lands on
the same channel path as finding 5, and it is handled there.

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

### CLOSED in session 5, 1.25.43, `fix/audit-24-schedule-rejection`

Four cases in `stores/__tests__/notifications.test.ts` reject a single identifier while the rest
of the batch schedules normally, which is the realistic shape: one bad channel or one past
trigger, not a total outage. They assert the deterministic identifier is still recorded, that
the OS notification which survived the failed replace is **not** cancelled by the sweep, that
the rest of the batch still schedules, and that a rejected reminder records its identifier too.

The catch block's reasoning is now exercised rather than merely inspected: deleting the
`survivedNotification` record and returning `null` instead fails three of the four.

**One correction to the test, not the code.** The reminder case first failed because it armed a
reminder while its at-time alert was `Off`. That is a state the app does not permit —
`setPrayerAlertType` forces the reminder off with the at-time alert — and the scheduler honours
the same rule, so nothing was scheduled to reject. The test was wrong and was changed to a valid
state; the constraint holding in the scheduling path as well as the setter is worth knowing.

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

### CLOSED in session 5, 1.25.44, `fix/audit-26-audio-matrix-guard`

New suite `shared/__tests__/audioMatrix.test.ts` (45th suite), nine cases. The expected file set
is **derived** the way the code derives it — `athan${n}.mp3` from the length of `ATHAN_AUDIOS`,
`reminder_${slug}_${interval}.mp3` from `PRAYERS_ENGLISH + EXTRAS_ENGLISH × REMINDER_INTERVALS`,
plus `EXTRAS_NOTIFICATION_SOUND` — and then asserted equal, in both directions, against all four
shipping surfaces: `assets/audio`, `app.json`'s expo-notifications `sounds[]`, `android res/raw`
and the iOS bundle. Two more assert every generated resource name and every generated reminder
channel id is a legal Android name.

`ATHAN_AUDIOS` is counted by reading `assets/audio/index.ts` as text rather than importing it,
because that module `require()`s the mp3 binaries and jest cannot parse them. This is the same
approach `athanDurations.test.ts` already uses, for the same reason.

Reminder integrity is now covered: all 67 files decode to a plausible length and carry a
non-trivial byte size, closing the gap where `athanDurations.test.ts` scanned only the 32
athans. **A file of correct length containing digital silence is still not caught** — that needs
PCM decoding — and the test says so where a reader will find it.

Both expansion routes verified to fail: adding a seventh reminder interval fails five of the
nine, and so does adding a twelfth prayer.

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

**FIXED in 1.25.28** (`fix/audit-51-day-null-date`). The `?? ''` is gone; the memo returns an
empty string when there is no date rather than handing one to date-fns. When a date exists
nothing changes, which is the whole of the one-to-one requirement here.

No component test is possible — there is no React renderer in the dependency tree, which is
lead 1 in this document. What is testable is the reason the guard exists, so
`shared/__tests__/time.test.ts` now pins that `formatDateLong('')` and `formatHijriDateLong('')`
both throw. If either is ever changed to return a placeholder, that test fails and whoever
makes the change is told the guard's premise has moved.

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

### COMPLETED in session 5, 1.25.92, `fix/audit-28-frame-audit-exit-code`

**The 1.25.14 fix corrected the units and the printed verdict, but not the exit status.** A
genuine 50 ms frame miss printed `FAIL` and the script still exited 0, because the unconditional
`exit 0` after the heredoc discarded python's status. Every caller reads `$?`, so the script was
still incapable of *returning* a failure — the same defect one layer further out, and the
sibling `device-checks.sh` already gets this right with a `FAIL` accumulator.

`sys.exit(0 if passed else 1)`, with the invocation guarded by `|| status=$?` so `set -euo
pipefail` cannot abort before the verdict is printed, and the status re-raised deliberately.

Verified synthetically in both directions by running the verdict block against generated
SurfaceFlinger timestamps: 200 frames at 16 ms exits 0 and prints PASS; the same series with one
50 ms gap exits 1 and prints FAIL.

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

### CLOSED in session 5, 1.26.15, `fix/audit-34-idle-cpu-multi-pid`

`PID=$(adb shell pidof …)` on a two-process package yielded the literal `1234512399` — both pids
concatenated. The `-n` guard passed, `/proc/1234512399/…` matched nothing, and the script printed
`median 0.0%` and **exited 0**: a confident idle measurement having sampled no process at all.

Now `PIDS=(${=...})` with one `/proc` glob per pid, the count echoed, and the python side
**failing loudly** on blank samples — naming the files, exiting 1 — instead of reaching the
arithmetic. Threads born mid-interval are counted; exited threads are counted and the figure is
declared a lower bound rather than quietly wrong.

Reproduced and verified synthetically against the shipped text of both versions, since no
multi-process window was available on the device: the bogus `0.0%` / exit 0 becomes
`MEASUREMENT FAILED` / exit 1; a healthy two-process window reads 24.8% before and after (the
first pid alone would have said 20.0%); a thread-churn window moves 13.5% → 14.0%, with
`Choreographer` appearing at 2.7% where it had been absent entirely.

**Not verified without hardware:** that `pidof` actually returns more than one pid for this
package on the 3T, and what the corrected figure is there. `e2e/baselines/android-3t.json` was
deliberately **not** updated — its recorded numbers predate the fix and re-measuring them is a
device task.

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

### CLOSED in session 5, 1.26.14, `fix/audit-36-perf-ring-epoch-axis`

**Checked before changing anything, and the finding is true.** `react-native-performance`'s
`timeOrigin` is `now()` — a **monotonic** reading, not a browser-style epoch — so
`Date.now() - epochOffset + startTime` added elapsed time twice. Confirmed independently against
the one raw capture in the repo: `home_content.ts − perf_monitor_init.ts` read 3072 for lines
1.618 s apart.

`ts` is now `epochOffset + entry.startTime`, with `epochOffset = Date.now() - now()` rather than
`timeOrigin` — the latter is the epoch of *module load* and was only ever right because the
require happened to sit next to it.

All three new cases fail when reverted: init reads `2000` against an epoch of `1789209000000`,
and the doubled deltas come out 1800 / 1352 / 3152 against the true 900 / 676 / 1576 — matching
the finding's own reproduction. The two halves are isolated: with only the `ts` fix, the
load-before-init case still fails by exactly its 5000 ms gap.

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

### CLOSED in session 5, 1.26.10, `fix/audit-38-backward-anchored-grid`

**First marked closed at 1.25.87 and it was not.** That commit changed only `app.json` and
`package.json` — two version-bump lines — and carried a verbatim copy of 1.25.86's message. The
branch had been cut from finding 37's work and never received its own change, so the cherry-pick
produced a no-op. Caught by a verification pass over this document's own ledger. Recorded here
because a false closure is worse than an open finding: the ledger said done and nobody would have
looked again.

The grid now walks **backwards** from the boundary cutoff instead of forwards from the segment
start. The remainder is unavoidable — a segment whose length is not a whole number of steps has
one oversized gap no matter how the steps are placed — so the fix is about *where* it sits.
Measured on the same fixture, the absolute error is identical and the consequence is not:

| | Worst over-read | What the widget showed |
| --- | ---: | --- |
| forwards (as shipped) | 8 min | **"14m" with 6m left** — 133% of the truth |
| backwards | 8 min | "2h 29m" with 2h21m left — 5.7% of the truth |

**The test that should have caught this was fixture-blind, in exactly the shape this session has
hit three times before.** `OCTOBER_TIMES` is 05:30, 07:10, 12:40, 15:20, 17:50, 19:40 — every
segment is a whole number of five-minute steps, so the remainder is zero everywhere and where it
would land is structurally unobservable. A `RAGGED_TIMES` fixture with deliberately
non-dividing gaps now runs through the same sweep.

The tolerance was **tightened, not loosened**, which matters given the temptation here. A single
absolute cap cannot express the finding, because the absolute error is the same either way. The
sweep now asserts one step within the final hour — where an over-read actually costs a user a
prayer — and never as much as two steps anywhere. On the unfixed grid the near-boundary
assertion fails with "over-reads by 8m within the final hour: widget 14m, truth 6m".

## 39. One native throw permanently kills the widget's per-minute re-push chain

`stores/widget.ts:241-247` and `:270`. `scheduleLabelFlipPush(...)` is the only re-arm site
and it sits after all ten `updateTimeline` calls inside the try whose catch is at `:278`. One
throw, or one momentarily empty cache, and the flip timer is never re-armed; the pending
timer fires once, re-enters the same early return, and the chain is dead for the process.
`stores/__tests__/widgetIo.test.ts:75-82` asserts only that the promise resolves.

CONFIRMED. Re-arm in a `finally`.

### CLOSED in session 5, 1.26.13, `fix/audit-39-widget-flip-rearm`

`scheduleLabelFlipPush` was the only re-arm site and sat after all ten `updateTimeline` calls,
inside the try. A fired timer clears its own slot before the push runs, so any exit that skipped
it — a native throw, or the empty-timeline early return — left no successor and the per-minute
chain was dead for the life of the process. The widget then freezes silently.

Re-armed in a `finally`, with `flipTargetEpochMs` captured **before** the native calls so a throw
still re-arms on the true cadence, and a null or past target falling back to the retry interval.

One non-obvious part worth keeping: an empty build now also drops `sequenceCache[schedule]`.
Without that the retry reuses the same empty sequence and produces the same empty build forever —
the chain would re-arm faithfully and never recover, which is a worse failure than stopping.

Three of nine cases fail with the fix reverted.

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

### CLOSED in session 5, 1.26.12, as a side effect of fixing 37 and 38

The brief recorded 40 as leave-as-is, on the reasoning that writing suites for defects nobody
had fixed was not worth it. Fixing both defects changed that, and the claim in this finding's
title is now false — verified rather than assumed, by reverting each fix in turn:

| Reverted | Suite result |
| --- | --- |
| finding 37's horizon handling | **3 failed**, 40 passed |
| finding 38's backward-anchored grid | **1 failed** (near-boundary over-read), 42 passed |

The two mechanisms are covered by different assertions, which is what makes this real rather
than incidental: 37 is caught by the blank-label and stale-flag cases, 38 by the over-read sweep
running over a fixture whose segments deliberately do **not** divide by the step. That fixture is
the whole point — the pre-existing sweep had run only against step-aligned times, where finding
38 is structurally unobservable, which is exactly why the finding could be marked closed at
1.25.87 against an empty commit and nobody noticed.

No code change; this is a status correction backed by the two reverts.

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

### CLOSED in session 5, 1.25.49, `fix/audit-44-magrib-midnight-crossing`

Three changes in `shared/prayer.ts`, each independently proven by reverting it alone:

1. `adjustPrayerDateForMidnightCrossing` now admits Magrib alongside Isha, so a post-midnight
   Magrib's **instant** moves to the next calendar day. Closes the 23h56m-early alarm.
2. `getNightTimesForDay` anchors the night at the day the Magrib really falls on rather than the
   date it is filed under. Closes the ~26-hour night that threw Islamic Midnight and Last Third
   past noon.
3. `calculateBelongsToDate` now admits Magrib alongside Isha, so the **row** stays on its own
   list day.

**The third was a bug in the first two, caught by self-review rather than by the suite.** Change
1 moved Magrib's `datetime` *and*, through `createPrayer`, its `belongsToDate`. Probed on the
Reykjavik fixture, 21 June's Magrib came back with `belongsToDate: 2026-06-22` while Isha
correctly kept `2026-06-21`. The rendered list filters on `belongsToDate`, so 21 June would have
shown **no Magrib at all** and 22 June two. The existing Isha clause in `calculateBelongsToDate`
exists precisely to undo the shift its counterpart applies; Magrib needed the same pairing. All
1,085 tests passed while that regression was present, which is why it is worth recording how it
was found.

**Correction: Istijaba needs no fix, contrary to the finding.** It is derived as
`adjustTime(magrib, -60)` on the day's own record and is not re-dated, so with Magrib at 00:04 on
D+1 it lands at 23:04 on D — exactly 60 minutes earlier, which is right. A test pins the
60-minute gap rather than either literal, so it holds at any latitude.

**Why the 06:00 cutoff is safe for Magrib.** A record whose Magrib is genuinely in the small
hours of its *own* date would need Dhuhr and Asr after it, which contradicts the ordering every
provider emits. So a small-hours Magrib always means the next day.

**Unchanged for London**, which was the requirement: the whole suite passed before the new tests
were added, and an explicit London case pins a 19:25 Magrib on its own date.

### Follow-up in 1.25.53, `fix/audit-44-followup-istijaba-instant`, after independent review

An independent reviewer was asked to attack the fix from a different angle. It confirmed the
cutoff, London's one-to-one behaviour and the `belongsToDate` pairing, and found **one real
regression the tests were arranged not to see**.

**In plain terms, because this section was misread once (owner, 2026-09-13).** The bug is not
about noon and it is not a new rule about when to subtract an hour. Istijaba has always been
"one hour before Magrib" and still is. What changed is *what it subtracts from*.

It used to subtract from Magrib's **clock reading** — the text `"01:47"` — which is arithmetic
that wraps at midnight and carries no date. So when the Magrib fix moved Magrib's real moment
onto the next day, Istijaba stayed behind on the old one: still reading 00:47, but 00:47 of the
wrong day, which is 25 hours before Magrib instead of one. It now subtracts from Magrib's
**instant** — an actual timestamp — so the date comes along for free and the gap is one hour by
construction, whatever the clock says.

Nothing about it triggers at 12:00. The only "after 12" rule anywhere near this is a separate
one for Suhoor (finding 65), and it is a different function.

**Istijaba fired 25 hours early whenever Magrib fell between 01:00 and 06:00.** Istijaba is
`adjustTime(magrib, -60)`, modular clock arithmetic on a string. Below 01:00 the wrap past
midnight cancelled the new date shift, which is why the original test — a single fixture at
`00:08` — passed. Above it there is no wrap: Magrib 01:47 (Nome, Alaska, 21 June) gave Istijaba
00:47 still filed under the old date while Magrib moved to the next.

| Magrib | gap before follow-up | after |
| --- | ---: | ---: |
| 00:04 | 60 min | 60 min |
| 00:47 | 60 min | 60 min |
| 01:47 | **1500 min** | 60 min |
| 02:50 | **1500 min** | 60 min |
| 19:25 (London) | 60 min | 60 min |

It was also a *relative* regression: before the fix both Magrib and Istijaba were wrong by a day
but mutually consistent, so the gap stayed 60 minutes. Fixing Magrib alone broke the pair.

Istijaba now takes an exact instant, `Magrib instant − 60 min`, joining Midnight and Last Third
on the path that already exists for precisely this reason. The rule stated plainly: **Suhoor's
anchor is Fajr, which is never date-shifted, so the wrap rule tracks it; Istijaba's anchor is
Magrib, which now is, so the wrap rule cannot.** The test is table-driven over the whole window
because one fixture is what hid it.

Also in the follow-up:
- `MIDNIGHT_CROSSING_PRAYERS` in `shared/constants.ts` is read by both halves of the matched
  pair, which previously spelled the same test two different ways a hundred lines apart — the
  half that was not touched was the half that needed touching.
- `isAfterMidnight` renamed `isSmallHours`, because its comment claimed a day-shift meaning that
  is false for Suhoor, Fajr, Sunrise and Duha — all routinely below six, all on their own day.
- The `POLAR` fixture had Isha 24 minutes *before* its own Magrib, which no calculation method
  produces and which violates the Standard chronological-equals-canonical invariant. Corrected.
- New cases: agreement between `getPrayerForDate` — what notifications actually read — and the
  rendered list, and a season-transition case across `23:58 → 00:02`.
- The London range in the comment is corrected to 15:55–21:25, the range the repo's own
  `mocks/full.ts` demonstrates.

**Deliberately not done, recorded rather than left silent:** the finding also asked for a guard
against a night longer than about 20 hours. The anchor is now correct, so a length guard would
only bound damage that can no longer occur, and it would need a policy for what to do when it
trips. Skipped on purpose.

**Also recorded, pre-existing and untouched:** `stores/schedule.ts:82-92`
(`getYesterdayFinalPrayer`) calls `createPrayer` directly with the raw date and time, bypassing
`adjustPrayerDateForMidnightCrossing` entirely, so it already mis-dates a post-midnight Isha.
Magrib never reaches it, so this change does not worsen it. Worth folding into
`MIDNIGHT_CROSSING_PRAYERS` whenever that site is next touched.

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

### CLOSED in session 5, 1.25.48, `fix/audit-46-timezone-oracles`

Four real sites now read `PRAYER_TIMEZONE`: the `londonDate` helper in `time.test.ts`,
`prayer.test.ts` and `notifications.test.ts`, plus the bare `Intl.DateTimeFormat` reference at
`time.test.ts:564`. The helper is renamed `prayerZoneDate` across all sixteen call sites, because
a helper called `londonDate` that no longer means London is a worse oracle than a literal. They
still use `date-fns-tz` and `Intl` directly rather than the app's helpers, so they remain
independent implementations — only the zone they are asked about is now shared.

**Correction to the finding.** It names five sites; there are four.
`widgetTimeline.test.ts:426` is a section comment (`// DST TRANSITIONS (Europe/London)`), not a
pin, and nothing there passes a zone name.

**And a correction to what this is worth, measured rather than asserted.** Flipping
`PRAYER_TIMEZONE` to `Asia/Tokyo` and running the whole suite:

| | Suites failing | Tests failing |
| --- | ---: | ---: |
| before | 7 | 67 |
| after | 5 | 62 |

So parameterising removes five false alarms and two whole suites' worth, and that is all. It
does **not** make the suite timezone-portable: 62 tests still fail, because they assert London's
actual clock values and London's DST rule, not merely its name. The value delivered is narrower
than "the oracles follow the app" implies — it removes the class where the fixture and the app
disagree about *which zone they mean*, leaving failures that are honest signals that a test needs
re-authoring. `nightTimes.test.ts` remains the big one and stays deferred to v2.0 as the finding
recommends.

## 47. High latitude: no polar-day handling, and a missing Sunrise crashes

Covered mechanically by finding 8. At high latitude in polar day or night, providers commonly
emit `"-----"`, `null`, or omit Sunrise entirely. `shared/prayer.ts:324-325` calls `.split`
on it, and `transformApiData` reaches it even earlier through
`duha: adjustTime(times.sunrise, 20)`. The result is the error screen rather than a wrong
time, which is the safer direction, but it is a hard break for any city above about 60N.

CONFIRMED.

---

# Research: Android notification channel limits, and why the app cannot overwrite a channel

Asked by the owner in session 5: the app can reach 99 channels if a user exercises every
sound, so what is the limit, does it differ per Android version and OEM, and would overwriting
one channel be better than creating many? Answered from AOSP source rather than from memory or
blog posts, because the blog answers disagree with each other. Read via WebSearch/WebFetch and
`curl` of the AOSP mirror, `tinyfish` and `docs-mcp-server` being opencode-only.

**Owner ruling, 2026-09-12, on reading this: no change.** *"If the channel doesn't need to be
overridden, if the limit is very high, then there's no problem at all, we shouldn't bother
overriding it, because the current solution already works, so we don't want to break something
that already works."* Recorded here so it is not re-litigated.

## What the app can reach

32 athan sounds, 11 prayers × 6 reminder intervals = 66 reminder channels, plus the one fixed
`extras_at_time`. **99 is the ceiling**, and only for a user who has at some point selected
every athan and armed every prayer at every interval. Channels are never deleted, so the count
is cumulative over the install's life rather than a snapshot of current settings.

## The limit, by Android version

`services/core/java/com/android/server/notification/PreferencesHelper.java`, except Android 9
where channel storage still lived in `RankingHelper.java`:

| Android | Constant | Limit |
| --- | --- | --- |
| 9 (Pie) | no such constant, and no count guard anywhere in `RankingHelper.java` | none |
| 10 | no such constant, and no count guard | none |
| 11, 12, 13 | `NOTIFICATION_CHANNEL_COUNT_LIMIT` | **50,000** |
| 14, 15, master | `NOTIFICATION_CHANNEL_COUNT_LIMIT` | **5,000** |

Groups are capped separately at `NOTIFICATION_CHANNEL_GROUP_COUNT_LIMIT = 6000`; this app
creates no groups. Over the limit, `createNotificationChannel` throws
`IllegalStateException("Limit exceed; cannot create more channels")` — it is a crash, not a
silent drop, so it could never hide. The restore path instead logs
`Slog.w(TAG, "Skipping further channels for " + r.pkg)` and drops the excess.

So the strictest limit any of the named test devices can impose is 5,000, on the Galaxy S23
once it is on Android 14 or 15. **99 of 5,000 is 2%.** The OnePlus 3T, 5T and 8 are on 9, 10
and 13 respectively, which are unlimited, unlimited and 50,000. This is not a per-OEM number:
it is an AOSP framework constant, and OxygenOS and One UI would have to patch the framework to
change it, which neither is known to do. There is no headroom problem at any version.

The only real cost of many channels is cosmetic: they all appear in the app's notification
settings screen, and Google's own docs note that *"the notification settings screen displays
the number of deleted channels, as a spam prevention mechanism."*

## Why overwriting a channel is not an option

This is the part worth keeping, because it explains the `_v2` suffix and the bug the owner
remembers hitting. It is Android behaviour, not an expo-notifications bug.

**1. The sound is immutable after creation.** `NotificationChannel.setSound`'s own javadoc:
*"Only modifiable before the channel is submitted to
`NotificationManager#createNotificationChannel(NotificationChannel)`."* The same sentence is on
`setImportance`.

**2. Re-creating an existing channel changes almost nothing.** `PreferencesHelper`'s
existing-channel branch updates only the name, the description, `blockable`, the group if the
channel had none, the importance **downward only and only while `getUserLockedFields() == 0`**,
and `bypassDnd` for apps with DND access. It never touches the sound. Google's docs put the
same thing plainly: *"Recreating an existing notification channel with its original values
performs no operation."*

**3. Delete-then-recreate does not escape it, and this is the trap.**
`deleteNotificationChannelLocked` does not remove the record — it sets a tombstone
(`setDeleted(true)` plus `setDeletedTimeMs`). A later create with the same id lands on
`if (existing.isDeleted()) { existing.setDeleted(false); … }`, which **resurrects the old
record with its old sound**. Tombstones are kept for
`NOTIFICATION_CHANNEL_DELETION_RETENTION_DAYS = 30` and are only dropped when the policy XML is
re-parsed. So "delete the channel and make a new one with the new sound" silently keeps the old
sound for up to 30 days, and then appears to start working — which is exactly the shape of an
intermittent bug that resists testing. **One channel id per sound is not a workaround. It is
the only mechanism Android provides.**

## Checked and cleared while here

`setSound`'s javadoc warns against `SCHEME_ANDROID_RESOURCE` URIs because *"resource ids can
change on app upgrade"*, and this app's channels all carry
`android.resource://com.mugtaba.athan/raw/athanN`. It is not a problem: the URIs are the
name-based form, not the numeric-id form, and `getCanonicalizedSoundUri` in master has an
explicit `SCHEME_ANDROID_RESOURCE` branch that resolves the resource and returns the URI
verbatim, while `restoreSoundUri` defers to package-install time when the app is not yet
present. Recorded as checked rather than as a finding. Tier 6 item c's warning stands
unchanged and for a different reason: `shrinkResources` would delete the raw resources that
`getIdentifier` looks up at runtime.

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
| i | `eas.json` hardcodes an absolute `/Users/muji` path for the Play service-account key | `eas.json:26` | Change the line, do not rewrite history. Full reasoning below the table. |
| j | `preview` has no `autoIncrement` under `appVersionSource: "remote"` | `eas.json:12-14` | Two consecutive preview builds carry the same build number, and the store rejects the duplicate. Combined with finding 1, testers are never told. |
| k | Local release builds always emit `versionCode 1` | `android/app/build.gradle:95` | `app.json` declares no `android.versionCode` and `appVersionSource: remote` covers EAS only, so a local release APK cannot install over a Play build. |
| l | `plugins/removeUnusedAndroidPermissions.js` is a no-op and a loaded gun | `plugins/removeUnusedAndroidPermissions.js:3` | It targets only `SYSTEM_ALERT_WINDOW`, which is declared only in debug source sets, and `withAndroidManifest` writes only `main`. It removes nothing. It is a name-matched blacklist with no allowlist guard, sitting after `expo-notifications` in the plugin list. |
| m | `app.config.ts` documents an `eas.json` mechanism that does not exist | `app.config.ts:6-7` | It claims campaign builds set `EXPO_ANDROID_SUFFIX` in the eas.json profile env. No profile has an `env` key. |
| n | The widgets flag can half-ship, and the lockstep test cannot catch it | `app.config.ts:21`, `shared/flags.ts:36` | One is read at prebuild, the other at bundle time. `flags.test.ts` runs both in one jest process, proving they agree on a value rather than that two build steps saw the same value. The e2e README already documents the Metro env-blindness that breaks it. |
| o | Nothing enforces that the three version strings stay in step | `package.json`, `app.json`, `android/app/build.gradle` | They agree today. The app reads only `app.json`. Bumping `package.json` and forgetting `app.json` makes `wasAppUpgraded()` false, so the forced reschedule never runs. One jest assertion closes it. |
| p | `frame-audit.sh` writes evidence into the working tree, untracked and unignored | `e2e/scripts/frame-audit.sh:28` | `e2e/evidence/` with an mp4, per-frame PNGs and a contact sheet. Sibling scripts use `mktemp -d`. |
| q | `frame-audit.sh` raises IndexError in exactly the failure case it documents | `e2e/scripts/frame-audit.sh:74-85` | The documented video-capture wedge produces frames without matching pts, and `set -euo pipefail` then aborts before the vision prompt is written. |
| r | The attached device is three versions behind HEAD | 3T `8f7ada76` has 1.25.0 | Any `yarn check:device` or baseline comparison run today measures a stale build. Worth a pre-flight assertion in the tooling. |
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
`"serviceAccountKeyPath": "/Users/muji/.config/athan/athan-<project>-<12 hex>.json"`. Google's
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
  --roots /Users/muji/repos/rn.athan.uk \
  --roots <scratchpad> \
  --modulePaths /Users/muji/repos/rn.athan.uk/node_modules \
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

---

# Session 4, part 1: what was taken and what was deferred

Session 4 ran on 2026-09-12 at Opus 5, starting from 1.25.6 and closing at **1.25.30**. Twenty
four version-bumped commits, each on its own branch off `uat-2` and merged back with `--no-ff`,
pushed as it went. The suite moved **1015 to 1035 tests, 42 to 43 suites, and never went down**.
The session did not finish the document; what is left is listed below and is the next session's
work.

## Closed, with code

| # | Branch | Version | Device-verified |
| --- | --- | --- | --- |
| 32 | `fix/audit-32-package-exact-match` | 1.25.7 | live dump |
| 30 | `fix/audit-30-restated-alarm` | 1.25.8 | live dump |
| 58 | `fix/audit-58-same-instant-sort` | 1.25.9 | live dump |
| 31 | `fix/audit-31-reminder-offsets` | 1.25.10 | live dump |
| 29 | `fix/audit-29-permission-grant` | 1.25.12 | live run |
| 33 | `fix/audit-33-failed-flow` | 1.25.13 | stubbed adb/maestro |
| 28 | `fix/audit-28-sf-units` | 1.25.14 | synthetic + 3 live runs |
| 35 | `fix/audit-35-unperformed-pass` | 1.25.16 | live run |
| 2 | `fix/audit-2-reset-stored-atom` | 1.25.18 | see the correction |
| 4 | `fix/audit-4-migration-through-atoms` | 1.25.23 | unit |
| 23 | `fix/audit-23-number-parsing` | 1.25.24 | unit |
| 3 | `fix/audit-3-extras-mismap` | 1.25.25 | unit |
| 7 | `fix/audit-7-display-date-guard` | 1.25.27 | unit |
| 51 | `fix/audit-51-day-null-date` | 1.25.28 | unit |
| 6 | **withdrawn by owner**, see below | 1.25.29, reverted 1.25.33 | error screen driven on the 3T |
| 59 | `fix/audit-59-cold-launch-rearm` | 1.25.30 | **yes, on the 3T** |
| 60 | `fix/audit-60-metro-comment-2` | 1.25.22 | n/a, comment |
| 61 | `fix/audit-61-lintstaged-unmatched` | 1.25.21 | reproduced |

Four further commits are analysis rather than fixes: the simultaneous-alert answer (1.25.11),
the SF-latency baseline re-verification (1.25.15), the finding 2 correction (1.25.19) and the
finding 3 population correction (1.25.26).

## Found in session 4, not in the session-3 sweep

- **58**, the alarm parser crashing when two alerts share a minute. Fixed.
- **59**, an Android force-stop disarming every alert with the 12-hour gate blocking recovery.
  **Live in production 1.5.2.** Fixed and device-verified.
- **60**, a load-bearing metro transform labelled a throwaway experiment. Fixed.
- **61**, the pre-commit hook rejecting any change to `metro.config.js` or `jest.config.js`,
  forcing `--no-verify` and skipping the whole gate. Fixed.

## Corrections to the session-3 document

**Finding 2 was wrong about Release builds**, and the correction matters more than the finding
did. It was marked `CONFIRMED [test]`, and the test was right about jest while being wrong
about the shipped bundle: `metro.config.js` sets `inlineRequires: true`, so module evaluation
order differs between the two. Measured on the device, `stores/notifications.ts` evaluates 5 ms
**after** `handleAppUpgrade` removes the gate key, so the atom seeds from an absent key and the
old code worked. Re-ranked Tier 1 to Tier 2.

**The general lesson, for every remaining finding: `[test]` is not proof.** The session-3 suite
ran against an eager module graph. Any finding whose mechanism depends on *when* a module first
evaluates has to be checked on the device, not in jest. Finding 4 was re-checked under this
light and stands, because its moving parts are in one file and no bundler setting can reorder
them.

**Finding 3's population was corrected twice**, ending at: the legacy branch reaches anyone who
has not opened the app since 2026-01-17, because `app_installed_version` moves only on launch
and an auto-update never touches it.

## Measured on the device

`sched_refreshNotifications`, the reschedule that finding 59's cold-launch re-arm triggers, on
the OnePlus 3T across four cold launches: **47, 55, 52, 50 ms**. Same capture, `js_to_content`
746 ms and `launch_js_bundle` 161 ms, so the reschedule is under 7% of the JS-to-content window
and runs 1500 ms after it. Measured with one alert enabled, which is this device's
configuration, not the 44-notification worst case. The 128 ms figure quoted from `8630f75` is a
different configuration and should not be compared directly.

## Finding 25 reproduced by accident, which is worth recording

Taking that measurement needed an `EXPO_PUBLIC_PERF_MONITOR=1` build, which runs the mock API.
Installing a prod build at the **same version string** afterwards left the fabricated rows in
place exactly as finding 25 describes: `wasAppUpgraded()` was false, so no wipe ran, and the
app displayed Fajr 16:34, Sunrise 16:35, Dhuhr 16:36 — the launch-relative mock signature. Note
that bumping the version would not have helped either, because post-#34 an upgrade only wipes
when `cacheSchemaChanged()`. The only recovery without root was `adb shell pm clear`, which
also destroys the user's alert preferences and needs them re-entered by hand.

**Rule for the next session: never build with `EXPO_PUBLIC_PERF_MONITOR=1` on the owner's
device without planning the `pm clear` and the preference restore that follow it.**

## Deferred, and why

Nothing was deferred on judgement. The session ran out of time, not out of willingness. What
remains is listed in the next-session prompt at `ai/prompts/audit-changes-2.md`, in the order
the original brief set out.

## Two owner rulings at the close, both carried into the next prompt

**Finding 6 is withdrawn.** The error screen keeps one Refresh button and that button clears
the cache. Reverted in 1.25.33 with the markup and styles byte-identical to where the session
found them, and verified end to end on the 3T: offline with no cache gives the error screen,
Refresh clears, reloads, refetches, and the real London times come back.

**Every visual stays exactly as it is.** No new buttons, no new copy, no layout or colour
changes in any fix. If a finding appears to need one, stop and ask. The four accessibility
items in Tier 6 are still fair game, because roles, labels and states move no pixels.

**The Android notification channels need extreme care**, which governs finding 5, the next
step. Channel ids are immutable once created and a channel's sound cannot be changed after
creation, which is why `deleteLegacyAndroidAudioChannels` and the `_v2` suffix exist, and
Android silently drops anything posted to a channel that does not exist. Any change there has
to be shown 1:1 on ids, sounds and importance, before and after, on the device.

The one item genuinely awaiting a decision rather than work: **finding 6's escape hatch.** The
owner's position is that reaching the error screen means something has gone wrong, so wiping
and refetching is the right recovery. Tracing the paths showed that is true for a corrupt cache
and false for a failed fetch, which is the common case — on 1 January, offline, with the whole
year valid on disk, `initializeAppState` still awaits the previous year's 31 December fetch and
rejects. The wipe is therefore harmful when there is a cache and pointless when there is not.
Finding 8 closes the corrupt-cache path at source by validating the response before it is
cached. If an explicit escape hatch is still wanted after that, it should be a second, clearly
labelled destructive button rather than the only button the screen has.

---

# Session 5: what was taken, what was corrected, what is left

Session 5 ran on 2026-09-12 at Opus 5, starting from **1.25.34** and closing at **1.25.92** —
113 commits, each on its own branch off `uat-2`, merged `--no-ff` and pushed. The suite moved
**1,036 to 1,194 tests and 43 to 50 suites, and never went down.** The OnePlus 3T ended the
session green on `yarn check:device`, on the two channels and the one armed alarm it started
with.

Roughly half the work was done by parallel agents in git worktrees; the merges, the conflict
resolution and the device verification were done here. Individual findings above carry their own
`CLOSED` sections where the reasoning is worth keeping; this table is the index.

## Closed with code

| # | Version | What changed |
| --- | --- | --- |
| 5 | 1.25.35 | The selected athan channel is created at schedule time |
| 8, 47 | 1.25.37, 59 | An unreadable API day is dropped rather than cached or fatal |
| 10 | 1.25.39 | `AlertType`'s persisted integers pinned as a storage contract |
| 11 | 1.25.40 | The notifications mock echoes the identifier the SDK echoes |
| 12 | 1.25.85 | Night rows get the buffer every other row already had |
| 13 | 1.25.54 | A mid-window time correction reaches the store |
| 14 | 1.25.52 | The cache schema marker survives a full refresh |
| 15 | 1.25.84 | The AppState listener is armed at mount, not 1500 ms later |
| 16 | 1.25.82 | The warm cache hydrates on an ordinary update |
| 18 | 1.25.55 | A `v` prefix no longer inverts `compareVersions` |
| 19 | 1.25.90 | A release stops presenting another release's notes |
| 20 | 1.25.51, 61 | The background interval is bounded and integer-only |
| 21 | 1.25.41 | The rolling buffer is guarded against the iOS 64-request ceiling |
| 22 | 1.25.42 | `cacheSchemaChanged`, the sole gate on the wipe, is covered |
| 24 | 1.25.43 | The scheduling failure path is exercised for the first time |
| 25 | 1.25.83 | Mock-data builds get their own MMKV store |
| 26 | 1.25.44, 61 | The 99-file audio matrix is closed across every surface |
| 27 | 1.25.81 | A corrected time replaces the stale copy on merge |
| 28 | 1.25.92 | The frame audit returns a failure instead of only printing one |
| 37 | 1.25.86 | The widget countdown stops freezing beyond 24 hours |
| 38 | 1.26.10 | The step grid anchors backwards, so the remainder lands where it is invisible. **First marked closed at 1.25.87 in error — that commit was empty.** |
| 44 | 1.25.49, 53 | Magrib crosses midnight, and Istijaba follows it |
| 46 | 1.25.48 | The timezone oracles key off `PRAYER_TIMEZONE` |
| 48 | 1.25.80 | The extras alert resolves its preference by name, not row order |
| 49 | 1.25.79 | The athan rolls back when its reschedule throws |
| 50 | 1.25.78 | A denied permission no longer shows a selection that will not save |
| 52 | 1.25.64 | The pre-commit gate is something a fresh clone actually receives |
| 53 | 1.25.62 | `pino` is declared where it is used |
| 54 | 1.25.76 | Four debug variables cannot change a production build |
| 55 | 1.25.63 | The suite runs with the widgets flag off, as it ships |
| 56 | 1.25.75 | The production logging guarantee is pinned |
| 62 | 1.25.91 | A bailed reschedule retries when data lands |

Tier 6 closed: **a** (1.25.67), **b** (1.25.65), **e** (1.25.72), **g** (1.25.69), **h**
(1.25.70), **t** (1.25.58), **u** (1.25.71), **v** (1.25.68), **w** (1.25.73), **y** (1.25.66),
**aa** (1.25.77), plus **d** (1.26.3), **f** (1.26.4), **i** (1.26.2), **j** (1.25.98), **k**
(1.25.99), **l** (1.26.0), **m** (1.25.97), **o** (1.26.5), **r** (1.26.7), **s** (1.26.6) and
**z** (1.26.1).

Accessibility: item 1, the alert bell (1.25.88); item 2, the overlay catchers and the
explanation live region (1.25.89); item 3, the sheet controls and the modal (1.26.11). Item 4,
`allowFontScaling: false`, is a recorded decision rather than a defect and stays as it is.
**An earlier version of this record claimed all four were closed at 1.25.88 and 1.25.89. Two
were.** Item 3 was assigned to an agent that produced nothing, and nothing checked.

## Found in session 5, not in the sweep

- **62**, an armed alert with no alarm, seen once on the device. Recorded unresolved in 1.25.46,
  mechanism found by review and fixed in 1.25.91. The failure itself was never reproduced.
- **The jest gate could not survive parallel worktrees.** Agent worktrees live under
  `.claude/worktrees/` inside the repo, so jest discovered every worktree's copy of the suite —
  498 suites where there are 45 — and a half-finished branch in any of them failed the main
  tree's validate. Fixed across 1.25.56, 57 and 60; the patterns must stay `<rootDir>`-anchored,
  because a bare `/.claude/` also matches a worktree's own path and leaves agents unable to run
  the gate at all.

## Corrections, and the lesson behind them

**Three of this session's own fixes were wrong, and only one was caught by its own tests.**

1. **Finding 44 moved Magrib to the wrong list day.** Caught by self-review before merge. All
   1,085 tests passed while the regression was live.
2. **Finding 44's fix broke Istijaba**, firing it 25 hours early for Magrib between 01:00 and
   06:00. Caught by an independent reviewer. The single test fixture at 00:08 sat in the one
   sub-window where the clock-wrap cancelled the date shift.
3. **Finding 8's guard rejected an entire year** for one unreadable day, and the cache is wiped
   before the fetch — a permanent brick, and it would have made high-latitude cities permanently
   unusable. Caught by an independent reviewer. All six rejection tests used a single-day
   payload, and with one day in the payload "drop the day" and "reject the year" are
   indistinguishable.

The shared shape is worth stating plainly, because it is the same one every time: **the fixture
was chosen so the bug could not be observed.** Not a missing test — a present, passing test whose
inputs sat exactly where two errors cancelled, or where the blast radius had no room to appear.
Tests written by whoever wrote the fix inherit the author's blind spot. The one defence that
worked was an independent reviewer given the specific instruction to attack the fixtures.

Smaller corrections, each recorded on its finding: finding 10's "the full suite stays green" was
false; finding 46's benefit is 5 false alarms, not portability; finding 5's symptom is expo's
fallback channel and a generic ding, not a dropped notification; finding 22's "none of them had
a test" overstated it; finding 20's floor comment credited a WorkManager limit that does not
apply on the shipped path; finding 46 names five sites and there are four.

## Left open

| # | Why |
| --- | --- |
| 9 | Needs an `env` block in `eas.json` plus a config-time failure. Not started. |
| 17 | Documentation only; the horizon claim is still wrong in three places. |
| 34, 36 | The agent hit the session limit mid-task. |
| 39, 41 | Widget re-push chain and `belongsToDate` contract. Not started. |
| 40, 42, 43, 57 | Recorded by the brief as leave-as-is. 40 may now be closed as a side effect of 37 and 38 — unverified. |
| 45 | Withdrawn by owner ruling. |
| Tier 6 c, d, f, i, j, k, l, m, n, o, r, s, x, z | Not started. **x** (`noUncheckedIndexedAccess`) was probed and left for the owner: the error count is the decision. |

## Two things the owner has to decide

**~~What's New now silent-ships.~~ RULED, 2026-09-13.** The owner's decision: *"the content of
What's New should never change… you should update the What's New version and the 3 items inside,
also update their version so that we can keep showing them, because we have not yet released to
the store."*

So the three items stay exactly as they are and their stamp moves with every version bump.
Finding 19's guard is kept — it is still the correct fix, and with the stamps in step it presents
the modal rather than suppressing it. Both halves now hold: the modal shows while unreleased, and
a release that forgets to move the stamp silent-ships rather than heading someone else's notes
with the current version.

**Deliberately NOT enforced by a test**, on the owner's second ruling the same day: *"I decide
what goes in the popup modal, and sometimes we release an update which shouldn't need a popup
modal, because it's just performance improvements — nothing worthy of telling the user and
annoying them."* A test asserting the stamp tracks `app.json` would fail every time that choice
is made, which is the fastest way to get a guard deleted. One was written and removed the same
session; do not re-add it.

The rule lives where someone editing the content will see it, as a comment above `WHATS_NEW`
itself. Moving the stamp shows the modal; leaving it behind silent-ships. Both are correct.

**~~Silent alerts may ring on Android.~~ REFUTED on the device — see finding 63 below. No change
needed, and none should be made.**


---

## 63. REFUTED: Silent alerts do not ring, despite landing on expo's fallback channel

Raised by review of 1.25.35, and it was a good hypothesis. `atTimeAndroidChannelId` returns
`undefined` for anything that is not `AlertType.Sound`, so a Silent alert is posted with no
channel — and finding 5 established on this very device that expo-notifications 57 substitutes
`expo_notifications_fallback_notification_channel`, whose sound is
`content://settings/system/notification_sound`. On Android 8 and above the channel governs
alerting, so the reasoning predicts a user who chose Silent for Fajr getting the phone's default
ding at 4 am. That would be a silent-alarm-class defect in the other direction.

**Driven on the 3T at 1.25.91, it does not happen.** Twice, with a control:

| Alert | Posted channel | Vibration | AudioTrack |
| --- | --- | --- | --- |
| Fajr, Silent | `expo_notifications_fallback_notification_channel` | none | none |
| Dhuhr, Silent (fresh key) | `expo_notifications_fallback_notification_channel` | none | none |
| Asr, **Sound** (control) | `athan_1_v2` | `[0, 250, 250, 250]` | 44100 Hz mono = `athan1.mp3` |

The second run used a notification key never posted before, because Android silences a re-post of
an existing key and that alone could have produced a false negative. The control ran in the same
session through the same logcat capture, so "no AudioTrack" is an absence of the event rather
than an absence of measurement. Note the posted notification carries `groupKey=silent`, which is
expo's own marker for this path.

**Do not "fix" this.** The owner's ruling on the channels is explicit — they are fragile and any
change must be shown 1:1 before it lands. Adding a dedicated silent channel would create a new
channel id on every install to solve a problem that does not exist, and channel ids are immutable
once created.

What is worth recording is the **side effect**: exercising a Silent alert once creates
`expo_notifications_fallback_notification_channel` permanently, and it then shows in the app's
notification settings alongside the athan channels. Cosmetic, not removable by the app, and
present on the 3T from this session's testing.
---

## 64. UNRESOLVED: athan15 may already be past the iOS 30-second cliff

Surfaced while closing Tier 6 item d, which asked for a `< 30.0` guard on the athan durations.
The guard landed (1.26.3), but the work turned up something the item did not anticipate:
**the three available measures of `athan15.mp3` disagree across exactly the boundary that
matters.**

| Measure | athan15 | Verdict against iOS's 30 s limit |
| --- | ---: | --- |
| `ffprobe`, gapless-aware | 29.974966 s | under, by 25 ms |
| `mp3-duration` (the repo's decoder) | ~30.03 s | over — but it counts the Xing header frame, over-reporting every file by 52–76 ms |
| Apple's own `afinfo`, `kAudioFilePropertyEstimatedDuration` | **30.014694 s** | **over, by 15 ms** |

iOS silently falls back to the device's default notification sound for any notification sound
longer than 30 seconds. **If CoreAudio uses the same estimate `afinfo` reports — decoded packets
before the gapless trim is applied — then athan15 is already falling back today**, and a user
who selected it hears the system tone instead of the athan. That is exactly the failure class
finding 5 was about, arriving by a completely different route.

Three others sit within 60 ms of the cliff on the gapless-aware measure: athan17 (29.951451),
athan7 and athan16 (29.942109).

**Why this is recorded rather than fixed.** Which measure iOS applies cannot be settled from the
files: it needs an iPhone with athan15 selected, a fired notification, and an ear or a capture to
say whether the athan or the system tone played. The iPhone XS is deliberately disconnected this
session, and re-encoding on a guess would change an audio asset the owner has settled — forbidden
without asking, and pointless if the premise is wrong.

**Note the instrument trap, because it nearly became this session's fourth fixture bug.** The
brief said to extend `mp3-duration`, whose error is 52–76 ms — three times the 25 ms margin under
test. A literal `< 30.0` on its output fails four files that are comfortably under, and the
tempting repair is to loosen the threshold until it passes. The guard instead reads the LAME
gapless tag and subtracts it, which agrees with `ffprobe` to within 0.49 ms across all 32 files.
**When the instrument's error exceeds the margin, the instrument is the finding.**

### RESOLVED by the owner's device test, 2026-09-13. No action needed.

**The owner built to their own iPhone with athan15 selected and heard the athan play.** So iOS
does **not** use the `kAudioFilePropertyEstimatedDuration` figure `afinfo` reports — it applies
the gapless trim, and `ffprobe`'s 29.975 s is the number that counts. athan15 is under the cliff
and nothing is falling back.

That also settles the measure for anyone who re-encodes later: **`ffprobe` is the instrument, not
`afinfo` and not `mp3-duration`.** The guard added in 1.26.3 already reads the LAME gapless tag
and agrees with `ffprobe` to within 0.49 ms, so it is measuring the right thing.

**A full sweep of all 99 shipped files, both ways:**

| | `ffprobe` (gapless, what iOS uses) | `afinfo` (estimate) |
| --- | ---: | ---: |
| files at or over 30 s | **0** | 1 (athan15, 30.015) |
| longest athan | athan15, 29.975 | 30.015 |
| longest reminder | `reminder.mp3`, 22.785 | 22.824 |

Four athans sit within 60 ms of the cliff — athan15, 17, 16 and 7 — so the guard stays worth
having for a future re-encode. **All 67 reminder files have more than seven seconds of headroom**
and are not a risk at all.

Superseded: UNRESOLVED, pending one iPhone test.

---

## 65. The mutation sweep, and the one real hole it found

Written after the owner asked why the suite let three of my own fixes ship broken. Coverage was
already high and every suite was green, so the honest answer needed an instrument that does not
care about either: **break the code on purpose, one small semantic change at a time, and see
whether anything goes red.** A mutant that survives is a place the suite cannot see.

Fifteen mutations across the eight files the audit touched most. **Thirteen killed, one no-op
control survived as designed, one real survivor.**

| Mutation | File | Result |
| --- | --- | --- |
| small-hours cutoff `<` → `<=` | `shared/prayer.ts` | killed |
| drop Magrib from the date shift | `shared/prayer.ts` | killed |
| Istijaba offset off by 1 ms/min | `shared/prayer.ts` | killed |
| Islamic midnight midpoint drift | `shared/time.ts` | killed |
| last-third drift | `shared/time.ts` | killed |
| night rows lose their extra day | `shared/notifications.ts` | killed |
| athan channel id off by one | `shared/notifications.ts` | killed |
| time pattern accepts anything | `api/client.ts` | killed |
| today may be silently dropped | `api/client.ts` | killed |
| reschedule ignores an empty cache | `stores/notifications.ts` | killed |
| sequence signature back to first-only | `stores/schedule.ts` | killed |
| version v-prefix strip removed | `shared/versionUtils.ts` | killed |
| interval accepts fractions | `shared/constants.ts` | killed |
| no-op control | `shared/widgetTimeline.ts` | survived (as designed) |
| **night-row noon boundary `>=` → `>`** | `shared/prayer.ts` | **SURVIVED** |

### Chasing the survivor down produced a finding the boundary itself did not

The first sweep only mutated the boundary, and only the first of the two places it appears. A
follow-up sweep separated "the suite misses hour 12" from "the suite misses the whole branch",
across both halves of the pair:

| Mutation | Before | After 1.26.20 |
| --- | --- | --- |
| `calculateBelongsToDate`: boundary `>=` → `>` | survived | survives (equivalent — see below) |
| `calculateBelongsToDate`: whole PM branch removed | killed (3) | killed (6) |
| `adjustPrayerDateForMidnightCrossing`: boundary | survived | survives (equivalent) |
| **`adjustPrayerDateForMidnightCrossing`: whole PM branch removed** | **SURVIVED** | **killed (4)** |

**Deleting an entire production branch left 1,213 tests green.** That branch is the instant-shift
half of the Suhoor midnight-crossing pair: Suhoor is Fajr minus twenty through modular clock
arithmetic, so a Fajr under 00:20 returns `23:4x` still filed under Fajr's own date. One function
walks the instant back a day; the other walks the grouping forward again. **The grouping half had
three tests. The instant half had none** — the identical shape to finding 44, where one half of a
matched pair was pinned and the other was free to drift.

Closed in 1.26.20 with seven cases over a Fajr either side of 00:20 (`00:00 / 00:10 / 00:19 /
00:20 / 00:45 / 02:38`, plus notification-path agreement), asserting both the twenty-minute gap
and the list day. Table-driven because a fixture on one side of the wrap cannot tell a working
pair from a half-applied one — the lesson of the 00:08 Istijaba fixture.

### The two boundary mutants are equivalent, and will not be tested

`hours >= 12` versus `hours > 12` differ only at exactly `12:00–12:59`. Midnight and Last Third
take the exact-instant path and never reach the branch, so **Suhoor is the only row that arrives
here, and it cannot land in an afternoon** — the reachable band is `23:40–23:59`. A test at hour
12 would assert an input the app cannot produce. The comment above each branch records the
reachable band instead. **An unkillable mutant is only worth killing when the input is real.**

### What the sweep is worth

Thirteen kills is genuine evidence for the fixes it covers — those tests do constrain the code.
But the survivor is the point: **it found in one run the exact defect class that took an
independent reviewer to catch three times this month**, and it found it in a place nobody had
thought to look, because the branch was correct and simply unwitnessed. Worth re-running against
any file the audit touches. Script: `scratchpad/mutate.py`, follow-up `mutate2.py`.

---

## Owner question, 2026-09-13: does the app wipe before it fetches, and what did finding 8 change?

Asked directly, so answered from the code rather than from the writeup.

**The wipe comes first, and always has.** `stores/sync.ts` → `updatePrayerData` calls
`Database.clearAllExcept([...])` at line 183, and only then `Api.fetchYear` at 203/229. On `uat`
the same two calls sit at 193 and 208/240. **That order is untouched by this audit** — same in
production, same in `uat-2`.

Two things soften it, both pre-existing: yesterday's record is read out before the wipe and
written straight back (ISSUES #4), and the wipe is only reached when today's data is already
missing, or in December when the current year is not cached. The December-refresh path
(scenario 3a) skips the wipe entirely.

**What finding 8 changed is the new validation step, not the order.** `uat` has no
`validateApiTimes` at all. I added one, and the first version threw for the whole year if any
single day was unreadable. Against wipe-first that is fatal: cache emptied → fetch → one bad day
in December → throw → nothing saved → app shows nothing → every retry does the same. **That is
the bricking, and it was mine, in the guard, not in the wipe.**

The version on `uat-2` now drops only the days it cannot read and keeps the rest. It throws in
exactly two cases: today itself is unreadable, or nothing readable is left. Real motivation
rather than theory — providers emit `"-----"` through a polar-summer window, so an
all-or-nothing guard would make those cities permanently unusable instead of unusable for the
weeks the sun does not set.

**Why no test caught it:** all six rejection tests used a single-day payload, and with one day
in the payload "drop the bad day" and "reject the whole year" produce identical output. The
fixtures could not express blast radius. Multi-day cases were added in the fix.

---

## 66. The audio fingerprint: mono/stereo and sample rate identify what played

The owner asked whether all the audio is mono. **It is not, and the split is useful.** Measured
with `ffprobe` over `android/app/src/main/res/raw` — the 99 files the notification channels
actually reference, rather than the source assets, which agree file for file:

| Category | Files | Sample rate | Channels |
| --- | ---: | ---: | --- |
| Athans | 32 | 44100 Hz | mono |
| Reminders | 66 | 22050 Hz | stereo |
| `reminder.mp3` (the default) | 1 | 48000 Hz | stereo |
| A system or fallback tone | — | 44100 Hz | **stereo** |

So: the athans are all mono, the reminders are all stereo, and **nothing we ship is
44100-stereo**. The four rows are mutually exclusive on two fields the audio flinger already
prints, which is what made the finding 5 device proof possible — `44100 Hz, mono` in `dumpsys
audio` was athan5 playing, `44100 Hz, stereo` was the system tone substituting for it.

**Why this matters beyond one finding.** The next session has to confirm all 99 sounds play and
that none of them falls back to a generic tone. Listening to 99 files sequentially is a session's
work on its own; reading a fingerprint is a line of log per fire. The fingerprint proves the
*category* — it cannot distinguish athan5 from athan6, since all 32 share it — so identity within
a category still needs an ear. The plan that follows from that is in
`ai/prompts/device-verification-sweep.md`: fingerprint all 99 to prove nothing fell back, then
listen to the 32 athans to prove the selection maps to the right file.

One inconsistency worth recording, not fixing: `reminder.mp3` is the only 48 kHz file, and the
only reminder that is not 22050. It is the default reminder, so it is also the most-played file
in the app. Nothing is wrong with it — it is comfortably under the iOS cliff at 22.785 s and it
is the outlier that makes the fingerprint table finer rather than coarser.

---

## 67. The cache is wiped before the fetch that replaces it

Raised by the owner, 2026-09-13: *"We need to have the data first, sanitise the data, make sure
we have the data before we even consider clearing the cache."* Correct as a principle. The
investigation moved where the damage actually is.

**The December scenario the owner described is already safe.** Three days into December with
twelve months of use and 27 days of data left, `updatePrayerData` takes scenario 3a —
`shouldFetchNextYear() && isCurrentYearCached()` — which fetches next year only, warns and
returns on failure, and **never reaches the wipe.** Those 27 days survive.

**The hole is the path finding 8 opened.** `validateApiTimes` now drops unreadable days rather
than rejecting the year — the right fix, but it leaves a *hole* in the cache. The morning that
day arrives:

1. `getPrayerByDate(now)` → null → `needsDataUpdate()` → true.
2. Not December, so 3a is skipped → **`clearAllExcept` wipes the whole year.**
3. `Api.fetchYear` runs. Offline, it throws and the user has nothing — not one bad day, the year.
4. Online, the fetch succeeds and the guard drops the same day again. Today is still missing,
   `initializeAppState` still fails, and **the next launch wipes and re-downloads the year
   again.** All day, every launch.

Before finding 8 the bad day was saved and threw at render: error screen, cache intact, Refresh
available. **The failure mode changed from "one broken day, data intact" to "wipe and
re-download the year, repeatedly."** Ours, and worse.

Second, smaller: `fetched_years` is not in the preserve list, so a failed fetch also erases the
record that anything was ever fetched. Nothing local can help the app recover.

**The fix is cheap, and this is the fact that makes it cheap.** `clearAllExcept`
(`stores/database.ts:110`) and `saveAllPrayers` (`:140`) are both **synchronous** MMKV calls. The
only reason a window exists is the `await Api.fetchYear(...)` between them. Move the wipe past
the await and clear+save become one uninterrupted synchronous block — no partial state is even
representable. Not a rewrite: one call moved past an `await`.

**Deferred deliberately, not forgotten.** This is the data path that has already been broken once
this month by a change that looked obviously correct, and step 2 of the work — what the app does
when a fetch fails and the old cache is still good — is a behaviour change the owner has to
approve. Full brief: `ai/prompts/data-resilience-swap-not-wipe.md`, session 2 in
`ai/prompts/README.md`.

---

## 68. Istijaba across midnight, stated rather than implied

The owner read finding 44 twice and arrived at the right model the second time: *"If Magrib is
at 01:20 then Istijaba is at 00:20. If Magrib is at 00:40 then Istijaba is at 23:40 on the
previous day, because it's before midnight."* **Both correct, and both are what the code does.**

Crossing back over midnight is not a special case anywhere in the source. It falls out of
subtracting sixty minutes from Magrib's *instant*, which carries its own date — the entire reason
the clock-string version had to go.

The gap that this exposed was in the tests, not the code: the table at
`shared/__tests__/nightTimes.test.ts` asserted `magrib − istijaba === 60 min` and the list day,
which **proves the rule without ever showing it.** A reader — including the owner — cannot see
from that assertion where Istijaba actually lands. Two cases added in 1.26.23 in the owner's own
numbers, asserting the literal date and clock on both sides of midnight.

Proved to bite: reverting `getIstijabaTime` to the pre-fix anchoring fails 6 tests; restoring it
returns 43 green.

Still unproven, and queued for the device sweep: **the notification.** A unit test cannot show
that the scheduled alarm agrees with the row. Both Magrib values go on the 3T with the clock
driven to each.

---

## 69. What "a broken day" actually means, measured against the live API

The owner asked, 2026-09-13: *"How do you determine if a day is broken? What if it's correct and
you just accidentally drop it? It seems very, very sensitive."* Answered by pulling the real
endpoint rather than reasoning about it.

### The check is a shape check, and nothing more

`api/client.ts` tests six fields — `fajr, sunrise, dhuhr, asr, magrib, isha` — against
`/^([01]\d|2[0-3]):[0-5]\d$/`. That is the whole test. **It asks "is this string a 24-hour
`HH:MM`", and nothing about whether the time is plausible.** It does not know what season it is,
does not compare against yesterday, does not check ordering. A Fajr of `03:00` in December would
sail through — wrong by three hours and perfectly well-formed.

| Value | Verdict |
| --- | --- |
| `"19:25"` | kept |
| `"-----"`, `""`, `null`, field absent | dropped |
| `"25:00"`, `"19:60"` | dropped |
| `"7:30"` (no leading zero) | **dropped** — and the day is fine |
| `"19:25:00"` (seconds), `" 19:25"` (space) | **dropped** — and the day is fine |

### Measured against the live endpoint, 2026-09-13

Pulled `year=2026&24hours=true` and ran the guard over it:

| | |
| --- | ---: |
| days returned | 365 |
| **days the guard would drop** | **0** |
| time strings checked | 2,190 |
| distinct string lengths seen | 1 (always 5) |
| hours ever written with one digit | none |
| days not in chronological order | 0 |

**The format is rigid and the guard drops nothing on real data.** Also worth knowing: `year=2024`,
`2025` and `2027` all return HTTP 200 with an empty `times` object — **the endpoint only serves
the current year**, which is what the December next-year retry loop exists for.

### The false-drop risk is real but self-announcing

The three false-drop rows above all come from the *provider changing format*. A format change
does not hit one day — it hits all 365 at once, so `todayDropped` is true, the guard throws, and
the failure is loud. **It cannot silently lose a year to a format change.** What it can lose
silently is a single anomalous day, which is precisely what it is for.

### WITHDRAWN: this section originally recommended reconstructing a missing day

It proposed averaging the neighbouring days, and measured that it lands within a minute. **The
owner rejected it outright and the recommendation is withdrawn** — see finding 70 for the ruling
and the reasoning, which is better than mine was. The measurement is kept there because it is
still evidence about how the data behaves; it is no longer a proposal.

---

## 70. OWNER RULING: never substitute a prayer time. And what the user actually sees today.

> *"We absolutely never, ever, ever, ever want to copy a different prayer. We don't want to copy
> yesterday or tomorrow, never, ever, ever do that."* — owner, 2026-09-13

**Absolute and permanent. No copying, no averaging, no interpolation, no synthesised value of any
kind, for any field, under any circumstance.** Finding 69's repair recommendation is withdrawn.

**The owner is right, and the reasoning is better than the one it replaced.** A substituted time
is indistinguishable from a real one on screen — same row, same font, same countdown, same athan
at the end of it. Someone prays to it. Landing within a minute does not make it London Prayer
Times' figure, and the app's entire value is that it shows *their* number rather than the app's
best guess at it. There is no honest way to display a time the source did not give.

My own measurement also undercut the proposal, which I should have noticed before making it: one
minute is the worst case *for a single isolated missing day sitting between two good ones* —
exactly the case that barely happens. The realistic failures are a block of bad days or a format
change, and those are precisely where interpolation degrades, silently.

### What counts as "incorrect" — the exact answer

**Only malformed is detected.** Six fields against `/^([01]\d|2[0-3]):[0-5]\d$/`. Nothing else.

**A wrong but well-formed time is completely invisible.** Measured: a day whose six times are all
`00:00` builds and renders every row without a murmur — Fajr, Sunrise, Dhuhr and Asr at 00:00 on
the day; Magrib and Isha pushed to the next calendar day at 00:00 by the midnight-crossing rule,
both still correctly grouped on the original list day. Six athans at midnight. **Nothing anywhere
in the app objects.** `00:00` is a valid time, as the owner said.

So: **"incorrect" today means unreadable. It has never meant implausible.** There is no
plausibility check in the codebase — not against the season, not against yesterday, not against
ordering within the day.

### What the user sees when one prayer is malformed — measured, not inferred

**One bad field drops the whole day.** All six prayers, not just the bad one. `validateApiTimes`
works per day, and any one failing field takes the record out.

Then, on that day, with today's record absent:

| What happens | Measured |
| --- | --- |
| The app asks for its usual 3-day sequence | returns **12 rows, not 18** — the missing day is skipped |
| The display date resolves from the next future prayer | **tomorrow** |
| What is on screen | **tomorrow's date and tomorrow's times, rendered completely normally** |
| Warning, gap, or error | **none** |

**That is the real defect, and it is worse than a gap: the app shows a wrong answer
confidently.** Someone opens it in the morning and reads tomorrow's Fajr as today's.

Two consequences follow it:
- Finding 67 — today's record missing means a full wipe and year re-download **on every launch
  that day**, each one dropping the same day again.
- The *following* day's Extras night rows are silently a few minutes out: `getNightTimesForDay`
  falls back to the day's own Magrib when the previous day is not stored (measured: Midnight
  00:00 and Last Third 01:40 from the wrong anchor).

### What if an entire day is incorrect

**Malformed throughout: identical to one bad field.** The day is dropped either way — there is no
difference in outcome between one unreadable field and six, which is itself worth knowing.

**Well-formed but wrong throughout: fully rendered, fully scheduled, entirely invisible.** This is
the `00:00` case above.

### Where this leaves the design, with substitution off the table

The honest options, none implemented, all needing the owner's decision:

1. **Fail visibly for that day** rather than silently showing tomorrow's. The error screen and its
   Refresh button already exist. Honest, and the least code.
2. **Show the day with the unavailable rows blank or dashed** — the finest-grained honest answer,
   keeps the five readable prayers. A visual change, so it needs approval separately.
3. **At minimum, stop presenting tomorrow as today.** Whatever else is decided, this one is not a
   trade-off — it is the app being confidently wrong, and it should stop.

Separately worth raising, and explicitly **not** as a trigger to substitute anything: a
plausibility check would catch what a shape check cannot — a time that is well-formed and wrong.
Its only permitted output is to fail honestly and say so. Never to invent a replacement.

---

## 71. OWNER SPEC: unreadable times render `--:--`, per prayer, and the day is still shown

Specified 2026-09-13, in answer to finding 70's open question. **Queued as session 3, explicitly
not for this session.** Full brief: `ai/prompts/unavailable-times-dashes.md`.

| Rule | |
| --- | --- |
| R1 | A day with unreadable times is **still shown** — never dropped, never skipped |
| R2 | An unreadable time renders `--:--` |
| R3 | Breakage is **per prayer, not per day** — one bad Asr dashes Asr, the other five are fine |
| R4 | A whole-day failure dashes every row, Standard **and** Extras |
| R5 | No alert can be set against a dashed prayer, and none can fire for one |
| R6 | Notifications, the rolling window and rescheduling account for dashed rows |

**Broken means format only** — not `HH:MM` zero-padded 24-hour, the shape the endpoint actually
returns (finding 69: 2,190 values, all five characters, all padded). Implausible-but-well-formed
values are **out of scope** and must not be smuggled in; the six-`00:00` case stays finding 70's
open question, and any future plausibility check may only fail honestly, never substitute.

**This spec also closes three live defects**, which is the argument for doing it even though the
owner rates it unlikely (*"we trust the API"*):

1. One bad field currently drops **all six** prayers for that day. R3 ends that.
2. The app then shows **tomorrow's times as today's**, rendered normally, with no warning. R1
   ends that — the day is present, so nothing falls through.
3. Finding 67's wipe loop **dissolves at the source**. That loop exists because a dropped day
   leaves a hole in the cache; under R1 there is no hole, so `needsDataUpdate()` stays false and
   no re-fetch happens. Verify this explicitly after the change.

**The part most likely to be got wrong** is the derived-prayer graph, because two rows cross a
day boundary: Suhoor follows Fajr, Duha follows Sunrise, Istijaba follows Magrib — and Midnight
and Last Third need the *previous* day's Magrib and *this* day's Fajr. **A broken Magrib on
Tuesday dashes Tuesday's Istijaba and Wednesday's Midnight and Last Third.** A test matrix
confined to single days cannot see it.

**Representation matters more than it looks.** A sentinel string `"--:--"` type-checks everywhere
and reaches arithmetic silently; `null` with a nullable `datetime` makes the compiler enumerate
every consumer, which is worth more here than any test, because the real risk is a consumer
nobody remembered. Do not store the dashes — `--:--` is a rendering of absence, not a value.

**Visual authority:** the owner authorised exactly `--:--` and an alert control that cannot be
set. Anything further — a banner, an icon, a colour, an explanation — is a new visual decision
and needs asking.

---

# Session 1 of the queue: device verification sweep, 2026-09-13

Run on the OnePlus 3T (a local release build of 1.26.28 on the live API, called the prod build
below, plus local mock builds) and the iPhone XS. Testing only: no application code changed.
The owner narrowed the scope mid-session, and the narrowing is what this session delivered:

> *"I just want to know that we haven't broken anything from UAT1 to UAT2... I think all the audios
> work. I think all the reminders work... the only part that I'm not confident with is the flip
> between midnight and before midnight and after midnight."*

The owner added both London clock changes, the moment the clock reaches 00:00 with the app open,
and one test of unreadable times, then dropped screenshots (1.26.29) and asked that no notification
test wait more than two minutes.

**Verdict.** No prayer row and no alarm instant regressed from `uat` to `uat-2`, measured in
Jest over 6,248 rows (below). On the 3T, every alarm the tests armed fired on its armed second,
under the list day its identifier names, either side of 00:00 and across both clock changes, on
real data and on mocks. Three exceptions are findings: an alarm armed from a substituted Magrib
fires at the wrong instant (finding 72), Android refuses to post a 51st showing notification
(finding 73), and yesterday's post-midnight rows lose their alarms after a reschedule (finding 74).
The owner has accepted finding 73. Findings 72 and 74 wait on the owner's decision, findings 75
and 77 are queued into session 4, and finding 76 has no session yet.

## How it was proven

- **Clock driving, not waiting.** `service call alarm 2` against `auto_time 0` put the 3T three
  seconds before each armed alarm, so every fire took seconds.
- **An independent oracle.** A standard-library Python recomputation of every 2026 row from the
  live payload (fetched 2026-09-13, sha256 `d8fa09f7…fbd1d`) agreed with the app's own
  `getPrayerForDate` on all 3,700 rows both could compute, to the millisecond. It refused the
  other two, the 1 January Midnight and Last Third, which need a Magrib the payload does not
  contain (finding 72). Its armed-set emulator checked the `dumpsys alarm` set to the second at
  the four October stops.
- **What proves a fire.** AlarmManager's trigger line at the armed epoch, and the posted
  identifier, which carries the list day. For Sound alerts, also the AudioTrack format and the
  exact byte range `dumpsys media.extractor` opened inside the APK, hashed against the 99 files.
- **What the user sees.** Rows read from Maestro's live `hierarchy` and compared with the oracle.

## Results

### `uat` against `uat-2` in Jest: no regression

Each branch ran its own code over 6,248 rows: the real 2026 year (4,015) and a synthetic table
putting rows either side of 00:00 (2,233). 842 differ. Running each fix commit against its parent
attributes every one:

| Class | Rows |
| --- | --- |
| #29 night pair, and alerts firing at the row's own moment (1.24.12) | 694 |
| Finding 44, Magrib crossing midnight (1.25.49) | 146 |
| Istijaba from Magrib's instant (1.25.53) | 2 |
| Unexplained | 0 |

Fajr, Sunrise, Dhuhr, Asr and Duha are identical on every input. Isha and Suhoor are identical on
the list; only their armed instant differs on synthetic crossing days, where `uat` armed them 24
hours away from its own row.

### Real data: the midnight flip, 00:00 itself, and October's clock change

| Fire | Armed for | Fired | List day in the identifier |
| --- | --- | --- | --- |
| Midnight | 18 Oct 00:00:00 BST | 00:00:00, posted at 00:00:00.245 | 18 Oct |
| Midnight | 18 Oct 23:59 BST | 23:59:00.004 | 19 Oct |
| Midnight | 24 Oct 23:58 BST | 23:58:00.013 | 25 Oct |
| Last Third | 25 Oct 01:00 GMT, the second 01:00 | 01:00:00.000, epoch 1792890000 | 25 Oct |
| Fajr, after the clocks go back | 25 Oct 05:04 GMT | 05:04:00.001 | 25 Oct |
| Midnight | 25 Oct 22:57 GMT | 22:57:00.001 | 26 Oct |
| Last Third | 26 Oct 01:00 GMT | 01:00:00.001 | 26 Oct |

Armed sets at 17 Oct 22:00, 18 Oct 23:00, 24 Oct 22:00 and 25 Oct 21:00 each matched the oracle
5 of 5, with no extras. The rendered Extras lists for 18, 19, 25 and 26 October equal the oracle.
Across 00:00:00 on 18 October the same app process ran before and after, with no fatal
exception, and the armed set afterwards was exactly the remaining alarms.

### March's clock change (a local build carrying the payload's own 24 March to 10 April readings)

The API's TLS certificate is valid only from 7 May 2026, so a build that fetches should fail with
the device clock in March. The March run therefore used a mock, holding the payload's readings
verbatim under their real dates.

| Fire | Armed for | Fired |
| --- | --- | --- |
| Midnight, 29 Mar list | Sat 28 Mar 23:18 GMT | 23:18:00.000 |
| Last Third, 29 Mar list | Sun 29 Mar 00:54 GMT | 00:54:00.001 |
| Fajr, after the clocks go forward | 29 Mar 05:07 BST | 05:07:00.005 |
| Midnight, 30 Mar list | 30 Mar 00:18 BST | 00:18:00.000 |
| Last Third, 30 Mar list | 30 Mar 01:54 BST | 01:54:00.002 |
| Fajr | 30 Mar 05:05 BST | 05:05:00.001 |

### Every row either side of 00:00 (high-latitude mock, launched on Fri 25 Sep 2026)

17 of 17 fired on their armed second under the list day their identifier names, three of them
Midnight re-fires after a harness error (below).

| Row | Before 00:00 | After 00:00 |
| --- | --- | --- |
| Istijaba | 23:40, Fri 25 Sep list (Magrib 00:40) | 00:20, Fri 2 Oct list (Magrib 01:20) |
| Magrib | 22:00, 26 Sep list | 00:40, 25 Sep list; 01:20, 2 Oct list |
| Isha | 23:30, 26 Sep list | 01:30, 25 Sep list; 02:10, 2 Oct list |
| Suhoor | 23:50 the evening before, 27 Sep list (Fajr 00:10) | 01:40, 26 Sep list |
| Midnight | 23:59, 29 Sep list; 23:05, 27 Sep list | 00:00:00, 28 Sep list; 00:01, 30 Sep list; 01:20, 26 Sep list |
| Last Third | 23:26, 27 Sep list | 01:33, 26 Sep list |

The rendered Friday list shows Magrib 00:40 and Isha 01:30 on Friday, and Istijaba 23:40 on
Friday's Extras list. Both of finding 68's Istijaba values fired on their armed second: 23:40
before a 00:40 Magrib, and 00:20 before a 01:20 Magrib. That closes the notification half finding 68
left for this sweep.

### Sound identity, before the owner closed the audio pass

- Athans 1 to 20 each posted on their own `athan_N_v2` channel at 44100 Hz mono. The extractor
  opened exactly that athan's bytes each time, with zero fallback tones.
- The APK holds all 99 files byte-identical to source.
- One reminder re-checked: `reminder_magrib_10` posted on its own channel at 22050 Hz stereo, and
  the byte range was `reminder_magrib_10.mp3`. Finding 5's note that it played at 44100 Hz
  stereo, the fallback fingerprint, was a mis-record.

### Unreadable times (iPhone XS, local builds, Silent)

- **Tomorrow's Asr `--:--`, the day after all `--:--`, and every time four to ten days out
  `-----`.** Today scheduled 16 notifications. Tomorrow scheduled none: all 16 were skipped,
  including the seven readable rows. No crash, and nothing armed for an unreadable time.
- **Today all `--:--`.** The error screen shows, with no crash. Nothing is scheduled at launch or
  after Refresh. The wipe before the fetch (finding 67) erased the app's records of the 16 alarms
  already armed, and iOS still fired all 16 over the error screen.
- The whole-day drop is findings 70 and 71, now seen on the alarms too. Session 3 addresses it.

---

## 72. A substituted Magrib builds the first stored day's night rows, and its Last Third fires

`shared/prayer.ts:149-150` (`getNightTimesForDay`). When the previous day's record is not stored,
Midnight and Last Third take "this day's Magrib time one day earlier". That is a synthesised prayer
time, which the owner's ruling (finding 70) forbids without exception.

**Proven on the 3T.** Synced on 30 March, so the first stored day was 29 March. The clock was then
wound back to 29 March 00:30 GMT without relaunching, and the Last Third alert re-committed. The
29 March Last Third was armed for **02:15 BST** and fired at 02:15:00.001. Its real value is
**00:54 GMT**, so it rang 21 minutes late. The error is largest next to a clock change and floors
to about a minute on ordinary days.

**Reach.** Any list whose previous day is not stored. In normal use that is the day after a
dropped day (finding 70). On 1 January the only substituted row still ahead is that list's Last
Third, at about 01:40. Arming it needs a Last Third alert switched on, 31 December missing from the
cache, and the previous-year fetch to fail. A fresh install has every alert Off, but the error
screen's Refresh wipes the timetable and keeps preferences (finding 6). The fetch fails while the
endpoint serves only the current year (finding 69). That rejects `sync()`, but a reschedule before
that Last Third still arms from today's record (`stores/notifications.ts:1039`). Traced from the
code, not run.

**Tests pin the defect.** `shared/__tests__/nightTimes.test.ts:194` and `:212` assert the
substituted values as expected behaviour.

---

## 73. OWNER ACCEPTED: Android refuses an app's 51st showing notification

Android 9 lets one app have 50 notifications showing at once (`MAX_PACKAGE_NOTIFICATIONS = 50`,
`NotificationManagerService.java:249`, android-9.0.0_r61). At-time athans post with
`autoDismiss: false` (`shared/notifications.ts:63`), as in production 1.5.2, so each stays in the
shade until the user swipes it away.

**Proven on the 3T,** on the prod build with every row Silent, without touching the shade.
50 notifications posted. Then Fajr on 27 September triggered on its second and nothing was posted,
and neither was Sunrise after it:

```
09-27 05:24:00.172 E NotificationService: Package has already posted or enqueued 50 notifications.  Not showing more.  package=com.mugtaba.athan
```

With Sound, that athan would not ring either, and nothing would tell the user. This run was all
Silent.

| Alerts on | Notifications a day | Days to the cap without clearing |
| --- | --- | --- |
| One prayer | 1 | about 50 |
| All five daily prayers | 5 | about 10 |
| Standard and Extras | 10 to 11 | about 5 |
| Plus reminders | up to 22 | about 2 |

**Owner ruling, 2026-09-13:** *"If the user hits 50 notifications, that's not a problem because it's
not something we expect to happen. However, we don't expect the app to break. It should still
continue to schedule notifications even if they get rejected."*

**At the cap, the alarms already armed kept triggering on the device. That scheduling is unaffected
is read from the source.**
- Android checks the cap only when a notification is posted
  (`NotificationManagerService.java:4199-4206`). A refused post simply returns (`:4106-4109`), so
  nothing is thrown back into the app. Scheduling never passes through that check.
- On the device, the alarms carried on past the first refusal. Sunrise triggered on its second at
  06:52 and reached Android, which refused it for the same reason.
- Rescheduling ran twice during the run, with 19 and then 39 notifications showing, and armed 20
  alarms each time.
- Not run: a reschedule with exactly 50 showing. It is the same code path, because the cap sits
  only on posting.

**`autoDismiss: true` would not fix it.**
- expo-notifications 57.0.18 passes `autoDismiss` to Android's `setAutoCancel`
  (`ExpoNotificationBuilder.kt:100`). That flag only makes a tap remove the notification
  (`NotificationManagerService.java:714-718`). A notification nobody touches stays either way, so
  someone who never clears the shade reaches the cap regardless.
- It would cost something. Cancelling the notification that is sounding stops its sound
  (`:5458-5466`). With `true`, tapping an athan while it plays would cut it off. With `false`, the
  athan should keep playing when tapped (read from the source, not tried).
- Reminders already use `autoDismiss: true` (`shared/notifications.ts:114`).
- Two app-side changes could keep a user who never clears the shade under the cap: clearing the
  app's own old delivered notifications, or posting under a reused tag so that each notification
  replaces the last, which Android does not count twice
  (`NotificationManagerService.java:4241-4244`). The ruling above makes neither necessary, though
  the owner's later spec, finding 78, asks for the second.

---

## 74. After 00:00, yesterday's still-due rows leave the screen and then lose their alarms

A row filed under yesterday's list with an instant after 00:00 (a Magrib or Isha after midnight,
or a Friday Istijaba when Magrib is 01:00 or later) drops out twice once the clock passes 00:00:
- A list rebuilt after 00:00 starts from the calendar day.
- The rolling window is counted from the calendar day (`shared/notifications.ts` `genNextXDays`).
- A reschedule cancels every recorded identifier it did not re-attempt
  (`stores/notifications.ts:625-643`, `:769-795`).

**Proven on the 3T** with the high-latitude mock. Friday's Magrib 00:40 and Isha 01:30 fall on
Saturday.

| Moment | Screen | Friday's 00:40 and 01:30 armed? |
| --- | --- | --- |
| Fri 20:00 | Friday's list with both rows | yes |
| Sat 00:00:30, app left in front | unchanged | not dumped; nothing ran that could cancel |
| Sat 00:00:40, after returning to the app | **Saturday's list; both rows gone** | yes |
| After a full reschedule (the sound sheet) | not re-read | **no, both cancelled** |
| Clock driven to 00:40 and 01:30 | | **nothing triggered** |

**Reach.** None in London 2026 data; it goes live with the first high-latitude city in v2.0.

**Not a `uat-2` regression.** Both mechanisms are on `uat`; the stale-cancel came in 1.6.0
(`6b36a14`). `uat-2` fixed when these rows fire (#29's alerts at the row's own moment, finding 44
and the Istijaba anchor), which is why they fired on the second when nothing rescheduled in
between. Nothing handles the calendar day passing a list day that still has rows due.

**Not fixed, and not in any queued session.** It waits on the owner's decision. The tests that
describe the fix are items 6 and 17 of the gap map (finding 77).

Also traced from the code, not run, on the same root: `getYesterdayFinalPrayer`
(`stores/schedule.ts:82-92`) rebuilds yesterday's last row from its clock reading with no midnight
shift, so the progress bar gets a post-midnight Isha 24 hours early.

### Two more latent defects found while tracing, not run

- A Suhoor wrapped onto the evening before gets the base window and loses a day of buffer
  (`shared/notifications.ts:170`, `:183-187`).
- On 1 January with no 31 December record, a failed previous-year fetch rejects `sync()`
  (`stores/sync.ts:65-78`). The notification refresh still arms from today's record
  (`stores/notifications.ts:1039`), which is how finding 72 reaches 1 January.

---

## 75. Eight client tests fail between 00:00 and 00:59 BST

`api/__tests__/client.test.ts`. The fixture computes "today" in UTC while the app uses London time,
so for the first hour of every BST day the fixture's today is London's yesterday. Measured by
running the unmodified suite with Jest's clock pinned; nothing was edited. Any commit made in
that hour fails the pre-commit gate for no reason, because `yarn validate` runs the whole suite
(`.husky/pre-commit`). The same pinned runs also reproduced Lead 2:
`stores/__tests__/widgetSettingsSync.test.ts:321` fails at 23:59:41 BST.

---

## 76. Wrong comments, a drifted build number, and the certificate window

- `EVENING_BEFORE_ROWS` (`shared/notifications.ts`) says both night rows fire on the day before.
  Last Third falls on its own list day on all 364 London days, and Midnight on 203 of them. The
  extra list day is still right.
- `shared/types.ts:25-28` labels `asr` Hanafi and `asr_2` Shafi. In the payload `asr_2` is later
  on 365 of 365 days, and the later Asr is the Hanafi one. The app takes `asr` verbatim, which
  finding 45's ruling keeps.
- `stores/notifications.ts:349` documents the athan index as 0-15. 32 athans ship.
- `app.json` declares Android `versionCode 1000000`, but the main checkout's gitignored `android/`
  prebuild still says 1, and `ai/AGENTS.md:523` says local builds stay at 1. The 3T now
  carries 1000000. A build from the stale folder is refused as `INSTALL_FAILED_VERSION_DOWNGRADE`
  until prebuild re-syncs it.
- The API's TLS certificate is valid from 7 May to 20 November 2026, read from the certificate.
  With the device clock outside that window a fetch should fail, and because the cache is wiped
  first (finding 67) the app would be left without today's times. Not tried on a device.

---

## 77. The unit suite cannot see most of this

49 sub-cases were mapped across the scenarios above; 38 are gaps. The biggest gaps are 15 of 18
for rows either side of 00:00, and 7 of 7 for the clock reaching 00:00. The full map, with fixture
values for every missing test, is `ai/features/uat-2/UNIT-TEST-GAPS-2026-09-13.md`. It is queued
into session 4 (`ai/prompts/coverage-sweep.md`). The tests for findings 72 and 74 will fail
against today's code by design, so they wait on the owner's decision about those fixes.

## Harness errors this session, recorded so they are not read as app failures

- Athans 21 and 22: Maestro's centring scroll timed out inside the sound sheet, so nothing was
  selected, and the app correctly kept Athan 20.
- The first 25 October Last Third fire jumped the clock to the wrong 01:00. Wall-clock arithmetic
  on an aware London datetime drops `fold`. The alarm was armed correctly; the re-fire in UTC
  passed.
- Three high-latitude Midnight fires (00:00, 23:59 and 00:01) failed because the script
  re-committed Magrib, not Midnight, before them. A commit reschedules only its own row, so
  Midnight's window had expired.
- The first cap-test attempt: Isha's sheet had not opened within 1.6 s on the 3T, so a BACK exited
  the app. The owner also cleared the shade by hand mid-run.
- The 18 October 00:00:00 record's trigger time was mis-read by the script, which took a process
  id for it. Logcat shows the request handled at 00:00:00.092 and the notification posted at
  00:00:00.245.
- The script marked the reminder re-check FAIL only because it looked the byte range up in the
  other APK build's map. In the installed build's own map, `54945316:89490` is
  `reminder_magrib_10.mp3`.
- The first Athan 1 fire read no file from the extractor. The re-fire at Asr matched `athan1.mp3`.
- The fire records for athans 16 to 22 carry the same process-id mis-read as the 18 October one.
- The first reminder re-check armed nothing, straight after the older APK was refused as a version
  downgrade. The re-run fired.

## State left behind

- **3T:** the prod build (`versionCode 1000000`), the owner's app data restored from an app-only
  backup, and automatic date and time zone back on. The athan channels the sound tests created
  remain in Android's notification settings. They are system state and cosmetic. Clearing the
  app's data removes them, as finding 5's backup cycle showed, and so does an uninstall. Either
  way the owner's data would need a fresh backup and restore.
- **iPhone XS:** the prod build installed over the mock build with the owner's data intact, and the
  local UI-test runner removed.
- Nothing was built on or pushed to EAS. `releases.json` is untouched.

---

## 78. OWNER SPEC: each notification replaces the one before it

**Owner, 2026-09-13:** *"Basically, what I want for both platforms is, If I get a notification for
30 minutes and then another notification for 5 minutes, the 30 minute notification should disappear
and be overwritten with the 5 minute notification. Same thing for any notification that the
application produces. It should overwrite the previous notifications, so the user doesn't have to
keep swiping, to delete all the notifications, and That's it."*

Nothing replaces anything today. On Android, expo-notifications posts each notification with its own
request identifier as the tag (`service/delegates/ExpoPresentationDelegate.kt:108-112` in its
Android source), and the app's identifiers are unique (`device/notifications.ts:33-46`), so
notifications stack. On iOS every delivered notification stays until the user clears it.

**Android: build it (session 6).** Post every notification under one shared tag and id. The owner:
*"Let's implement this for Android. Let's do this for Android, yes, by adding a tag like you
mentioned."* It also keeps the app far below finding 73's cap.

**iOS: investigate (session 7).** Session 1 read Apple's documentation as allowing no replacement at
delivery for notifications scheduled on the phone. The owner does not accept that without proof, so
session 7 investigates and proves each answer on the iPhone.

**Owner decision: notifications due at the same instant are left to the system.** *"Let's not even
bother to deal with it. Let just let this system deal with it."* The owner attached one condition:
*"As long as it's not a default sound, ... then that's fine."* It replaces an earlier ruling,
withdrawn the same day, that an at-time notification beats a reminder. In London 2026 a few pairs
fall due together whenever the user picks those alerts and intervals, such as Suhoor with Fajr's
20-minute reminder, and no athan shares its instant with anything. Nine runs of that pair on the 3T
posted both notifications every time. In eight, the first to post kept its sound and Android muted
the second as "recently noisy". In the ninth, the second arrived just outside Android's one-second
window and its sound cut over the first. Every sound was the app's own file, never a default.
Which posted first varied from run to run. The session 6 brief has the table.
