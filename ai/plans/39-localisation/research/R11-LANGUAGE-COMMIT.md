# R11. The language commit transaction (research agent report, 2026-10-09)

Dispatched by the owner's instruction. Every claim about the repo cites file:line at the working
tree. Design problem: when the user picks a new app language, the app must apply it as an
all-or-nothing transaction: UI re-render, notification re-arm (up to 64 armed OS requests whose
copy is frozen at schedule time), Android channel renames, widget timeline re-push (home and lock
screen), prayer-name width cache switch, MMKV preference write. No user cancel; the OS can still
kill the app mid-way; a half-applied state must never persist.

## A. The `commitLanguageSelection` sequence

The repo has already ruled on the shape: `ai/plans/39-localisation/CONSTRAINTS.md:30-32` names
`commitLanguageSelection`, built on `withSchedulingLock`, "modelled line for line on
`commitSoundSelection`".

**Before the lock (compute-once-from-arguments):**

1. The caller passes `selection` and `previousSelection` only. Every derived value (translated
   titles, channel names, width key) is computed from the argument, never re-read from an atom
   mid-commit. This is the `commitPrayerAlertChange` hazard: `requestCostReader`'s comment records
   that "a commit writes them before it takes the scheduling lock" so preferences "may already
   hold a LATER change's values" (`stores/notifications.ts:411-421`); `CONSTRAINTS.md:34-37`
   restates it as the corollary the plan must not miss.
2. Write a persisted intent marker under a `preference_`-prefixed key recording target and
   previous locale, BEFORE the language atom moves. Precedent: "The mark is written BEFORE the
   settings move, so a process death between the two still leaves something saying the bell and
   the alarms may disagree" (`stores/notifications.ts:1319-1321`), and `preference_` is the only
   prefix both cache wipes keep (`stores/notifications.ts:327-330`, `stores/version.ts:144-156`).

**Inside one `withSchedulingLock` acquisition** (the "one lock acquisition around the write, the
channel, the re-arm and the undo" rule, `stores/notifications.ts:1704-1706`; the queue never drops
or interleaves operations, `stores/notifications.ts:44-50, 55-79`):

3. `setLanguagePreference(selection)`: the MMKV write, through the atom.
4. Switch the prayer-name width cache to the new locale's key (or reset it). `CONSTRAINTS.md`
   rules it "keyed per locale, or reset on a language change", because `setEnglishWidth` accepts
   only widening values (`stores/ui.ts:216-231`, ISSUES #22 at `:218-222`) and
   `prayer_max_english_width_` survives both wipes (`stores/version.ts:155`), so a wide locale's
   column would otherwise persist forever.
5. Invalidate the session-scoped channel dedup caches: `createdReminderChannels`,
   `createdAthanChannels`, `extrasChannelCreated` (`shared/notifications.ts:431, 434, 437`). Their
   guards at `:447`, `:478`, `:496` otherwise skip `setNotificationChannelAsync` for the rest of
   the process, so renamed channels would never land.
6. Re-create the channels with the SAME ids and localised names, via the `updateAndroidChannel`
   shape (`device/notifications.ts:32-41`). The name format strings that carry copy: `Athan
   ${soundIndex + 1}` (`shared/notifications.ts:410`), `Extra Times` (`:452`), `${englishName} in
   ${intervalMinutes}m Reminder` (`:502`). Never mint new ids: R4 settled that a channel name can
   change in place and that new ids would orphan a user's hand-tuned channels
   (`ai/plans/39-localisation/R4-FINDINGS.md:7-30`).
7. Re-arm the whole plan through `_rescheduleAllNotifications` with the locale's string table
   feeding `genNotificationContent` (`${englishName} now`, `shared/notifications.ts:130`) and
   `genReminderNotificationContent` (`${englishName} in ${intervalMinutes}m`, `:181`).
   Deterministic identifiers (`device/notifications.ts:49-50, 61-66`) give same-id atomic replace
   on both platforms, so there is no cancel pass and no zero-alarm window (`R4-FINDINGS.md:32-45`;
   the schedule-first rule, `stores/notifications.ts:884-893`). Up to 64 requests against
   `NOTIFICATION_REQUEST_BUDGET` (`shared/notifications.ts:358`).
8. Widget re-push rides step 7: `_rescheduleAllNotifications` already calls
   `PrayerWidgets.refreshPrayerWidgets()`, deferred past the next paint on foreground paths
   because the timeline build saturates the JS thread about 0.5 s per schedule on an A12
   (`stores/notifications.ts:1639-1663`). Language must enter `readWidgetSettings`
   (`stores/widget.ts:84-90`) so the rebuild carries translated `nextName`, `dateLabel` and
   day-list rows (`shared/widgetTimeline.ts:179-194, 135`).

**On failure, inside the same acquisition:**

9. Run the whole thing again on `previousSelection` (write, width key, cache clear, channels,
   re-arm), exactly as `commitSoundSelection` re-runs `armEverything(previousSelection)`
   (`stores/notifications.ts:1727-1737`). The undo must never be a second acquisition: "anything
   enqueued meanwhile would otherwise run between the failure and the undo"
   (`stores/notifications.ts:1265-1267`).
10. If the rollback also fails, still write `setLanguagePreference(previousSelection)` so Settings
    names a language the user can see, and leave the marker for the next launch, foreground or
    background run (`stores/notifications.ts:1733-1736`; the repair-cycle precedent at
    `:1316-1318`).
11. Clear the marker only on full success (`:1359-1361` pattern, and the generation-guarded clear
    at `:402-409`).

**Truly atomic:** each of the 64 OS requests, individually, by identifier equality ("Same
identifier = idempotent replace on both platforms", `device/notifications.ts:44-48`); each channel
rename; the in-process ordering (no interleaved scheduling pass); the MMKV writes.

**Eventually consistent:** the batch as a whole (a mid-batch death leaves some requests on
new-locale copy, `CONSTRAINTS.md:25-28`); the UI re-render; the widget timelines per kind (pushes
are failure-tolerant because "widgets are a surface, not a critical path", `stores/widget.ts:163-165`);
channel renames across the set; the width measurement itself.

## B. Crash-window analysis

Detection mechanism: the persisted intent marker from step 2. Completion is idempotent because a
re-run with the same locale replaces every request in place and "a reschedule that finds nothing
to change leaves no gap" (`stores/version.ts:188-192`). Direction is forward, not backward: the
stored language is what the user already saw, the same ruling job 33 gave the athan
(`stores/notifications.ts:1734-1736`, `hooks/__tests__/useNotification.test.ts:485-489`).

| Dies right after | State left | Next launch observes | Healing |
| --- | --- | --- | --- |
| 2. Marker write | Marker only, locale atom still old | Marker names target, atom names previous | Completion pass runs the commit forward from the marker; converges either way because re-arming the old locale is also a no-op replace |
| 3. Locale atom write | UI in new locale, alarms and channels in old copy | Marker present, atom says new locale | Marker forces the gate (modeled on `forceNotificationReschedule`, `stores/version.ts:194-201`), next refresh re-arms under the new locale. On Android the cold launch already reopens the gate unconditionally (`stores/notifications.ts:1787-1792`) |
| 4. Width-key switch | Layout state only | Nothing wrong | Measurement re-runs; widen-only self-heals (`stores/ui.ts:218-226`) |
| 5. Cache clear + some channels renamed | Mixed channel names in system Settings | Alarms still fire; a channel's name never governed firing (`R4-FINDINGS.md:19-21`) | Re-creating an existing channel changes nothing (`shared/notifications.ts:470-473`), so the completion pass finishes the renames |
| 7. Mid-re-arm | Some of the 64 requests on new copy, rest on old, never zero | Marker present; records describe attempted ids | Full re-arm replaces every request in place; the sweep (`stores/notifications.ts:1499-1541`) removes any stray a late-landing native call left |
| 8. Widget push (deferred branch) | Widgets show old-locale names | Widgets stale until next push | Pushes happen on launch, foreground sync, reschedule and background task (`stores/widget.ts:19-22`); surface only |
| 11. Before marker clear | Everything new, marker stale | Completion pass re-runs, arms nothing new, clears marker | Idempotent by construction (`stores/version.ts:188-192`) |
| Native call never answers (process alive) | Promise pending | 15 s timeout rejects (`shared/notifications.ts:32, 63-79`) | Lock's finally reopens the refresh gate so the next foreground sweeps (`stores/notifications.ts:66-67`) |

## C. Progress-UI contract

What the user sees: the language sheet closes on selection, the UI re-renders off the atom, and
the commit runs behind the lock off the paint path. The repo's own discipline applies: the widget
push is deferred past the next paint because the timeline build stalls the JS thread
(`stores/notifications.ts:1640-1646`), and the width measurement must complete before the first
paint that uses it, "exactly as `InitialWidthMeasurement` already arranges"
(`CONSTRAINTS.md:134-136`). The hook answers the store's boolean verdict to the caller, as the
sound path does (`hooks/__tests__/useNotification.test.ts:501-520`).

Why no cancel is safe: cancel has no atomic semantics the completion pass does not already provide
more safely. A cancel mid-flight is precisely the zero-alarm window that schedule-first-then-
cancel-stale removed (issue #15, `stores/notifications.ts:160-165, 884-893`). Every step is
idempotent (same-id replace, same-id channel rename), so the next launch finishes the transaction
regardless of where death landed. And the OS can kill the app mid-commit anyway, so the design
must already survive abandonment; a cancel button would add a second interruption path with no new
guarantee.

Failure path: the commit returns false after the in-lock rollback (step 9). The sheet's selection
reverts and Settings keeps naming the previous language. If the rollback also failed, the stored
preference still names something real and the marker keeps the repair on the launch, foreground
and background cycle (`stores/notifications.ts:1316-1318, 1733-1737`).

## D. Existing test coverage versus new

Already covered, by suite:

- `stores/__tests__/notificationSoundCommit.test.ts:109-151`: the exact commit shape being copied.
  Channel created before arming (`:119`), rollback plus re-arm on refusal (`:128`), "never lets a
  queued pass see the athan it is about to throw away" (`:139`), stored value survives a failed
  rollback (`:151`).
- `stores/__tests__/notificationAlertCommit.test.ts:244-768`: arm and rollback across refusals,
  generation ownership between two changes (`:464-501`), repair marks kept for prayers a pass
  never looked at (`:503-534`).
- `stores/__tests__/notificationSchedulingLock.test.ts:205-371`: queue ordering behind a partial
  failure, the 15-second native timeout, queue survives a rejected operation.
- `stores/__tests__/notificationStaleCancelFailure.test.ts:167-186`,
  `notificationOffCancelFailure.test.ts:142-161`: refused cancels healed by the sweep and the next
  refresh.
- `stores/__tests__/notificationRefreshGate.test.ts`, `notificationGateRace.test.ts`,
  `notificationGateReopenFailure.test.ts:78-79`, `coldLaunchRearm.test.ts`: the gate machinery the
  marker hooks into.
- `stores/__tests__/version.test.ts`, `versionFailures.test.ts`: `forceNotificationReschedule` and
  the wipe keeps.
- `device/__tests__/androidChannelUpdate.test.ts`: same-id channel rewrite.
- `shared/__tests__/notifications.test.ts`: identifiers, stale diff, content builders.
- `shared/__tests__/widgetTimeline.test.ts`: payload guard at `:726`; `stores/__tests__/
  widgetIo.test.ts:83-227` push error tolerance; `stores/__tests__/widgetSettingsSync.test.ts`:
  the debounced settings subscription the language atom will mirror; `stores/__tests__/
  widgetAndroid.test.ts`.
- `stores/__tests__/ui.test.ts` and `components/ui/__tests__/InitialWidthMeasurement.test.tsx`:
  the widen-only width rules.

New work the feature needs:

- A `commitLanguageSelection` suite: translated-copy re-arm, channel rename in place on the same
  ids, dedup-cache invalidation, width-key switch, rollback including the double-failure, marker
  cleared only on full success.
- A crash-window suite: marker-driven completion from each death point in section B, proving
  idempotence.
- Locale-keyed width cache tests: per-key widen-only, no cross-locale leakage, no launch reflow
  regression.
- Per-locale payload runs of the widget guard, mandated by `CONSTRAINTS.md:60-63`.
- The extended widget contract guard: no layout imports the translation library
  (`CONSTRAINTS.md:70-74`).

## Assumptions

- The language preference will be an `atomWithStorage*` atom under a `preference_` key, since that
  prefix survives both wipes and every sibling preference uses it (`stores/version.ts:151`).
- The intent marker is one key holding target and previous, not per-prayer generations, because a
  locale change owns every prayer at once, unlike the per-prayer repair marks
  (`stores/notifications.ts:333-338`).
- UI re-render needs no extra machinery beyond the atom write; the widget settings subscription
  (`stores/widget.ts:139`) is the model for any locale-driven widget push outside the commit.
