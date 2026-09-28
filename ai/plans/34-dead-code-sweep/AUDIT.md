# Audit: Session 34. Dead-code sweep

| Field | Value |
| --- | --- |
| Audited | 2026-09-28 |
| Range | `b990e26f..uat-2`, 9 step commits and their merges |
| Verdict | **PASS** |
| Pushed | yes, after this audit |

## 1. What was checked, and with what

| Check | How | Result |
| --- | --- | --- |
| The range holds only this session's work | `git log --oneline origin/uat-2..uat-2` | 9 step commits, 9 merges, nothing else |
| Versions run in sequence | the subject line of each step commit | 1.29.50 through 1.29.58, no gap, no repeat |
| Every commit's message describes its own change | read each subject and body | one was wrong and was corrected before merge; see finding 1 |
| No production behaviour changed | production bundle diff, both platforms | exactly 18 exported names removed, 0 added; see section 2 |
| The suite still proves what it proved | assertion-level diff of every test file | all 65 removed assertions accounted for; see section 3 |
| Coverage holds | the hook on every commit, then `yarn validate` | 100% statements, branches, functions and lines throughout |
| Every break still catches | each step's break script, re-run | 24 breaks across 7 steps, all caught |
| Owner rules | greps over the whole range | no prayer time, no release file, no EAS, no API key, no ignore comment |
| The app really runs | 3T (Android 9) and iPhone XS replica simulator | see section 4 |

## 2. The bundle proof: nothing a user can reach was removed

The strongest evidence available, taken at `b990e26f` before any deletion and again at `29d261a6`
after all of them, with `npx expo export:embed --dev false` for both platforms:

| Reading | iOS | Android |
| --- | --- | --- |
| Exported names before | 2503 | 2503 |
| Exported names after | 2485 | 2485 |
| Removed | 18 | 18 |
| **Added** | **0** | **0** |
| Bundle bytes | 3,912,303 to 3,906,453 (**-5,850**) | 3,909,226 to 3,903,429 (**-5,797**) |

The 18 are exactly the planned list. Nothing else left either bundle, and nothing entered it. Every
live look-alike was checked by name and is present in the shipped bundle: `clearPrefix`, both
`removeOneScheduled*`, `getMeasurementsList`, `setMeasurementsList`, `showAlertSheet`,
`hideSettingsSheet`, `useAnimationScale`, `standardDisplayDateAtom`, `alertSheetStateAtom`.

Before the sweep, each deleted symbol was confirmed to appear in the production bundle as a
DEFINITION with **zero call sites**, which is why removing them changes no behaviour. The four
`clearAllScheduled*` wrappers never appeared at all: Metro had already tree-shaken them, so they
cost users nothing even before this session, and their removal is purely a source-tree improvement.

**16 lines were added to production files in the entire session**, and every one was read:
nine are the chevron fix the owner approved, two correct a comment that named a deleted function,
three preserve the two load-bearing side effects, and two are the closing braces of the chevron's
animated style.

## 3. Every removed assertion is accounted for

110 `expect(` lines left the test files and 65 arrived. After normalising the two renames the plan
specified (`getDisplayDate` to `displayDateOf`, `getAlertSheetState` to a direct atom read, and
`getPerfRing` to the persisted-ring read), 65 assertions are genuinely gone. Each was traced:

| Count | Assertions | Why they go |
| --- | --- | --- |
| 10 | `expect(mod.didBootstrapFromCache).toBe(...)` | every one sat beside a `setSequence` or `startCountdowns` assertion that decides the same question, and those stay |
| 14 | the `unregisterBackgroundTask` and `getBackgroundTaskStatus` blocks | tested only the two deleted functions |
| 12 | the four `clearAllScheduled*` blocks | the `expect(...).toHaveLength(...)` lines are the verification halves INSIDE those describes, reached only through the deleted wrapper. The readers they used (`getAllScheduledNotificationsForPrayer` and the other three) are live and still covered by 4 to 5 tests each |
| 8 | `perfFlush` and the pre-init flush case | four only listed `perfFlush` among calls that must not throw while the monitor is off, and already assert no MMKV instance exists, which proves more; the pre-init case cannot be reached without a manual flush |
| 5 | `openAppSettings` and its two negative assertions | the symbol is gone; every `openDndAccessSettings` assertion is untouched |
| 5 | `getSecondsBetween`, `ISTIJABA_INDEX` | tested only the deleted constants |
| 4 | `loaded.provider` | replaced by assertions on the log line the module now writes, same four cases, same names |
| 4 | the `useAnimationOpacity` describe | tested only the deleted hook; every `useAnimationScale` assertion stays |
| 3 | the four ui.ts accessor tests | tested only the deleted accessors |

No assertion was weakened, and no test's premise was changed to make code pass. The reference suite
named in `__tests__/README.md` keeps its structure and every test name; only its read moved.

## 4. Device evidence

**OnePlus 3T, Android 9, the real hardware.** A release APK of the swept code was built through R8
minification, which re-resolves every symbol and fails on a dangling reference, and installed as
1.29.57. It launched clean, with no `FATAL` and no `AndroidRuntime` line.

The two riskiest deletions were verified by their logs, not by inference:

- `TLS13: first security provider { provider: 'GmsCore_OpenSSL' }`, so the TLS 1.3 install that
  Android 9 needs to reach the API at all still runs at import;
- `MMKV READ: prayer_2026-09-28` and its neighbours at import time, so the cache bootstrap still
  hydrates before React renders.

Both are the side effects whose exports were deleted, and both would have gone silently if the call
had been removed with the name. The home screen showed the Android widget rendering correctly
("DUHA", "18m", "01:53", "Mon"), the app drew its full prayer list with the countdown, the green
countdown bar, the active pill, the saved Sound bell on Asr and the "Dhuhr 1m ago" pill.
`dumpsys alarm` showed **21 future prayer alerts armed** plus the widget refresh chain.

**iPhone XS replica simulator, iOS 18.5.** Standard and Extras pages, the alert sheet opening with
the correct prayer name (the `getAlertSheetState` repoint proving itself), an alert changed to Sound
and committed with `alert_extra_duha` and `scheduled_notifications_extra_` confirmed written to
MMKV, the overlay with its veil and Arabic explanation, and a **day roll observed live**: the list
advanced Asr to Magrib keeping its passed rows, with the countdown reading 23h 58m for the next day.
That is `getDisplayDate`'s replacement under exactly the condition ISSUES #27 describes.

**Widgets on device were left to the owner** (owner, 2026-09-28). `widgetRuntimeLoads.test.ts` still
builds and evaluates the real widget bundle for both platforms and passes, and the 3T's home screen
showed a correct card, so the runtime and the Android push path are both proven.

## 5. Findings

**Finding 1: a commit carried the wrong message. Fixed before merge.**
`$TMPDIR` is `/var/folders/.../T/` while this harness writes to `/var/folders/.../T/opencode/`.
Step 1's message was written to the subdirectory and committed with the bare `$TMPDIR/msg-1.txt`,
which still held session 33's message from the previous day. `git commit -F` succeeded and the hook
passed, because the CONTENT was correct; only the message described different work at a version four
patches behind. Caught by reading the subject back. The message was amended, the content verified
byte-identical with `git diff`, `yarn validate` re-run green, and every stale `msg-*.txt` in the bare
`$TMPDIR` deleted so no later step could repeat it. Recorded in `LOG.md` as a durable lesson.

**Finding 2: the plan's predicted sweep counts were one too high from step 2 onward. Corrected.**
The inventory lists five symbols for step 2, so 27 - 5 = 22, where the step file said 23, and steps
3 to 5 inherited the drift. The DELETIONS always matched the inventory exactly; only the arithmetic
in the "Done when" lines was wrong. The step files now read 22, 19, 12 and 7, and each was confirmed
against the sweep's own output after the commit.

**Finding 3: anchor 4-4 could not express its span. Handled without guesswork.**
It holds the doc comment and signature of `unregisterBackgroundTask` only, so applying it left both
function bodies behind and `tsc` failed with `TS1128`. The plan's prose was right about the intent;
a 65-line span simply cannot live in an anchor file. Restored with `git checkout --`, then removed by
line range after asserting all three boundary lines by content. `tsc` was clean immediately after.
The same shape recurred for `StoredPrayer` and was handled the same way.

**Finding 4, found on the device and FIXED IN THIS AUDIT: `yarn check:device` failed on a healthy
phone.** It reported `extras_at_time MISSING — extras alerts would be dropped` and
`no prayer channels to inspect`. Both were false: the 3T carries `athan_1_v4` and
`extras_at_time_v3`, the current generation, both with a sound. A channel's sound, attributes and
importance are frozen at creation, so every fix ships a new id, and session 27 moved these to `_v4`
and `_v3` on 2026-09-26 without updating this script. It has been lying since then, and nothing
noticed, because a check that cries wolf gets read as noise. The greps now accept any generation
suffix. `yarn check:device` exits 0 on the swept build with every line PASS. Shipped as 1.29.58.

**Finding 5, not a defect: the update check logs a warning on a side-loaded build.**
`Failed to check for updates: ERROR_APP_NOT_OWNED`. A side-loaded APK is not owned through Play, so
the in-app update API declines by design. This is session 31's intended behaviour on a non-Play
install, and it is absent on a store build.

## 6. Verdict

**PASS.** The sweep removed 27 exported symbols, 6 private symbols they orphaned, and one 791-line
reference document nothing imported: 1,567 lines deleted against 404 added across the session. The
production bundle proves the change is invisible to users, losing exactly the 18 names that were
shipping dead weight and gaining nothing, while every live symbol stayed. The suite holds at 100% on
all four measures with every removed assertion accounted for, 24 break mutations all caught, and the
app verified running on both real Android 9 hardware and an iOS simulator, with the two load-bearing
side effects proven alive in the device log.

Two defects outside the sweep's scope were found and fixed on the way: the Help chevron's pivot,
which the owner reported and approved (1.29.50), and ISSUES #44's clock-dependent test (1.29.51).
One more was found during the audit itself and fixed here (1.29.58).

## 7. Final overlook, 2026-09-28, on the pushed commit

Run against `886ee92b` after the push, from a clean tree, to confirm nothing drifted:

| Check | Result |
| --- | --- |
| Tree clean, fully pushed, local equals `origin/uat-2` | yes, `886ee92b` both sides, 0 unpushed |
| Version lockstep across `app.json`, `package.json` and the gradle file | all three 1.29.59 |
| `yarn validate` | 176 suites, 4753 tests, 100% on all four measures |
| `tsc --noEmit` | no unresolved import anywhere |
| TODO, FIXME, XXX or HACK added | 0 |
| Commented-out code added | none; every added comment explains why |
| The standing guard, with a planted dead export | CAUGHT |
| Rows in flight in `ai/plans/README.md` | 0, and all 7 steps ticked |
| Row 18's blocker re-checked | `npm view expo dist-tags` still `latest: 57.0.25`, so row 35 is next |
| **Bundle rebuilt from the pushed code** | 2503 exported names before the session, 2485 now: **18 removed, 0 added** |
| 3T cold launch | 0 crashes, 77 alarms armed |

**One reading needed explaining rather than accepting.** The TLS log line counted 0 on the first
launch check, which would have meant the side effect had stopped running. It had not: that launch was
a RESUME, and the log window showed zero JS bundle loads, so no import-time code ran at all. Forcing a
genuine cold start produced `TLS13: first security provider { provider: 'GmsCore_OpenSSL' }`
immediately. A zero from a resume is not evidence of absence, and the check is only meaningful
against a cold process.

**Verdict unchanged: PASS.** The pushed code is byte-comparable to the audited code, the app runs on
device, and the guard is live for the next session.
