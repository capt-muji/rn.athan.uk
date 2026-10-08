# Issue ledger

This file tracks only what is not yet fixed. An issue number is permanent and never reused. The
next free number is 45. Closed issues and their records live in git history.

| # | Issue |
| --- | --- |
| 10 | Alerts arrive late on ColorOS-family phones. This closes with #17 once a store release ships the fix. If lateness survives that release, the untried diagnostic is switching off the system-wide battery features on the 8T (Deep optimisation, Adaptive Battery, Sleep Standby Optimisation): they differ from the per-app toggle. Diagnostics only. |
| 17 | OEM battery policy windows exact alarms on some Android phones. The fix is on `uat`. What waits is a store release and one `dumpsys alarm` reading on an affected phone. The Android update flow has also never run its happy path on a phone: Play answers `ERROR_APP_NOT_OWNED` to a side-loaded build, so check it on the first build installed from Play. |
| 37 | The background task requires a network it never uses, so the patch `patches/expo-background-task+58.0.7.patch` stays until a published `expo-background-task` carries the option (detail: `ai/UPSTREAM-PRS.md`). |

## Rejected remedies, do not re-propose

- No microphone permission for ambient silence detection: refused for privacy.
- No in-app alarm observability module: `yarn check:device` is the observability.
- No notification library swap: another prayer app reported alerts four hours late even in alarm-clock mode (flutter_local_notifications #2369), so OEM policy can beat any library.
