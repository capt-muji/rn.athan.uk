# LOG: ticket 122

## Ticket 122

The rewritten AVD and adb management in Expo CLI 58: evaluate for the Android
harness. Ruling taken 2026-10-16 in the row; this lane delivers the doc
correction only.

## Planning (2026-10-17)

- Facts re-measured in this lane before drafting (worktree lane-122 at
  1788e83c): @expo/cli 58.1.10 installed;
  AndroidDeviceManager.resolveFromNameAsync matches
  `devices.find((device)=>device.pid === query) ?? devices.find((device)=>device.name === query)`
  (serial first, name fallback); the miss error names both forms;
  `--binary` installs a prebuilt APK without gradle (runAndroidAsync.js:143-149)
  and `--no-bundler` skips Metro (run/android/index.js:81,109); the CLI help
  still prints "Device name to run the app on" (index.js:113).
- Queue row 133's ruling read: one bounded AVD lane adopted; its rules are
  row 133's to write, so this plan writes none.
- Frontier worked: D1 replace-not-delete the README bullet; D2 both files
  carry the corrected claim and the command, README alone adds the
  stale-help parenthetical; D3 one docs step; D4 verbatim replacement text;
  D5 union-max-plus-1 version command. All agent-ruled, recorded in PLAN.md
  section 2.1.
- Sibling lanes checked before any write: no lane/122 branch existed, no
  locks held, lane 120 (shared/notifications.ts, its plan folder) and lane
  126 (board/) disjoint from this lane's files.
- Skeleton committed; ticket set PLANNING.
