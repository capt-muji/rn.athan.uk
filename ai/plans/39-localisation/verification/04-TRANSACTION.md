# Verification 04: language commit transaction

Independent adversarial verification that the scheduling code supports an all-or-nothing language
change: one `withSchedulingLock` acquisition, a persisted intent marker, deterministic OS identifiers
replacing in place, and no zero-alarm window. `commitLanguageSelection` does not exist yet, so the
claim is tested as feasibility against the existing machinery. Branch
`verify/39-localisation-deepseek-20261009` at `52109ec0`. No file was modified.

## Findings

### F1. The lock serialises, holds across await, and owns the rollback inside one acquisition. CONFIRMED.
`stores/notifications.ts:44-79`. `run = schedulingQueue.then(async () => { ... await operation() ... })`
and `schedulingQueue = run.then(() => undefined, () => undefined)`, so the queue stays fulfilled and
the next acquisition cannot start until the operation and its rollback return. Both commits hold the
whole try/catch/undo inside the callback (`commitSoundSelection` `:1716-1740`,
`commitPrayerAlertChange` `:1341-1371`). Minor: the `logger.info` at `:59` sits outside the `try`, so a
throwing logger skips the timeout-gate reopen in the `finally` at `:64-68`.

### F2. The copied commit shape cannot express "full success". CONTRADICTED.
`commitSoundSelection`'s `armEverything` (`:1717-1721`) awaits `_rescheduleAllNotifications` and
discards its `Promise<boolean>` at `:1720` and `:1732`. `_rescheduleAllNotifications` returns false on
the empty-cache bail (`:1604-1610`). Copied line for line, a language commit would report success and
clear its marker (R11 step 11) while nothing was re-armed. There is also no refusal propagation: a
refused day does not throw (`stores/notifications.ts:871-881`), so the catch that triggers the
rollback never fires and the commit returns true, with only per-prayer repair marks set
(`settlePrayerRepairMarks` `:1553-1573`, marks at `:1566-1568`). With the marker-clear rule, an
empty-cache offline commit silently no-ops and the divergence can persist until the next refresh
window.

### F3. Re-arm is schedule-first with no live cancel-then-schedule pass. CONFIRMED.
`_rescheduleAllNotifications` (`:1585-1668`) has no bulk cancel. The at-time path schedules then
cancels only non-attempted records (`:926-943`), the reminder path mirrors it (`:1114-1139`), and the
rule is documented at `:884-893` and `:1078-1085`. The only other cancels are for prayers already
`Off` (`:1396,1444`), which hold no live alarm. A language change alters no alert type, so every
prayer takes the schedule-first path and the stale set is empty. No zero-alarm window exists in the
re-arm itself.

### F4. Identifiers are byte-identical across re-arms, so locale cannot perturb them. CONFIRMED.
`device/notifications.ts:49-50` and `:61-66`. `englishName` is always the English constant from
`getPrayerArrays` (`stores/notifications.ts:151-157`), never translated. No
`cancelAllScheduledNotificationsAsync` exists in production code. Caveat: the "same identifier =
idempotent replace on both platforms" rule is asserted in a code comment (`device/notifications.ts:44-48`)
and every scheduler test mocks `scheduleNotificationAsync`, so the replace behaviour is taken on trust,
not device-verified.

### F5. The channel dedup caches cannot be invalidated from the app layer today. UNCERTAIN.
`shared/notifications.ts:431-437` holds `createdReminderChannels`, `createdAthanChannels` and
`extrasChannelCreated` as module-private `const`/`let` with no reset export. Their guards at `:447,478,496`
skip repeat `setNotificationChannelAsync` calls for the rest of the process, so renamed channels would
never land without new exported code. `updateAndroidChannel` (`device/notifications.ts:32-41`) covers
only the athan channels, and the reminder and extras channel names are hardcoded English
(`shared/notifications.ts:410,452,502`), so localising needs parameterisation. Same-id reuse itself is
code-supported and does not orphan user channels.

### F6. The language-wide marker has no repair path in current code. CONTRADICTED.
`preference_` survives both wipes (`stores/version.ts:144-156`, `stores/sync.ts:357-363`).
`refreshNotifications` runs on launch (`app/index.tsx:109,144`), foreground (`device/listeners.ts:50`)
and background (`device/tasks.ts:34-35`), and repairs per-prayer marks at
`stores/notifications.ts:1796-1809`. But `markedPrayers()` (`:449-456`) returns only the per-prayer
marks, so a language-wide marker is invisible to the repair pass, and R11's "marker forces the gate"
(proposed on `forceNotificationReschedule`, `stores/version.ts:194-201`) is unwritten. A crash between
a language marker write and the atom move has no committed repair path today.

### F7. A late-landing native call is not healed by the sweep. CONTRADICTED.
R11 line 101 claims the sweep removes any stray a late-landing native call left.
`withNativeTimeout` rejects at 15 seconds (`shared/notifications.ts:63-79`) but does not cancel the
call. `findStaleScheduledNotificationIds` filters OS identifiers absent from records
(`shared/notifications.ts:214-221`), and a late-landing call uses the same deterministic identifier,
which the failure path already recorded (`stores/notifications.ts:877,1071`). Same-identifier strays
are invisible to the sweep. This is not a zero-alarm window, but the sweep cannot heal the wrong-copy
case R11 assigns to it.

### F8. The widget re-push rides the reschedule and is deferred past paint. CONFIRMED.
`_rescheduleAllNotifications` calls `PrayerWidgets.refreshPrayerWidgets()` at `:1659-1663`, deferring
via `requestAnimationFrame` plus `setTimeout(0)` when `deferWidgetRefresh` is set (`:1646-1658`), which
`commitSoundSelection` passes (`:1720`). `readWidgetSettings` currently returns only `hijriDate`
(`stores/widget.ts:84-90`), so language entering the widget payload is new work, as R11 states.

## Break attempts

- A cancel-then-schedule pass contradicting "never zero alarms": none. Every cancel site was
  enumerated (`stores/notifications.ts:943,1139,1533,978,1173`), reachable only via `:1396,1444` for
  Off prayers. Live alarms are re-armed first. The attack fails.
- Empty-cache offline commit: alarms are neither armed nor cancelled, so the never-zero claim survives,
  but the commit silently no-ops and (F2) would clear its marker. Strongest hole.
- A second acquisition interleaving with the rollback: impossible, the rollback is in the queued
  callback (F1). A timed-out native call can still land later (F7).
- A crash between marker and atom move with no repair: real, F6.
- Android channel renames orphaning user settings: same ids are reused, so no orphan, but the rename
  is doc-sourced and not device-verified (F5).

## Better alternative and real cost

Two cheap changes close the real gaps. First, make `_rescheduleAllNotifications` report the empty-cache
bail and per-prayer refusals back to `armEverything` (return `{rescheduled, refused}` or treat false as
failure), so the language marker clears only when the pass actually ran. Second, implement the language
marker as a gate reopener beside the per-prayer marks, mirroring `forceNotificationReschedule`, so the
launch, foreground and background cycles repair it. Cost: one return-type change at
`stores/notifications.ts:1585`, one extra check in the commit, one marker atom plus its repair branch,
and a suite proving the empty-cache and refusal cases. This removes the silent false-success the
current copy would otherwise inherit.
