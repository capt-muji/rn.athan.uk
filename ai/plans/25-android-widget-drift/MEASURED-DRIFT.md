# Session 25: what the drift actually is, measured, in plain minutes

This file exists because earlier sessions reported the drift in shorthand ("+6/+3/+1", "bounded 0-1")
that the owner could not interpret, and one of those numbers came from a different build. Everything
below is measured on the current shipped build, stated in minutes, with the method written down so it
can be repeated.

## How to read a drift number

The widget shows time remaining to the next prayer, rounded UP to the whole minute
(`ALabel` in `widgets/PrayerWidget.tsx`: `ceil((target - now) / 60000)`).

**Drift = what the widget shows, minus what it should show at that instant.**

- `+0` means the widget is exactly right.
- `+2` means the widget claims 2 more minutes remain than really do. It is showing an OLD value,
  so the prayer is NEARER than the widget admits. Always in this direction: the widget is never early.

Worked example, sample 1 below: at 07:01:06 the target was Dhuhr 12:57. True remaining was
5h 55m 54s, which rounds up to `5h 56m`. The widget said `5h 58m`. That is **+2 minutes**.

## The measurement

- Phone: OPPO Find X8, ColorOS 15 / Android 15, serial `G6RWBAQ4VKWWEAIZ`, app 1.28.21 (production).
- Three identical Athan widgets on the first home page, all counting to the same prayer.
- Sampler: `ai/plans/25-android-widget-drift/scripts/drift-sampler.sh`.
- **The screen is held OFF for the whole gap between samples**, then woken and read within ~3s.
  This matters: `ACTION_TIME_TICK` is only broadcast while the screen is on, so a sampler that left
  the screen on would trigger the very redraw whose absence is the bug, and measure nothing.
- True remaining is computed from the DEVICE clock read in the same second (the phones run seconds
  off this Mac, so host time cannot be used).

## Results, 3-minute sampling, screen off between reads

| Read at | Target | Widget showed | Should have shown | Drift |
| --- | --- | --- | --- | --- |
| 07:01:06 | Dhuhr 12:57 | `5h 58m` ×3 | `5h 56m` | **+2 min** |
| 07:04:12 | Dhuhr 12:57 | `5h 53m` ×3 | `5h 53m` | +0 |
| 07:07:20 | Dhuhr 12:57 | `5h 51m` ×3 | `5h 50m` | **+1 min** |
| 07:10:26 | Dhuhr 12:57 | `5h 48m` ×3 | `5h 47m` | **+1 min** |
| 07:13:33 | Dhuhr 12:57 | `5h 44m` ×3 | `5h 44m` | +0 |

**Worst case observed in this window: +2 minutes. Typical: 0 to +1.**

All three widgets always showed the SAME value. That is a change from the 2026-09-26 00:11 reading on
the OLD build (1.27.384), where three widgets disagreed with each other by +6, +3 and +1. Widgets
disagreeing means they last rendered at different moments; widgets agreeing means they now render
together and the remaining error is shared. So the 1.28.21 work did help, and this is what "it
improved" means concretely.

### The owner's original report is NOT reproduced at that magnitude

The owner reported 20 to 24 minutes late on the old build. Nothing in this window approaches that.
Two honest possibilities, not yet separated:

1. The 1.28.21 changes reduced the worst case from ~24 min to ~2 min.
2. The 20-24 minute case needs conditions not present here (longer idle, deeper doze, discharging
   rather than charging, or the app process being killed outright).

The phone is on charge for this measurement, which keeps the device `ACTIVE` rather than dozing.
**A discharging, long-idle phone is the untested worse case and is recorded as an open risk.**

## Why the drift happens: the delivery gate, not the alarm

Earlier sessions blamed the alarm, then Glance's session model. Both were wrong. The alarm is
healthy and Glance composes fine. The failure is in DELIVERY to the launcher.

Measured from `logcat` on the X8, screen off:

```
AppWidgetServiceImpl: scheduleNotifyUpdateAppWidgetLocked, widget is not ready,
  widget: AppWidgetId{53:...com.mugtaba.athan.PrayerWidgetProvider}
  widget.host.callbacks: null
```

Counted over one capture window:

| Event | Count |
| --- | --- |
| `widget is not ready` (update DEFERRED) | **58** |
| `updateViews:` (update DELIVERED to launcher) | **3** |

`widget.host.callbacks: null` is the launcher having torn down its host callbacks while the screen is
off. The system accepts our update, finds nobody listening, and defers it. So the composed RemoteViews
never reach the launcher until the launcher comes back.

This also explains the shape of the data: the drift is small and self-correcting rather than unbounded,
because the moment the screen comes on the pending update lands.

### Supporting evidence: the alarm is late too, but that is secondary

ColorOS widens our exact alarm's window once the screen goes off. Same code on both phones:

| | OnePlus 3T (Android 9) | Find X8 (ColorOS 15) |
| --- | --- | --- |
| `window=` on our alarm | **0** (exact) | **19,170 to 41,007 ms** |
| Fires per target edge | on the edge | 5 to 40 s late |
| Fire ratio | 410 alarms / 410 wakeups | 355 alarms / 355 wakeups |

Measured fire times against their `:00.500` targets: +16.7s, +21.6s, +27.9s, +23.2s, +13.0s, +34.4s.

Two facts prove ColorOS is patching AlarmManager rather than this being ordinary AOSP behaviour:

1. The dump shows `exactAllowReason=policy_permission` AND `window=+37s458ms` on the SAME alarm.
   In AOSP those are mutually exclusive: `setExactAndAllowWhileIdle` passes `WINDOW_EXACT = 0` and
   `setImpl` never widens a zero window.
2. `logcat` carries `OplusAlarmAdjustment: MSG_SCREEN_OFF` / `MSG_SCREEN_ON`, an OEM class that
   adjusts alarms on screen transitions.

Crucially, late firing ALONE does not produce a wrong number, because the label is minute-ceil: a
render at :17 past the edge still yields the same `ceil` value as a render at :00.5. Lateness only
matters when it pushes the render past the NEXT edge, or when it combines with the deferral above.

## What is already ruled out, with the evidence

| Theory | Verdict | Evidence |
| --- | --- | --- |
| Alarm not firing / chain dead | **Ruled out** | 355 alarms : 355 wakeups on X8, 410:410 on 3T |
| App force-stopped by OEM | **Ruled out** | `stopped=false`, pid alive across every sample |
| Doze whitelist / standby bucket / exact-alarm permission missing | **Ruled out, already granted** | doze whitelist contains the app; bucket 5 (EXEMPTED); `USE_EXACT_ALARM: granted=true` |
| `app_standby` policy deferring the alarm | **Ruled out** | `policyWhenElapsed` values are NEGATIVE, i.e. floors in the past, imposing nothing |
| Broadcast queue backlog | **Ruled out** | dispatch 1 to 25 ms, `enqueueClockTime` to `finishTime` |
| Missing `FLAG_RECEIVER_FOREGROUND` | **Ruled out** | dispatch already 1-25 ms; nothing to speed up |
| Glance never composes when no session runs (`wasOpen=false`) | **Ruled out** | `Session._isOpen` initialises TRUE (bytecode); `wasOpen=false` is the normal post-timeout exit log; `WM-WorkerWrapper: Worker result SUCCESS` for every widget; a Samsung Health control on the same phone shows `startSession` then `UI tree updated` with `wasRunning == false` |
| Stale snapshot data | **Ruled out** | snapshot stores absolute epochs; render re-picks the next future epoch every time |

## The remaining, real defect in our own code

`ACTION_TIME_TICK` is the one minute signal ColorOS does NOT defer: the system's own TIME_TICK alarm
carries `windowLength 0` with `exactAllowReason=allow-listed`, and it is verifiably delivered with the
screen off (an OEM receiver, `OplusDisplayBrightnessBroadcastReceiver`, logs receipt every minute
while the screen is off).

Our `WidgetRefreshTickListener` exists to ride exactly that signal. **On the X8 it is not registered.**

```
dumpsys activity broadcasts:
  app=12427:com.mugtaba.athan #receivers=4
    LOW_POWER_STANDBY_ENABLED_CHANGED
    LIGHT_DEVICE_IDLE_MODE_CHANGED
    DEVICE_IDLE_MODE_CHANGED
    RINGER_MODE_CHANGED        <- expo-av's
  (no TIME_TICK)
```

62 registrations for `TIME_TICK` exist on the phone; none is ours. Cause: `ensureRegistered` is only
reachable from `armWidgetRefreshChain`, which is only called from `refreshPrayerWidgets`, which is
gated behind a JS data push. So registration is a side effect of pushing data and dies with every
process restart, meaning the one deferral-immune layer is absent precisely when it is needed.
