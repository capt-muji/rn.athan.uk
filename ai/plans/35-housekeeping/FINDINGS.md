# Session 35: what was measured, and what each item turned out to be

The row queued five items. Three were already closed by later work, one was real but with a
different cause than the row stated, and one had a root cause rather than the tuning knob the row
suggested. The owner then added a sixth, the back-press rule, as a new feature.

Every number below was measured in this session, in a scratch worktree at `uat-2` `052e25a6`.
Baseline before any change: **176 suites, 4753 tests, 100% on all four coverage measures.**

## (a) The accessibility fixes: mostly already done, five genuine gaps left

The findings were written on 2026-09-15 and are 13 days old, so every claim was re-measured against
today's tree rather than taken from the page. Most had already been fixed by sessions 5, 6 and 29:

| Findings claim | State today |
| --- | --- |
| The alert bell has no name, role or state | **Already fixed.** `components/prayer/Alert.tsx` carries a role, a label naming the prayer, its spoken state and a hint |
| The overlay's catchers are unlabelled | **Already fixed.** All four share one `Close prayer details` name, deliberately |
| The explanation box has no live region | **Already fixed.** `accessibilityLiveRegion='polite'` in `Explanation.tsx` |
| `Toggle` has no role or checked state | **Already fixed** (role `switch`, `checked`), but it had **no NAME** |
| `SegmentedControl` has no selected state | **Already fixed.** Role `radio` plus `selected` |
| `Stepper` is labelled only by its glyphs | **Already fixed.** Both arrows name their action and unit; the value reads itself |
| `Modal.tsx` lacks `accessibilityViewIsModal` | **Already fixed.** Also carries role `alert` |
| `Modal.tsx` has no back handler | **REAL.** Fixed this session, and extended into the owner's new rule below |
| `SoundItem` has no role or state | **REAL.** Fixed: role `radio`, `selected`, and its play button named |
| `LabeledToggle`'s switch has no name | **REAL.** Fixed: the setting's label now names the switch |
| `Update`'s buttons have no role | **REAL.** Fixed |
| The colour picker's controls have no names | **REAL.** Fixed: Cancel, Done, and Reset |
| An invisible Reset still reads to a screen reader | **REAL.** Fixed: hidden from the tree at the default colour |
| The launch spinner has no name | **REAL.** Fixed: role `progressbar`, named |
| The page dots have no name | **REAL, decided as hidden.** The pager already announces its page, so naming them would read the position twice |

**One change was made and reverted, because the tests caught it.** Making `LabeledToggle`'s ROW the
switch and hiding the inner `Toggle` broke 7 tests across two suites. Those tests encode a real
behavioural distinction this session nearly destroyed: pressing the LABEL toggles with **no**
haptic, pressing the SWITCH toggles **with** a medium haptic. The fix is to name the inner switch
instead, which React Native then collapses into one reachable element, verified by probe:
`type=View role=switch label=Show seconds accessible=true`.

**`allowFontScaling: false` is untouched**, being an owner decision rather than a fix.

## (b) Edge-to-edge: the row's premise is void on SDK 58

The row says to "drop `react-native-edge-to-edge` for RN's built-in `edgeToEdgeEnabled`", blocked on
an Android 10+ device. Both halves are now wrong:

- **There is no `edgeToEdgeEnabled` to move to.** `@expo/prebuild-config`'s `withEdgeToEdge.js`
  warns that it "is no longer available - Android 16 makes edge-to-edge mandatory" and tells the
  project to remove the key. The migration target does not exist.
- **The library is still doing real work.** It supplies the `Theme.EdgeToEdge` parent the app's
  `AppTheme` inherits, the `enforceNavigationBarContrast` attribute the app sets to `false`, and the
  `SystemBars` component used in `app/_layout.tsx` and `device/listeners.ts`. RN 0.88 exports no
  `SystemBars` of any kind (grep of `Libraries/` returns nothing).

So this is not a blocked step, it is a **cancelled** one. Removing the library would mean writing
its theme and its `SystemBars` API by hand to lose a dependency that works.

The hardware blocker is also gone, for the record: two Android 15 (API 35) AVDs exist,
`athan_test_avd` and `athan_tablet_avd`.

## (c) Finding 74: closed, and a DIFFERENT residual found in its place

Finding 74 said "a Suhoor wrapped onto the evening before gets the base window and loses a day of
buffer", written when the window was a day count. **That claim is closed**: measured on wrapped data
(Fajr `00:10`, so Suhoor fires `23:50` the previous evening), wrapped and unwrapped Suhoor are both
planned **64 days**, and both reach the same real-time span.

**But probing it found a real defect with another cause.** `collectCandidateRows` walks
`SCHEDULE_CANDIDATE_DAYS` days and drops rows already past. Those sit at the HEAD of the walk, so
the horizon must cover them on top of the days the budget pays for. `budget + 1` pays for one, which
is right for a row firing ON its list day. Midnight and Last Third fire the EVENING BEFORE their
list day, so once that evening's row passes there are **two**, and the walk ends one row short:

```
extra/Midnight    22h: past=2 / days=63     (every other hour: past=1 / days=64)
extra/Last Third  23h: past=2 / days=63
standard/Fajr     every hour: past=1 / days=64
```

Sweep to bound it: **10,300 samples**, 5 time shapes, every prayer on both lists, every 7th minute
of a day. Worst past-rows-at-head is **exactly 2, never 3**, so `+2` is sufficient and bounded.

**The request budget is NOT touched, and session 28's reminder arithmetic is unchanged.** Measured
at `+1` and `+2` across **216 scenarios** (costs 1, 2 and 3 x 3 shapes x 24 hours): both arm at most
**64** requests, and the worst-case user (all 11 rows, both reminders) stays at **63** with an
identical row set. Scanning further only lets a cheap user reach a day the budget had already paid
for; the cut still happens in `buildSchedulePlan`, untouched.

## (d) The audioMatrix timeout: a root cause, not a longer timeout

The row offers "a longer timeout or running it outside the hook". Neither is needed: the suite is
slow for a reason, and the reason is a one-line fix.

`mp3-duration` given a **path** does its own streaming file I/O; given a **buffer** it decodes in
memory. `audioMatrix.test.ts` passes paths; `athanDurations.test.ts` already passes buffers, which
is why only one of the two ever timed out.

| How the 67 reminder files are decoded | Time |
| --- | --- |
| By path (today) | **440 ms** |
| By buffer | **14 ms** |
| By buffer, in parallel | 10 ms |

**31x faster**, and the durations are bit-identical across all 67 files (compared one by one, zero
differing). A test that ran 440 ms unloaded and timed out at 10 s under load average 314 has ~23x of
headroom today; at 14 ms it has ~700x.

## (e) Leftover 3T notification channels: already clean

`deleteLegacyAndroidAudioChannels` already deletes every superseded generation on each init. Counted
on the phone from `dumpsys notification`: **3 live app channels** (`athan_1_v4`,
`extras_at_time_v3`, `reminder_asr_5_v3`) and **zero tombstones**. `reminders@1` in the raw dump
belongs to another app. Nothing to fix.

## (f) The owner's new rule, 2026-09-28: back closes what is open

Given during this session: every open surface closes on the Android back press, rather than letting
the press leave the app. The colour picker included, cancelling its change.

| Surface | State found | Action |
| --- | --- | --- |
| Sheets | Already correct (`Sheet.tsx`) | The pattern the rest copy |
| The colour picker | **Already correct**, and already tested ("discards the colour chosen when the picker is dismissed with the system back action"). RN's `Modal` routes back to `onRequestClose`, wired to `handleDismiss` | Verified from RN's Android source, then left alone |
| What's New, Help, Update | No handler; back left the app with the modal still drawn | Fixed in `Modal.tsx`, one optional `onRequestClose` |
| The overlay | No handler | Fixed, closing without the tap haptic, which only a finger earns |

**The update prompt's back press means Later, never Update**: an accidental gesture must not start a
download. Pinned by a test.

**Predictive back was the risk, and it is not one here.** This app targets SDK 36, where RN's own
comment says `onBackPressed()` is "disabled by default". Expo writes
`enableOnBackInvokedCallback="false"` unless `predictiveBackGestureEnabled` is set, which this
project does not set, so the app opts out and `BackHandler` fires normally. Confirmed in the APK
actually installed on the 3T:
`android:enableOnBackInvokedCallback(0x0101066c)=false`.
