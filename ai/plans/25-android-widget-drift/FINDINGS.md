# Session 25: the Android widget countdown drift, diagnosed and reproduced on the OnePlus 3T

**Status: TWO bugs found, both reproduced and measured on real hardware. No code changed yet.**

The owner's Find X8 symptom (a widget reading 20 to 24 minutes late, always too slow) is fully explained.
The fix the owner approved earlier, a native `Chronometer`, is aimed at the wrong layer and must not be
built; section 6 explains why and section 7 gives what does fix it. Section 1 withdraws two claims I made
from reading the source before measuring anything.

## 1. Corrections to my own earlier diagnosis

### Withdrawn: "the chain re-arms from `now`, so a late fire loses the delay forever"

`WidgetRefreshScheduler.armNext` computes `(System.currentTimeMillis() / MINUTE_MS + 1) * MINUTE_MS + 500`,
which **floors to the wall-clock minute**. A late fire re-arms on the next real edge and rejoins the grid:

| Receiver actually ran | Next tick armed for |
| --- | --- |
| 12:01:00.600, on time | 12:02:00.500 |
| 12:04:30.000, late by 3m30s | 12:05:00.500 |
| 12:24:17.000, late by 24m | 12:25:00.500 |

Measured on the 3T over 12 samples: 21:50:00.500, 21:51:00.500, 21:52:00.500, 21:53:00.500, advancing
exactly one minute each time, with lifetime counters at **1232 alarms to 1232 wakeups** (1:1, nothing
dropped). My "permanently loses the delay, and every deferral adds to it" was a misreading.

### Withdrawn: "a stale snapshot makes the countdown drift"

Also wrong. The snapshot stores **absolute epochs**, and `androidRender` re-picks `next` as the earliest
`epochMs > Date.now()` on every render, so an old snapshot of the same data gives the same countdown. A
merely aged snapshot is harmless.

The inconsistent reading I saw at 21:54 (`F A J R`, `04:03`, `11h 39m`, where the label implied a 09:33
target) was an upgrade artefact: a snapshot from the pre-upgrade **1.27.394 mock build** (Fajr 04:03)
still on screen after 1.28.14 (Fajr 05:22) landed at 21:17. That is the documented session 19 behaviour,
"a widget's stored snapshot outlives an install", and not the owner's bug.

## 2. Bug 1: the refresh chain is a single alarm, and a force-stop kills it dead

`modules/widgetrefresh` sustains the widgets with one **non-repeating, self-re-arming** exact alarm.
`WidgetRefreshReceiver.onReceive` re-renders, then arms the next tick, but only if the process lives to
run. There is no repeating alarm, no `TIME_TICK` receiver, and no periodic work; the manifest registers
only `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED`. So the chain has exactly one point of failure, and
Android destroys the alarm on force-stop, which is what an aggressive OEM battery manager does.

**Reproduced** with `adb shell am force-stop com.mugtaba.athan` as the stand-in for the OEM kill:

| Moment | Alarms armed for `WidgetRefreshReceiver` |
| --- | --- |
| Before | 3 |
| Immediately after force-stop | **0** |

Then the widget was watched across three minute edges, nothing touched:

| Clock | Widget showed | True remaining to Midnight 00:08 | Error |
| --- | --- | --- | --- |
| 22:15:25 | `1h 54m` | `1h 53m` | 1 min late |
| 22:16:15 | `1h 54m` frozen | `1h 52m` | 2 min late |
| 22:17:06 | `1h 54m` frozen | `1h 51m` | **3 min late** |

The label freezes while the clock moves, so **the error grows one minute per minute of suspension,
always showing too much time remaining.** 20 to 24 minutes of suspension gives the owner's 20 to 24
minutes of lateness, in the direction they reported ("too slow"). This is the bug.

## 3. Bug 2: `ensureArmed` cannot heal it, because a PendingIntent outlives its alarm

This is the more serious finding, and it is why the bug persists rather than self-correcting.

```kotlin
fun ensureArmed(context: Context) {
    val existing = PendingIntent.getBroadcast(
        appContext, 0, Intent(appContext, WidgetRefreshReceiver::class.java),
        PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
    )
    if (existing == null) armNext(appContext)
}
```

`ensureArmed` treats "a PendingIntent exists" as "an alarm is armed". **Those are different objects with
different lifetimes.** A force-stop cancels the AlarmManager registration but leaves the PendingIntent
record in the system, so `FLAG_NO_CREATE` returns non-null, `ensureArmed` concludes the chain is alive,
and it never re-arms.

**Measured on the 3T after the force-stop:**

| What | Count |
| --- | --- |
| `dumpsys activity intents` entries for `WidgetRefreshReceiver` (the PendingIntent) | **1** |
| `dumpsys alarm` entries for `WidgetRefreshReceiver` (the actual alarm) | **0** |

So the guard is reading the wrong signal, and this exactly repeats a lesson already in `ai/AGENTS.md`
from session 2026-09-23: "a stamp is not evidence that alarms exist, and the two diverge on reboot,
force-stop and OEM kill, so any gate over scheduling must be reopened by a signal that tracks the alarms
rather than the clock." The same class of defect, in a different module.

**Confirmed end to end:** after the force-stop I opened the app twice and waited. The content healed
(`1h 46m` at 22:22:29 is correct for Midnight 00:08) because the JS push re-rendered the widgets, but
`dumpsys alarm` still reported **0 alarms**. The widget was correct at that instant and guaranteed to
freeze again immediately. An app open repairs the picture and not the mechanism.

## 4. Why `armWidgetRefreshChain` being push-gated makes it worse

`refreshPrayerWidgets` (`stores/widget.ts:237`) is the only caller of `armWidgetRefreshChain`, and it is
reached from 12 call sites but each behind a data or timer gate. So re-arming is a side effect of pushing
data, never an independent health check. Combined with bug 2, the chain's only true repair path today is
a reboot or a package replace, both of which go through `WidgetRefreshBootReceiver`.

## 5. Why the 3T never showed this on its own

Its lifetime counters were a clean 1232:1232 before I intervened, so Android 9 had never killed the app.
Every reading in sections 2 and 3 required me to induce the kill. The X8's ColorOS 15 does this
routinely, which is why the owner sees it there and not here.

## 6. Why the approved `Chronometer` fix must NOT be built

The owner approved `setChronometerCountDown(true)` so the launcher ticks the countdown and drift becomes
impossible. That ruling rested on my withdrawn diagnosis. On this evidence:

- **It would fix the frozen label.** The launcher's process ticks a Chronometer, so it keeps counting
  while our app is dead. That much is real.
- **It cannot fix the prayer rollover, which is the same failure.** When a prayer passes, the countdown
  must retarget the NEXT prayer, and only a re-render can do that because choosing `next` is JS logic
  over the snapshot. A Chronometer would reach zero on the old target and then sit there or count up,
  while the name and time rows still showed a prayer that had already passed. That is worse than a slow
  label, and it also lasts until the next app open.
- **It costs the `6h 8m` format** (session 18 measured that a Chronometer renders only `06:08:32`), so
  the owner pays the format for a partial fix.

The cause is a dead refresh chain that cannot detect its own death. Ticking the label in another process
hides that. Following the owner's instruction, 🐋  "Don't do any hacks. Don't do any tricky stuff. Just
make it work... We don't want any drift", the chain is what to fix.

## 7. The fix, and the evidence for each part

**7a. Repair `ensureArmed` so it tracks the alarm, not the PendingIntent.** The only reliable signal is
to arm unconditionally: `setExactAndAllowWhileIdle` on an existing alarm replaces it, so re-arming is
idempotent and cheap. The current `FLAG_NO_CREATE` guard is not just useless, it is the thing preventing
recovery, so it goes. This alone makes every app open genuinely heal the chain.

**7b. Add a periodic `WorkManager` watchdog that re-arms the chain.** Verified on the 3T, and this is the
measurement that decides the design:

| After the same force-stop | Count |
| --- | --- |
| `dumpsys alarm` entries for our receiver | **0** |
| `dumpsys jobscheduler` entries for `com.mugtaba.athan/androidx.work` | **96** |

**WorkManager survives what kills the alarm.** The app already depends on it through
`expo-background-task` (122 jobs were registered before the kill, 96 after), so this needs **no new
dependency and no patch to any Expo package**, which the owner also ruled out. Its 15-minute floor is
the wrong resolution for a countdown and exactly right for a watchdog: it bounds the worst case at about
15 minutes of staleness instead of unbounded, and with 7a it re-arms rather than merely re-rendering.

**7c. Consider `setRepeating` for the tick itself.** A repeating alarm is one system-owned object, so a
single missed fire does not end the sequence. It is inexact above API 19, which suits a minute-resolution
label, but it is still destroyed by force-stop, so it does not remove the need for 7b. Lower priority.

The combination that removes drift rather than reducing it is **7a plus 7b**: arming becomes
unconditional and correct, and a watchdog that outlives the OEM kill re-arms it. Neither is a hack and
neither patches a dependency.

## 8. Assumptions, and what I could not verify

1. **The X8 was never tested.** It is not connected to this Mac and I have never had access to it. That
   ColorOS force-stops backgrounded apps is inference from sessions 15d and 18 plus this reproduction,
   not a measurement on that phone. The mechanism matches the owner's numbers and direction exactly,
   which is strong but not proof.
2. **`force-stop` is my stand-in for the OEM killer.** They are not identical: a battery manager may
   instead use doze, standby buckets or its own freezer, and some of those keep the alarm object while
   preventing it from firing. In that case the chain would resume on its own and the dominant fault would
   be different. 7a and 7b are safe under either mechanism, which is partly why I prefer them.
3. **The reproduction ran screen-on, on USB power,** so doze and standby were not in play. That isolates
   the force-stop variable but does not model the X8's real conditions.
4. **The 96 surviving WorkManager jobs are `expo-background-task`'s, not a watchdog's.** They prove
   WorkManager survives force-stop on this device; they do not prove a new periodic worker would fire on
   the X8 under ColorOS, which throttles background work harder.
5. **`uiautomator dump` failed on roughly a third of attempts** ("fails silently while the countdown
   animates", `ai/AGENTS.md`). Every reading above comes from a dump that succeeded, cross-checked
   against the device clock read in the same second.
6. **I did not prove a Chronometer is reachable through Glance in practice.** `AndroidRemoteViews` exists
   in the resolved `glance-appwidget-1.2.0-peek-0.3.0.aar` and expo-widgets' converter has no case for
   it. Since section 6 argues against that route, I stopped before proving it buildable.
7. **The owner approved the Chronometer and this file recommends against it.** That reversal is theirs to
   accept or refuse, so nothing was built either way. It is the one open decision here.

## 9. Correction to sections 7b and 8, item 4: the job counts were wrong

I reported "122 jobs before the kill, 96 after" and used it as the evidence that WorkManager survives a
force-stop. **Those were dump LINES, not jobs.** Deduplicating on the job id
(`dumpsys jobscheduler | grep -oE 'JOB #u0a191/[0-9]+' | sort -u | wc -l`) the app runs **2** jobs.

The conclusion is unchanged and still measured: the alarm goes to 0 on force-stop while the WorkManager
jobs remain, so WorkManager survives what kills the alarm. But the magnitude was inflated about 50-fold
and must not be quoted from the earlier text.

## 10. Owner questions answered with measurements, 2026-09-25 22:38

### "Will the app be penalised for two background tasks, one at 3h and one at 15m?"

No, on three measured grounds:

| Evidence | Reading on the 3T |
| --- | --- |
| Jobs the app registers today | **2** |
| Device's background job cap per app | `bg_normal_job_count=6` (drops to 1 under critical memory pressure) |
| App's current standby bucket | `ACTIVE` (10), the least restricted |

Going from 2 jobs to 3 sits inside the cap. More to the point, Android's standby buckets penalise
frequent wakeups and long runtimes, not the number of registered jobs. The watchdog's whole body is
"does an alarm exist, if not arm one", which is a few milliseconds with no network and no wake lock. That
profile is far lighter than the 3-hour task already running.

**Unmeasurable caveat:** ColorOS layers its own battery manager over AOSP on the X8. It is undocumented
and not observable from this Mac, so it may throttle the watchdog regardless of how cheap it is. That is
the reason the X8 diagnostic (section 11, item 4) is part of the work rather than optional.

### "Why 15 minutes and not 1 minute or 30 seconds?"

Because Android forbids shorter. Verified in WorkManager's own bytecode:

```
androidx.work.PeriodicWorkRequest:
  public static final long MIN_PERIODIC_INTERVAL_MILLIS = 900000l;   // 15 minutes
  public static final long MIN_PERIODIC_FLEX_MILLIS     = 300000l;   // 5 minutes
```

A shorter period is silently clamped to 15 minutes. It is a platform floor, not a design choice.

### "Does this mean the 3-hour background task drops to 15 minutes?"

No, and this is the point my earlier summary blurred. The two are separate jobs with different weights:

| Job | Period | Work it does |
| --- | --- | --- |
| Existing background task | 3 hours, unchanged | Fetches data, schedules notifications. Heavy. |
| New watchdog | 15 minutes | Re-arms the tick alarm if it is missing. Trivial. |

`BACKGROUND_TASK_INTERVAL_HOURS` is not touched by this work. The per-minute ticking also remains the
alarm's job; the watchdog never renders anything.

## 11. The agreed scope (owner, 2026-09-25 22:38): all four layers

The owner chose every option, and they cover four different failure windows rather than overlapping:

| Layer | The window it covers | Works while the app process is dead? |
| --- | --- | --- |
| 1. Unconditional re-arm (drop the `FLAG_NO_CREATE` guard) | Any app open heals the chain immediately | n/a |
| 2. Runtime `TIME_TICK` receiver | Screen on and app alive: the widget can never go stale | No |
| 3. 15-minute WorkManager watchdog | The app was killed in the background | **Yes** |
| 4. X8 diagnostic the owner runs | Establishes ColorOS's real worst case instead of inferring it | — |

**Correction to what I told the owner about TIME_TICK:** I called it "zero cost". It is very cheap but
not free, because it fires every minute while registered. The receiver body must therefore stay trivial
and must be unregistered with the lifecycle that owns it, or it becomes a battery complaint of its own.

The format is kept: `6h 8m` stays, and no `Chronometer` is introduced (section 6 gives the reasoning the
owner accepted).
