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
- First commit hit lane weather: the pre-existing 2.0.969 collision (rows
  111 and 125, commits 3aee9f4d and 1788e83c) failed the version-uniqueness
  gate repo-wide. Attribution from git history: lane 126 authored the fix
  (5dc4b93d, allowlist entry) on branch fix/version-gate-969 at 03:37 and
  merged it into uat as 70684082 at 06:44; this lane fast-forwarded onto it
  and committed clean. No orchestrator commit involved.
- Grilled one round (cold griller, read-only): six findings, all adjudicated
  accepted. 1 must: the AGENTS.md anchor spans the Idle bullet plus the
  stale bullet, so the replacement contract now carries the Idle bullet
  verbatim first or replacing the anchor would delete a live rule. 2 should:
  R3.1 split to the executor's observable (`IN PROGRESS, step 1` at the step
  commit) and the DONE-cell check moved to section 8; done-when reworded to
  the executor's scope. 3 nice: runAndroidAsync citation corrected to
  143-150. 4 nice: the row edit now says to replace only the leading status
  token. 5 nice: the break script's porcelain filter widened to staged and
  untracked shapes. 6 nice with an amended bound: 40 sleep-15 cycles before
  BLOCKED, not 4, because one bump holds version.lock across its whole
  commit-and-merge cycle (minutes, this lane held it ten).
- Version note for the executor: the grill's dry run of the union command
  printed 2.0.976 (union grows while siblings land); any number the script
  prints is the free next patch.

### Step 01 — executed

- Branch `docs/122-device-lines` off `lane/122` at `ae7eeb18`; preflight
  `PREFLIGHT OK`; anchors readme-stale and agents-stale each counted 1.
- Queue row 122: leading status token replaced with `IN PROGRESS, step 1`,
  parenthetical and the `::` tail kept intact.
- Hand-run `yarn validate` before the commit, tail:
  `Test Suites: 221 passed, 221 total`
  `Tests:       2 skipped, 5737 passed, 5739 total`
  `Time:        46.88 s` / `Done in 49.72s.`
- Version: union-max-plus-1 under `version.lock` printed `2.0.979`; the
  pre-commit hook then refused it (`VERSION COLLISION 2.0.979:
  a08ee0ef270cd701e98d1d6d3178322091170bf3 staged`, lane 120's audit commit
  landed the same number in the interim; D5 predicted the hook re-refuses
  collisions). Recomputed under `version.lock`: `2.0.980`, written to
  `app.json` and `package.json`; lock released after each bump.

Step 1 done at 2.0.980: both stale --device passages replaced.
Red: "takes a device NAME" counted 1 in each file before the change;
"npx expo run:android --binary" counted 0 in each.
Green: stale gone (grep exit 1), new line counted 1 in each file,
serial-first line counted 1 in each file, no AVD string, yarn validate exit 0.
Break: ALL AS EXPECTED: 1. Hook output tail recorded above.

session: ses_eb7833f73ffekErM0yIZUM4RVl
